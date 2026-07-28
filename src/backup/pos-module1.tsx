// "use client"

// import { useState, useEffect, useMemo } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Loader2 } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Separator } from "@/components/ui/separator"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Search, Plus, Minus, Trash2, User, CreditCard, Smartphone, Banknote, ShoppingCart, AlertTriangle, Gift, DollarSign } from "lucide-react"
// import { vice, SalesService, EmployeeService, EmployeePerformanceService, BargainingService, CustomerCreditService, type Product, type Employee, type SaleItem, type SaleRecord, CustomerService, type Customer } from "@/lib/firebase-services"
// import { InvoiceCounterService } from "@/lib/invoice-counter-service"
// import { useToast } from "@/hooks/use-toast"
// import html2canvas from 'html2canvas'
// import { usePOS } from "@/contexts/POSContext"


// // import { PostSaleModal } from "./modules/pos/post-sale-modal"
// // import { AdvancedPricingDialog } from "./modules/pos/advanced-pricing-dialog"

// // Helper function to format date as DD/MM/YYYY
// const formatDate = (date: Date | string) => {
//   // If it's already a formatted string, return it
//   if (typeof date === 'string') {
//     return date
//   }

//   // If it's a Date object, format it
//   if (date instanceof Date && !isNaN(date.getTime())) {
//     const day = date.getDate().toString().padStart(2, '0')
//     const month = (date.getMonth() + 1).toString().padStart(2, '0')
//     const year = date.getFullYear()
//     return `${day}/${month}/${year}`
//   }

//   // Fallback to current date if invalid
//   const now = new Date()
//   const day = now.getDate().toString().padStart(2, '0')
//   const month = (now.getMonth() + 1).toString().padStart(2, '0')
//   const year = now.getFullYear()
//   return `${day}/${month}/${year}`
// }

// // Defining the types for cart items
// interface CartItem {
//   id: string
//   name: string
//   code: string
//   unitPrice: number
//   quantity: number
//   discount: number
//   finalPrice: number
//   availableStock: number
//   tradeDiscountQuantity?: number
//   tradeDiscountFreeItems?: number
//   fabricType?: string
//   size?: string
//   individualPrices?: number[] // Array of individual prices for each unit
//   totalAmount?: number // Total amount for this product
// }

// function POSModule() {
//   // Use POS Context for state management
//   const {
//     cart,
//     customerName,
//     customerPhone,
//     customerAddress,
//     paymentMethod,
//     partialPaymentAmount,
//     staffMember,
//     manualStaffName,
//     deliveryType,
//     deliveryAddress,
//     deliveryDate,
//     cartDiscount,
//     cartDiscountPercentage,
//     searchTerm,
//     addToCart: contextAddToCart,
//     setCustomerName,
//     setCustomerPhone,
//     setCustomerAddress,
//     setPaymentMethod,
//     setPartialPaymentAmount,
//     setStaffMember,
//     setManualStaffName,
//     setDeliveryType,
//     setDeliveryAddress,
//     setDeliveryDate,
//     setCartDiscount,
//     setCartDiscountPercentage,
//     setSearchTerm,
//     clearCart,
//     resetForm
//   } = usePOS()

//   // Local state for non-persistent data
//   const [products, setProducts] = useState<Product[]>([])
//   const [employees, setEmployees] = useState<Employee[]>([])
//   const [loading, setLoading] = useState(true)
//   const [isProcessingSale, setIsProcessingSale] = useState(false)
//   const { toast } = useToast()
//   const [showPostSaleModal, setShowPostSaleModal] = useState(false)

//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);

//   // Advanced pricing dialog state
//   const [showPricingModal, setShowPricingModal] = useState(false);
//   const [pricingItem, setPricingItem] = useState<CartItem | null>(null);

//   // Tax and Loyalty states
//   const [transactionType, setTransactionType] = useState<"retail" | "wholesale">("retail");
//   const [loyaltyDiscountPercent, setLoyaltyDiscountPercent] = useState<number>(0);
//   const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
//   const [loyaltyTier, setLoyaltyTier] = useState<string>("Regular");


//   // Load products and employees from Firebase
//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const [productsData, employeesData] = await Promise.all([
//           ProductService.getAllProducts(),
//           EmployeeService.getAllEmployees(),
//         ])
//         // Remove duplicate products by ID to prevent React key conflicts
//         const uniqueProducts = productsData.filter((product, index, self) =>
//           index === self.findIndex(p => p.id === product.id)
//         )

//         setProducts(uniqueProducts)
//         setEmployees(employeesData)
//         setLoading(false)
//       } catch (error) {
//         console.error("Error loading data:", error)
//         toast({
//           title: "Error",
//           description: "Failed to load data. Please refresh the page.",
//           variant: "destructive",
//         })
//         setLoading(false)
//       }
//     }

//     loadData()
//   }, [toast])

//   // State persistence is now handled by POSContext

//   // For now, we'll keep the complex cart logic in the module
//   // and use context only for basic state persistence


//   useEffect(() => {
//     const loadCustomers = async () => {
//       try {
//         const data = await CustomerService.getAllCustomers();
//         setCustomers(data);
//       } catch (error) {
//         console.error("Error loading customers:", error)
//       }
//     };
//     loadCustomers();
//   }, []);

//   // Memoized filtered products for better performance
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm.trim()) return products;

//     const searchLower = searchTerm.toLowerCase();
//     return products.filter(
//       (product) =>
//         (product.name || '').toLowerCase().includes(searchLower) ||
//         (product.code || '').toLowerCase().includes(searchLower),
//     );
//   }, [products, searchTerm]);

//   // Add trade discount to existing cart item
//   const addTradeDiscountUnit = (productId: string) => {
//     const existingItem = cart.find(item => item.id === productId)
//     if (!existingItem) {
//       toast({
//         title: "Error",
//         description: "Please add the product to cart first before applying trade discount",
//         variant: "destructive",
//       })
//       return
//     }

//     const updatedCart = cart.map(item =>
//       item.id === productId
//         ? {
//           ...item,
//           tradeDiscountFreeItems: (item.tradeDiscountFreeItems || 0) + 1
//         }
//         : item
//     )

//     // Update the context cart
//     clearCart()
//     updatedCart.forEach(item => {
//       contextAddToCart(item)
//     })
//     toast({
//       title: "Trade Discount Added",
//       description: `1 free unit added for ${existingItem.name}`
//     })
//   }

//   // Remove trade discount from cart item
//   const removeTradeDiscountUnit = (productId: string) => {
//     const existingItem = cart.find(item => item.id === productId)
//     if (!existingItem || !existingItem.tradeDiscountFreeItems || existingItem.tradeDiscountFreeItems <= 0) {
//       return
//     }

//     const updatedCart = cart.map(item =>
//       item.id === productId
//         ? {
//           ...item,
//           tradeDiscountFreeItems: Math.max(0, (item.tradeDiscountFreeItems || 0) - 1)
//         }
//         : item
//     )

//     // Update the context cart
//     clearCart()
//     updatedCart.forEach(item => {
//       contextAddToCart(item)
//     })
//     toast({
//       title: "Trade Discount Removed",
//       description: `1 free unit removed from ${existingItem.name}`
//     })
//   }

//   const addToCart = (product: Product) => {
//     const existingItem = cart.find((item) => item.id === product.id)

//     let updatedCart: CartItem[]

//     if (existingItem) {
//       // Check if adding one more would exceed stock
//       if (existingItem.quantity + 1 > product.stock) {
//         toast({
//           title: "Insufficient Stock",
//           description: `Only ${product.stock} yard(s) available for ${product.name}`,
//           variant: "destructive",
//         })
//         return
//       }

//       updatedCart = cart.map((item) =>
//         item.id === product.id
//           ? {
//             ...item,
//             quantity: item.quantity + 1,
//             finalPrice: (item.quantity + 1) * item.unitPrice,
//             individualPrices: Number.isInteger(item.quantity + 1) ? [...(item.individualPrices || []), product.currentPrice] : [],
//             totalAmount: (item.totalAmount || 0) + product.currentPrice
//           }
//           : item,
//       )
//     } else {
//       // Check if product has stock
//       if (product.stock <= 0) {
//         toast({
//           title: "Out of Stock",
//           description: `${product.name} is out of stock`,
//           variant: "destructive",
//         })
//         return
//       }

//       updatedCart = [
//         ...cart,
//         {
//           id: product.id,
//           name: product.name,
//           code: product.code,
//           unitPrice: product.currentPrice,
//           quantity: 1,
//           discount: 0, // No longer used, but kept for type compatibility
//           finalPrice: product.currentPrice,
//           availableStock: product.stock,
//           fabricType: product.fabricType,
//           size: product.size,
//           individualPrices: [product.currentPrice],
//           totalAmount: product.currentPrice,
//         },
//       ]
//     }

//     // Update the context cart
//     clearCart()
//     updatedCart.forEach(item => {
//       contextAddToCart(item)
//     })

//     // Recalculate discount based on new cart total
//     if (cartDiscountPercentage > 0) {
//       const newSubtotal = updatedCart.reduce((sum, item) => {
//         if (item.individualPrices && item.individualPrices.length > 0) {
//           return sum + item.individualPrices.reduce((priceSum, price) => priceSum + price, 0)
//         }
//         return sum + (item.totalAmount || item.unitPrice * item.quantity)
//       }, 0)
//       const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
//       setCartDiscount(newDiscount)
//     }
//   }

//   const updateQuantity = (id: string, newQuantity: number) => {
//     if (newQuantity <= 0) {
//       removeFromCart(id)
//       return
//     }

//     // Ensure quantity is a valid number
//     if (isNaN(newQuantity) || !isFinite(newQuantity) || newQuantity < 0) {
//       return
//     }

//     const product = products.find((p) => p.id === id)
//     if (!product) return

//     // Check if new quantity exceeds available stock
//     if (newQuantity > product.stock) {
//       toast({
//         title: "Insufficient Stock",
//         description: `Only ${product.stock} yard(s) available for ${product.name}`,
//         variant: "destructive",
//       })
//       return
//     }

//     const updatedCart = cart.map((item) => {
//       if (item.id === id) {
//         // For float quantities, we can't use individual prices array
//         // Instead, calculate total amount directly from unit price
//         const newTotalAmount = newQuantity * item.unitPrice

//         return {
//           ...item,
//           quantity: newQuantity,
//           finalPrice: newQuantity * item.unitPrice,
//           totalAmount: newTotalAmount,
//           individualPrices: [] // Clear individual prices for float quantities
//         }
//       }
//       return item
//     })

//     // Update the context cart
//     clearCart()
//     updatedCart.forEach(item => {
//       contextAddToCart(item)
//     })

//     // Recalculate discount based on new cart total
//     if (cartDiscountPercentage > 0) {
//       const newSubtotal = updatedCart.reduce((sum, item) => {
//         if (item.individualPrices && item.individualPrices.length > 0) {
//           return sum + item.individualPrices.reduce((priceSum, price) => priceSum + price, 0)
//         }
//         return sum + (item.totalAmount || item.unitPrice * item.quantity)
//       }, 0)
//       const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
//       setCartDiscount(newDiscount)
//     }
//   }

//   // Function to handle float quantity input
//   const handleQuantityInput = (id: string, value: string) => {
//     // If empty string, set quantity to 0 but don't remove from cart
//     if (value === "") {
//       const updatedCart = cart.map((item) => {
//         if (item.id === id) {
//           return {
//             ...item,
//             quantity: 0,
//             finalPrice: 0,
//             totalAmount: 0,
//             individualPrices: []
//           }
//         }
//         return item
//       })
//       // Update the context cart
//       clearCart()
//       updatedCart.forEach(item => {
//         contextAddToCart(item)
//       })
//       return
//     }

