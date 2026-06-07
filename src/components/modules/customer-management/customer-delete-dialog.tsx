"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"
import { CustomerService, type Customer } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface CustomerDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onConfirm: () => void
}

export function CustomerDeleteDialog({ open, onOpenChange, customer, onConfirm }: CustomerDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!customer) return

    setIsDeleting(true)
    try {
      await CustomerService.deleteCustomer(customer.id)
      
      toast({
        title: "Success",
        description: `Customer "${customer.name}" has been deleted successfully`,
      })
      
      onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Customer
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this customer? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Customer Details</h4>
            <div className="space-y-1">
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
              {customer.email && (
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Type: {customer.customerType || "Regular"}
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Warning</p>
                <p>
                  Deleting this customer will permanently remove all associated data including:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Customer information and contact details</li>
                  <li>Purchase history and transaction records</li>
                  <li>Credit and payment information</li>
                  <li>All related financial data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Customer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}