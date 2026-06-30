// src/lib/operations-service.ts

import { ref, push, set, get, update, remove } from "firebase/database"
import { db } from "./firebase"

// ── Types ─────────────────────────────────────────

export interface Warehouse {
  id: string
  name: string
  code: string
  address: string
  description: string
  createdAt: string
}

export interface WarehouseStock {
  productId: string
  warehouseId: string
  stock: number
  section: string
  rack: string
  updatedAt: string
}

export interface StockTransferItem {
  productId: string
  productName: string
  quantity: number
}

export interface Signature {
  signedBy: string
  signedByName: string
  signedAt: string
}

export interface StockTransfer {
  id: string
  transferNumber: string
  fromWarehouseId: string
  toWarehouseId: string
  items: StockTransferItem[]
  status: "pending" | "signed_sender" | "signed_receiver" | "completed" | "cancelled"
  senderSignature?: Signature
  receiverSignature?: Signature
  createdAt: string
  createdBy: string
}

export interface AuditLog {
  id: string
  userId: string
  userEmail: string
  userName: string
  module: string
  action: "CREATE" | "UPDATE" | "DELETE" | "TRANSFER" | "SIGN" | "SYSTEM"
  details: string
  timestamp: string
}

// Helper: Get user context if available (fallback otherwise)
function getCurrentUserMeta() {
  try {
    // We can try retrieving the user info stored locally or from session
    // If running in a context where user is passed or resolved, use it
    return {
      userId: "unknown",
      userEmail: "unknown",
      userName: "System"
    }
  } catch {
    return {
      userId: "unknown",
      userEmail: "unknown",
      userName: "System"
    }
  }
}

// ── Audit Log Service ──────────────────────────────

export class AuditLogService {
  static async logAction(
    userId: string,
    userEmail: string,
    userName: string,
    module: string,
    action: AuditLog["action"],
    details: string
  ) {
    try {
      const newRef = push(ref(db, "auditLogs"))
      const logEntry: AuditLog = {
        id: newRef.key || Math.random().toString(),
        userId: userId || "unknown",
        userEmail: userEmail || "unknown",
        userName: userName || "System",
        module,
        action,
        details,
        timestamp: new Date().toISOString()
      }
      await set(newRef, logEntry)
    } catch (err) {
      console.error("Failed to write audit log:", err)
    }
  }

  static async getLogs(): Promise<AuditLog[]> {
    const snapshot = await get(ref(db, "auditLogs"))
    if (!snapshot.exists()) return []
    return Object.values(snapshot.val()) as AuditLog[]
  }
}

// ── Warehouse Service ─────────────────────────────

export class WarehouseService {
  static async createWarehouse(
    name: string,
    code: string,
    address: string,
    description: string,
    actor: { id: string; email: string; name: string }
  ): Promise<string> {
    const newRef = push(ref(db, "warehouses"))
    const id = newRef.key!
    const warehouse: Warehouse = {
      id,
      name,
      code,
      address,
      description,
      createdAt: new Date().toISOString()
    }
    await set(newRef, warehouse)

    await AuditLogService.logAction(
      actor.id,
      actor.email,
      actor.name,
      "Warehouses",
      "CREATE",
      `Created warehouse: ${name} (${code})`
    )

    return id
  }

  static async getWarehouses(): Promise<Warehouse[]> {
    const snapshot = await get(ref(db, "warehouses"))
    if (!snapshot.exists()) return []
    return Object.values(snapshot.val()) as Warehouse[]
  }

  static async getWarehouseStocks(): Promise<WarehouseStock[]> {
    const snapshot = await get(ref(db, "warehouseStocks"))
    if (!snapshot.exists()) return []
    return Object.values(snapshot.val()) as WarehouseStock[]
  }

  static async updateStockLayout(
    productId: string,
    warehouseId: string,
    section: string,
    rack: string,
    actor: { id: string; email: string; name: string }
  ) {
    const key = `${productId}_${warehouseId}`
    const stockRef = ref(db, `warehouseStocks/${key}`)
    const snapshot = await get(stockRef)

    let currentStock = 0
    if (snapshot.exists()) {
      currentStock = snapshot.val().stock || 0
    }

    const entry: WarehouseStock = {
      productId,
      warehouseId,
      stock: currentStock,
      section,
      rack,
      updatedAt: new Date().toISOString()
    }

    await set(stockRef, entry)

    await AuditLogService.logAction(
      actor.id,
      actor.email,
      actor.name,
      "Inventory Locations",
      "UPDATE",
      `Updated layout coordinates for Product ID: ${productId} at Warehouse ID: ${warehouseId} to Section: ${section}, Rack: ${rack}`
    )
  }

  // Adjusts the stock at a warehouse and triggers sync to global product stock
  static async adjustWarehouseStock(
    productId: string,
    warehouseId: string,
    delta: number,
    section = "",
    rack = "",
    actor: { id: string; email: string; name: string }
  ) {
    const key = `${productId}_${warehouseId}`
    const stockRef = ref(db, `warehouseStocks/${key}`)
    const snapshot = await get(stockRef)

    let currentStock = 0
    let currentSection = section
    let currentRack = rack

    if (snapshot.exists()) {
      const data = snapshot.val() as WarehouseStock
      currentStock = data.stock || 0
      if (!section) currentSection = data.section || ""
      if (!rack) currentRack = data.rack || ""
    }

    const newStock = Math.max(0, currentStock + delta)

    await set(stockRef, {
      productId,
      warehouseId,
      stock: newStock,
      section: currentSection,
      rack: currentRack,
      updatedAt: new Date().toISOString()
    })

    // Sync total product stock
    await this.syncGlobalProductStock(productId)

    await AuditLogService.logAction(
      actor.id,
      actor.email,
      actor.name,
      "Warehouse Stock",
      "UPDATE",
      `Adjusted stock for Product ID: ${productId} at Warehouse ID: ${warehouseId} by ${delta > 0 ? "+" : ""}${delta} (New Stock: ${newStock})`
    )
  }