//     const newQuantity = parseFloat(value)

//     if (isNaN(newQuantity) || newQuantity < 0 || !isFinite(newQuantity)) {
//       // Set to 0 instead of removing from cart
//       const updatedCart = cart.map((item) => {
//         if (item.id === id) {
//           return {
//             ...item,
//             quantity: 0,
//             finalPrice: 0,
//             totalAmount: 0,
//             individualPrices: []
//           }
//         }
//         return item
//       })
//       // Update the context cart
//       clearCart()
//       updatedCart.forEach(item => {
//         contextAddToCart(item)
//       })
//       return
//     }

//     const product = products.find((p) => p.id === id)
//     if (!product) return

//     // Check if new quantity exceeds available stock
//     if (newQuantity > product.stock) {
//       toast({
//         title: "Insufficient Stock",
//         description: `Only ${product.stock} yard(s) available for ${product.name}`,
//         variant: "destructive",
//       })
//       return
//     }

//     const updatedCart = cart.map((item) => {
//       if (item.id === id) {
//         // For float quantities, we can't use individual prices array
//         // Instead, calculate total amount directly from unit price
//         const newTotalAmount = newQuantity * item.unitPrice

//         return {
//           ...item,
//           quantity: newQuantity,
//           finalPrice: newQuantity * item.unitPrice,
//           totalAmount: newTotalAmount,
//           individualPrices: [] // Clear individual prices for float quantities
//         }
//       }
//       return item
//     })

//     // Update the context cart
//     clearCart()
//     updatedCart.forEach(item => {
//       contextAddToCart(item)
//     })

//     // Recalculate discount based on new cart total
//     if (cartDiscountPercentage > 0) {
//       const newSubtotal = updatedCart.reduce((sum, item) => {
//         if (item.individualPrices && item.individualPrices.length > 0) {
//           return sum + item.individualPrices.reduce((priceSum, price) => priceSum + price, 0)
//         }
//         return sum + (item.totalAmount || item.unitPrice * item.quantity)
//       }, 0)
//       const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
//       setCartDiscount(newDiscount)
//     }
//   }

//   // Remove per-item discount logic
//   // const updateDiscount = (id: string, discount: number) => {
//   //   setCart(
//   //     cart.map((item) =>
//   //       item.id === id ? { ...item, discount, finalPrice: item.quantity * (item.unitPrice - discount) } : item,
//   //     ),
//   //   )
//   // }

//   const removeFromCart = (id: string) => {
//     const newCart = cart.filter((item) => item.id !== id)

//     // Update the context cart
//     clearCart()
//     newCart.forEach(item => {
//       contextAddToCart(item)
//     })

//     // Recalculate discount when cart changes
//     if (newCart.length === 0) {
//       setCartDiscount(0)
//       setCartDiscountPercentage(0)
//     } else if (cartDiscountPercentage > 0) {
//       // Recalculate discount based on new subtotal
//       const newSubtotal = newCart.reduce((sum, item) => {
//         if (item.individualPrices && item.individualPrices.length > 0) {
//           return sum + item.individualPrices.reduce((priceSum, price) => priceSum + price, 0)
//         }
//         return sum + (item.totalAmount || item.unitPrice * item.quantity)
//       }, 0)
//       const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100)
//       setCartDiscount(newDiscount)
//     }
//   }

//   const subtotal = cart.reduce((sum, item) => {
//     // If individual prices exist, use them; otherwise use unitPrice * quantity
//     if (item.individualPrices && item.individualPrices.length > 0) {
//       return sum + item.individualPrices.reduce((priceSum, price) => priceSum + price, 0)
//     }
//     return sum + (item.totalAmount || item.unitPrice * item.quantity)
//   }, 0)
//   // Cart-level discount - use amount-based discount as primary
//   const totalDiscount = cartDiscount
//   const total = Math.max(0, subtotal - totalDiscount)

//   // Function to update discount by amount
//   const updateDiscountByAmount = (amount: number) => {
//     setCartDiscount(amount)
//     if (subtotal > 0) {
//       const percentage = Math.round((amount / subtotal) * 100)
//       setCartDiscountPercentage(percentage)
//     } else {
//       setCartDiscountPercentage(0)
//     }
//   }

//   // Function to update discount by percentage
//   const updateDiscountByPercentage = (percentage: number) => {
//     setCartDiscountPercentage(percentage)
//     const amount = Math.round((percentage / 100) * subtotal)
//     setCartDiscount(amount)
//   }

//   // Check if any cart item exceeds stock
//   const hasStockIssues = cart.some((item) => {
//     const product = products.find((p) => p.id === item.id)
//     return product ? item.quantity > product.stock : false
//   })

//   // Save the last sale data for printing/whatsapp after sale
//   const [lastSaleData, setLastSaleData] = useState<InvoiceData | null>(null);

//   const handleCheckout = async () => {
//     if (cart.length === 0) {
//       toast({
//         title: "Empty Cart",
//         description: "Please add items to cart before checkout",
//         variant: "destructive",
//       })
//       return
//     }

//     if (!paymentMethod) {
//       toast({
//         title: "Missing Information",
//         description: "Please select payment method",
//         variant: "destructive",
//       })
//       return
//     }

//     // Validate customer information for credit sales
//     if (paymentMethod === "credit") {
//       if (!customerName.trim()) {
//         toast({
//           title: "Customer Information Required",
//           description: "Customer name is required for credit sales",
//           variant: "destructive",
//         })
//         return
//       }
//       if (!customerPhone.trim()) {
//         toast({
//           title: "Customer Information Required",
//           description: "Customer phone number is required for credit sales",
//           variant: "destructive",
//         })
//         return
//       }

//       // Validate partial payment amount
//       const partialAmount = parseFloat(partialPaymentAmount) || 0
//       const totalAmount = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
//       const totalDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0) + cartDiscount
//       const finalTotal = totalAmount - totalDiscount

//       if (partialAmount > finalTotal) {
//         toast({
//           title: "Invalid Partial Payment",
//           description: "Partial payment cannot exceed the total amount",
//           variant: "destructive",
//         })
//         return
//       }
//     }

//     setIsProcessingSale(true)

//     // Final stock validation before checkout
//     const stockValidation = cart.map((item) => {
//       const product = products.find((p) => p.id === item.id)
//       return {
//         item,
//         product,
//         hasStock: product ? item.quantity <= product.stock : false,
//         availableStock: product?.stock || 0,
//       }
//     })

//     const itemsWithoutStock = stockValidation.filter((validation) => !validation.hasStock)

//     if (itemsWithoutStock.length > 0) {
//       const errorMessage = itemsWithoutStock
//         .map((validation) => `${validation.item.name}: Need ${validation.item.quantity} yard(s), Available ${validation.availableStock} yard(s)`)
//         .join(", ")

//       toast({
//         title: "Insufficient Stock",
//         description: `Cannot complete sale. ${errorMessage}`,
//         variant: "destructive",
//       })
//       return
//     }

//     try {
//       // Sync customer with customers collection
//       if (customerName || customerPhone) {
//         const allCustomers = await CustomerService.getAllCustomers();
//         const existing = allCustomers.find(c =>
//           (customerPhone && c.phone === customerPhone) ||
//           (customerName && (c.name || '').toLowerCase() === customerName.toLowerCase())
//         );
//         if (!existing) {
//           await CustomerService.createCustomer({
//             name: customerName || "Walk-in Customer",
//             email: "",
//             phone: customerPhone || "",
//             address: customerAddress || "",
//             customerType: "walk-in",
//             totalPurchases: 0,
//             totalSpent: 0,
//             creditLimit: 0,
//             currentCredit: 0,
//             notes: "",
//             status: "active"
//           });
//         } else {
//           // Update if info changed
//           if (existing.name !== customerName || existing.phone !== customerPhone || existing.address !== customerAddress) {
//             await CustomerService.updateCustomer(existing.id, {
//               name: customerName,
//               phone: customerPhone,
//               address: customerAddress,
//             });
//           }
//         }
//       }

//       // Distribute cart-level discount proportionally to items for record-keeping
//       const distributedDiscounts: { [id: string]: number } = {}
//       const runningDiscount = totalDiscount
//       if (cart.length > 0 && totalDiscount > 0 && subtotal > 0) {
//         // Proportional distribution
//         let sumDistributed = 0
//         cart.forEach((item, idx) => {
//           if (idx === cart.length - 1) {
//             // Last item gets the remainder
//             distributedDiscounts[item.id] = runningDiscount - sumDistributed
//           } else {
//             const itemShare = Math.round((item.unitPrice * item.quantity / subtotal) * totalDiscount)
//             distributedDiscounts[item.id] = itemShare
//             sumDistributed += itemShare
//           }
//         })
//       } else {
//         cart.forEach(item => { distributedDiscounts[item.id] = 0 })
//       }

//       const saleItems: SaleItem[] = cart.map((item) => {
//         const product = products.find(p => p.id === item.id)
//         return {
//           id: item.id,
//           name: item.name,
//           code: item.code,
//           quantity: item.quantity,
//           originalPrice: item.unitPrice,
//           finalPrice: item.unitPrice - (distributedDiscounts[item.id] ?? 0) / (item.quantity || 1),
//           discount: distributedDiscounts[item.id] ?? 0,
//           purchaseCost: product?.purchaseCost || 0,
//         }
//       })

//       // --- FIX: Ensure deliveryAddress and deliveryDate are never undefined in saleData ---
//       // If deliveryType is 'delivery', deliveryAddress must be a non-empty string (required).
//       // If deliveryType is 'pickup', deliveryAddress and deliveryDate should be omitted from the object (not undefined).
//       // If deliveryType is 'delivery' but deliveryAddress is empty, set to empty string (not undefined).

//       let deliveryAddressValue: string | undefined = undefined
//       let deliveryDateValue: string | undefined = undefined

//       if (deliveryType === 'delivery') {
//         deliveryAddressValue = deliveryAddress || ""
//         deliveryDateValue = deliveryDate || ""
//       }

//       // Only include deliveryAddress and deliveryDate if deliveryType is 'delivery'
//       const tradeDiscountItems = cart
//         .filter(ci => ci.tradeDiscountFreeItems && ci.tradeDiscountFreeItems > 0)
//         .map(ci => ({
//           productId: ci.id,
//           productName: ci.name,
//           quantity: ci.tradeDiscountFreeItems || 0,
//           price: 0,
//           purchaseCost: products.find(p => p.id === ci.id)?.purchaseCost || 0,
//         }))

//       // Generate sequential invoice number
//       const invoiceNumber = await InvoiceCounterService.getNextInvoiceNumber()

//       const now = new Date()
//       const saleData: Omit<SaleRecord, "id"> = {
//         invoiceNumber: invoiceNumber,
//         date: now.toISOString().split('T')[0], // Store as YYYY-MM-DD for consistent parsing
//         time: new Date().toLocaleTimeString(),
//         customerName: customerName || "Walk-in Customer",
//         customerPhone: customerPhone || "",
//         customerAddress: customerAddress || "",
//         customerType: (customerName ? "regular" : "walk-in") as "walk-in" | "regular" | "vip",
//         items: saleItems,
//         subtotal,
//         discount: totalDiscount,
//         tax: 0,
//         total,
//         paymentMethod: paymentMethod as "cash" | "card" | "mobile" | "credit",
//         paymentStatus: (paymentMethod === "credit" ? "pending" : "paid") as "paid" | "partial" | "pending",
//         deliveryStatus: deliveryType === 'delivery' ? 'pending' : 'pickup',
//         deliveryType: deliveryType,
//         staffMember: staffMember, // Use staffMember from dropdown
//         staffName: staffNameForInvoice, // Add staff name for display
//         notes: "",
//         returnStatus: "none" as "none" | "partial" | "full",
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//       }

