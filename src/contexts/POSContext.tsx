"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export interface CartItem {
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

interface POSState {
  cart: CartItem[]
  customerName: string
  customerPhone: string
  customerAddress: string
  paymentMethod: string
  partialPaymentAmount: string
  staffMember: string
  manualStaffName: string
  deliveryType: 'pickup' | 'delivery'
  deliveryAddress: string
  deliveryDate: string
  cartDiscount: number
  cartDiscountPercentage: number
  searchTerm: string
}

interface POSContextType {
  // State
  cart: CartItem[]
  customerName: string
  customerPhone: string
  customerAddress: string
  paymentMethod: string
  partialPaymentAmount: string
  staffMember: string
  manualStaffName: string
  deliveryType: 'pickup' | 'delivery'
  deliveryAddress: string
  deliveryDate: string
  cartDiscount: number
  cartDiscountPercentage: number
  searchTerm: string
  
  // Actions
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  setCustomerName: (name: string) => void
  setCustomerPhone: (phone: string) => void
  setCustomerAddress: (address: string) => void
  setPaymentMethod: (method: string) => void
  setPartialPaymentAmount: (amount: string) => void
  setStaffMember: (member: string) => void
  setManualStaffName: (name: string) => void
  setDeliveryType: (type: 'pickup' | 'delivery') => void
  setDeliveryAddress: (address: string) => void
  setDeliveryDate: (date: string) => void
  setCartDiscount: (discount: number) => void
  setCartDiscountPercentage: (percentage: number) => void
  setSearchTerm: (term: string) => void
  clearCart: () => void
  resetForm: () => void
}

const POSContext = createContext<POSContextType | undefined>(undefined)

export function POSProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<POSState>({
    cart: [],
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    paymentMethod: "credit",
    partialPaymentAmount: "",
    staffMember: "",
    manualStaffName: "",
    deliveryType: 'pickup',
    deliveryAddress: "",
    deliveryDate: "",
    cartDiscount: 0,
    cartDiscountPercentage: 0,
    searchTerm: ""
  })

  // Cart actions
  const addToCart = useCallback((item: CartItem) => {
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
  const setCustomerName = useCallback((name: string) => {
    setState(prev => ({ ...prev, customerName: name }))
  }, [])

  const setCustomerPhone = useCallback((phone: string) => {
    setState(prev => ({ ...prev, customerPhone: phone }))
  }, [])

  const setCustomerAddress = useCallback((address: string) => {
    setState(prev => ({ ...prev, customerAddress: address }))
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

  const setManualStaffName = useCallback((name: string) => {
    setState(prev => ({ ...prev, manualStaffName: name }))
  }, [])

  const setDeliveryType = useCallback((type: 'pickup' | 'delivery') => {
    setState(prev => ({ ...prev, deliveryType: type }))
  }, [])

  const setDeliveryAddress = useCallback((address: string) => {
    setState(prev => ({ ...prev, deliveryAddress: address }))
  }, [])

  const setDeliveryDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, deliveryDate: date }))
  }, [])

  const setCartDiscount = useCallback((discount: number) => {
    setState(prev => ({ ...prev, cartDiscount: discount }))
  }, [])

  const setCartDiscountPercentage = useCallback((percentage: number) => {
    setState(prev => ({ ...prev, cartDiscountPercentage: percentage }))
  }, [])

  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }))
  }, [])

  const resetForm = useCallback(() => {
    setState({
      cart: [],
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      paymentMethod: "credit",
      partialPaymentAmount: "",
      staffMember: "",
      manualStaffName: "",
      deliveryType: 'pickup',
      deliveryAddress: "",
      deliveryDate: "",
      cartDiscount: 0,
      cartDiscountPercentage: 0,
      searchTerm: ""
    })
  }, [])

  const value: POSContextType = {
    // State
    cart: state.cart,
    customerName: state.customerName,
    customerPhone: state.customerPhone,
    customerAddress: state.customerAddress,
    paymentMethod: state.paymentMethod,
    partialPaymentAmount: state.partialPaymentAmount,
    staffMember: state.staffMember,
    manualStaffName: state.manualStaffName,
    deliveryType: state.deliveryType,
    deliveryAddress: state.deliveryAddress,
    deliveryDate: state.deliveryDate,
    cartDiscount: state.cartDiscount,
    cartDiscountPercentage: state.cartDiscountPercentage,
    searchTerm: state.searchTerm,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    setCustomerName,
    setCustomerPhone,
    setCustomerAddress,
    setPaymentMethod,
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
  }

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>
}

export function usePOS() {
  const context = useContext(POSContext)
  if (context === undefined) {
    throw new Error("usePOS must be used within a POSProvider")
  }
  return context
}
