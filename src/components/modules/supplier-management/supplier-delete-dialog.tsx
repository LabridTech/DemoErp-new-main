import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import { Supplier } from "@/lib/firebase-services"

interface SupplierDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
  onConfirm: () => void
  isDeleting?: boolean
}

export function SupplierDeleteDialog({ 
  open, 
  onOpenChange, 
  supplier, 
  onConfirm,
  isDeleting = false
}: SupplierDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Building2 className="h-5 w-5" />
            Delete Supplier
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{supplier?.name}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={!supplier || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}