  // Re-calculates and updates the global product stock as the sum of all warehouse stocks
  static async syncGlobalProductStock(productId: string) {
    const stocksSnapshot = await get(ref(db, "warehouseStocks"))
    let totalStock = 0

    if (stocksSnapshot.exists()) {
      const allStocks = Object.values(stocksSnapshot.val()) as WarehouseStock[]
      totalStock = allStocks
        .filter(s => s.productId === productId)
        .reduce((sum, s) => sum + (s.stock || 0), 0)
    }

    // Update global products path
    const productRef = ref(db, `products/${productId}`)
    const prodSnap = await get(productRef)
    if (prodSnap.exists()) {
      await update(productRef, {
        stock: totalStock,
        updatedAt: new Date().toISOString()
      })
    }
  }
}

// ── Stock Transfer Service ─────────────────────────

export class StockTransferService {
  static async createTransfer(
    fromWarehouseId: string,
    toWarehouseId: string,
    items: StockTransferItem[],
    actor: { id: string; email: string; name: string }
  ): Promise<string> {
    const newRef = push(ref(db, "stockTransfers"))
    const id = newRef.key!
    
    // Generate transfer number (e.g. TR-2026-0001)
    const timestamp = Date.now().toString().slice(-4)
    const transferNumber = `TR-${new Date().getFullYear()}-${timestamp}`

    const transfer: StockTransfer = {
      id,
      transferNumber,
      fromWarehouseId,
      toWarehouseId,
      items,
      status: "pending",
      createdAt: new Date().toISOString(),
      createdBy: actor.id
    }

    await set(newRef, transfer)

    await AuditLogService.logAction(
      actor.id,
      actor.email,
      actor.name,
      "Stock Transfers",
      "CREATE",
      `Created stock transfer ${transferNumber} from Warehouse ID: ${fromWarehouseId} to ${toWarehouseId}`
    )

    return id
  }

  static async signTransferSender(
    transferId: string,
    actor: { id: string; email: string; name: string }
  ) {
    const transferRef = ref(db, `stockTransfers/${transferId}`)
    const snap = await get(transferRef)
    if (!snap.exists()) throw new Error("Transfer not found")

    const transfer = snap.val() as StockTransfer
    if (transfer.status !== "pending") throw new Error("Transfer is not in pending state")

    const signature: Signature = {
      signedBy: actor.id,
      signedByName: actor.name,
      signedAt: new Date().toISOString()
    }

    await update(transferRef, {
      status: "signed_sender",
      senderSignature: signature
    })

    await AuditLogService.logAction(
      actor.id,
      actor.email,
      actor.name,
      "Stock Transfers",
      "SIGN",
      `Signed transfer ${transfer.transferNumber} as Sender`
    )
  }

  static async signTransferReceiver(
    transferId: string,
    actor: { id: string; email: string; name: string }
  ) {
    const transferRef = ref(db, `stockTransfers/${transferId}`)
    const snap = await get(transferRef)
    if (!snap.exists()) throw new Error("Transfer not found")

    const transfer = snap.val() as StockTransfer
    if (transfer.status !== "signed_sender") {
      throw new Error("Transfer must be signed by Sender first")
    }

    const signature: Signature = {
      signedBy: actor.id,
      signedByName: actor.name,
      signedAt: new Date().toISOString()
    }

    // Double-signoff completed -> execute inventory adjustments!
    for (const item of transfer.items) {
      // Deduct from source warehouse
      await WarehouseService.adjustWarehouseStock(
        item.productId,
        transfer.fromWarehouseId,
        -item.quantity,
        "",
        "",
        actor
      )
      // Add to target warehouse
      await WarehouseService.adjustWarehouseStock(
        item.productId,
        transfer.toWarehouseId,
        item.quantity,
        "",
        "",
        actor
      )
    }

    await update(transferRef, {
      status: "completed",
      receiverSignature: signature
    })

    await AuditLogService.logAction(
      actor.id,
      actor.email,
      actor.name,
      "Stock Transfers",
      "SIGN",
      `Completed double-signoff and executed transfer ${transfer.transferNumber}`
    )
  }

  static async cancelTransfer(
    transferId: string,
    actor: { id: string; email: string; name: string }
  ) {
    const transferRef = ref(db, `stockTransfers/${transferId}`)
    const snap = await get(transferRef)
    if (!snap.exists()) throw new Error("Transfer not found")

    const transfer = snap.val() as StockTransfer
    if (transfer.status === "completed" || transfer.status === "cancelled") {
      throw new Error("Transfer already processed")
    }

    await update(transferRef, {
      status: "cancelled"
    })

    await AuditLogService.logAction(
      actor.id,
      actor.email,
      actor.name,
      "Stock Transfers",
      "UPDATE",
      `Cancelled transfer ${transfer.transferNumber}`
    )
  }

  static async getTransfers(): Promise<StockTransfer[]> {
    const snapshot = await get(ref(db, "stockTransfers"))
    if (!snapshot.exists()) return []
    return Object.values(snapshot.val()) as StockTransfer[]
  }
}
