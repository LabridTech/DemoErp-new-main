"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, CreditCard, History, Trash2, Calendar, TrendingUp, DollarSign } from "lucide-react"
import { SupplierCreditService, type SupplierCredit, type SupplierCreditTransaction, type Supplier } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface SupplierCreditDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
}

export function SupplierCreditDialog({ isOpen, onOpenChange, supplier }: SupplierCreditDialogProps) {
  const [credits, setCredits] = useState<SupplierCredit[]>([])
  const [transactions, setTransactions] = useState<SupplierCreditTransaction[]>([])
  // const [loading, setLoading] = useState(false)
  const [showAddCredit, setShowAddCredit] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { toast } = useToast()

  const [newCredit, setNewCredit] = useState({
    amount: 0,
    reason: "",
    description: "",
    expiryDate: ""
  })

  const loadCredits = useCallback(async () => {
    if (!supplier) return
    
    try {
      // setLoading(true)
      const creditsData = await SupplierCreditService.getCreditsBySupplier(supplier.id)
      setCredits(creditsData)
    } catch (error) {
      console.error("Error loading credits:", error)
      toast({
        title: "Error",
        description: "Failed to load credits",
        variant: "destructive",
      })
    } finally {
      // setLoading(false)
    }
  }, [supplier, toast])

  const loadTransactions = useCallback(async () => {
    if (!supplier) return
    
    try {
      const transactionsData = await SupplierCreditService.getCreditTransactions(supplier.id)
      setTransactions(transactionsData)
    } catch (error) {
      console.error("Error loading transactions:", error)
    }
  }, [supplier])

  useEffect(() => {
    if (isOpen && supplier) {
      loadCredits()
      loadTransactions()
    }
  }, [isOpen, supplier, loadCredits, loadTransactions])

  const handleAddCredit = async () => {
    if (!supplier || !newCredit.amount || !newCredit.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      await SupplierCreditService.createCredit({
        supplierId: supplier.id,
        supplierName: supplier.name,
        amount: newCredit.amount,
        type: "credit",
        reason: newCredit.reason,
        description: newCredit.description,
        createdBy: "admin", // TODO: Get from auth context
        status: "active",
        ...(newCredit.expiryDate && { expiryDate: newCredit.expiryDate }),
        createdAt: new Date().toISOString()
      })

      toast({
        title: "Success",
        description: "Credit added successfully",
      })

      setNewCredit({ amount: 0, reason: "", description: "", expiryDate: "" })
      setShowAddCredit(false)
      loadCredits()
      loadTransactions()
    } catch (error) {
      console.error("Error adding credit:", error)
      toast({
        title: "Error",
        description: "Failed to add credit",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCredit = async (creditId: string) => {
    try {
      await SupplierCreditService.deleteCredit(creditId)
      toast({
        title: "Success",
        description: "Credit deleted successfully",
      })
      loadCredits()
    } catch (error) {
      console.error("Error deleting credit:", error)
      toast({
        title: "Error",
        description: "Failed to delete credit",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "used":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "used":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "refunded":
        return "bg-green-100 text-green-800 border-green-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const totalAvailableCredit = credits
    .filter(credit => credit.status === "active")
    .reduce((sum, credit) => sum + (credit.remainingAmount || 0), 0)

  const totalUsedCredit = credits
    .reduce((sum, credit) => sum + (credit.usedAmount || 0), 0)

  const totalCredits = credits
    .reduce((sum, credit) => sum + credit.amount, 0)

  if (!supplier) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] w-[85vw] overflow-hidden p-0">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Credit Management</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 mt-1">
                Manage credits for {supplier.name}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddCredit(!showAddCredit)} 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddCredit ? "Cancel" : "Add Credit"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowHistory(!showHistory)}
                className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20"
                size="sm"
              >
                <History className="h-4 w-4 mr-2" />
                {showHistory ? "Hide History" : "View History"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6" style={{ maxHeight: 'calc(85vh - 120px)', overflow: 'hidden' }}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Available Credit</p>
                    <p className="text-2xl font-bold">Rs{totalAvailableCredit.toLocaleString()}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Used Credit</p>
                    <p className="text-2xl font-bold">Rs{totalUsedCredit.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Credits</p>
                    <p className="text-2xl font-bold">Rs{totalCredits.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Credit Form */}
          {showAddCredit && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add New Credit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium text-card-foreground">Amount (Rs)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newCredit.amount}
                    onChange={(e) => setNewCredit({ ...newCredit, amount: Number(e.target.value) })}
                    placeholder="Enter credit amount"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium text-card-foreground">Reason</Label>
                  <Select 
                    value={newCredit.reason} 
                    onValueChange={(value) => setNewCredit({ ...newCredit, reason: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goodwill">Goodwill Credit</SelectItem>
                      <SelectItem value="return">Return Credit</SelectItem>
                      <SelectItem value="promotion">Promotional Credit</SelectItem>
                      <SelectItem value="adjustment">Balance Adjustment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-card-foreground">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newCredit.description}
                  onChange={(e) => setNewCredit({ ...newCredit, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="expiryDate" className="text-sm font-medium text-card-foreground">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newCredit.expiryDate}
                  onChange={(e) => setNewCredit({ ...newCredit, expiryDate: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleAddCredit}>
                  Add Credit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddCredit(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Credits Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Credit Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-card-foreground">Amount</TableHead>
                    <TableHead className="font-semibold text-card-foreground">Used</TableHead>
                    <TableHead className="font-semibold text-card-foreground">Remaining</TableHead>
                    <TableHead className="font-semibold text-card-foreground">Reason</TableHead>
                    <TableHead className="font-semibold text-card-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-card-foreground">Expiry</TableHead>
                    <TableHead className="font-semibold text-card-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.slice(0, 5).map((credit, index) => (
                    <TableRow key={credit.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                      <TableCell className="font-semibold text-card-foreground">Rs{credit.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">Rs{(credit.usedAmount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">Rs{(credit.remainingAmount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                          {credit.reason}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(credit.status)} font-medium`}>
                          {credit.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {credit.expiryDate ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className="text-sm">{new Date(credit.expiryDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 text-sm">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {credit.status === "active" && (credit.usedAmount || 0) === 0 && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCredit(credit.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {credits.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                        Showing 5 of {credits.length} credits
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          {showHistory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-card-foreground">Date</TableHead>
                      <TableHead className="font-semibold text-card-foreground">Type</TableHead>
                      <TableHead className="font-semibold text-card-foreground">Amount</TableHead>
                      <TableHead className="font-semibold text-card-foreground">Description</TableHead>
                      <TableHead className="font-semibold text-card-foreground">Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 5).map((transaction, index) => (
                      <TableRow key={transaction.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                        <TableCell className="text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getTransactionTypeColor(transaction.type)} font-medium`}>
                            {transaction.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-card-foreground">Rs{transaction.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">{transaction.description}</TableCell>
                        <TableCell className="text-muted-foreground">{transaction.invoiceNumber || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                    {transactions.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                          Showing 5 of {transactions.length} transactions
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}