//       if (deliveryType === 'delivery') {
//         saleData.deliveryAddress = deliveryAddressValue
//         // Only include deliveryDate if it's a non-empty string
//         if (deliveryDateValue && deliveryDateValue.trim() !== "") {
//           saleData.deliveryDate = deliveryDateValue
//         }
//       }
//       // --- END FIX ---

//       // Attach trade discount items to sale
//       if (tradeDiscountItems.length > 0) {
//         (saleData as SaleRecord & { tradeDiscountItems: Array<{ productId: string; productName: string; quantity: number; price: number; purchaseCost?: number }> }).tradeDiscountItems = tradeDiscountItems
//       }

//       const createdSale = await SalesService.createSale(saleData)

//       // Handle credit sale and partial payments
//       if (paymentMethod === "credit") {
//         try {
//           const partialAmount = parseFloat(partialPaymentAmount) || 0
//           const saleId = typeof createdSale === 'string' ? createdSale : (createdSale as { id: string }).id

//           // If there's a partial payment, record it as a customer credit
//           if (partialAmount > 0) {
//             // Find the customer ID by looking up the customer
//             let customerId = ""
//             if (customerName || customerPhone) {
//               const allCustomers = await CustomerService.getAllCustomers()
//               const existingCustomer = allCustomers.find(c =>
//                 (customerPhone && c.phone === customerPhone) ||
//                 (customerName && (c.name || '').toLowerCase() === customerName.toLowerCase())
//               )
//               customerId = existingCustomer?.id || ""
//             }

//             const paymentData = {
//               customerId: customerId,
//               customerName: customerName || "Walk-in Customer",
//               amount: partialAmount,
//               type: "credit" as const,
//               reason: `Partial payment for sale ${invoiceNumber}`,
//               description: `Initial partial payment of Rs${partialAmount.toLocaleString()}`,
//               saleId: saleId,
//               invoiceNumber: invoiceNumber,
//               createdBy: staffMember || "pos_system",
//               status: "active" as const,
//               createdAt: new Date().toISOString(),
//             }

//             await CustomerCreditService.createCredit(paymentData)
//           }
//         } catch (error) {
//           console.error("Error creating customer credit for partial payment:", error)
//           // Don't fail the sale if credit creation fails
//         }
//       }

//       // Create payment entry for cash, card, or mobile payments
//       if (paymentMethod === "cash" || paymentMethod === "card" || paymentMethod === "mobile") {
//         try {
//           const saleId = typeof createdSale === 'string' ? createdSale : (createdSale as { id: string }).id

//           // Find the customer ID by looking up the customer
//           let customerId = ""
//           if (customerName || customerPhone) {
//             const allCustomers = await CustomerService.getAllCustomers()
//             const existingCustomer = allCustomers.find(c =>
//               (customerPhone && c.phone === customerPhone) ||
//               (customerName && (c.name || '').toLowerCase() === customerName.toLowerCase())
//             )
//             customerId = existingCustomer?.id || ""
//           }

//           const paymentData = {
//             customerId: customerId,
//             customerName: customerName || "Walk-in Customer",
//             amount: total,
//             type: "credit" as const,
//             reason: `Payment via ${paymentMethod.toUpperCase()} for sale ${invoiceNumber}`,
//             description: `Full payment of Rs${total.toLocaleString()} via ${paymentMethod.toUpperCase()}`,
//             saleId: saleId,
//             invoiceNumber: invoiceNumber,
//             createdBy: staffMember || "pos_system",
//             status: "active" as const,
//             createdAt: new Date().toISOString(),
//           }

//           await CustomerCreditService.createCredit(paymentData)
//         } catch (error) {
//           console.error("Error creating payment entry for sale:", error)
//           // Don't fail the sale if payment creation fails
//         }
//       }

//       // Update product stock and current price (including trade discount items)
//       for (const item of cart) {
//         const product = products.find((p) => p.id === item.id)
//         if (product) {
//           const totalQuantity = item.quantity + (item.tradeDiscountFreeItems || 0)

//           // Update only stock, not currentPrice (price changes are customer-specific)
//           const updateData: { stock: number } = {
//             stock: product.stock - totalQuantity,
//           }

//           await ProductService.updateProduct(item.id, updateData)
//         }
//       }

//       // Create bargain records for discounted items (if cart-level discount, only if >0)
//       if (totalDiscount > 0) {
//         for (const item of cart) {
//           const itemDiscount = distributedDiscounts[item.id] ?? 0
//           if (itemDiscount > 0) {
//             await BargainingService.createBargainRecord({
//               date: formatDate(new Date()),
//               time: new Date().toLocaleTimeString(),
//               productName: item.name,
//               productCode: item.code,
//               originalPrice: item.unitPrice,
//               finalPrice: item.unitPrice - (itemDiscount / (item.quantity || 1)),
//               discountAmount: itemDiscount,
//               discountPercentage: item.unitPrice > 0 ? Math.round((itemDiscount / (item.unitPrice * item.quantity)) * 100) : 0,
//               customerName: customerName || "Walk-in Customer",
//               customerPhone: customerPhone || "",
//               staffMember: staffMember, // Use staffMember from dropdown
//               reason: "POS Sale Discount",
//               invoiceNumber: saleData.invoiceNumber,
//               category: products.find((p) => p.id === item.id)?.fabricType || "",
//               profitMargin: item.unitPrice > 0 ? Math.round(((item.unitPrice - (itemDiscount / (item.quantity || 1)) - (products.find((p) => p.id === item.id)?.purchaseCost || 0)) / item.unitPrice) * 100) : 0,
//               status: "approved",
//             })
//           }
//         }
//       }

//       // Update local products state to reflect new stock levels and prices
//       setProducts(products.map(product => {
//         const cartItem = cart.find(item => item.id === product.id)
//         if (cartItem) {
//           const totalQuantity = cartItem.quantity + (cartItem.tradeDiscountFreeItems || 0)

//           return {
//             ...product,
//             stock: product.stock - totalQuantity
//           }
//         }
//         return product
//       }))

//       // Update employee's performance data using separate performance tracking
//       // CRITICAL: This ONLY updates the employeePerformance table, NEVER the employee table
//       if (staffMember) {
//         const selectedEmployee = employees.find((emp) => emp.id === staffMember);
//         if (selectedEmployee) {
//           try {
//             console.log(`Updating performance for employee ${staffMember} (${selectedEmployee.name}) with sale amount ${total}`);

//             // Use the new simplified method that ensures data goes to employeePerformance table ONLY
//             await EmployeePerformanceService.incrementSalesMetrics(
//               staffMember,
//               selectedEmployee.name,
//               total
//             );

//             console.log(`Successfully updated performance for employee ${staffMember}`);

//           } catch (error) {
//             console.error('Error updating employee performance:', error);
//             toast({
//               title: "Performance Update Warning",
//               description: "Failed to update employee performance data. Sale completed but performance tracking may be affected.",
//               variant: "destructive",
//             });
//           }
//         } else {
//           console.warn(`Staff member ${staffMember} not found in employees list`);
//         }
//       }

//       toast({
//         title: "Sale Completed",
//         description: `Sale completed successfully! Total: Rs${total.toLocaleString()}`,
//       })

//       // Save last sale data for invoice/whatsapp
//       setLastSaleData({
//         invoiceNumber: saleData.invoiceNumber,
//         date: saleData.date,
//         time: saleData.time,
//         customerName: saleData.customerName,
//         customerPhone: saleData.customerPhone,
//         customerAddress: saleData.customerAddress,
//         staffName: staffNameForInvoice, // Use staffNameForInvoice
//         items: cart.map(item => ({
//           name: item.name,
//           code: item.code,
//           quantity: item.quantity,
//           unitPrice: item.unitPrice,
//           tradeDiscountFreeItems: item.tradeDiscountFreeItems || 0,
//           fabricType: item.fabricType || 'N/A',
//           size: item.size || 'N/A',
//         })),
//         subtotal,
//         totalDiscount,
//         total,
//       });

//       // Show modal for post-sale actions
//       setShowPostSaleModal(true);

//       // Reset form using context
//       resetForm()

//     } catch {
//       toast({
//         title: "Error",
//         description: "Failed to complete sale. Please try again.",
//         variant: "destructive",
//       })
//     } finally {
//       setIsProcessingSale(false)
//     }
//   }

//   // Print invoice handler
//   interface InvoiceData {
//     invoiceNumber: string;
//     date: string;
//     time: string;
//     customerName: string;
//     customerPhone: string;
//     customerAddress?: string;
//     staffName: string;
//     paymentMethod?: string;
//     staffMember?: string;
//     items: Array<{ name: string, code: string, quantity: number, unitPrice: number, tradeDiscountFreeItems?: number, fabricType?: string, size?: string }>;
//     subtotal: number;
//     totalDiscount: number;
//     total: number;
//   }

//   // Thermal print handler
//   const handleThermalPrint = async () => {
//     if (!lastSaleData) {
//       toast({
//         title: "Error",
//         description: "No sale data available for thermal printing",
//         variant: "destructive",
//       })
//       return
//     }

//     const printWindow = window.open('', '_blank', 'width=300,height=600')
//     if (!printWindow) return

//     // Use the thermal invoice HTML generation function
//     const thermalHtml = generateThermalInvoiceHTML(lastSaleData)
//     printWindow.document.write(thermalHtml)
//     printWindow.document.close()

//     // Wait for content to load before printing
//     printWindow.onload = () => {
//       setTimeout(() => {
//         printWindow.print()
//         printWindow.close()
//       }, 500)
//     }
//   }

//   const handlePrint = async (saleDataOverride?: InvoiceData) => {
//     // Use lastSaleData if provided, else use current cart
//     const now = new Date()
//     const data = saleDataOverride || lastSaleData || {
//       invoiceNumber: await InvoiceCounterService.getNextInvoiceNumber(),
//       date: now.toISOString().split('T')[0], // Store as YYYY-MM-DD for consistent parsing
//       time: new Date().toLocaleTimeString(),
//       customerName: customerName || 'Walk-in Customer',
//       customerPhone: customerPhone || '-',
//       customerAddress: customerAddress || '',
//       staffName: staffNameForInvoice, // Use staffNameForInvoice
//       items: cart.map(item => ({
//         name: item.name,
//         code: item.code,
//         quantity: item.quantity,
//         unitPrice: item.unitPrice,
//         tradeDiscountFreeItems: item.tradeDiscountFreeItems || 0,
//         fabricType: item.fabricType || 'N/A',
//         size: item.size || 'N/A',
//       })),
//       subtotal,
//       totalDiscount,
//       total,
//     } as InvoiceData;

//     const printWindow = window.open('', '_blank', 'width=800,height=600')
//     if (!printWindow) return

//     // Use the shared invoice HTML generation function
//     const invoiceHtml = generateInvoiceHTML(data)
//     printWindow.document.write(invoiceHtml)
//     printWindow.document.close()

//     // Wait for images to load before printing
//     printWindow.onload = () => {
//       setTimeout(() => {
//         // Check if content exceeds one page and adjust accordingly
//         const bodyHeight = printWindow.document.body.scrollHeight
//         const viewportHeight = printWindow.innerHeight
//         const isOverflowing = bodyHeight > viewportHeight * 0.9 // 90% of viewport height

