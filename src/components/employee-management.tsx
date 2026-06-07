"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Edit, Trash2, Phone, Mail, Target, Clock, Award, Shield, UserCheck } from "lucide-react"
import { EmployeeService, EmployeePerformanceService, EmployeePayrollService, type Employee, type EmployeePerformance, type AttendanceRecord, type EmployeePayroll } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

import { AddEmployeeDialog } from "./modules/employee-management/add-employee-dialog"
import { EditEmployeeDialog } from "./modules/employee-management/edit-employee-dialog"
import { MarkAttendanceDialog } from "./modules/employee-management/mark-attendance-dialog"
import { RewardEmployeeDialog } from "./modules/employee-management/reward-employee-dialog"
import { SetTargetDialog } from "./modules/employee-management/set-target-dialog"
import { PayrollManagement } from "./modules/employee-management/payroll-management"

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [performanceRecords, setPerformanceRecords] = useState<EmployeePerformance[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [payrollData, setPayrollData] = useState<Map<string, EmployeePayroll>>(new Map())
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Dialog states
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [isRewardOpen, setIsRewardOpen] = useState(false)
  const [rewardEmployee, setRewardEmployee] = useState<Employee | null>(null)
  const [isSetTargetOpen, setIsSetTargetOpen] = useState(false)
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null)

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesData, performanceData, attendanceData] = await Promise.all([
          EmployeeService.getAllEmployees(),
          EmployeePerformanceService.getAllPerformanceRecords(),
          EmployeeService.getAllAttendanceRecords(),
        ])
        setEmployees(employeesData)
        setPerformanceRecords(performanceData)
        setAttendanceRecords(attendanceData)
        
        // Load payroll data for current month
        const currentMonth = new Date().toISOString().slice(0, 7)
        const currentYear = new Date().getFullYear()
        const employeeIds = employeesData.map(emp => emp.id)
        
        const payrollMap = await EmployeePayrollService.getBulkPayrollByMonth(
          employeeIds, 
          currentMonth, 
          currentYear
        )
        
        // Create default payroll records for employees without existing records
        const finalPayrollMap = new Map<string, EmployeePayroll>()
        
        employeesData.forEach(employee => {
          const existingPayroll = payrollMap.get(employee.id)
          
          if (existingPayroll) {
            finalPayrollMap.set(employee.id, existingPayroll)
          } else {
            // Create a default payroll record for display
            const defaultPayroll: EmployeePayroll = {
              id: '',
              employeeId: employee.id,
              employeeName: employee.name,
              month: currentMonth,
              year: currentYear,
              totalSalary: employee.salary,
              installments: [],
              bonuses: [],
              remainingSalary: employee.salary,
              status: 'pending'
            }
            finalPayrollMap.set(employee.id, defaultPayroll)
          }
        })
        
        setPayrollData(finalPayrollMap)
        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load employee data. Please refresh the page.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const totalEmployees = employees.length
  const activeEmployees = employees.filter((emp) => emp.status === "active").length
  const totalMonthlySalary = Array.from(payrollData.values()).reduce((sum, payroll) => sum + (payroll.totalSalary || 0), 0)
  
  // Helper function to get current month's performance data for an employee
  const getEmployeePerformance = (employeeId: string): EmployeePerformance | null => {
    const currentDate = new Date()
    const currentMonth = currentDate.toISOString().slice(0, 7) // YYYY-MM format
    const currentYear = currentDate.getFullYear()
    
    return performanceRecords.find(record => 
      record.employeeId === employeeId && 
      record.month === currentMonth && 
      record.year === currentYear
    ) || null
  }
  
  // Calculate total monthly commission from performance data
  const totalMonthlyCommission = employees.reduce((sum, emp) => {
    const performance = getEmployeePerformance(emp.id)
    if (performance) {
      return sum + ((performance.monthlySales || 0) * (emp.commission || 0)) / 100
    }
    return sum
  }, 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":  
        return "secondary"
      case "on-leave":
        return "outline"
      default:
        return "outline"
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case "present":
        return "default"
      case "late":
        return "secondary"
      case "half-day":
        return "outline"
      case "absent":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Calculate attendance rate based on join date and attendance records
  const calculateAttendanceRate = (employee: Employee) => {
    if (!employee.joinDate) return 100

    const joinDate = new Date(employee.joinDate)
    const today = new Date()
    
    // Calculate working days (excluding weekends)
    let workingDays = 0
    const currentDate = new Date(joinDate)
    
    while (currentDate <= today) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        workingDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    if (workingDays <= 0) return 100

    // Count attendance records for this employee
    const employeeAttendance = attendanceRecords.filter(record => 
      record.employeeId === employee.id && 
      new Date(record.date) >= joinDate
    )

    // Count present days (including late and half-day as present)
    const presentDays = employeeAttendance.filter(record => 
      record.status === "present" || record.status === "late" || record.status === "half-day"
    ).length

    // Calculate attendance rate
    const attendanceRate = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 100
    return Math.min(100, Math.max(0, attendanceRate))
  }

  // Handler functions for dialogs
  const handleAddEmployee = async (employee: Omit<Employee, "id">) => {
    try {
      if (!employee.joinDate) {
        toast({
          title: "Missing Join Date",
          description: "Please select a join date for the employee.",
          variant: "destructive",
        })
        return
      }

      // Create employee first
      const employeeId = await EmployeeService.createEmployee(employee)
      
      // Create payroll record for the new employee
      const currentMonth = new Date().toISOString().slice(0, 7)
      const currentYear = new Date().getFullYear()
      
      const payrollRecord: Omit<EmployeePayroll, "id"> = {
        employeeId,
        employeeName: employee.name,
        month: currentMonth,
        year: currentYear,
        totalSalary: employee.salary,
        installments: [],
        bonuses: [],
        remainingSalary: employee.salary,
        status: "pending"
      }
      
      await EmployeePayrollService.createPayrollRecord(payrollRecord)
      
      setIsAddEmployeeOpen(false)

      toast({
        title: "Employee Added",
        description: "Employee has been successfully added to the system with payroll record",
      })

      // Reload all data including payroll
      const [updatedEmployees, performanceData, attendanceData] = await Promise.all([
        EmployeeService.getAllEmployees(),
        EmployeePerformanceService.getAllPerformanceRecords(),
        EmployeeService.getAllAttendanceRecords(),
      ])
      
      setEmployees(updatedEmployees)
      setPerformanceRecords(performanceData)
      setAttendanceRecords(attendanceData)
      
      // Reload payroll data
      const employeeIds = updatedEmployees.map(emp => emp.id)
      const payrollMap = await EmployeePayrollService.getBulkPayrollByMonth(
        employeeIds, 
        currentMonth, 
        currentYear
      )
      
      const finalPayrollMap = new Map<string, EmployeePayroll>()
      updatedEmployees.forEach(emp => {
        const existingPayroll = payrollMap.get(emp.id)
        if (existingPayroll) {
          finalPayrollMap.set(emp.id, existingPayroll)
        } else {
          const defaultPayroll: EmployeePayroll = {
            id: '',
            employeeId: emp.id,
            employeeName: emp.name,
            month: currentMonth,
            year: currentYear,
            totalSalary: emp.salary,
            installments: [],
            bonuses: [],
            remainingSalary: emp.salary,
            status: 'pending'
          }
          finalPayrollMap.set(emp.id, defaultPayroll)
        }
      })
      
      setPayrollData(finalPayrollMap)
    } catch {
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditEmployee = async (employee: Employee) => {
    try {
      // Get the original employee data to check if salary changed
      const originalEmployee = employees.find(emp => emp.id === employee.id)
      const salaryChanged = originalEmployee && originalEmployee.salary !== employee.salary
      
      // Extract only the fields that should be updated, excluding the id
      const { id, ...updateData } = employee
      // Suppress unused variable warning for id
      void id
      
      // Update employee record
      await EmployeeService.updateEmployee(employee.id, updateData)
      
      // If salary changed, update all payroll records for this employee
      if (salaryChanged) {
        try {
          // Get all payroll records for this employee
          const payrollRecords = await EmployeePayrollService.getPayrollByEmployee(employee.id)
          
          // Update each payroll record with the new salary
          for (const payrollRecord of payrollRecords) {
            const currentAmountPaid = payrollRecord.totalSalary - payrollRecord.remainingSalary
            
            // Calculate new remaining salary based on the amount already paid
            // If new salary is less than amount already paid, remaining should be 0
            const newRemainingSalary = Math.max(0, employee.salary - currentAmountPaid)
            
            await EmployeePayrollService.updatePayrollRecord(payrollRecord.id, {
              totalSalary: employee.salary,
              remainingSalary: newRemainingSalary,
              employeeName: employee.name // Update name in case it changed too
            })
          }
        } catch (payrollError) {
          console.error('Error updating payroll records:', payrollError)
          // Don't fail the entire operation if payroll update fails
          toast({
            title: "Warning",
            description: "Employee updated but payroll records may not be fully synchronized. Please check the payroll section.",
            variant: "destructive",
          })
        }
      }
      
      setIsEditEmployeeOpen(false)
      setEditEmployee(null)
      toast({
        title: "Employee Updated",
        description: salaryChanged 
          ? "Employee information and payroll records have been updated." 
          : "Employee information has been updated.",
      })
      
      // Update local state immediately for better UX
      const updatedEmployees = employees.map(emp => 
        emp.id === employee.id ? employee : emp
      )
      setEmployees(updatedEmployees)
      
      // Update payroll data in local state if salary changed
      if (salaryChanged) {
        const currentMonth = new Date().toISOString().slice(0, 7)
        const currentYear = new Date().getFullYear()
        
        setPayrollData(prevPayrollData => {
          const newPayrollData = new Map(prevPayrollData)
          const existingPayroll = newPayrollData.get(employee.id)
          
          if (existingPayroll) {
            // Update existing payroll record
            const currentAmountPaid = existingPayroll.totalSalary - existingPayroll.remainingSalary
            
            // Calculate new remaining salary based on the amount already paid
            // If new salary is less than amount already paid, remaining should be 0
            const newRemainingSalary = Math.max(0, employee.salary - currentAmountPaid)
            
            newPayrollData.set(employee.id, {
              ...existingPayroll,
              totalSalary: employee.salary,
              remainingSalary: newRemainingSalary,
              employeeName: employee.name
            })
          } else {
            // Create new payroll record if none exists
            const newPayroll: EmployeePayroll = {
              id: '',
              employeeId: employee.id,
              employeeName: employee.name,
              month: currentMonth,
              year: currentYear,
              totalSalary: employee.salary,
              installments: [],
              bonuses: [],
              remainingSalary: employee.salary,
              status: 'pending'
            }
            newPayrollData.set(employee.id, newPayroll)
          }
          
          return newPayrollData
        })
      }
      
      // Reload other data in background
      const [performanceData, attendanceData] = await Promise.all([
        EmployeePerformanceService.getAllPerformanceRecords(),
        EmployeeService.getAllAttendanceRecords(),
      ])
      
      setPerformanceRecords(performanceData)
      setAttendanceRecords(attendanceData)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update employee.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAttendance = async (attendanceData: Omit<AttendanceRecord, "id" | "employeeName" | "date" | "hoursWorked">) => {
    try {
      const employee = employees.find((emp) => emp.id === attendanceData.employeeId)
      if (!employee) return

      const checkInTime = new Date(`2024-01-01 ${attendanceData.checkIn}`)
      const checkOutTime = new Date(`2024-01-01 ${attendanceData.checkOut}`)
      const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

      const attendanceRecord: Omit<AttendanceRecord, "id"> = {
        employeeId: attendanceData.employeeId,
        employeeName: employee.name,
        date: new Date().toISOString().split("T")[0],
        checkIn: attendanceData.checkIn,
        checkOut: attendanceData.checkOut,
        hoursWorked: Math.max(0, hoursWorked),
        status: attendanceData.status as "present" | "absent" | "late" | "half-day",
        notes: attendanceData.notes,
      }

      await EmployeeService.createAttendanceRecord(attendanceRecord)
      setIsAttendanceOpen(false)

      toast({
        title: "Attendance Marked",
        description: "Attendance has been successfully recorded",
      })

      // Reload attendance records
      const updatedAttendance = await EmployeeService.getAllAttendanceRecords()
      setAttendanceRecords(updatedAttendance)
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    try {
      await EmployeeService.deleteEmployee(id)
      toast({
        title: "Employee Deleted",
        description: "Employee has been successfully removed from the system",
      })

      // Reload employees
      const updatedEmployees = await EmployeeService.getAllEmployees()
      setEmployees(updatedEmployees)
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      })
    }
  }


  const handleRewardEmployee = async (amount: number) => {
    if (!rewardEmployee) return
    try {
      // For now, just show a success message
      // The new payroll system will handle rewards through installments
      setIsRewardOpen(false)
      setRewardEmployee(null)
      toast({
        title: "Employee Rewarded",
        description: `Reward of Rs${amount.toLocaleString()} has been noted. Use the Payroll section to add this as an installment.`,
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to reward employee.",
        variant: "destructive",
      })
    }
  }

  const handleSetTarget = async (target: number) => {
    if (!targetEmployee) return
    try {
      // Update performance record instead of employee record
      const performance = getEmployeePerformance(targetEmployee.id)
      if (performance) {
        await EmployeePerformanceService.updatePerformanceRecord(performance.id, {
          monthlyTarget: target,
        })
      } else {
        // Create new performance record if none exists
        await EmployeePerformanceService.getOrCreateCurrentMonthPerformance(
          targetEmployee.id, 
          targetEmployee.name
        ).then(record => {
          return EmployeePerformanceService.updatePerformanceRecord(record.id, {
            monthlyTarget: target,
          })
        })
      }
      setIsSetTargetOpen(false)
      setTargetEmployee(null)
      toast({
        title: "Target Updated",
        description: "Monthly sales target has been updated.",
      })
      const updatedEmployees = await EmployeeService.getAllEmployees()
      setEmployees(updatedEmployees)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update target.",
        variant: "destructive",
      })
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* All Dialog Components */}
      <AddEmployeeDialog
        open={isAddEmployeeOpen}
        onOpenChange={setIsAddEmployeeOpen}
        onSubmit={handleAddEmployee}
      />

      <EditEmployeeDialog
        open={isEditEmployeeOpen}
        onOpenChange={setIsEditEmployeeOpen}
        employee={editEmployee}
        onSubmit={handleEditEmployee}
      />

      <MarkAttendanceDialog
        open={isAttendanceOpen}
        onOpenChange={setIsAttendanceOpen}
        employees={employees}
        onSubmit={handleMarkAttendance}
      />


      <RewardEmployeeDialog
        open={isRewardOpen}
        onOpenChange={setIsRewardOpen}
        onSubmit={handleRewardEmployee}
      />

      <SetTargetDialog
        open={isSetTargetOpen}
        onOpenChange={setIsSetTargetOpen}
        onSubmit={handleSetTarget}
      />


      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Employee Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAttendanceOpen(true)}>
            <Clock className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>

          <Button onClick={() => setIsAddEmployeeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{activeEmployees} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Salary Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalMonthlySalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Base salaries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalMonthlyCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Performance based</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.length > 0
                ? Math.round(employees.reduce((sum, emp) => {
                    const performance = getEmployeePerformance(emp.id)
                    return sum + (performance?.performanceScore || 0)
                  }, 0) / employees.length)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Team average</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Employee Management</h3>
            <p className="text-sm text-muted-foreground">Manage employees, attendance, payroll, and performance</p>
          </div>
        </div>
        
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="employees">👥 Employees</TabsTrigger>
            <TabsTrigger value="attendance">⏰ Attendance</TabsTrigger>
            <TabsTrigger value="payroll">💰 Payroll</TabsTrigger>
            <TabsTrigger value="performance">📈 Performance</TabsTrigger>
          </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Directory
              </CardTitle>
              <CardDescription>Manage employee information and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">Joined: {employee.joinDate}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {employee.role === 'admin' ? (
                              <Badge variant="default" className="bg-blue-600">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Cashier
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {employee.phone}
                            </p>
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {employee.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Rs{(payrollData.get(employee.id)?.totalSalary || employee.salary || 0).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{employee.commission}% commission</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Score:</span>
                              <span className={getPerformanceColor(getEmployeePerformance(employee.id)?.performanceScore || 0)}>
                                {getEmployeePerformance(employee.id)?.performanceScore || 0}%
                              </span>
                            </div>
                            <Progress value={getEmployeePerformance(employee.id)?.performanceScore || 0} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              Sales: Rs{(getEmployeePerformance(employee.id)?.monthlySales || 0).toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <p className="font-medium">{calculateAttendanceRate(employee)}%</p>
                            <p className="text-xs text-muted-foreground">
                              {attendanceRecords.filter(record => 
                                record.employeeId === employee.id && 
                                (record.status === "present" || record.status === "late" || record.status === "half-day")
                              ).length} days present
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(employee.status) as "destructive" | "default" | "secondary" | "outline" | null | undefined}>{employee.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditEmployee(employee)
                                setIsEditEmployeeOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(`tel:${employee.phone}`, "_blank")
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteEmployee(employee.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Attendance Records
              </CardTitle>
              <CardDescription>Track employee attendance and working hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <p className="font-medium">{record.employeeName}</p>
                        </TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.checkIn}</TableCell>
                        <TableCell>{record.checkOut}</TableCell>
                        <TableCell>{(record.hoursWorked || 0).toFixed(1)} hrs</TableCell>
                        <TableCell>
                          <Badge variant={getAttendanceColor(record.status) as "destructive" | "default" | "secondary" | "outline" | null | undefined}>{record.status}</Badge>
                        </TableCell>
                        <TableCell>{record.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <PayrollManagement />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {employees.map((employee) => (
              <Card key={employee.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p>{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Sales</p>
                      <p className="text-lg font-bold">Rs{(getEmployeePerformance(employee.id)?.monthlySales || 0).toLocaleString()}</p>
                      <Progress value={((getEmployeePerformance(employee.id)?.monthlySales || 0) / (getEmployeePerformance(employee.id)?.monthlyTarget || 1)) * 100} className="h-2 mt-1" />
                      <p className="text-xs text-muted-foreground">
                        Target: Rs{(getEmployeePerformance(employee.id)?.monthlyTarget || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Performance Score</p>
                      <p className={`text-lg font-bold ${getPerformanceColor(getEmployeePerformance(employee.id)?.performanceScore || 0)}`}>
                        {getEmployeePerformance(employee.id)?.performanceScore || 0}%
                      </p>
                      <Progress value={getEmployeePerformance(employee.id)?.performanceScore || 0} className="h-2 mt-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                      <p className="text-lg font-bold">{getEmployeePerformance(employee.id)?.attendanceRate || calculateAttendanceRate(employee)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Commission</p>
                      <p className="text-lg font-bold">Rs{(getEmployeePerformance(employee.id)?.totalCommission || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRewardEmployee(employee)
                        setIsRewardOpen(true)
                      }}
                    >
                      <Award className="h-4 w-4 mr-1" />
                      Reward
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTargetEmployee(employee)
                        setIsSetTargetOpen(true)
                      }}
                    >
                      <Target className="h-4 w-4 mr-1" />
                      Set Target
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

