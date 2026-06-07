import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

interface CreditEntry {
  customerName: string
  customerPhone: string
  amount: string
  dueDate: string
  saleDate: string
  invoiceNumber: string
  notes: string
}

interface AddCreditDialogProps {
  newCreditEntry: CreditEntry
  onEntryChange: (entry: CreditEntry) => void
  onSubmit: () => void
}

export function AddCreditDialog({ newCreditEntry, onEntryChange, onSubmit }: AddCreditDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Credit Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Credit Entry</DialogTitle>
          <DialogDescription>Create a new credit entry for customer payment tracking.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customerName" className="text-right">Customer *</Label>
            <Input
              id="customerName"
              value={newCreditEntry.customerName}
              onChange={(e) => onEntryChange({ ...newCreditEntry, customerName: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customerPhone" className="text-right">Phone</Label>
            <Input
              id="customerPhone"
              value={newCreditEntry.customerPhone}
              onChange={(e) => onEntryChange({ ...newCreditEntry, customerPhone: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={newCreditEntry.amount}
              onChange={(e) => onEntryChange({ ...newCreditEntry, amount: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={newCreditEntry.dueDate}
              onChange={(e) => onEntryChange({ ...newCreditEntry, dueDate: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="saleDate" className="text-right">Sale Date</Label>
            <Input
              id="saleDate"
              type="date"
              value={newCreditEntry.saleDate}
              onChange={(e) => onEntryChange({ ...newCreditEntry, saleDate: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invoiceNumber" className="text-right">Invoice #</Label>
            <Input
              id="invoiceNumber"
              value={newCreditEntry.invoiceNumber}
              onChange={(e) => onEntryChange({ ...newCreditEntry, invoiceNumber: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <Textarea
              id="notes"
              value={newCreditEntry.notes}
              onChange={(e) => onEntryChange({ ...newCreditEntry, notes: e.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onSubmit}>Create Entry</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}