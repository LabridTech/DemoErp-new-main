"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CreditSalePaymentService, type CreditSalePaymentRecord } from "@/lib/firebase-services"

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentRecord: CreditSalePaymentRecord | null
  onPaymentAdded: () => void
}

export function AddPaymentDialog({ 
  open, 
  onOpenChange, 
  paymentRecord,
  onPaymentAdded 
}: AddPaymentDialogProps) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!paymentRecord) return

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      })
      return
    }

    if (!method.trim()) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method.",
        variant: "destructive",
      })
      return
    }

    const paymentAmount = parseFloat(amount)
    
    if (paymentAmount > paymentRecord.remainingAmount) {
      toast({
        title: "Amount Too High",
        description: `Payment amount cannot exceed remaining amount of Rs${paymentRecord.remainingAmount.toLocaleString()}.`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await CreditSalePaymentService.addPayment(
        paymentRecord.saleId,
        paymentAmount,
        method.trim(),
        notes.trim()
      )
      
      toast({
        title: "Payment Added",
        description: `Payment of Rs${paymentAmount.toLocaleString()} has been recorded successfully.`,
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
        description: error instanceof Error ? error.message : "Failed to add payment. Please try again.",
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

  if (!paymentRecord) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice #{paymentRecord.invoiceNumber}. 
            <span className="block mt-2 text-sm text-muted-foreground">
              Remaining amount: Rs{paymentRecord.remainingAmount.toLocaleString()}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (Rs)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={paymentRecord.remainingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter payment amount"
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum: Rs{paymentRecord.remainingAmount.toLocaleString()}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this payment"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
