"use client"

import { useCallback, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Trash2, Search, Building2, Phone, DollarSign, ShoppingBag, Calendar } from "lucide-react"
import { SupplierService, PurchaseService, SupplierCreditService, type Supplier, type Purchase, type SupplierCredit } from "@/lib/firebase-services"
import { PasswordDialog } from "@/components/all-payments/password-dialog"
import { EditPaymentDialog } from "@/components/all-payments/edit-payment-dialog"

export default function SupplierProfileDetails() {
  const router = useRouter()
  const params = useParams()
  const supplierId = params?.id as string
  const { toast } = useToast()

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [payments, setPayments] = useState<SupplierCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<SupplierCredit | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordAction, setPasswordAction] = useState<'edit' | 'delete' | null>(null)

  const loadData = useCallback(async (): Promise<void> => {
    if (!supplierId) return;
    
    try {
      setLoading(true);
      const [suppliersData, purchasesData, paymentsData] = await Promise.all([
        SupplierService.getAllSuppliers(),
        PurchaseService.getAllPurchases(),
        SupplierCreditService.getAll<SupplierCredit>("supplierCredits")
      ]);
      
      // Type assertions to match the expected types
      const foundSupplier = suppliersData.find((s: Supplier) => s.id === supplierId);
      const supplierPurchases = purchasesData.filter((purchase: Purchase) => purchase.supplierId === supplierId);
      const supplierPayments = paymentsData.filter((payment: SupplierCredit) => payment.supplierId === supplierId);

      setSupplier(foundSupplier || null)
      setPurchases(supplierPurchases)
      setPayments(supplierPayments)
    } catch (error) {
      console.error("Error loading supplier data:", error)
      toast({
        title: "Error",
        description: "Failed to load supplier data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [supplierId, toast])

  const filteredPurchases = useMemo(() => {
    if (!searchTerm.trim()) return purchases;
    
    const searchTermLower = searchTerm.toLowerCase();
    return purchases.filter((purchase: Purchase) => {
      return (
        (purchase.invoiceNumber?.toLowerCase().includes(searchTermLower) || false) ||
        (purchase.items?.some((item: { name: string }) => item.name.toLowerCase().includes(searchTermLower)) || false) ||
        ((purchase.paymentMethod || '').toLowerCase().includes(searchTermLower))
      );
    });
  }, [purchases, searchTerm]);

  const handleEditPayment = (payment: SupplierCredit) => {
    setSelectedPayment(payment)
    setPasswordAction('edit')
    setShowPasswordDialog(true)
  }

  // const handleDeletePayment = (payment: SupplierCredit) => {
  //   setSelectedPayment(payment)
  //   setPasswordAction('delete')
  //   setShowPasswordDialog(true)
  // }

  const handlePasswordVerified = () => {
    if (passwordAction === 'edit') {
      setShowPasswordDialog(false)
      setShowEditDialog(true)
    } else if (passwordAction === 'delete') {
      setShowPasswordDialog(false)
      // Delete will be handled by the AlertDialog
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPayment) return

    try {
      await SupplierCreditService.deleteCredit(selectedPayment.id)
      await loadData()
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast({
        title: "Error",
        description: "Failed to delete payment. Please try again.",
        variant: "destructive",
      })
    }
  }

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

  const getPurchaseStatusColor = (status: string) => {
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
          <p className="mt-2 text-sm text-muted-foreground">Loading supplier profile...</p>
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <Button variant="outline" onClick={() => router.push("/all-payments")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Payments
        </Button>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium">Supplier not found</h3>
          <p className="text-muted-foreground">The requested supplier profile could not be found.</p>
        </div>
      </div>
    )
  }

  const totalPurchases = purchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0)
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingBalance = totalPurchases - totalPayments

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.push("/all-payments")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to All Payments
      </Button>

      {/* Supplier Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{supplier.name}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{supplier.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Supplier since {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Purchases</div>
              <div className="text-2xl font-bold text-primary">Rs{totalPurchases.toLocaleString()}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{purchases.length}</div>
              <div className="text-sm text-muted-foreground">Total Purchases</div>
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

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5" />
              <span>Purchase History</span>
            </CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search purchases..."
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
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.invoiceNumber}</TableCell>
                    <TableCell>{purchase.createdAt ? formatDate(purchase.createdAt) : 'N/A'}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="text-sm font-medium">{purchase.items.length} item(s)</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {purchase.items.map(item => item.name).join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{(purchase.paymentMethod || 'N/A').toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPurchaseStatusColor(purchase.paymentStatus || 'pending')}>
                        {purchase.paymentStatus || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">Rs{(purchase.total || 0).toLocaleString()}</TableCell>
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