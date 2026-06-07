"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export interface PurchaseCartItem {
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

interface PurchaseState {
  cart: PurchaseCartItem[]
  supplierId: string
  supplierName: string
  supplierPhone: string
  supplierAddress: string
  paymentMethod: string
  partialPaymentAmount: string
  staffMember: string
  cartDiscount: number
  cartDiscountPercentage: number
  useCredit: boolean
  creditAmount: number
  searchTerm: string
}

interface PurchaseContextType {
  // State
  cart: PurchaseCartItem[]
  supplierId: string
  supplierName: string
  supplierPhone: string
  supplierAddress: string
  paymentMethod: string
  partialPaymentAmount: string
  staffMember: string
  cartDiscount: number
  cartDiscountPercentage: number
  useCredit: boolean
  creditAmount: number
  searchTerm: string
  
  // Actions
  addToCart: (item: PurchaseCartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  setSupplierId: (id: string) => void
  setSupplierName: (name: string) => void
  setSupplierPhone: (phone: string) => void
  setSupplierAddress: (address: string) => void
  setPaymentMethod: (method: string) => void
  setPartialPaymentAmount: (amount: string) => void
  setStaffMember: (member: string) => void
  setCartDiscount: (discount: number) => void
  setCartDiscountPercentage: (percentage: number) => void
  setUseCredit: (use: boolean) => void
  setCreditAmount: (amount: number) => void
  setSearchTerm: (term: string) => void
  clearCart: () => void
  resetForm: () => void
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined)

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PurchaseState>({
    cart: [],
    supplierId: "",
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    paymentMethod: "credit",
    partialPaymentAmount: "",
    staffMember: "",
    cartDiscount: 0,
    cartDiscountPercentage: 0,
    useCredit: false,
    creditAmount: 0,
    searchTerm: ""
  })

  // Cart actions
  const addToCart = useCallback((item: PurchaseCartItem) => {
    setState(prev => {
      const existingItem = prev.cart.find(cartItem => cartItem.id === item.id)
      if (existingItem) {
        return {
          ...prev,
          cart: prev.cart.map(cartItem =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem
          )
        }
      } else {
        return {
          ...prev,
          cart: [...prev.cart, item]
        }
      }
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.filter(item => item.id !== id)
    }))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    
    setState(prev => ({
      ...prev,
      cart: prev.cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    }))
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setState(prev => ({
      ...prev,
      cart: []
    }))
  }, [])

  // Form setters
  const setSupplierId = useCallback((id: string) => {
    setState(prev => ({ ...prev, supplierId: id }))
  }, [])

  const setSupplierName = useCallback((name: string) => {
    setState(prev => ({ ...prev, supplierName: name }))
  }, [])

  const setSupplierPhone = useCallback((phone: string) => {
    setState(prev => ({ ...prev, supplierPhone: phone }))
  }, [])

  const setSupplierAddress = useCallback((address: string) => {
    setState(prev => ({ ...prev, supplierAddress: address }))
  }, [])

  const setPaymentMethod = useCallback((method: string) => {
    setState(prev => ({ ...prev, paymentMethod: method }))
  }, [])

  const setPartialPaymentAmount = useCallback((amount: string) => {
    setState(prev => ({ ...prev, partialPaymentAmount: amount }))
  }, [])

  const setStaffMember = useCallback((member: string) => {
    setState(prev => ({ ...prev, staffMember: member }))
  }, [])

  const setCartDiscount = useCallback((discount: number) => {
    setState(prev => ({ ...prev, cartDiscount: discount }))
  }, [])

  const setCartDiscountPercentage = useCallback((percentage: number) => {
    setState(prev => ({ ...prev, cartDiscountPercentage: percentage }))
  }, [])

  const setUseCredit = useCallback((use: boolean) => {
    setState(prev => ({ ...prev, useCredit: use }))
  }, [])

  const setCreditAmount = useCallback((amount: number) => {
    setState(prev => ({ ...prev, creditAmount: amount }))
  }, [])

  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }))
  }, [])

  const resetForm = useCallback(() => {
    setState({
      cart: [],
      supplierId: "",
      supplierName: "",
      supplierPhone: "",
      supplierAddress: "",
      paymentMethod: "credit",
      partialPaymentAmount: "",
      staffMember: "",
      cartDiscount: 0,
      cartDiscountPercentage: 0,
      useCredit: false,
      creditAmount: 0,
      searchTerm: ""
    })
  }, [])

  const value: PurchaseContextType = {
    // State
    cart: state.cart,
    supplierId: state.supplierId,
    supplierName: state.supplierName,
    supplierPhone: state.supplierPhone,
    supplierAddress: state.supplierAddress,
    paymentMethod: state.paymentMethod,
    partialPaymentAmount: state.partialPaymentAmount,
    staffMember: state.staffMember,
    cartDiscount: state.cartDiscount,
    cartDiscountPercentage: state.cartDiscountPercentage,
    useCredit: state.useCredit,
    creditAmount: state.creditAmount,
    searchTerm: state.searchTerm,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    setSupplierId,
    setSupplierName,
    setSupplierPhone,
    setSupplierAddress,
    setPaymentMethod,
    setPartialPaymentAmount,
    setStaffMember,
    setCartDiscount,
    setCartDiscountPercentage,
    setUseCredit,
    setCreditAmount,
    setSearchTerm,
    clearCart,
    resetForm
  }

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>
}

export function usePurchase() {
  const context = useContext(PurchaseContext)
  if (context === undefined) {
    throw new Error("usePurchase must be used within a PurchaseProvider")
  }
  return context
}
