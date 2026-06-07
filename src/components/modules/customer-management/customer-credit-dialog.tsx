"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, DollarSign, CreditCard } from "lucide-react"
import { CustomerService, CreditSalePaymentService, type Customer, type CreditSalePaymentRecord } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface CustomerCreditDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
}

export function CustomerCreditDialog({ isOpen, onOpenChange, customer }: CustomerCreditDialogProps) {
  const [creditAmount, setCreditAmount] = useState("")
  const [creditReason, setCreditReason] = useState("")
  const [creditDescription, setCreditDescription] = useState("")
  const [isAddingCredit, setIsAddingCredit] = useState(false)
  const [creditPayments, setCreditPayments] = useState<CreditSalePaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadCreditPayments = useCallback(async () => {
    if (!customer) return

    try {
      setLoading(true)
      const allPayments = await CreditSalePaymentService.getAllCreditSalePaymentRecords()
      const customerPayments = allPayments.filter(payment => payment.customerPhone === customer.phone)
      setCreditPayments(customerPayments)
    } catch (error) {
      console.error("Error loading credit payments:", error)
      toast({
        title: "Error",
        description: "Failed to load credit payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [customer, toast])

  // Load credit payments when dialog opens
  useEffect(() => {
    if (isOpen && customer) {
      loadCreditPayments()
    }
  }, [isOpen, customer, loadCreditPayments])

  const handleAddCredit = async () => {
    if (!customer || !creditAmount || !creditReason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(creditAmount)
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Credit amount must be greater than 0",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAddingCredit(true)
      
      // Update customer's current credit
      const newCurrentCredit = (customer.currentCredit || 0) + amount
      await CustomerService.updateCustomer(customer.id, {
        currentCredit: newCurrentCredit
      })

      // Create a credit payment record
      await CreditSalePaymentService.createCreditSalePaymentRecord({
        saleId: `credit-${Date.now()}`,
        invoiceNumber: `CREDIT-${Date.now()}`,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        totalAmount: amount,
        payments: [],
        remainingAmount: amount,
        status: "pending",
        saleDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      toast({
        title: "Success",
        description: `Added Rs${amount.toLocaleString()} credit to ${customer.name}`,
      })

      // Reset form
      setCreditAmount("")
      setCreditReason("")
      setCreditDescription("")
      
      // Reload credit payments
      await loadCreditPayments()
    } catch (error) {
      console.error("Error adding credit:", error)
      toast({
        title: "Error",
        description: "Failed to add credit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingCredit(false)
    }
  }

  const handleClose = () => {
    setCreditAmount("")
    setCreditReason("")
    setCreditDescription("")
    onOpenChange(false)
  }

  if (!customer) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Customer Credit Management
          </DialogTitle>
          <DialogDescription>
            Manage credit for {customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="font-medium">Rs{customer.creditLimit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Credit Used</p>
                  <p className="font-medium">Rs{customer.currentCredit.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Credit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Credit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credit-amount">Credit Amount (Rs)</Label>
                  <Input
                    id="credit-amount"
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Enter credit amount"
                  />
                </div>
                <div>
                  <Label htmlFor="credit-reason">Reason</Label>
                  <Select value={creditReason} onValueChange={setCreditReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Credit Addition</SelectItem>
                      <SelectItem value="refund">Refund Credit</SelectItem>
                      <SelectItem value="adjustment">Balance Adjustment</SelectItem>
                      <SelectItem value="promotion">Promotional Credit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="credit-description">Description (Optional)</Label>
                <Textarea
                  id="credit-description"
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
              <Button 
                onClick={handleAddCredit} 
                disabled={isAddingCredit || !creditAmount || !creditReason}
                className="w-full"
              >
                {isAddingCredit ? "Adding Credit..." : "Add Credit"}
              </Button>
            </CardContent>
          </Card>

          {/* Credit History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Credit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : creditPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No credit payments found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.invoiceNumber}
                          </TableCell>
                          <TableCell>
                            Rs{payment.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              payment.status === "paid" ? "default" :
                              payment.status === "partial" ? "secondary" :
                              payment.status === "overdue" ? "destructive" : "outline"
                            }>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(payment.saleDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            Rs{payment.remainingAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
