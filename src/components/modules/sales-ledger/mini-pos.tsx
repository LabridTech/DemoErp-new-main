"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Minus, Trash2, User, CreditCard, ShoppingCart, AlertTriangle, Gift, DollarSign } from "lucide-react"
import { ProductService, SalesService, EmployeeService, CustomerCreditService, type Product, type Employee, type SaleItem, type SaleRecord, CustomerService, type Customer } from "@/lib/firebase-services"
import { InvoiceCounterService } from "@/lib/invoice-counter-service"
import { useToast } from "@/hooks/use-toast"
import { usePOS } from "@/contexts/POSContext"

import { PostSaleModal } from "../pos/post-sale-modal"
import { AdvancedPricingDialog } from "../pos/advanced-pricing-dialog"
import { getCurrentTime } from "@/lib/date-utils"

// Defining the types for cart items
interface CartItem {
  id: string
  name: string
  code: string
  unitPrice: number
  quantity: number
  discount: number
  finalPrice: number
  availableStock: number
  tradeDiscountQuantity?: number
  tradeDiscountFreeItems?: number
  fabricType?: string
  size?: string
  individualPrices?: number[] // Array of individual prices for each unit
  totalAmount?: number // Total amount for this product
}

interface MiniPOSProps {
  customer: Customer
  onSaleCreated: (sale: SaleRecord) => Promise<void>
  onClose: () => void
}

