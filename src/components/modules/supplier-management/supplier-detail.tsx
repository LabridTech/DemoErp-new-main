"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building2, 
  Phone, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  Trash2, 
  DollarSign,
  Calendar
} from "lucide-react"
import { SupplierService, PurchaseService, SupplierCreditService, type Supplier, type Purchase, type SupplierCredit } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/date-utils"
import { SupplierDeleteDialog } from "./supplier-delete-dialog"
import { SupplierCreditDialog } from "./supplier-credit-dialog"
import { SupplierLedger } from "./supplier-ledger"
import { SupplierCreditsHistory } from "./supplier-credits-history"

interface SupplierDetailProps {
  supplier: Supplier | null
  onBack: () => void
  onSupplierUpdated: () => void
}

export function SupplierDetail({ supplier, onBack, onSupplierUpdated }: SupplierDetailProps) {
  const [editingSupplierData, setEditingSupplierData] = useState({
    name: "",
    phone: "",
    address: "",
    balance: 0,
    credit: 0
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [credits, setCredits] = useState<SupplierCredit[]>([])
  const [transactions, setTransactions] = useState<Array<{
    id: string
    supplierId: string
    amount: number
    type: string
    description: string
    createdAt: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true)
  const { toast } = useToast()

  // Real-time listener for purchases
  useEffect(() => {
    if (!supplier) return

    console.log("Setting up real-time listener for purchases of supplier:", supplier.id)
    setIsLoadingPurchases(true)
    
    const unsubscribe = PurchaseService.subscribeToPurchases((purchases) => {
      console.log("Real-time purchase update received:", purchases.length, "total purchases")
      const supplierPurchases = purchases.filter(purchase => purchase.supplierId === supplier.id)
      console.log("Filtered purchases for supplier:", supplierPurchases.length, "purchases")
      setPurchases(supplierPurchases)
      setIsLoadingPurchases(false)
    })

    return () => {
      console.log("Cleaning up real-time listener for purchases")
      unsubscribe()
    }
  }, [supplier])

  // Load credits and transactions data
  useEffect(() => {
    if (!supplier) return

    const loadCreditsAndTransactions = async () => {
      try {
        const [creditsData, transactionsData] = await Promise.all([
          SupplierCreditService.getAll<SupplierCredit>("supplierCredits").then(credits => 
            credits.filter(credit => credit.supplierId === supplier.id)
          ),
          SupplierCreditService.getCreditTransactions(supplier.id)
        ])
        
        setCredits(creditsData)
        setTransactions(transactionsData)
      } catch (error) {
        console.error("Error loading credits and transactions:", error)
      }
    }

    loadCreditsAndTransactions()
  }, [supplier])

  useEffect(() => {
    if (!supplier) {
      setLoading(false)
      return
    }

    // Only run once per supplier change
    setLoading(true)
    setEditingSupplierData({
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
      balance: supplier.balance || 0,
      credit: 0 // Will be updated when credits load
    })
    
    // Load all data in parallel (purchases will be loaded by real-time listener)
    const loadData = async () => {
      try {
        // No credit loading needed for display
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [supplier]) // Include all dependencies

  // Update editing data when supplier changes
  useEffect(() => {
    if (supplier) {
      setEditingSupplierData(prev => ({
        ...prev,
        credit: 0 // No active credits to display
      }))
    }
  }, [supplier])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setLoading(false)
    }
  }, [])

  const handleEditSupplier = async () => {
    if (!supplier || !editingSupplierData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a supplier name",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      // Update supplier basic info
      await SupplierService.updateSupplier(supplier.id, {
        name: editingSupplierData.name,
        phone: editingSupplierData.phone,
        address: editingSupplierData.address,
        balance: editingSupplierData.balance
      })

      // Handle credit update separately
      const currentCredit = credits.reduce((sum, credit) => sum + (credit.remainingAmount || 0), 0)
      const newCredit = editingSupplierData.credit
      
      if (newCredit !== currentCredit) {
        if (newCredit > currentCredit) {
          // Add credit
          const creditToAdd = newCredit - currentCredit
          await SupplierCreditService.createCredit({
            supplierId: supplier.id,
            supplierName: editingSupplierData.name,
            amount: creditToAdd,
            type: "credit",
            reason: "Manual adjustment",
              description: `Credit increased by Rs${creditToAdd.toLocaleString()}`,
              createdBy: "admin",
              status: "active",
              createdAt: new Date().toISOString()
          })
        } else if (newCredit < currentCredit) {
          // Reduce credit
          const creditToReduce = currentCredit - newCredit
          await SupplierCreditService.createCredit({
            supplierId: supplier.id,
            supplierName: editingSupplierData.name,
            amount: creditToReduce,
            type: "debit",
            reason: "Manual adjustment",
              description: `Credit reduced by Rs${creditToReduce.toLocaleString()}`,
              createdBy: "admin",
              status: "active",
              createdAt: new Date().toISOString()
          })
        }
      }
      
      setIsEditDialogOpen(false)
      onSupplierUpdated()

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
    } finally {
      setLoading(false)
    }
  }



  const openEditDialog = () => {
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true)
  }

  if (!supplier) return null
  
  // Calculate due amount from pending credit purchases
  const calculateRunningBalance = () => {
    if (isLoadingPurchases) {
      return supplier?.balance || 0
    }
    
    // Start with supplier's initial balance
    let runningBalance = supplier?.balance || 0
    
    // Get all transactions chronologically
    const allTransactions: Array<{
      date: string
      type: 'purchase' | 'payment' | 'debit'
      amount: number
    }> = []
    
    // Add purchases
    purchases.forEach(purchase => {
      allTransactions.push({
        date: purchase.createdAt,
        type: 'purchase',
        amount: purchase.totalAmount || 0
      })
      
      // Add payment history entries for credit purchases
      if (purchase.paymentMethod === "credit" && purchase.paymentHistory && purchase.paymentHistory.length > 0) {
        purchase.paymentHistory.forEach(payment => {
          allTransactions.push({
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
        allTransactions.push({
          date: purchase.createdAt,
          type: 'payment',
          amount: partialAmount
        })
      }
    })
    
    // Add credit transactions
    credits.forEach(credit => {
      if (credit.type === "credit") {
        allTransactions.push({
          date: credit.createdAt,
          type: 'payment',
          amount: credit.amount
        })
      }
    })
    
    // Add used credit transactions
    transactions.forEach(transaction => {
      if (transaction.type === "used") {
        allTransactions.push({
          date: transaction.createdAt,
          type: 'purchase',
          amount: transaction.amount
        })
      } else if (transaction.type === "refunded") {
        allTransactions.push({
          date: transaction.createdAt,
          type: 'payment',
          amount: transaction.amount
        })
      }
    })
    
    // Sort chronologically and calculate running balance
    const sortedTransactions = allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    sortedTransactions.forEach(transaction => {
      if (transaction.type === 'purchase' || transaction.type === 'debit') {
        runningBalance += transaction.amount
      } else if (transaction.type === 'payment') {
        runningBalance -= transaction.amount
      }
    })
    
    return runningBalance
  }
  
  const runningBalance = calculateRunningBalance()

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Button
               onClick={onBack}
               variant="outline"
               size="sm"
               className="bg-blue-800 text-white border-blue-800 hover:bg-blue-900 hover:border-blue-800 font-medium"
             >
               ← Back to Suppliers
             </Button>
            <div>
              <h1 className="text-2xl font-bold">Supplier Details</h1>
              <p className="text-primary-foreground/80">{supplier.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={openEditDialog}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={openDeleteDialog}
              variant="outline"
              className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Boxes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latest Running Balance Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Latest Running Balance</p>
                <p className="text-2xl font-bold text-red-600">Rs{runningBalance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {isLoadingPurchases 
                    ? "Loading real-time data..." 
                    : "Calculated from all transactions"}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Average Purchase Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Purchase</p>
                <p className="text-2xl font-bold text-purple-600">
                  Rs{purchases.length > 0 ? Math.round(purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0) / purchases.length).toLocaleString() : '0'}
                </p>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Purchases Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold text-blue-600">Rs{purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{purchases.length} transactions</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Purchase Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Purchase</p>
                <p className="text-2xl font-bold text-green-600">
                  Rs{purchases.length > 0 ? (purchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.totalAmount || 0).toLocaleString() : '0'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {purchases.length > 0 ? formatDate(purchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt || '') : 'No purchases'}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        </div>
      )}


      {/* Main Content */}
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">Supplier Name</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{supplier.phone}</p>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{supplier.address}</p>
                      <p className="text-sm text-muted-foreground">Address</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{new Date(supplier.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">Added Date</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Latest Running Balance</span>
                    <Badge variant={runningBalance > 0 ? "destructive" : runningBalance < 0 ? "secondary" : "default"}>
                      {runningBalance > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : runningBalance < 0 ? (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      ) : null}
                      Rs{runningBalance.toLocaleString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-6">
            <SupplierCreditsHistory 
              supplierId={supplier.id} 
              supplierName={supplier.name} 
            />
          </TabsContent>

          {/* Ledger Tab */}
          <TabsContent value="ledger" className="space-y-6">
            <SupplierLedger 
              supplierId={supplier.id} 
              supplierName={supplier.name}
              supplierPhone={supplier.phone}
              supplierAddress={supplier.address}
              initialBalance={supplier.balance || 0}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier information
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
              <Label htmlFor="edit-phone">Phone Number</Label>
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
              <Button onClick={handleEditSupplier} disabled={loading}>
                {loading ? "Updating..." : "Update Supplier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Credit Dialog */}
      <SupplierCreditDialog
        isOpen={isCreditDialogOpen}
        onOpenChange={setIsCreditDialogOpen}
        supplier={supplier}
      />

      {/* Delete Dialog */}
      <SupplierDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        supplier={supplier}
        onConfirm={onSupplierUpdated}
      />

    </div>
  )
}
