"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Eye, Package, Building2,
  Phone, DollarSign, FileText, Gift, CreditCard, Banknote, Smartphone,
  User, Loader2, X, ChevronDown, CheckCircle2, Zap, Percent,
  TrendingDown, ClipboardList, History, ArrowRight
} from "lucide-react"
import {
  ProductService, SupplierService, PurchaseService, SupplierCreditService,
  type Product, type Supplier, type Purchase
} from "@/lib/firebase-services"
import { SupplierInvoiceCounterService } from "@/lib/supplier-invoice-counter-service"
import { useToast } from "@/hooks/use-toast"
import html2canvas from 'html2canvas'
import { usePurchase } from "@/contexts/PurchaseContext"
import {
  SupplierInvoiceModal, generateSupplierInvoiceHTML,
  type SupplierInvoiceData
} from "./modules/purchasing/supplier-invoice-modal"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date: Date) => {
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${m}/${d}/${date.getFullYear()}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseCartItem {
  id: string; name: string; code: string; unitPrice: number; quantity: number
  discount: number; finalPrice: number; availableStock: number
  tradeDiscountQuantity?: number; tradeDiscountFreeItems?: number
  fabricType?: string; size?: string; individualPrices?: number[]; totalAmount?: number
}

interface PurchasingModuleProps { defaultTab?: "purchase" | "history" }

// ─── ProductRow ───────────────────────────────────────────────────────────────

function ProductRow({ product, quantity, onAdd, onRemove }: {
  product: Product; quantity: number; onAdd: () => void; onRemove: () => void
}) {
  const inCart = quantity > 0
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 transition-all group
      ${inCart ? 'bg-amber-500/8' : 'hover:bg-white/4'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
        ${inCart ? 'bg-amber-500/20' : 'bg-white/8 group-hover:bg-white/12'}`}>
        <Package className={`w-3.5 h-3.5 ${inCart ? 'text-amber-400' : 'text-white/50'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate leading-tight ${inCart ? 'text-white' : 'text-white/80'}`}>{product.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-white/40 font-mono">{product.code}</span>
          {product.size && <span className="text-[10px] text-white/30">· {product.size}</span>}
          <span className="text-[10px] text-white/30">· {product.stock} yds</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-bold text-amber-400">Rs {product.purchaseCost.toLocaleString()}</span>
        <div className="flex items-center gap-1">
          <button onClick={onRemove} disabled={quantity === 0}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-0 transition-all">
            <Minus className="w-2.5 h-2.5" />
          </button>
          <span className={`w-5 text-center text-xs font-bold tabular-nums
            ${inCart ? 'text-amber-400' : 'text-white/30'}`}>{quantity}</span>
          <button onClick={onAdd}
            className="w-5 h-5 rounded flex items-center justify-center text-white/40 hover:text-amber-400 hover:bg-amber-400/10 transition-all">
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CartRow ──────────────────────────────────────────────────────────────────

function PurchaseCartRow({ item, onQtyChange, onQtyInput, onPriceChange, onFreeChange, onRemove }: {
  item: PurchaseCartItem
  onQtyChange: (delta: number) => void
  onQtyInput: (val: string) => void
  onPriceChange: (price: number) => void
  onFreeChange: (free: number) => void
  onRemove: () => void
}) {
  const lineTotal = item.totalAmount || item.unitPrice * item.quantity

  return (
    <div className="px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
      <div className="flex items-start gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Package className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-foreground">{item.name}</span>
            <span className="text-[10px] text-muted-foreground bg-muted rounded px-1">{item.code}</span>
            {(item.tradeDiscountFreeItems || 0) > 0 && (
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded px-1 flex items-center gap-0.5">
                <Gift className="w-2.5 h-2.5" />{item.tradeDiscountFreeItems} free
              </span>
            )}
          </div>
          {item.size && <p className="text-[10px] text-muted-foreground mt-0.5">Size {item.size}</p>}
        </div>
        <button onClick={onRemove}
          className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 ml-8">
        {/* Qty */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">Qty (yds)</p>
          <div className="flex items-center gap-0.5">
            <button onClick={() => onQtyChange(-1)}
              className="w-5 h-5 rounded border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
              <Minus className="w-2 h-2" />
            </button>
            <Input type="number" step="0.01" min="0" value={item.quantity || ""}
              onChange={e => onQtyInput(e.target.value)}
              onFocus={e => { if (e.target.value === "0") e.target.value = "" }}
              onBlur={e => { if (!e.target.value) e.target.value = "0" }}
              className="h-5 w-12 text-center text-[11px] px-1 border-border/60 rounded [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            <button onClick={() => onQtyChange(1)}
              className="w-5 h-5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white transition-colors">
              <Plus className="w-2 h-2" />
            </button>
          </div>
        </div>

        {/* Price */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">Price (Rs)</p>
          <Input type="number" step="0.01" min="0" value={item.unitPrice || ""}
            onChange={e => onPriceChange(parseFloat(e.target.value) || 0)}
            onFocus={e => { if (e.target.value === "0") e.target.value = "" }}
            onBlur={e => { if (!e.target.value) e.target.value = "0" }}
            className="h-5 text-[11px] px-1.5 border-border/60 rounded [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
        </div>

        {/* Free */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">Free (TD)</p>
          <div className="flex items-center gap-0.5">
            <button onClick={() => onFreeChange(Math.max(0, (item.tradeDiscountFreeItems || 0) - 1))}
              className="w-5 h-5 rounded border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
              <Minus className="w-2 h-2" />
            </button>
            <Input type="number" step="0.01" min="0" value={item.tradeDiscountFreeItems || ""} placeholder="0"
              onChange={e => onFreeChange(parseFloat(e.target.value) || 0)}
              onFocus={e => { if (e.target.value === "0") e.target.value = "" }}
              onBlur={e => { if (!e.target.value) e.target.value = "0" }}
              className="h-5 w-10 text-center text-[11px] px-1 border-border/60 rounded [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            <button onClick={() => onFreeChange((item.tradeDiscountFreeItems || 0) + 1)}
              className="w-5 h-5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white transition-colors">
              <Plus className="w-2 h-2" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 ml-8 pt-1.5 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground">Rs {item.unitPrice.toFixed(2)} × {item.quantity} yds</span>
        <span className="text-xs font-bold text-foreground">Rs {lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function PurchasingModule({ defaultTab = "purchase" }: PurchasingModuleProps = {}) {
  const {
    cart, supplierId, supplierName, supplierPhone, supplierAddress,
    paymentMethod, partialPaymentAmount, staffMember, cartDiscount, cartDiscountPercentage, searchTerm,
    addToCart: contextAddToCart, setSupplierId, setSupplierName, setSupplierPhone, setSupplierAddress,
    setPaymentMethod, setPartialPaymentAmount, setStaffMember, setCartDiscount,
    setCartDiscountPercentage, setUseCredit, setCreditAmount, setSearchTerm, clearCart, resetForm
  } = usePurchase()

  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)
  const { toast } = useToast()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false)
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState("")
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState("all")
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [pricingItem, setPricingItem] = useState<PurchaseCartItem | null>(null)
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("")
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(-1)
  const [supplierCredits, setSupplierCredits] = useState<{ [supplierId: string]: number }>({})
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [lastPurchaseData, setLastPurchaseData] = useState<SupplierInvoiceData | null>(null)
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)

  const filteredSuppliers = suppliers.filter(s =>
    (s.name || '').toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    (s.phone || '').toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    (s.address || '').toLowerCase().includes(supplierSearchTerm.toLowerCase())
  )

  const loadSupplierCredits = async () => {
    try {
      const { SupplierCreditService } = await import("@/lib/firebase-services")
      const creditsData = await SupplierCreditService.getAll<{ supplierId: string; status: string; remainingAmount?: number }>("supplierCredits")
      const bySupplier: { [id: string]: number } = {}
      creditsData.forEach(c => { if (c.status === "active") bySupplier[c.supplierId] = (bySupplier[c.supplierId] || 0) + (c.remainingAmount || 0) })
      setSupplierCredits(bySupplier)
    } catch { }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([ProductService.getAllProducts(), SupplierService.getAllSuppliers()])
        const unique = p.filter((x, i, arr) => i === arr.findIndex(a => a.id === x.id))
        setProducts(unique); setSuppliers(s); setLoading(false)
      } catch {
        toast({ title: "Error", description: "Failed to load data.", variant: "destructive" })
        setLoading(false)
      }
    }
    load(); loadSupplierCredits()
  }, [toast])

  useEffect(() => {
    if (supplierId) { setCreditAmount(0); setUseCredit(false) }
    else { setCreditAmount(0); setUseCredit(false) }
  }, [supplierId, supplierCredits, setCreditAmount, setUseCredit])

  useEffect(() => {
    const loadHistory = async () => {
      setPurchaseHistoryLoading(true)
      try { setPurchases(await PurchaseService.getAllPurchases()) }
      catch { toast({ title: "Error", description: "Failed to load purchase history.", variant: "destructive" }) }
      finally { setPurchaseHistoryLoading(false) }
    }
    loadHistory()
  }, [toast])

  const filteredProducts = products.filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ── Cart helpers ─────────────────────────────────────────────────────────

  const syncCart = (updated: PurchaseCartItem[]) => { clearCart(); updated.forEach(i => contextAddToCart(i)) }

  const recalcDiscount = (updated: PurchaseCartItem[]) => {
    if (cartDiscountPercentage > 0) {
      const ns = updated.reduce((s, i) => s + (i.individualPrices?.length ? i.individualPrices.reduce((a, b) => a + b, 0) : (i.totalAmount || i.unitPrice * i.quantity)), 0)
      setCartDiscount(Math.round((ns * cartDiscountPercentage) / 100))
    }
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(i => i.id === product.id)
    let updated: PurchaseCartItem[]
    if (existing) {
      updated = cart.map(i => i.id === product.id
        ? { ...i, quantity: i.quantity + 1, finalPrice: (i.quantity + 1) * i.unitPrice, individualPrices: [...(i.individualPrices || []), product.purchaseCost], totalAmount: (i.totalAmount || 0) + product.purchaseCost }
        : i)
    } else {
      updated = [...cart, { id: product.id, name: product.name, code: product.code, unitPrice: product.purchaseCost, quantity: 1, discount: 0, finalPrice: product.purchaseCost, availableStock: product.stock, fabricType: product.fabricType, size: product.size, individualPrices: [product.purchaseCost], totalAmount: product.purchaseCost }]
    }
    syncCart(updated); recalcDiscount(updated)
  }

  const removeFromCart = (id: string) => {
    const updated = cart.filter(i => i.id !== id); syncCart(updated)
    if (!updated.length) { setCartDiscount(0); setCartDiscountPercentage(0) }
    else recalcDiscount(updated)
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return }
    const updated = cart.map(i => i.id === id ? { ...i, quantity: qty, finalPrice: qty * i.unitPrice, totalAmount: qty * i.unitPrice, individualPrices: [] } : i)
    syncCart(updated); recalcDiscount(updated)
  }

  const handleQtyInput = (id: string, value: string) => {
    const qty = value === "" ? 0 : parseFloat(value)
    if (isNaN(qty) || qty < 0) return
    const updated = cart.map(i => i.id === id ? { ...i, quantity: qty, finalPrice: qty * i.unitPrice, totalAmount: qty * i.unitPrice, individualPrices: [] } : i)
    syncCart(updated); recalcDiscount(updated)
  }

  const updatePrice = (id: string, price: number) => {
    const updated = cart.map(i => i.id === id ? { ...i, unitPrice: price, finalPrice: price * i.quantity, totalAmount: price * i.quantity, individualPrices: Number.isInteger(i.quantity) ? Array(i.quantity).fill(price) : [] } : i)
    syncCart(updated); recalcDiscount(updated)
    setProducts(products.map(p => p.id === id ? { ...p, purchaseCost: price } : p))
  }

  const updateFree = (id: string, free: number) => {
    syncCart(cart.map(i => i.id === id ? { ...i, tradeDiscountFreeItems: free } : i))
  }

  const subtotal = cart.reduce((s, i) => s + (i.individualPrices?.length ? i.individualPrices.reduce((a, b) => a + b, 0) : (i.totalAmount || i.unitPrice * i.quantity)), 0)
  const totalDiscount = cartDiscount
  const total = Math.max(0, subtotal - totalDiscount)

  const updateDiscountByAmount = (amount: number) => {
    setCartDiscount(amount)
    setCartDiscountPercentage(subtotal > 0 ? Math.round((amount / subtotal) * 100) : 0)
  }
  const updateDiscountByPct = (pct: number) => {
    setCartDiscountPercentage(pct)
    setCartDiscount(Math.round((pct / 100) * subtotal))
  }

  const handleSupplierSelect = (id: string) => {
    const s = suppliers.find(x => x.id === id)
    if (s) { setSupplierId(s.id); setSupplierName(s.name); setSupplierPhone(s.phone || ""); setSupplierAddress(s.address || ""); setSupplierSearchTerm(s.name); setShowSupplierDropdown(false); setSelectedSupplierIndex(-1) }
  }

  const handleSupplierSearchChange = (v: string) => {
    setSupplierSearchTerm(v); setShowSupplierDropdown(v.length > 0); setSelectedSupplierIndex(-1)
    if (!v.length) { setSupplierId(""); setSupplierName(""); setSupplierPhone(""); setSupplierAddress("") }
  }

  const handleSupplierSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSupplierDropdown) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSupplierIndex(p => p < filteredSuppliers.length - 1 ? p + 1 : 0) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSupplierIndex(p => p > 0 ? p - 1 : filteredSuppliers.length - 1) }
    if (e.key === 'Enter' && selectedSupplierIndex >= 0) { e.preventDefault(); handleSupplierSelect(filteredSuppliers[selectedSupplierIndex].id) }
    if (e.key === 'Escape') { setShowSupplierDropdown(false); setSelectedSupplierIndex(-1) }
  }

  // ── Checkout ─────────────────────────────────────────────────────────────

  const handleCompletePurchase = async () => {
    if (!cart.length) { toast({ title: "Empty cart", description: "Add items first", variant: "destructive" }); return }
    if (!supplierId) { toast({ title: "Select a supplier", variant: "destructive" }); return }
    if (!supplierName || !supplierPhone || !supplierAddress) { toast({ title: "Incomplete supplier info", variant: "destructive" }); return }
    if (!paymentMethod) { toast({ title: "Select payment method", variant: "destructive" }); return }
    if (paymentMethod === "credit" && partialPaymentAmount) {
      const pa = parseFloat(partialPaymentAmount) || 0
      if (pa <= 0 || pa >= total) { toast({ title: "Invalid partial payment amount", variant: "destructive" }); return }
    }
    setIsProcessingPurchase(true)
    try {
      const invoiceNumber = await SupplierInvoiceCounterService.getNextSupplierInvoiceNumber()
      const dist: { [id: string]: number } = {}
      if (totalDiscount > 0 && subtotal > 0) {
        let sum = 0
        cart.forEach((item, idx) => {
          if (idx === cart.length - 1) dist[item.id] = totalDiscount - sum
          else { const s = Math.round((item.unitPrice * item.quantity / subtotal) * totalDiscount); dist[item.id] = s; sum += s }
        })
      } else cart.forEach(i => { dist[i.id] = 0 })

      const purchaseItems = cart.map(item => ({
        productId: item.id, name: item.name, code: item.code, quantity: item.quantity,
        unitPrice: item.unitPrice - (dist[item.id] ?? 0) / (item.quantity || 1),
        subtotal: (item.totalAmount || item.unitPrice * item.quantity) - (dist[item.id] ?? 0),
        fabricType: item.fabricType, size: item.size,
        individualPrices: item.individualPrices, totalAmount: item.totalAmount,
      }))

      const partialAmount = paymentMethod === "credit" ? (parseFloat(partialPaymentAmount) || 0) : 0
      const purchaseData: Omit<Purchase, "id"> = {
        invoiceNumber, supplierId, supplierName: supplierName || "", supplierPhone: supplierPhone || "",
        supplierAddress: supplierAddress || "", items: purchaseItems, subtotal, discount: totalDiscount,
        totalAmount: total, paymentMethod, paymentStatus: paymentMethod === "credit" ? "pending" : "paid",
        ...(partialAmount > 0 ? { partialPaymentAmount: partialAmount.toString() } : {}),
        remainingAmount: total - partialAmount, staffMember: staffMember || "System",
        createdAt: new Date().toISOString(), createdBy: "System",
      }
      await PurchaseService.createPurchase(purchaseData)

      if (paymentMethod !== "credit") {
        try {
          const allS = await SupplierService.getAllSuppliers()
          const ex = allS.find(s => (supplierPhone && s.phone === supplierPhone) || (supplierName && (s.name || '').toLowerCase() === supplierName.toLowerCase()))
          await SupplierCreditService.createCredit({ supplierId: ex?.id || "", supplierName: supplierName || "Unknown", amount: total, type: "credit", reason: `${paymentMethod.toUpperCase()} payment for purchase ${invoiceNumber}`, description: `Full payment Rs${total}`, createdBy: staffMember || "purchase_system", status: "active", createdAt: new Date().toISOString() })
        } catch { }
      }

      for (const item of cart) {
        const p = products.find(p => p.id === item.id)
        if (p) {
          const avgPrice = parseFloat(((item.individualPrices || []).reduce((s, x) => s + x, 0) / item.quantity).toFixed(2))
          const totalQty = item.quantity + (item.tradeDiscountFreeItems || 0)
          await ProductService.updateProduct(item.id, { stock: p.stock + totalQty, purchaseCost: avgPrice, updatedAt: new Date().toISOString() })
          await ProductService.addStockMovement({ itemId: item.id, itemName: item.name, type: "in", quantity: item.quantity, reason: `Purchase from Supplier - Avg Rs${avgPrice.toFixed(2)}`, staff: "System", date: new Date().toISOString(), reference: invoiceNumber })
          if (item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0) {
            await ProductService.addStockMovement({ itemId: item.id, itemName: item.name, type: "in", quantity: item.tradeDiscountFreeItems, reason: "Trade Discount - Free Items", staff: "System", date: new Date().toISOString(), reference: invoiceNumber })
          }
        }
      }

      setProducts(products.map(p => { const ci = cart.find(i => i.id === p.id); return ci ? { ...p, stock: p.stock + ci.quantity + (ci.tradeDiscountFreeItems || 0) } : p }))
      setLastPurchaseData({ invoiceNumber, date: formatDate(new Date()), time: new Date().toLocaleTimeString(), supplierName, supplierPhone, supplierAddress, staffName: "System", items: cart.map(i => ({ name: i.name, code: i.code, quantity: i.quantity, unitPrice: i.unitPrice, subtotal: i.totalAmount || i.unitPrice * i.quantity, fabricType: i.fabricType || 'N/A', size: i.size || 'N/A', tradeDiscountFreeItems: i.tradeDiscountFreeItems || 0 })), subtotal, totalDiscount, total })
      setShowInvoiceModal(true)
      toast({ title: "Purchase completed!", description: `Invoice #${invoiceNumber} · Rs ${total.toLocaleString()}` })
      resetForm()
      setPurchases(await PurchaseService.getAllPurchases())
    } catch {
      toast({ title: "Error", description: "Failed to complete purchase. Try again.", variant: "destructive" })
    } finally { setIsProcessingPurchase(false) }
  }

  // ── Invoice handlers ──────────────────────────────────────────────────────

  const generateThermalPurchaseInvoiceHTML = (data: SupplierInvoiceData) => `<html><head><title>Thermal</title><style>@media print{@page{margin:0;size:80mm auto;}}body{font-family:'Courier New',monospace;font-size:11px;line-height:1.3;margin:0;padding:3mm;max-width:80mm;}.center{text-align:center;}.right{text-align:right;}.divider{border-top:1px dashed #000;margin:4px 0;}.bold{font-weight:bold;}</style></head><body><div class="center bold" style="font-size:15px;">BIN SULTAN FABRICS</div><div class="center" style="font-size:10px;">99/B Liberty Plaza, Gulberg<br/>0321-7590700</div><div class="divider"></div><p style="margin:1px 0;font-size:10px;"><b>Purchase #:</b> ${data.invoiceNumber}</p><p style="margin:1px 0;font-size:10px;"><b>Date:</b> ${data.date} ${data.time}</p><p style="margin:1px 0;font-size:10px;"><b>Supplier:</b> ${data.supplierName}</p>${data.supplierPhone ? `<p style="margin:1px 0;font-size:10px;"><b>Phone:</b> ${data.supplierPhone}</p>` : ''}<div class="divider"></div><table style="width:100%;border-collapse:collapse;font-size:10px;"><tr><td><b>Item</b></td><td style="text-align:right;"><b>Qty</b></td><td style="text-align:right;"><b>Price</b></td><td style="text-align:right;"><b>Total</b></td></tr>${data.items.map((i: { name: string; quantity: number; unitPrice: number; tradeDiscountFreeItems?: number }) => `<tr><td>${i.name}</td><td style="text-align:right;">${i.quantity}${i.tradeDiscountFreeItems && i.tradeDiscountFreeItems > 0 ? `+${i.tradeDiscountFreeItems}` : ''}</td><td style="text-align:right;">${i.unitPrice.toLocaleString()}</td><td style="text-align:right;">${(i.unitPrice * i.quantity).toLocaleString()}</td></tr>`).join('')}</table><div class="divider"></div><p class="right" style="margin:1px 0;">Subtotal: Rs${data.subtotal.toLocaleString()}</p>${data.totalDiscount > 0 ? `<p class="right" style="margin:1px 0;">Discount: -Rs${data.totalDiscount.toLocaleString()}</p>` : ''}<p class="right bold" style="margin:2px 0;border-top:1px solid #000;padding-top:2px;">TOTAL: Rs${data.total.toLocaleString()}</p><div class="divider"></div><div class="center" style="margin-top:6px;font-size:10px;">Thank you for your business!</div></body></html>`

  const handlePrint = async () => {
    if (!lastPurchaseData) return
    const w = window.open('', '_blank', 'width=800,height=600'); if (!w) return
    w.document.write(generateSupplierInvoiceHTML(lastPurchaseData)); w.document.close()
    w.onload = () => setTimeout(() => { w.print() }, 1000)
  }

  const handleThermalPrint = async () => {
    if (!lastPurchaseData) return
    const w = window.open('', '_blank', 'width=300,height=600'); if (!w) return
    w.document.write(generateThermalPurchaseInvoiceHTML(lastPurchaseData)); w.document.close()
    w.onload = () => setTimeout(() => { w.print(); w.close() }, 500)
  }

  const handleWhatsAppInvoice = async () => {
    if (!lastPurchaseData) return
    try {
      const w = window.open('', '_blank', 'width=800,height=600'); if (!w) return
      w.document.write(generateSupplierInvoiceHTML(lastPurchaseData)); w.document.close()
      w.onload = () => setTimeout(async () => {
        try {
          const canvas = await html2canvas(w.document.body, { useCORS: true, allowTaint: true, background: '#ffffff', width: 800, height: w.document.body.scrollHeight })
          const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png', 0.9))
          const phone = lastPurchaseData.supplierPhone.replace(/^0/, '+92')
          const msg = `Hi ${lastPurchaseData.supplierName}! Your purchase invoice #${lastPurchaseData.invoiceNumber} is attached.`
          if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'invoice.png', { type: 'image/png' })] })) {
            await navigator.share({ title: `Purchase Invoice #${lastPurchaseData.invoiceNumber}`, text: msg, files: [new File([blob], 'invoice.png', { type: 'image/png' })] })
            toast({ title: "Invoice shared!" }); w.close(); return
          }
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = `PurchaseInvoice_${lastPurchaseData.invoiceNumber}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
          setTimeout(() => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank'), 500)
          toast({ title: "Invoice downloaded — attach to WhatsApp!" }); w.close()
        } catch { w.close(); toast({ title: "Error capturing invoice", variant: "destructive" }) }
      }, 2000)
    } catch { toast({ title: "Error", variant: "destructive" }) }
  }

  const filteredPurchases = purchases.filter(p => {
    const ms = (p.invoiceNumber || '').toLowerCase().includes(purchaseSearchTerm.toLowerCase()) || (p.supplierName || '').toLowerCase().includes(purchaseSearchTerm.toLowerCase())
    const mf = selectedSupplierFilter === "all" || p.supplierId === selectedSupplierFilter
    return ms && mf
  })

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">Loading Purchasing</p>
          <p className="text-sm text-muted-foreground">Preparing your workspace…</p>
        </div>
      </div>
    </div>
  )

  // ── Purchase tab ──────────────────────────────────────────────────────────

  if (defaultTab === "history") {
    return (
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <History className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Purchase History</h2>
              <p className="text-xs text-muted-foreground">{purchases.length} records total</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search invoice or supplier…" value={purchaseSearchTerm} onChange={e => setPurchaseSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl text-sm bg-muted/40" />
          </div>
          <Select value={selectedSupplierFilter} onValueChange={setSelectedSupplierFilter}>
            <SelectTrigger className="w-44 h-9 rounded-xl text-sm">
              <SelectValue placeholder="All suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-background rounded-2xl border border-border/60 overflow-hidden shadow-sm">
          {purchaseHistoryLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading history…</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-xs font-semibold">Invoice</TableHead>
                  <TableHead className="text-xs font-semibold">Supplier</TableHead>
                  <TableHead className="text-xs font-semibold">Items</TableHead>
                  <TableHead className="text-xs font-semibold">Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Payment</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No purchases found</p>
                    </td>
                  </tr>
                ) : filteredPurchases.map(p => (
                  <TableRow key={p.id} className="border-border/30 hover:bg-muted/20">
                    <TableCell>
                      <p className="text-sm font-semibold text-foreground">{p.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(new Date(p.createdAt))}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{p.supplierName}</p>
                      <p className="text-xs text-muted-foreground">{p.supplierPhone}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{p.items?.length ?? 0} items</p>
                      <p className="text-xs text-muted-foreground">{Array.isArray(p.items) ? p.items.reduce((s, i) => s + (typeof i.quantity === "number" ? i.quantity : 0), 0) : 0} units</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold">Rs {p.totalAmount.toLocaleString()}</p>
                      {p.discount > 0 && <p className="text-xs text-red-500">-Rs {p.discount.toLocaleString()}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.paymentStatus === "pending" ? "destructive" : "secondary"} className="text-xs capitalize">
                        {p.paymentStatus}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{p.paymentMethod}</p>
                    </TableCell>
                    <TableCell><p className="text-sm text-muted-foreground">{formatDate(new Date(p.createdAt))}</p></TableCell>
                    <TableCell>
                      <button onClick={() => { setSelectedPurchase(p); setShowPurchaseDetails(true) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Purchase details dialog */}
        <Dialog open={showPurchaseDetails} onOpenChange={setShowPurchaseDetails}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Package className="h-4 w-4" />Purchase Details</DialogTitle>
              <DialogDescription>Detailed view of purchase items and information</DialogDescription>
            </DialogHeader>
            {selectedPurchase && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-xl">
                  <div>
                    <p className="font-bold text-lg">{selectedPurchase.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(new Date(selectedPurchase.createdAt))} at {new Date(selectedPurchase.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">Rs {selectedPurchase.totalAmount.toLocaleString()}</p>
                    {selectedPurchase.discount > 0 && <p className="text-sm text-muted-foreground">Discount: Rs {selectedPurchase.discount.toLocaleString()}</p>}
                  </div>
                </div>
                <div className="p-4 border border-border/50 rounded-xl flex justify-between">
                  <div>
                    <p className="font-semibold">{selectedPurchase.supplierName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{selectedPurchase.supplierPhone}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedPurchase.supplierAddress}</p>
                </div>
                <div className="border border-border/50 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Code</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedPurchase.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell><p className="font-medium text-sm">{item.name}</p>{item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}</TableCell>
                          <TableCell className="font-mono text-sm">{item.code}</TableCell>
                          <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                          <TableCell className="text-right text-sm">Rs {item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-sm">Rs {item.subtotal.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="bg-muted/40 p-4 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>Rs {selectedPurchase.subtotal.toLocaleString()}</span></div>
                  {selectedPurchase.discount > 0 && <div className="flex justify-between text-sm text-red-600"><span>Discount</span><span>-Rs {selectedPurchase.discount.toLocaleString()}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold"><span>Total</span><span>Rs {selectedPurchase.totalAmount.toLocaleString()}</span></div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ── Purchase new tab ──────────────────────────────────────────────────────

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          OPTION A LAYOUT: dark command bar top → left products · right order
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col h-screen overflow-hidden bg-background">

        {/* ── Command bar (dark top strip) ──────────────────────────────── */}
        <div className="flex-shrink-0 bg-slate-900 dark:bg-slate-950 border-b border-white/8 px-5 py-3 flex items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Purchasing</p>
              <p className="text-[10px] text-white/40">Bin Sultan Fabrics</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              placeholder="Search products…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-white/8 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Supplier pill */}
          <div className="relative flex-shrink-0">
            <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white/8 border border-white/10 cursor-pointer hover:bg-white/12 transition-colors"
              onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}>
              <Building2 className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <span className="text-sm text-white/70 max-w-40 truncate">
                {supplierName || "Select supplier"}
              </span>
              {supplierId && <CheckCircle2 className="w-3 h-3 text-amber-400 flex-shrink-0" />}
              <ChevronDown className="w-3 h-3 text-white/30 flex-shrink-0" />
            </div>
            {showSupplierDropdown && (
              <div className="absolute top-full mt-1.5 left-0 w-72 z-50 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2 border-b border-white/8">
                  <input
                    autoFocus
                    placeholder="Search suppliers…"
                    value={supplierSearchTerm}
                    onChange={e => handleSupplierSearchChange(e.target.value)}
                    onKeyDown={handleSupplierSearchKeyDown}
                    className="w-full h-7 px-2.5 rounded-lg bg-white/8 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {filteredSuppliers.length === 0
                    ? <div className="px-3 py-4 text-center text-sm text-white/40">No suppliers found</div>
                    : filteredSuppliers.map((s, i) => (
                      <div key={s.id} onClick={() => handleSupplierSelect(s.id)}
                        className={`px-3 py-2.5 cursor-pointer flex items-center justify-between gap-2 transition-colors
                          ${i === selectedSupplierIndex ? 'bg-amber-500/15' : 'hover:bg-white/6'}`}>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{s.name}</p>
                          <p className="text-xs text-white/40">{s.phone}{s.address ? ` · ${s.address}` : ''}</p>
                        </div>
                        {supplierId === s.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <div className="text-[11px] text-white/40">{filteredProducts.length} products</div>
            {cart.length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full px-2.5 py-1 text-[11px] font-medium">
                <ShoppingCart className="w-3 h-3" />{cart.length} item{cart.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* ── Body: products left + order panel right ───────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Products column (dark) */}
          <div className="w-[340px] flex-shrink-0 bg-slate-900 dark:bg-slate-950 border-r border-white/8 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 px-4 py-2.5 border-b border-white/6">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Products</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <Package className="w-8 h-8 text-white/15" />
                  <p className="text-sm text-white/25">No products found</p>
                </div>
              ) : filteredProducts.map((product, idx) => {
                const qty = cart.find(i => i.id === product.id)?.quantity || 0
                return (
                  <ProductRow key={`${product.id}-${idx}`} product={product} quantity={qty}
                    onAdd={() => addToCart(product)}
                    onRemove={() => updateQuantity(product.id, qty - 1)}
                  />
                )
              })}
            </div>
          </div>

          {/* Right panel: split vertically — cart top, form bottom */}
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* Cart section */}
            <div className="flex-1 overflow-y-auto bg-background">
              {/* Cart header */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                    <ShoppingCart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-bold text-foreground">Purchase Cart</span>
                  {cart.length > 0 && (
                    <span className="text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full px-2 py-0.5">
                      {cart.length} item{cart.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground/60">Search and add products from the left panel</p>
                </div>
              ) : (
                <div>
                  {cart.map((item, idx) => (
                    <PurchaseCartRow key={`${item.id}-${idx}`} item={item}
                      onQtyChange={d => updateQuantity(item.id, item.quantity + d)}
                      onQtyInput={v => handleQtyInput(item.id, v)}
                      onPriceChange={p => updatePrice(item.id, p)}
                      onFreeChange={f => updateFree(item.id, f)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-px bg-border/50 flex-shrink-0" />

            {/* Bottom form + totals + checkout */}
            <div className="flex-shrink-0 bg-background">
              <div className="flex">

                {/* Left: supplier info + payment + staff */}
                <div className="flex-1 px-5 py-4 border-r border-border/40 space-y-4 overflow-y-auto max-h-64">

                  {/* Supplier selected summary */}
                  {supplierId && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 truncate">{supplierName}</p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400">{supplierPhone} · {supplierAddress}</p>
                      </div>
                      <button onClick={() => { setSupplierId(""); setSupplierName(""); setSupplierPhone(""); setSupplierAddress(""); setSupplierSearchTerm("") }}
                        className="ml-auto text-amber-500 hover:text-amber-700 flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Payment method */}
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3" />Payment
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { value: "cash", icon: Banknote, label: "Cash" },
                        { value: "card", icon: CreditCard, label: "Card" },
                        { value: "mobile", icon: Smartphone, label: "Mobile" },
                        { value: "credit", icon: User, label: "Credit" },
                      ].map(({ value, icon: Icon, label }) => (
                        <button key={value} onClick={() => setPaymentMethod(value)}
                          className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-medium transition-all
                            ${paymentMethod === value
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'border-border/60 text-muted-foreground hover:bg-muted/50'}`}>
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                    {paymentMethod === "credit" && (
                      <div className="mt-2 flex items-center gap-2">
                        <Input type="number" placeholder="Partial payment (optional)" value={partialPaymentAmount}
                          onChange={e => setPartialPaymentAmount(e.target.value)} min="0" max={total}
                          className="h-7 text-xs rounded-xl flex-1" />
                      </div>
                    )}
                  </div>

                  {/* Staff */}
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <User className="w-3 h-3" />Staff
                    </p>
                    <Input placeholder="Staff name" value={staffMember} onChange={e => setStaffMember(e.target.value)}
                      className="h-7 text-xs rounded-xl" />
                  </div>
                </div>

                {/* Right: discount + totals + button */}
                <div className="w-72 px-4 py-4 flex flex-col justify-between gap-3">
                  {/* Discount */}
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Percent className="w-3 h-3" />Discount
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-[9px] text-muted-foreground mb-1">Amount (Rs)</p>
                        <Input type="number" min={0} max={subtotal} placeholder="0" value={cartDiscount || ""}
                          onChange={e => { let v = Number(e.target.value); if (isNaN(v) || v < 0) v = 0; if (v > subtotal) v = subtotal; updateDiscountByAmount(v) }}
                          className="h-7 text-xs rounded-xl [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] text-muted-foreground mb-1">Percent (%)</p>
                        <Input type="number" min={0} max={100} placeholder="0" value={cartDiscountPercentage || ""}
                          onChange={e => { let v = Number(e.target.value); if (isNaN(v) || v < 0) v = 0; if (v > 100) v = 100; updateDiscountByPct(v) }}
                          className="h-7 text-xs rounded-xl [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="bg-muted/30 rounded-xl px-3 py-2.5 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">Rs {subtotal.toLocaleString()}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          Discount
                          {cartDiscountPercentage > 0 && <span className="text-[9px] bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded px-1">{cartDiscountPercentage}%</span>}
                        </span>
                        <span className="font-medium text-red-600 dark:text-red-400">−Rs {totalDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-1 border-t border-border/40">
                      <span className="text-sm font-bold text-foreground">Total</span>
                      <span className="text-xl font-bold text-foreground tabular-nums">Rs {total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button onClick={handleCompletePurchase}
                    disabled={cart.length === 0 || !supplierId || !paymentMethod || isProcessingPurchase}
                    className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm disabled:bg-muted disabled:text-muted-foreground transition-all">
                    {isProcessingPurchase
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
                      : <><Zap className="w-4 h-4 mr-2" />Complete Purchase</>
                    }
                  </Button>
                  {(!supplierId || !paymentMethod) && cart.length > 0 && (
                    <p className="text-center text-[10px] text-muted-foreground -mt-1">
                      {!supplierId ? "Select a supplier" : "Select payment method"} to continue
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <SupplierInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onPrint={handlePrint}
        onWhatsApp={handleWhatsAppInvoice}
        onThermalPrint={handleThermalPrint}
        invoiceData={lastPurchaseData}
      />

      {/* Pricing modal */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Set Prices</DialogTitle>
            <DialogDescription>{pricingItem && `${pricingItem.name} · ${pricingItem.quantity} units`}</DialogDescription>
          </DialogHeader>
          {pricingItem && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-xl p-3 space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Total price for all units</Label>
                  <Input type="number" step="0.01" min="0" value={pricingItem.totalAmount || ""}
                    onChange={e => {
                      const t = parseFloat(e.target.value) || 0
                      const u = parseFloat((t / pricingItem.quantity).toFixed(2))
                      setPricingItem({ ...pricingItem, totalAmount: t, individualPrices: Number.isInteger(pricingItem.quantity) ? Array(pricingItem.quantity).fill(u) : [] })
                    }}
                    className="h-9 mt-1 rounded-xl" placeholder="Total price" />
                  <p className="text-[10px] text-muted-foreground mt-1">= Rs {((pricingItem.totalAmount || 0) / pricingItem.quantity).toFixed(2)} per unit</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Or price per unit</Label>
                  <Input type="number" step="0.01" min="0" value={pricingItem.totalAmount ? (pricingItem.totalAmount / pricingItem.quantity) : ""}
                    onChange={e => {
                      const u = parseFloat(e.target.value) || 0
                      const t = parseFloat((u * pricingItem.quantity).toFixed(2))
                      setPricingItem({ ...pricingItem, totalAmount: t, individualPrices: Number.isInteger(pricingItem.quantity) ? Array(pricingItem.quantity).fill(u) : [] })
                    }}
                    className="h-9 mt-1 rounded-xl" placeholder="Price per unit" />
                  <p className="text-[10px] text-muted-foreground mt-1">Total = Rs {(pricingItem.totalAmount || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowPricingModal(false)}>Cancel</Button>
                <Button className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white" onClick={() => {
                  if ((pricingItem.individualPrices || []).some(p => p <= 0)) { toast({ title: "Enter valid prices", variant: "destructive" }); return }
                  const t = parseFloat(((pricingItem.individualPrices || []).reduce((s, p) => s + p, 0)).toFixed(2))
                  const u = parseFloat((t / pricingItem.individualPrices!.length).toFixed(2))
                  const updated = cart.map(i => i.id === pricingItem.id ? { ...i, individualPrices: pricingItem.individualPrices, totalAmount: t, unitPrice: u } : i)
                  syncCart(updated); setShowPricingModal(false)
                  toast({ title: "Prices updated" })
                }}>Apply</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export { PurchasingModule }