export function MiniPOS({ customer, onSaleCreated }: MiniPOSProps) {
  // Use POS Context for state management
  const {
    cart,
    customerName,
    customerPhone,
    customerAddress,
    paymentMethod,
    partialPaymentAmount,
    staffMember,
    manualStaffName,
    deliveryType,
    deliveryAddress,
    deliveryDate,
    cartDiscount,
    cartDiscountPercentage,
    searchTerm,
    addToCart: contextAddToCart,
    setCustomerName,
    setCustomerPhone,
    setCustomerAddress,
    setPartialPaymentAmount,
    setStaffMember,
    setManualStaffName,
    setDeliveryType,
    setDeliveryAddress,
    setDeliveryDate,
    setCartDiscount,
    setCartDiscountPercentage,
    setSearchTerm,
    clearCart,
    resetForm
  } = usePOS()

  // Local state for non-persistent data
  const [products, setProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessingSale, setIsProcessingSale] = useState(false)
  const { toast } = useToast()
  const [showPostSaleModal, setShowPostSaleModal] = useState(false)

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);

  // Advanced pricing dialog state
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingItem, setPricingItem] = useState<CartItem | null>(null);

  // Initialize customer data when component mounts
  useEffect(() => {
    if (customer) {
      setCustomerName(customer.name || '')
      setCustomerPhone(customer.phone || '')
      setCustomerAddress(customer.address || '')
    }
  }, [customer, setCustomerName, setCustomerPhone, setCustomerAddress])

  // Load products and employees from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, employeesData] = await Promise.all([
          ProductService.getAllProducts(),
          EmployeeService.getAllEmployees(),
        ])
        // Remove duplicate products by ID to prevent React key conflicts
        const uniqueProducts = productsData.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        )
        
        setProducts(uniqueProducts)
        setEmployees(employeesData)
        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await CustomerService.getAllCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Error loading customers:", error)
      }
    };
    loadCustomers();
  }, []);

  // Memoized filtered products for better performance
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const searchLower = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        (product.name || '').toLowerCase().includes(searchLower) ||
        (product.code || '').toLowerCase().includes(searchLower),
    );
  }, [products, searchTerm]);

  // Add trade discount to existing cart item
  const addTradeDiscountUnit = (productId: string) => {
    const existingItem = cart.find(item => item.id === productId)
    if (!existingItem) {
      toast({
        title: "Error",
        description: "Please add the product to cart first before applying trade discount",
        variant: "destructive",
      })
      return
    }

    const updatedCart = cart.map(item => 
      item.id === productId 
        ? { 
            ...item, 
            tradeDiscountFreeItems: (item.tradeDiscountFreeItems || 0) + 1 
          }
        : item
    )
    
    // Update the context cart
    clearCart()
    updatedCart.forEach(item => {
      contextAddToCart(item)
    })
    toast({ 
      title: "Trade Discount Added", 
      description: `1 free unit added for ${existingItem.name}` 
    })
  }

  // Remove trade discount from cart item
  const removeTradeDiscountUnit = (productId: string) => {
    const existingItem = cart.find(item => item.id === productId)
    if (!existingItem || !existingItem.tradeDiscountFreeItems || existingItem.tradeDiscountFreeItems <= 0) {
      return
    }

    const updatedCart = cart.map(item => 
      item.id === productId 
        ? { 
            ...item, 
            tradeDiscountFreeItems: Math.max(0, (item.tradeDiscountFreeItems || 0) - 1) 
          }
        : item
    )
    
    // Update the context cart
    clearCart()
    updatedCart.forEach(item => {
      contextAddToCart(item)
    })
    toast({ 
      title: "Trade Discount Removed", 
      description: `1 free unit removed from ${existingItem.name}` 
    })
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id)
    
    let updatedCart: CartItem[]
    
    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity + 1 > product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock} yard(s) available for ${product.name}`,
          variant: "destructive",
        })
        return
      }
      
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              finalPrice: (item.quantity + 1) * item.unitPrice,
              individualPrices: Number.isInteger(item.quantity + 1) ? [...(item.individualPrices || []), product.currentPrice] : [],
              totalAmount: (item.totalAmount || 0) + product.currentPrice
            }
          : item,
      )
    } else {
      // Check if product has stock
      if (product.stock <= 0) {
        toast({
          title: "Out of Stock",
          description: `${product.name} is out of stock`,
          variant: "destructive",
        })
        return
      }
      
      updatedCart = [
        ...cart,
        {
        id: product.id,
        name: product.name,
        code: product.code,
        unitPrice: product.currentPrice,
        quantity: 1,
          discount: 0, // No longer used, but kept for type compatibility
        finalPrice: product.currentPrice,
        availableStock: product.stock,
        fabricType: product.fabricType,
        size: product.size,
        individualPrices: [product.currentPrice],
        totalAmount: product.currentPrice,
        },
      ]
    }
    
    // Update the context cart
    clearCart()
    updatedCart.forEach(item => {
      contextAddToCart(item)
    })
    
    // Recalculate discount based on new cart total
    if (cartDiscountPercentage > 0) {
      const newSubtotal = updatedCart.reduce((sum, item) => {
        const itemTotal = item.individualPrices ? item.individualPrices.reduce((sum, price) => sum + price, 0) : item.quantity * item.unitPrice
        return sum + itemTotal
      }, 0)
      const newDiscount = (newSubtotal * cartDiscountPercentage) / 100
      setCartDiscount(newDiscount)
    }
    
    toast({
      title: "Added to Cart",
      description: `${product.name} added to cart`,
    })
  }

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter((item) => item.id !== productId)
    
    // Update the context cart
    clearCart()
    updatedCart.forEach(item => {
      contextAddToCart(item)
    })
    
    // Recalculate discount based on new cart total
    if (cartDiscountPercentage > 0) {
      const newSubtotal = updatedCart.reduce((sum, item) => {
        const itemTotal = item.individualPrices ? item.individualPrices.reduce((sum, price) => sum + price, 0) : item.quantity * item.unitPrice
        return sum + itemTotal
      }, 0)
      const newDiscount = (newSubtotal * cartDiscountPercentage) / 100
      setCartDiscount(newDiscount)
    }
    
      toast({
      title: "Removed from Cart",
      description: "Item removed from cart",
    })
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find(p => p.id === productId)
    if (!product) return

    if (newQuantity > product.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} yard(s) available for ${product.name}`,
        variant: "destructive",
      })
      return
    }

    const updatedCart = cart.map((item) =>
      item.id === productId
        ? { 
          ...item, 
          quantity: newQuantity, 
          finalPrice: newQuantity * item.unitPrice,
            individualPrices: Number.isInteger(newQuantity) ? Array(newQuantity).fill(item.unitPrice) : [],
            totalAmount: newQuantity * item.unitPrice
          }
        : item,
    )
    
    // Update the context cart
    clearCart()
    updatedCart.forEach(item => {
      contextAddToCart(item)
    })
    
    // Recalculate discount based on new cart total
    if (cartDiscountPercentage > 0) {
      const newSubtotal = updatedCart.reduce((sum, item) => {
        const itemTotal = item.individualPrices ? item.individualPrices.reduce((sum, price) => sum + price, 0) : item.quantity * item.unitPrice
        return sum + itemTotal
      }, 0)
      const newDiscount = (newSubtotal * cartDiscountPercentage) / 100
      setCartDiscount(newDiscount)
    }
  }

  // Handle quantity input changes
  const handleQuantityInput = (productId: string, value: string) => {
    const numericValue = parseFloat(value)
    if (!isNaN(numericValue) && numericValue >= 0) {
      updateQuantity(productId, numericValue)
    }
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const itemTotal = item.individualPrices && item.individualPrices.length > 0 ? item.individualPrices.reduce((sum, price) => sum + price, 0) : item.quantity * item.unitPrice
    return sum + itemTotal
  }, 0)

  const discount = typeof cartDiscount === 'string' ? parseFloat(cartDiscount) || 0 : cartDiscount || 0
  const total = subtotal - discount

  // Check for stock issues
  const hasStockIssues = cart.some(item => {
    const product = products.find(p => p.id === item.id)
    return product && item.quantity > product.stock
  })

  // Enhanced customer search logic
  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);
    
    if (value.length > 0) {
      const filteredCustomers = customers.filter(c => {
        // Search by name
        if ((c.name || '').toLowerCase().includes(value.toLowerCase())) {
          return true;
        }
        
        // Search by address
        if (c.address && (c.address || '').toLowerCase().includes(value.toLowerCase())) {
          return true;
        }
        
        // Search by phone with smart 0/92 handling and normalization
        if (value.match(/^[0-9+\-\s]/)) {
          const customerPhone = c.phone;
          
          // Normalize both numbers by removing +, -, and spaces
          const normalizeForSearch = (num: string) => {
            return num.replace(/[+\-\s]/g, '');
          };
          
          const normalizedValue = normalizeForSearch(value);
          const normalizedCustomerPhone = normalizeForSearch(customerPhone);
          
          // If user types 92 prefix and customer has 0 prefix
          if (normalizedValue.startsWith('92') && normalizedCustomerPhone.startsWith('0')) {
            const userNumber = normalizedValue.substring(2); // Remove "92"
            const customerNumber = normalizedCustomerPhone.substring(1); // Remove "0"
            return customerNumber === userNumber || customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
          }
          
          // If user types 0 prefix and customer has 92 prefix
          if (normalizedValue.startsWith('0') && normalizedCustomerPhone.startsWith('92')) {
            const userNumber = normalizedValue.substring(1); // Remove "0"
            const customerNumber = normalizedCustomerPhone.substring(2); // Remove "92"
            return customerNumber === userNumber || customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
          }
          
          // If both have same prefix, do normal matching
          if ((normalizedValue.startsWith('92') && normalizedCustomerPhone.startsWith('92')) || 
              (normalizedValue.startsWith('0') && normalizedCustomerPhone.startsWith('0'))) {
            return normalizedCustomerPhone.includes(normalizedValue) || normalizedValue.includes(normalizedCustomerPhone);
          }
          
          // Fallback to normal matching with normalized numbers
          return normalizedCustomerPhone.includes(normalizedValue) || normalizedValue.includes(normalizedCustomerPhone);
        }
        
        return false;
      });
      setCustomerSuggestions(filteredCustomers.slice(0, 10)); // Limit to 10 suggestions
    } else {
      setCustomerSuggestions([]);
    }
  };

  const handleCustomerSuggestionSelect = (customer: Customer) => {
    setCustomerName(customer.name || '');
    setCustomerPhone(customer.phone || '');
    setCustomerAddress(customer.address || '');
    setCustomerSuggestions([]);
  };


  const staffNameForInvoice = manualStaffName.trim() || (employees.find((emp) => emp.id === staffMember)?.name || "");

  // Handle advanced pricing
  const openPricingModal = (item: CartItem) => {
    setPricingItem(item);
    setShowPricingModal(true);
  };

  // Handle price update with individual pricing
  const handlePriceUpdate = (productId: string, newPrice: number, individualPrices: number[]) => {
    const totalAmount = individualPrices.reduce((sum, price) => sum + price, 0);
    
    // Update the cart with new price and individual prices
    const updatedCart = cart.map(item =>
      item.id === productId
        ? { 
            ...item, 
            unitPrice: newPrice,
            finalPrice: totalAmount,
            individualPrices: individualPrices,
            totalAmount: totalAmount
          }
        : item
    );
    
    // Update the context cart
    clearCart()
    updatedCart.forEach(item => {
      contextAddToCart(item)
    })
    
    // Recalculate discount based on new cart total
    if (cartDiscountPercentage > 0) {
      const newSubtotal = updatedCart.reduce((sum, item) => {
        const itemTotal = item.individualPrices ? item.individualPrices.reduce((sum, price) => sum + price, 0) : item.quantity * item.unitPrice
        return sum + itemTotal
      }, 0)
      const newDiscount = (newSubtotal * cartDiscountPercentage) / 100
      setCartDiscount(newDiscount)
    }
    
    setShowPricingModal(false);
    setPricingItem(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      })
      return
    }

    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      })
      return
    }

    if (!customerName.trim()) {
      toast({
        title: "Customer Name Required",
        description: "Please enter customer name",
        variant: "destructive",
      })
      return
    }

    if (!customerPhone.trim()) {
      toast({
        title: "Customer Phone Required",
        description: "Please enter customer phone number",
        variant: "destructive",
      })
      return
    }

    if (hasStockIssues) {
      toast({
        title: "Stock Issues",
        description: "Please resolve stock issues before checkout",
        variant: "destructive",
      })
      return
    }

    setIsProcessingSale(true)

    try {
      // Generate invoice number
      const invoiceNumber = await InvoiceCounterService.getNextInvoiceNumber()

      // Convert cart items to sale items
      const saleItems: SaleItem[] = cart.map((item) => ({
        id: item.id,
        productId: item.id,
        name: item.name,
        code: item.code,
        quantity: item.quantity,
        originalPrice: item.unitPrice,
        finalPrice: item.unitPrice,
        discount: 0,
        subtotal: item.totalAmount || (item.quantity * item.unitPrice),
        fabricType: item.fabricType,
        size: item.size,
        individualPrices: item.individualPrices || [],
        tradeDiscountFreeItems: item.tradeDiscountFreeItems || 0,
        unitPrice: item.unitPrice,
      }))

      // Create sale record
      const saleData: Omit<SaleRecord, 'id'> = {
        invoiceNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        items: saleItems,
        subtotal,
        discount: discount,
        total,
        paymentMethod: paymentMethod as "cash" | "card" | "mobile" | "credit",
        paymentStatus: paymentMethod === "credit" ? "pending" : "paid",
        customerType: "walk-in" as const,
        tax: 0,
        deliveryStatus: "pending" as const,
        deliveryType: deliveryType || "pickup",
        deliveryAddress: deliveryAddress || "",
        deliveryDate: deliveryDate || "",
        staffMember: staffMember || "",
        staffName: staffNameForInvoice,
        notes: "",
        returnStatus: "none" as const,
        date: new Date().toISOString().split('T')[0], // Store as YYYY-MM-DD for consistent parsing
        time: getCurrentTime(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save sale to Firebase
      const createdSaleId = await SalesService.createSale(saleData)

      // Update inventory and record stock movements
      try {
        await Promise.all(cart.map(async (item) => {
          // Fetch latest product data to ensure accurate stock calculation
          const product = await ProductService.getById<Product>("products", item.id);
          
          if (product) {
            const newStock = (product.stock || 0) - item.quantity;
            
            // Update product stock
            await ProductService.updateProduct(item.id, { 
              stock: newStock 
            });

            // Create stock movement record
            await ProductService.addStockMovement({
              itemId: item.id,
              itemName: item.name,
              type: "out",
              quantity: item.quantity,
              reason: `Sale #${invoiceNumber} (MiniPOS)`,
              staff: staffMember || "System",
              date: new Date().toISOString().split('T')[0],
              reference: invoiceNumber
            });
          }
        }));
      } catch (stockError) {
        console.error("Error updating stock levels:", stockError);
        toast({
          title: "Warning",
          description: "Sale created but stock levels may not be updated correctly.",
          variant: "destructive",
        })
      }

      // Create the full sale object for the callback
      const createdSale: SaleRecord = {
        id: createdSaleId,
        ...saleData
      }

      // Handle credit sale and partial payments
      if (paymentMethod === "credit") {
        try {
          const partialAmount = parseFloat(partialPaymentAmount) || 0
          
          // If there's a partial payment, record it as a customer credit
          if (partialAmount > 0) {
            const paymentData = {
              customerId: customer.id,
              customerName: customerName,
              amount: partialAmount,
              type: "credit" as const,
              reason: `Partial payment for sale ${invoiceNumber}`,
              description: `Initial partial payment of Rs${partialAmount.toLocaleString()} from MiniPOS`,
              saleId: createdSaleId,
              invoiceNumber: invoiceNumber,
              createdBy: staffMember || "mini_pos_system",
              status: "active" as const,
              createdAt: new Date().toISOString(),
            }

            await CustomerCreditService.createCredit(paymentData)
          }
        } catch (error) {
          console.error("Error creating customer credit for partial payment:", error)
          // Don't fail the sale if credit creation fails
        }
      }

      // Create payment entry for cash, card, or mobile payments
      if (paymentMethod === "cash" || paymentMethod === "card" || paymentMethod === "mobile") {
        try {
          const paymentData = {
            customerId: customer.id,
            customerName: customerName,
            amount: total,
            type: "credit" as const,
            reason: `Payment via ${paymentMethod.toUpperCase()} for sale ${invoiceNumber}`,
            description: `Full payment of Rs${total.toLocaleString()} via ${paymentMethod.toUpperCase()} from MiniPOS`,
            saleId: createdSaleId,
            invoiceNumber: invoiceNumber,
            createdBy: staffMember || "mini_pos_system",
            status: "active" as const,
            createdAt: new Date().toISOString(),
          }

          await CustomerCreditService.createCredit(paymentData)
        } catch (error) {
          console.error("Error creating payment entry for sale:", error)
          // Don't fail the sale if payment creation fails
        }
      }

      // Update employee performance
      if (staffMember) {
        // Note: EmployeePerformanceService doesn't have updatePerformance method
        // This would need to be implemented if employee performance tracking is needed
      }

      // Clear cart and reset form
      clearCart()
      resetForm()

      // Show success message
      toast({
        title: "Sale Completed",
        description: `Sale #${invoiceNumber} created successfully`,
      })

      // Call the callback to notify parent component
      await onSaleCreated(createdSale)

      // Show post-sale modal
      setShowPostSaleModal(true)

    } catch (error) {
      console.error("Error creating sale:", error)
      toast({
        title: "Error",
        description: "Failed to create sale. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingSale(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-background rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-black">★</span>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Loading POS Module</h2>
              <p className="text-muted-foreground">Please wait while we prepare your point of sale system...</p>
            </div>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
            </div>
            </div>
          </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-6 bg-background min-h-screen p-4 pb-12">
      {/* Product Search & Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-2 border-gray-300 dark:border-gray-600 shadow-xl card-hover bg-white dark:bg-gray-900">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-50/50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/20 border-b-2 border-slate-300 dark:border-slate-600">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
              <Search className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              Product Search
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-300">Search by name or code</CardDescription>
        </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="pos-product-search"
                  name="pos-product-search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 vibrant-input text-lg"
                />
              </div>

              <div className="grid gap-1 max-h-64 overflow-y-auto">
                {filteredProducts.map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className={`flex items-center justify-between p-2 border border-border rounded-md transition-all duration-300 hover:shadow-lg ${
                      product.stock <= 0 ? 'opacity-50 bg-muted' : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Code: {product.code}</p>
                      <p className="text-xs text-muted-foreground">Size: {product.size}</p>
                      <p className={`text-xs ${product.stock <= 0 ? 'text-white font-medium' : 'text-muted-foreground'}`}>
                        Stock: {product.stock} yard(s)
                        {product.stock <= 0 && (
                          <span className="ml-1 text-white font-medium">Out of Stock</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-xs text-foreground">Rs{product.currentPrice}</p>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={product.stock <= 0}
                          className={`h-6 w-6 p-0 border-border hover:bg-white hover:text-black transition-all duration-200 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const cartItem = cart.find(item => item.id === product.id);
                            if (cartItem) {
                              updateQuantity(product.id, cartItem.quantity - 1);
                            }
                          }}
                        >
                          <Minus className="h-2 w-2" />
                        </Button>
                        <span className="text-sm w-8 h-6 text-center font-medium bg-muted px-2 py-1 rounded flex items-center justify-center">
                          {cart.find(item => item.id === product.id)?.quantity || 0}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={product.stock <= 0}
                          className={`h-6 w-6 p-0 border-orange-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:bg-gray-200 disabled:hover:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 dark:border-orange-600 dark:hover:bg-orange-600 dark:disabled:bg-gray-700 dark:disabled:hover:bg-gray-700 dark:disabled:text-gray-500 dark:disabled:border-gray-600 transition-all duration-200 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                        >
                          <Plus className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unified Customer, Payment & Staff Section */}
        <Card className="border-2 border-gray-300 dark:border-gray-600 shadow-xl card-hover bg-white dark:bg-gray-900">
          <CardHeader className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 border-b-2 border-gray-300 dark:border-gray-600 pb-4">
            <CardTitle className="flex items-center gap-2 text-base text-foreground mb-2">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              Sale Information
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed">
              Customer details, payment method, and staff assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Customer Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground">Customer Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="customerName" className="text-xs font-medium block">Customer Name</Label>
                    <div className="relative">
                      <Input
                        id="customerName"
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={handleCustomerNameChange}
                        className="h-8 text-sm w-full"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                      {customerSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {customerSuggestions.map((customer) => (
                            <div
                              key={customer.id}
                              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                              onClick={() => handleCustomerSuggestionSelect(customer)}
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-xs text-gray-500">{customer.phone}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customerPhone" className="text-xs font-medium block">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      placeholder="Enter phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-8 text-sm w-full"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customerAddress" className="text-xs font-medium block">Address (Optional)</Label>
                    <Input
                      id="customerAddress"
                      placeholder="Enter address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="h-8 text-sm w-full"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground">Delivery Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="deliveryType" className="text-xs font-medium block">Delivery Type</Label>
                    <Select value={deliveryType} onValueChange={(value) => setDeliveryType(value as "pickup" | "delivery")}>
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">Pickup</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {deliveryType === 'delivery' && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="deliveryAddress" className="text-xs font-medium block">Delivery Address</Label>
                        <Input
                          id="deliveryAddress"
                          placeholder="Enter delivery address"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="h-8 text-sm w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="deliveryDate" className="text-xs font-medium block">Delivery Date (optional)</Label>
                        <Input
                          id="deliveryDate"
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="h-8 text-sm w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Staff Member Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground">Staff Member</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium block">Select Staff</Label>
                    <Select value={staffMember} onValueChange={setStaffMember}>
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="Choose staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium block">Or Enter Name</Label>
                    <Input
                      placeholder="Type staff name"
                      value={manualStaffName}
                      onChange={e => setManualStaffName(e.target.value)}
                      className="h-8 text-sm w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground">Payment Method</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium block">Payment Method</Label>
                    <div className="flex items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium">Credit Sale</span>
                    </div>
                    <input type="hidden" value="credit" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium block">
                      Partial Payment (Optional)
                    </Label>
                    <Input
                      type="number"
                      placeholder="Enter partial payment amount"
                      value={partialPaymentAmount}
                      onChange={(e) => setPartialPaymentAmount(e.target.value)}
                      className="h-8 text-sm w-full"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for full credit sale
                    </p>
                    {partialPaymentAmount && parseFloat(partialPaymentAmount) > 0 && (
                      <p className="text-xs text-orange-600 font-medium">
                        Remaining: Rs{(total - parseFloat(partialPaymentAmount)).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium block">Complete Sale</Label>
                  <Button
                      onClick={handleCheckout}
                      disabled={cart.length === 0 || hasStockIssues || isProcessingSale}
                    size="sm"
                      className="w-full h-8 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-600 dark:bg-green-600 dark:hover:bg-green-700 dark:disabled:bg-gray-600 dark:disabled:hover:bg-gray-600 dark:disabled:text-gray-400"
                    >
                      {isProcessingSale ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        'Complete Sale'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
              </div>

      {/* Cart & Checkout */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="border-2 border-gray-300 dark:border-gray-600 shadow-xl bg-white dark:bg-gray-900">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-300 dark:border-gray-600 pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-semibold">Shopping Cart</span>
                {hasStockIssues && (
                  <AlertTriangle className="h-3 w-3 text-red-500 dark:text-red-400 animate-pulse" />
                )}
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
              {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Cart is empty</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Add products to get started</p>
                </div>
              ) : (
              <div className="max-h-130 overflow-y-auto">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {cart.map((item, index) => {
                  const product = products.find((p) => p.id === item.id)
                  const exceedsStock = product ? item.quantity > product.stock : false
                  const uniqueKey = `${item.id}-${index}`
                  
                  return (
                    <div key={uniqueKey} className={`p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 ${exceedsStock ? 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/20' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <h4 className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">{item.name}</h4>
                            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0">
                              {item.code}
                            </Badge>
                            {exceedsStock && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                Stock Issue
                              </Badge>
                            )}
                            {item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1 py-0">
                                <Gift className="h-2 w-2 mr-1" />
                                {item.tradeDiscountFreeItems} Free
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>Size: {product?.size}</span>
                            <span>Rs{item.unitPrice.toFixed(2)}</span>
                            {exceedsStock && (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                Available: {product?.stock || 0}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost" 
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 h-5 w-5 p-0"
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                          variant="outline" 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:border-red-600 dark:hover:bg-red-600 h-5 w-5 p-0"
                          >
                          <Minus className="h-2 w-2" />
                          </Button>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                          max={product?.stock || 0}
                            value={item.quantity || ""}
                            placeholder="0"
                            onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                            onFocus={(e) => {
                              if (e.target.value === "0") {
                                e.target.value = ""
                              }
                            }}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              e.target.value = "0"
                            }
                          }}
                          className="h-6 w-16 text-center text-sm border-gray-300 focus:border-orange-500 dark:border-gray-600 dark:focus:border-orange-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                          <Button
                            size="sm"
                          variant="outline" 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={product ? item.quantity >= product.stock : false}
                          className="border-green-300 hover:bg-green-500 hover:text-white hover:border-green-500 disabled:bg-gray-200 disabled:hover:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 dark:border-green-600 dark:hover:bg-green-600 dark:disabled:bg-gray-700 dark:disabled:hover:bg-gray-700 dark:disabled:text-gray-500 dark:disabled:border-gray-600 h-5 w-5 p-0"
                          >
                          <Plus className="h-2 w-2" />
                          </Button>
                        <div className="flex items-center gap-1 ml-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addTradeDiscountUnit(item.id)}
                          className="bg-white text-black hover:bg-gray-100 h-5 text-xs px-1"
                        >
                          <Gift className="h-2 w-2 mr-1" />
                          Free
                        </Button>
                        {item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 && (
                            <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeTradeDiscountUnit(item.id)}
                                className="border-border hover:bg-white/10 hover:text-white h-5 w-5 p-0"
                              >
                                <Minus className="h-2 w-2" />
                              </Button>
                              <span className="text-xs font-medium text-foreground px-1">
                                {item.tradeDiscountFreeItems}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Free Products Manual Entry */}
                      <div className="mt-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Free Products</Label>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              const currentFree = item.tradeDiscountFreeItems || 0
                              const newFree = Math.max(0, currentFree - 1)
                              const updatedCart = cart.map(cartItem => 
                                cartItem.id === item.id 
                                  ? { ...cartItem, tradeDiscountFreeItems: newFree }
                                  : cartItem
                              )
                              // Update the context cart
                              clearCart()
                              updatedCart.forEach(item => {
                                contextAddToCart(item)
                              })
                            }}
                            className="border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:border-red-600 dark:hover:bg-red-600 h-5 w-5 p-0"
                          >
                            <Minus className="h-2 w-2" />
                            </Button>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.tradeDiscountFreeItems || ""}
                              placeholder="0"
                            onChange={(e) => {
                              const freeQuantity = parseFloat(e.target.value) || 0
                              const updatedCart = cart.map(cartItem => 
                                cartItem.id === item.id 
                                  ? { ...cartItem, tradeDiscountFreeItems: freeQuantity }
                                  : cartItem
                              )
                              // Update the context cart
                              clearCart()
                              updatedCart.forEach(item => {
                                contextAddToCart(item)
                              })
                            }}
                              onFocus={(e) => {
                                if (e.target.value === "0") {
                                  e.target.value = ""
                                }
                              }}
                            onBlur={(e) => {
                              if (e.target.value === "") {
                                e.target.value = "0"
                              }
                            }}
                            className="h-6 w-16 text-center text-sm border-gray-300 focus:border-green-500 dark:border-gray-600 dark:focus:border-green-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                            onClick={() => {
                              const currentFree = item.tradeDiscountFreeItems || 0
                              const newFree = currentFree + 1
                              const updatedCart = cart.map(cartItem => 
                                cartItem.id === item.id 
                                  ? { ...cartItem, tradeDiscountFreeItems: newFree }
                                  : cartItem
                              )
                              // Update the context cart
                              clearCart()
                              updatedCart.forEach(item => {
                                contextAddToCart(item)
                              })
                            }}
                            className="border-green-300 hover:bg-green-500 hover:text-white hover:border-green-500 dark:border-green-600 dark:hover:bg-green-600 h-5 w-5 p-0"
                          >
                            <Plus className="h-2 w-2" />
                            </Button>
                          <span className="text-xs text-muted-foreground">free</span>
                          </div>
                      </div>

              <div className="space-y-2">
                        {/* Inline Price Editing */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Unit Price (Rs)</Label>
                          <div className="flex items-center gap-2">
                  <Input
                    type="number"
                              step="0.01"
                              min="0"
                              max="999999"
                              value={item.unitPrice || ""}
                              disabled={false}
                    onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                const updatedCart = cart.map(cartItem => 
                                  cartItem.id === item.id 
                                    ? { 
                                        ...cartItem, 
                                        unitPrice: newPrice,
                                        finalPrice: newPrice * cartItem.quantity,
                                        totalAmount: newPrice * cartItem.quantity,
                                        individualPrices: Number.isInteger(cartItem.quantity) ? Array(cartItem.quantity).fill(newPrice) : []
                                      }
                                    : cartItem
                                );
                                // Update the context cart
                                clearCart()
                                updatedCart.forEach(item => {
                                  contextAddToCart(item)
                                });
                                
                                // Recalculate discount if needed
                                if (cartDiscountPercentage > 0) {
                                  const newSubtotal = updatedCart.reduce((sum, cartItem) => sum + (cartItem.totalAmount || cartItem.unitPrice * cartItem.quantity), 0);
                                  const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100);
                                  setCartDiscount(newDiscount);
                                }
                              }}
                              onFocus={(e) => {
                                if (e.target.value === "0") {
                                  e.target.value = ""
                                }
                              }}
                              onBlur={(e) => {
                                if (e.target.value === "") {
                                  e.target.value = "0"
                                }
                              }}
                              className="h-6 w-20 text-center text-sm border-gray-300 focus:border-orange-500 dark:border-gray-600 dark:focus:border-orange-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPricingModal(item)}
                              className="h-6 px-2 text-xs"
                              title="Advanced Pricing"
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Adjust
                            </Button>
                </div>
              </div>

                        {/* Total Price Display */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Total:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Rs{(item.totalAmount || (item.quantity * item.unitPrice)).toFixed(2)}
                          </span>
                    </div>
                    </div>
                    </div>
                  )
                })}
                  </div>
                    </div>
            )}
          </CardContent>
        </Card>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <>
            {/* Cart-level discount inputs */}
            <Card className="border-2 border-gray-300 dark:border-gray-600 shadow-xl bg-white dark:bg-gray-900">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <Label className="text-xs">Cart Discount:</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min={0}
                        max={subtotal}
                        placeholder="Amount"
                        value={cartDiscount || ""}
                        onChange={(e) => {
                          let val = Number(e.target.value.replace(/^0+/, ''))
                          if (isNaN(val) || val < 0) val = 0
                          if (val > subtotal) val = subtotal
                          setCartDiscount(val)
                          setCartDiscountPercentage(0)
                        }}
                        className="h-7 text-xs"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="%"
                        value={cartDiscountPercentage || ""}
                        onChange={(e) => {
                          let val = Number(e.target.value.replace(/^0+/, ''))
                          if (isNaN(val) || val < 0) val = 0
                          if (val > 100) val = 100
                          setCartDiscountPercentage(val)
                          const newDiscount = (subtotal * val) / 100
                          setCartDiscount(newDiscount)
                        }}
                        className="h-7 text-xs"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Amount (Rs)</span>
                    <span>Percentage (%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-300 dark:border-gray-600 shadow-xl bg-white dark:bg-gray-900">
              <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-300 dark:border-gray-600">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                    <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium">Rs{subtotal.toFixed(2)}</span>
                    </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                      <span className="font-medium text-green-600">-Rs{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>Rs{total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Post Sale Modal */}
      <PostSaleModal
        isOpen={showPostSaleModal}
        onClose={() => setShowPostSaleModal(false)}
        onWhatsApp={async () => {
          // WhatsApp functionality would go here
          console.log('WhatsApp share')
        }}
        onPrint={async () => {
          // Print functionality would go here
          console.log('Print')
        }}
        onThermalPrint={async () => {
          // Thermal print functionality would go here
          console.log('Thermal print')
        }}
        saleData={null}
      />

      {/* Advanced Pricing Dialog */}
      <AdvancedPricingDialog
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        product={pricingItem ? {
          id: pricingItem.id,
          name: pricingItem.name,
          code: pricingItem.code,
          currentPrice: pricingItem.unitPrice,
          stock: 0,
          fabricType: pricingItem.fabricType || '',
          fabricColor: '',
          fabricPattern: '',
          fabricWeight: '',
          fabricWidth: '',
          fabricLength: '',
          size: pricingItem.size || '',
          purchaseCost: 0,
          minSalePrice: 0,
          maxSalePrice: 0,
          minStock: 0,
          maxStock: 0,
          supplier: '',
          batchInfo: '',
          status: 'active' as const,
          createdDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } : null}
        currentPrice={pricingItem?.unitPrice || 0}
        quantity={pricingItem?.quantity || 0}
        onPriceUpdate={handlePriceUpdate}
      />
    </div>
  )
}