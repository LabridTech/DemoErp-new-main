"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Trash2, Plus, DollarSign, CreditCard, Banknote, Receipt, User, Phone } from "lucide-react"
import { CustomerService, CustomerCreditService, type Customer, type CustomerCredit, type SupplierCredit } from "@/lib/firebase-services"
import { PasswordDialog } from "./password-dialog"
import { EditPaymentDialog } from "./edit-payment-dialog"

// Format date using native JavaScript
// const formatDate = (dateString: string) => {
//   return new Intl.DateTimeFormat('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: '2-digit'
//   }).format(new Date(dateString));
// };

type PaymentRecord = {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
  notes: string;
  saleId?: string;
  invoiceNumber?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  status: 'cancelled' | 'active' | 'used' | 'expired';
  type: 'credit' | 'debit';
  customerId: string;
  customerName: string;
  reason: string;
  description: string;
};

export function CustomerProfileDetails({ customerId, onBack }: { customerId: string, onBack: () => void }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'delete' | 'edit'>('edit');
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const [customerData] = await Promise.all([
          CustomerService.getCustomerById(customerId),
          fetchCustomerPayments(customerId)
        ]);
        setCustomer(customerData);
      } catch (error) {
        console.error('Error fetching customer:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customer data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCustomerPayments = async (customerId: string): Promise<PaymentRecord[]> => {
    try {
      setLoadingPayments(true);
      
      // Fetch customer credits
      const credits = await CustomerCreditService.getCreditsByCustomer(customerId);
      
      // Transform credits into PaymentRecord format
      const formattedPayments: PaymentRecord[] = credits.map(credit => ({
        id: credit.id,
        date: credit.createdAt,
        amount: credit.amount,
        method: 'Credit',
        reference: credit.invoiceNumber || credit.id.slice(0, 8).toUpperCase(),
        notes: credit.description || '',
        createdBy: credit.createdBy,
        createdAt: credit.createdAt,
        updatedAt: credit.createdAt,
        status: credit.status || 'active',
        type: 'credit',
        customerId: credit.customerId,
        customerName: credit.customerName || 'Customer',
        reason: credit.reason || 'Payment',
        description: credit.description || 'Customer payment',
        invoiceNumber: credit.invoiceNumber || ''
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

  const handleEditPayment = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setPasswordAction('edit');
    setShowPasswordDialog(true);
  };

  const handleSavePayment = async (updatedPayment: PaymentRecord) => {
    try {
      if (updatedPayment.id.startsWith('temp-')) {
        // Create new credit
        const newCredit: Omit<CustomerCredit, 'id'> = {
          customerId: updatedPayment.customerId,
          customerName: updatedPayment.customerName || 'Customer',
          amount: updatedPayment.amount,
          type: 'credit',
          reason: updatedPayment.reason || 'Payment',
          description: updatedPayment.notes || '',
          status: 'active',
          createdBy: 'User', // Replace with actual user
          createdAt: new Date().toISOString(),
          remainingAmount: updatedPayment.amount
        };
        
        await CustomerCreditService.createCredit(newCredit);
      } else {
        // Update existing credit
        const updateData: Partial<CustomerCredit> = {
          amount: updatedPayment.amount,
          description: updatedPayment.notes,
          status: updatedPayment.status as CustomerCredit['status'],
          reason: updatedPayment.reason,
          customerName: updatedPayment.customerName
        };
        
        await CustomerCreditService.updateCredit(updatedPayment.id, updateData);
      }
      
      // Refresh payments
      await fetchCustomerPayments(updatedPayment.customerId);
      
      setShowEditDialog(false);
      setEditingPayment(null);
      
      toast({
        title: 'Success',
        description: `Payment ${updatedPayment.id.startsWith('temp-') ? 'added' : 'updated'} successfully`,
      });
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setPasswordAction('delete');
    setShowPasswordDialog(true);
  };

  const handlePasswordVerified = async () => {
    if (passwordAction === 'delete' && paymentToDelete) {
      try {
        await CustomerCreditService.deleteCredit(paymentToDelete);
        await fetchCustomerPayments(customerId);
        toast({
          title: 'Success',
          description: 'Payment deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting payment:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete payment',
          variant: 'destructive',
        });
      } finally {
        setPaymentToDelete(null);
      }
    } else if (passwordAction === 'edit' && editingPayment) {
      setShowEditDialog(true);
    }
    setShowPasswordDialog(false);
  };


  // const handleAddPayment = () => {
  //   // For add, we'll just open the edit dialog directly with a new payment
  //   const newPayment: PaymentRecord = {
  //     id: `temp-${Date.now()}`,
  //     date: new Date().toISOString(),
  //     amount: 0,
  //     method: 'Cash',
  //     reference: '',
  //     notes: '',
  //     createdBy: 'User',
  //     createdAt: new Date().toISOString(),
  //     status: 'active',
  //     type: 'credit',
  //     customerId,
  //     customerName: customer?.name || 'Customer',
  //     reason: 'Payment',
  //     description: 'New payment',
  //     saleId: '',
  //     invoiceNumber: ''
  //   };
    
  //   setEditingPayment(newPayment);
  //   setShowEditDialog(true);
  // };


  if (loading) {
    return <div>Loading customer data...</div>;
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{customer.name}</CardTitle>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <User className="mr-1 h-4 w-4" />
                    {customer.customerType && (
                      <span className="capitalize">{customer.customerType}</span>
                    )}
                    {customer.rating && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                        {customer.rating}★
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
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium flex items-center">
                        <Phone className="mr-2 h-4 w-4" />
                        {customer.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{customer.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{customer.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {customer.paymentTerms && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Payment Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Payment Terms</p>
                        <p className="font-medium">{customer.paymentTerms}</p>
                      </div>
                      {customer.taxNumber && (
                        <div>
                          <p className="text-muted-foreground">Tax ID</p>
                          <p className="font-medium">{customer.taxNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {customer.notes && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Notes</h3>
                    <div className="p-3 bg-muted/20 rounded-lg text-sm">
                      <p className="whitespace-pre-wrap">{customer.notes}</p>
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
                      date: new Date().toISOString(),
                      amount: 0,
                      method: 'Cash',
                      reference: '',
                      notes: '',
                      createdBy: 'User',
                      createdAt: new Date().toISOString(),
                      status: 'active',
                      type: 'credit',
                      customerId: customerId,
                      customerName: customer?.name || 'Customer',
                      reason: 'Payment',
                      description: 'Customer payment'
                    });
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
                              <span>{new Date(payment.date).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(payment.date).toLocaleTimeString()}
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
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {payment.notes}
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
                              {payment.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700"
                                  onClick={() => handleDeletePayment(payment.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
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
        onOpenChange={setShowPasswordDialog} 
        onVerified={handlePasswordVerified} 
        action={passwordAction}
      />

      {/* Edit Payment Dialog */}
      {editingPayment && (
        <EditPaymentDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              setEditingPayment(null);
            }
          }}
          payment={editingPayment}
          onComplete={async (payment: CustomerCredit | SupplierCredit) => {
            await handleSavePayment(payment as PaymentRecord);
            setShowEditDialog(false);
          }}
        />
      )}
    </div>
  );
}
