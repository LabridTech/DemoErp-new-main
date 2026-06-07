import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SaleRecord } from "@/lib/firebase-services"

interface DiscardSaleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  saleToDiscard: SaleRecord | null
  onConfirmDiscard: () => void
  isDiscarding: boolean
}

export function DiscardSaleDialog({
  isOpen,
  onOpenChange,
  saleToDiscard,
  onConfirmDiscard,
  isDiscarding,
}: DiscardSaleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Discard Sale</DialogTitle>
          <DialogDescription asChild>
            <div>
              Are you sure you want to discard this sale? This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove the sale record from the database</li>
                <li>Restore all product quantities back to inventory</li>
                <li>This action cannot be undone</li>
              </ul>
              {saleToDiscard && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p><strong>Invoice:</strong> {saleToDiscard.invoiceNumber}</p>
                  <p><strong>Customer:</strong> {saleToDiscard.customerName}</p>
                  <p><strong>Amount:</strong> Rs{saleToDiscard.total.toLocaleString()}</p>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDiscarding}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirmDiscard}
            disabled={isDiscarding}
          >
            {isDiscarding ? "Discarding..." : "Discard Sale"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}