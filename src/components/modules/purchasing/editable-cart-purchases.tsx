"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Trash2, Search, Package } from "lucide-react"
import { ProductService, type Product } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
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
}

interface EditableCartPurchasesProps {
  items: CartItem[]
  onItemsChange: (items: CartItem[]) => void
  onTotalChange: (subtotal: number, discount: number, total: number) => void
}

export function EditableCartPurchases({ items, onItemsChange, onTotalChange }: EditableCartPurchasesProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cartDiscount, setCartDiscount] = useState(0)
  const [cartDiscountPercentage, setCartDiscountPercentage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        const productsData = await ProductService.getAllProducts()
        setProducts(productsData)
      } catch (error) {
        console.error("Error loading products:", error)
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [toast])

  // Update cart items with current stock information when products are loaded
  useEffect(() => {
    if (products.length > 0 && items.length > 0) {
      const updatedItems = items.map(item => {
        const product = products.find(p => p.id === item.id || p.code === item.code)
        return {
          ...item,
          availableStock: product?.stock || 0
        }
      })
      
      // Only update if there are actual changes to avoid infinite loops
      const hasChanges = updatedItems.some((item, index) => 
        item.availableStock !== items[index]?.availableStock
      )
      
      if (hasChanges) {
        onItemsChange(updatedItems)
      }
    }
  }, [products, items, onItemsChange])

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    if (item.individualPrices && item.individualPrices.length > 0) {
      return sum + item.individualPrices.reduce((priceSum, price) => priceSum + price, 0)
    }
    return sum + (item.totalAmount || item.finalPrice * item.quantity)
  }, 0)

  const total = subtotal - cartDiscount

  // Update parent component when totals change
  useEffect(() => {
    onTotalChange(subtotal, cartDiscount, total)
  }, [subtotal, cartDiscount, total, onTotalChange])

  const addToCart = (product: Product) => {
    const existingItem = items.find((item) => item.id === product.id)
    
    let updatedItems: CartItem[]
    
    if (existingItem) {
      updatedItems = items.map((item) => {
        if (item.id === product.id) {
          const newQuantity = item.quantity + 1
          const newIndividualPrices = [...(item.individualPrices || []), product.purchaseCost]
          const newTotalAmount = newIndividualPrices.reduce((sum, price) => sum + price, 0)
          
          return { 
            ...item, 
            quantity: newQuantity,
            finalPrice: newQuantity * item.unitPrice,
            totalAmount: newTotalAmount,
            individualPrices: newIndividualPrices
          }
        }
        return item
      })
    } else {
      updatedItems = [
        ...items,
        {
          id: product.id,
          name: product.name,
          code: product.code,
          unitPrice: product.purchaseCost,
          quantity: 1,
          discount: 0,
          finalPrice: product.purchaseCost,
          availableStock: product.stock,
          fabricType: product.fabricType,
          size: product.size,
          individualPrices: [product.purchaseCost],
          totalAmount: product.purchaseCost,
        },
      ]
    }
    
    onItemsChange(updatedItems)
    
    // Recalculate discount based on new cart total
    if (cartDiscountPercentage > 0) {
      const newSubtotal = updatedItems.reduce((sum, item) => {
        if (item.individualPrices && item.individualPrices.length > 0) {
          return sum + item.individualPrices.reduce((priceSum, price) => priceSum + price, 0)
        }
        return sum + (item.totalAmount || item.finalPrice * item.quantity)
      }, 0)
      const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
      setCartDiscount(newDiscount)
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity cannot be negative",
        variant: "destructive",
      })
      return
    }

    if (newQuantity === 0) {
      removeFromCart(id)
      return
    }

    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const newTotalAmount = newQuantity * item.unitPrice
        
        return { 
          ...item, 
          quantity: newQuantity, 
          finalPrice: newQuantity * item.unitPrice,
          totalAmount: newTotalAmount,
          individualPrices: [] // Clear individual prices for quantity changes
        }
      }
      return item
    })
    
    onItemsChange(updatedItems)
    
    // Recalculate discount based on new cart total
    if (cartDiscountPercentage > 0) {
      const newSubtotal = updatedItems.reduce((sum, item) => {
        if (item.individualPrices && item.individualPrices.length > 0) {
          return sum + item.individualPrices.reduce((priceSum, price) => priceSum + price, 0)
        }
        return sum + (item.totalAmount || item.finalPrice * item.quantity)
      }, 0)
      const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
      setCartDiscount(newDiscount)
    }
  }

  const removeFromCart = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id)
    onItemsChange(updatedItems)
    
    // Recalculate discount when cart changes
    if (updatedItems.length === 0) {
      setCartDiscount(0)
      setCartDiscountPercentage(0)
    } else if (cartDiscountPercentage > 0) {
      const newSubtotal = updatedItems.reduce((sum, item) => {
        if (item.individualPrices && item.individualPrices.length > 0) {
          return sum + item.individualPrices.reduce((priceSum, price) => priceSum + price, 0)
        }
        return sum + (item.totalAmount || item.finalPrice * item.quantity)
      }, 0)
      const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
      setCartDiscount(newDiscount)
    }
  }

  const handleDiscountChange = (value: string) => {
    const percentage = parseFloat(value) || 0
    setCartDiscountPercentage(percentage)
    
    if (percentage > 0) {
      const newDiscount = Math.round((subtotal * percentage) / 100)
      setCartDiscount(newDiscount)
    } else {
      setCartDiscount(0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Product Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Search className="h-5 w-5" />
            Add Products
          </CardTitle>
          <CardDescription className="text-muted-foreground">Search and add products to the cart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {filteredProducts.map((product) => {
                const isInCart = items.some(item => item.id === product.id)
                const cartItem = items.find(item => item.id === product.id)
                const isLowStock = product.stock <= 5
                const isOutOfStock = product.stock === 0
                
                return (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-card text-card-foreground ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                    } ${isInCart ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : ''}`}
                    onClick={() => !isOutOfStock && addToCart(product)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.code}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-green-600 font-semibold">Rs{product.purchaseCost.toLocaleString()}</p>
                        {isInCart && (
                          <Badge variant="secondary" className="text-xs">
                            In Cart ({cartItem?.quantity || 0})
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <p className={`text-xs ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-muted-foreground'}`}>
                          Stock: {product.stock}
                        </p>
                        {isLowStock && !isOutOfStock && (
                          <Badge variant="destructive" className="text-xs">
                            Low Stock
                          </Badge>
                        )}
                        {isOutOfStock && (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant={isOutOfStock ? "secondary" : "outline"} 
                      className="ml-2"
                      disabled={isOutOfStock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cart Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5" />
            Cart Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items in cart. Add products to get started.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-foreground">
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.code}</p>
                            {item.fabricType && (
                              <Badge variant="secondary" className="text-xs">
                                {item.fabricType}
                              </Badge>
                            )}
                            {item.size && (
                              <Badge variant="outline" className="text-xs ml-1">
                                {item.size}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <div className="text-sm">
                            <p className="text-foreground">Rs{item.finalPrice.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">per unit</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                              className="w-20 text-center text-foreground"
                              min="0"
                              step="0.1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <div className="text-sm">
                            <p className="font-medium text-green-600">
                              {item.availableStock}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <div className="text-sm font-medium text-foreground">
                            Rs{(item.totalAmount || item.unitPrice * item.quantity).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cart Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground">Subtotal:</span>
                    <span className="text-foreground">Rs{subtotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="discount" className="text-sm text-foreground">Discount:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="discount"
                        type="number"
                        value={cartDiscountPercentage}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        className="w-20 text-foreground"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <span className="text-sm text-red-600">-Rs{cartDiscount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span className="text-foreground">Total:</span>
                    <span className="text-foreground">Rs{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
