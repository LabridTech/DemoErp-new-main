"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, DollarSign, Calendar, Edit, Trash2 } from "lucide-react"
import { DailyExpenseService, type DailyExpense } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

import { AddExpenseDialog } from "./modules/daily-expense-management/add-expense-dialog"
import { EditExpenseDialog } from "./modules/daily-expense-management/edit-expense-dialog"

export function DailyExpenseManagement() {
  const [expenses, setExpenses] = useState<DailyExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<DailyExpense | null>(null)
  const { toast } = useToast()

  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
  })

  // Load expenses from Firebase
  useEffect(() => {
    const unsubscribe = DailyExpenseService.subscribeToDailyExpenses((expensesData) => {
      setExpenses(expensesData)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddExpense = async () => {
    try {
      const expense: Omit<DailyExpense, "id"> = {
        date: newExpense.date,
        description: newExpense.description,
        amount: Number(newExpense.amount),
        createdAt: new Date().toISOString(),
      }

      await DailyExpenseService.createDailyExpense(expense)

      setNewExpense({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
      })
      setIsAddDialogOpen(false)

      toast({
        title: "Expense Added",
        description: "Daily expense has been successfully recorded",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditExpense = async () => {
    if (!editExpense) return

    try {
      await DailyExpenseService.updateDailyExpense(editExpense.id, {
        date: editExpense.date,
        description: editExpense.description,
        amount: editExpense.amount,
        updatedAt: new Date().toISOString(),
      })

      setIsEditDialogOpen(false)
      setEditExpense(null)
      toast({
        title: "Expense Updated",
        description: "Expense details updated successfully.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update expense.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await DailyExpenseService.deleteDailyExpense(id)
      toast({
        title: "Expense Deleted",
        description: "Expense has been successfully deleted",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (expense: DailyExpense) => {
    setEditExpense(expense)
    setIsEditDialogOpen(true)
  }

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const todayExpenses = expenses.filter(expense => expense.date === new Date().toISOString().split("T")[0])
  const totalTodayAmount = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Daily Expense Management</h2>
        <Button onClick={() => {
          setNewExpense({
            date: new Date().toISOString().split("T")[0],
            description: "",
            amount: "",
          })
          setIsAddDialogOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Rs{totalTodayAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Expenses for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">Expense entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Daily Expenses
          </CardTitle>
          <CardDescription>Simple expense tracking - amount and what it was spent on</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="font-medium">{expense.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">Rs{expense.amount.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(expense)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteExpense(expense.id)}>
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

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        newExpense={newExpense}
        setNewExpense={setNewExpense}
        onSubmit={handleAddExpense}
      />

      {/* Edit Expense Dialog */}
      {editExpense && (
        <EditExpenseDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          editExpense={editExpense}
          setEditExpense={setEditExpense}
          onSubmit={handleEditExpense}
        />
      )}
    </div>
  )
}