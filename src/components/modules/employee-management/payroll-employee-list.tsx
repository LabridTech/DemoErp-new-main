"use client"

import { useState, useEffect, useMemo, useCallback, memo, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, DollarSign, Calendar, Users, Eye, RefreshCw } from "lucide-react"
import { EmployeeService, EmployeePayrollService, type Employee, type EmployeePayroll } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface PayrollEmployeeListProps {
  onEmployeeSelect: (employee: Employee) => void
  onBack?: () => void
}

export interface PayrollEmployeeListRef {
  refreshData: () => void
}

export const PayrollEmployeeList = memo(forwardRef<PayrollEmployeeListRef, PayrollEmployeeListProps>(function PayrollEmployeeList({ onEmployeeSelect, onBack }, ref) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollData, setPayrollData] = useState<Map<string, EmployeePayroll>>(new Map())
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Load employees and their current month payroll data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Loading payroll data...')
      
      // Load all employees first
      const employeesData = await EmployeeService.getAllEmployees()
      console.log('Loaded employees:', employeesData.length)
      setEmployees(employeesData)
      
      // Get current month info
      const currentMonth = new Date().toISOString().slice(0, 7)
      const currentYear = new Date().getFullYear()
      console.log('Current month:', currentMonth, 'Year:', currentYear)
      
      // Load payroll data for all employees in one bulk operation
      const employeeIds = employeesData.map(emp => emp.id)
      const payrollMap = await EmployeePayrollService.getBulkPayrollByMonth(
        employeeIds, 
        currentMonth, 
        currentYear
      )
      console.log('Loaded payroll records:', payrollMap.size)
      
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
      
      console.log('Final payroll map size:', finalPayrollMap.size)
      console.log('Final payroll data:', Array.from(finalPayrollMap.entries()))
      setPayrollData(finalPayrollMap)
    } catch (error) {
      console.error("Error loading payroll data:", error)
      toast({
        title: "Error",
        description: "Failed to load employee payroll data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Expose refreshData method to parent component
  useImperativeHandle(ref, () => ({
    refreshData: () => {
      console.log('Refreshing payroll data...')
      loadData()
    }
  }), [loadData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressPercentage = (payroll: EmployeePayroll) => {
    const totalPaid = (payroll.totalSalary - payroll.remainingSalary) + (payroll.bonuses || []).reduce((sum, bonus) => sum + bonus.amount, 0)
    return (totalPaid / payroll.totalSalary) * 100
  }

  // Memoize expensive calculations
  const summaryStats = useMemo(() => {
    const payrollValues = Array.from(payrollData.values())
    return {
      totalEmployees: employees.length,
      fullyPaid: payrollValues.filter(p => p.status === 'paid').length,
      partialPayments: payrollValues.filter(p => p.status === 'partial').length,
      pending: payrollValues.filter(p => p.status === 'pending').length,
    }
  }, [employees.length, payrollData])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-12 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-2 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Employee Payroll Overview
          </h2>
          <p className="text-muted-foreground">Select an employee to manage their payroll installments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fully Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryStats.fullyPaid}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summaryStats.partialPayments}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summaryStats.pending}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Status</CardTitle>
          <CardDescription>
            Current month payroll status for all employees. Click on an employee to manage their installments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Monthly Salary</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const payroll = payrollData.get(employee.id)
                  if (!payroll) return null

                  const totalPaid = (payroll.totalSalary - payroll.remainingSalary) + (payroll.bonuses || []).reduce((sum, bonus) => sum + bonus.amount, 0)
                  const progressPercentage = getProgressPercentage(payroll)

                  return (
                    <TableRow 
                      key={employee.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onEmployeeSelect(employee)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground">{employee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{employee.position}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground">Rs{payroll.totalSalary.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-semibold">
                          Rs{totalPaid.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-orange-600 font-semibold">
                          Rs{payroll.remainingSalary.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-20">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {progressPercentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payroll.status)}>
                          {payroll.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEmployeeSelect(employee)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}))
