"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { SalesService, ProductService, type SaleRecord } from "@/lib/firebase-services"
import { EditableCartSales } from "./editable-cart-sales"
import { ArrowLeft, Save, Edit, X } from "lucide-react"

interface SaleDetailProps {
  sale: SaleRecord
  onBack: () => void
  onSaleUpdated: () => void
}

export function SaleDetail({ sale, onBack, onSaleUpdated }: SaleDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerType: "walk-in" as "walk-in" | "regular" | "vip",
    deliveryStatus: "pending" as "pickup" | "delivered" | "pending" | "cancelled",
    paymentStatus: "pending" as "paid" | "partial" | "pending",
    paymentMethod: "cash" as "cash" | "card" | "mobile" | "credit",
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
  const [cartSubtotal, setCartSubtotal] = useState(0)
  const [cartDiscount, setCartDiscount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Initialize form data and cart items
  useEffect(() => {
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

    // Initialize cart totals from sale data
    setCartSubtotal(sale.subtotal || 0)
    setCartDiscount(sale.discount || 0)
    setCartTotal(sale.total || 0)

    // Initialize cart items from sale items
    if (sale.items && Array.isArray(sale.items)) {
      const items = sale.items.map(item => ({
        id: item.id || item.productId || "",
        name: item.name || "",
        code: item.code || "",
        unitPrice: item.unitPrice || item.originalPrice || 0,
        quantity: item.quantity || 0,
        discount: item.discount || 0,
        finalPrice: item.finalPrice || 0,
        availableStock: 0, // Not needed for editing existing sales
        fabricType: item.fabricType,
        size: item.size,
        individualPrices: item.individualPrices,
        totalAmount: item.subtotal || item.finalPrice || 0
      }))
      setCartItems(items)
    }
  }, [sale])

  // Cart handlers
  const handleCartItemsChange = (items: typeof cartItems) => {
    setCartItems(items)
  }

  const handleTotalChange = (subtotal: number, discount: number, total: number) => {
    setCartSubtotal(subtotal)
    setCartDiscount(discount)
    setCartTotal(total)
  }

  const handleSave = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the cart",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Validate stock availability before updating
      const originalItems = sale.items || []
      for (const cartItem of cartItems) {
        try {
          const product = await SalesService.getById("products", cartItem.id) as { stock?: number; name?: string }
          if (product) {
            const originalItem = originalItems.find(item => 
              (item.id || item.productId) === cartItem.id
            )
            const originalQuantity = originalItem?.quantity || 0
            const additionalQuantity = cartItem.quantity - originalQuantity
            
            // Check if we have enough stock for the additional quantity
            if (additionalQuantity > 0 && (product.stock || 0) < additionalQuantity) {
              toast({
                title: "Insufficient Stock",
                description: `Not enough stock for ${cartItem.name}. Available: ${product.stock || 0}, Required: ${additionalQuantity}`,
                variant: "destructive",
              })
              return
            }
          }
        } catch (error) {
          console.error(`Error checking stock for product ${cartItem.id}:`, error)
        }
      }

      // Calculate and apply stock changes
      const stockChanges = new Map<string, number>()
      
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
          const product = await SalesService.getById("products", productId) as { stock?: number }
          if (product) {
            const newStock = (product.stock || 0) - quantityChange // Subtract because we're selling
            await ProductService.updateProduct(productId, {
              stock: newStock,
              updatedAt: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error(`Error updating stock for product ${productId}:`, error)
        }
      }

      const updatedSale: Partial<SaleRecord> = {
        ...sale,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        customerType: formData.customerType,
        deliveryStatus: formData.deliveryStatus,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod,
        deliveryAddress: formData.deliveryAddress,
        deliveryDate: formData.deliveryDate,
        staffName: formData.staffName,
        staffMember: formData.staffName,
        notes: formData.notes,
        items: cartItems.map(item => {
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
        }),
        total: cartTotal,
        discount: cartDiscount,
        subtotal: cartSubtotal
      }

      await SalesService.updateSale(sale.id, updatedSale)
      
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
        title: "Success",
        description: `Sale updated successfully. Stock changes: ${stockChangeSummary || 'No stock changes'}`,
      })
      
      setIsEditing(false)
      onSaleUpdated()
    } catch (error) {
      console.error("Error updating sale:", error)
      toast({
        title: "Error",
        description: "Failed to update sale",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to original values
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
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sales Ledger
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Sale Details</h1>
              <p className="text-primary-foreground/80">Invoice #{sale.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Sale
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                disabled={!isEditing}
                className="text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                disabled={!isEditing}
                className="text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="customerAddress">Address</Label>
              <Textarea
                id="customerAddress"
                value={formData.customerAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                disabled={!isEditing}
                className="text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="customerType">Customer Type</Label>
              <Select
                value={formData.customerType}
                onValueChange={(value: "walk-in" | "regular" | "vip") => 
                  setFormData(prev => ({ ...prev, customerType: value }))
                }
                disabled={!isEditing}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value: "paid" | "partial" | "pending") => 
                  setFormData(prev => ({ ...prev, paymentStatus: value }))
                }
                disabled={!isEditing}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as "cash" | "card" | "mobile" | "credit" }))}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile Payment</SelectItem>
                  <SelectItem value="credit">Credit Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deliveryStatus">Delivery Status</Label>
              <Select
                value={formData.deliveryStatus}
                onValueChange={(value: "pickup" | "delivered" | "pending" | "cancelled") => 
                  setFormData(prev => ({ ...prev, deliveryStatus: value }))
                }
                disabled={!isEditing}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="staffName">Staff Member</Label>
              <Input
                id="staffName"
                value={formData.staffName}
                onChange={(e) => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                disabled={!isEditing}
                className="text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-foreground">Invoice #:</span>
              <span className="font-medium text-foreground">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Date:</span>
              <span className="text-foreground">{sale.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Time:</span>
              <span className="text-foreground">{sale.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Items:</span>
              <span className="text-foreground">{cartItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Subtotal:</span>
              <span className="text-foreground">Rs{cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Discount:</span>
              <span className="text-red-600">-Rs{cartDiscount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span className="text-foreground">Total:</span>
              <span className="text-foreground">Rs{cartTotal.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Items */}
      {isEditing ? (
        <EditableCartSales
          items={cartItems}
          onItemsChange={handleCartItemsChange}
          onTotalChange={handleTotalChange}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.code}</p>
                    <div className="flex gap-2 mt-2">
                      {item.fabricType && (
                        <Badge variant="secondary" className="text-xs">
                          {item.fabricType}
                        </Badge>
                      )}
                      {item.size && (
                        <Badge variant="outline" className="text-xs">
                          {item.size}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground">Rs{item.finalPrice.toLocaleString()} × {item.quantity}</p>
                    <p className="font-medium text-foreground">Rs{(item.totalAmount || item.finalPrice * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            disabled={!isEditing}
            placeholder="Add any additional notes..."
            className="text-foreground"
          />
        </CardContent>
      </Card>
    </div>
  )
}