//         if (isOverflowing) {
//           // Add CSS to make content fit on one page
//           const style = printWindow.document.createElement('style')
//           style.textContent = `
//             @media print {
//               body { 
//                 transform: scale(0.85);
//                 transform-origin: top left;
//                 width: 117.6%; /* Compensate for scale */
//               }
//               .header { margin-bottom: 20px !important; }
//               .company-name { font-size: 24px !important; }
//               .company-details { font-size: 13px !important; }
//               .invoice-details { font-size: 13px !important; }
//               .invoice-details p { font-size: 13px !important; }
//               table { font-size: 10px !important; margin: 15px 0 !important; }
//               th, td { padding: 6px 4px !important; font-size: 10px !important; }
//               tbody td { font-size: 11px !important; }
//               .totals td { font-size: 14px !important; }
//               .totals .total-row { font-size: 16px !important; }
//               .thank-you { margin-top: 12px !important; padding: 6px !important; }
//               .thank-you h3 { font-size: 16px !important; }
//               .thank-you p { font-size: 10px !important; }
//             }
//           `
//           printWindow.document.head.appendChild(style)
//         }

//         printWindow.focus()
//         // Try to disable headers/footers programmatically
//         try {
//           printWindow.print()
//         } catch {
//           // Fallback to regular print
//           printWindow.print()
//         }
//       }, 1000) // Increased timeout to ensure logo loads
//     }
//   }

//   // WhatsApp invoice handler - Auto capture and share invoice as image
//   const handleWhatsAppInvoice = async (saleDataOverride?: InvoiceData) => {
//     const now = new Date()
//     const data = saleDataOverride || lastSaleData || {
//       invoiceNumber: await InvoiceCounterService.getNextInvoiceNumber(),
//       date: now.toISOString().split('T')[0], // Store as YYYY-MM-DD for consistent parsing
//       time: new Date().toLocaleTimeString(),
//       customerName: customerName || 'Walk-in Customer',
//       customerPhone: customerPhone || '',
//       customerAddress: customerAddress || '',
//       staffName: staffNameForInvoice, // Use staffNameForInvoice
//       items: cart.map(item => ({
//         name: item.name,
//         code: item.code,
//         quantity: item.quantity,
//         unitPrice: item.unitPrice,
//         tradeDiscountFreeItems: item.tradeDiscountFreeItems || 0,
//         fabricType: item.fabricType || 'N/A',
//         size: item.size || 'N/A',
//       })),
//       subtotal,
//       totalDiscount,
//       total,
//     } as InvoiceData;

//     if (!data.customerPhone) {
//       toast({
//         title: "Missing Phone Number",
//         description: "Please enter the customer's phone number to send the invoice via WhatsApp.",
//         variant: "destructive",
//       })
//       return
//     }

//     try {
//       // Generate the same HTML as the print invoice
//       const invoiceHTML = generateInvoiceHTML(data)

//       // Create a hidden window for capturing
//       const captureWindow = window.open('', '_blank', 'width=800,height=600')
//       if (!captureWindow) {
//         toast({
//           title: "Error",
//           description: "Unable to open capture window. Please check your popup blocker settings.",
//           variant: "destructive",
//         })
//         return
//       }

//       captureWindow.document.write(invoiceHTML)
//       captureWindow.document.close()

//       // Wait for content to load, then capture and share
//       captureWindow.onload = () => {
//         setTimeout(async () => {
//           try {
//             // Ensure footer is visible by scrolling to bottom first
//             captureWindow.scrollTo(0, captureWindow.document.body.scrollHeight)

//             // Wait a moment for scroll to complete
//             await new Promise(resolve => setTimeout(resolve, 200))

//             // Capture the invoice as an image with full height to include footer
//             const canvas = await html2canvas(captureWindow.document.body, {
//               useCORS: true,
//               allowTaint: true,
//               background: '#ffffff',
//               width: 800,
//               height: captureWindow.document.body.scrollHeight // Use full height to include footer
//             })

//             // Convert to blob for sharing
//             const blob = await new Promise<Blob>((resolve) => {
//               canvas.toBlob((blob) => {
//                 resolve(blob!)
//               }, 'image/png', 0.9)
//             })

//             // Prepare WhatsApp URL with image
//             const phone = normalizePhone(data.customerPhone as string)
//             const message = `Hi ${data.customerName}! Your invoice #${data.invoiceNumber} is ready. Please check the attached image.`

//             // Debug logging
//             console.log('Customer phone:', data.customerPhone)
//             console.log('Normalized phone:', phone)
//             console.log('WhatsApp URL will be:', `https://wa.me/${phone}?text=${encodeURIComponent(message)}`)

//             // Try Web Share API first (mobile browsers)
//             if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'invoice.png', { type: 'image/png' })] })) {
//               try {
//                 await navigator.share({
//                   title: `Invoice #${data.invoiceNumber}`,
//                   text: message,
//                   files: [new File([blob], 'invoice.png', { type: 'image/png' })]
//                 })

//                 toast({
//                   title: "Invoice Shared!",
//                   description: "Invoice image shared successfully via WhatsApp.",
//                 })

//                 captureWindow.close()
//                 return
//               } catch {
//                 console.log('Web Share API failed, falling back to WhatsApp web')
//               }
//             }

//             // Fallback: Open WhatsApp Web with image
//             const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

//             // Create a temporary link to download the image
//             const imageUrl = URL.createObjectURL(blob)
//             const link = document.createElement('a')
//             link.href = imageUrl
//             link.download = `Invoice_${data.invoiceNumber}_${data.customerName.replace(/\s+/g, '_')}.png`
//             document.body.appendChild(link)
//             link.click()
//             document.body.removeChild(link)

//             // Clean up the image URL
//             URL.revokeObjectURL(imageUrl)

//             // Open WhatsApp after a short delay to ensure download starts
//             setTimeout(() => {
//               window.open(whatsappUrl, '_blank')
//             }, 500)

//             toast({
//               title: "Invoice Captured & WhatsApp Opened",
//               description: "Invoice image downloaded! Attach it to WhatsApp and send.",
//             })

//             captureWindow.close()

//           } catch (error) {
//             console.error('Error capturing invoice:', error)
//             toast({
//               title: "Error",
//               description: "Failed to capture invoice. Please try again.",
//               variant: "destructive",
//             })
//             captureWindow.close()
//           }
//         }, 2000) // Increased timeout to ensure footer renders properly
//       }
//     } catch (error) {
//       console.error('Error opening WhatsApp invoice window:', error)
//       toast({
//         title: "Error",
//         description: "Failed to open invoice window. Please try again.",
//         variant: "destructive",
//       })
//     }
//   }


//   // Extract invoice HTML generation into a separate function
//   const generateInvoiceHTML = (data: InvoiceData) => {
//     // Get items with trade discount
//     const itemsWithTradeDiscount = data.items.filter(i => i.tradeDiscountFreeItems && i.tradeDiscountFreeItems > 0)

//     return `
//       <html>
//         <head>
//           <title>Invoice</title>
//           <style>
//             @media print {
//               @page {
//                 margin: 0.25in;
//                 size: A4;
//                 -webkit-print-color-adjust: exact;
//                 color-adjust: exact;
//               }
//               body {
//                 margin: 0 !important;
//                 padding: 0 !important;
//                 -webkit-print-color-adjust: exact !important;
//                 color-adjust: exact !important;
//                 width: 100%;
//                 max-width: 100%;
//               }
//               * {
//                 -webkit-print-color-adjust: exact !important;
//                 color-adjust: exact !important;
//               }
//             }
//             body { 
//               font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
//               margin: 0;
//               padding: 0;
//               width: 100%;
//               min-height: 100vh;
//               background: white;
//               color: #000;
//               font-size: 9px;
//             }
//             .invoice-container {
//               width: 100%;
//               max-width: 100%;
//               margin: 0 auto;
//               padding: 0;
//               box-sizing: border-box;
//               overflow: hidden;
//             }
//             .header { 
//               display: flex; 
//               justify-content: space-between; 
//               align-items: flex-start; 
//               margin-bottom: 8px; 
//               border-bottom: 1px solid #333; 
//               padding-bottom: 6px; 
//             }
//             .company-info { flex: 1; }
//             .company-name { 
//               font-size: 14px; 
//               font-weight: bold; 
//               margin-bottom: 4px; 
//               color: #333; 
//               text-align: center; 
//             }
//             .company-details { 
//               font-size: 8px; 
//               color: #666; 
//               line-height: 1.2; 
//               margin-bottom: 3px; 
//               padding: 2px 0; 
//             }
//             .invoice-details { 
//               background: #f8f9fa; 
//               padding: 6px; 
//               border-radius: 3px; 
//               margin-bottom: 8px; 
//               font-size: 8px; 
//               border: 1px solid #e0e0e0;
//             }
//             .invoice-details p { 
//               margin: 2px 0; 
//               font-size: 8px; 
//             }
//             .section-separator {
//               width: 100%;
//               border: none;
//               border-top: 1px dashed #2196f3;
//               margin: 2px 0 4px 0;
//             }
//             table { 
//               width: 100%; 
//               border-collapse: collapse; 
//               margin: 8px 0; 
//               font-size: 8px; 
//             }
//             th, td { 
//               border: 1px solid #ddd; 
//               padding: 3px 2px; 
//               text-align: left; 
//               font-size: 8px; 
//             }
//             th { 
//               background: #f5f5f5; 
//               font-weight: bold; 
//               color: #333; 
//               font-size: 8px; 
//             }
//             tbody td { 
//               font-size: 8px; 
//             }
//             .text-right { 
//               text-align: right; 
//             }
//             .totals { 
//               margin-top: 8px; 
//             }
//             .totals td, .totals .total-row { 
//               font-size: 8px; 
//             }
//             .totals table { 
//               border: none; 
//               width: 200px;
//               margin-left: auto;
//             }
//             .totals td { 
//               border: none; 
//               padding: 2px 0; 
//               font-size: 8px; 
//             }
//             .totals .total-row { 
//               font-weight: bold; 
//               font-size: 9px; 
//               border-top: 1px solid #333; 
//               padding-top: 2px;
//             }
//             .discount-row { 
//               color: #d32f2f; 
//               font-weight: bold; 
//             }
//             .thank-you { 
//               text-align: center; 
//               margin-top: 8px; 
//               padding: 4px; 
//               font-size: 8px; 
//             }
//             .thank-you h3 { 
//               margin-top: 0; 
//               margin-bottom: 2px; 
//               font-size: 9px; 
//               color: #1976d2; 
//             }
//             .thank-you p { 
//               margin: 1px 0; 
//               color: #555; 
//               font-size: 7px; 
//             }
//                          .product-images { display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 20px; margin: 16px 0; }
//              .product-images img { width: 100px; height: auto; object-fit: contain; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
//             .product-images-top { width: 100%; margin: 16px 0; padding: 0; }
//             .product-images-top img { width: 103%; height: 125px; object-fit: cover; border-radius: 8px; display: block; }
//             .product-image-bottom { width: 100%; display: block; margin: 32px 0 0 0; border-radius: 8px; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
//             .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
//             .brand-section { display: flex; align-items: flex-start; gap: 16px; }
//             .logo-container { display: flex; flex-direction: column; align-items: flex-start; }
//             .logo-and-text { display: flex; align-items: center; gap: 12px; }
//             .brand-logo { 
//               width: 50px; 
//               height: 50px; 
//               border-radius: 50%; 
//               border: 1px solid #ddd; 
//               object-fit: cover; 
//               background: #fff; 
//             }
//             .brand-name { 
//               font-size: 18px; 
//               font-weight: 900; 
//               color: #222; 
//               letter-spacing: 1px; 
//             }
//             .company-name-right { font-size: 28px; font-weight: bold; color: #1976d2; text-align: right; }
//             .product-images-grid { display: flex; justify-content: flex-start; align-items: center; gap: 6px; margin: 8px 0 0 0; padding: 0; }
//             .product-images-grid img { width: 60px; height: 60px; object-fit: contain; }
//           </style>
//         </head>
//         <body>
//           <div class="invoice-container">
//             <div class="header">
//               <div class="company-info">
//               <div class="header-top">
//                 <div class="brand-section">
//                   <div class="logo-container">
//                     <div class="logo-and-text">
//                       <img 
//                         src="${window.location.origin}/bs.jpg" 
//                         alt="Bin Sultan Logo" 
//                         class="brand-logo"
//                         onerror="this.style.display='none';"
//                       />
//                       <span class="brand-name">Bin Sultan Fabrics</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
//                 <div class="company-details" style="flex: 1; padding-right: 20px;">
//                   Premium Fabrics, Textiles & Garment Materials<br/>
//                   Contact No. : 0321-7590700<br/>
//                   Email: bin.sultanfabrics@gmail.com<br/>
//                   Address: 99/B, Liberty Plaza, Gulberg
//                 </div>
//                 <div class="invoice-details" style="flex: 1; padding-left: 20px;">
//                   <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
//                   <p><strong>Date:</strong> ${data.date} | <strong>Time:</strong> ${data.time}</p>
//                   <p><strong>Customer:</strong> ${data.customerName}</p>
//                   <p><strong>Customer Address:</strong> ${data.customerAddress || 'N/A'}</p>
//                   <p><strong>Phone:</strong> ${data.customerPhone}</p>
//                   ${data.staffName ? `<p><strong>Staff Member:</strong> ${data.staffName}</p>` : ''}
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           <table style="font-size: 12px;">
//             <thead>
//             <tr>
//               <th style="font-size: 12px;">Product Name</th>
//               <th class="text-right" style="font-size: 12px;">Quantity(Per Yard)</th>
//               <th class="text-right" style="font-size: 12px;">Price Per Unit</th>
//               <th class="text-right" style="font-size: 12px;">Total</th>
//             </tr>
//             </thead>
//             <tbody>
//               ${data.items.map((item) => `
//                 <tr>
//                   <td style="font-size: 12px;">${item.name}</td>
//                   <td class="text-right" style="font-size: 12px;">${item.quantity}${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? ` + ${item.tradeDiscountFreeItems}(TD)` : ''}</td>
//                   <td class="text-right" style="font-size: 12px;">${item.unitPrice === 0 ? 'FREE' : `Rs${item.unitPrice.toLocaleString()}`}</td>
//                   <td class="text-right" style="font-size: 12px;">${item.unitPrice === 0 ? 'Rs0' : `Rs${(item.unitPrice * item.quantity).toLocaleString()}`}</td>
//                 </tr>
//               `).join('')}
//             </tbody>
//           </table>
          
