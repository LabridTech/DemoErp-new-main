import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { Purchase } from "@/lib/firebase-services"

interface PurchaseDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: Purchase | null
  onConfirm: () => void
}

export function PurchaseDeleteDialog({ 
  open, 
  onOpenChange, 
  purchase, 
  onConfirm 
}: PurchaseDeleteDialogProps) {
  console.log("PurchaseDeleteDialog rendered with:", { open, purchase: purchase?.invoiceNumber, purchaseId: purchase?.id })
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <FileText className="h-5 w-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete purchase record &quot;{purchase?.invoiceNumber}?&quot; This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            variant="destructive" 
            disabled={!purchase}
            onClick={() => {
              console.log("Delete button clicked in dialog for purchase:", purchase?.invoiceNumber)
              onConfirm()
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
