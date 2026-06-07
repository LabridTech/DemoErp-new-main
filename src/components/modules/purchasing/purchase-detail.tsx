"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PurchaseService, type Purchase } from "@/lib/firebase-services"
import { EditableCartPurchases } from "./editable-cart-purchases"
import { ArrowLeft, Save, Edit, X } from "lucide-react"

interface PurchaseDetailProps {
  purchase: Purchase
  onBack: () => void
  onPurchaseUpdated: () => void
}

export function PurchaseDetail({ purchase, onBack, onPurchaseUpdated }: PurchaseDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    supplierId: "",
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    totalAmount: "",
    discount: "",
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
  // const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        // const suppliersData = await SupplierService.getAllSuppliers()
        // setSuppliers(suppliersData)
      } catch (error) {
        console.error("Error loading suppliers:", error)
      }
    }
    loadSuppliers()
  }, [])

  // Initialize form data and cart items
  useEffect(() => {
    setFormData({
      supplierId: purchase.supplierId || "",
      supplierName: purchase.supplierName || "",
      supplierPhone: purchase.supplierPhone || "",
      supplierAddress: purchase.supplierAddress || "",
      totalAmount: purchase.totalAmount?.toString() || "",
      discount: purchase.discount?.toString() || "",
      notes: purchase.notes || ""
    })

    // Initialize cart totals from purchase data
    setCartSubtotal(purchase.subtotal || 0)
    setCartDiscount(purchase.discount || 0)
    setCartTotal(purchase.totalAmount || 0)

    // Initialize cart items from purchase items
    if (purchase.items && Array.isArray(purchase.items)) {
      const items = purchase.items.map(item => ({
        id: item.id || item.productId || "",
        name: item.name || "",
        code: item.code || "",
        unitPrice: item.unitPrice || 0,
        quantity: item.quantity || 0,
        discount: item.discount || 0,
        finalPrice: item.finalPrice || item.unitPrice || 0,
        availableStock: 0, // Not needed for editing existing purchases
        fabricType: item.fabricType,
        size: item.size,
        individualPrices: item.individualPrices,
        totalAmount: item.subtotal || (item.unitPrice || 0) * (item.quantity || 0)
      }))
      setCartItems(items)
    }
  }, [purchase])

  // Cart handlers
  const handleCartItemsChange = (items: typeof cartItems) => {
    setCartItems(items)
  }

  const handleTotalChange = (subtotal: number, discount: number, total: number) => {
    setCartSubtotal(subtotal)
    setCartDiscount(discount)
    setCartTotal(total)
  }

  // const handleSupplierChange = (supplierId: string) => {
  //   const supplier = suppliers.find(s => s.id === supplierId)
  //   if (supplier) {
  //     setFormData(prev => ({
  //       ...prev,
  //       supplierId: supplier.id,
  //       supplierName: supplier.name,
  //       supplierPhone: supplier.phone,
  //       supplierAddress: supplier.address
  //     }))
  //   }
  // }

  const handleSave = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the cart",
        variant: "destructive",
      })
      return
    }

    if (!formData.supplierId) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const updatedPurchase: Partial<Purchase> = {
        ...purchase,
        supplierId: formData.supplierId,
        supplierName: formData.supplierName,
        supplierPhone: formData.supplierPhone,
        supplierAddress: formData.supplierAddress,
        totalAmount: cartTotal,
        discount: cartDiscount,
        subtotal: cartSubtotal,
        notes: formData.notes,
        items: cartItems.map(item => {
          const purchaseItem: {
            id: string
            productId: string
            name: string
            code: string
            unitPrice: number
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
            quantity: item.quantity,
            discount: item.discount,
            finalPrice: item.finalPrice,
            subtotal: item.totalAmount || item.unitPrice * item.quantity
          }
          
          // Only add optional properties if they have values
          if (item.fabricType) purchaseItem.fabricType = item.fabricType
          if (item.size) purchaseItem.size = item.size
          if (item.individualPrices && item.individualPrices.length > 0) purchaseItem.individualPrices = item.individualPrices
          
          return purchaseItem
        })
      }

      await PurchaseService.updatePurchase(purchase.id, updatedPurchase)
      
      toast({
        title: "Success",
        description: "Purchase updated successfully",
      })
      
      setIsEditing(false)
      onPurchaseUpdated()
    } catch (error) {
      console.error("Error updating purchase:", error)
      toast({
        title: "Error",
        description: "Failed to update purchase",
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
      supplierId: purchase.supplierId || "",
      supplierName: purchase.supplierName || "",
      supplierPhone: purchase.supplierPhone || "",
      supplierAddress: purchase.supplierAddress || "",
      totalAmount: purchase.totalAmount?.toString() || "",
      discount: purchase.discount?.toString() || "",
      notes: purchase.notes || ""
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
              Back to Purchasing Ledger
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Purchase Details</h1>
              <p className="text-primary-foreground/80">Invoice #{purchase.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Purchase
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
        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                disabled={!isEditing}
                className="text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="supplierPhone">Phone Number</Label>
              <Input
                id="supplierPhone"
                value={formData.supplierPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierPhone: e.target.value }))}
                disabled={!isEditing}
                className="text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="supplierAddress">Address</Label>
              <Textarea
                id="supplierAddress"
                value={formData.supplierAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierAddress: e.target.value }))}
                disabled={!isEditing}
                className="text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* Purchase Information */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={purchase.invoiceNumber}
                disabled
                className="text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                value={purchase.date}
                disabled
                className="text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="purchaseTime">Purchase Time</Label>
              <Input
                id="purchaseTime"
                value={purchase.time}
                disabled
                className="text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="itemsCount">Items Count</Label>
              <Input
                id="itemsCount"
                value={cartItems.length.toString()}
                disabled
                className="text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* Purchase Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-foreground">Invoice #:</span>
              <span className="font-medium text-foreground">{purchase.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Date:</span>
              <span className="text-foreground">{purchase.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Time:</span>
              <span className="text-foreground">{purchase.time}</span>
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
        <EditableCartPurchases
          items={cartItems}
          onItemsChange={handleCartItemsChange}
          onTotalChange={handleTotalChange}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Items</CardTitle>
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
