import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Employee  } from "@/lib/firebase-services"

interface AddEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (employee: Omit<Employee, "id">) => void
}

export function AddEmployeeDialog({ open, onOpenChange, onSubmit }: AddEmployeeDialogProps) {
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    joinDate: "",
    salary: "",
    commission: "",
    address: "",
    emergencyContact: "",
    bankAccount: "",
    cnic: "",
    role: "cashier" as "admin" | "cashier",
  })

  const handleSubmit = () => {
    const employee: Omit<Employee, "id"> = {
      name: newEmployee.name,
      email: newEmployee.email,
      phone: newEmployee.phone,
      position: newEmployee.position,
      department: newEmployee.department,
      joinDate: newEmployee.joinDate || new Date().toISOString().split("T")[0],
      salary: Number(newEmployee.salary),
      commission: Number(newEmployee.commission),
      status: "active",
      address: newEmployee.address,
      emergencyContact: newEmployee.emergencyContact,
      bankAccount: newEmployee.bankAccount,
      cnic: newEmployee.cnic,
      role: newEmployee.role,
    }

    onSubmit(employee)
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      joinDate: "",
      salary: "",
      commission: "",
      address: "",
      emergencyContact: "",
      bankAccount: "",
      cnic: "",
      role: "cashier" as "admin" | "cashier",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>Enter employee details and employment information</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="Ahmed Ali"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                placeholder="ahmed@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                placeholder="+92-300-1234567"
              />
            </div>
            <div>
              <Label htmlFor="cnic">CNIC</Label>
              <Input
                id="cnic"
                value={newEmployee.cnic}
                onChange={(e) => setNewEmployee({ ...newEmployee, cnic: e.target.value })}
                placeholder="12345-6789012-3"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={newEmployee.role}
                onValueChange={(value: "admin" | "cashier") => setNewEmployee({ ...newEmployee, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Position</Label>
              <Select
                value={newEmployee.position}
                onValueChange={(value) => setNewEmployee({ ...newEmployee, position: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="Sales Associate">Sales Associate</SelectItem>
                  <SelectItem value="Store Assistant">Store Assistant</SelectItem>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                  <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
                  <SelectItem value="Tailor">Tailor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select
                value={newEmployee.department}
                onValueChange={(value) => setNewEmployee({ ...newEmployee, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="joinDate">Join Date</Label>
              <Input
                id="joinDate"
                type="date"
                value={newEmployee.joinDate}
                onChange={(e) => setNewEmployee({ ...newEmployee, joinDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="salary">Monthly Salary (Rs)</Label>
              <Input
                id="salary"
                type="number"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
                placeholder="35000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="commission">Commission Rate (%)</Label>
              <Input
                id="commission"
                type="number"
                step="0.1"
                value={newEmployee.commission}
                onChange={(e) => setNewEmployee({ ...newEmployee, commission: e.target.value })}
                placeholder="2.5"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newEmployee.address}
                onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                placeholder="123 Main Street, Lahore"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={newEmployee.emergencyContact}
                onChange={(e) => setNewEmployee({ ...newEmployee, emergencyContact: e.target.value })}
                placeholder="+92-301-7654321"
              />
            </div>
            <div>
              <Label htmlFor="bankAccount">Bank Account</Label>
              <Input
                id="bankAccount"
                value={newEmployee.bankAccount}
                onChange={(e) => setNewEmployee({ ...newEmployee, bankAccount: e.target.value })}
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Add Employee</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}













