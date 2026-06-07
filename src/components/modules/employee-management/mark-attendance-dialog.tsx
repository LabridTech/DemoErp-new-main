import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Employee, type AttendanceRecord } from "@/lib/firebase-services"

interface MarkAttendanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employees: Employee[]
    onSubmit: (attendance: Omit<AttendanceRecord, "id" | "employeeName" | "date" | "hoursWorked">) => void
  }
  
  export function MarkAttendanceDialog({ open, onOpenChange, employees, onSubmit }: MarkAttendanceDialogProps) {
    const [attendanceForm, setAttendanceForm] = useState({
      employeeId: "",
      checkIn: "",
      checkOut: "",
      status: "",
      notes: "",
    })
  
    const handleSubmit = () => {
      onSubmit(attendanceForm as Omit<AttendanceRecord, "id" | "employeeName" | "date" | "hoursWorked">)
      setAttendanceForm({
        employeeId: "",
        checkIn: "",
        checkOut: "",
        status: "",
        notes: "",
      })
    }
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>Record employee attendance for today</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Employee</Label>
              <Select
                value={attendanceForm.employeeId}
                onValueChange={(value) => setAttendanceForm({ ...attendanceForm, employeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((emp) => emp.status === "active")
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Check In Time</Label>
                <Input
                  type="time"
                  value={attendanceForm.checkIn}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                />
              </div>
              <div>
                <Label>Check Out Time</Label>
                <Input
                  type="time"
                  value={attendanceForm.checkOut}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={attendanceForm.status}
                onValueChange={(value) => setAttendanceForm({ ...attendanceForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                placeholder="Additional notes"
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Mark Attendance</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }