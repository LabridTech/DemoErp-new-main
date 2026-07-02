"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus, Search, Warehouse, ArrowLeftRight, CheckCircle2,
  XCircle, MapPin, ClipboardList, RefreshCw, PenTool, Check, AlertCircle
} from "lucide-react"
import { ProductService, type Product } from "@/lib/firebase-services"
import {
  WarehouseService, StockTransferService,
  type Warehouse as WHType, type WarehouseStock, type StockTransfer
} from "@/lib/operations-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function WarehouseManagement() {
  // ── State ─────────────────────────────────────────
  const [warehouses, setWarehouses] = useState<WHType[]>([])
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([])
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Dialogs
  const [showAddWarehouse, setShowAddWarehouse] = useState(false)
  const [showAddTransfer, setShowAddTransfer] = useState(false)
  const [showEditLayout, setShowEditLayout] = useState(false)

  // Forms
  const [newWarehouseForm, setNewWarehouseForm] = useState({ name: "", code: "", address: "", description: "" })

  // Stock Transfer Form State
  const [fromWarehouse, setFromWarehouse] = useState("")
  const [toWarehouse, setToWarehouse] = useState("")
  const [transferItems, setTransferItems] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: "", quantity: 1 }
  ])

  // Layout Dialog State
  const [layoutEditState, setLayoutEditState] = useState({ productId: "", warehouseId: "", section: "", rack: "" })

  const { user } = useAuth()
  const { toast } = useToast()

  const actor = useMemo(() => ({
    id: user?.uid || "unknown",
    email: user?.email || "unknown",
    name: user?.displayName || user?.email?.split("@")[0] || "User"
  }), [user])

  // ── Data Fetching ─────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [whs, stocks, trs, prods] = await Promise.all([
        WarehouseService.getWarehouses(),
        WarehouseService.getWarehouseStocks(),
        StockTransferService.getTransfers(),
        ProductService.getAllProducts()
      ])
      setWarehouses(Array.isArray(whs) ? whs.filter(Boolean) : [])
      setWarehouseStocks(Array.isArray(stocks) ? stocks.filter(Boolean) : [])
      setTransfers(Array.isArray(trs) ? trs.filter(Boolean) : [])
      // Sanitize: only keep valid product objects (filter out null/undefined/primitives)
      setProducts(Array.isArray(prods) ? prods.filter(p => p && typeof p === 'object') : [])
    } catch (err) {
      console.error("Error loading warehouse data:", err)
      toast({ title: "Error", description: "Failed to load data.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Handlers ──────────────────────────────────────
  const handleAddWarehouse = async () => {
    const { name, code, address, description } = newWarehouseForm
    if (!name || !code) {
      toast({ title: "Required Fields", description: "Please enter name and code.", variant: "destructive" })
      return
    }
    try {
      await WarehouseService.createWarehouse(name, code, address, description, actor)
      toast({ title: "Success", description: "Warehouse created successfully." })
      setNewWarehouseForm({ name: "", code: "", address: "", description: "" })
      setShowAddWarehouse(false)
      fetchData()
    } catch {
      toast({ title: "Error", description: "Failed to create warehouse.", variant: "destructive" })
    }
  }

  const handleUpdateLayout = async () => {
    const { productId, warehouseId, section, rack } = layoutEditState
    if (!productId || !warehouseId) return
    try {
      await WarehouseService.updateStockLayout(productId, warehouseId, section, rack, actor)
      toast({ title: "Layout Updated", description: "Location layout has been updated." })
      setShowEditLayout(false)
      fetchData()
    } catch {
      toast({ title: "Error", description: "Failed to update layout.", variant: "destructive" })
    }
  }

  const handleAddTransferItem = () => {
    setTransferItems([...transferItems, { productId: "", quantity: 1 }])
  }

  const handleRemoveTransferItem = (index: number) => {
    const list = [...transferItems]
    list.splice(index, 1)
    setTransferItems(list)
  }

  const handleTransferItemChange = (index: number, field: "productId" | "quantity", value: string | number) => {
    const list = [...transferItems]
    if (field === "productId") {
      list[index].productId = value as string
    } else {
      list[index].quantity = Math.max(1, Number(value))
    }
    setTransferItems(list)
  }

  const handleCreateTransfer = async () => {
    if (!fromWarehouse || !toWarehouse) {
      toast({ title: "Missing Locations", description: "Select source and target warehouses.", variant: "destructive" })
      return
    }
    if (fromWarehouse === toWarehouse) {
      toast({ title: "Invalid Route", description: "Source and target cannot be the same.", variant: "destructive" })
      return
    }
    const filteredItems = transferItems.filter(item => item.productId && item.quantity > 0)
    if (filteredItems.length === 0) {
      toast({ title: "Empty items", description: "Please add at least one product.", variant: "destructive" })
      return
    }

    // Map to API structure
    const itemsPayload = filteredItems.map(item => {
      const prod = products.find(p => p.id === item.productId)
      return {
        productId: item.productId,
        productName: prod?.name || "Unknown Product",
        quantity: item.quantity
      }
    })

    try {
      await StockTransferService.createTransfer(fromWarehouse, toWarehouse, itemsPayload, actor)
      toast({ title: "Transfer Created", description: "Stock Transfer note generated. Needs signoffs." })
      setShowAddTransfer(false)
      setFromWarehouse("")
      setToWarehouse("")
      setTransferItems([{ productId: "", quantity: 1 }])
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create transfer."
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
  }

  const handleSignSender = async (transferId: string) => {
    try {
      await StockTransferService.signTransferSender(transferId, actor)
      toast({ title: "Signed", description: "Signed as sender successfully." })
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signing failed."
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
  }

  const handleSignReceiver = async (transferId: string) => {
    try {
      await StockTransferService.signTransferReceiver(transferId, actor)
      toast({ title: "Transfer Completed", description: "Signed as receiver. Inventory quantities adjusted." })
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signing failed."
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
  }

  const handleCancelTransfer = async (transferId: string) => {
    try {
      await StockTransferService.cancelTransfer(transferId, actor)
      toast({ title: "Cancelled", description: "Transfer cancelled." })
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cancellation failed."
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
  }

  // ── Computed / Helpers ────────────────────────────
  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id

  const filteredProducts = products.filter(p => {
    if (!p || typeof p !== 'object') return false;
    const nameStr = p.name ? String(p.name).toLowerCase() : "";
    const codeStr = p.code ? String(p.code).toLowerCase() : "";
    const searchStr = searchTerm ? String(searchTerm).toLowerCase() : "";
    return nameStr.includes(searchStr) || codeStr.includes(searchStr);
  })

  const getStockAtWarehouse = (productId: string, warehouseId: string) => {
    const entry = warehouseStocks.find(s => s.productId === productId && s.warehouseId === warehouseId)
    return entry ? entry.stock : 0
  }

  const getLayoutAtWarehouse = (productId: string, warehouseId: string) => {
    const entry = warehouseStocks.find(s => s.productId === productId && s.warehouseId === warehouseId)
    return entry ? `${entry.section || "—"} / ${entry.rack || "—"}` : "— / —"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Pending</Badge>
      case "signed_sender":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Signed (Sender)</Badge>
      case "completed":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Completed</Badge>
      case "cancelled":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading operations module...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouse &amp; Location Management</h2>
          <p className="text-muted-foreground mt-1">Multi-location inventory tracking, internal transfers &amp; layouts</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => fetchData()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowAddTransfer(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" /> New Transfer
          </Button>
          <Button onClick={() => setShowAddWarehouse(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Warehouse
          </Button>
        </div>
      </div>

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution"><Warehouse className="h-4 w-4 mr-2" /> Stock Distribution</TabsTrigger>
          <TabsTrigger value="transfers"><ArrowLeftRight className="h-4 w-4 mr-2" /> Internal Transfers</TabsTrigger>
          <TabsTrigger value="locations"><MapPin className="h-4 w-4 mr-2" /> Warehouse List</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Stock Distribution ───────────────── */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Stock Matrix</CardTitle>
              <CardDescription>Stock levels across physical warehouse locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or code..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center font-bold">Total Stock</TableHead>
                      {warehouses.map(w => (
                        <TableHead key={w.id} className="text-center">{w.name} ({w.code})</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2 + warehouses.length} className="text-center text-muted-foreground py-8">
                          No products found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map(prod => (
                        <TableRow key={prod.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{prod.name}</p>
                              <p className="text-xs text-muted-foreground">{prod.code}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-lg">{prod.stock}</TableCell>
                          {warehouses.map(wh => {
                            const stock = getStockAtWarehouse(prod.id, wh.id)
                            const layout = getLayoutAtWarehouse(prod.id, wh.id)
                            return (
                              <TableCell key={wh.id} className="text-center">
                                <div className="space-y-1">
                                  <div className="font-semibold">{stock} units</div>
                                  <div className="text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                    <MapPin className="h-2.5 w-2.5" />
                                    Loc: {layout}
                                  </div>
                                  <div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-[10px] px-2"
                                      onClick={() => {
                                        const entry = warehouseStocks.find(s => s.productId === prod.id && s.warehouseId === wh.id)
                                        setLayoutEditState({
                                          productId: prod.id,
                                          warehouseId: wh.id,
                                          section: entry?.section || "",
                                          rack: entry?.rack || ""
                                        })
                                        setShowEditLayout(true)
                                      }}
                                    >
                                      Edit Layout
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Internal Transfers ───────────────── */}
        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Internal Stock Transfers</CardTitle>
              <CardDescription>Initiate and sign off transfers between warehouse locations</CardDescription>
            </CardHeader>
            <CardContent>
              {transfers.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <ArrowLeftRight className="h-12 w-12 opacity-50 mb-3" />
                  <p className="font-medium">No stock transfers found</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowAddTransfer(true)}>
                    Create Transfer Note
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transfer #</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Signoffs Required</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfers.map(tr => (
                        <TableRow key={tr.id}>
                          <TableCell className="font-medium">{tr.transferNumber}</TableCell>
                          <TableCell>
                            <div className="text-xs space-y-0.5">
                              <p><span className="text-muted-foreground">From:</span> {getWarehouseName(tr.fromWarehouseId)}</p>
                              <p><span className="text-muted-foreground">To:</span> {getWarehouseName(tr.toWarehouseId)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ul className="text-xs list-disc pl-4 space-y-0.5">
                              {tr.items.map((item, idx) => (
                                <li key={idx}>{item.productName} ({item.quantity})</li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell>{getStatusBadge(tr.status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(tr.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="text-[10px] space-y-1">
                              <div className="flex items-center gap-1.5">
                                {tr.senderSignature ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-amber-500" />
                                )}
                                <span>Sender: {tr.senderSignature?.signedByName || "Pending"}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {tr.receiverSignature ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-amber-500" />
                                )}
                                <span>Receiver: {tr.receiverSignature?.signedByName || "Pending"}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {tr.status === "pending" && (
                                <>
                                  <Button size="sm" onClick={() => handleSignSender(tr.id)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <PenTool className="h-3 w-3 mr-1" /> Sign (Sender)
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleCancelTransfer(tr.id)}>
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {tr.status === "signed_sender" && (
                                <>
                                  <Button size="sm" onClick={() => handleSignReceiver(tr.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Sign &amp; Complete
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleCancelTransfer(tr.id)}>
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {tr.status === "completed" && (
                                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Handled
                                </span>
                              )}
                              {tr.status === "cancelled" && (
                                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 text-red-600">
                                  <XCircle className="h-3.5 w-3.5" /> Cancelled
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Warehouses List ──────────────────── */}
        <TabsContent value="locations" className="space-y-4">
          {warehouses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Warehouse className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">No Warehouses Registered</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Register your primary warehouse or store-front locations.</p>
                <Button onClick={() => setShowAddWarehouse(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Warehouse
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {warehouses.map(wh => (
                <Card key={wh.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{wh.name}</CardTitle>
                      <Badge>{wh.code}</Badge>
                    </div>
                    <CardDescription>{wh.address || "No address provided"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{wh.description || "No description provided"}</p>
                    <div className="mt-4 pt-4 border-t text-[10px] text-muted-foreground flex justify-between">
                      <span>ID: {wh.id}</span>
                      <span>Registered: {new Date(wh.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ══════════════════════════════════════════════
          DIALOGS & MODALS
         ══════════════════════════════════════════════ */}

      {/* ── Add Warehouse Dialog ──────────────────── */}
      <Dialog open={showAddWarehouse} onOpenChange={setShowAddWarehouse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Warehouse</DialogTitle>
            <DialogDescription>Register a physical storage location or retail store outlet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wh-name">Warehouse Name</Label>
              <Input id="wh-name" placeholder="e.g. Main Godown" value={newWarehouseForm.name}
                onChange={e => setNewWarehouseForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-code">Warehouse Code</Label>
              <Input id="wh-code" placeholder="e.g. WH-MGD" value={newWarehouseForm.code}
                onChange={e => setNewWarehouseForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-address">Address</Label>
              <Input id="wh-address" placeholder="Physical location address" value={newWarehouseForm.address}
                onChange={e => setNewWarehouseForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-desc">Description</Label>
              <Input id="wh-desc" placeholder="Brief notes about operations" value={newWarehouseForm.description}
                onChange={e => setNewWarehouseForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWarehouse(false)}>Cancel</Button>
            <Button onClick={handleAddWarehouse}>Save Warehouse</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Layout Dialog ─────────────────────── */}
      <Dialog open={showEditLayout} onOpenChange={setShowEditLayout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location Layout Coordinates</DialogTitle>
            <DialogDescription>Assign a section and rack coordinate for rapid product retrieval.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lay-sec">Section / Aisle</Label>
              <Input id="lay-sec" placeholder="e.g. Aisle 3" value={layoutEditState.section}
                onChange={e => setLayoutEditState(p => ({ ...p, section: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lay-rack">Rack Identifier</Label>
              <Input id="lay-rack" placeholder="e.g. Rack B2" value={layoutEditState.rack}
                onChange={e => setLayoutEditState(p => ({ ...p, rack: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditLayout(false)}>Cancel</Button>
            <Button onClick={handleUpdateLayout}>Update Layout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Stock Transfer Dialog ─────────────── */}
      <Dialog open={showAddTransfer} onOpenChange={setShowAddTransfer}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Stock Transfer Note</DialogTitle>
            <DialogDescription>Transfer inventory from a source warehouse to a target warehouse.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From (Source Warehouse)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={fromWarehouse}
                  onChange={e => setFromWarehouse(e.target.value)}
                >
                  <option value="">Select source...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>To (Target Warehouse)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={toWarehouse}
                  onChange={e => setToWarehouse(e.target.value)}
                >
                  <option value="">Select target...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">Products to Transfer</Label>
                <Button size="sm" variant="outline" onClick={handleAddTransferItem}>
                  Add Product
                </Button>
              </div>

              {transferItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-end mb-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Product</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={item.productId}
                      onChange={e => handleTransferItemChange(idx, "productId", e.target.value)}
                    >
                      <option value="">Select product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-[120px] space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => handleTransferItemChange(idx, "quantity", parseInt(e.target.value))}
                    />
                  </div>
                  {transferItems.length > 1 && (
                    <Button variant="ghost" className="text-red-500 hover:text-red-700 h-10 px-2" onClick={() => handleRemoveTransferItem(idx)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTransfer(false)}>Cancel</Button>
            <Button onClick={handleCreateTransfer}>Generate Transfer Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
