"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PurchaseService, SupplierService, ProductService, type Purchase, type Supplier, type Product } from "@/lib/firebase-services"
import { EditableCartPurchases } from "./editable-cart-purchases"

interface EditPurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: Purchase | null
  onPurchaseUpdated: () => void
}

export function EditPurchaseDialog({ 
  open, 
  onOpenChange, 
  purchase, 
  onPurchaseUpdated 
}: EditPurchaseDialogProps) {
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
  // const [cartSubtotal, setCartSubtotal] = useState(0)
  const [cartDiscount, setCartDiscount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const suppliersData = await SupplierService.getAllSuppliers()
        setSuppliers(suppliersData)
      } catch (error) {
        console.error("Error loading suppliers:", error)
      }
    }
    loadSuppliers()
  }, [])

  // Update form data when purchase changes
  useEffect(() => {
    if (purchase) {
      setFormData({
        supplierId: purchase.supplierId || "",
        supplierName: purchase.supplierName || "",
        supplierPhone: purchase.supplierPhone || "",
        supplierAddress: purchase.supplierAddress || "",
        totalAmount: purchase.totalAmount?.toString() || "",
        discount: purchase.discount?.toString() || "",
        notes: purchase.notes || ""
      })

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
    }
  }, [purchase])

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierPhone: supplier.phone,
        supplierAddress: supplier.address
      }))
    }
  }

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
    
    if (!purchase) return

    if (!formData.supplierName.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required.",
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
      // Calculate stock changes
      const originalItems = purchase.items || []
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
          const product = await ProductService.getById("products", productId) as Product
          if (product) {
            const newStock = product.stock + quantityChange // Add because we're purchasing
            await ProductService.updateProduct(productId, {
              stock: newStock,
              updatedAt: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error(`Error updating stock for product ${productId}:`, error)
        }
      }

      // Convert cart items to purchase items format
      const purchaseItems = cartItems.map(item => {
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

      const updateData = {
        supplierId: formData.supplierId,
        supplierName: formData.supplierName.trim(),
        supplierPhone: formData.supplierPhone.trim(),
        supplierAddress: formData.supplierAddress.trim(),
        totalAmount: cartTotal,
        discount: cartDiscount,
        items: purchaseItems,
        notes: formData.notes.trim()
      }

      // Properties are already included in the object above

      await PurchaseService.updatePurchase(purchase.id, updateData)
      
      toast({
        title: "Purchase Updated",
        description: "Purchase record has been updated successfully with stock changes.",
      })

      onOpenChange(false)
      onPurchaseUpdated()
    } catch (error) {
      console.error("Error updating purchase:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!purchase) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Purchase Record</DialogTitle>
          <DialogDescription>
            Update the details for invoice #{purchase.invoiceNumber}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Supplier Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Supplier Information</h3>
              <div className="space-y-2">
                <Label htmlFor="supplier">Select Supplier</Label>
                <Select value={formData.supplierId} onValueChange={handleSupplierChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Supplier Name *</Label>
                  <Input
                    id="supplierName"
                    value={formData.supplierName}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                    placeholder="Enter supplier name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierPhone">Phone Number</Label>
                  <Input
                    id="supplierPhone"
                    value={formData.supplierPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierPhone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierAddress">Address</Label>
                <Textarea
                  id="supplierAddress"
                  value={formData.supplierAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierAddress: e.target.value }))}
                  placeholder="Enter supplier address"
                  rows={2}
                />
              </div>
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

            {/* Cart Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cart Items</h3>
              <EditableCartPurchases
                items={cartItems}
                onItemsChange={handleCartItemsChange}
                onTotalChange={handleCartTotalChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Purchase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
