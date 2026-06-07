import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Employee } from "@/lib/firebase-services"

interface EditEmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee: Employee | null
    onSubmit: (employee: Employee) => void
  }
  
  export function EditEmployeeDialog({ open, onOpenChange, employee, onSubmit }: EditEmployeeDialogProps) {
    const [editEmployee, setEditEmployee] = useState<Employee | null>(employee)
  
    useEffect(() => {
      setEditEmployee(employee)
    }, [employee])
  
    if (!editEmployee) return null
  
    const handleSubmit = () => {
      onSubmit(editEmployee)
    }
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details and employment information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editEmployee.name}
                  onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmployee.email}
                  onChange={(e) => setEditEmployee({ ...editEmployee, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editEmployee.phone}
                  onChange={(e) => setEditEmployee({ ...editEmployee, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-cnic">CNIC</Label>
                <Input
                  id="edit-cnic"
                  value={editEmployee.cnic}
                  onChange={(e) => setEditEmployee({ ...editEmployee, cnic: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-position">Position</Label>
                <Input
                  id="edit-position"
                  value={editEmployee.position}
                  onChange={(e) => setEditEmployee({ ...editEmployee, position: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-department">Department</Label>
                <Select
                  value={editEmployee.department}
                  onValueChange={(value) => setEditEmployee({ ...editEmployee, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-joinDate">Join Date</Label>
                <Input
                  id="edit-joinDate"
                  type="date"
                  value={editEmployee.joinDate}
                  onChange={(e) => setEditEmployee({ ...editEmployee, joinDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-salary">Monthly Salary (Rs)</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={editEmployee.salary}
                  onChange={(e) => setEditEmployee({ ...editEmployee, salary: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-commission">Commission Rate (%)</Label>
                <Input
                  id="edit-commission"
                  type="number"
                  step="0.1"
                  value={editEmployee.commission}
                  onChange={(e) => setEditEmployee({ ...editEmployee, commission: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editEmployee.address}
                  onChange={(e) => setEditEmployee({ ...editEmployee, address: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-emergencyContact">Emergency Contact</Label>
                <Input
                  id="edit-emergencyContact"
                  value={editEmployee.emergencyContact}
                  onChange={(e) => setEditEmployee({ ...editEmployee, emergencyContact: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-bankAccount">Bank Account</Label>
                <Input
                  id="edit-bankAccount"
                  value={editEmployee.bankAccount}
                  onChange={(e) => setEditEmployee({ ...editEmployee, bankAccount: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }