"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Plus, Gift, FileText } from "lucide-react"
import { EmployeePayrollService, type Employee, type EmployeePayroll } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import { PayrollInvoiceService } from "@/lib/payroll-invoice-service"
import jsPDF from 'jspdf'
import { AddInstallmentDialog } from "./add-installment-dialog"
import { AddBonusDialog } from "./add-bonus-dialog"
import { PayrollInstallmentHistory } from "./payroll-installment-history"
import { PayrollBonusHistory } from "./payroll-bonus-history"

interface PayrollEmployeeDetailProps {
  employee: Employee
  onBack: () => void
  onInstallmentAdded?: () => void
  onBonusAdded?: () => void
}

export const PayrollEmployeeDetail = memo(function PayrollEmployeeDetail({ employee, onBack, onInstallmentAdded, onBonusAdded }: PayrollEmployeeDetailProps) {
  const [currentPayroll, setCurrentPayroll] = useState<EmployeePayroll | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return currentMonth
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAddInstallmentOpen, setIsAddInstallmentOpen] = useState(false)
  const [isAddBonusOpen, setIsAddBonusOpen] = useState(false)
  const { toast } = useToast()

  // Generate month options (one future month, current month, and last 10 months) - memoized
  const monthOptions = useMemo(() => {
    const options = []
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() // 0-based
    
    // Add next month (future) first - ensure different key
    const nextMonthNum = currentMonth + 1
    const nextYear = nextMonthNum > 11 ? currentYear + 1 : currentYear
    const nextMonthAdjusted = nextMonthNum > 11 ? 0 : nextMonthNum
    const nextMonthStr = `${nextYear}-${String(nextMonthAdjusted + 1).padStart(2, '0')}`
    const nextMonthDisplayStr = new Date(nextYear, nextMonthAdjusted, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    
    options.push({ value: nextMonthStr, label: nextMonthDisplayStr })
    
    // Add current month second
    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
    const currentMonthDisplayStr = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    
    options.push({ value: currentMonthStr, label: currentMonthDisplayStr })
    
    // Add last 10 months (past)
    for (let i = 1; i <= 10; i++) {
      const pastMonthNum = currentMonth - i
      const pastYear = pastMonthNum < 0 ? currentYear - 1 : currentYear
      const pastMonthAdjusted = pastMonthNum < 0 ? 12 + pastMonthNum : pastMonthNum
      const monthStr = `${pastYear}-${String(pastMonthAdjusted + 1).padStart(2, '0')}`
      const displayStr = new Date(pastYear, pastMonthAdjusted, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      
      options.push({ value: monthStr, label: displayStr })
    }
    
    return options
  }, [])


  // Load payroll data
  const loadPayrollData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load all payroll records for this employee
      const payrolls = await EmployeePayrollService.getPayrollByEmployee(employee.id)
      
      // Use current month (already set in state initialization)
      const currentMonth = selectedMonth || new Date().toISOString().slice(0, 7)
      
      // Load current month payroll or create one
      let currentMonthPayroll = payrolls.find(p => p.month === currentMonth)
      
      if (!currentMonthPayroll) {
        // Create new payroll record for current month
        currentMonthPayroll = await EmployeePayrollService.getOrCreateCurrentMonthPayroll(
          employee.id,
          employee.name,
          employee.salary
        )
      }
      
      setCurrentPayroll(currentMonthPayroll)
    } catch (error) {
      console.error("Error loading payroll data:", error)
      toast({
        title: "Error",
        description: "Failed to load payroll data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [employee.id, employee.name, employee.salary, selectedMonth, toast])

  // Handle month selection
  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month)
    
    try {
      const year = parseInt(month.split('-')[0])
      const payroll = await EmployeePayrollService.getPayrollByMonth(employee.id, month, year)
      
      if (payroll) {
        setCurrentPayroll(payroll)
      } else {
        // Create new payroll record for selected month
        const newPayroll = await EmployeePayrollService.getOrCreateCurrentMonthPayroll(
          employee.id,
          employee.name,
          employee.salary
        )
        setCurrentPayroll(newPayroll)
      }
    } catch (error) {
      console.error("Error loading payroll for month:", error)
      toast({
        title: "Error",
        description: "Failed to load payroll data for selected month.",
        variant: "destructive",
      })
    }
  }

  // Handle installment added
  const handleInstallmentAdded = () => {
    loadPayrollData()
    // Notify parent component to refresh the list
    if (onInstallmentAdded) {
      onInstallmentAdded()
    }
  }

  // Handle bonus added
  const handleBonusAdded = () => {
    loadPayrollData()
    // Notify parent component to refresh the list
    if (onBonusAdded) {
      onBonusAdded()
    }
  }

  // Handle PDF invoice generation
  const handleGenerateInvoice = async () => {
    if (!currentPayroll) return

    try {
      const invoiceData = PayrollInvoiceService.prepareInvoiceData(currentPayroll)
      
      // Generate PDF in the component
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let yPos = 20

      // Helper function to add text
      const addText = (text: string, x: number, y: number, fontSize: number = 10, isBold: boolean = false) => {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        doc.text(text, x, y)
        return y + (fontSize * 0.4)
      }

      // Helper function to add a line
      const addLine = (y: number) => {
        doc.line(margin, y, pageWidth - margin, y)
        return y + 5
      }

      // Header
      doc.setFillColor(41, 128, 185) // Blue background
      doc.rect(0, 0, pageWidth, 40, 'F')
      
      // Company name
      doc.setTextColor(255, 255, 255)
      yPos = addText(invoiceData.companyName, margin, 25, 18, true)
      
      // Invoice title
      yPos = addText('PAYROLL INVOICE', pageWidth - 60, 25, 14, true)
      
      // Reset text color
      doc.setTextColor(0, 0, 0)
      yPos = 50

      // Employee Information
      yPos = addText('Employee Information', margin, yPos, 14, true)
      yPos = yPos + 5
      
      yPos = addText(`Employee Name: ${invoiceData.employeeName}`, margin, yPos, 11)
      yPos = addText(`Employee ID: ${invoiceData.employeeId}`, margin, yPos, 11)
      yPos = addText(`Pay Period: ${PayrollInvoiceService.formatMonthYear(invoiceData.month, invoiceData.year)}`, margin, yPos, 11)
      yPos = addText(`Generated Date: ${new Date(invoiceData.generatedDate).toLocaleDateString()}`, margin, yPos, 11)
      
      yPos = addLine(yPos + 10)

      // Salary Summary
      yPos = addText('Salary Summary', margin, yPos, 14, true)
      yPos = yPos + 5

      const totalPaid = invoiceData.totalSalary - invoiceData.remainingSalary
      const paidPercentage = invoiceData.totalSalary > 0 ? ((totalPaid / invoiceData.totalSalary) * 100).toFixed(1) : '0'

      yPos = addText(`Total Salary: Rs ${invoiceData.totalSalary.toLocaleString()}`, margin, yPos, 11)
      yPos = addText(`Amount Paid: Rs ${totalPaid.toLocaleString()}`, margin, yPos, 11)
      yPos = addText(`Remaining: Rs ${invoiceData.remainingSalary.toLocaleString()}`, margin, yPos, 11)
      yPos = addText(`Payment Status: ${invoiceData.status.toUpperCase()}`, margin, yPos, 11)
      yPos = addText(`Completion: ${paidPercentage}%`, margin, yPos, 11)

      yPos = addLine(yPos + 10)

      // Payment Installments
      if (invoiceData.installments && invoiceData.installments.length > 0) {
        yPos = addText('Payment Installments', margin, yPos, 14, true)
        yPos = yPos + 5

        // Table headers
        const headers = ['Date', 'Amount', 'Status']
        const colWidths = [50, 50, 30]
        let xPosition = margin

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        headers.forEach((header, index) => {
          doc.text(header, xPosition, yPos)
          xPosition += colWidths[index]
        })
        yPos = yPos + 5

        // Draw header line
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos = yPos + 3

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)

        invoiceData.installments.forEach((installment) => {
          if (yPos > 250) {
            doc.addPage()
            yPos = 20
          }

          xPosition = margin
          const rowData = [
            new Date(installment.date).toLocaleDateString(),
            `Rs ${installment.amount.toLocaleString()}`,
            'Paid'
          ]

          rowData.forEach((data, index) => {
            doc.text(data, xPosition, yPos)
            xPosition += colWidths[index]
          })
          yPos = yPos + 4
        })

        yPos = addLine(yPos + 5)
      }

      // Bonuses
      if (invoiceData.bonuses && invoiceData.bonuses.length > 0) {
        yPos = addText('Bonuses', margin, yPos, 14, true)
        yPos = yPos + 5

        invoiceData.bonuses.forEach((bonus) => {
          if (yPos > 250) {
            doc.addPage()
            yPos = 20
          }

          yPos = addText(`• ${bonus.reason}: Rs ${bonus.amount.toLocaleString()}`, margin, yPos, 10)
        })

        yPos = addLine(yPos + 5)
      }

      // Payment Summary Box
      yPos = addText('Payment Summary', margin, yPos, 14, true)
      yPos = yPos + 5

      // Create a summary box
      const boxY = yPos
      const boxHeight = 30
      doc.setDrawColor(200, 200, 200)
      doc.setFillColor(248, 249, 250)
      doc.rect(margin, boxY, pageWidth - (margin * 2), boxHeight, 'FD')

      yPos = yPos + 8
      yPos = addText(`Total Salary: Rs ${invoiceData.totalSalary.toLocaleString()}`, margin + 5, yPos, 11, true)
      yPos = addText(`Amount Paid: Rs ${totalPaid.toLocaleString()}`, margin + 5, yPos, 11, true)
      yPos = addText(`Remaining: Rs ${invoiceData.remainingSalary.toLocaleString()}`, margin + 5, yPos, 11, true)

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight()
      const footerY = pageHeight - 20
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth - 60, footerY)

      // Save the PDF
      const fileName = `Payroll_Invoice_${invoiceData.employeeName.replace(/\s+/g, '_')}_${invoiceData.month}.pdf`
      doc.save(fileName)
      
      toast({
        title: "Success",
        description: "Payroll invoice generated successfully",
      })
    } catch (error) {
      console.error("Error generating payroll invoice:", error)
      toast({
        title: "Error",
        description: "Failed to generate payroll invoice",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadPayrollData()
  }, [loadPayrollData])

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

  const getProgressPercentage = () => {
    if (!currentPayroll) return 0
    const salaryPaid = currentPayroll.totalSalary - currentPayroll.remainingSalary
    const bonusPaid = (currentPayroll.bonuses || []).reduce((sum, bonus) => sum + bonus.amount, 0)
    const totalPaid = salaryPaid + bonusPaid
    return (totalPaid / currentPayroll.totalSalary) * 100
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={onBack}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Employee List
              </Button>
              <span>{employee.name} - Payroll Details</span>
            </CardTitle>
            <CardDescription>Loading payroll data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        <div className="flex items-center gap-4">
          <Button 
            variant="default" 
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employee List
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{employee.name}</h2>
            <p className="text-muted-foreground">{employee.position} • {employee.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => {
                const isSelected = option.value === selectedMonth
                return (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className={isSelected ? "bg-accent" : ""}
                  >
                    {option.label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs{currentPayroll?.totalSalary.toLocaleString() || employee.salary.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly salary amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs{currentPayroll ? ((currentPayroll.totalSalary - currentPayroll.remainingSalary) + (currentPayroll.bonuses || []).reduce((sum, bonus) => sum + bonus.amount, 0)).toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Amount paid in installments + bonuses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Badge className={getStatusColor(currentPayroll?.status || 'pending')}>
              {currentPayroll?.status.toUpperCase() || 'PENDING'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              Rs{currentPayroll?.remainingSalary.toLocaleString() || employee.salary.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Outstanding amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              Rs{currentPayroll ? (currentPayroll.bonuses || []).reduce((sum, bonus) => sum + bonus.amount, 0).toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Bonuses given this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {currentPayroll && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Progress</CardTitle>
            <CardDescription>
              {selectedMonth} payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{getProgressPercentage().toFixed(1)}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Rs{currentPayroll ? ((currentPayroll.totalSalary - currentPayroll.remainingSalary) + (currentPayroll.bonuses || []).reduce((sum, bonus) => sum + bonus.amount, 0)).toLocaleString() : '0'} paid</span>
                <span>Rs{currentPayroll?.remainingSalary.toLocaleString() || '0'} remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage payroll installments and bonuses for this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setIsAddInstallmentOpen(true)}
              disabled={!currentPayroll || (currentPayroll?.remainingSalary ?? 0) <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Installment
            </Button>
            <Button 
              onClick={() => setIsAddBonusOpen(true)}
              disabled={!currentPayroll}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bonus
            </Button>
            <Button 
              onClick={handleGenerateInvoice}
              disabled={!currentPayroll}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate PDF
            </Button>
            {(currentPayroll?.remainingSalary ?? 0) <= 0 && (
              <p className="text-sm text-muted-foreground flex items-center">
                All salary has been paid for this month
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Installment History */}
      {currentPayroll && <PayrollInstallmentHistory payroll={currentPayroll} />}

      {/* Bonus History */}
      {currentPayroll && <PayrollBonusHistory payroll={currentPayroll} />}

      {/* Add Installment Dialog */}
      <AddInstallmentDialog
        open={isAddInstallmentOpen}
        onOpenChange={setIsAddInstallmentOpen}
        employeeId={employee.id}
        employeeName={employee.name}
        currentPayroll={currentPayroll}
        onInstallmentAdded={handleInstallmentAdded}
      />

      {/* Add Bonus Dialog */}
      <AddBonusDialog
        open={isAddBonusOpen}
        onOpenChange={setIsAddBonusOpen}
        employeeId={employee.id}
        employeeName={employee.name}
        currentPayroll={currentPayroll}
        onBonusAdded={handleBonusAdded}
      />
    </div>
  )
})
