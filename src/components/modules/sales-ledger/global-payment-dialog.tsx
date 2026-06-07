import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// Removed unused imports for simplified global payment dialog
import { 
  User
} from 'lucide-react'
import { type SaleRecord, type Customer, CustomerCreditService } from '@/lib/firebase-services'
import { useToast } from '@/hooks/use-toast'

interface GlobalPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer
  sales: SaleRecord[]
  onPaymentSuccess: () => void
}

// Removed PaymentAllocation interface - no longer needed for global payments

export function GlobalPaymentDialog({
  open,
  onOpenChange,
  customer,
  sales,
  onPaymentSuccess
}: GlobalPaymentDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // Calculate totals - only count pending sales
  const totalRemaining = sales
    .filter(sale => sale.paymentStatus === "pending")
    .reduce((sum, sale) => sum + (sale.total || 0), 0)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setPaymentAmount('')
      setPaymentMethod('')
      setPaymentNotes('')
    }
  }, [open])

  const handlePayment = async () => {
    if (!paymentAmount || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in payment amount and method",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(paymentAmount)

    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      })
      return
    }

    if (totalRemaining <= 0) {
      toast({
        title: "Error",
        description: "No pending amounts found to apply payment to",
        variant: "destructive",
      })
      return
    }

    if (amount > totalRemaining) {
      toast({
        title: "Error",
        description: `Payment amount cannot exceed pending balance of Rs${totalRemaining.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Check if there are any pending sales
      const pendingSales = sales.filter(sale => sale.paymentStatus === "pending")

      if (pendingSales.length === 0) {
        toast({
          title: "No Pending Sales",
          description: "No pending sales found to apply payment to.",
          variant: "destructive",
        })
        return
      }

      // Create a single credit entry for the global payment
      const paymentData = {
        customerId: customer.id,
        customerName: customer.name,
        amount,
        type: "credit" as const,
        reason: `Payment via ${paymentMethod}`,
        description: paymentNotes || `Global payment against pending balance`,
        createdBy: "admin", // TODO: Get from auth context
        status: "active" as const,
        createdAt: new Date().toISOString(),
      }

      await CustomerCreditService.createCredit(paymentData)

      toast({
        title: "Success",
        description: `Global payment of Rs${amount.toLocaleString()} recorded successfully`,
      })

      onPaymentSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error processing payment:', error)
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Global Payment - {customer.name}</span>
          </DialogTitle>
          <DialogDescription>
            Record a payment against the total pending balance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter payment amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={totalRemaining}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total pending balance: Rs{totalRemaining.toLocaleString()}
              </p>
            </div>

            <div>
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile Payment</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add payment notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>

            {/* Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Pending Balance:</span>
                  <span className="font-semibold">Rs{totalRemaining.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Amount:</span>
                  <span className="font-semibold">Rs{(parseFloat(paymentAmount) || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Balance After Payment:</span>
                    <span className={totalRemaining - (parseFloat(paymentAmount) || 0) > 0 ? 'text-orange-600' : 'text-green-600'}>
                      Rs{(totalRemaining - (parseFloat(paymentAmount) || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing || !paymentAmount || !paymentMethod || totalRemaining <= 0}
          >
            {isProcessing ? 'Processing...' : 'Process Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
