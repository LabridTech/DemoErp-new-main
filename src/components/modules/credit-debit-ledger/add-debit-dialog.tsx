import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

interface DebitEntry {
  supplierName: string
  supplierPhone: string
  amount: string
  dueDate: string
  purchaseDate: string
  invoiceNumber: string
  description: string
  category: string
}

interface AddDebitDialogProps {
  newDebitEntry: DebitEntry
  onEntryChange: (entry: DebitEntry) => void
  onSubmit: () => void
}

export function AddDebitDialog({ newDebitEntry, onEntryChange, onSubmit }: AddDebitDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Debit Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Debit Entry</DialogTitle>
          <DialogDescription>Create a new debit entry for supplier payment tracking.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplierName" className="text-right">Supplier *</Label>
            <Input
              id="supplierName"
              value={newDebitEntry.supplierName}
              onChange={(e) => onEntryChange({ ...newDebitEntry, supplierName: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplierPhone" className="text-right">Phone</Label>
            <Input
              id="supplierPhone"
              value={newDebitEntry.supplierPhone}
              onChange={(e) => onEntryChange({ ...newDebitEntry, supplierPhone: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="debitAmount" className="text-right">Amount *</Label>
            <Input
              id="debitAmount"
              type="number"
              value={newDebitEntry.amount}
              onChange={(e) => onEntryChange({ ...newDebitEntry, amount: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="debitDueDate" className="text-right">Due Date</Label>
            <Input
              id="debitDueDate"
              type="date"
              value={newDebitEntry.dueDate}
              onChange={(e) => onEntryChange({ ...newDebitEntry, dueDate: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchaseDate" className="text-right">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={newDebitEntry.purchaseDate}
              onChange={(e) => onEntryChange({ ...newDebitEntry, purchaseDate: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="debitInvoiceNumber" className="text-right">Invoice #</Label>
            <Input
              id="debitInvoiceNumber"
              value={newDebitEntry.invoiceNumber}
              onChange={(e) => onEntryChange({ ...newDebitEntry, invoiceNumber: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select
              value={newDebitEntry.category}
              onValueChange={(value) => onEntryChange({ ...newDebitEntry, category: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fabric-materials">Fabric Materials</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea
              id="description"
              value={newDebitEntry.description}
              onChange={(e) => onEntryChange({ ...newDebitEntry, description: e.target.value })}
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