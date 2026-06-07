import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditEntry, DebitEntry } from "@/lib/firebase-services"

interface PaymentForm {
  amount: string
  method: string
  reference: string
  notes: string
}

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedEntry: CreditEntry | DebitEntry | null
  paymentForm: PaymentForm
  onPaymentFormChange: (form: PaymentForm) => void
  onSubmit: () => void
}

export function AddPaymentDialog({ 
  open, 
  onOpenChange, 
  selectedEntry, 
  paymentForm, 
  onPaymentFormChange, 
  onSubmit 
}: AddPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto p-6 bg-background rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {selectedEntry && ("customerName" in selectedEntry ? selectedEntry.customerName : selectedEntry.supplierName)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentAmount" className="text-right">Amount *</Label>
            <Input 
              id="paymentAmount" 
              type="number" 
              value={paymentForm.amount} 
              onChange={(e) => onPaymentFormChange({ ...paymentForm, amount: e.target.value })} 
              className="col-span-3" 
              max={selectedEntry?.remainingAmount || 0} 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">Method *</Label>
            <Select value={paymentForm.method} onValueChange={(value) => onPaymentFormChange({ ...paymentForm, method: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="mobile-payment">Mobile Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reference" className="text-right">Reference</Label>
            <Input 
              id="reference" 
              value={paymentForm.reference} 
              onChange={(e) => onPaymentFormChange({ ...paymentForm, reference: e.target.value })} 
              className="col-span-3" 
              placeholder="Transaction ID, Cheque #, etc." 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentNotes" className="text-right">Notes</Label>
            <Textarea 
              id="paymentNotes" 
              value={paymentForm.notes} 
              onChange={(e) => onPaymentFormChange({ ...paymentForm, notes: e.target.value })} 
              className="col-span-3" 
            />
          </div>
          <div className="flex items-center justify-between bg-muted rounded px-3 py-2 mt-2">
            <span className="text-sm font-medium">Remaining Balance:</span>
            <span className="text-sm font-bold">Rs{selectedEntry?.remainingAmount?.toLocaleString() || 0}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit}>Record Payment</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}