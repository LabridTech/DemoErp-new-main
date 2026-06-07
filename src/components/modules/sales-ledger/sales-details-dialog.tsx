import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, UserCheck, User, Phone, Package, CreditCard, Truck, MapPin, MessageSquare } from "lucide-react"
import { SaleRecord } from "@/lib/firebase-services"

interface SaleDetailsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedRecord: SaleRecord | null
  onCallCustomer: (phone: string) => void
  onMessageCustomer: (phone: string, customerName: string) => void
  getCustomerTypeColor: (type: string) => "destructive" | "default" | "secondary" | "outline" | undefined
  getPaymentStatusColor: (status: string) => "destructive" | "default" | "secondary" | "outline" | undefined
  getDeliveryStatusColor: (status: string) => "destructive" | "default" | "secondary" | "outline" | undefined
}

export function SaleDetailsDialog({
  isOpen,
  onOpenChange,
  selectedRecord,
  onCallCustomer,
  onMessageCustomer,
  getCustomerTypeColor,
  getPaymentStatusColor,
  getDeliveryStatusColor,
}: SaleDetailsDialogProps) {
  if (!selectedRecord) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sale Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this sale transaction
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Invoice:</span>
                <span>{selectedRecord.invoiceNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>{selectedRecord.date} at {selectedRecord.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Staff:</span>
                <span>{selectedRecord.staffMember}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Customer:</span>
                <span>{selectedRecord.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <span>{selectedRecord.customerPhone}</span>
              </div>
              {selectedRecord.customerAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="font-medium">Address:</span>
                  <span className="text-sm">{selectedRecord.customerAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={getCustomerTypeColor(selectedRecord.customerType)}>
                  {selectedRecord.customerType}
                </Badge>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items ({selectedRecord.items?.length || 0})
            </h4>
            <div className="border rounded-lg p-3 space-y-2">
              {selectedRecord.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Code: {item.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rs{item.finalPrice.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs{selectedRecord.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="text-red-600">-Rs{selectedRecord.discount.toLocaleString()}</span>
              </div>
              {selectedRecord.tradeDiscountItems && selectedRecord.tradeDiscountItems.length > 0 && (
                <div className="space-y-1">
                  <div className="font-medium">Trade Discount Units:</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedRecord.tradeDiscountItems.map((ti, idx) => (
                      <div key={idx}>- {ti.productName} x {ti.quantity} (Free)</div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>Rs{selectedRecord.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>Rs{selectedRecord.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Payment:</span>
                <Badge variant={getPaymentStatusColor(selectedRecord.paymentStatus)}>
                  {selectedRecord.paymentStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Delivery:</span>
                <Badge variant={getDeliveryStatusColor(selectedRecord.deliveryStatus)}>
                  {selectedRecord.deliveryStatus}
                </Badge>
              </div>
              {selectedRecord.deliveryAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="font-medium">Address:</span>
                  <span className="text-sm">{selectedRecord.deliveryAddress}</span>
                </div>
              )}
              {selectedRecord.deliveryDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Delivery Date:</span>
                  <span>{selectedRecord.deliveryDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {selectedRecord.notes && (
            <div className="space-y-2">
              <h4 className="font-medium">Notes</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {selectedRecord.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onCallCustomer(selectedRecord.customerPhone)}
              className="flex-1"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Customer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onMessageCustomer(selectedRecord.customerPhone, selectedRecord.customerName)}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Customer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}