// "use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { DailyExpenseService, type DailyExpense } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

/**
 * MonthlyExpenseManagement aggregates daily expenses by month and displays a summary.
 * Users can expand a month to see the individual daily expense entries for that month.
 */
export function MonthlyExpenseManagement() {
  const [expenses, setExpenses] = useState<DailyExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const { toast } = useToast()

  // Load all daily expenses from Firebase (same subscription used in DailyExpenseManagement)
  useEffect(() => {
    const unsubscribe = DailyExpenseService.subscribeToDailyExpenses((data) => {
      setExpenses(data)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Group expenses by month (format: YYYY-MM)
  const expensesByMonth = expenses.reduce((acc, expense) => {
    const monthKey = expense.date.slice(0, 7) // "2023-04"
    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey].push(expense)
    return acc
  }, {} as Record<string, DailyExpense[]>)

  // Helper to compute month totals
  const getMonthTotal = (monthExpenses: DailyExpense[]) =>
    monthExpenses.reduce((sum, e) => sum + e.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading monthly expenses...</p>
        </div>
      </div>
    )
  }

  // If there are no expenses at all
  if (!expenses.length) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No expenses recorded yet.
      </div>
    )
  }

  const monthKeys = Object.keys(expensesByMonth).sort((a, b) => b.localeCompare(a)) // newest first

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Monthly Expense Overview</h2>
      {monthKeys.map((month) => {
        const monthExpenses = expensesByMonth[month]
        const total = getMonthTotal(monthExpenses)
        const isOpen = expandedMonth === month
        return (
          <Card key={month}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  {new Date(month + "-01").toLocaleString(undefined, { month: "long", year: "numeric" })}
                </CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-foreground">Rs{total.toLocaleString()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedMonth(isOpen ? null : month)}
                >
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {isOpen && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthExpenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                        <TableCell>{exp.description}</TableCell>
                        <TableCell className="text-right text-green-600">Rs{exp.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
