"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { SalesService, ProductService, type SaleRecord, type Product } from "@/lib/firebase-services"
import { EditableCartSales } from "./editable-cart-sales"

interface EditSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: SaleRecord | null
  onSaleUpdated: () => void
}

export function EditSaleDialog({ 
  open, 
  onOpenChange, 
  sale, 
  onSaleUpdated 
}: EditSaleDialogProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerType: "walk-in" as "walk-in" | "regular" | "vip",
    deliveryStatus: "pending" as "pickup" | "delivered" | "pending" | "cancelled",
    paymentStatus: "pending" as "paid" | "partial" | "pending",
    paymentMethod: "",
    deliveryAddress: "",
    deliveryDate: "",
    staffName: "",
    notes: ""
  })
  const [cartItems, setCartItems] = useState<Array<{
    id: string
    name: string
    code: string
    unitPrice: number
    quantity: number
    discount: number
    finalPrice: number
    availableStock: number
    fabricType?: string
    size?: string
    individualPrices?: number[]
    totalAmount?: number
  }>>([])
  // const [cartSubtotal, setCartSubtotal] = useState(0)
  const [cartDiscount, setCartDiscount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Update form data when sale changes
  useEffect(() => {
    if (sale) {
      setFormData({
        customerName: sale.customerName || "",
        customerPhone: sale.customerPhone || "",
        customerAddress: sale.customerAddress || "",
        customerType: sale.customerType || "walk-in",
        deliveryStatus: sale.deliveryStatus || "pending",
        paymentStatus: sale.paymentStatus || "pending",
        paymentMethod: sale.paymentMethod || "",
        deliveryAddress: sale.deliveryAddress || "",
        deliveryDate: sale.deliveryDate || "",
        staffName: sale.staffName || sale.staffMember || "",
        notes: sale.notes || ""
      })

      // Initialize cart items from sale items
      if (sale.items && Array.isArray(sale.items)) {
        const items = sale.items.map(item => ({
          id: item.id || item.productId || "",
          name: item.name || "",
          code: item.code || "",
          unitPrice: item.unitPrice || 0,
          quantity: item.quantity || 0,
          discount: item.discount || 0,
          finalPrice: item.finalPrice || item.unitPrice || 0,
          availableStock: 0, // Not needed for editing existing sales
          fabricType: item.fabricType,
          size: item.size,
          individualPrices: item.individualPrices,
          totalAmount: item.subtotal || (item.unitPrice || 0) * (item.quantity || 0)
        }))
        setCartItems(items)
      }
    }
  }, [sale])

  // Cart handlers
  const handleCartItemsChange = (items: typeof cartItems) => {
    setCartItems(items)
  }

  const handleCartTotalChange = (subtotal: number, discount: number, total: number) => {
    // setCartSubtotal(subtotal)
    setCartDiscount(discount)
    setCartTotal(total)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sale) return

    if (!formData.customerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required.",
        variant: "destructive",
      })
      return
    }

    if (cartItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one item is required.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Calculate stock changes and validate stock availability
      const originalItems = sale.items || []
      const stockChanges = new Map<string, number>()

      // First, validate that we have enough stock for all items
      for (const cartItem of cartItems) {
        try {
          const product = await ProductService.getById("products", cartItem.id) as Product
          if (product) {
            const originalItem = originalItems.find(item => 
              (item.id || item.productId) === cartItem.id
            )
            const originalQuantity = originalItem?.quantity || 0
            const additionalQuantity = cartItem.quantity - originalQuantity
            
            // Check if we have enough stock for the additional quantity
            if (additionalQuantity > 0 && product.stock < additionalQuantity) {
              toast({
                title: "Insufficient Stock",
                description: `Not enough stock for ${cartItem.name}. Available: ${product.stock}, Required: ${additionalQuantity}`,
                variant: "destructive",
              })
              return
            }
          }
        } catch (error) {
          console.error(`Error checking stock for product ${cartItem.id}:`, error)
        }
      }

      // Calculate changes for each product
      for (const cartItem of cartItems) {
        const originalItem = originalItems.find(item => 
          (item.id || item.productId) === cartItem.id
        )
        const originalQuantity = originalItem?.quantity || 0
        const quantityChange = cartItem.quantity - originalQuantity
        
        if (quantityChange !== 0) {
          stockChanges.set(cartItem.id, quantityChange)
        }
      }

      // Handle removed items (negative stock change)
      for (const originalItem of originalItems) {
        const itemId = originalItem.id || originalItem.productId
        if (itemId && !cartItems.find(cartItem => cartItem.id === itemId)) {
          const quantityChange = -(originalItem.quantity || 0)
          stockChanges.set(itemId, quantityChange)
        }
      }

      // Update stock for all changed products
      for (const [productId, quantityChange] of stockChanges) {
        try {
          const product = await ProductService.getById("products", productId) as Product
          if (product) {
            const newStock = product.stock - quantityChange // Subtract because we're selling
            await ProductService.updateProduct(productId, {
              stock: newStock,
              updatedAt: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error(`Error updating stock for product ${productId}:`, error)
        }
      }

      // Convert cart items to sale items format
      const saleItems = cartItems.map(item => {
        const saleItem: {
          id: string
          productId: string
          name: string
          code: string
          unitPrice: number
          originalPrice: number
          quantity: number
          discount: number
          finalPrice: number
          subtotal: number
          fabricType?: string
          size?: string
          individualPrices?: number[]
        } = {
          id: item.id,
          productId: item.id,
          name: item.name,
          code: item.code,
          unitPrice: item.unitPrice,
          originalPrice: item.unitPrice,
          quantity: item.quantity,
          discount: item.discount,
          finalPrice: item.finalPrice,
          subtotal: item.totalAmount || item.unitPrice * item.quantity
        }

        // Only add optional properties if they have values
        if (item.fabricType) saleItem.fabricType = item.fabricType
        if (item.size) saleItem.size = item.size
        if (item.individualPrices && item.individualPrices.length > 0) saleItem.individualPrices = item.individualPrices

        return saleItem
      })

      const updateData = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerAddress: formData.customerAddress.trim(),
        customerType: formData.customerType,
        deliveryStatus: formData.deliveryStatus,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod as "credit" | "cash" | "card" | "mobile",
        deliveryAddress: formData.deliveryAddress.trim(),
        deliveryDate: formData.deliveryDate,
        staffName: formData.staffName.trim(),
        staffMember: formData.staffName.trim(),
        items: saleItems,
        total: cartTotal,
        discount: cartDiscount,
        notes: formData.notes.trim(),
        updatedAt: new Date().toISOString()
      }

      // Properties are already included in the object above

      await SalesService.updateSale(sale.id, updateData)
      
      // Create a summary of stock changes
      const stockChangeSummary = Array.from(stockChanges.entries())
        .map(([productId, change]) => {
          const product = cartItems.find(item => item.id === productId)
          const productName = product?.name || 'Unknown Product'
          const changeText = change > 0 ? `+${change}` : `${change}`
          return `${productName}: ${changeText}`
        })
        .join(', ')

      toast({
        title: "Sale Updated",
        description: `Sale record updated successfully. Stock changes: ${stockChangeSummary || 'No stock changes'}`,
      })

      onOpenChange(false)
      onSaleUpdated()
    } catch (error) {
      console.error("Error updating sale:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update sale. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sale Record</DialogTitle>
          <DialogDescription>
            Update the details for invoice #{sale.invoiceNumber}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                  placeholder="Enter customer address"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerType">Customer Type</Label>
                <Select value={formData.customerType} onValueChange={(value: "walk-in" | "regular" | "vip") => setFormData(prev => ({ ...prev, customerType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Delivery Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryStatus">Delivery Status</Label>
                  <Select value={formData.deliveryStatus} onValueChange={(value: "pickup" | "delivered" | "pending" | "cancelled") => setFormData(prev => ({ ...prev, deliveryStatus: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Delivery Date</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  placeholder="Enter delivery address"
                  rows={2}
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select value={formData.paymentStatus} onValueChange={(value: "paid" | "partial" | "pending") => setFormData(prev => ({ ...prev, paymentStatus: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Input
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    placeholder="e.g., Cash, Card, Bank Transfer"
                  />
                </div>
              </div>
            </div>

            {/* Staff Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Staff Information</h3>
              <div className="space-y-2">
                <Label htmlFor="staffName">Staff Member</Label>
                <Input
                  id="staffName"
                  value={formData.staffName}
                  onChange={(e) => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                  placeholder="Enter staff member name"
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cart Items</h3>
              <EditableCartSales
                items={cartItems}
                onItemsChange={handleCartItemsChange}
                onTotalChange={handleCartTotalChange}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
