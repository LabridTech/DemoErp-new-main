"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Search, Building2, Phone, MapPin, TrendingUp, TrendingDown, CreditCard, DollarSign, PlusCircle } from "lucide-react"
import { SupplierService, SupplierCreditService, PurchaseService, type Supplier, type SupplierCredit, type Purchase } from "@/lib/firebase-services"
import { DateRangeFilter, DateFilterType } from "@/components/ui/date-range-filter"
import { useToast } from "@/hooks/use-toast"
import { SupplierDeleteDialog } from "@/components/modules/supplier-management/supplier-delete-dialog"
import { SupplierCreditDialog } from "@/components/modules/supplier-management/supplier-credit-dialog"
import { SupplierDetail } from "@/components/modules/supplier-management/supplier-detail"

export function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [balanceAdjustmentSupplier, setBalanceAdjustmentSupplier] = useState<Supplier | null>(null)
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false)
  const [creditDialogSupplier, setCreditDialogSupplier] = useState<Supplier | null>(null)
  const [supplierCredits, setSupplierCredits] = useState<{ [supplierId: string]: number }>({})
  const [supplierRunningBalances, setSupplierRunningBalances] = useState<{ [supplierId: string]: number }>({})
  const [isCalculatingBalances, setIsCalculatingBalances] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isQuickCreditDialogOpen, setIsQuickCreditDialogOpen] = useState(false)
  const [isQuickDueDialogOpen, setIsQuickDueDialogOpen] = useState(false)
  const [quickActionSupplier, setQuickActionSupplier] = useState<Supplier | null>(null)
  const [quickCreditAmount, setQuickCreditAmount] = useState("")
  const [quickDueAmount, setQuickDueAmount] = useState("")
  const { toast } = useToast()

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    address: "",
    balance: 0,
    credit: 0
  })

  const [editingSupplierData, setEditingSupplierData] = useState({
    name: "",
    phone: "",
    address: "",
    balance: 0,
    credit: 0
  })

  const [balanceAdjustment, setBalanceAdjustment] = useState({
    amount: 0,
    type: "add" as "add" | "subtract",
    reason: ""
  })

  // Date filter and stats state
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("new_ver")
  const [startDate, setStartDate] = useState<Date | null>(() => {
    return new Date(2026, 1, 17); // Feb 17, 2026
  })
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([])
  const [allCreditTransactions, setAllCreditTransactions] = useState<SupplierCredit[]>([])

  // Load suppliers from Firebase
  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true)
      const suppliersData = await SupplierService.getAllSuppliers()

      // Remove duplicates based on ID to prevent React key conflicts
      const uniqueSuppliers = suppliersData.filter((supplier, index, self) =>
        index === self.findIndex(s => s.id === supplier.id)
      )

      // Debug: Log if duplicates were found
      if (suppliersData.length !== uniqueSuppliers.length) {
        console.warn(`Found ${suppliersData.length - uniqueSuppliers.length} duplicate suppliers, removed them`)
      }

      setSuppliers(uniqueSuppliers)
    } catch (error) {
      console.error("Error loading suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to load suppliers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  // Load supplier credits
  useEffect(() => {
    const loadSupplierCredits = async () => {
      if (suppliers.length === 0) return

      try {
        const credits: { [supplierId: string]: number } = {}
        for (const supplier of suppliers) {
          const totalCredit = await SupplierCreditService.getTotalAvailableCredit(supplier.id)
          credits[supplier.id] = totalCredit
        }
        setSupplierCredits(credits)
      } catch (error) {
        console.error("Error loading supplier credits:", error)
      }
    }

    loadSupplierCredits()
  }, [suppliers])

  // Calculate running balance for each supplier (optimized)
  useEffect(() => {
    const calculateRunningBalances = async () => {
      if (suppliers.length === 0) return

      // Show initial balances immediately
      const initialBalances: { [supplierId: string]: number } = {}
      suppliers.forEach(supplier => {
        initialBalances[supplier.id] = supplier.balance || 0
      })
      setSupplierRunningBalances(initialBalances)

      setIsCalculatingBalances(true)

      try {
        // Load all data in parallel instead of per supplier
        const [allPurchasesData, allCreditsData, allTransactions] = await Promise.all([
          PurchaseService.getAllPurchases(),
          SupplierCreditService.getAll<SupplierCredit>("supplierCredits"),
          // Get transactions for all suppliers at once
          Promise.all(suppliers.map(supplier =>
            SupplierCreditService.getCreditTransactions(supplier.id)
          )).then(transactionArrays =>
            transactionArrays.flat().reduce((acc, transaction) => {
              if (!acc[transaction.supplierId]) acc[transaction.supplierId] = []
              acc[transaction.supplierId].push(transaction)
              return acc
            }, {} as {
              [supplierId: string]: Array<{
                id: string
                supplierId: string
                amount: number
                type: string
                description: string
                createdAt: string
              }>
            })
          )
        ])

        setAllPurchases(allPurchasesData)
        setAllCreditTransactions(allCreditsData)

        const balances: { [supplierId: string]: number } = {}

        // Process each supplier
        for (const supplier of suppliers) {
          // Filter data for this supplier
          const supplierPurchases = allPurchasesData.filter(p => p.supplierId === supplier.id)
          const supplierCredits = allCreditsData.filter(c => c.supplierId === supplier.id)
          const supplierTransactions = allTransactions[supplier.id] || []

          // Combine all transactions
          const allSupplierTransactions: Array<{
            date: string
            type: 'purchase' | 'payment' | 'debit'
            amount: number
          }> = []

          // Add purchases
          supplierPurchases.forEach(purchase => {
            allSupplierTransactions.push({
              date: purchase.createdAt,
              type: 'purchase',
              amount: purchase.totalAmount || 0
            })

            // Add payment history entries for credit purchases
            if (purchase.paymentMethod === "credit" && purchase.paymentHistory && purchase.paymentHistory.length > 0) {
              purchase.paymentHistory.forEach(payment => {
                allSupplierTransactions.push({
                  date: payment.date,
                  type: 'payment',
                  amount: payment.amount
                })
              })
            }

            // Add partial payment entries if partialPaymentAmount exists (from purchasing ledger payments)
            const partialAmount = parseFloat(purchase.partialPaymentAmount || "0") || 0
            const paymentHistoryTotal = purchase.paymentHistory ?
              purchase.paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0) : 0

            if (partialAmount > 0 && partialAmount !== paymentHistoryTotal) {
              allSupplierTransactions.push({
                date: purchase.createdAt,
                type: 'payment',
                amount: partialAmount
              })
            }
          })

          // Add credit transactions
          supplierCredits.forEach(credit => {
            if (credit.type === "credit") {
              allSupplierTransactions.push({
                date: credit.createdAt,
                type: 'payment',
                amount: credit.amount
              })
            }
          })

          // Add used credit transactions
          supplierTransactions.forEach(transaction => {
            if (transaction.type === "used") {
              allSupplierTransactions.push({
                date: transaction.createdAt,
                type: 'purchase',
                amount: transaction.amount
              })
            } else if (transaction.type === "refunded") {
              allSupplierTransactions.push({
                date: transaction.createdAt,
                type: 'payment',
                amount: transaction.amount
              })
            }
          })

          // Sort chronologically and calculate running balance
          const sortedTransactions = allSupplierTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          let runningBalance = supplier.balance || 0

          sortedTransactions.forEach(transaction => {
            if (transaction.type === 'purchase' || transaction.type === 'debit') {
              runningBalance += transaction.amount
            } else if (transaction.type === 'payment') {
              runningBalance -= transaction.amount
            }
          })

          balances[supplier.id] = runningBalance
        }

        setSupplierRunningBalances(balances)
      } catch (error) {
        console.error("Error calculating running balances:", error)
        // Fallback to supplier balance if calculation fails
        const fallbackBalances: { [supplierId: string]: number } = {}
        suppliers.forEach(supplier => {
          fallbackBalances[supplier.id] = supplier.balance || 0
        })
        setSupplierRunningBalances(fallbackBalances)
      } finally {
        setIsCalculatingBalances(false)
      }
    }

    calculateRunningBalances()
  }, [suppliers])

  // Filter suppliers based on search term and ensure uniqueness
  const filteredSuppliers = suppliers
    .filter((supplier) =>
      (supplier.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.address || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((supplier, index, self) =>
      // Remove duplicates based on ID
      index === self.findIndex(s => s.id === supplier.id)
    )

  // Add new supplier
  const handleAddSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a supplier name",
        variant: "destructive",
      })
      return
    }

    try {
      // Create supplier
      const createdSupplier = await SupplierService.createSupplier({
        name: newSupplier.name,
        phone: newSupplier.phone,
        address: newSupplier.address,
        balance: newSupplier.balance,
        createdAt: new Date().toISOString(),
      })

      // Add initial credit if specified
      if (newSupplier.credit > 0) {
        const supplierId = typeof createdSupplier === 'string' ? createdSupplier : (createdSupplier as { id: string }).id
        await SupplierCreditService.createCredit({
          supplierId: supplierId,
          supplierName: newSupplier.name,
          amount: newSupplier.credit,
          type: "credit",
          reason: "Initial credit",
          description: `Initial credit of Rs${newSupplier.credit.toLocaleString()}`,
          createdBy: "admin", // TODO: Get from auth context
          status: "active",
          createdAt: new Date().toISOString()
        })
      }

      setNewSupplier({ name: "", phone: "", address: "", balance: 0, credit: 0 })
      setIsAddDialogOpen(false)

      // Reload suppliers and credits
      const suppliersData = await SupplierService.getAllSuppliers()
      const uniqueSuppliers = suppliersData.filter((supplier, index, self) =>
        index === self.findIndex(s => s.id === supplier.id)
      )
      setSuppliers(uniqueSuppliers)

      // Reload credits
      const creditsData = await SupplierCreditService.getAll<SupplierCredit>("supplierCredits")
      const creditsBySupplier: { [supplierId: string]: number } = {}
      creditsData.forEach(credit => {
        if (credit.status === "active") {
          creditsBySupplier[credit.supplierId] = (creditsBySupplier[credit.supplierId] || 0) + (credit.remainingAmount || 0)
        }
      })
      setSupplierCredits(creditsBySupplier)

      toast({
        title: "Success",
        description: "Supplier added successfully",
      })
    } catch (error) {
      console.error("Error adding supplier:", error)
      toast({
        title: "Error",
        description: "Failed to add supplier. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Edit supplier
  const handleEditSupplier = async () => {
    if (!editingSupplier || !editingSupplierData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a supplier name",
        variant: "destructive",
      })
      return
    }

    try {
      // Update supplier basic info
      await SupplierService.updateSupplier(editingSupplier.id, {
        name: editingSupplierData.name,
        phone: editingSupplierData.phone,
        address: editingSupplierData.address,
        balance: editingSupplierData.balance
      })

      // Handle credit update separately
      const currentCredit = supplierCredits[editingSupplier.id] || 0
      const newCredit = editingSupplierData.credit

      if (newCredit !== currentCredit) {
        if (newCredit > currentCredit) {
          // Add credit
          const creditToAdd = newCredit - currentCredit
          await SupplierCreditService.createCredit({
            supplierId: editingSupplier.id,
            supplierName: editingSupplierData.name,
            amount: creditToAdd,
            type: "credit",
            reason: "Manual adjustment",
            description: `Credit increased by Rs${creditToAdd.toLocaleString()}`,
            createdBy: "admin", // TODO: Get from auth context
            status: "active",
            createdAt: new Date().toISOString()
          })
        } else if (newCredit < currentCredit) {
          // Reduce credit (this is more complex, we'd need to mark existing credits as used)
          // For now, we'll create a negative credit entry
          const creditToReduce = currentCredit - newCredit
          await SupplierCreditService.createCredit({
            supplierId: editingSupplier.id,
            supplierName: editingSupplierData.name,
            amount: creditToReduce,
            type: "debit",
            reason: "Manual adjustment",
            description: `Credit reduced by Rs${creditToReduce.toLocaleString()}`,
            createdBy: "admin", // TODO: Get from auth context
            status: "active",
            createdAt: new Date().toISOString()
          })
        }
      }

      setEditingSupplier(null)
      setEditingSupplierData({ name: "", phone: "", address: "", balance: 0, credit: 0 })
      setIsEditDialogOpen(false)

      // Reload suppliers and credits
      const suppliersData = await SupplierService.getAllSuppliers()
      const uniqueSuppliers = suppliersData.filter((supplier, index, self) =>
        index === self.findIndex(s => s.id === supplier.id)
      )
      setSuppliers(uniqueSuppliers)

      // Reload credits
      const creditsData = await SupplierCreditService.getAll<SupplierCredit>("supplierCredits")
      const creditsBySupplier: { [supplierId: string]: number } = {}
      creditsData.forEach(credit => {
        if (credit.status === "active") {
          creditsBySupplier[credit.supplierId] = (creditsBySupplier[credit.supplierId] || 0) + (credit.remainingAmount || 0)
        }
      })
      setSupplierCredits(creditsBySupplier)

      toast({
        title: "Success",
        description: "Supplier updated successfully",
      })
    } catch (error) {
      console.error("Error updating supplier:", error)
      toast({
        title: "Error",
        description: "Failed to update supplier. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete supplier
  const handleDeleteSupplier = async () => {
    if (!deletingSupplier) {
      toast({
        title: "Error",
        description: "No supplier selected for deletion",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)

    try {
      await SupplierService.deleteSupplier(deletingSupplier.id)

      // Update frontend state
      const updatedSuppliers = suppliers.filter(s => s.id !== deletingSupplier.id)
      setSuppliers(updatedSuppliers)

      // Reset states
      setDeletingSupplier(null)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting supplier:", error)
      toast({
        title: "Error",
        description: "Failed to delete supplier. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Adjust balance
  const handleAdjustBalance = async () => {
    if (!balanceAdjustmentSupplier || !balanceAdjustment.amount) {
      toast({
        title: "Error",
        description: "Please enter an amount",
        variant: "destructive",
      })
      return
    }

    try {
      const adjustmentAmount = balanceAdjustment.type === "add"
        ? balanceAdjustment.amount
        : -balanceAdjustment.amount

      await SupplierService.updateSupplier(balanceAdjustmentSupplier.id, {
        balance: (balanceAdjustmentSupplier.balance || 0) + adjustmentAmount
      })

      setBalanceAdjustmentSupplier(null)
      setBalanceAdjustment({ amount: 0, type: "add", reason: "" })
      setIsBalanceDialogOpen(false)

      // Reload suppliers
      const suppliersData = await SupplierService.getAllSuppliers()
      const uniqueSuppliers = suppliersData.filter((supplier, index, self) =>
        index === self.findIndex(s => s.id === supplier.id)
      )
      setSuppliers(uniqueSuppliers)

      toast({
        title: "Success",
        description: `Due amount ${balanceAdjustment.type === "add" ? "increased" : "decreased"} by Rs${balanceAdjustment.amount.toLocaleString()}`,
      })
    } catch (error) {
      console.error("Error adjusting balance:", error)
      toast({
        title: "Error",
        description: "Failed to adjust due amount. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Dialog handlers
  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setEditingSupplierData({
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
      balance: supplier.balance || 0,
      credit: supplierCredits[supplier.id] || 0
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (supplier: Supplier, event?: React.MouseEvent) => {
    event?.stopPropagation()
    setDeletingSupplier(supplier)
    setIsDeleteDialogOpen(true)
  }

  // const openBalanceDialog = (supplier: Supplier) => {
  //   setBalanceAdjustmentSupplier(supplier)
  //   setBalanceAdjustment({ amount: 0, type: "add", reason: "" })
  //   setIsBalanceDialogOpen(true)
  // }

  const openCreditDialog = (supplier: Supplier, event?: React.MouseEvent) => {
    event?.stopPropagation()
    setCreditDialogSupplier(supplier)
    setIsCreditDialogOpen(true)
  }

  const openSupplierDetail = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
  }

  const goBackToList = () => {
    setSelectedSupplier(null)
  }

  const openQuickCreditDialog = (supplier: Supplier, event?: React.MouseEvent) => {
    event?.stopPropagation()
    setQuickActionSupplier(supplier)
    setQuickCreditAmount("")
    setIsQuickCreditDialogOpen(true)
  }

  const openQuickDueDialog = (supplier: Supplier, event?: React.MouseEvent) => {
    event?.stopPropagation()
    setQuickActionSupplier(supplier)
    setQuickDueAmount("")
    setIsQuickDueDialogOpen(true)
  }

  const handleQuickCreditAdd = async () => {
    if (!quickActionSupplier || !quickCreditAmount) return

    const amount = parseFloat(quickCreditAmount)
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid credit amount",
        variant: "destructive",
      })
      return
    }

    try {
      await SupplierCreditService.createCredit({
        supplierId: quickActionSupplier.id,
        supplierName: quickActionSupplier.name,
        amount: amount,
        type: "credit",
        reason: "Quick Credit Addition",
        description: `Added credit of Rs${amount.toLocaleString()}`,
        createdBy: "admin",
        status: "active",
        createdAt: new Date().toISOString()
      })

      // Reload suppliers and credits
      await loadSuppliers()

      toast({
        title: "Success",
        description: `Added Rs${amount.toLocaleString()} credit to ${quickActionSupplier.name}`,
      })

      setIsQuickCreditDialogOpen(false)
      setQuickActionSupplier(null)
      setQuickCreditAmount("")
    } catch (error) {
      console.error("Error adding credit:", error)
      toast({
        title: "Error",
        description: "Failed to add credit",
        variant: "destructive",
      })
    }
  }

  const handleQuickDueAdd = async () => {
    if (!quickActionSupplier || !quickDueAmount) return

    const amount = parseFloat(quickDueAmount)
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid due amount",
        variant: "destructive",
      })
      return
    }

    try {
      const newBalance = (quickActionSupplier.balance || 0) + amount
      await SupplierService.updateSupplier(quickActionSupplier.id, {
        balance: newBalance
      })

      // Reload suppliers
      await loadSuppliers()

      toast({
        title: "Success",
        description: `Added Rs${amount.toLocaleString()} to due amount for ${quickActionSupplier.name}`,
      })

      setIsQuickDueDialogOpen(false)
      setQuickActionSupplier(null)
      setQuickDueAmount("")
    } catch (error) {
      console.error("Error adding due amount:", error)
      toast({
        title: "Error",
        description: "Failed to add due amount",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading suppliers...</p>
      </div>
    )
  }

  // Show supplier detail view if a supplier is selected
  if (selectedSupplier) {
    return (
      <SupplierDetail
        supplier={selectedSupplier}
        onBack={goBackToList}
        onSupplierUpdated={loadSuppliers}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground">Manage your suppliers and their information</p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg mr-2">
          <DateRangeFilter
            filterType={dateFilterType}
            onFilterTypeChange={setDateFilterType}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs{allPurchases
                .filter(p => {
                  if (!p.date) return false
                  let d: Date
                  if (p.date.includes('/')) {
                    const parts = p.date.split('/')
                    d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
                  } else {
                    const parts = p.date.split('T')[0].split('-')
                    d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                  }
                  if (isNaN(d.getTime())) return false
                  if (startDate && d < startDate) return false
                  if (endDate && d > endDate) return false
                  return true
                })
                .reduce((sum, p) => sum + (p.totalAmount || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs{allCreditTransactions
                .filter(c => {
                  if (!c.createdAt) return false
                  const d = new Date(c.createdAt)
                  if (startDate && d < startDate) return false
                  if (endDate && d > endDate) return false
                  // Assuming credit transactions with positive amounts are payments/credits?
                  // Need to check transaction type or assume credits add to balance?
                  // Usually "credits" table tracks *payments made* or *credits given*.
                  // Let's assume all entries in SupplierCredit are payments/adjustments.
                  return true
                })
                .reduce((sum, c) => sum + (c.amount || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Payments/Credits in period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {suppliers.length}
            </div>
            <p className="text-xs text-muted-foreground">Total registered suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rs{Object.values(supplierRunningBalances).reduce((a, b) => a + b, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total outstanding balance (All Time)</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            id="supplier-search"
            name="supplier-search"
            placeholder="Search by name, phone, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Suppliers ({filteredSuppliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Latest Running Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openSupplierDetail(supplier)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Added: {new Date(supplier.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{supplier.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(supplierRunningBalances[supplier.id] || 0) > 0 ? "destructive" : (supplierRunningBalances[supplier.id] || 0) < 0 ? "secondary" : "default"}>
                        {isCalculatingBalances ? (
                          <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (supplierRunningBalances[supplier.id] || 0) > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (supplierRunningBalances[supplier.id] || 0) < 0 ? (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        ) : null}
                        Rs{(supplierRunningBalances[supplier.id] || 0).toLocaleString()}
                        {isCalculatingBalances && (
                          <span className="ml-1 text-xs opacity-70">(calculating...)</span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => openQuickCreditDialog(supplier, e)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Add Credit"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => openQuickDueDialog(supplier, e)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Add Due Amount"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => openCreditDialog(supplier, e)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Manage Credits"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => openDeleteDialog(supplier, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Supplier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Enter the supplier information below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Supplier Name</Label>
              <Input
                id="name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                placeholder="Enter supplier name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div>
              <Label htmlFor="balance">Initial Due Amount</Label>
              <Input
                id="balance"
                type="number"
                value={newSupplier.balance}
                onChange={(e) => setNewSupplier({ ...newSupplier, balance: Number(e.target.value) })}
                placeholder="Enter initial balance"
              />
            </div>
            <div>
              <Label htmlFor="credit">Initial Credit Amount</Label>
              <Input
                id="credit"
                type="number"
                value={newSupplier.credit}
                onChange={(e) => setNewSupplier({ ...newSupplier, credit: Number(e.target.value) })}
                placeholder="Enter initial credit amount"
                min="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSupplier}>
                Add Supplier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update the supplier information below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Supplier Name</Label>
              <Input
                id="edit-name"
                value={editingSupplierData.name}
                onChange={(e) => setEditingSupplierData({ ...editingSupplierData, name: e.target.value })}
                placeholder="Enter supplier name"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editingSupplierData.phone}
                onChange={(e) => setEditingSupplierData({ ...editingSupplierData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={editingSupplierData.address}
                onChange={(e) => setEditingSupplierData({ ...editingSupplierData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div>
              <Label htmlFor="edit-balance">Due Amount</Label>
              <Input
                id="edit-balance"
                type="number"
                value={editingSupplierData.balance}
                onChange={(e) => setEditingSupplierData({ ...editingSupplierData, balance: Number(e.target.value) })}
                placeholder="Enter balance"
              />
            </div>
            <div>
              <Label htmlFor="edit-credit">Credit Amount</Label>
              <Input
                id="edit-credit"
                type="number"
                value={editingSupplierData.credit}
                onChange={(e) => setEditingSupplierData({ ...editingSupplierData, credit: Number(e.target.value) })}
                placeholder="Enter credit amount"
                min="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSupplier}>
                Update Supplier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance Adjustment Dialog */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg font-bold">Rs</span>
              Adjust Balance
            </DialogTitle>
            <DialogDescription>
              {balanceAdjustmentSupplier && `Adjust balance for ${balanceAdjustmentSupplier.name}`}
            </DialogDescription>
          </DialogHeader>
          {balanceAdjustmentSupplier && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current Due Amount</p>
                <p className="text-2xl font-bold">Rs{(balanceAdjustmentSupplier.balance || 0).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adjustment-type">Adjustment Type</Label>
                  <Select
                    value={balanceAdjustment.type}
                    onValueChange={(value: "add" | "subtract") =>
                      setBalanceAdjustment({ ...balanceAdjustment, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add to Balance</SelectItem>
                      <SelectItem value="subtract">Subtract from Balance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="adjustment-amount">Amount (Rs)</Label>
                  <Input
                    id="adjustment-amount"
                    type="number"
                    value={balanceAdjustment.amount}
                    onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, amount: Number(e.target.value) })}
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="adjustment-reason">Reason (Optional)</Label>
                <Input
                  id="adjustment-reason"
                  value={balanceAdjustment.reason}
                  onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, reason: e.target.value })}
                  placeholder="Enter reason for adjustment"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBalanceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdjustBalance}>
                  Adjust Due Amount
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Supplier Dialog */}
      <SupplierDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSupplier(null)
          }
          setIsDeleteDialogOpen(open)
        }}
        supplier={deletingSupplier}
        onConfirm={handleDeleteSupplier}
        isDeleting={isDeleting}
      />

      {/* Credit Management Dialog */}
      <SupplierCreditDialog
        isOpen={isCreditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreditDialogSupplier(null)
          }
          setIsCreditDialogOpen(open)
        }}
        supplier={creditDialogSupplier}
      />

      {/* Quick Credit Addition Dialog */}
      <Dialog open={isQuickCreditDialogOpen} onOpenChange={setIsQuickCreditDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg">Add Credit</DialogTitle>
            <DialogDescription className="text-sm">
              {quickActionSupplier?.name} • Current: Rs{(supplierCredits[quickActionSupplier?.id || ''] || 0).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="quick-credit-amount" className="text-sm">Amount (Rs)</Label>
              <Input
                id="quick-credit-amount"
                type="number"
                value={quickCreditAmount}
                onChange={(e) => setQuickCreditAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickCreditAdd()}
                placeholder="Enter amount"
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsQuickCreditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuickCreditAdd}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Due Amount Addition Dialog */}
      <Dialog open={isQuickDueDialogOpen} onOpenChange={setIsQuickDueDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg">Add Due Amount</DialogTitle>
            <DialogDescription className="text-sm">
              {quickActionSupplier?.name} • Current: Rs{(quickActionSupplier?.balance || 0).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="quick-due-amount" className="text-sm">Amount (Rs)</Label>
              <Input
                id="quick-due-amount"
                type="number"
                value={quickDueAmount}
                onChange={(e) => setQuickDueAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickDueAdd()}
                placeholder="Enter amount"
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsQuickDueDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuickDueAdd}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}