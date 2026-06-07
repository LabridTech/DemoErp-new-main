import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RewardEmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (amount: number) => void
  }
  
  export function RewardEmployeeDialog({ open, onOpenChange, onSubmit }: RewardEmployeeDialogProps) {
    const [rewardAmount, setRewardAmount] = useState("")
  
    const handleSubmit = () => {
      const amount = Number(rewardAmount)
      if (!isNaN(amount) && amount > 0) {
        onSubmit(amount)
        setRewardAmount("")
      }
    }
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reward Employee</DialogTitle>
            <DialogDescription>
              Enter the reward/bonus amount to add to this employee&apos;s salary.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Reward Amount (Rs)"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Reward</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }