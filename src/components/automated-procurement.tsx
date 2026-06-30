"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search, ShieldAlert, FileText, RefreshCw, CheckCircle, XCircle, Play,
  Package, ShoppingBag, TrendingUp, AlertTriangle, Info, ClipboardList
} from "lucide-react"
import { ProcurementService, ProductService, type Product, type PurchaseOrder } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export function AutomatedProcurement() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [draftPOs, setDraftPOs] = useState<PurchaseOrder[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      // Get all draft POs
      const drafts = await ProcurementService.getDraftPOs()
      setDraftPOs(drafts)

      // Get low stock products
      const allProducts = await ProductService.getAllProducts()
      const lowStock = allProducts.filter(p => p.stock <= p.minStock)
      setLowStockProducts(lowStock)
    } catch (error) {
      console.error("Failed to load automated procurement data:", error)
      toast({
        title: "Error",
        description: "Failed to load draft purchase orders and stock alerts.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
    // Set up subscription for real-time draft PO updates
    const unsubscribe = ProcurementService.subscribeToPurchaseOrders((allOrders) => {
      const drafts = allOrders.filter(po => po.status === "draft")
      setDraftPOs(drafts)
    })
    return () => unsubscribe()
  }, [loadData])

  const handleScan = async () => {
    try {
      setScanning(true)
      const scanUser = user?.displayName || user?.email || "System"
      const generatedCount = await ProcurementService.scanStockAndGenerateDrafts(scanUser)
      
      toast({
        title: "Scan Completed",
        description: generatedCount > 0 
          ? `Successfully scanned stock and generated ${generatedCount} draft PO(s).` 
          : "Stock levels checked. No new draft POs generated.",
      })
      await loadData()
    } catch (error) {
      console.error("Procurement scan failed:", error)
      toast({
        title: "Scan Failed",
        description: "An error occurred during the stock scan.",
        variant: "destructive"
      })
    } finally {
      setScanning(false)
    }
  }

  const handleApprove = async (poId: string) => {
    try {
      setActionInProgress(poId)
      const approveUser = user?.displayName || user?.email || "System"
      await ProcurementService.approvePurchaseOrder(poId, approveUser)
      
      toast({
        title: "Purchase Order Approved",
        description: "Draft PO has been approved and finalized as a Purchase record. Stock levels updated.",
      })
      await loadData()
    } catch (error) {
      console.error("Failed to approve PO:", error)
      toast({
        title: "Approval Failed",
        description: "Failed to approve and process the purchase order.",
        variant: "destructive"
      })
    } finally {
      setActionInProgress(null)
    }
  }

  const handleReject = async (poId: string) => {
    try {
      setActionInProgress(poId)
      const rejectUser = user?.displayName || user?.email || "System"
      await ProcurementService.rejectPurchaseOrder(poId, rejectUser)
      
      toast({
        title: "Purchase Order Rejected",
        description: "Draft PO has been marked as rejected.",
      })
      await loadData()
    } catch (error) {
      console.error("Failed to reject PO:", error)
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the purchase order.",
        variant: "destructive"
      })
    } finally {
      setActionInProgress(null)
    }
  }

  // Filter draft POs based on search term (supplier name or PO number)
  const filteredDraftPOs = draftPOs.filter(po => 
    po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading procurement engine...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Automated Procurement Engine
          </h2>
          <p className="text-muted-foreground mt-1">
            Intelligent purchasing scans, draft purchase order approvals, and supplier price history optimization.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button 
            onClick={handleScan} 
            disabled={scanning}
            className="bg-gradient-to-r from-primary to-secondary text-white border-0 hover:opacity-90 shadow-md transition-all duration-200"
          >
            {scanning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Scan Stock Levels
          </Button>
        </div>
      </div>

      {/* Procurement Stats / Summary Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Products at or below reorder threshold</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Pending Draft POs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{draftPOs.length}</div>
            <p className="text-xs text-muted-foreground">Draft purchase orders ready for manager approval</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Best Price Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">Active</div>
            <p className="text-xs text-muted-foreground">Automatically matching lowest historical supplier cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert Table */}
      {lowStockProducts.length > 0 && (
        <Card className="glass-card border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">Low Stock Warnings</CardTitle>
            </div>
            <CardDescription className="text-amber-600/80 dark:text-amber-500/80">
              The following products require restocking. Running a stock scan will group them and generate draft POs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Product Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="text-center">Min Stock</TableHead>
                    <TableHead className="text-center">Max Target Stock</TableHead>
                    <TableHead className="text-right">Reorder Qty Needed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((p) => (
                    <TableRow key={p.id} className="hover:bg-amber-500/10 border-amber-500/10">
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline">{p.code}</Badge></TableCell>
                      <TableCell className="text-center text-destructive font-semibold">{p.stock}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{p.minStock}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{p.maxStock}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-600 dark:text-amber-400">
                        {p.maxStock - p.stock}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Draft PO List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Generated Draft Purchase Orders
          </CardTitle>
          <CardDescription>
            Review automatically grouped restock drafts. Click Approve to finalize the order and restock inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drafts by supplier or PO number..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredDraftPOs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-2xl border-muted/50 bg-muted/10">
              <Package className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2" />
              <h3 className="font-semibold text-muted-foreground">No Draft POs Found</h3>
              <p className="text-sm text-muted-foreground/75 mt-1">
                {draftPOs.length === 0 
                  ? "Click 'Scan Stock Levels' to scan inventory and generate reorder drafts." 
                  : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDraftPOs.map((po) => (
                <div 
                  key={po.id} 
                  className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  {/* PO Title Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-muted/30 border-b border-border/60 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-wide font-mono text-primary">{po.poNumber}</span>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Draft</Badge>
                      </div>
                      <h4 className="font-bold text-lg mt-0.5 text-foreground">{po.supplierName}</h4>
                      <p className="text-xs text-muted-foreground">Generated on: {new Date(po.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleReject(po.id)}
                        disabled={actionInProgress !== null}
                      >
                        {actionInProgress === po.id ? (
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Reject Draft
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border-0"
                        onClick={() => handleApprove(po.id)}
                        disabled={actionInProgress !== null}
                      >
                        {actionInProgress === po.id ? (
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        1-Click Approve
                      </Button>
                    </div>
                  </div>

                  {/* PO Items Table */}
                  <div className="p-4 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Product</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="text-center">Restock Qty Needed</TableHead>
                          <TableHead className="text-right">Optimized Unit Cost</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {po.items.map((item, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/10">
                            <TableCell className="font-medium">
                              <div>
                                <p>{item.name}</p>
                                {item.fabricType && (
                                  <p className="text-xs text-muted-foreground">{item.fabricType} {item.size ? `• Size: ${item.size}` : ""}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{item.code}</Badge></TableCell>
                            <TableCell className="text-center font-semibold">{item.quantity} units</TableCell>
                            <TableCell className="text-right font-mono">Rs{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">Rs{item.subtotal.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="hover:bg-transparent font-bold border-t-2 bg-muted/10">
                          <TableCell colSpan={4} className="text-right">Estimated Total Amount:</TableCell>
                          <TableCell className="text-right text-lg text-primary font-mono font-bold">
                            Rs{po.totalAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
