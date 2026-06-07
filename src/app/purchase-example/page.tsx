"use client"

import { usePurchase } from "@/contexts/PurchaseContext"

export default function PurchaseExamplePage() {
  const { 
    cart, 
    addToCart, 
    removeFromCart,
    updateQuantity,
    supplierName, 
    setSupplierName,
    supplierPhone,
    setSupplierPhone,
    supplierAddress,
    setSupplierAddress,
    paymentMethod,
    setPaymentMethod,
    useCredit,
    setUseCredit,
    creditAmount,
    setCreditAmount,
    clearCart,
    resetForm
  } = usePurchase()

  const handleAddCottonRoll = () => {
    addToCart({
      id: "10",
      name: "Cotton Roll",
      code: "CR001",
      unitPrice: 1000,
      quantity: 5,
      discount: 0,
      finalPrice: 5000,
      availableStock: 20,
      totalAmount: 5000
    })
  }

  const handleAddWoolFabric = () => {
    addToCart({
      id: "11", 
      name: "Wool Fabric",
      code: "WF001",
      unitPrice: 800,
      quantity: 3,
      discount: 0,
      finalPrice: 2400,
      availableStock: 15,
      totalAmount: 2400
    })
  }

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Purchase Example Page</h1>
      
      {/* Supplier Information */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Supplier Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Supplier Name</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Enter supplier name"
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="text"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              placeholder="Enter phone number"
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Address</label>
            <input
              type="text"
              value={supplierAddress}
              onChange={(e) => setSupplierAddress(e.target.value)}
              placeholder="Enter supplier address"
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Product Actions */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Add Products</h2>
        <div className="flex gap-4">
          <button
            onClick={handleAddCottonRoll}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Cotton Roll (Rs 1000)
          </button>
          <button
            onClick={handleAddWoolFabric}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Add Wool Fabric (Rs 800)
          </button>
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Purchase Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500">Cart is empty</p>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-500 ml-2">Rs {item.unitPrice}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-sm ml-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total: Rs {getTotal()}</span>
                <button
                  onClick={clearCart}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        <div className="space-y-4">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select Payment Method</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank Transfer</option>
            <option value="credit">Credit</option>
          </select>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCredit"
              checked={useCredit}
              onChange={(e) => setUseCredit(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="useCredit" className="text-sm font-medium">
              Use Credit
            </label>
          </div>
          
          {useCredit && (
            <div>
              <label className="block text-sm font-medium mb-2">Credit Amount</label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(Number(e.target.value))}
                placeholder="Enter credit amount"
                className="w-full p-2 border rounded-md"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={resetForm}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Reset Form
        </button>
        <button
          onClick={() => alert(`Processing purchase from ${supplierName || 'Supplier'} - Total: Rs ${getTotal()}`)}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          disabled={cart.length === 0}
        >
          Process Purchase
        </button>
      </div>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Debug Info (Current State)</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify({ 
            cart, 
            supplierName, 
            supplierPhone, 
            supplierAddress, 
            paymentMethod, 
            useCredit, 
            creditAmount 
          }, null, 2)}
        </pre>
      </div>
    </div>
  )
}
