# 🎯 Context-Based State Management Implementation

## Overview

This implementation provides **session-level state persistence** for both **POS** and **Purchasing** modules using React Context API. The state persists during page navigation but resets on browser refresh, providing a clean and efficient state management solution.

## 🏗️ Architecture

### **Context Providers**
- **`POSContext`**: Manages POS module state (cart, customer info, payment details)
- **`PurchaseContext`**: Manages Purchasing module state (cart, supplier info, payment details)

### **Key Features**
- ✅ **Session Persistence**: State survives page changes
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Performance**: Optimized with useCallback hooks
- ✅ **Error Handling**: Proper context validation
- ✅ **Clean API**: Simple and intuitive hooks

--- 


## 📁 File Structure

```
src/
├── contexts/
│   ├── POSContext.tsx          # POS state management
│   ├── PurchaseContext.tsx     # Purchase state management
│   └── auth-context.tsx        # Existing auth context
├── app/
│   ├── layout.tsx              # Providers setup
│   ├── pos-example/            # POS usage example
│   └── purchase-example/       # Purchase usage example
```

---

## 🔧 Implementation Details

### **1. POS Context (`src/contexts/POSContext.tsx`)**

#### **State Management:**
```typescript
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
```

#### **Key Functions:**
- `addToCart(item)` - Add/update items in cart
- `removeFromCart(id)` - Remove item from cart
- `updateQuantity(id, quantity)` - Update item quantity
- `setCustomerName(name)` - Set customer name
- `setPaymentMethod(method)` - Set payment method
- `clearCart()` - Clear all cart items
- `resetForm()` - Reset entire form

### **2. Purchase Context (`src/contexts/PurchaseContext.tsx`)**

#### **State Management:**
```typescript
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
```

#### **Key Functions:**
- `addToCart(item)` - Add/update items in cart
- `removeFromCart(id)` - Remove item from cart
- `updateQuantity(id, quantity)` - Update item quantity
- `setSupplierName(name)` - Set supplier name
- `setPaymentMethod(method)` - Set payment method
- `setUseCredit(use)` - Toggle credit usage
- `clearCart()` - Clear all cart items
- `resetForm()` - Reset entire form

---

## 🚀 Usage Examples

### **POS Module Usage:**

```tsx
import { usePOS } from "@/contexts/POSContext"

export default function POSPage() {
  const { 
    cart, 
    addToCart, 
    customerName, 
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
    clearCart,
    resetForm
  } = usePOS()

  const handleAddProduct = () => {
    addToCart({
      id: "1",
      name: "Cotton Fabric",
      price: 500,
      quantity: 1
    })
  }

  return (
    <div>
      <h1>POS System</h1>
      
      {/* Customer Info */}
      <input
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder="Customer Name"
      />
      
      {/* Add Product */}
      <button onClick={handleAddProduct}>
        Add Cotton Fabric
      </button>
      
      {/* Cart Display */}
      <div>
        {cart.map(item => (
          <div key={item.id}>
            {item.name} - Rs {item.price} x {item.quantity}
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <button onClick={clearCart}>Clear Cart</button>
      <button onClick={resetForm}>Reset Form</button>
    </div>
  )
}
```

### **Purchase Module Usage:**

```tsx
import { usePurchase } from "@/contexts/PurchaseContext"

export default function PurchasePage() {
  const { 
    cart, 
    addToCart, 
    supplierName, 
    setSupplierName,
    paymentMethod,
    setPaymentMethod,
    useCredit,
    setUseCredit,
    clearCart,
    resetForm
  } = usePurchase()

  const handleAddProduct = () => {
    addToCart({
      id: "10",
      name: "Cotton Roll",
      price: 1000,
      quantity: 5
    })
  }

  return (
    <div>
      <h1>Purchase System</h1>
      
      {/* Supplier Info */}
      <input
        value={supplierName}
        onChange={(e) => setSupplierName(e.target.value)}
        placeholder="Supplier Name"
      />
      
      {/* Add Product */}
      <button onClick={handleAddProduct}>
        Add Cotton Roll
      </button>
      
      {/* Credit Option */}
      <label>
        <input
          type="checkbox"
          checked={useCredit}
          onChange={(e) => setUseCredit(e.target.checked)}
        />
        Use Credit
      </label>
      
      {/* Cart Display */}
      <div>
        {cart.map(item => (
          <div key={item.id}>
            {item.name} - Rs {item.price} x {item.quantity}
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <button onClick={clearCart}>Clear Cart</button>
      <button onClick={resetForm}>Reset Form</button>
    </div>
  )
}
```

---

## 🔄 App Integration

### **Layout Setup (`src/app/layout.tsx`):**

```tsx
import { POSProvider } from "@/contexts/POSContext"
import { PurchaseProvider } from "@/contexts/PurchaseContext"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <POSProvider>
              <PurchaseProvider>
                {children}
                <Toaster />
              </PurchaseProvider>
            </POSProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## ✨ Key Benefits

### **1. Session Persistence**
- State survives page navigation
- No data loss when switching between modules
- Automatic cleanup on browser refresh

### **2. Type Safety**
- Full TypeScript support
- Compile-time error checking
- IntelliSense support

### **3. Performance**
- Optimized with useCallback hooks
- Minimal re-renders
- Efficient state updates

### **4. Developer Experience**
- Simple and intuitive API
- Clear error messages
- Easy to test and debug

### **5. Scalability**
- Easy to extend with new features
- Modular design
- Reusable patterns

---

## 🧪 Testing the Implementation

### **1. Access Example Pages:**
- **POS Example**: `/pos-example`
- **Purchase Example**: `/purchase-example`

### **2. Test Scenarios:**
1. **Add items to cart**
2. **Navigate between pages** (state should persist)
3. **Refresh browser** (state should reset)
4. **Update quantities and details**
5. **Clear cart and reset form**

### **3. Debug Information:**
Both example pages include debug sections showing current state in JSON format.

---

## 🔧 Migration from localStorage

### **Before (localStorage approach):**
```typescript
// Manual state management
const [cart, setCart] = useState([])
const [customerName, setCustomerName] = useState("")

// Manual persistence
useEffect(() => {
  localStorage.setItem('pos_state', JSON.stringify({ cart, customerName }))
}, [cart, customerName])
```

### **After (Context approach):**
```typescript
// Context-based state management
const { cart, customerName, setCustomerName } = usePOS()

// Automatic persistence (no manual code needed)
```

---

## 🎯 Next Steps

### **1. Replace Existing Modules:**
- Update `pos-module.tsx` to use `usePOS()`
- Update `purchasing-module.tsx` to use `usePurchase()`
- Remove localStorage-based state services

### **2. Add Advanced Features:**
- State validation
- Undo/redo functionality
- State history tracking
- Export/import state

### **3. Testing:**
- Unit tests for contexts
- Integration tests for modules
- E2E tests for user flows

---

## 📝 Notes

- **Session-only persistence**: State resets on browser refresh
- **Memory-based**: No localStorage or database persistence
- **Provider hierarchy**: POSProvider wraps PurchaseProvider
- **Error boundaries**: Proper error handling for context usage
- **Performance**: Optimized with React best practices

This implementation provides a robust, type-safe, and performant solution for managing complex state across your POS and Purchasing modules! 🚀
