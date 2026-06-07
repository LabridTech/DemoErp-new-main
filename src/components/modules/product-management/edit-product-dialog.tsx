import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Product {
  id: string
  name: string      
  code: string
  fabricType: string
  fabricColor: string
  fabricPattern: string
  fabricWeight: string
  fabricWidth: string
  fabricLength: string
  size: string
  purchaseCost: number
  minSalePrice: number
  maxSalePrice: number
  currentPrice: number
  stock: number
  minStock: number
  maxStock: number
  supplier: string
  batchInfo: string
  status: "active" | "inactive" | "discontinued"
  createdDate: string
}

interface EditProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editProduct: Product | null
  setEditProduct: (product: Product | null) => void
  onEditProduct: () => void
}

export function EditProductDialog({
  isOpen,
  onOpenChange,
  editProduct,
  setEditProduct,
  onEditProduct,
}: EditProductDialogProps) {
  if (!editProduct) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product details and save changes</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={editProduct.name}
                onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-code">Product Code</Label>
              <Input
                id="edit-code"
                value={editProduct.code}
                onChange={(e) => setEditProduct({ ...editProduct, code: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-fabricType">Fabric Type</Label>
              <Input
                id="edit-fabricType"
                value={editProduct.fabricType}
                onChange={(e) => setEditProduct({ ...editProduct, fabricType: e.target.value })}
                placeholder="e.g., Cotton, Silk, Polyester"
              />
            </div>
            <div>
              <Label htmlFor="edit-size">Size</Label>
              <Input
                id="edit-size"
                value={editProduct.size}
                onChange={(e) => setEditProduct({ ...editProduct, size: e.target.value })}
                placeholder="e.g., 1L, 500ml, 250ml"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-purchaseCost">Purchase Cost (Rs)</Label>
              <Input
                id="edit-purchaseCost"
                type="number"
                value={editProduct.purchaseCost}
                onChange={(e) => setEditProduct({ ...editProduct, purchaseCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-stock">Stock Quantity</Label>
              <Input
                id="edit-stock"
                type="number"
                value={editProduct.stock}
                onChange={(e) => setEditProduct({ ...editProduct, stock: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-minStock">Min Stock Level</Label>
              <Input
                id="edit-minStock"
                type="number"
                value={editProduct.minStock}
                onChange={(e) => setEditProduct({ ...editProduct, minStock: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-maxStock">Max Stock Level</Label>
              <Input
                id="edit-maxStock"
                type="number"
                value={editProduct.maxStock}
                onChange={(e) => setEditProduct({ ...editProduct, maxStock: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-minSalePrice">Min Sale Price (Rs)</Label>
              <Input
                id="edit-minSalePrice"
                type="number"
                value={editProduct.minSalePrice}
                onChange={(e) => setEditProduct({ ...editProduct, minSalePrice: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-maxSalePrice">Max Sale Price (Rs)</Label>
              <Input
                id="edit-maxSalePrice"
                type="number"
                value={editProduct.maxSalePrice}
                onChange={(e) => setEditProduct({ ...editProduct, maxSalePrice: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-currentPrice">Current Price (Rs)</Label>
              <Input
                id="edit-currentPrice"
                type="number"
                value={editProduct.currentPrice}
                onChange={(e) => setEditProduct({ ...editProduct, currentPrice: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-supplier">Supplier</Label>
              <Input
                id="edit-supplier"
                value={editProduct.supplier}
                onChange={(e) => setEditProduct({ ...editProduct, supplier: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-batchInfo">Batch Info</Label>
              <Input
                id="edit-batchInfo"
                value={editProduct.batchInfo}
                onChange={(e) => setEditProduct({ ...editProduct, batchInfo: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onEditProduct}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}