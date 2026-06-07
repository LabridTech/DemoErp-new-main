"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Search, Filter, Calendar, CreditCard } from "lucide-react"
import { CreditSalePaymentService, type CreditSalePaymentRecord } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface CustomerCreditsHistoryProps {
  customerId: string
  customerName: string
  customerPhone: string
}

export function CustomerCreditsHistory({ customerId, customerPhone }: CustomerCreditsHistoryProps) {
  const [creditPayments, setCreditPayments] = useState<CreditSalePaymentRecord[]>([])
  const [filteredPayments, setFilteredPayments] = useState<CreditSalePaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const { toast } = useToast()

  const loadCreditPayments = useCallback(async () => {
    try {
      setLoading(true)
      const allPayments = await CreditSalePaymentService.getAllCreditSalePaymentRecords()
      const customerPayments = allPayments.filter(payment => payment.customerPhone === customerPhone)
      setCreditPayments(customerPayments)
    } catch (error) {
      console.error("Error loading credit payments:", error)
      toast({
        title: "Error",
        description: "Failed to load credit payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [customerPhone, toast])

  // Load credit payments
  useEffect(() => {
    loadCreditPayments()
  }, [customerId, loadCreditPayments])

  // Filter payments when search or filter changes
  useEffect(() => {
    let filtered = creditPayments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(payment => 
            new Date(payment.saleDate) >= filterDate
          )
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(payment => 
            new Date(payment.saleDate) >= filterDate
          )
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(payment => 
            new Date(payment.saleDate) >= filterDate
          )
          break
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1)
          filtered = filtered.filter(payment => 
            new Date(payment.saleDate) >= filterDate
          )
          break
      }
    }

    setFilteredPayments(filtered)
  }, [creditPayments, searchTerm, statusFilter, dateFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "partial":
        return "secondary"
      case "pending":
        return "outline"
      case "overdue":
        return "destructive"
      default:
        return "outline"
    }
  }

  const totalCreditAmount = creditPayments.reduce((sum, payment) => sum + payment.totalAmount, 0)
  const totalRemainingAmount = creditPayments.reduce((sum, payment) => sum + payment.remainingAmount, 0)
  const paidAmount = totalCreditAmount - totalRemainingAmount

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Credit</p>
                <p className="text-2xl font-bold text-blue-600">Rs{totalCreditAmount.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">Rs{paidAmount.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold text-orange-600">Rs{totalRemainingAmount.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Payments ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No credit payments found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const paidAmount = payment.totalAmount - payment.remainingAmount
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.customerName}</p>
                            <p className="text-sm text-muted-foreground">{payment.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          Rs{payment.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          Rs{paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          Rs{payment.remainingAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.saleDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "N/A"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
