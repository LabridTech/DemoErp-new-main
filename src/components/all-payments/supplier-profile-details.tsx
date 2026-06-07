import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { SupplierService, SupplierCreditService, type SupplierCredit, type Supplier } from "@/lib/firebase-services"
import { PasswordDialog } from "./password-dialog"
import { EditPaymentDialog } from "./edit-payment-dialog"
import { ArrowLeft, Edit, Trash2, Plus, Building2, Phone, DollarSign, CreditCard, Banknote, Receipt } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Format date using native JavaScript

// PaymentRecord extends SupplierCredit and adds UI-specific fields
type PaymentRecord = Omit<SupplierCredit, 'remainingAmount' | 'status'> & {
  // Ensure these fields are required
  id: string;
  status: 'cancelled' | 'active' | 'used' | 'expired';
  // UI-specific fields
  method?: string;
  reference?: string;
  notes?: string;
  date?: string; // Alias for createdAt for UI compatibility
};

export function SupplierProfileDetails({ supplierId, onBack }: { supplierId: string, onBack: () => void }) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [passwordAction, setPasswordAction] = useState<'edit' | 'delete' | null>(null);
  const { toast } = useToast();

  const fetchSupplierPayments = async (supplierId: string): Promise<PaymentRecord[]> => {
    try {
      setLoadingPayments(true);
      const credits = await SupplierCreditService.getCreditsBySupplier(supplierId);
      
      // Transform credits into PaymentRecord format
      const formattedPayments: PaymentRecord[] = credits.map(credit => ({
        id: credit.id,
        amount: credit.amount,
        createdAt: credit.createdAt,
        createdBy: credit.createdBy || 'system', // Default to 'system' if not provided
        description: credit.description || `Supplier payment`,
        reason: credit.reason || 'Payment',
        supplierId: credit.supplierId,
        type: 'credit',
        // Add UI-specific fields
        date: credit.createdAt,
        method: 'Credit',
        reference: credit.invoiceNumber || credit.id.slice(0, 8).toUpperCase(),
        notes: credit.description || '',
        status: credit.status || 'active',
        supplierName: credit.supplierName || supplier?.name || 'Supplier'
      } as PaymentRecord));

      setPayments(formattedPayments);
      return formattedPayments;
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const [supplierData] = await Promise.all([
          SupplierService.getSupplierById(supplierId),
          fetchSupplierPayments(supplierId)
        ]);
        setSupplier(supplierData);
      } catch (error) {
        console.error('Error fetching supplier:', error);
        toast({
          title: 'Error',
          description: 'Failed to load supplier data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditPayment = (payment: PaymentRecord) => {
    // Ensure createdBy is set when editing
    const paymentWithRequiredFields: PaymentRecord = {
      ...payment,
      createdBy: payment.createdBy || 'currentUser' // Replace with actual user ID from auth context
    };
    setEditingPayment(paymentWithRequiredFields);
    setPasswordAction('edit');
    setShowPasswordDialog(true);
  };

  const handleDeleteClick = (paymentId: string) => {
    setDeletingPaymentId(paymentId);
    setPasswordAction('delete');
    setShowPasswordDialog(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeletingPaymentId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPaymentId) return;

    try {
      setLoading(true);
      
      // Delete the payment completely after password verification
      await SupplierCreditService.deleteCredit(deletingPaymentId);
      
      // Refresh the data
      await fetchSupplierPayments(supplierId);
      
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
      
      // Reset states
      setDeletingPaymentId(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVerified = async () => {
    if (passwordAction === 'delete' && deletingPaymentId) {
      setShowPasswordDialog(false);
      setShowDeleteConfirm(true);
    } else if (passwordAction === 'edit' && editingPayment) {
      setShowPasswordDialog(false);
      setShowEditDialog(true);
    }
  };

  const handleSavePayment = async (updatedPayment: PaymentRecord) => {
    try {
      if (updatedPayment.id.startsWith('temp-')) {
        // Create new credit
        const newCredit: Omit<SupplierCredit, 'id'> = {
          supplierId: updatedPayment.supplierId,
          supplierName: updatedPayment.supplierName || 'Supplier',
          amount: updatedPayment.amount,
          type: 'credit',
          reason: updatedPayment.reason || 'Payment',
          description: updatedPayment.notes || '',
          status: 'active',
          createdBy: updatedPayment.createdBy || 'system',
          createdAt: new Date().toISOString(),
          remainingAmount: updatedPayment.amount
        };
        await SupplierCreditService.createCredit(newCredit);
        toast({
          title: 'Success',
          description: 'Payment created successfully',
          variant: 'default',
        });
      } else {
        // This is an existing payment - only update allowed fields
        const paymentData: Partial<SupplierCredit> = {
          amount: updatedPayment.amount,
          reason: updatedPayment.reason,
          description: updatedPayment.notes || '',
          status: updatedPayment.status,
          // Don't include updatedAt as it's not in SupplierCredit type
        };
        await SupplierCreditService.updateCredit(updatedPayment.id, paymentData);
        toast({
          title: 'Success',
          description: 'Payment updated successfully',
          variant: 'default',
        });
      }
      await fetchSupplierPayments(supplierId);
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading supplier data...</div>;
  }

  if (!supplier) {
    return <div>Supplier not found</div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Info Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{supplier.name}</CardTitle>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <Building2 className="mr-1 h-4 w-4" />
                    {supplier.supplierType && (
                      <span className="capitalize">{supplier.supplierType}</span>
                    )}
                    {supplier.rating && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                        {supplier.rating}★
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    {supplier.contactPerson && (
                      <div>
                        <p className="text-muted-foreground">Contact Person</p>
                        <p className="font-medium">{supplier.contactPerson}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium flex items-center">
                        <Phone className="mr-2 h-4 w-4" />
                        {supplier.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{supplier.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{supplier.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {supplier.paymentTerms && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Payment Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Payment Terms</p>
                        <p className="font-medium">{supplier.paymentTerms}</p>
                      </div>
                      {supplier.taxNumber && (
                        <div>
                          <p className="text-muted-foreground">Tax ID</p>
                          <p className="font-medium">{supplier.taxNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {supplier.notes && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Notes</h3>
                    <div className="p-3 bg-muted/20 rounded-lg text-sm">
                      <p className="whitespace-pre-wrap">{supplier.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History - Takes 2/3 width on larger screens */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Payment History</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setEditingPayment({
                      id: `temp-${Date.now()}`,
                      amount: 0,
                      createdAt: new Date().toISOString(),
                      createdBy: 'currentUser', // This should be replaced with actual user ID from auth context
                      description: 'Supplier payment',
                      reason: 'Payment',
                      supplierId: supplierId,
                      type: 'credit',
                      // UI-specific fields
                      date: new Date().toISOString(),
                      method: 'Cash',
                      reference: '',
                      notes: '',
                      status: 'active',
                      supplierName: supplier.name
                    } as PaymentRecord);
                    setPasswordAction('edit');
                    setShowPasswordDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPayments ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading payments...
                        </TableCell>
                      </TableRow>
                    ) : payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No payment records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(payment.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                              {payment.amount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {payment.method === 'Bank Transfer' ? (
                                <Banknote className="h-4 w-4 mr-1 text-muted-foreground" />
                              ) : payment.method === 'Credit Card' ? (
                                <CreditCard className="h-4 w-4 mr-1 text-muted-foreground" />
                              ) : (
                                <Receipt className="h-4 w-4 mr-1 text-muted-foreground" />
                              )}
                              {payment.method}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {payment.reference}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={payment.status === 'active' ? 'default' : 'secondary'}
                              className={payment.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                            >
                              {(payment.status || 'active').charAt(0).toUpperCase() + (payment.status || 'active').slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {payment.notes || ''}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditPayment(payment)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteClick(payment.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Dialog */}
      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordAction(null);
            setDeletingPaymentId(null);
          }
          setShowPasswordDialog(open);
        }}
        onVerified={handlePasswordVerified}
        action={passwordAction || 'edit'}
      />

      {/* Edit Payment Dialog */}
      {editingPayment && (
        <EditPaymentDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPayment(null);
            }
            setShowEditDialog(open);
          }}
          payment={editingPayment}
          onComplete={async (updatedPayment) => {
            await handleSavePayment(updatedPayment as PaymentRecord);
            setShowEditDialog(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payment record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
