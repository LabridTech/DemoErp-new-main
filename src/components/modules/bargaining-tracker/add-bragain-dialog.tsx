"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Bargain {
  productName: string
  productCode: string
  originalPrice: string
  finalPrice: string
  customerName: string
  customerPhone: string
  reason: string
  category: string
  invoiceNumber: string
}

interface AddBargainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newBargain: Bargain
  setNewBargain: (bargain: Bargain) => void
  onSubmit: () => void
}

export function AddBargainDialog({
  open,
  onOpenChange,
  newBargain,
  setNewBargain,
  onSubmit
}: AddBargainDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Bargain Record</DialogTitle>
          <DialogDescription>Record a new bargaining transaction</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={newBargain.productName}
                onChange={(e) => setNewBargain({ ...newBargain, productName: e.target.value })}
                placeholder="Product name"
              />
            </div>
            <div>
              <Label htmlFor="productCode">Product Code</Label>
              <Input
                id="productCode"
                value={newBargain.productCode}
                onChange={(e) => setNewBargain({ ...newBargain, productCode: e.target.value })}
                placeholder="SKU-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originalPrice">Original Price (Rs)</Label>
              <Input
                id="originalPrice"
                type="number"
                value={newBargain.originalPrice}
                onChange={(e) => setNewBargain({ ...newBargain, originalPrice: e.target.value })}
                placeholder="2500"
              />
            </div>
            <div>
              <Label htmlFor="finalPrice">Final Price (Rs)</Label>
              <Input
                id="finalPrice"
                type="number"
                value={newBargain.finalPrice}
                onChange={(e) => setNewBargain({ ...newBargain, finalPrice: e.target.value })}
                placeholder="2200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={newBargain.customerName}
                onChange={(e) => setNewBargain({ ...newBargain, customerName: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={newBargain.customerPhone}
                onChange={(e) => setNewBargain({ ...newBargain, customerPhone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newBargain.category}
                onValueChange={(value) => setNewBargain({ ...newBargain, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shirts">Shirts</SelectItem>
                  <SelectItem value="pants">Pants</SelectItem>
                  <SelectItem value="dresses">Dresses</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="footwear">Footwear</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={newBargain.invoiceNumber}
                onChange={(e) => setNewBargain({ ...newBargain, invoiceNumber: e.target.value })}
                placeholder="INV-001"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Bargain</Label>
            <Textarea
              id="reason"
              value={newBargain.reason}
              onChange={(e) => setNewBargain({ ...newBargain, reason: e.target.value })}
              placeholder="Reason for giving discount"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>Add Bargain Record</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}