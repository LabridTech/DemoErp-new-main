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
  CreditCard, 
  Plus,
  Minus,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
  Download,
  Eye
} from "lucide-react"
import { SupplierCreditService, type SupplierCredit, type SupplierCreditTransaction } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface SupplierCreditsHistoryProps {
  supplierId: string
  supplierName: string
}

type SortField = 'date' | 'amount' | 'type' | 'status'
type SortDirection = 'asc' | 'desc'

// Combined type for display
interface CreditHistoryItem {
  id: string
  type: "credit" | "debit" | "used" | "refunded" | "expired"
  amount: number
  description: string
  reason?: string
  status: "active" | "used" | "expired" | "cancelled"
  remainingAmount?: number
  createdAt: string
  createdBy: string
  purchaseId?: string
  invoiceNumber?: string
  isTransaction?: boolean
}

export function SupplierCreditsHistory({ supplierId, supplierName }: SupplierCreditsHistoryProps) {
  const [credits, setCredits] = useState<SupplierCredit[]>([])
  const [transactions, setTransactions] = useState<SupplierCreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CreditHistoryItem | null>(null)
  const { toast } = useToast()

  const ITEMS_PER_PAGE = 10

  // Load credits and transactions for the supplier
  useEffect(() => {
    const loadData = async () => {
      if (!supplierId) return
      
      setLoading(true)
      try {
        const [creditsData, transactionsData] = await Promise.all([
          SupplierCreditService.getAll<SupplierCredit>("supplierCredits").then(credits => 
            credits.filter(credit => credit.supplierId === supplierId)
          ),
          SupplierCreditService.getCreditTransactions(supplierId)
        ])
        setCredits(creditsData)
        setTransactions(transactionsData)
      } catch (error) {
        console.error("Error loading credit data:", error)
        toast({
          title: "Error",
          description: "Failed to load credit history",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supplierId, toast])

  // Combine credits and transactions into a single list
  const allItems: CreditHistoryItem[] = useMemo(() => {
    const creditItems: CreditHistoryItem[] = credits.map(credit => ({
      id: credit.id,
      type: credit.type,
      amount: credit.amount,
      description: credit.description || `${credit.type} transaction`,
      reason: credit.reason,
      status: credit.status,
      remainingAmount: credit.remainingAmount,
      createdAt: credit.createdAt,
      createdBy: credit.createdBy,
      purchaseId: credit.purchaseId,
      invoiceNumber: credit.invoiceNumber,
      isTransaction: false
    }))

    const transactionItems: CreditHistoryItem[] = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      reason: undefined,
      status: "used" as const,
      remainingAmount: 0,
      createdAt: transaction.createdAt,
      createdBy: transaction.createdBy,
      purchaseId: transaction.purchaseId,
      invoiceNumber: transaction.invoiceNumber,
      isTransaction: true
    }))

    return [...creditItems, ...transactionItems].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [credits, transactions])

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = allItems.filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          item.description.toLowerCase().includes(searchLower) ||
          (item.reason && item.reason.toLowerCase().includes(searchLower)) ||
          item.type.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Type filter
      if (typeFilter !== "all") {
        if (item.type !== typeFilter) return false
      }

      // Status filter
      if (statusFilter !== "all") {
        if (item.status !== statusFilter) return false
      }

      // Date filter
      if (dateFilter !== "all") {
        const itemDate = new Date(item.createdAt)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))
        
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

      return true
    })

    // Sort items
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number

      switch (sortField) {
        case 'date':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'status':
          aValue = a.status
          bValue = b.status
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
  }, [allItems, searchTerm, typeFilter, statusFilter, dateFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedItems = filteredAndSortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter, statusFilter, dateFilter])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleViewItem = (item: CreditHistoryItem) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'credit':
        return <Badge variant="default" className="bg-green-100 text-green-800">Credit</Badge>
      case 'debit':
        return <Badge variant="destructive">Debit</Badge>
      case 'used':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Used</Badge>
      case 'refunded':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Refunded</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'used':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Used</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'debit':
        return <Minus className="h-4 w-4 text-red-600" />
      case 'used':
        return <DollarSign className="h-4 w-4 text-orange-600" />
      case 'refunded':
        return <CreditCard className="h-4 w-4 text-blue-600" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const calculateTotalStats = () => {
    const totalCredits = allItems
      .filter(item => item.type === 'credit' && item.status === 'active')
      .reduce((sum, item) => sum + item.amount, 0)
    
    const totalUsed = allItems
      .filter(item => item.type === 'used')
      .reduce((sum, item) => sum + item.amount, 0)
    
    const totalRefunded = allItems
      .filter(item => item.type === 'refunded')
      .reduce((sum, item) => sum + item.amount, 0)
    
    const availableCredits = totalCredits - totalUsed + totalRefunded
    
    return { totalCredits, totalUsed, totalRefunded, availableCredits }
  }

  const stats = calculateTotalStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Credit History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading credit history...</p>
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
                <p className="text-sm font-medium text-muted-foreground">Available Credits</p>
                <p className="text-2xl font-bold text-green-600">Rs{stats.availableCredits.toLocaleString()}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold text-blue-600">Rs{stats.totalCredits.toLocaleString()}</p>
              </div>
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Used</p>
                <p className="text-2xl font-bold text-orange-600">Rs{stats.totalUsed.toLocaleString()}</p>
              </div>
              <Minus className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Refunded</p>
                <p className="text-2xl font-bold text-purple-600">Rs{stats.totalRefunded.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Description, reason, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type-filter">Transaction Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setTypeFilter("all")
                setStatusFilter("all")
                setDateFilter("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credit Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Credit History ({filteredAndSortedItems.length} items)
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No credit history found for {supplierName}</p>
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
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          {sortField === 'date' && (
                            sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
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
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          Status
                          {sortField === 'status' && (
                            sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(item.type)}
                            {getTransactionTypeBadge(item.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-medium truncate">{item.description}</p>
                            {item.reason && (
                              <p className="text-sm text-muted-foreground truncate">{item.reason}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <p className={`font-medium ${
                              item.type === 'credit' || item.type === 'refunded' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {item.type === 'credit' || item.type === 'refunded' ? '+' : '-'}Rs{item.amount.toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <p className="font-medium">
                              Rs{(item.remainingAmount || 0).toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewItem(item)}
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
                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredAndSortedItems.length)} of {filteredAndSortedItems.length} results
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

      {/* Item Detail Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Credit History Details</CardTitle>
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Transaction Type</Label>
                  <div className="mt-1 flex items-center gap-2">
                    {getTransactionIcon(selectedItem.type)}
                    {getTransactionTypeBadge(selectedItem.type)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="font-medium text-lg">
                    {selectedItem.type === 'credit' || selectedItem.type === 'refunded' ? '+' : '-'}Rs{selectedItem.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Remaining Amount</Label>
                  <p className="font-medium text-lg">Rs{(selectedItem.remainingAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="font-medium">{new Date(selectedItem.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                  <p className="font-medium">{selectedItem.createdBy}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg">{selectedItem.description}</p>
              </div>
              
              {selectedItem.reason && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reason</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedItem.reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