//         <div style="display: flex; justify-content: flex-end; align-items: flex-end; margin-top: 18px;">
//           <div class="totals">
//               <table style="width: 300px; margin: 0;">
//               <tr><td><strong>Subtotal:</strong></td><td class="text-right">Rs${data.subtotal.toLocaleString()}</td></tr>
//               <tr class="discount-row">
//                 <td><strong>Total Discount: (${data.totalDiscount > 0 && data.subtotal > 0 ? Math.round((data.totalDiscount / data.subtotal) * 100) : 0}%)</strong></td>
//                 <td class="text-right">-Rs${data.totalDiscount.toLocaleString()}</td>
//               </tr>
//               <tr class="total-row"><td><strong>TOTAL:</strong></td><td class="text-right">Rs${data.total.toLocaleString()}</td></tr>
//               </table>
//             </div>
//           </div>

//           ${itemsWithTradeDiscount.length > 0 ? `
//           <div style="margin-top: 8px;">
//             <hr class="section-separator" />
//             <div style="font-weight: bold; margin-bottom: 4px; color: #d32f2f; font-size: 10px;">Trade Discount Items:</div>
//             <ul style="margin: 0; padding-left: 16px;">
//               ${itemsWithTradeDiscount.map(item => `<li style="color: #d32f2f; font-size: 10px;">${item.name} (${item.size || 'N/A'}): ${item.tradeDiscountFreeItems} free Yard(s)</li>`).join('')}
//             </ul>
//           </div>` : ''}
          
//           <div style="margin-top: 40px; text-align: center;">
//             <p style="margin: 0 0 4px 0; font-size: 12px; color: #1976d2; font-weight: 500;">Thank you for ordering with us</p>
//             <p style="margin: 2px 0; color: #555; font-size: 10px;">For any queries or support, please contact us at <strong>0321-7590700</strong></p>
//             <p style="margin: 2px 0 0 0; color: #555; font-size: 10px;"><strong>Visit us again!</strong></p>
//           </div>
//           </div>

//         </body>
//       </html>
//     `
//   }

//   // Generate thermal invoice HTML (compact format for thermal printers)
//   const generateThermalInvoiceHTML = (data: InvoiceData) => {
//     return `
//       <html>
//         <head>
//           <title>Thermal Invoice</title>
//           <style>
//             @media print {
//               @page {
//                 margin: 0;
//                 size: 80mm auto;
//               }
//               body {
//                 margin: 0 !important;
//                 padding: 2mm !important;
//                 -webkit-print-color-adjust: exact !important;
//                 color-adjust: exact !important;
//               }
//               * {
//                 -webkit-print-color-adjust: exact !important;
//                 color-adjust: exact !important;
//               }
//             }
//             body { 
//               font-family: 'Courier New', monospace; 
//               font-size: 12px;
//               line-height: 1.2;
//               margin: 0;
//               padding: 2mm;
//               max-width: 80mm;
//               background: white;
//               color: black;
//             }
//             .header { text-align: center; margin-bottom: 8px; }
//             .company-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
//             .company-details { font-size: 10px; margin-bottom: 4px; }
//             .divider { border-top: 1px dashed #000; margin: 4px 0; }
//             .invoice-info { margin-bottom: 6px; }
//             .invoice-info p { margin: 1px 0; font-size: 10px; }
//             .items-table { width: 100%; border-collapse: collapse; margin: 4px 0; }
//             .items-table td { padding: 1px 0; font-size: 10px; }
//             .item-name { width: 40%; }
//             .item-qty { width: 15%; text-align: right; }
//             .item-price { width: 20%; text-align: right; }
//             .item-total { width: 25%; text-align: right; }
//             .totals { margin-top: 6px; }
//             .totals p { margin: 1px 0; font-size: 10px; }
//             .total-line { font-weight: bold; border-top: 1px solid #000; padding-top: 2px; }
//             .footer { text-align: center; margin-top: 8px; font-size: 9px; }
//             .center { text-align: center; }
//             .right { text-align: right; }
//           </style>
//         </head>
//         <body>
//           <div class="header">
//             <div class="company-name">BIN SULTAN FABRICS</div>
//             <div class="company-details">
//               99/B, Liberty Plaza, Gulberg<br/>
//               Contact: 0321-7590700<br/>
//               Email: bin.sultanfabrics@gmail.com
//             </div>
//           </div>
          
//           <div class="divider"></div>
          
//           <div class="invoice-info">
//             <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
//             <p><strong>Date:</strong> ${data.date} | <strong>Time:</strong> ${data.time}</p>
//             <p><strong>Customer:</strong> ${data.customerName}</p>
//             ${data.customerPhone ? `<p><strong>Phone:</strong> ${data.customerPhone}</p>` : ''}
//             ${data.paymentMethod ? `<p><strong>Payment:</strong> ${data.paymentMethod}</p>` : ''}
//             ${data.staffMember ? `<p><strong>Staff:</strong> ${data.staffMember}</p>` : ''}
//           </div>
          
//           <div class="divider"></div>
          
//           <table class="items-table">
//             <tr>
//               <td class="item-name"><strong>ITEM</strong></td>
//               <td class="item-qty"><strong>QTY</strong></td>
//               <td class="item-price"><strong>PRICE</strong></td>
//               <td class="item-total"><strong>TOTAL</strong></td>
//             </tr>
//             ${data.items.map((item) => {
//       const totalPrice = item.unitPrice * item.quantity;
//       return `
//               <tr>
//                 <td class="item-name">${item.name}</td>
//                 <td class="item-qty">${item.quantity}${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? `+${item.tradeDiscountFreeItems}` : ''}</td>
//                 <td class="item-price">${item.unitPrice === 0 ? 'FREE' : item.unitPrice.toLocaleString()}</td>
//                 <td class="item-total">${item.unitPrice === 0 ? 'FREE' : totalPrice.toLocaleString()}</td>
//               </tr>
//               ${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? `
//                 <tr>
//                   <td class="item-name" style="font-size: 9px; color: #666;">  └ Free: ${item.tradeDiscountFreeItems} yard(s)</td>
//                   <td class="item-qty"></td>
//                   <td class="item-price"></td>
//                   <td class="item-total"></td>
//                 </tr>
//               ` : ''}
//             `;
//     }).join('')}
//           </table>
          
//           <div class="divider"></div>
          
//           <div class="totals">
//             <p class="right">Subtotal: Rs${data.subtotal.toLocaleString()}</p>
//             ${data.totalDiscount > 0 ? `<p class="right">Discount: -Rs${data.totalDiscount.toLocaleString()}</p>` : ''}
//             <p class="right total-line">TOTAL: Rs${data.total.toLocaleString()}</p>
//           </div>
          
//           <div class="divider"></div>
          
//           <div class="footer">
//             <p>Thank you for your business!</p>
//             <p>Visit us again</p>
//             <p>For support: 0321-7590700</p>
//           </div>
//         </body>
//       </html>
//     `
//   }


//   // Enhanced customer search logic
//   const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setCustomerName(value);

//     if (value.length > 0) {
//       const filteredCustomers = customers.filter(c => {
//         // Search by name
//         if ((c.name || '').toLowerCase().includes(value.toLowerCase())) {
//           return true;
//         }

//         // Search by address
//         if (c.address && (c.address || '').toLowerCase().includes(value.toLowerCase())) {
//           return true;
//         }

//         // Search by phone with smart 0/92 handling and normalization
//         if (value.match(/^[0-9+\-\s]/)) {
//           const customerPhone = c.phone;

//           // Normalize both numbers by removing +, -, and spaces
//           const normalizeForSearch = (num: string) => {
//             return num.replace(/[+\-\s]/g, '');
//           };

//           const normalizedValue = normalizeForSearch(value);
//           const normalizedCustomerPhone = normalizeForSearch(customerPhone);

//           // If user types 92 prefix and customer has 0 prefix
//           if (normalizedValue.startsWith('92') && normalizedCustomerPhone.startsWith('0')) {
//             const userNumber = normalizedValue.substring(2); // Remove "92"
//             const customerNumber = normalizedCustomerPhone.substring(1); // Remove "0"
//             return customerNumber === userNumber || customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
//           }

//           // If user types 0 prefix and customer has 92 prefix
//           if (normalizedValue.startsWith('0') && normalizedCustomerPhone.startsWith('92')) {
//             const userNumber = normalizedValue.substring(1); // Remove "0"
//             const customerNumber = normalizedCustomerPhone.substring(2); // Remove "92"
//             return customerNumber === userNumber || customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
//           }

