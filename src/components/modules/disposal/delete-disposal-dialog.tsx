"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { type DisposalRecord } from "@/lib/firebase-services"

interface DeleteDisposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordToDelete: DisposalRecord | null
  onConfirm: (record: DisposalRecord) => void
  onCancel: () => void
}

export function DeleteDisposalDialog({
  open,
  onOpenChange,
  recordToDelete,
  onConfirm,
  onCancel
}: DeleteDisposalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delete Disposal Record</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this disposal record? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <div className="mb-2">
            <span className="font-semibold">Item:</span>{" "}
            {recordToDelete?.itemName}{" "}
            <span className="text-xs text-muted-foreground">({recordToDelete?.itemCode})</span>
          </div>
          <div>
            <span className="font-semibold">Date:</span>{" "}
            {recordToDelete?.disposalDate}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (recordToDelete) onConfirm(recordToDelete);
            }}
            type="button"
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}