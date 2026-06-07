"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc
} from "lucide-react"
import { PurchaseService, type Purchase } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import { SupplierReportDialog } from "./supplier-report-dialog"

interface SupplierPurchaseHistoryProps {
  supplierId: string
  supplierName: string
  supplierPhone?: string
  supplierAddress?: string
}

type SortField = 'date' | 'amount' | 'invoice' | 'paymentMethod'
type SortDirection = 'asc' | 'desc'

export function SupplierPurchaseHistory({ supplierId, supplierName, supplierPhone = '', supplierAddress = '' }: SupplierPurchaseHistoryProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [amountFilter, setAmountFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const { toast } = useToast()

  const ITEMS_PER_PAGE = 10

  // Load purchases for the supplier
  useEffect(() => {
    const loadPurchases = async () => {
      if (!supplierId) return
      
      setLoading(true)
      try {
        const allPurchases = await PurchaseService.getAllPurchases()
        const supplierPurchases = allPurchases.filter(purchase => purchase.supplierId === supplierId)
        setPurchases(supplierPurchases)
      } catch (error) {
        console.error("Error loading purchases:", error)
        toast({
          title: "Error",
          description: "Failed to load purchase history",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadPurchases()
  }, [supplierId, toast])

    // Filter and sort purchases
    const filteredAndSortedPurchases = useMemo(() => {
      const filtered = purchases.filter(purchase => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          purchase.invoiceNumber.toLowerCase().includes(searchLower) ||
          purchase.supplierName.toLowerCase().includes(searchLower) ||
          purchase.items.some(item => 
            item.name.toLowerCase().includes(searchLower) ||
            item.code.toLowerCase().includes(searchLower)
          )
        if (!matchesSearch) return false
      }

      // Date filter
      if (dateFilter !== "all") {
        const purchaseDate = new Date(purchase.createdAt)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (dateFilter) {
          case "today":
            if (daysDiff !== 0) return false
            break
          case "week":
            if (daysDiff > 7) return false
            break
          case "month":
            if (daysDiff > 30) return false
            break
          case "quarter":
            if (daysDiff > 90) return false
            break
          case "year":
            if (daysDiff > 365) return false
            break
        }
      }

      // Payment method filter
      if (paymentMethodFilter !== "all") {
        if (purchase.paymentMethod !== paymentMethodFilter) return false
      }

      // Amount filter
      if (amountFilter !== "all") {
        const amount = purchase.totalAmount
        switch (amountFilter) {
          case "0-1000":
            if (amount < 0 || amount > 1000) return false
            break
          case "1000-5000":
            if (amount < 1000 || amount > 5000) return false
            break
          case "5000-10000":
            if (amount < 5000 || amount > 10000) return false
            break
          case "10000+":
            if (amount < 10000) return false
            break
        }
      }

      return true
    })

    // Sort purchases
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number

      switch (sortField) {
        case 'date':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'amount':
          aValue = a.totalAmount
          bValue = b.totalAmount
          break
        case 'invoice':
          aValue = a.invoiceNumber
          bValue = b.invoiceNumber
          break
        case 'paymentMethod':
          aValue = a.paymentMethod || ''
          bValue = b.paymentMethod || ''
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [purchases, searchTerm, dateFilter, paymentMethodFilter, amountFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPurchases.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedPurchases = filteredAndSortedPurchases.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateFilter, paymentMethodFilter, amountFilter])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleViewPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowViewModal(true)
  }

  const getPaymentMethodBadge = (paymentMethod?: string) => {
    switch (paymentMethod) {
      case 'cash':
        return <Badge variant="default" className="bg-green-100 text-green-800">Cash</Badge>
      case 'credit':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Credit</Badge>
      case 'card':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Card</Badge>
      case 'bank_transfer':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Bank Transfer</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getPaymentStatusBadge = (purchase: Purchase) => {
    if (purchase.paymentMethod === 'credit') {
      const remaining = purchase.remainingAmount || 0
      if (remaining <= 0) {
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
      } else {
        return <Badge variant="destructive">Pending (Rs{remaining.toLocaleString()})</Badge>
      }
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
  }

  const calculateTotalStats = () => {
    const totalAmount = filteredAndSortedPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0)
    const totalDiscount = filteredAndSortedPurchases.reduce((sum, purchase) => sum + (purchase.discount || 0), 0)
    const creditPurchases = filteredAndSortedPurchases.filter(p => p.paymentMethod === 'credit')
    const pendingAmount = creditPurchases.reduce((sum, purchase) => sum + (purchase.remainingAmount || 0), 0)
    
    return { totalAmount, totalDiscount, pendingAmount, creditCount: creditPurchases.length }
  }

  const stats = calculateTotalStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Purchase History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading purchase history...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">Rs{stats.totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Discount</p>
                <p className="text-2xl font-bold text-green-600">Rs{stats.totalDiscount.toLocaleString()}</p>
              </div>
              <Receipt className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-600">Rs{stats.pendingAmount.toLocaleString()}</p>
              </div>
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Credit Purchases</p>
                <p className="text-2xl font-bold text-purple-600">{stats.creditCount}</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Invoice, product, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 3 Months</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="payment-filter">Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount-filter">Amount Range</Label>
              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Amounts</SelectItem>
                  <SelectItem value="0-1000">Rs 0 - 1,000</SelectItem>
                  <SelectItem value="1000-5000">Rs 1,000 - 5,000</SelectItem>
                  <SelectItem value="5000-10000">Rs 5,000 - 10,000</SelectItem>
                  <SelectItem value="10000+">Rs 10,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setDateFilter("all")
                  setPaymentMethodFilter("all")
                  setAmountFilter("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Purchase History ({filteredAndSortedPurchases.length} transactions)
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowReportDialog(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedPurchases.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No purchases found for {supplierName}</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('invoice')}
                      >
                        <div className="flex items-center gap-2">
                          Invoice
                          {sortField === 'invoice' && (
                            sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          {sortField === 'date' && (
                            sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center gap-2">
                          Amount
                          {sortField === 'amount' && (
                            sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('paymentMethod')}
                      >
                        <div className="flex items-center gap-2">
                          Payment
                          {sortField === 'paymentMethod' && (
                            sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(purchase.createdAt).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm font-medium truncate">
                              {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {purchase.items.slice(0, 2).map(item => item.name).join(', ')}
                              {purchase.items.length > 2 && '...'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <p className="font-medium">Rs{purchase.totalAmount.toLocaleString()}</p>
                            {purchase.discount > 0 && (
                              <p className="text-xs text-green-600">
                                -Rs{purchase.discount.toLocaleString()} discount
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(purchase.paymentMethod)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(purchase)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPurchase(purchase)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredAndSortedPurchases.length)} of {filteredAndSortedPurchases.length} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Detail Modal */}
      {showViewModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Purchase Details - {selectedPurchase.invoiceNumber}</CardTitle>
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Purchase Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Invoice Number</Label>
                  <p className="font-medium">{selectedPurchase.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="font-medium">{new Date(selectedPurchase.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                  <div className="mt-1">{getPaymentMethodBadge(selectedPurchase.paymentMethod)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedPurchase)}</div>
                </div>
              </div>

              {/* Items */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Items</Label>
                <div className="mt-2 space-y-2">
                  {selectedPurchase.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Code: {item.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × Rs{item.unitPrice.toLocaleString()} = Rs{item.subtotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs{item.subtotal.toLocaleString()}</p>
                        {item.discount && item.discount > 0 && (
                          <p className="text-sm text-green-600">-Rs{item.discount.toLocaleString()} discount</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs{selectedPurchase.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedPurchase.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-Rs{selectedPurchase.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>Rs{selectedPurchase.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Dialog */}
      <SupplierReportDialog
        isOpen={showReportDialog}
        onOpenChange={setShowReportDialog}
        supplierName={supplierName}
        supplierPhone={supplierPhone}
        supplierAddress={supplierAddress}
        purchases={purchases}
      />
    </div>
  )
}