//           // If both have same prefix, do normal matching
//           if ((normalizedValue.startsWith('92') && normalizedCustomerPhone.startsWith('92')) ||
//             (normalizedValue.startsWith('0') && normalizedCustomerPhone.startsWith('0'))) {
//             return normalizedCustomerPhone.includes(normalizedValue) || normalizedValue.includes(normalizedCustomerPhone);
//           }

//           // Fallback to normal matching with normalized numbers
//           return normalizedCustomerPhone.includes(normalizedValue) || normalizedValue.includes(normalizedCustomerPhone);
//         }

//         return false;
//       });
//       setCustomerSuggestions(filteredCustomers.slice(0, 10)); // Limit to 10 suggestions
//     } else {
//       setCustomerSuggestions([]);
//     }
//   };

//   const handleCustomerSuggestionSelect = (customer: Customer) => {
//     setCustomerName(customer.name || '');
//     setCustomerPhone(customer.phone || '');
//     setCustomerAddress(customer.address || '');
//     setCustomerSuggestions([]);
//   };

//   // Phone normalization for WhatsApp/invoice
//   const normalizePhone = (phone: string) => {
//     const p = phone.trim();
//     if (p.startsWith("0") && p.length === 11) {
//       return "+92" + p.slice(1);
//     }
//     if (p.startsWith("+92")) {
//       return p;
//     }
//     // fallback: return as is
//     return p;
//   };

//   const staffNameForInvoice = manualStaffName.trim() || (employees.find((emp) => emp.id === staffMember)?.name || "");

//   // Handle advanced pricing
//   const openPricingModal = (item: CartItem) => {
//     setPricingItem(item);
//     setShowPricingModal(true);
//   };

//   // Handle price update with individual pricing
//   const handlePriceUpdate = (productId: string, newPrice: number, individualPrices: number[]) => {
//     const totalAmount = individualPrices.reduce((sum, price) => sum + price, 0);

//     // Update the cart with new price and individual prices
//     const updatedCart = cart.map(item =>
//       item.id === productId
//         ? {
//           ...item,
//           unitPrice: newPrice,
//           finalPrice: totalAmount,
//           individualPrices: individualPrices,
//           totalAmount: totalAmount
//         }
//         : item
//     );
//     // Update the context cart
//     clearCart()
//     updatedCart.forEach(item => {
//       contextAddToCart(item)
//     });

//     // Recalculate discount if needed
//     if (cartDiscountPercentage > 0) {
//       const newSubtotal = updatedCart.reduce((sum, item) => sum + (item.totalAmount || item.unitPrice * item.quantity), 0);
//       const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100);
//       setCartDiscount(newDiscount);
//     }
//   };



//   if (loading) {
//     return (
//       <div className="flex flex-col h-screen bg-background">
//         <div className="flex-1 flex items-center justify-center p-6">
//           <div className="text-center space-y-6">
//             <div className="relative">
//               <div className="w-16 h-16 mx-auto bg-background rounded-full flex items-center justify-center">
//                 <Loader2 className="h-8 w-8 text-white animate-spin" />
//               </div>
//               <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
//                 <span className="text-xs font-bold text-black">★</span>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <h2 className="text-2xl font-bold text-foreground">Loading POS Module</h2>
//               <p className="text-muted-foreground">Please wait while we prepare your point of sale system...</p>
//             </div>
//             <div className="flex justify-center space-x-2">
//               <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
//               <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
//               <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="grid gap-4 lg:grid-cols-6 bg-background min-h-screen p-4 pb-12">
//       {/* Product Search & Selection */}
//       <div className="lg:col-span-2 space-y-4">
//         <Card className="glass-card shadow-xl card-hover">
//           <CardHeader className="pb-2 bg-gradient-to-r from-slate-50/50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/20 border-b-2 border-slate-300 dark:border-slate-600">
//             <CardTitle className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
//               <Search className="h-3 w-3 text-blue-600 dark:text-blue-400" />
//               Product Search
//             </CardTitle>
//             <CardDescription className="text-xs text-slate-600 dark:text-slate-300">Search by name or code</CardDescription>
//           </CardHeader>
//           <CardContent className="p-3">
//             <div className="space-y-2">
//               <div className="relative">
//                 <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
//                 <Input
//                   id="pos-product-search"
//                   name="pos-product-search"
//                   placeholder="Search products..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10 h-12 vibrant-input text-lg"
//                 />
//               </div>

//               <div className="grid gap-1 max-h-64 overflow-y-auto">
//                 {filteredProducts.map((product, index) => (
//                   <div
//                     key={`${product.id}-${index}`}
//                     className={`flex items-center justify-between p-2 border border-border rounded-md transition-all duration-300 hover:shadow-lg ${product.stock <= 0 ? 'opacity-50 bg-muted' : 'bg-card hover:bg-muted/50'
//                       }`}
//                   >
//                     <div className="flex-1 min-w-0">
//                       <p className="font-medium text-xs truncate">{product.name}</p>
//                       <p className="text-xs text-muted-foreground">Code: {product.code}</p>
//                       <p className="text-xs text-muted-foreground">Size: {product.size}</p>
//                       <p className={`text-xs ${product.stock <= 0 ? 'text-white font-medium' : 'text-muted-foreground'}`}>
//                         Stock: {product.stock} yard(s)
//                         {product.stock <= 0 && (
//                           <span className="ml-1 text-white font-medium">Out of Stock</span>
//                         )}
//                       </p>
//                     </div>
//                     <div className="text-right space-y-1">
//                       <p className="font-bold text-xs text-foreground">Rs{product.currentPrice}</p>
//                       <div className="flex items-center gap-1">
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           disabled={product.stock <= 0}
//                           className={`h-6 w-6 p-0 border-border hover:bg-white hover:text-black transition-all duration-200 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             const cartItem = cart.find(item => item.id === product.id);
//                             if (cartItem) {
//                               updateQuantity(product.id, cartItem.quantity - 1);
//                             }
//                           }}
//                         >
//                           <Minus className="h-2 w-2" />
//                         </Button>
//                         <span className="text-sm w-8 h-6 text-center font-medium bg-muted px-2 py-1 rounded flex items-center justify-center">
//                           {cart.find(item => item.id === product.id)?.quantity || 0}
//                         </span>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           disabled={product.stock <= 0}
//                           className={`h-6 w-6 p-0 border-orange-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:bg-gray-200 disabled:hover:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 dark:border-orange-600 dark:hover:bg-orange-600 dark:disabled:bg-gray-700 dark:disabled:hover:bg-gray-700 dark:disabled:text-gray-500 dark:disabled:border-gray-600 transition-all duration-200 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             addToCart(product);
//                           }}
//                         >
//                           <Plus className="h-2 w-2" />
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Unified Customer, Payment & Staff Section */}
//         <Card className="glass-card shadow-xl card-hover">
//           <CardHeader className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 border-b-2 border-gray-300 dark:border-gray-600 pb-4">
//             <CardTitle className="flex items-center gap-2 text-base text-foreground mb-2">
//               <User className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
//               Sale Information
//             </CardTitle>
//             <CardDescription className="text-sm text-muted-foreground leading-relaxed">
//               Customer details, payment method, and staff assignment
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="p-4 sm:p-6">
//             <div className="space-y-6">
//               {/* Customer Details Section */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 mb-4">
//                   <User className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
//                   <h3 className="text-sm font-semibold text-foreground">Customer Details</h3>
//                   {paymentMethod === "credit" && (
//                     <span className="text-xs text-red-500 font-medium">(Required for Credit Sales)</span>
//                   )}
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="customerName" className="text-xs font-medium block">
//                       Customer Name
//                       {paymentMethod === "credit" && (
//                         <span className="text-red-500 ml-1">*</span>
//                       )}
//                     </Label>
//                     <Input
//                       id="customerName"
//                       placeholder="Search or enter name"
//                       value={customerName}
//                       onChange={handleCustomerNameChange}
//                       autoComplete="off"
//                       autoCorrect="off"
//                       autoCapitalize="off"
//                       spellCheck="false"
//                       className={`h-8 text-sm w-full ${paymentMethod === "credit" && !customerName.trim()
//                         ? "border-red-500 focus:border-red-500"
//                         : ""
//                         }`}
//                     />
//                     {customerSuggestions.length > 0 && (
//                       <div className="mt-2 max-h-64 w-[120%] min-w-[400px] overflow-y-auto bg-background border border-border rounded-lg shadow-xl z-20">
//                         <div className="p-3 text-sm text-muted-foreground border-b border-border bg-muted font-medium sticky top-0">
//                           Found {customerSuggestions.length} customer{customerSuggestions.length !== 1 ? 's' : ''}
//                         </div>
//                         {customerSuggestions.map((customer) => (
//                           <div
//                             key={customer.id}
//                             className="cursor-pointer hover:bg-accent hover:text-accent-foreground p-4 border-b border-border last:border-b-0 transition-colors"
//                             onClick={() => handleCustomerSuggestionSelect(customer)}
//                           >
//                             <div className="flex items-center justify-between">
//                               <div className="flex-1 min-w-0">
//                                 <p className="font-semibold text-base text-foreground">{customer.name}</p>
//                                 <p className="text-sm text-muted-foreground mt-1">{customer.phone}</p>
//                                 {customer.address && (
//                                   <p className="text-sm text-muted-foreground mt-1">{customer.address}</p>
//                                 )}
//                               </div>
//                               <Badge variant="outline" className="text-sm ml-3 flex-shrink-0 px-2 py-1">
//                                 {customer.customerType || 'Regular'}
//                               </Badge>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                   <div className="space-y-1">
//                     <Label htmlFor="customerPhone" className="text-xs font-medium block">
//                       Phone Number
//                       {paymentMethod === "credit" && (
//                         <span className="text-red-500 ml-1">*</span>
//                       )}
//                     </Label>
//                     <Input
//                       id="customerPhone"
//                       placeholder="Enter phone number"
//                       value={customerPhone}
//                       onChange={(e) => {
//                         const phone = normalizePhone(e.target.value);
//                         setCustomerPhone(phone);

//                         // Search customers by phone when typing
//                         if (phone.length > 3) {
//                           const phoneCustomers = customers.filter(c => {
//                             const customerPhone = c.phone;

//                             // Normalize both numbers by removing +, -, and spaces
//                             const normalizeForSearch = (num: string) => {
//                               return num.replace(/[+\-\s]/g, '');
//                             };

//                             const normalizedUserPhone = normalizeForSearch(phone);
//                             const normalizedCustomerPhone = normalizeForSearch(customerPhone);

//                             // If user types 92 prefix and customer has 0 prefix
//                             if (normalizedUserPhone.startsWith('92') && normalizedCustomerPhone.startsWith('0')) {
//                               const userNumber = normalizedUserPhone.substring(2); // Remove "92"
//                               const customerNumber = normalizedCustomerPhone.substring(1); // Remove "0"
//                               return customerNumber === userNumber || customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
//                             }

//                             // If user types 0 prefix and customer has 92 prefix
//                             if (normalizedUserPhone.startsWith('0') && normalizedCustomerPhone.startsWith('92')) {
//                               const userNumber = normalizedUserPhone.substring(1); // Remove "0"
//                               const customerNumber = normalizedCustomerPhone.substring(2); // Remove "92"
//                               return customerNumber === userNumber || customerNumber.includes(userNumber) || userNumber.includes(customerNumber);
//                             }

