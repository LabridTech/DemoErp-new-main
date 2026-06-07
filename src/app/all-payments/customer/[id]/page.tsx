"use client"

import { useCallback, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Trash2, Search, User, Phone, DollarSign, ShoppingCart, Calendar } from "lucide-react"
import { CustomerService, SalesService, CustomerCreditService, type Customer, type SaleRecord, type CustomerCredit } from "@/lib/firebase-services"
import { PasswordDialog } from "@/components/all-payments/password-dialog"
import { EditPaymentDialog } from "@/components/all-payments/edit-payment-dialog"

export default function CustomerProfileDetails() {
  const router = useRouter()
  const params = useParams()
  const customerId = params?.id as string
  const { toast } = useToast()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [payments, setPayments] = useState<CustomerCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<CustomerCredit | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordAction, setPasswordAction] = useState<'edit' | 'delete' | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [customersData, salesData, paymentsData] = await Promise.all([
        CustomerService.getAllCustomers(),
        SalesService.getAllSales(),
        CustomerCreditService.getAll<CustomerCredit>("customerCredits")
      ]);

      const foundCustomer = customersData.find(c => c.id === customerId);
      const customerSales = foundCustomer 
        ? salesData.filter(sale => sale.customerPhone === foundCustomer.phone || sale.customerName === foundCustomer.name) 
        : [];
      const customerPayments = paymentsData.filter(payment => payment.customerId === customerId);

      setCustomer(foundCustomer || null);
      setSales(customerSales);
      setPayments(customerPayments);
    } catch (error) {
      console.error("Error loading customer data:", error);
      toast({
        title: "Error",
        description: "Failed to load customer data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  const filteredSales = sales.filter(sale => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Check invoice number match
    if (sale.invoiceNumber?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Check customer name and phone
    if (
      sale.customerName?.toLowerCase().includes(searchLower) ||
      sale.customerPhone?.includes(searchTerm) // Keep as string for exact match
    ) {
      return true;
    }
    
    // Check payment method
    if (sale.paymentMethod?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    return false;
  });

  const handleEditPayment = (payment: CustomerCredit) => {
    setSelectedPayment(payment)
    setPasswordAction('edit')
    setShowPasswordDialog(true)
  }


  const handlePasswordVerified = () => {
    if (passwordAction === 'edit') {
      setShowPasswordDialog(false)
      setShowEditDialog(true)
    } else if (passwordAction === 'delete') {
      setShowPasswordDialog(false)
      // Delete will be handled by the AlertDialog
    }
  }

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedPayment) return;

    try {
      await CustomerCreditService.deleteCredit(selectedPayment.id);
      await loadData();
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({
        title: "Error",
        description: "Failed to delete payment. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedPayment, loadData, toast]);

  const handleEditComplete = async () => {
    setShowEditDialog(false)
    await loadData()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'used':
        return 'bg-blue-100 text-blue-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSaleStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading customer profile...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <Button variant="outline" onClick={() => router.push("/all-payments")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Payments
        </Button>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium">Customer not found</h3>
          <p className="text-muted-foreground">The requested customer profile could not be found.</p>
        </div>
      </div>
    )
  }

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingBalance = totalSales - totalPayments

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.push("/all-payments")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to All Payments
      </Button>

      {/* Customer Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{customer.name}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Customer since {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Sales</div>
              <div className="text-2xl font-bold text-primary">Rs{totalSales.toLocaleString()}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{sales.length}</div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Rs{totalPayments.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Payments</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className={`text-2xl font-bold ${remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                Rs{remainingBalance.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Remaining Balance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Sales History</span>
            </CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                    <TableCell>{sale.createdAt ? formatDate(sale.createdAt) : 'N/A'}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="text-sm font-medium">{sale.items.length} item(s)</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {sale.items.map(item => item.name).join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sale.paymentMethod.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSaleStatusColor(sale.paymentStatus)}>
                        {sale.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">Rs{sale.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Payment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Badge className={payment.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {payment.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">Rs{payment.amount.toLocaleString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{payment.reason}</TableCell>
                    <TableCell>{payment.invoiceNumber || 'N/A'}</TableCell>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPayment(payment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this payment? This action cannot be undone.
                                <br /><br />
                                <strong>Amount:</strong> Rs{payment.amount.toLocaleString()}<br />
                                <strong>Reason:</strong> {payment.reason}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteConfirm}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onVerified={handlePasswordVerified}
        action={passwordAction || 'edit'}
      />

      {/* Edit Dialog */}
      {selectedPayment && (
        <EditPaymentDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          payment={selectedPayment}
          onComplete={handleEditComplete}
        />
      )}
    </div>
  )
}