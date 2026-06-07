"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Expense {
  date: string
  description: string
  amount: string
}

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newExpense: Expense
  setNewExpense: (expense: Expense) => void
  onSubmit: () => void
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  newExpense,
  setNewExpense,
  onSubmit
}: AddExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Daily Expense</DialogTitle>
          <DialogDescription>Record a simple daily expense</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount (Rs)</Label>
            <Input
              id="amount"
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">What was this spent on?</Label>
            <Textarea
              id="description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="e.g., Office supplies, lunch, transportation, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>Add Expense</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}