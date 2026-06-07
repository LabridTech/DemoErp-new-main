"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { type EmployeePayroll } from "@/lib/firebase-services"

interface PayrollInstallmentHistoryProps {
  payroll: EmployeePayroll | null
}

export function PayrollInstallmentHistory({ payroll }: PayrollInstallmentHistoryProps) {
  if (!payroll) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Installment History</CardTitle>
          <CardDescription>No payroll record found for current month</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please create a payroll record first.</p>
        </CardContent>
      </Card>
    )
  }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalPaid = (payroll.installments || []).reduce((sum, installment) => sum + installment.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Installment History</span>
          <Badge className={getStatusColor(payroll.status)}>
            {payroll.status.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Payment history for {payroll.month} {payroll.year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Salary</p>
            <p className="text-lg font-semibold">Rs{payroll.totalSalary.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-lg font-semibold text-green-600">Rs{totalPaid.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold text-orange-600">Rs{payroll.remainingSalary.toLocaleString()}</p>
          </div>
        </div>

        {(payroll.installments || []).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No installments recorded yet</p>
            <p className="text-sm text-muted-foreground">Add the first installment to get started</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Remaining After</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payroll.installments || []).map((installment, index) => {
                  // Calculate remaining salary after this installment
                  const remainingAfterThis = payroll.totalSalary - 
                    (payroll.installments || []).slice(0, index + 1).reduce((sum, inst) => sum + inst.amount, 0)
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {formatDate(installment.date)}
                      </TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        Rs{installment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        Rs{remainingAfterThis.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {installment.notes || '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
