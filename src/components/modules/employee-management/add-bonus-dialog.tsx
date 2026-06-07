"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { EmployeePayrollService, type EmployeePayroll } from "@/lib/firebase-services"

interface AddBonusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  employeeName: string
  currentPayroll: EmployeePayroll | null
  onBonusAdded: () => void
}

const BONUS_REASONS = [
  "Performance Bonus",
  "Sales Achievement",
  "Holiday Bonus",
  "Year-end Bonus",
  "Project Completion",
  "Customer Satisfaction",
  "Attendance Bonus",
  "Overtime Bonus",
  "Special Recognition",
  "Other"
]

export function AddBonusDialog({ 
  open, 
  onOpenChange, 
  employeeId, 
  employeeName, 
  currentPayroll,
  onBonusAdded 
}: AddBonusDialogProps) {
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("Performance Bonus")
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

    if (!reason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for the bonus.",
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

    const bonusAmount = parseFloat(amount)
    setIsLoading(true)

    try {
      await EmployeePayrollService.addBonus(employeeId, employeeName, bonusAmount, reason, notes)
      
      toast({
        title: "Bonus Added",
        description: `Successfully added bonus of Rs${bonusAmount.toLocaleString()} for ${reason}.`,
      })

      // Reset form
      setAmount("")
      setReason("")
      setNotes("")
      onOpenChange(false)
      onBonusAdded()
    } catch (error) {
      console.error("Error adding bonus:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add bonus. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setAmount("")
    setReason("")
    setNotes("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Employee Bonus</DialogTitle>
          <DialogDescription>
            Add a bonus payment for {employeeName}. 
            <span className="block mt-2 text-sm text-muted-foreground">
              Bonuses are separate from salary and do not affect remaining salary calculations.
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Bonus Amount (Rs)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter bonus amount"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Bonus</Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {BONUS_REASONS.map((reasonOption) => (
                    <SelectItem key={reasonOption} value={reasonOption}>
                      {reasonOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this bonus"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Bonus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
