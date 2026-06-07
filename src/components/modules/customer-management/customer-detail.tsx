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
  User, 
  Phone, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  Trash2, 
  DollarSign,
  Calendar
} from "lucide-react"
import { CustomerService, SalesService, CustomerCreditService, type Customer, type SaleRecord, type CustomerCredit } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/date-utils"
import { CustomerDeleteDialog } from "./customer-delete-dialog"
import { CustomerCreditDialog } from "./customer-credit-dialog"
import { CustomerLedger } from "./customer-ledger"
import { CustomerCreditsHistory } from "./customer-credits-history"

interface CustomerDetailProps {
  customer: Customer | null
  onBack: () => void
  onCustomerUpdated: () => void
}

export function CustomerDetail({ customer, onBack, onCustomerUpdated }: CustomerDetailProps) {
  const [editingCustomerData, setEditingCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    customerType: "regular" as "walk-in" | "regular" | "vip",
    creditLimit: 0,
    currentCredit: 0
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false)
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [credits, setCredits] = useState<CustomerCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingSales, setIsLoadingSales] = useState(true)
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)
  const { toast } = useToast()

  // Real-time listener for sales
  useEffect(() => {
    if (!customer) return

    console.log("Setting up real-time listener for sales of customer:", customer.id)
    setIsLoadingSales(true)
    
    const unsubscribe = SalesService.subscribeToSales((sales) => {
      console.log("Real-time sales update received:", sales.length, "total sales")
      const customerSales = sales.filter(sale => sale.customerName === customer.name)
      console.log("Filtered sales for customer:", customerSales.length, "sales")
      setSales(customerSales)
      setIsLoadingSales(false)
    })

    return () => {
      console.log("Cleaning up real-time listener for sales")
      unsubscribe()
    }
  }, [customer])

  // Real-time listener for customer credits
  useEffect(() => {
    if (!customer) return

    console.log("Setting up real-time listener for credits of customer:", customer.id)
    setIsLoadingCredits(true)
    
    const unsubscribe = CustomerCreditService.listenToCreditsByCustomer(customer.id, (credits) => {
      console.log("Real-time credits update received:", credits.length, "credits")
      setCredits(credits)
      setIsLoadingCredits(false)
    })

    return () => {
      console.log("Cleaning up real-time listener for credits")
      unsubscribe()
    }
  }, [customer])


  useEffect(() => {
    if (!customer) {
      setLoading(false)
      return
    }

    // Only run once per customer change
    setLoading(true)
    setEditingCustomerData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      customerType: customer.customerType,
      creditLimit: customer.creditLimit,
      currentCredit: customer.currentCredit
    })
    
    // Load all data in parallel (sales will be loaded by real-time listener)
    const loadData = async () => {
      try {
        // No additional data loading needed for display
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [customer])

  // Update editing data when customer changes
  useEffect(() => {
    if (customer) {
      setEditingCustomerData(prev => ({
        ...prev,
        currentCredit: customer.currentCredit || 0
      }))
    }
  }, [customer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setLoading(false)
    }
  }, [])

  const handleEditCustomer = async () => {
    if (!customer || !editingCustomerData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a customer name",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      // Update customer basic info
      await CustomerService.updateCustomer(customer.id, {
        name: editingCustomerData.name,
        email: editingCustomerData.email,
        phone: editingCustomerData.phone,
        address: editingCustomerData.address,
        customerType: editingCustomerData.customerType,
        creditLimit: editingCustomerData.creditLimit,
        currentCredit: editingCustomerData.currentCredit
      })
      
      setIsEditDialogOpen(false)
      onCustomerUpdated()

      toast({
        title: "Success",
        description: "Customer updated successfully",
      })
    } catch (error) {
      console.error("Error updating customer:", error)
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
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

  if (!customer) return null
  
  // Calculate total spent and running balance
  const calculateCustomerStats = () => {
    if (isLoadingSales || isLoadingCredits) {
      return {
        totalSpent: customer.totalSpent || 0,
        runningBalance: 0
      }
    }
    
    const totalSpent = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    
    // Calculate running balance: total sales - total credits
    const totalCredits = credits.reduce((sum, credit) => {
      if (credit.type === 'credit') {
        return sum + credit.amount // Credits reduce balance
      } else {
        return sum - credit.amount // Debits increase balance
      }
    }, 0)
    
    const runningBalance = totalSpent - totalCredits
    
    return { totalSpent, runningBalance }
  }
  
  const { totalSpent, runningBalance } = calculateCustomerStats()

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
               ← Back to Customers
             </Button>
            <div>
              <h1 className="text-2xl font-bold">Customer Details</h1>
              <p className="text-primary-foreground/80">{customer.name}</p>
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
        {/* Total Spent Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-green-600">Rs{totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {isLoadingSales 
                    ? "Loading real-time data..." 
                    : "From all purchases"}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Running Balance Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running Balance</p>
                <p className={`text-2xl font-bold ${runningBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs{Math.abs(runningBalance).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isLoadingSales || isLoadingCredits 
                    ? "Loading real-time data..." 
                    : runningBalance >= 0 ? "Amount owed" : "Credit available"}
                </p>
              </div>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${runningBalance >= 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <DollarSign className={`h-4 w-4 ${runningBalance >= 0 ? 'text-red-600' : 'text-green-600'}`} />
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
                <p className="text-2xl font-bold text-purple-600">{sales.length}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-purple-600" />
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
                <p className="text-2xl font-bold text-orange-600">
                  Rs{sales.length > 0 ? (sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.total || 0).toLocaleString() : '0'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sales.length > 0 ? formatDate(sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date || '') : 'No purchases'}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-orange-600" />
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
                    <User className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">Customer Name</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{customer.phone}</p>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                    </div>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{customer.email}</p>
                        <p className="text-sm text-muted-foreground">Email Address</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{customer.address}</p>
                      <p className="text-sm text-muted-foreground">Address</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{new Date(customer.createdAt || '').toLocaleDateString()}</p>
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
                    <span className="text-sm text-muted-foreground">Customer Type</span>
                    <Badge variant={customer.customerType === "vip" ? "default" : customer.customerType === "regular" ? "secondary" : "outline"}>
                      {customer.customerType || "Regular"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Credit Limit</span>
                    <Badge variant="outline">
                      Rs{customer.creditLimit.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Credit Used</span>
                    <Badge variant={customer.currentCredit > 0 ? "destructive" : "default"}>
                      Rs{customer.currentCredit.toLocaleString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-6">
            <CustomerCreditsHistory 
              customerId={customer.id} 
              customerName={customer.name}
              customerPhone={customer.phone}
            />
          </TabsContent>

          {/* Ledger Tab */}
          <TabsContent value="ledger" className="space-y-6">
            <CustomerLedger 
              customerId={customer.id} 
              customerName={customer.name}
              customerPhone={customer.phone}
              customerAddress={customer.address}
              initialBalance={customer.currentCredit || 0}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Customer Name</Label>
              <Input
                id="edit-name"
                value={editingCustomerData.name}
                onChange={(e) => setEditingCustomerData({ ...editingCustomerData, name: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingCustomerData.email}
                onChange={(e) => setEditingCustomerData({ ...editingCustomerData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editingCustomerData.phone}
                onChange={(e) => setEditingCustomerData({ ...editingCustomerData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={editingCustomerData.address}
                onChange={(e) => setEditingCustomerData({ ...editingCustomerData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div>
              <Label htmlFor="edit-credit-limit">Credit Limit</Label>
              <Input
                id="edit-credit-limit"
                type="number"
                value={editingCustomerData.creditLimit}
                onChange={(e) => setEditingCustomerData({ ...editingCustomerData, creditLimit: Number(e.target.value) })}
                placeholder="Enter credit limit"
              />
            </div>
            <div>
              <Label htmlFor="edit-current-credit">Current Credit Used</Label>
              <Input
                id="edit-current-credit"
                type="number"
                value={editingCustomerData.currentCredit}
                onChange={(e) => setEditingCustomerData({ ...editingCustomerData, currentCredit: Number(e.target.value) })}
                placeholder="Enter current credit used"
                min="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCustomer} disabled={loading}>
                {loading ? "Updating..." : "Update Customer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Dialog */}
      <CustomerCreditDialog
        isOpen={isCreditDialogOpen}
        onOpenChange={setIsCreditDialogOpen}
        customer={customer}
      />

      {/* Delete Dialog */}
      <CustomerDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        customer={customer}
        onConfirm={onCustomerUpdated}
      />

    </div>
  )
}