//                             // If both have same prefix, do normal matching
//                             if ((normalizedUserPhone.startsWith('92') && normalizedCustomerPhone.startsWith('92')) ||
//                               (normalizedUserPhone.startsWith('0') && normalizedCustomerPhone.startsWith('0'))) {
//                               return normalizedCustomerPhone.includes(normalizedUserPhone) || normalizedUserPhone.includes(normalizedCustomerPhone);
//                             }

//                             // Fallback to normal matching with normalized numbers
//                             return normalizedCustomerPhone.includes(normalizedUserPhone) || normalizedUserPhone.includes(normalizedCustomerPhone);
//                           });
//                           if (phoneCustomers.length > 0 && phoneCustomers.length <= 5) {
//                             setCustomerSuggestions(phoneCustomers);
//                           }
//                         } else if (phone.length === 0) {
//                           setCustomerSuggestions([]);
//                         }
//                       }}
//                       autoComplete="off"
//                       autoCorrect="off"
//                       autoCapitalize="off"
//                       spellCheck="false"
//                       className={`h-8 text-sm w-full ${paymentMethod === "credit" && !customerPhone.trim()
//                         ? "border-red-500 focus:border-red-500"
//                         : ""
//                         }`}
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <Label htmlFor="customerAddress" className="text-xs font-medium block">Address</Label>
//                     <Input
//                       id="customerAddress"
//                       placeholder="Enter address"
//                       value={customerAddress}
//                       onChange={(e) => {
//                         const address = e.target.value;
//                         setCustomerAddress(address);

//                         // Search customers by address when typing
//                         if (address.length > 2) {
//                           const addressCustomers = customers.filter(c =>
//                             c.address && (c.address || '').toLowerCase().includes(address.toLowerCase())
//                           );
//                           if (addressCustomers.length > 0 && addressCustomers.length <= 5) {
//                             setCustomerSuggestions(addressCustomers);
//                           }
//                         } else if (address.length === 0) {
//                           setCustomerSuggestions([]);
//                         }
//                       }}
//                       autoComplete="off"
//                       autoCorrect="off"
//                       autoCapitalize="off"
//                       spellCheck="false"
//                       className="h-8 text-sm w-full"
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <Label className="text-xs font-medium block">Delivery Type</Label>
//                     <Select value={deliveryType} onValueChange={(value) => setDeliveryType(value as "pickup" | "delivery")}>
//                       <SelectTrigger className="h-8 w-full">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="pickup">Pickup</SelectItem>
//                         <SelectItem value="delivery">Delivery</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   {deliveryType === 'delivery' && (
//                     <>
//                       <div className="space-y-1">
//                         <Label htmlFor="deliveryAddress" className="text-xs font-medium block">Delivery Address</Label>
//                         <Input
//                           id="deliveryAddress"
//                           placeholder="Enter delivery address"
//                           value={deliveryAddress}
//                           onChange={(e) => setDeliveryAddress(e.target.value)}
//                           className="h-8 text-sm w-full"
//                         />
//                       </div>
//                       <div className="space-y-1">
//                         <Label htmlFor="deliveryDate" className="text-xs font-medium block">Delivery Date (optional)</Label>
//                         <Input
//                           id="deliveryDate"
//                           type="date"
//                           value={deliveryDate}
//                           onChange={(e) => setDeliveryDate(e.target.value)}
//                           className="h-8 text-sm w-full"
//                         />
//                       </div>
//                     </>
//                   )}
//                 </div>
//               </div>

//               {/* Staff Member Section */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 mb-4">
//                   <User className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
//                   <h3 className="text-sm font-semibold text-foreground">Staff Member</h3>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <Label className="text-xs font-medium block">Select Staff</Label>
//                     <Select value={staffMember} onValueChange={setStaffMember}>
//                       <SelectTrigger className="h-8 w-full">
//                         <SelectValue placeholder="Choose staff member" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {employees.map((employee) => (
//                           <SelectItem key={employee.id} value={employee.id}>
//                             {employee.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-1">
//                     <Label className="text-xs font-medium block">Or Enter Name</Label>
//                     <Input
//                       placeholder="Type staff name"
//                       value={manualStaffName}
//                       onChange={e => setManualStaffName(e.target.value)}
//                       className="h-8 text-sm w-full"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Payment Method Section */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 mb-4">
//                   <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
//                   <h3 className="text-sm font-semibold text-foreground">Payment Method</h3>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <Label className="text-xs font-medium block">Select Payment</Label>
//                     <Select value={paymentMethod} onValueChange={setPaymentMethod}>
//                       <SelectTrigger className="h-8 w-full">
//                         <SelectValue placeholder="Choose payment method" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="cash">
//                           <div className="flex items-center gap-2">
//                             <Banknote className="h-3 w-3" />
//                             Cash
//                           </div>
//                         </SelectItem>
//                         <SelectItem value="card">
//                           <div className="flex items-center gap-2">
//                             <CreditCard className="h-3 w-3" />
//                             Card
//                           </div>
//                         </SelectItem>
//                         <SelectItem value="mobile">
//                           <div className="flex items-center gap-2">
//                             <Smartphone className="h-3 w-3" />
//                             Mobile Transfer
//                           </div>
//                         </SelectItem>
//                         <SelectItem value="credit">
//                           <div className="flex items-center gap-2">
//                             <User className="h-3 w-3" />
//                             Credit Sale
//                           </div>
//                         </SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   {paymentMethod === "credit" && (
//                     <div className="space-y-1">
//                       <Label className="text-xs font-medium block">
//                         Partial Payment (Optional)
//                       </Label>
//                       <Input
//                         type="number"
//                         placeholder="Enter partial payment amount"
//                         value={partialPaymentAmount}
//                         onChange={(e) => setPartialPaymentAmount(e.target.value)}
//                         className="h-8 text-sm w-full"
//                         min="0"
//                         step="0.01"
//                       />
//                       <p className="text-xs text-muted-foreground">
//                         Leave empty for full credit sale
//                       </p>
//                       {partialPaymentAmount && parseFloat(partialPaymentAmount) > 0 && (
//                         <p className="text-xs text-orange-600 font-medium">
//                           Remaining: Rs{(total - parseFloat(partialPaymentAmount)).toLocaleString()}
//                         </p>
//                       )}
//                     </div>
//                   )}
//                   <div className="space-y-1">
//                     <Label className="text-xs font-medium block">Complete Sale</Label>
//                     <Button
//                       onClick={handleCheckout}
//                       disabled={cart.length === 0 || !paymentMethod || hasStockIssues || isProcessingSale}
//                       size="sm"
//                       className="w-full h-8 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-600 dark:bg-green-600 dark:hover:bg-green-700 dark:disabled:bg-gray-600 dark:disabled:hover:bg-gray-600 dark:disabled:text-gray-400"
//                     >
//                       {isProcessingSale ? (
//                         <>
//                           <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
//                           Processing...
//                         </>
//                       ) : (
//                         'Complete Sale'
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Cart & Checkout */}
//       <div className="lg:col-span-4 space-y-4">
//         <Card className="glass-card shadow-xl">
//           <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-300 dark:border-gray-600 pb-2">
//             <CardTitle className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
//                 <span className="text-sm font-semibold">Shopping Cart</span>
//                 {hasStockIssues && (
//                   <AlertTriangle className="h-3 w-3 text-red-500 dark:text-red-400 animate-pulse" />
//                 )}
//               </div>
//               <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">
//                 {cart.length} item{cart.length !== 1 ? 's' : ''}
//               </Badge>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="p-0">
//             {cart.length === 0 ? (
//               <div className="text-center py-8">
//                 <ShoppingCart className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
//                 <p className="text-gray-500 dark:text-gray-400 text-sm">Cart is empty</p>
//                 <p className="text-gray-400 dark:text-gray-500 text-xs">Add products to get started</p>
//               </div>
//             ) : (
//               <div className="max-h-130 overflow-y-auto">
//                 <div className="divide-y divide-gray-200 dark:divide-gray-700">
//                   {cart.map((item, index) => {
//                     const product = products.find((p) => p.id === item.id)
//                     const exceedsStock = product ? item.quantity > product.stock : false
//                     const uniqueKey = `${item.id}-${index}`

//                     return (
//                       <div key={uniqueKey} className={`p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 ${exceedsStock ? 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/20' : ''}`}>
//                         <div className="flex items-start justify-between">
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center gap-1 mb-1">
//                               <h4 className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">{item.name}</h4>
//                               <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0">
//                                 {item.code}
//                               </Badge>
//                               {exceedsStock && (
//                                 <Badge variant="destructive" className="text-xs px-1 py-0">
//                                   Stock Issue
//                                 </Badge>
//                               )}
//                               {item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 && (
//                                 <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1 py-0">
//                                   <Gift className="h-2 w-2 mr-1" />
//                                   {item.tradeDiscountFreeItems} Free
//                                 </Badge>
//                               )}
//                             </div>
//                             <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
//                               <span>Size: {product?.size}</span>
//                               <span>Rs{item.unitPrice.toFixed(2)}</span>
//                               {exceedsStock && (
//                                 <span className="text-red-600 dark:text-red-400 font-medium">
//                                   Available: {product?.stock || 0}
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             onClick={() => removeFromCart(item.id)}
//                             className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 h-5 w-5 p-0"
//                           >
//                             <Trash2 className="h-2 w-2" />
//                           </Button>
//                         </div>

//                         <div className="flex items-center gap-1">
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => updateQuantity(item.id, item.quantity - 1)}
//                             className="border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:border-red-600 dark:hover:bg-red-600 h-5 w-5 p-0"
//                           >
//                             <Minus className="h-2 w-2" />
//                           </Button>
//                           <Input
//                             type="number"
//                             step="0.01"
//                             min="0"
//                             max={product?.stock || 0}
//                             value={item.quantity || ""}
//                             placeholder="0"
//                             onChange={(e) => handleQuantityInput(item.id, e.target.value)}
//                             onFocus={(e) => {
//                               if (e.target.value === "0") {
//                                 e.target.value = ""
//                               }
//                             }}
//                             onBlur={(e) => {
//                               if (e.target.value === "") {
//                                 e.target.value = "0"
//                               }
//                             }}
//                             className="h-6 w-16 text-center text-sm border-gray-300 focus:border-orange-500 dark:border-gray-600 dark:focus:border-orange-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
//                           />
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => updateQuantity(item.id, item.quantity + 1)}
//                             disabled={product ? item.quantity >= product.stock : false}
//                             className="border-green-300 hover:bg-green-500 hover:text-white hover:border-green-500 disabled:bg-gray-200 disabled:hover:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 dark:border-green-600 dark:hover:bg-green-600 dark:disabled:bg-gray-700 dark:disabled:hover:bg-gray-700 dark:disabled:text-gray-500 dark:disabled:border-gray-600 h-5 w-5 p-0"
//                           >
//                             <Plus className="h-2 w-2" />
//                           </Button>
//                           <div className="flex items-center gap-1 ml-1">
//                             <Button
//                               size="sm"
//                               variant="secondary"
//                               onClick={() => addTradeDiscountUnit(item.id)}
//                               className="bg-white text-black hover:bg-gray-100 h-5 text-xs px-1"
//                             >
//                               <Gift className="h-2 w-2 mr-1" />
//                               Free
//                             </Button>
//                             {item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 && (
//                               <>
//                                 <Button
//                                   size="sm"
//                                   variant="outline"
//                                   onClick={() => removeTradeDiscountUnit(item.id)}
//                                   className="border-border hover:bg-white/10 hover:text-white h-5 w-5 p-0"
//                                 >
//                                   <Minus className="h-2 w-2" />
//                                 </Button>
//                                 <span className="text-xs font-medium text-foreground px-1">
//                                   {item.tradeDiscountFreeItems}
//                                 </span>
//                               </>
//                             )}
//                           </div>
//                         </div>

