import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageSquare, Printer, Receipt } from "lucide-react"

interface SaleData {
  invoiceNumber: string
  date: string
  time: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  staffName: string
  items: Array<{
    name: string
    code: string
    quantity: number
    unitPrice: number
    tradeDiscountFreeItems?: number
    fabricType?: string
    size?: string
  }>
  subtotal: number
  totalDiscount: number
  total: number
}

interface PostSaleModalProps {
  isOpen: boolean
  onClose: () => void
  onWhatsApp: () => Promise<void>
  onPrint: () => Promise<void>
  onThermalPrint: () => Promise<void>
  saleData: SaleData | null
}

export function PostSaleModal({
  isOpen,
  onClose,
  onWhatsApp,
  onPrint,
  onThermalPrint,
  saleData,
}: PostSaleModalProps) {
  if (!saleData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Completed!</DialogTitle>
          <DialogDescription>
            Invoice #{saleData.invoiceNumber} has been generated
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Sale Summary</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Customer:</strong> {saleData.customerName || 'Walk-in Customer'}</p>
              <p><strong>Date:</strong> {saleData.date} at {saleData.time}</p>
              <p><strong>Items:</strong> {saleData.items.length}</p>
              <p><strong>Total:</strong> Rs{saleData.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => onPrint().catch(console.error)} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => onThermalPrint().catch(console.error)} variant="outline" className="flex-1">
              <Receipt className="h-4 w-4 mr-2" />
              Thermal
            </Button>
            <Button onClick={() => onWhatsApp().catch(console.error)} variant="outline" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}