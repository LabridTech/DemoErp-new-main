"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, AlertCircle } from "lucide-react"
import { PurchaseService, type Purchase } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface AddPurchasePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: Purchase
  onPaymentAdded: () => void
}

export function AddPurchasePaymentDialog({
  open,
  onOpenChange,
  purchase,
  onPaymentAdded
}: AddPurchasePaymentDialogProps) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const partialAmount = parseFloat(purchase.partialPaymentAmount || "0") || 0
  const remainingAmount = purchase.totalAmount - partialAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !method) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const paymentAmount = parseFloat(amount)
    if (paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than 0.",
        variant: "destructive",
      })
      return
    }

    if (paymentAmount > remainingAmount) {
      toast({
        title: "Invalid Amount",
        description: `Payment amount cannot exceed remaining amount (Rs${remainingAmount.toLocaleString()}).`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const newPartialAmount = partialAmount + paymentAmount
      const newRemainingAmount = remainingAmount - paymentAmount
      const newPaymentStatus = newRemainingAmount <= 0 ? "paid" : "pending"

      // Create payment history entry
      const paymentHistoryEntry = {
        id: Date.now().toString(),
        amount: paymentAmount,
        method: method,
        date: new Date().toISOString(),
        remainingAfter: newRemainingAmount,
        notes: notes || "Payment added"
      }

      // Get existing payment history or create new array
      const existingHistory = purchase.paymentHistory || []
      const updatedHistory = [...existingHistory, paymentHistoryEntry]

      await PurchaseService.updatePurchase(purchase.id, {
        ...(newPartialAmount > 0 ? { partialPaymentAmount: newPartialAmount.toString() } : {}),
        remainingAmount: newRemainingAmount,
        paymentStatus: newPaymentStatus,
        paymentHistory: updatedHistory
      })

      toast({
        title: "Payment Added",
        description: `Payment of Rs${paymentAmount.toLocaleString()} has been recorded.`,
      })

      // Reset form
      setAmount("")
      setMethod("")
      setNotes("")
      onOpenChange(false)
      onPaymentAdded()
    } catch (error) {
      console.error("Error adding payment:", error)
      toast({
        title: "Error",
        description: "Failed to add payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setAmount("")
    setMethod("")
    setNotes("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Add Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment for invoice #{purchase.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (Rs) *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter amount (max: Rs${remainingAmount.toLocaleString()})`}
              min="0"
              max={remainingAmount}
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground">
              Remaining amount: Rs{remainingAmount.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method *</Label>
            <Select value={method} onValueChange={setMethod} required>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile-payment">Mobile Payment</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>


          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payment"
              rows={3}
            />
          </div>

          {parseFloat(amount) > remainingAmount && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">
                Payment amount exceeds remaining amount
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !amount || !method}>
              {isLoading ? "Adding..." : "Add Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
