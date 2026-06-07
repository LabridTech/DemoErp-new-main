import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User } from "lucide-react"
import { Customer } from "@/lib/firebase-services"

interface CustomerEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onCustomerChange: (customer: Customer) => void
  onSave: (customer: Customer) => void
  isNew?: boolean
}

export function CustomerEditDialog({ 
  open, 
  onOpenChange, 
  customer, 
  onCustomerChange, 
  onSave, 
  isNew = false 
}: CustomerEditDialogProps) {
  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isNew ? "Add New Customer" : "Edit Customer"}
          </DialogTitle>
          <DialogDescription>
            {isNew ? "Enter new customer information" : "Modify customer details"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="customer-name" className="text-sm font-medium">Name</label>
              <Input
                id="customer-name"
                value={customer.name}
                onChange={(e) => onCustomerChange({ ...customer, name: e.target.value })}
                placeholder={isNew ? "Enter customer name" : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-phone" className="text-sm font-medium">Phone</label>
              <Input
                id="customer-phone"
                value={customer.phone}
                onChange={(e) => onCustomerChange({ ...customer, phone: e.target.value })}
                placeholder={isNew ? "Enter customer phone" : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-email" className="text-sm font-medium">Email</label>
              <Input
                id="customer-email"
                value={customer.email}
                onChange={(e) => onCustomerChange({ ...customer, email: e.target.value })}
                placeholder={isNew ? "Enter customer email (optional)" : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-address" className="text-sm font-medium">Address</label>
              <Input
                id="customer-address"
                value={customer.address}
                onChange={(e) => onCustomerChange({ ...customer, address: e.target.value })}
                placeholder={isNew ? "Enter customer address (optional)" : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-type" className="text-sm font-medium">Type</label>
              <select
                id="customer-type"
                value={customer.customerType}
                onChange={(e) => onCustomerChange({ 
                  ...customer, 
                  customerType: e.target.value as "walk-in" | "regular" | "vip",
                  updatedAt: new Date().toISOString() 
                })}
                className="w-full p-2 border rounded-md"
              >
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="walk-in">Walk-in</option>
              </select>
            </div>
          </div>
          <Button onClick={() => onSave(customer)}>
            {isNew ? "Add Customer" : "Save Customer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}