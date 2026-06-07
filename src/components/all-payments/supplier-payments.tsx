"use client"

import { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Search, CreditCard } from "lucide-react"
import { SupplierCreditService, type SupplierCredit } from "@/lib/firebase-services"
import { SupplierService } from "@/lib/firebase-services"
import { PasswordDialog } from "./password-dialog"
import { EditPaymentDialog } from "./edit-payment-dialog"
// import { useRouter } from "next/navigation"

interface SupplierPaymentRecord extends SupplierCredit {
  supplierName: string
  supplierPhone: string
}

export function SupplierPayments({ onProfileClick }: { onProfileClick?: (id: string) => void }) {
  const [payments, setPayments] = useState<SupplierPaymentRecord[]>([])
  // const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<SupplierPaymentRecord | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [passwordAction, setPasswordAction] = useState<'edit' | 'delete' | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { toast } = useToast()
  // const router = useRouter()

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true)
      const [paymentsData, suppliersData] = await Promise.all([
        SupplierCreditService.getAll<SupplierCredit>("supplierCredits"),
        SupplierService.getAllSuppliers()
      ])

      // Enrich payments with supplier data
      const enrichedPayments = paymentsData.map(payment => {
        const supplier = suppliersData.find(s => s.id === payment.supplierId)
        return {
          ...payment,
          supplierName: supplier?.name || payment.supplierName || 'Unknown Supplier',
          supplierPhone: supplier?.phone || 'N/A'
        }
      })

      setPayments(enrichedPayments)
      // setSuppliers(suppliersData)
    } catch (error) {
      console.error("Error loading supplier payments:", error)
      toast({
        title: "Error",
        description: "Failed to load supplier payments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment =>
    payment.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.supplierPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Collect unique supplier list with summary
  const supplierMap = new Map<string, {record: SupplierPaymentRecord, count: number, total: number}>();
  filteredPayments.forEach(payment => {
    const id = payment.supplierId;
    if (!supplierMap.has(id)) {
      supplierMap.set(id, {record: payment, count: 1, total: payment.amount })
    } else {
      const entry = supplierMap.get(id)!;
      entry.count++;
      entry.total += payment.amount;
    }
  });
  const uniqueSuppliers = Array.from(supplierMap.values());

  // const handleEdit = (payment: SupplierPaymentRecord) => {
  //   setSelectedPayment(payment)
  //   setPasswordAction('edit')
  //   setShowPasswordDialog(true)
  // }

  // const handleDelete = (payment: SupplierPaymentRecord) => {
  //   setSelectedPayment(payment)
  //   setPasswordAction('delete')
  //   setShowDeleteConfirm(true)
  // }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setSelectedPayment(null)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPayment) return
    
    try {
      // First verify password before deletion
      setShowDeleteConfirm(false)
      setShowPasswordDialog(true)
    } catch (error) {
      console.error("Error preparing to delete payment:", error)
      toast({
        title: "Error",
        description: "Failed to prepare for payment deletion. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePasswordVerified = async () => {
    if (!selectedPayment) {
      setShowPasswordDialog(false)
      return
    }

    if (passwordAction === 'edit') {
      setShowPasswordDialog(false)
      setShowEditDialog(true)
    } else if (passwordAction === 'delete') {
      setShowPasswordDialog(false)
      
      try {
        setLoading(true)
        // Delete the payment completely after password verification
        await SupplierCreditService.deleteCredit(selectedPayment.id)
        
        // Refresh the data
        await loadData()
        
        toast({
          title: "Success",
          description: "Payment deleted successfully",
        })
        
        // Reset states
        setSelectedPayment(null)
        setPasswordAction(null)
      } catch (error) {
        console.error("Error deleting payment:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete payment. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleEditComplete = async () => {
    setShowEditDialog(false)
    await loadData()
  }

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   })
  // }

  // const getTypeColor = (type: string) => {
  //   switch (type) {
  //     case 'credit':
  //       return 'bg-green-100 text-green-800'
  //     case 'debit':
  //       return 'bg-red-100 text-red-800'
  //     default:
  //       return 'bg-gray-100 text-gray-800'
  //   }
  // }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {uniqueSuppliers.length} suppliers
          </Badge>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Transactions</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uniqueSuppliers.map(({record, count, total}) => (
              <TableRow 
                key={record.supplierId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={onProfileClick ? () => onProfileClick(record.supplierId) : undefined}
              >
                <TableCell>
                  <span className="font-medium">{record.supplierName}</span>
                </TableCell>
                <TableCell>{record.supplierPhone}</TableCell>
                <TableCell>{count}</TableCell>
                <TableCell>Rs{total.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <span className="text-sm text-muted-foreground">Click to view details</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {uniqueSuppliers.length === 0 && (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No suppliers found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms" : "No supplier transactions have been recorded yet"}
          </p>
        </div>
      )}

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
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
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
  )
}