//                         {/* Free Products Manual Entry */}
//                         <div className="mt-1 space-y-1">
//                           <Label className="text-xs text-muted-foreground">Free Products</Label>
//                           <div className="flex items-center gap-1">
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               onClick={() => {
//                                 const currentFree = item.tradeDiscountFreeItems || 0
//                                 const newFree = Math.max(0, currentFree - 1)
//                                 const updatedCart = cart.map(cartItem =>
//                                   cartItem.id === item.id
//                                     ? { ...cartItem, tradeDiscountFreeItems: newFree }
//                                     : cartItem
//                                 )
//                                 // Update the context cart
//                                 clearCart()
//                                 updatedCart.forEach(item => {
//                                   contextAddToCart(item)
//                                 })
//                               }}
//                               className="border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 dark:border-red-600 dark:hover:bg-red-600 h-5 w-5 p-0"
//                             >
//                               <Minus className="h-2 w-2" />
//                             </Button>
//                             <Input
//                               type="number"
//                               step="0.01"
//                               min="0"
//                               value={item.tradeDiscountFreeItems || ""}
//                               placeholder="0"
//                               onChange={(e) => {
//                                 const freeQuantity = parseFloat(e.target.value) || 0
//                                 const updatedCart = cart.map(cartItem =>
//                                   cartItem.id === item.id
//                                     ? { ...cartItem, tradeDiscountFreeItems: freeQuantity }
//                                     : cartItem
//                                 )
//                                 // Update the context cart
//                                 clearCart()
//                                 updatedCart.forEach(item => {
//                                   contextAddToCart(item)
//                                 })
//                               }}
//                               onFocus={(e) => {
//                                 if (e.target.value === "0") {
//                                   e.target.value = ""
//                                 }
//                               }}
//                               onBlur={(e) => {
//                                 if (e.target.value === "") {
//                                   e.target.value = "0"
//                                 }
//                               }}
//                               className="h-6 w-16 text-center text-sm border-gray-300 focus:border-green-500 dark:border-gray-600 dark:focus:border-green-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
//                             />
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               onClick={() => {
//                                 const currentFree = item.tradeDiscountFreeItems || 0
//                                 const newFree = currentFree + 1
//                                 const updatedCart = cart.map(cartItem =>
//                                   cartItem.id === item.id
//                                     ? { ...cartItem, tradeDiscountFreeItems: newFree }
//                                     : cartItem
//                                 )
//                                 // Update the context cart
//                                 clearCart()
//                                 updatedCart.forEach(item => {
//                                   contextAddToCart(item)
//                                 })
//                               }}
//                               className="border-green-300 hover:bg-green-500 hover:text-white hover:border-green-500 dark:border-green-600 dark:hover:bg-green-600 h-5 w-5 p-0"
//                             >
//                               <Plus className="h-2 w-2" />
//                             </Button>
//                             <span className="text-xs text-muted-foreground">free</span>
//                           </div>
//                         </div>

//                         <div className="space-y-2">
//                           {/* Inline Price Editing */}
//                           <div className="space-y-1">
//                             <Label className="text-xs text-muted-foreground">Unit Price (Rs)</Label>
//                             <div className="flex items-center gap-2">
//                               <Input
//                                 type="number"
//                                 step="0.01"
//                                 min="0"
//                                 max="999999"
//                                 value={item.unitPrice || ""}
//                                 disabled={false}
//                                 onChange={(e) => {
//                                   const newPrice = parseFloat(e.target.value) || 0;
//                                   const updatedCart = cart.map(cartItem =>
//                                     cartItem.id === item.id
//                                       ? {
//                                         ...cartItem,
//                                         unitPrice: newPrice,
//                                         finalPrice: newPrice * cartItem.quantity,
//                                         totalAmount: newPrice * cartItem.quantity,
//                                         individualPrices: Number.isInteger(cartItem.quantity) ? Array(cartItem.quantity).fill(newPrice) : []
//                                       }
//                                       : cartItem
//                                   );
//                                   // Update the context cart
//                                   clearCart()
//                                   updatedCart.forEach(item => {
//                                     contextAddToCart(item)
//                                   });

//                                   // Recalculate discount if needed
//                                   if (cartDiscountPercentage > 0) {
//                                     const newSubtotal = updatedCart.reduce((sum, cartItem) => sum + (cartItem.totalAmount || cartItem.unitPrice * cartItem.quantity), 0);
//                                     const newDiscount = Math.round((newSubtotal * cartDiscountPercentage) / 100);
//                                     setCartDiscount(newDiscount);
//                                   }
//                                 }}
//                                 onFocus={(e) => {
//                                   if (e.target.value === "0") {
//                                     e.target.value = "";
//                                   }
//                                 }}
//                                 onBlur={(e) => {
//                                   if (e.target.value === "") {
//                                     e.target.value = "0";
//                                   }
//                                 }}
//                                 className="h-6 text-xs"
//                                 placeholder="0.00"
//                               />
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 onClick={() => openPricingModal(item)}
//                                 className="h-6 text-xs px-2 border-purple-300 hover:bg-purple-500 hover:text-white hover:border-purple-500 dark:border-purple-600 dark:hover:bg-purple-600"
//                                 title="Advanced Pricing Options"
//                               >
//                                 <DollarSign className="h-2 w-2 mr-1" />
//                                 Price
//                               </Button>
//                             </div>
//                           </div>

//                           {/* Price Display */}
//                           <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
//                             <div className="flex items-center gap-2">
//                               <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit: Rs{item.unitPrice.toFixed(2)}</span>
//                               {item.unitPrice !== (products.find(p => p.id === item.id)?.currentPrice || 0) && (
//                                 <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
//                                   Modified
//                                 </Badge>
//                               )}
//                             </div>
//                             <span className="text-sm font-bold text-green-600 dark:text-green-400">Total: Rs{(item.totalAmount || (item.unitPrice * item.quantity)).toFixed(2)}</span>
//                           </div>
//                         </div>
//                       </div>
//                     )
//                   })}
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Separator />

//         {/* Cart-level discount inputs */}
//         <div className="space-y-1">
//           <Label className="text-xs">Cart Discount:</Label>
//           <div className="flex items-center gap-2">
//             <div className="flex-1">
//               <Input
//                 type="number"
//                 min={0}
//                 max={subtotal}
//                 placeholder="Amount"
//                 value={cartDiscount || ""}
//                 onChange={(e) => {
//                   let val = Number(e.target.value.replace(/^0+/, ''))
//                   if (isNaN(val) || val < 0) val = 0
//                   if (val > subtotal) val = subtotal
//                   updateDiscountByAmount(val)
//                 }}
//                 className="h-7 text-xs"
//                 inputMode="numeric"
//                 pattern="[0-9]*"
//               />
//             </div>
//             <div className="flex-1">
//               <Input
//                 type="number"
//                 min={0}
//                 max={100}
//                 placeholder="%"
//                 value={cartDiscountPercentage || ""}
//                 onChange={(e) => {
//                   let val = Number(e.target.value.replace(/^0+/, ''))
//                   if (isNaN(val) || val < 0) val = 0
//                   if (val > 100) val = 100
//                   updateDiscountByPercentage(val)
//                 }}
//                 className="h-7 text-xs"
//                 inputMode="numeric"
//                 pattern="[0-9]*"
//               />
//             </div>
//           </div>
//           <div className="flex justify-between text-xs text-muted-foreground">
//             <span>Amount (Rs)</span>
//             <span>Percentage (%)</span>
//           </div>
//         </div>

//         <div className="space-y-1 bg-background p-3 rounded-lg border border-border shadow-lg">
//           <div className="flex justify-between text-foreground">
//             <span className="font-medium text-sm">Subtotal:</span>
//             <span className="font-semibold text-sm">Rs{subtotal.toLocaleString()}</span>
//           </div>
//           <div className="flex justify-between text-foreground">
//             <span className="font-medium text-sm">Total Discount:</span>
//             <span className="font-semibold text-sm">-Rs{totalDiscount.toLocaleString()}</span>
//           </div>
//           {paymentMethod === "credit" && partialPaymentAmount && parseFloat(partialPaymentAmount) > 0 && (
//             <>
//               <div className="flex justify-between text-foreground">
//                 <span className="font-medium text-sm">Partial Payment:</span>
//                 <span className="font-semibold text-sm text-green-600">Rs{parseFloat(partialPaymentAmount).toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between text-foreground">
//                 <span className="font-medium text-sm">Remaining:</span>
//                 <span className="font-semibold text-sm text-orange-600">Rs{(total - parseFloat(partialPaymentAmount)).toLocaleString()}</span>
//               </div>
//             </>
//           )}
//           <div className="flex justify-between font-bold text-base border-t border-border pt-1 text-foreground">
//             <span>TOTAL:</span>
//             <span>Rs{total.toLocaleString()}</span>
//           </div>
//         </div>
//       </div>


//       {/* Post-sale modal
//       <PostSaleModal
//         isOpen={showPostSaleModal}
//         onClose={() => setShowPostSaleModal(false)}
//         onWhatsApp={() => handleWhatsAppInvoice(lastSaleData || undefined)}
//         onPrint={() => handlePrint(lastSaleData || undefined)}
//         onThermalPrint={handleThermalPrint}
//         saleData={lastSaleData}
//       />

//       Advanced Pricing Dialog
//       <AdvancedPricingDialog
//         isOpen={showPricingModal}
//         onClose={() => setShowPricingModal(false)}
//         onPriceUpdate={handlePriceUpdate}
//         product={pricingItem ? products.find(p => p.id === pricingItem.id) || null : null}
//         currentPrice={pricingItem?.unitPrice || 0}
//         quantity={pricingItem?.quantity || 0}
//       /> */}

//       {/* Floating Footer - Only show when cart has items */}
//       {cart.length > 0 && (
//         <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 shadow-xl z-50">
//           <div className="max-w-7xl mx-auto px-4 py-3">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-6">
//                 <div className="text-xs">
//                   <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
//                   <span className="ml-1 font-semibold text-gray-900 dark:text-gray-100">Rs{subtotal.toFixed(2)}</span>
//                 </div>
//                 <div className="text-xs">
//                   <span className="text-gray-600 dark:text-gray-400">Total Discount:</span>
//                   <span className="ml-1 font-semibold text-red-600 dark:text-red-400">-Rs{totalDiscount.toFixed(2)}</span>
//                 </div>
//                 <div className="text-sm">
//                   <span className="text-gray-600 dark:text-gray-400">TOTAL:</span>
//                   <span className="ml-1 font-bold text-gray-900 dark:text-gray-100">Rs{total.toFixed(2)}</span>
//                 </div>
//               </div>
//               <Button
//                 onClick={handleCheckout}
//                 disabled={cart.length === 0 || isProcessingSale}
//                 className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-600 dark:bg-orange-600 dark:hover:bg-orange-700 dark:disabled:bg-gray-600 dark:disabled:hover:bg-gray-600 dark:disabled:text-gray-400 px-6 py-2 h-8 text-sm"
//               >
//                 {isProcessingSale ? (
//                   <>
//                     <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
//                     Processing...
//                   </>
//                 ) : (
//                   "Checkout"
//                 )}
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export { POSModule }; 