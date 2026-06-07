import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NewProduct {
  name: string
  code: string
  fabricType: string
  fabricColor: string
  fabricPattern: string
  fabricWeight: string
  fabricWidth: string
  fabricLength: string
  size: string
  purchaseCost: string
  minSalePrice: string
  maxSalePrice: string
  currentPrice: string
  stock: string
  minStock: string
  maxStock: string
  supplier: string
  batchInfo: string
}

interface AddProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newProduct: NewProduct
  setNewProduct: (product: NewProduct) => void
  onAddProduct: () => void
}

export function AddProductDialog({
  isOpen,
  onOpenChange,
  newProduct,
  setNewProduct,
  onAddProduct,
}: AddProductDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Enter product details including pricing and inventory information</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="e.g., Cotton Fabric"
              />
            </div>
            <div>
              <Label htmlFor="code">Product Code</Label>
              <Input
                id="code"
                value={newProduct.code}
                onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                placeholder="e.g., K001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fabricType">Fabric Type</Label>
              <Input
                id="fabricType"
                value={newProduct.fabricType}
                onChange={(e) => setNewProduct({ ...newProduct, fabricType: e.target.value })}
                placeholder="e.g., Cotton, Silk, Polyester"
              />
            </div>
            <div>
              <Label htmlFor="fabricColor">Fabric Color</Label>
              <Input
                id="fabricColor"
                value={newProduct.fabricColor}
                onChange={(e) => setNewProduct({ ...newProduct, fabricColor: e.target.value })}
                placeholder="e.g., Red, Blue, White"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fabricPattern">Fabric Pattern</Label>
              <Input
                id="fabricPattern"
                value={newProduct.fabricPattern}
                onChange={(e) => setNewProduct({ ...newProduct, fabricPattern: e.target.value })}
                placeholder="e.g., Solid, Striped, Floral"
              />
            </div>
            <div>
              <Label htmlFor="fabricWeight">Fabric Weight (GSM)</Label>
              <Input
                id="fabricWeight"
                value={newProduct.fabricWeight}
                onChange={(e) => setNewProduct({ ...newProduct, fabricWeight: e.target.value })}
                placeholder="e.g., 150, 200, 250"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fabricWidth">Fabric Width (inches)</Label>
              <Input
                id="fabricWidth"
                value={newProduct.fabricWidth}
                onChange={(e) => setNewProduct({ ...newProduct, fabricWidth: e.target.value })}
                placeholder="e.g., 44, 54, 60"
              />
            </div>
            <div>
              <Label htmlFor="fabricLength">Fabric Length (yards)</Label>
              <Input
                id="fabricLength"
                value={newProduct.fabricLength}
                onChange={(e) => setNewProduct({ ...newProduct, fabricLength: e.target.value })}
                placeholder="e.g., 10, 20, 50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="size">Size/Unit</Label>
              <Input
                id="size"
                value={newProduct.size}
                onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                placeholder="e.g., Per Yard, Per Meter"
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={newProduct.supplier}
                onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                placeholder="Fabric Supplier Co."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchaseCost">Purchase Cost (Rs)</Label>
              <Input
                id="purchaseCost"
                type="number"
                value={newProduct.purchaseCost}
                onChange={(e) => setNewProduct({ ...newProduct, purchaseCost: e.target.value })}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                placeholder="50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minStock">Min Stock Level</Label>
              <Input
                id="minStock"
                type="number"
                value={newProduct.minStock}
                onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="maxStock">Max Stock Level</Label>
              <Input
                id="maxStock"
                type="number"
                value={newProduct.maxStock}
                onChange={(e) => setNewProduct({ ...newProduct, maxStock: e.target.value })}
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="minSalePrice">Min Sale Price (Rs)</Label>
              <Input
                id="minSalePrice"
                type="number"
                value={newProduct.minSalePrice}
                onChange={(e) => setNewProduct({ ...newProduct, minSalePrice: e.target.value })}
                placeholder="150"
              />
            </div>
            <div>
              <Label htmlFor="maxSalePrice">Max Sale Price (Rs)</Label>
              <Input
                id="maxSalePrice"
                type="number"
                value={newProduct.maxSalePrice}
                onChange={(e) => setNewProduct({ ...newProduct, maxSalePrice: e.target.value })}
                placeholder="250"
              />
            </div>
            <div>
              <Label htmlFor="currentPrice">Current Price (Rs)</Label>
              <Input
                id="currentPrice"
                type="number"
                value={newProduct.currentPrice}
                onChange={(e) => setNewProduct({ ...newProduct, currentPrice: e.target.value })}
                placeholder="200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={newProduct.supplier}
                onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                placeholder="Fabric Supplier Co."
              />
            </div>
            <div>
              <Label htmlFor="batchInfo">Batch Info</Label>
              <Input
                id="batchInfo"
                value={newProduct.batchInfo}
                onChange={(e) => setNewProduct({ ...newProduct, batchInfo: e.target.value })}
                placeholder="Batch-2024-001"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onAddProduct}>Add Product</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}