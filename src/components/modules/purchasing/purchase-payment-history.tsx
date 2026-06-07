"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, DollarSign, FileText } from "lucide-react"
import { PurchaseService, type Purchase } from "@/lib/firebase-services"

interface PurchasePaymentHistoryProps {
  purchaseId: string
}

interface PaymentHistoryEntry {
  id: string
  amount: number
  method: string
  date: string
  remainingAfter: number
  notes: string
}

export function PurchasePaymentHistory({ purchaseId }: PurchasePaymentHistoryProps) {
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPurchase = async () => {
      try {
        setIsLoading(true)
        const purchaseData = await PurchaseService.getPurchaseById(purchaseId)
        setPurchase(purchaseData)
      } catch (error) {
        console.error("Error loading purchase:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPurchase()
  }, [purchaseId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!purchase) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No payment history found.</p>
        </CardContent>
      </Card>
    )
  }

  const partialAmount = parseFloat(purchase.partialPaymentAmount || "0") || 0
  const remainingAmount = purchase.totalAmount - partialAmount

  // Get payment history from purchase record or create default entry
  const paymentHistory: PaymentHistoryEntry[] = purchase.paymentHistory || [
    {
      id: "1",
      amount: partialAmount,
      method: purchase.paymentMethod || "Not specified",
      date: purchase.createdAt,
      remainingAfter: remainingAmount,
      notes: partialAmount > 0 ? "Initial partial payment" : "No payment made"
    }
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatMethod = (method: string) => {
    const methodMap: { [key: string]: string } = {
      'cash': 'CASH',
      'card': 'CARD',
      'bank-transfer': 'BANK TRANSFER',
      'mobile-payment': 'MOBILE PAYMENT',
      'cheque': 'CHEQUE',
      'other': 'OTHER'
    }
    return methodMap[method.toLowerCase()] || method.toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>
          Complete payment history for invoice #{purchase.invoiceNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Remaining After</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(payment.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            Rs{payment.amount.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {formatMethod(payment.method)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-orange-600">
                          Rs{payment.remainingAfter.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {payment.notes}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">Rs{purchase.totalAmount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid Amount</p>
                  <p className="font-semibold text-lg text-green-600">Rs{partialAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-semibold text-lg text-red-600">Rs{remainingAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge 
                    variant={purchase.paymentStatus === "paid" ? "default" : "destructive"}
                    className={
                      purchase.paymentStatus === "paid" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {purchase.paymentStatus || "Pending"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
