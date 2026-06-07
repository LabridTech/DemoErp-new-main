"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Download,
  FileText,
  Receipt,
  CreditCard,
  Plus,
  Minus,
  Wallet,
  ArrowLeft,
  MessageSquare
} from "lucide-react"
import { PurchaseService, SupplierCreditService, type Purchase, type SupplierCredit, type SupplierCreditTransaction } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import { formatDate, formatDateTime, generateExportDateOptions } from "@/lib/date-utils"
import { sharePDFViaWhatsApp, generatePDFFromHTML } from "@/lib/whatsapp-utils"

interface SupplierLedgerPurchaseProps {
  supplierId: string
  supplierName: string
  supplierPhone?: string
  supplierAddress?: string
  initialBalance?: number
  onBack?: () => void
}

// Combined transaction type for ledger
interface LedgerTransaction {
  id: string
  date: string
  type: "purchase" | "payment" | "credit" | "debit"
  amount: number
  detail: string
  invoiceNumber?: string
  description?: string
  createdAt: string
  runningBalance: number
}

type SortField = 'date' | 'amount' | 'type'
type SortDirection = 'asc' | 'desc'

export function SupplierLedgerPurchase({ 
  supplierId, 
  supplierName, 
  supplierPhone = '', 
  supplierAddress = '',
  initialBalance = 0,
  onBack
}: SupplierLedgerPurchaseProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [credits, setCredits] = useState<SupplierCredit[]>([])
  const [transactions, setTransactions] = useState<SupplierCreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("past30days")
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportTimePeriod, setExportTimePeriod] = useState("past30days")
  const [exportCustomStart, setExportCustomStart] = useState("")
  const [exportCustomEnd, setExportCustomEnd] = useState("")
  
  // Generate dynamic date options
  const exportDateOptions = useMemo(() => generateExportDateOptions(), [])
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentDescription, setPaymentDescription] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const ITEMS_PER_PAGE = 20

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!supplierId) return
      
      setLoading(true)
      try {
        const [purchasesData, creditsData, transactionsData] = await Promise.all([
          PurchaseService.getAllPurchases().then(purchases => 
            purchases.filter(purchase => purchase.supplierId === supplierId)
          ),
          SupplierCreditService.getAll<SupplierCredit>("supplierCredits").then(credits => 
            credits.filter(credit => credit.supplierId === supplierId)
          ),
          SupplierCreditService.getCreditTransactions(supplierId)
        ])
        
        setPurchases(purchasesData)
        setCredits(creditsData)
        setTransactions(transactionsData)
      } catch (error) {
        console.error("Error loading ledger data:", error)
        toast({
          title: "Error",
          description: "Failed to load ledger data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supplierId, toast])

  // Add real-time listeners for auto-refresh
  useEffect(() => {
    if (!supplierId) return

    console.log("Setting up real-time listeners for supplier:", supplierId)
    
    const unsubscribePurchases = PurchaseService.listenToPurchasesBySupplier(supplierId, (supplierPurchases) => {
      console.log("🔄 Purchases updated for supplier:", supplierName, "- Count:", supplierPurchases.length)
      setIsUpdating(true)
      setPurchases(supplierPurchases)
      setTimeout(() => setIsUpdating(false), 1000)
    })

    const unsubscribeCredits = SupplierCreditService.listenToCreditsBySupplier(supplierId, (supplierCredits) => {
      console.log("🔄 Supplier credits updated for supplier:", supplierName, "- Count:", supplierCredits.length)
      setIsUpdating(true)
      setCredits(supplierCredits)
      setTimeout(() => setIsUpdating(false), 1000)
    })

    const unsubscribeTransactions = SupplierCreditService.listenToCreditTransactions(supplierId, (transactions) => {
      console.log("🔄 Supplier credit transactions updated for supplier:", supplierName, "- Count:", transactions.length)
      setIsUpdating(true)
      setTransactions(transactions)
      setTimeout(() => setIsUpdating(false), 1000)
    })

    return () => {
      console.log("Cleaning up real-time listeners for supplier")
      unsubscribePurchases()
      unsubscribeCredits()
      unsubscribeTransactions()
    }
  }, [supplierId, supplierName])

  // Combine and process all transactions
  const ledgerTransactions: LedgerTransaction[] = useMemo(() => {
    const allTransactions: LedgerTransaction[] = []

    // Process purchases
    purchases.forEach(purchase => {
      const purchaseAmount = purchase.totalAmount || 0
      
      // Add the main purchase entry
      allTransactions.push({
        id: `purchase-${purchase.id}`,
        date: purchase.createdAt,
        type: "purchase",
        amount: purchaseAmount,
        detail: `Purchase - ${purchase.items.map(item => item.name).join(', ')}`,
        invoiceNumber: purchase.invoiceNumber,
        description: `Invoice: ${purchase.invoiceNumber}`,
        createdAt: purchase.createdAt,
        runningBalance: 0 // Will be calculated after sorting
      })

      // Add individual payment entries from payment history (for credit purchases)
      if (purchase.paymentMethod === "credit" && purchase.paymentHistory && purchase.paymentHistory.length > 0) {
        purchase.paymentHistory.forEach((payment) => {
          allTransactions.push({
            id: `payment-${purchase.id}-${payment.id}`,
            date: payment.date,
            type: "payment",
            amount: payment.amount,
            detail: `Payment for ${purchase.invoiceNumber} - ${payment.method}`,
            invoiceNumber: purchase.invoiceNumber,
            description: payment.notes || `Payment via ${payment.method}`,
            createdAt: payment.date,
            runningBalance: 0 // Will be calculated after sorting
          })
        })
      }
    })

    // Process credit transactions (payments)
    credits.forEach(credit => {
      if (credit.type === "credit") {
        allTransactions.push({
          id: `credit-${credit.id}`,
          date: credit.createdAt,
          type: "payment",
          amount: credit.amount,
          detail: `Credit - ${credit.reason}`,
          description: credit.description || `Credit: ${credit.reason}`,
          createdAt: credit.createdAt,
          runningBalance: 0 // Will be calculated after sorting
        })
      } else if (credit.type === "debit") {
        allTransactions.push({
          id: `debit-${credit.id}`,
          date: credit.createdAt,
          type: "debit",
          amount: credit.amount,
          detail: `Debit - ${credit.reason}`,
          description: credit.description || `Debit: ${credit.reason}`,
          createdAt: credit.createdAt,
          runningBalance: 0 // Will be calculated after sorting
        })
      }
    })

    // Process credit usage transactions
    transactions.forEach(transaction => {
      if (transaction.type === "used") {
        allTransactions.push({
          id: `used-${transaction.id}`,
          date: transaction.createdAt,
          type: "purchase",
          amount: transaction.amount,
          detail: `Credit Used - ${transaction.description}`,
          invoiceNumber: transaction.invoiceNumber,
          description: transaction.description,
          createdAt: transaction.createdAt,
          runningBalance: 0 // Will be calculated after sorting
        })
      } else if (transaction.type === "refunded") {
        allTransactions.push({
          id: `refund-${transaction.id}`,
          date: transaction.createdAt,
          type: "payment",
          amount: transaction.amount,
          detail: `Credit Refund - ${transaction.description}`,
          invoiceNumber: transaction.invoiceNumber,
          description: transaction.description,
          createdAt: transaction.createdAt,
          runningBalance: 0 // Will be calculated after sorting
        })
      }
    })

    // First calculate running balance in chronological order (oldest to newest)
    const chronologicalTransactions = allTransactions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    let runningBalance = initialBalance
    const transactionsWithBalance = chronologicalTransactions.map(transaction => {
      if (transaction.type === "purchase" || transaction.type === "debit") {
        // Purchase or debit increases balance (supplier owes more)
        runningBalance += transaction.amount
      } else if (transaction.type === "payment") {
        // Payment reduces balance (supplier owes less)
        runningBalance -= transaction.amount
      }
      
      return {
        ...transaction,
        runningBalance
      }
    })
    
    // Keep chronological order (oldest to newest) for proper running balance flow
    return transactionsWithBalance
  }, [purchases, credits, transactions, initialBalance])

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = ledgerTransactions.filter(transaction => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          transaction.detail.toLowerCase().includes(searchLower) ||
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.invoiceNumber?.toLowerCase().includes(searchLower) ||
          transaction.type.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Monthly filter (past 30 days by default, or specific month)
      if (monthFilter && monthFilter !== "all") {
        const transactionDate = new Date(transaction.createdAt)
        const now = new Date()
        
        if (monthFilter === "past30days") {
          // Show past 30 days
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
          if (transactionDate < thirtyDaysAgo) return false
        } else {
          // Show specific month
          const transactionYear = transactionDate.getFullYear()
          const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0')
          const transactionMonthKey = `${transactionYear}-${transactionMonth}`
          
          if (transactionMonthKey !== monthFilter) return false
        }
      }

      // Date filter (additional filtering)
      if (dateFilter !== "all") {
        const transactionDate = new Date(transaction.createdAt)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24))
        
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

      // Type filter
      if (typeFilter !== "all") {
        if (transaction.type !== typeFilter) return false
      }

      return true
    })

    // Sort transactions
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
  }, [ledgerTransactions, searchTerm, monthFilter, dateFilter, typeFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTransactions = filteredAndSortedTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, monthFilter, dateFilter, typeFilter])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'date' ? 'desc' : 'asc')
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Receipt className="h-4 w-4 text-destructive" />
      case 'payment':
        return <CreditCard className="h-4 w-4 text-primary" />
      case 'credit':
        return <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'debit':
        return <Minus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      default:
        return <DollarSign className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return "text-destructive"
      case 'payment':
        return "text-primary"
      case 'credit':
        return "text-green-600 dark:text-green-400"
      case 'debit':
        return "text-orange-600 dark:text-orange-400"
      default:
        return "text-muted-foreground"
    }
  }

  const formatCurrency = (amount: number) => {
    return `Rs${amount.toLocaleString()}`
  }


  // Filter transactions for export based on time period
  const getExportTransactions = (timePeriod: string, customStart?: string, customEnd?: string) => {
    return ledgerTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt)
      const now = new Date()
      
      switch (timePeriod) {
        case "past30days":
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
          return transactionDate >= thirtyDaysAgo
        case "all":
          return true
        case "custom":
          if (!customStart || !customEnd) return false
          const startDate = new Date(customStart)
          const endDate = new Date(customEnd)
          return transactionDate >= startDate && transactionDate <= endDate
        default:
          // Specific month
          const transactionYear = transactionDate.getFullYear()
          const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0')
          const transactionMonthKey = `${transactionYear}-${transactionMonth}`
          return transactionMonthKey === timePeriod
      }
    })
  }

  // Get time period label for file naming
  const getTimePeriodLabel = (timePeriod: string, customStart?: string, customEnd?: string) => {
    switch (timePeriod) {
      case "past30days":
        return "past30days"
      case "all":
        return "alltime"
      case "custom":
        return `custom-${customStart}-to-${customEnd}`
      default:
        return timePeriod
    }
  }

  const handleExportDialog = () => {
    setExportTimePeriod("past30days")
    setExportCustomStart("")
    setExportCustomEnd("")
    setShowExportDialog(true)
  }

  const handlePaymentDialog = () => {
    setPaymentAmount("")
    setPaymentMethod("")
    setPaymentDescription("")
    setShowPaymentDialog(true)
  }

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in payment amount and method",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      // Check if there are any pending purchases
      const pendingPurchases = purchases.filter(purchase => 
        purchase.paymentStatus === "pending"
      )

      if (pendingPurchases.length === 0) {
        toast({
          title: "No Pending Purchases",
          description: "No pending purchases found to apply payment to.",
          variant: "destructive",
        })
        return
      }

      // Create a single credit entry for the global payment
      const paymentData = {
        supplierId,
        type: "credit" as const,
        amount,
        reason: `Payment via ${paymentMethod}`,
        description: paymentDescription || `Global payment against pending balance`,
        createdAt: new Date().toISOString(),
      }

      await SupplierCreditService.create("supplierCredits", paymentData)
      
      // Reload data to refresh the ledger
      const [purchasesData, creditsData, transactionsData] = await Promise.all([
        PurchaseService.getAllPurchases().then(purchases => 
          purchases.filter(purchase => purchase.supplierId === supplierId)
        ),
        SupplierCreditService.getAll<SupplierCredit>("supplierCredits").then(credits => 
          credits.filter(credit => credit.supplierId === supplierId)
        ),
        SupplierCreditService.getCreditTransactions(supplierId)
      ])
      
      setPurchases(purchasesData)
      setCredits(creditsData)
      setTransactions(transactionsData)

      setShowPaymentDialog(false)
      setPaymentAmount("")
      setPaymentMethod("")
      setPaymentDescription("")
      
      toast({
        title: "Success",
        description: `Payment of Rs${amount.toLocaleString()} recorded successfully`,
      })
    } catch (error) {
      console.error("Error recording payment:", error)
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const exportToCSV = () => {
    const exportTransactions = getExportTransactions(exportTimePeriod, exportCustomStart, exportCustomEnd)
    
    const csvContent = [
      ['Date', 'Detail', 'Payment', 'Purchase', 'Running Balance'],
      ...exportTransactions.map(transaction => [
        formatDate(transaction.date),
        transaction.detail,
        transaction.type === 'payment' ? formatCurrency(transaction.amount) : '',
        transaction.type === 'purchase' ? formatCurrency(transaction.amount) : '',
        formatCurrency(transaction.runningBalance)
      ])
    ].map(row => row.join(',')).join('\n')

    const timePeriodLabel = getTimePeriodLabel(exportTimePeriod, exportCustomStart, exportCustomEnd)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${supplierName}-ledger-${timePeriodLabel}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    setShowExportDialog(false)
    toast({
      title: "Success",
      description: "CSV report exported successfully",
    })
  }

  const exportToPDF = () => {
    const exportTransactions = getExportTransactions(exportTimePeriod, exportCustomStart, exportCustomEnd)
    
    const totalPurchases = exportTransactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalPayments = exportTransactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${supplierName} - Supplier Ledger Report</title>
            <style>
              @page { 
                margin: 0.5in; 
                size: A4;
              }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: #f8f9fa;
                line-height: 1.6;
                color: #333;
              }
              .report-container {
                background: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 100%;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
              }
              .header h1 { 
                margin: 0 0 10px 0; 
                font-size: 28px; 
                color: #1e40af;
                font-weight: 700;
              }
              .header h2 { 
                margin: 0; 
                font-size: 18px; 
                color: #64748b;
                font-weight: 400;
              }
              .report-info { 
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px; 
                background: #f8fafc;
                padding: 20px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
              }
              .info-section h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #475569;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .info-section p { 
                margin: 5px 0; 
                font-size: 13px;
                color: #64748b;
              }
              .summary { 
                margin-bottom: 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 25px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
              }
              .summary h3 { 
                margin: 0 0 20px 0; 
                font-size: 20px;
                text-align: center;
                font-weight: 600;
              }
              .summary-grid { 
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
              }
              .summary-item { 
                background: rgba(255, 255, 255, 0.1);
                padding: 15px;
                border-radius: 6px;
                text-align: center;
              }
              .summary-label { 
                display: block;
                font-size: 12px;
                opacity: 0.9;
                margin-bottom: 5px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .summary-value { 
                font-size: 18px;
                font-weight: 700;
              }
              .table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px; 
                font-size: 13px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .table th { 
                background: #1e40af;
                color: white;
                padding: 15px 12px; 
                text-align: left; 
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .table td { 
                border-bottom: 1px solid #e2e8f0; 
                padding: 12px; 
                text-align: left;
                background: white;
              }
              .table tr:nth-child(even) td {
                background: #f8fafc;
              }
              .table tr:hover td {
                background: #e0f2fe;
              }
              .table tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .table thead {
                display: table-header-group;
                page-break-after: avoid;
                break-after: avoid;
              }
              .amount-positive { color: #059669; font-weight: 600; }
              .amount-negative { color: #dc2626; font-weight: 600; }
              .amount-neutral { color: #64748b; font-weight: 500; }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #64748b;
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
                padding-top: 15px;
              }
              @media print {
                body { background: white; }
                .report-container { box-shadow: none; }
                .table { 
                  page-break-inside: auto;
                  break-inside: auto;
                }
                .table tr { 
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="report-container">
              <div class="header">
                <h1>Supplier Ledger Report</h1>
                <h2>${supplierName}</h2>
              </div>
              
              <div class="report-info">
                <div class="info-section">
                  <h3>Supplier Details</h3>
                  <p><strong>Phone:</strong> ${supplierPhone}</p>
                  <p><strong>Address:</strong> ${supplierAddress}</p>
                </div>
                <div class="info-section">
                  <h3>Report Details</h3>
                  <p><strong>Period:</strong> ${
                    exportTimePeriod === "past30days" ? "Past 30 Days" :
                    exportTimePeriod === "all" ? "All Time" :
                    exportTimePeriod === "custom" ? `${exportCustomStart} to ${exportCustomEnd}` :
                    new Date(exportTimePeriod + '-01').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })
                  }</p>
                  <p><strong>Generated:</strong> ${formatDateTime(new Date())}</p>
                </div>
              </div>
               
              <div class="summary">
                <h3>Financial Summary</h3>
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="summary-label">Latest Running Balance</span>
                    <span class="summary-value">${formatCurrency(exportTransactions[exportTransactions.length - 1]?.runningBalance || 0)}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Total Purchases</span>
                    <span class="summary-value">${formatCurrency(totalPurchases)}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Total Payments</span>
                    <span class="summary-value">${formatCurrency(totalPayments)}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Transactions</span>
                    <span class="summary-value">${exportTransactions.length}</span>
                  </div>
                </div>
              </div>
               
              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Detail</th>
                    <th>Payment</th>
                    <th>Purchase</th>
                    <th>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${exportTransactions.map(transaction => `
                    <tr>
                      <td>${formatDate(transaction.date)}</td>
                      <td>${transaction.detail}</td>
                      <td class="${transaction.type === 'payment' ? 'amount-positive' : 'amount-neutral'}">${transaction.type === 'payment' ? formatCurrency(transaction.amount) : '-'}</td>
                      <td class="${transaction.type === 'purchase' ? 'amount-negative' : 'amount-neutral'}">${transaction.type === 'purchase' ? formatCurrency(transaction.amount) : '-'}</td>
                      <td class="${transaction.runningBalance >= 0 ? 'amount-positive' : 'amount-negative'}">${formatCurrency(transaction.runningBalance)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="footer">
                <p>This report was generated on ${formatDateTime(new Date())} | Bin Sultan Fabrics Management System</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
    
    setShowExportDialog(false)
    toast({
      title: "Success",
      description: "PDF report generated successfully",
    })
  }

  const exportToWhatsApp = async () => {
    if (!supplierPhone) {
      toast({
        title: "Missing Phone Number",
        description: "Supplier phone number not available for WhatsApp",
        variant: "destructive",
      })
      return
    }

    try {
      const exportTransactions = getExportTransactions(exportTimePeriod, exportCustomStart, exportCustomEnd)
      
      const totalPurchases = exportTransactions
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0)
      const totalPayments = exportTransactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0)
      
      // Generate HTML content for PDF
      const htmlContent = `
        <html>
          <head>
            <title>${supplierName} - Supplier Ledger Report</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white;
                line-height: 1.6;
                color: #1a1a1a;
                font-weight: 400;
              }
              .report-container {
                background: white;
                padding: 30px;
                max-width: 100%;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
              }
              .header h1 { 
                margin: 0 0 10px 0; 
                font-size: 28px; 
                color: #1e40af;
                font-weight: 700;
              }
              .header h2 { 
                margin: 0; 
                font-size: 18px; 
                color: #374151;
                font-weight: 500;
              }
              .summary { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); 
                gap: 12px; 
                margin-bottom: 20px; 
              }
              .summary-card { 
                background: #f8fafc; 
                padding: 12px; 
                border-radius: 4px; 
                text-align: center;
                border: 1px solid #e2e8f0;
              }
              .summary-card h3 { 
                margin: 0 0 10px 0; 
                font-size: 14px; 
                color: #4b5563; 
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
              }
              .summary-card .value { 
                font-size: 24px; 
                font-weight: 700; 
                color: #1e40af;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 12px;
                background: white;
                border-radius: 4px;
                overflow: hidden;
                box-shadow: 0 1px 1px rgba(0,0,0,0.03);
              }
              th, td { 
                padding: 8px 10px; 
                text-align: left; 
                border-bottom: 1px solid #e2e8f0;
              }
              th { 
                background: #f8fafc; 
                font-weight: 600; 
                color: #1f2937;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              td { 
                font-size: 14px;
                color: #1a1a1a;
                font-weight: 400;
              }
              .positive { color: #059669; font-weight: 600; }
              .negative { color: #dc2626; font-weight: 600; }
              .footer { 
                margin-top: 30px; 
                text-align: center; 
                color: #4b5563; 
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
                font-weight: 400;
              }
            </style>
          </head>
          <body>
            <div class="report-container">
              <div class="header">
                <h1>Supplier Ledger Report</h1>
                <h2>${supplierName}</h2>
                <p style="color: #374151; font-weight: 500;">Generated on ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="summary">
                <div class="summary-card">
                  <h3>Total Purchases</h3>
                  <div class="value">Rs${totalPurchases.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                  <h3>Total Payments</h3>
                  <div class="value">Rs${totalPayments.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                  <h3>Current Balance</h3>
                  <div class="value">Rs${exportTransactions[exportTransactions.length - 1]?.runningBalance.toLocaleString() || '0'}</div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Detail</th>
                    <th>Payment</th>
                    <th>Purchase</th>
                    <th>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${exportTransactions.map(transaction => `
                    <tr>
                      <td>${formatDate(transaction.date)}</td>
                      <td>${transaction.detail}</td>
                      <td class="${transaction.type === 'payment' ? 'positive' : ''}">${transaction.type === 'payment' ? `Rs${transaction.amount.toLocaleString()}` : ''}</td>
                      <td class="${transaction.type === 'purchase' ? 'negative' : ''}">${transaction.type === 'purchase' ? `Rs${transaction.amount.toLocaleString()}` : ''}</td>
                      <td class="${transaction.runningBalance >= 0 ? 'negative' : 'positive'}">Rs${transaction.runningBalance.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="footer">
                <p style="color: #4b5563; font-weight: 500;">This report was generated on ${new Date().toLocaleString()}</p>
                <p style="color: #4b5563; font-weight: 500;">Bin Sultan Fabrics Management System</p>
              </div>
            </div>
          </body>
        </html>
      `

      // Generate PDF blob
      const pdfBlob = await generatePDFFromHTML(htmlContent, {
        fileName: `${supplierName}-ledger-${exportTimePeriod}-${new Date().toISOString().split('T')[0]}.pdf`,
        width: 800
        // Remove height constraint to allow dynamic sizing
      })

      // Share via WhatsApp
      const timePeriodLabel = exportTimePeriod === 'custom' 
        ? `${exportCustomStart} to ${exportCustomEnd}`
        : exportTimePeriod.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())

      const message = `Hi ${supplierName}! Here's your supplier ledger report for ${timePeriodLabel}. Please find the detailed report attached.`
      
      await sharePDFViaWhatsApp({
        phoneNumber: supplierPhone,
        message,
        fileName: `${supplierName}-ledger-${exportTimePeriod}-${new Date().toISOString().split('T')[0]}.pdf`,
        fileBlob: pdfBlob,
        fileType: 'application/pdf'
      })

      setShowExportDialog(false)
      toast({
        title: "Success",
        description: "PDF report sent to WhatsApp successfully",
      })
    } catch (error) {
      console.error("Error sharing PDF via WhatsApp:", error)
      toast({
        title: "Error",
        description: "Failed to share PDF via WhatsApp. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Supplier Ledger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading ledger data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Supplier Ledger - {supplierName}
            </CardTitle>
             <div className="flex gap-2">
               {onBack && (
                 <Button onClick={onBack} variant="outline" size="sm">
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Back
                 </Button>
               )}
               <Button onClick={handlePaymentDialog} variant="default" size="sm">
                 <Wallet className="h-4 w-4 mr-2" />
                 Record Payment
               </Button>
               <Button onClick={handleExportDialog} variant="outline" size="sm">
                 <Download className="h-4 w-4 mr-2" />
                 Export Report
               </Button>
             </div>
          </div>
        </CardHeader>
      </Card>

      {/* Ledger Summary */}
      {ledgerTransactions.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center justify-center gap-2">
                  Latest Running Balance
                  {isUpdating && (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(ledgerTransactions[ledgerTransactions.length - 1]?.runningBalance || initialBalance)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Payments</p>
                <p className="text-xl font-semibold text-primary">
                  {formatCurrency(ledgerTransactions
                    .filter(t => t.type === 'payment')
                    .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Transactions</p>
                <p className="text-xl font-semibold text-foreground">
                  {ledgerTransactions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Label htmlFor="month-filter">Time Period</Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="past30days">Past 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="2024-01">January 2024</SelectItem>
                  <SelectItem value="2024-02">February 2024</SelectItem>
                  <SelectItem value="2024-03">March 2024</SelectItem>
                  <SelectItem value="2024-04">April 2024</SelectItem>
                  <SelectItem value="2024-05">May 2024</SelectItem>
                  <SelectItem value="2024-06">June 2024</SelectItem>
                  <SelectItem value="2024-07">July 2024</SelectItem>
                  <SelectItem value="2024-08">August 2024</SelectItem>
                  <SelectItem value="2024-09">September 2024</SelectItem>
                  <SelectItem value="2024-10">October 2024</SelectItem>
                  <SelectItem value="2024-11">November 2024</SelectItem>
                  <SelectItem value="2024-12">December 2024</SelectItem>
                  <SelectItem value="2023-01">January 2023</SelectItem>
                  <SelectItem value="2023-02">February 2023</SelectItem>
                  <SelectItem value="2023-03">March 2023</SelectItem>
                  <SelectItem value="2023-04">April 2023</SelectItem>
                  <SelectItem value="2023-05">May 2023</SelectItem>
                  <SelectItem value="2023-06">June 2023</SelectItem>
                  <SelectItem value="2023-07">July 2023</SelectItem>
                  <SelectItem value="2023-08">August 2023</SelectItem>
                  <SelectItem value="2023-09">September 2023</SelectItem>
                  <SelectItem value="2023-10">October 2023</SelectItem>
                  <SelectItem value="2023-11">November 2023</SelectItem>
                  <SelectItem value="2023-12">December 2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search transactions..."
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
              <Label htmlFor="type-filter">Transaction Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="credit">Credits</SelectItem>
                  <SelectItem value="debit">Debits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setMonthFilter("past30days")
                  setDateFilter("all")
                  setTypeFilter("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="border-2 border-border shadow-lg">
        <CardHeader className="bg-muted/50 border-b-2 border-border">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Receipt className="h-6 w-6 text-primary" />
            Supplier Ledger - {supplierName}
            <Badge variant="outline" className="ml-auto">
              {filteredAndSortedTransactions.length} entries
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Showing records for: {
                monthFilter === "past30days" 
                  ? "Past 30 Days" 
                  : monthFilter === "all"
                  ? "All Time"
                  : new Date(monthFilter + '-01').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })
              }
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4 text-lg">No transactions found for {supplierName}</p>
              <p className="text-sm text-muted-foreground">
                No records found for {
                  monthFilter === "past30days" 
                    ? "Past 30 Days" 
                    : monthFilter === "all"
                    ? "All Time"
                    : new Date(monthFilter + '-01').toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })
                }. Try selecting a different time period or adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              <div className="overflow-x-auto">
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="bg-muted border-b-2 border-border">
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 text-right font-bold text-foreground border-r border-border py-4 px-6"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-2 justify-end">
                          Date
                          <Calendar className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-bold text-foreground border-r border-border py-4 px-6">Detail</TableHead>
                      <TableHead className="text-right font-bold text-foreground border-r border-border py-4 px-6">Payment</TableHead>
                      <TableHead className="text-right font-bold text-foreground border-r border-border py-4 px-6">Purchase</TableHead>
                      <TableHead className="text-right font-bold text-foreground py-4 px-6">Running Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction, index) => (
                      <TableRow 
                        key={transaction.id} 
                        className={`hover:bg-muted/50 border-b border-border ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                      >
                        <TableCell className="text-right border-r border-border py-3 px-6">
                          <div className="flex items-center gap-2 justify-end">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{formatDate(transaction.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right border-r border-border py-3 px-6">
                          <div className="flex items-center gap-2 justify-end">
                            {getTransactionTypeIcon(transaction.type)}
                            <div>
                              <p className="font-medium text-foreground">{transaction.detail}</p>
                              {transaction.invoiceNumber && (
                                <p className="text-sm text-muted-foreground">
                                  {transaction.invoiceNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right border-r border-border py-3 px-6">
                          {transaction.type === 'payment' ? (
                            <span className={`font-bold text-lg ${getTransactionTypeColor(transaction.type)}`}>
                              {formatCurrency(transaction.amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-lg">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right border-r border-border py-3 px-6">
                          {transaction.type === 'purchase' ? (
                            <span className={`font-bold text-lg ${getTransactionTypeColor(transaction.type)}`}>
                              {formatCurrency(transaction.amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-lg">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-3 px-6">
                          <span className="font-bold text-lg text-foreground">
                            {formatCurrency(transaction.runningBalance)}
                          </span>
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
                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
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
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment received from {supplierName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-amount">Payment Amount (Rs)</Label>
              <Input
                id="payment-amount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="payment-description">Description (Optional)</Label>
              <Input
                id="payment-description"
                placeholder="Payment description or reference (optional)"
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handlePaymentSubmit} 
                className="flex-1"
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? "Recording..." : "Record Payment"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Supplier Ledger Report</DialogTitle>
            <DialogDescription>
              Choose the time period for your report export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="export-time-period">Time Period</Label>
              <Select value={exportTimePeriod} onValueChange={setExportTimePeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exportDateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportTimePeriod === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-start">Start Date</Label>
                  <Input
                    id="custom-start"
                    type="date"
                    value={exportCustomStart}
                    onChange={(e) => setExportCustomStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="custom-end">End Date</Label>
                  <Input
                    id="custom-end"
                    type="date"
                    value={exportCustomEnd}
                    onChange={(e) => setExportCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={exportToCSV} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={exportToPDF} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={exportToWhatsApp} className="flex-1" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
