"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type DailyExpense } from "@/lib/firebase-services"

interface EditExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editExpense: DailyExpense
  setEditExpense: (expense: DailyExpense) => void
  onSubmit: () => void
}

export function EditExpenseDialog({
  open,
  onOpenChange,
  editExpense,
  setEditExpense,
  onSubmit
}: EditExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Daily Expense</DialogTitle>
          <DialogDescription>Update the expense details</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={editExpense.date}
              onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount (Rs)</Label>
            <Input
              id="amount"
              type="number"
              value={editExpense.amount}
              onChange={(e) => setEditExpense({ ...editExpense, amount: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="description">What was this spent on?</Label>
            <Textarea
              id="description"
              value={editExpense.description}
              onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
              placeholder="e.g., Office supplies, lunch, transportation, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>Update Expense</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}