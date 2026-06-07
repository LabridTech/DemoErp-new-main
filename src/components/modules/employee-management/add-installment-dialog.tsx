"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { EmployeePayrollService, type EmployeePayroll } from "@/lib/firebase-services"

interface AddInstallmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  employeeName: string
  currentPayroll: EmployeePayroll | null
  onInstallmentAdded: () => void
}

export function AddInstallmentDialog({ 
  open, 
  onOpenChange, 
  employeeId, 
  employeeName, 
  currentPayroll,
  onInstallmentAdded 
}: AddInstallmentDialogProps) {
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      })
      return
    }

    if (!currentPayroll) {
      toast({
        title: "No Payroll Record",
        description: "No payroll record found for current month. Please create one first.",
        variant: "destructive",
      })
      return
    }

    const installmentAmount = parseFloat(amount)
    
    if (installmentAmount > currentPayroll.remainingSalary) {
      toast({
        title: "Amount Too High",
        description: `Installment amount cannot exceed remaining salary of Rs${currentPayroll.remainingSalary.toLocaleString()}.`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await EmployeePayrollService.addInstallment(employeeId, employeeName, installmentAmount, notes)
      
      toast({
        title: "Installment Added",
        description: `Successfully added installment of Rs${installmentAmount.toLocaleString()}.`,
      })

      // Reset form
      setAmount("")
      setNotes("")
      onOpenChange(false)
      onInstallmentAdded()
    } catch (error) {
      console.error("Error adding installment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add installment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setAmount("")
    setNotes("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Payroll Installment</DialogTitle>
          <DialogDescription>
            Add a partial payment for {employeeName}. 
            {currentPayroll && (
              <span className="block mt-2 text-sm text-muted-foreground">
                Remaining salary: Rs{currentPayroll.remainingSalary.toLocaleString()}
              </span>
            )}
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
                max={currentPayroll?.remainingSalary || undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter installment amount"
                required
              />
              {currentPayroll && (
                <p className="text-xs text-muted-foreground">
                  Maximum: Rs{currentPayroll.remainingSalary.toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this installment"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Installment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
