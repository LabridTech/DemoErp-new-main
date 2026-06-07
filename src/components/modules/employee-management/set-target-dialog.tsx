import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SetTargetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (target: number) => void
  }
  
  export function SetTargetDialog({ open, onOpenChange, onSubmit }: SetTargetDialogProps) {
    const [newTarget, setNewTarget] = useState("")
  
    const handleSubmit = () => {
      const target = Number(newTarget)
      if (!isNaN(target) && target > 0) {
        onSubmit(target)
        setNewTarget("")
      }
    }
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Monthly Target</DialogTitle>
            <DialogDescription>
              Enter the new monthly sales target for this employee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Monthly Target (Rs)"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Set Target</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }