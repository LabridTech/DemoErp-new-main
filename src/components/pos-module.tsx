"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Search, Plus, Minus, Trash2, User, CreditCard, Smartphone, Banknote,
  ShoppingCart, AlertTriangle, Gift, DollarSign, Package, ChevronRight,
  Percent, MapPin, Users, Zap, Loader2, X, CheckCircle2
} from "lucide-react"
import {
  ProductService, SalesService, EmployeeService, EmployeePerformanceService,
  BargainingService, CustomerCreditService, type Product, type Employee,
  type SaleItem, type SaleRecord, CustomerService, type Customer
} from "@/lib/firebase-services"
import { InvoiceCounterService } from "@/lib/invoice-counter-service"
import { useToast } from "@/hooks/use-toast"
import html2canvas from 'html2canvas'
import { usePOS } from "@/contexts/POSContext"
import { PostSaleModal } from "./modules/pos/post-sale-modal"
import { AdvancedPricingDialog } from "./modules/pos/advanced-pricing-dialog"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date: Date | string) => {
  if (typeof date === 'string') return date
  if (date instanceof Date && !isNaN(date.getTime())) {
    const d = date.getDate().toString().padStart(2, '0')
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${d}/${m}/${date.getFullYear()}`
  }
  const n = new Date()
  return `${n.getDate().toString().padStart(2, '0')}/${(n.getMonth() + 1).toString().padStart(2, '0')}/${n.getFullYear()}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  id: string; name: string; code: string; unitPrice: number; quantity: number
  discount: number; finalPrice: number; availableStock: number
  tradeDiscountQuantity?: number; tradeDiscountFreeItems?: number
  fabricType?: string; size?: string; individualPrices?: number[]; totalAmount?: number
}

interface InvoiceData {
  invoiceNumber: string; date: string; time: string; customerName: string
  customerPhone: string; customerAddress?: string; staffName: string
  paymentMethod?: string; staffMember?: string
  items: Array<{ name: string; code: string; quantity: number; unitPrice: number; tradeDiscountFreeItems?: number; fabricType?: string; size?: string }>
  subtotal: number; totalDiscount: number; total: number
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({ product, quantity, onAdd, onRemove }: {
  product: Product; quantity: number; onAdd: () => void; onRemove: () => void
}) {
  const outOfStock = product.stock <= 0
  const inCart = quantity > 0
  const stockLow = product.stock > 0 && product.stock <= 5

  return (
    <div className={`
      relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden bg-card
      ${outOfStock ? 'opacity-50 border-border/40'
        : inCart ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800'
          : 'border-border/60 hover:border-border hover:shadow-sm'}
    `}>
      <div className={`h-1 w-full flex-shrink-0 ${inCart ? 'bg-blue-500' : 'bg-border/30'} transition-colors`} />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
            ${inCart ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-muted/60'}`}>
            <Package className={`w-4 h-4 ${inCart ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
          </div>
          {inCart && (
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{product.name}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 font-medium">{product.code}</span>
            {product.size && <span className="text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">{product.size}</span>}
          </div>
        </div>
        <div className="flex items-end justify-between gap-1">
          <div>
            <p className="text-sm font-bold text-foreground">Rs {product.currentPrice}</p>
            <p className={`text-[10px] mt-0.5 ${outOfStock ? 'text-red-500 font-medium' : stockLow ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
              {outOfStock ? 'Out of stock' : `${product.stock} yds`}
            </p>
          </div>
          {outOfStock ? (
            <div className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-1">N/A</div>
          ) : (
            /* ── Stepper: min 44×44px touch targets ── */
            <div className="flex items-center gap-1">
              <button onClick={onRemove} disabled={quantity === 0}
                className={`w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all touch-manipulation
                  ${quantity === 0
                    ? 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 active:bg-red-100'}`}>
                <Minus className="w-3 h-3" />
              </button>
              <span className={`w-7 text-center text-sm font-bold tabular-nums
                ${inCart ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                {quantity}
              </span>
              <button onClick={onAdd} disabled={quantity >= product.stock}
                className={`w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all touch-manipulation
                  ${quantity >= product.stock
                    ? 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
                    : 'bg-blue-600 text-white active:bg-blue-700'}`}>
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CartRow ──────────────────────────────────────────────────────────────────

function CartRow({ item, product, onQtyChange, onQtyInput, onPriceChange, onFreeChange, onRemove, onAdvancedPrice }: {
  item: CartItem; product?: Product
  onQtyChange: (delta: number) => void; onQtyInput: (val: string) => void
  onPriceChange: (price: number) => void; onFreeChange: (free: number) => void
  onRemove: () => void; onAdvancedPrice: () => void
}) {
  const stockIssue = product ? item.quantity > product.stock : false
  const priceModified = item.unitPrice !== (product?.currentPrice || 0)
  const lineTotal = item.totalAmount || item.unitPrice * item.quantity

  return (
    <div className={`px-3 py-3 border-b border-border/40 last:border-0 transition-colors
      ${stockIssue ? 'bg-red-50/60 dark:bg-red-950/20' : 'hover:bg-muted/20'}`}>

      {/* Name row */}
      <div className="flex items-start gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-foreground">{item.name}</span>
            <span className="text-[10px] text-muted-foreground bg-muted rounded px-1">{item.code}</span>
            {stockIssue && <span className="text-[10px] font-medium text-red-700 bg-red-100 dark:bg-red-950/50 rounded px-1 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />Stock</span>}
            {(item.tradeDiscountFreeItems || 0) > 0 && <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded px-1 flex items-center gap-0.5"><Gift className="w-2.5 h-2.5" />{item.tradeDiscountFreeItems} free</span>}
            {priceModified && <span className="text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 rounded px-1">modified</span>}
          </div>
          {product?.size && <p className="text-[10px] text-muted-foreground mt-0.5">Size {product.size}{stockIssue ? ` · avail: ${product.stock}` : ''}</p>}
        </div>
        {/* Remove — big touch target */}
        <button onClick={onRemove}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0 touch-manipulation">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Controls: stack on mobile, 3-col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 ml-9">

        {/* Qty */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">Qty (yds)</p>
          <div className="flex items-center gap-1">
            <button onClick={() => onQtyChange(-1)}
              className="w-8 h-8 rounded-md border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0 touch-manipulation">
              <Minus className="w-3 h-3" />
            </button>
            <Input type="number" step="0.01" min="0"
              value={item.quantity || ""}
              onChange={e => onQtyInput(e.target.value)}
              onFocus={e => { if (e.target.value === "0") e.target.value = "" }}
              onBlur={e => { if (!e.target.value) e.target.value = "0" }}
              className="h-8 w-14 text-center text-sm px-1 border-border/60 rounded-md [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            <button onClick={() => onQtyChange(1)} disabled={product ? item.quantity >= product.stock : false}
              className="w-8 h-8 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white disabled:opacity-30 transition-colors flex-shrink-0 touch-manipulation">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Price */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">Price (Rs)</p>
          <div className="flex items-center gap-1">
            <Input type="number" step="0.01" min="0"
              value={item.unitPrice || ""}
              onChange={e => onPriceChange(parseFloat(e.target.value) || 0)}
              onFocus={e => { if (e.target.value === "0") e.target.value = "" }}
              onBlur={e => { if (!e.target.value) e.target.value = "0" }}
              className="h-8 flex-1 text-sm px-1.5 border-border/60 rounded-md [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            <button onClick={onAdvancedPrice}
              className="w-8 h-8 rounded-md border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-600 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-600 hover:text-white transition-colors flex-shrink-0 touch-manipulation" title="Advanced pricing">
              <DollarSign className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Free */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">Free (TD)</p>
          <div className="flex items-center gap-1">
            <button onClick={() => onFreeChange(Math.max(0, (item.tradeDiscountFreeItems || 0) - 1))}
              className="w-8 h-8 rounded-md border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0 touch-manipulation">
              <Minus className="w-3 h-3" />
            </button>
            <Input type="number" step="0.01" min="0"
              value={item.tradeDiscountFreeItems || ""} placeholder="0"
              onChange={e => onFreeChange(parseFloat(e.target.value) || 0)}
              onFocus={e => { if (e.target.value === "0") e.target.value = "" }}
              onBlur={e => { if (!e.target.value) e.target.value = "0" }}
              className="h-8 w-12 text-center text-sm px-1 border-border/60 rounded-md [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            <button onClick={() => onFreeChange((item.tradeDiscountFreeItems || 0) + 1)}
              className="w-8 h-8 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white transition-colors flex-shrink-0 touch-manipulation">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Line total */}
      <div className="flex items-center justify-between mt-2.5 ml-9 pt-2 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground">Rs {(item.unitPrice || 0).toFixed(2)} × {item.quantity}</span>
        <span className="text-sm font-bold text-foreground">Rs {lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function POSModule() {
  const {
    cart, customerName, customerPhone, customerAddress, paymentMethod,
    partialPaymentAmount, staffMember, manualStaffName, deliveryType,
    deliveryAddress, deliveryDate, cartDiscount, cartDiscountPercentage, searchTerm,
    addToCart: contextAddToCart, setCustomerName, setCustomerPhone, setCustomerAddress,
    setPaymentMethod, setPartialPaymentAmount, setStaffMember, setManualStaffName,
    setDeliveryType, setDeliveryAddress, setDeliveryDate, setCartDiscount,
    setCartDiscountPercentage, setSearchTerm, clearCart, resetForm
  } = usePOS()

  const [products, setProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessingSale, setIsProcessingSale] = useState(false)
  const { toast } = useToast()
  const [showPostSaleModal, setShowPostSaleModal] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([])
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [pricingItem, setPricingItem] = useState<CartItem | null>(null)
  const [lastSaleData, setLastSaleData] = useState<InvoiceData | null>(null)
  // Mobile tab: "products" | "order"
  const [mobileTab, setMobileTab] = useState<"products" | "order">("products")
  const [cashGiven, setCashGiven] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      try {
        const [p, e] = await Promise.all([ProductService.getAllProducts(), EmployeeService.getAllEmployees()])
        setProducts(p.filter((x, i, a) => i === a.findIndex(y => y.id === x.id)))
        setEmployees(e); setLoading(false)
      } catch { toast({ title: "Error", description: "Failed to load data.", variant: "destructive" }); setLoading(false) }
    }
    load()
  }, [toast])

  useEffect(() => { CustomerService.getAllCustomers().then(setCustomers).catch(console.error) }, [])

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products
    const s = searchTerm.toLowerCase()
    return products.filter(p => (p.name || '').toLowerCase().includes(s) || (p.code || '').toLowerCase().includes(s))
  }, [products, searchTerm])

  // ── Cart helpers ─────────────────────────────────────────────────────────

  const syncCart = (u: CartItem[]) => { clearCart(); u.forEach(i => contextAddToCart(i)) }

  const recalc = (u: CartItem[]) => {
    if (cartDiscountPercentage > 0) {
      const ns = u.reduce((s, i) => s + (i.individualPrices?.length ? i.individualPrices.reduce((a, b) => a + b, 0) : (i.totalAmount || i.unitPrice * i.quantity)), 0)
      setCartDiscount(Math.round((ns * cartDiscountPercentage) / 100))
    }
  }

  const addToCart = (product: Product) => {
    const ex = cart.find(i => i.id === product.id)
    let u: CartItem[]
    if (ex) {
      if (ex.quantity + 1 > product.stock) { toast({ title: "Insufficient Stock", description: `Only ${product.stock} available`, variant: "destructive" }); return }
      u = cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1, finalPrice: (i.quantity + 1) * i.unitPrice, individualPrices: [...(i.individualPrices || []), product.currentPrice], totalAmount: (i.totalAmount || 0) + product.currentPrice } : i)
    } else {
      if (product.stock <= 0) { toast({ title: "Out of Stock", variant: "destructive" }); return }
      u = [...cart, { id: product.id, name: product.name, code: product.code, unitPrice: product.currentPrice, quantity: 1, discount: 0, finalPrice: product.currentPrice, availableStock: product.stock, fabricType: product.fabricType, size: product.size, individualPrices: [product.currentPrice], totalAmount: product.currentPrice }]
    }
    syncCart(u); recalc(u)
    // Auto-switch to order tab on mobile when first item added
    if (cart.length === 0) setMobileTab("order")
  }

  const removeFromCart = (id: string) => {
    const u = cart.filter(i => i.id !== id); syncCart(u)
    if (!u.length) { setCartDiscount(0); setCartDiscountPercentage(0) } else recalc(u)
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return }
    const product = products.find(p => p.id === id); if (!product) return
    if (qty > product.stock) { toast({ title: "Insufficient Stock", description: `Only ${product.stock} available`, variant: "destructive" }); return }
    const u = cart.map(i => i.id === id ? { ...i, quantity: qty, finalPrice: qty * i.unitPrice, totalAmount: qty * i.unitPrice, individualPrices: [] } : i)
    syncCart(u); recalc(u)
  }

  const handleQtyInput = (id: string, value: string) => {
    const qty = value === "" ? 0 : parseFloat(value); if (isNaN(qty) || qty < 0) return
    const product = products.find(p => p.id === id); if (!product) return
    if (qty > product.stock) { toast({ title: "Insufficient Stock", description: `Only ${product.stock} available`, variant: "destructive" }); return }
    const u = cart.map(i => i.id === id ? { ...i, quantity: qty, finalPrice: qty * i.unitPrice, totalAmount: qty * i.unitPrice, individualPrices: [] } : i)
    syncCart(u); recalc(u)
  }

  const updatePrice = (id: string, price: number) => {
    const u = cart.map(i => i.id === id ? { ...i, unitPrice: price, finalPrice: price * i.quantity, totalAmount: price * i.quantity, individualPrices: Number.isInteger(i.quantity) ? Array(i.quantity).fill(price) : [] } : i)
    syncCart(u); recalc(u)
  }

  const updateFree = (id: string, free: number) => syncCart(cart.map(i => i.id === id ? { ...i, tradeDiscountFreeItems: free } : i))

  const subtotal = cart.reduce((s, i) => s + (i.individualPrices?.length ? i.individualPrices.reduce((a, b) => a + b, 0) : (i.totalAmount || i.unitPrice * i.quantity)), 0)
  const totalDiscount = cartDiscount
  const total = Math.max(0, subtotal - totalDiscount)
  const hasStockIssues = cart.some(i => { const p = products.find(p => p.id === i.id); return p ? i.quantity > p.stock : false })

  const updateDiscountByAmount = (v: number) => { setCartDiscount(v); setCartDiscountPercentage(subtotal > 0 ? Math.round((v / subtotal) * 100) : 0) }
  const updateDiscountByPct = (v: number) => { setCartDiscountPercentage(v); setCartDiscount(Math.round((v / 100) * subtotal)) }

  const handlePriceUpdate = (productId: string, newPrice: number, individualPrices: number[]) => {
    const t = individualPrices.reduce((s, p) => s + p, 0)
    const u = cart.map(i => i.id === productId ? { ...i, unitPrice: newPrice, finalPrice: t, individualPrices, totalAmount: t } : i)
    syncCart(u); recalc(u)
  }

  const normalizePhone = (p: string) => { const t = p.trim(); if (t.startsWith("0") && t.length === 11) return "+92" + t.slice(1); if (t.startsWith("+92")) return t; return t }
  const matchPhone = (v: string, cp: string) => { const n = (s: string) => s.replace(/[+\-\s]/g, ''); const nv = n(v), nc = n(cp); if (nv.startsWith('92') && nc.startsWith('0')) { const a = nv.slice(2), b = nc.slice(1); return b === a || b.includes(a) || a.includes(b) } if (nv.startsWith('0') && nc.startsWith('92')) { const a = nv.slice(1), b = nc.slice(2); return b === a || b.includes(a) || a.includes(b) } return nc.includes(nv) || nv.includes(nc) }

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setCustomerName(v)
    if (v.length > 0) setCustomerSuggestions(customers.filter(c => (c.name || '').toLowerCase().includes(v.toLowerCase()) || (c.address || '').toLowerCase().includes(v.toLowerCase()) || (v.match(/^[0-9+\-\s]/) && matchPhone(v, c.phone))).slice(0, 8))
    else setCustomerSuggestions([])
  }
  const selectCustomer = (c: Customer) => { setCustomerName(c.name || ''); setCustomerPhone(c.phone || ''); setCustomerAddress(c.address || ''); setCustomerSuggestions([]) }
  const staffNameForInvoice = manualStaffName.trim() || (employees.find(e => e.id === staffMember)?.name || "")

  // ── Checkout ─────────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (!cart.length) { toast({ title: "Empty cart", variant: "destructive" }); return }
    if (!paymentMethod) { toast({ title: "Select payment method", variant: "destructive" }); return }
    if (paymentMethod === "credit" && (!customerName.trim() || !customerPhone.trim())) { toast({ title: "Customer info required for credit sales", variant: "destructive" }); return }
    setIsProcessingSale(true)
    const stockIssues = cart.filter(i => { const p = products.find(p => p.id === i.id); return p ? i.quantity > p.stock : false })
    if (stockIssues.length) { toast({ title: "Stock issues", description: stockIssues.map(i => `${i.name}: need ${i.quantity}`).join(', '), variant: "destructive" }); setIsProcessingSale(false); return }
    try {
      if (customerName || customerPhone) {
        const all = await CustomerService.getAllCustomers()
        const ex = all.find(c => (customerPhone && c.phone === customerPhone) || (customerName && (c.name || '').toLowerCase() === customerName.toLowerCase()))
        if (!ex) await CustomerService.createCustomer({ name: customerName || "Walk-in Customer", email: "", phone: customerPhone || "", address: customerAddress || "", customerType: "walk-in", totalPurchases: 0, totalSpent: 0, creditLimit: 0, currentCredit: 0, notes: "", status: "active" })
        else if (ex.name !== customerName || ex.phone !== customerPhone) await CustomerService.updateCustomer(ex.id, { name: customerName, phone: customerPhone, address: customerAddress })
      }
      const dist: { [id: string]: number } = {}
      if (totalDiscount > 0 && subtotal > 0) { let sum = 0; cart.forEach((item, idx) => { if (idx === cart.length - 1) dist[item.id] = totalDiscount - sum; else { const s = Math.round((item.unitPrice * item.quantity / subtotal) * totalDiscount); dist[item.id] = s; sum += s } }) }
      else cart.forEach(i => { dist[i.id] = 0 })
      const saleItems: SaleItem[] = cart.map(item => { const p = products.find(p => p.id === item.id); return { id: item.id, name: item.name, code: item.code, quantity: item.quantity, originalPrice: item.unitPrice, finalPrice: item.unitPrice - (dist[item.id] ?? 0) / (item.quantity || 1), discount: dist[item.id] ?? 0, purchaseCost: p?.purchaseCost || 0 } })
      const tradeDiscountItems = cart.filter(i => i.tradeDiscountFreeItems && i.tradeDiscountFreeItems > 0).map(i => ({ productId: i.id, productName: i.name, quantity: i.tradeDiscountFreeItems || 0, price: 0, purchaseCost: products.find(p => p.id === i.id)?.purchaseCost || 0 }))
      const invoiceNumber = await InvoiceCounterService.getNextInvoiceNumber()
      const now = new Date()
      const saleData: Omit<SaleRecord, "id"> = { invoiceNumber, date: now.toISOString().split('T')[0], time: now.toLocaleTimeString(), customerName: customerName || "Walk-in Customer", customerPhone: customerPhone || "", customerAddress: customerAddress || "", customerType: (customerName ? "regular" : "walk-in") as "walk-in" | "regular" | "vip", items: saleItems, subtotal, discount: totalDiscount, tax: 0, total, paymentMethod: paymentMethod as "cash" | "card" | "mobile" | "credit", paymentStatus: (paymentMethod === "credit" ? "pending" : "paid") as "paid" | "partial" | "pending", deliveryStatus: deliveryType === 'delivery' ? 'pending' : 'pickup', deliveryType, staffMember, staffName: staffNameForInvoice, notes: "", returnStatus: "none" as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      if (deliveryType === 'delivery') { saleData.deliveryAddress = deliveryAddress || ""; if (deliveryDate?.trim()) saleData.deliveryDate = deliveryDate }
      if (tradeDiscountItems.length) (saleData as Record<string, unknown>).tradeDiscountItems = tradeDiscountItems
      const created = await SalesService.createSale(saleData)
      const saleId = typeof created === 'string' ? created : (created as { id: string }).id
      if (paymentMethod === "credit") { const pa = parseFloat(partialPaymentAmount) || 0; if (pa > 0) { const all = await CustomerService.getAllCustomers(); const ex = all.find(c => (customerPhone && c.phone === customerPhone) || (customerName && (c.name || '').toLowerCase() === customerName.toLowerCase())); await CustomerCreditService.createCredit({ customerId: ex?.id || "", customerName: customerName || "Walk-in Customer", amount: pa, type: "credit", reason: `Partial payment for ${invoiceNumber}`, description: `Partial Rs${pa}`, saleId, invoiceNumber, createdBy: staffMember || "pos_system", status: "active", createdAt: new Date().toISOString() }) } }
      else { const all = await CustomerService.getAllCustomers(); const ex = all.find(c => (customerPhone && c.phone === customerPhone) || (customerName && (c.name || '').toLowerCase() === customerName.toLowerCase())); await CustomerCreditService.createCredit({ customerId: ex?.id || "", customerName: customerName || "Walk-in Customer", amount: total, type: "credit", reason: `${paymentMethod.toUpperCase()} payment for ${invoiceNumber}`, description: `Full payment Rs${total}`, saleId, invoiceNumber, createdBy: staffMember || "pos_system", status: "active", createdAt: new Date().toISOString() }) }
      for (const item of cart) { const p = products.find(p => p.id === item.id); if (p) await ProductService.updateProduct(item.id, { stock: p.stock - item.quantity - (item.tradeDiscountFreeItems || 0) }) }
      if (totalDiscount > 0) { for (const item of cart) { const d = dist[item.id] ?? 0; if (d > 0) await BargainingService.createBargainRecord({ date: formatDate(new Date()), time: now.toLocaleTimeString(), productName: item.name, productCode: item.code, originalPrice: item.unitPrice, finalPrice: item.unitPrice - (d / (item.quantity || 1)), discountAmount: d, discountPercentage: item.unitPrice > 0 ? Math.round((d / (item.unitPrice * item.quantity)) * 100) : 0, customerName: customerName || "Walk-in Customer", customerPhone: customerPhone || "", staffMember, reason: "POS Sale Discount", invoiceNumber, category: products.find(p => p.id === item.id)?.fabricType || "", profitMargin: 0, status: "approved" }) } }
      setProducts(products.map(p => { const ci = cart.find(i => i.id === p.id); return ci ? { ...p, stock: p.stock - ci.quantity - (ci.tradeDiscountFreeItems || 0) } : p }))
      if (staffMember) { const emp = employees.find(e => e.id === staffMember); if (emp) await EmployeePerformanceService.incrementSalesMetrics(staffMember, emp.name, total).catch(console.error) }
      toast({ title: "Sale completed!", description: `Invoice #${invoiceNumber} · Rs ${total.toLocaleString()}` })
      setLastSaleData({ invoiceNumber, date: saleData.date, time: saleData.time, customerName: saleData.customerName, customerPhone: saleData.customerPhone, customerAddress: saleData.customerAddress, staffName: staffNameForInvoice, items: cart.map(i => ({ name: i.name, code: i.code, quantity: i.quantity, unitPrice: i.unitPrice, tradeDiscountFreeItems: i.tradeDiscountFreeItems || 0, fabricType: i.fabricType || 'N/A', size: i.size || 'N/A' })), subtotal, totalDiscount, total })
      setShowPostSaleModal(true); resetForm(); setMobileTab("products"); setCashGiven("")
    } catch { toast({ title: "Error", description: "Failed to complete sale.", variant: "destructive" }) }
    finally { setIsProcessingSale(false) }
  }

  // ── Invoice generators ────────────────────────────────────────────────────

  const generateInvoiceHTML = (data: InvoiceData) => {
    const itemsWithTD = data.items.filter(i => i.tradeDiscountFreeItems && i.tradeDiscountFreeItems > 0)
    return `<html><head><title>Invoice</title><style>@media print{@page{margin:0.25in;size:A4;-webkit-print-color-adjust:exact;color-adjust:exact;}body{margin:0!important;-webkit-print-color-adjust:exact!important;color-adjust:exact!important;}}body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:white;color:#000;}.invoice-container{width:100%;padding:0;box-sizing:border-box;}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;border-bottom:2px solid #1976d2;padding-bottom:6px;}.brand-name{font-size:20px;font-weight:900;color:#1976d2;letter-spacing:1px;}.company-details{font-size:10px;color:#666;line-height:1.5;}.invoice-details{background:#f8f9fa;padding:8px;border-radius:4px;font-size:9px;border:1px solid #e0e0e0;}.invoice-details p{margin:2px 0;}table{width:100%;border-collapse:collapse;margin:8px 0;}th,td{border:1px solid #ddd;padding:4px 3px;text-align:left;font-size:9px;}th{background:#1976d2;color:#fff;font-weight:600;}.text-right{text-align:right;}.totals table{border:none;width:220px;margin-left:auto;}.totals td{border:none;padding:2px 0;font-size:9px;}.total-row{font-weight:bold;font-size:10px;border-top:2px solid #333;padding-top:2px;}.discount-row{color:#d32f2f;font-weight:bold;}.footer{text-align:center;margin-top:20px;padding:8px;border-top:1px solid #eee;font-size:10px;color:#555;}</style></head><body><div class="invoice-container"><div class="header"><div><div class="brand-name">Bin Sultan Fabrics</div><div class="company-details">Premium Fabrics, Textiles & Garment Materials<br/>Contact: 0321-7590700 | Email: bin.sultanfabrics@gmail.com<br/>99/B, Liberty Plaza, Gulberg</div></div><div class="invoice-details"><p><strong>Invoice #:</strong> ${data.invoiceNumber}</p><p><strong>Date:</strong> ${data.date} | <strong>Time:</strong> ${data.time}</p><p><strong>Customer:</strong> ${data.customerName}</p>${data.customerPhone ? `<p><strong>Phone:</strong> ${data.customerPhone}</p>` : ''}${data.customerAddress ? `<p><strong>Address:</strong> ${data.customerAddress}</p>` : ''}${data.staffName ? `<p><strong>Staff:</strong> ${data.staffName}</p>` : ''}</div></div><table><thead><tr><th>Product</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${data.items.map(item => `<tr><td>${item.name}</td><td class="text-right">${item.quantity}${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? ` + ${item.tradeDiscountFreeItems}(TD)` : ''}</td><td class="text-right">${item.unitPrice === 0 ? 'FREE' : `Rs${item.unitPrice.toLocaleString()}`}</td><td class="text-right">${item.unitPrice === 0 ? 'Rs0' : `Rs${(item.unitPrice * item.quantity).toLocaleString()}`}</td></tr>`).join('')}</tbody></table>${itemsWithTD.length ? `<div style="margin:8px 0;font-size:10px;color:#d32f2f;"><strong>Trade Discount:</strong> ${itemsWithTD.map(i => `${i.name}: ${i.tradeDiscountFreeItems} free yard(s)`).join(', ')}</div>` : ''}<div style="display:flex;justify-content:flex-end;margin-top:12px;"><div class="totals"><table><tr><td>Subtotal:</td><td class="text-right">Rs${data.subtotal.toLocaleString()}</td></tr><tr class="discount-row"><td>Discount (${data.totalDiscount > 0 && data.subtotal > 0 ? Math.round((data.totalDiscount / data.subtotal) * 100) : 0}%):</td><td class="text-right">-Rs${data.totalDiscount.toLocaleString()}</td></tr><tr class="total-row"><td><strong>TOTAL:</strong></td><td class="text-right"><strong>Rs${data.total.toLocaleString()}</strong></td></tr></table></div></div><div class="footer"><p style="color:#1976d2;font-weight:600;font-size:12px;">Thank you for shopping with us!</p><p>For queries: 0321-7590700</p></div></div></body></html>`
  }

  const generateThermalInvoiceHTML = (data: InvoiceData) => `<html><head><title>Thermal</title><style>@media print{@page{margin:0;size:80mm auto;}}body{font-family:'Courier New',monospace;font-size:11px;line-height:1.3;margin:0;padding:3mm;max-width:80mm;}.center{text-align:center;}.right{text-align:right;}.divider{border-top:1px dashed #000;margin:4px 0;}.bold{font-weight:bold;}</style></head><body><div class="center bold" style="font-size:15px;">BIN SULTAN FABRICS</div><div class="center" style="font-size:10px;">99/B Liberty Plaza, Gulberg<br/>0321-7590700</div><div class="divider"></div><p style="margin:1px 0;font-size:10px;"><b>Invoice #:</b> ${data.invoiceNumber}</p><p style="margin:1px 0;font-size:10px;"><b>Date:</b> ${data.date} ${data.time}</p><p style="margin:1px 0;font-size:10px;"><b>Customer:</b> ${data.customerName}</p>${data.customerPhone ? `<p style="margin:1px 0;font-size:10px;"><b>Phone:</b> ${data.customerPhone}</p>` : ''}<div class="divider"></div><table style="width:100%;border-collapse:collapse;font-size:10px;"><tr><td><b>Item</b></td><td style="text-align:right;"><b>Qty</b></td><td style="text-align:right;"><b>Price</b></td><td style="text-align:right;"><b>Total</b></td></tr>${data.items.map(i => `<tr><td>${i.name}</td><td style="text-align:right;">${i.quantity}${i.tradeDiscountFreeItems && i.tradeDiscountFreeItems > 0 ? `+${i.tradeDiscountFreeItems}` : ''}</td><td style="text-align:right;">${i.unitPrice === 0 ? 'FREE' : i.unitPrice.toLocaleString()}</td><td style="text-align:right;">${i.unitPrice === 0 ? '0' : (i.unitPrice * i.quantity).toLocaleString()}</td></tr>`).join('')}</table><div class="divider"></div><p class="right" style="margin:1px 0;">Subtotal: Rs${data.subtotal.toLocaleString()}</p>${data.totalDiscount > 0 ? `<p class="right" style="margin:1px 0;">Discount: -Rs${data.totalDiscount.toLocaleString()}</p>` : ''}<p class="right bold" style="margin:2px 0;border-top:1px solid #000;padding-top:2px;">TOTAL: Rs${data.total.toLocaleString()}</p><div class="divider"></div><div class="center" style="margin-top:6px;font-size:10px;">Thank you! Visit again<br/>0321-7590700</div></body></html>`

  const handlePrint = async (override?: InvoiceData) => { const data = override || lastSaleData; if (!data) return; const w = window.open('', '_blank', 'width=800,height=600'); if (!w) return; w.document.write(generateInvoiceHTML(data)); w.document.close(); w.onload = () => setTimeout(() => { w.print() }, 800) }
  const handleThermalPrint = async () => { if (!lastSaleData) return; const w = window.open('', '_blank', 'width=300,height=600'); if (!w) return; w.document.write(generateThermalInvoiceHTML(lastSaleData)); w.document.close(); w.onload = () => setTimeout(() => { w.print(); w.close() }, 500) }
  const handleWhatsAppInvoice = async (override?: InvoiceData) => {
    const data = override || lastSaleData; if (!data) return
    if (!data.customerPhone) { toast({ title: "Phone required for WhatsApp", variant: "destructive" }); return }
    try {
      const w = window.open('', '_blank', 'width=800,height=600'); if (!w) return
      w.document.write(generateInvoiceHTML(data)); w.document.close()
      w.onload = () => setTimeout(async () => {
        try {
          const canvas = await html2canvas(w.document.body, { useCORS: true, allowTaint: true, background: '#ffffff', width: 800, height: w.document.body.scrollHeight })
          const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png', 0.9))
          const phone = normalizePhone(data.customerPhone as string)
          const msg = `Hi ${data.customerName}! Your invoice #${data.invoiceNumber} is attached.`
          if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'invoice.png', { type: 'image/png' })] })) { await navigator.share({ title: `Invoice #${data.invoiceNumber}`, text: msg, files: [new File([blob], 'invoice.png', { type: 'image/png' })] }); toast({ title: "Invoice shared!" }); w.close(); return }
          const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Invoice_${data.invoiceNumber}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
          setTimeout(() => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank'), 500)
          toast({ title: "Invoice downloaded — attach to WhatsApp!" }); w.close()
        } catch { w.close(); toast({ title: "Error capturing invoice", variant: "destructive" }) }
      }, 2000)
    } catch { toast({ title: "Error", variant: "destructive" }) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center"><Loader2 className="h-6 w-6 text-white animate-spin" /></div>
        <div className="text-center"><p className="font-semibold text-foreground">Loading POS</p><p className="text-sm text-muted-foreground">Preparing your workspace…</p></div>
      </div>
    </div>
  )

  // ── Panels ────────────────────────────────────────────────────────────────

  const ProductsPanel = (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      {/* Search bar */}
      <div className="flex-shrink-0 bg-background border-b border-border/50 px-3 sm:px-5 py-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-muted/40 border-border/50 rounded-xl text-sm focus:bg-background" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <span className="hidden sm:block text-xs bg-muted rounded-full px-2.5 py-1 font-medium text-muted-foreground flex-shrink-0">{filteredProducts.length}</span>
        {hasStockIssues && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
      </div>
      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Package className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3">
            {filteredProducts.map((product, idx) => {
              const qty = cart.find(i => i.id === product.id)?.quantity || 0
              return <ProductCard key={`${product.id}-${idx}`} product={product} quantity={qty} onAdd={() => addToCart(product)} onRemove={() => updateQuantity(product.id, qty - 1)} />
            })}
          </div>
        )}
      </div>
    </div>
  )

  const OrderPanel = (
    <div className="w-full lg:w-[400px] flex-shrink-0 border-l border-border/50 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-white" /></div>
          <div><p className="text-sm font-bold text-foreground">Order</p><p className="text-[11px] text-muted-foreground">Bin Sultan Fabrics</p></div>
        </div>
        {cart.length > 0 && <span className="text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full px-2.5 py-1">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-5">
            <ShoppingCart className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/60">Add products from the grid</p>
          </div>
        ) : (
          cart.map((item, idx) => {
            const product = products.find(p => p.id === item.id)
            return <CartRow key={`${item.id || 0}-${idx}`} item={item} product={product}
              onQtyChange={d => updateQuantity(item.id, item.quantity + d)}
              onQtyInput={v => handleQtyInput(item.id, v)}
              onPriceChange={p => updatePrice(item.id, p)}
              onFreeChange={f => updateFree(item.id, f)}
              onRemove={() => removeFromCart(item.id)}
              onAdvancedPrice={() => { setPricingItem(item); setShowPricingModal(true) }} />
          })
        )}

        {/* Divider */}
        <div className="mx-4 my-1 border-t border-dashed border-border/40" />

        {/* Discount */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2"><Percent className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Discount</span></div>
          <div className="flex gap-2">
            <div className="flex-1"><p className="text-[10px] text-muted-foreground mb-1">Amount (Rs)</p>
              <Input type="number" min={0} max={subtotal} placeholder="0" value={cartDiscount || ""}
                onChange={e => { let v = Number(e.target.value); if (isNaN(v) || v < 0) v = 0; if (v > subtotal) v = subtotal; updateDiscountByAmount(v) }}
                className="h-9 text-sm rounded-xl [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" /></div>
            <div className="flex-1"><p className="text-[10px] text-muted-foreground mb-1">Percentage (%)</p>
              <Input type="number" min={0} max={100} placeholder="0" value={cartDiscountPercentage || ""}
                onChange={e => { let v = Number(e.target.value); if (isNaN(v) || v < 0) v = 0; if (v > 100) v = 100; updateDiscountByPct(v) }}
                className="h-9 text-sm rounded-xl [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" /></div>
          </div>
        </div>

        {/* Customer */}
        <div className="px-4 py-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 mb-2.5"><User className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</span>{paymentMethod === "credit" && <span className="text-[10px] text-red-500 font-medium">· required</span>}</div>
          <div className="space-y-2 relative">
            <div className="relative">
              <Input placeholder="Name, phone, or address…" value={customerName} onChange={handleCustomerNameChange} autoComplete="off"
                className={`h-9 text-sm rounded-xl pr-8 ${paymentMethod === "credit" && !customerName.trim() ? "border-red-400" : ""}`} />
              {customerName && <button onClick={() => { setCustomerName(''); setCustomerSuggestions([]) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-3 h-3" /></button>}
            </div>
            {customerSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-30 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                <div className="px-3 py-1.5 bg-muted/40 border-b border-border/50 text-[10px] text-muted-foreground font-medium">{customerSuggestions.length} match{customerSuggestions.length !== 1 ? 'es' : ''}</div>
                {customerSuggestions.map(c => (
                  <div key={c.id} onClick={() => selectCustomer(c)} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0">
                    <div className="min-w-0"><p className="text-sm font-semibold truncate">{c.name}</p><p className="text-[11px] text-muted-foreground">{c.phone}{c.address ? ` · ${c.address}` : ''}</p></div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-2 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Phone" value={customerPhone}
                onChange={e => { setCustomerPhone(normalizePhone(e.target.value)); if (e.target.value.length > 3) { const m = customers.filter(c => matchPhone(e.target.value, c.phone)); if (m.length <= 5) setCustomerSuggestions(m) } else setCustomerSuggestions([]) }}
                autoComplete="off" className={`h-9 text-sm rounded-xl ${paymentMethod === "credit" && !customerPhone.trim() ? "border-red-400" : ""}`} />
              <Input placeholder="Address" value={customerAddress}
                onChange={e => { setCustomerAddress(e.target.value); if (e.target.value.length > 2) { const m = customers.filter(c => c.address?.toLowerCase().includes(e.target.value.toLowerCase())); if (m.length <= 5) setCustomerSuggestions(m) } else setCustomerSuggestions([]) }}
                autoComplete="off" className="h-9 text-sm rounded-xl" />
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="px-4 py-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 mb-2.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Delivery</span></div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={deliveryType} onValueChange={v => setDeliveryType(v as "pickup" | "delivery")}>
              <SelectTrigger className="h-9 text-sm rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="pickup">Pickup</SelectItem><SelectItem value="delivery">Delivery</SelectItem></SelectContent>
            </Select>
            {deliveryType === 'delivery' && <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="h-9 text-sm rounded-xl" />}
          </div>
          {deliveryType === 'delivery' && <Input placeholder="Delivery address" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="h-9 text-sm rounded-xl mt-2" />}
        </div>

        {/* Staff */}
        <div className="px-4 py-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 mb-2.5"><Users className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Staff</span></div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={staffMember} onValueChange={setStaffMember}>
              <SelectTrigger className="h-9 text-sm rounded-xl"><SelectValue placeholder="Select staff" /></SelectTrigger>
              <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Or type name" value={manualStaffName} onChange={e => setManualStaffName(e.target.value)} className="h-9 text-sm rounded-xl" />
          </div>
        </div>

        {/* Payment */}
        <div className="px-4 py-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 mb-2.5"><CreditCard className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Payment</span></div>
          <div className="grid grid-cols-4 gap-1.5">
            {[{ value: "cash", icon: Banknote, label: "Cash" }, { value: "card", icon: CreditCard, label: "Card" }, { value: "mobile", icon: Smartphone, label: "Mobile" }, { value: "credit", icon: User, label: "Credit" }].map(({ value, icon: Icon, label }) => (
              <button key={value} onClick={() => setPaymentMethod(value)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-medium transition-all touch-manipulation
                  ${paymentMethod === value ? 'bg-blue-600 text-white border-blue-600' : 'border-border/60 text-muted-foreground hover:bg-muted/50'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
          {paymentMethod === "credit" && (
            <div className="mt-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 space-y-2">
              <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400">Partial payment (optional)</p>
              <Input type="number" placeholder="Enter amount" min="0" value={partialPaymentAmount} onChange={e => setPartialPaymentAmount(e.target.value)} className="h-9 text-sm rounded-xl bg-background" />
              {partialPaymentAmount && parseFloat(partialPaymentAmount) > 0 && <p className="text-[11px] text-amber-700 dark:text-amber-400">Remaining: <strong>Rs {(total - parseFloat(partialPaymentAmount)).toLocaleString()}</strong></p>}
            </div>
          )}
          {paymentMethod === "cash" && (
            <div className="mt-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 space-y-2">
              <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">Cash Given</p>
              <Input type="number" placeholder="Enter amount" min="0" value={cashGiven} onChange={e => setCashGiven(e.target.value)} className="h-9 text-sm rounded-xl bg-background" />
              {cashGiven && parseFloat(cashGiven) >= total && <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Cash Receive (Change): <strong>Rs {(parseFloat(cashGiven) - total).toLocaleString()}</strong></p>}
              {cashGiven && parseFloat(cashGiven) < total && <p className="text-[11px] text-red-500">Insufficient amount</p>}
            </div>
          )}
        </div>
        <div className="h-4" />
      </div>

      {/* Totals + CTA */}
      <div className="flex-shrink-0 border-t border-border/50 bg-background">
        <div className="px-4 pt-3 pb-2 space-y-1.5">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">Rs {subtotal.toLocaleString()}</span></div>
          {totalDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1">Discount{cartDiscountPercentage > 0 && <span className="text-[10px] bg-red-50 dark:bg-red-950/40 text-red-600 rounded px-1">{cartDiscountPercentage}%</span>}</span><span className="font-medium text-red-600">−Rs {totalDiscount.toLocaleString()}</span></div>}
          {paymentMethod === "credit" && partialPaymentAmount && parseFloat(partialPaymentAmount) > 0 && <>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Paid now</span><span className="font-medium text-emerald-600">Rs {parseFloat(partialPaymentAmount).toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Remaining</span><span className="font-medium text-amber-600">Rs {(total - parseFloat(partialPaymentAmount)).toLocaleString()}</span></div>
          </>}
          <div className="flex justify-between items-baseline pt-1 border-t border-border/40">
            <span className="text-sm font-bold">Total</span>
            <span className="text-2xl font-bold tabular-nums">Rs {total.toLocaleString()}</span>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Button onClick={handleCheckout} disabled={cart.length === 0 || !paymentMethod || hasStockIssues || isProcessingSale}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:bg-muted disabled:text-muted-foreground transition-all touch-manipulation">
            {isProcessingSale ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</> : <><Zap className="w-4 h-4 mr-2" />Complete Sale</>}
          </Button>
          {!paymentMethod && cart.length > 0 && <p className="text-center text-[11px] text-muted-foreground mt-1.5">Select a payment method to continue</p>}
        </div>
      </div>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── DESKTOP (lg+): side-by-side ── */}
      <div className="hidden lg:flex h-screen overflow-hidden bg-muted/20 dark:bg-background">
        {ProductsPanel}
        {OrderPanel}
      </div>

      {/* ── MOBILE (< lg): tab switcher + single panel ── */}
      <div className="flex lg:hidden flex-col h-screen overflow-hidden bg-background">
        {/* Tab bar */}
        <div className="flex-shrink-0 bg-background border-b border-border/50 flex">
          <button onClick={() => setMobileTab("products")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors touch-manipulation
              ${mobileTab === "products" ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'}`}>
            <Package className="w-4 h-4" />Products
          </button>
          <button onClick={() => setMobileTab("order")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors touch-manipulation
              ${mobileTab === "order" ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground'}`}>
            <ShoppingCart className="w-4 h-4" />
            Order
            {cart.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{cart.length}</span>
            )}
          </button>
        </div>
        {/* Active panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {mobileTab === "products" ? ProductsPanel : OrderPanel}
        </div>
      </div>

      <PostSaleModal isOpen={showPostSaleModal} onClose={() => setShowPostSaleModal(false)} onWhatsApp={() => handleWhatsAppInvoice(lastSaleData || undefined)} onPrint={() => handlePrint(lastSaleData || undefined)} onThermalPrint={handleThermalPrint} saleData={lastSaleData} />
      <AdvancedPricingDialog isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} onPriceUpdate={handlePriceUpdate} product={pricingItem ? products.find(p => p.id === pricingItem.id) || null : null} currentPrice={pricingItem?.unitPrice || 0} quantity={pricingItem?.quantity || 0} />
    </>
  )
}

export { POSModule }