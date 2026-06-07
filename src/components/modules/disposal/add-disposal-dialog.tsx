"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type Product } from "@/lib/firebase-services"

type ConditionType = "damaged" | "expired" | "defective" | "unsold" | "stolen"
type DisposalMethodType = "discard" | "donate" | "sell-discount" | "return-supplier" | "recycle"

const CONDITION_OPTIONS: { value: ConditionType; label: string }[] = [
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "defective", label: "Defective" },
  { value: "unsold", label: "Unsold" },
  { value: "stolen", label: "Stolen" },
]

const METHOD_OPTIONS: { value: DisposalMethodType; label: string }[] = [
  { value: "discard", label: "Discard" },
  { value: "donate", label: "Donate" },
  { value: "sell-discount", label: "Sell at Discount" },
  { value: "return-supplier", label: "Return to Supplier" },
  { value: "recycle", label: "Recycle" },
]

interface DisposalFormRecord {
  itemName: string
  itemCode: string
  category: string
  quantity: string
  originalPrice: string
  disposalValue: string
  condition: ConditionType
  disposalMethod: DisposalMethodType
  batchNumber: string
  supplierName: string
  reason: string
  notes: string
}

interface AddDisposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newDisposal: DisposalFormRecord
  setNewDisposal: (disposal: DisposalFormRecord) => void
  products: Product[]
  onProductSelect: (product: Product | null, typedValue?: string) => void
  productSearch: string
  setProductSearch: (search: string) => void
  onSubmit: () => void
}

export function AddDisposalDialog({
  open,
  onOpenChange,
  newDisposal,
  setNewDisposal,
  products,
  onProductSelect,
  productSearch,
  setProductSearch,
  onSubmit
}: AddDisposalDialogProps) {
  const filteredProducts = productSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.code.toLowerCase().includes(productSearch.toLowerCase())
      )
    : products

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Disposal Record</DialogTitle>
          <DialogDescription>
            Record items that need to be disposed of
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemName">Product</Label>
              <div className="relative">
                <Input
                  id="itemName"
                  value={newDisposal.itemName}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    onProductSelect(null, e.target.value)
                  }}
                  placeholder="Type to search or add product"
                  autoComplete="off"
                />
                {productSearch && filteredProducts.length > 0 && (
                  <div className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow-lg">
                    {filteredProducts.map((product, index) => (
                      <div
                        key={`${product.id}-${index}`}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          onProductSelect(product)
                          setProductSearch("")
                        }}
                      >
                        <span className="font-medium">{product.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{product.code}</span>
                        {product.fabricType && (
                          <span className="ml-2 text-xs text-muted-foreground">{product.fabricType}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="itemCode">Item Code</Label>
              <Input
                id="itemCode"
                value={newDisposal.itemCode}
                onChange={(e) => setNewDisposal({ ...newDisposal, itemCode: e.target.value })}
                placeholder="SKU-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newDisposal.category}
                onChange={(e) => setNewDisposal({ ...newDisposal, category: e.target.value })}
                placeholder="e.g., Shirts, Pants, Dresses, Accessories"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={newDisposal.quantity}
                onChange={(e) => setNewDisposal({ ...newDisposal, quantity: e.target.value })}
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originalPrice">Original Price (Rs)</Label>
              <Input
                id="originalPrice"
                type="number"
                value={newDisposal.originalPrice}
                onChange={(e) => setNewDisposal({ ...newDisposal, originalPrice: e.target.value })}
                placeholder="1500"
              />
            </div>
            <div>
              <Label htmlFor="disposalValue">Recovery Value (Rs)</Label>
              <Input
                id="disposalValue"
                type="number"
                value={newDisposal.disposalValue}
                onChange={(e) => setNewDisposal({ ...newDisposal, disposalValue: e.target.value })}
                placeholder="200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={newDisposal.condition}
                onValueChange={(value) => setNewDisposal({ ...newDisposal, condition: value as ConditionType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="disposalMethod">Disposal Method</Label>
              <Select
                value={newDisposal.disposalMethod}
                onValueChange={(value) => setNewDisposal({ ...newDisposal, disposalMethod: value as DisposalMethodType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                value={newDisposal.batchNumber}
                onChange={(e) => setNewDisposal({ ...newDisposal, batchNumber: e.target.value })}
                placeholder="BATCH-001"
              />
            </div>
            <div>
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Input
                id="supplierName"
                value={newDisposal.supplierName}
                onChange={(e) => setNewDisposal({ ...newDisposal, supplierName: e.target.value })}
                placeholder="Supplier name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Disposal</Label>
            <Input
              id="reason"
              value={newDisposal.reason}
              onChange={(e) => setNewDisposal({ ...newDisposal, reason: e.target.value })}
              placeholder="Reason for disposal"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={newDisposal.notes}
              onChange={(e) => setNewDisposal({ ...newDisposal, notes: e.target.value })}
              placeholder="Additional notes about the disposal"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button onClick={onSubmit} type="button">
              Add Disposal Record
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}