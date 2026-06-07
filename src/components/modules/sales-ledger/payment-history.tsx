"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, FileText } from "lucide-react"
import { type CreditSalePaymentRecord } from "@/lib/firebase-services"

interface PaymentHistoryProps {
  paymentRecord: CreditSalePaymentRecord
}

export function PaymentHistory({ paymentRecord }: PaymentHistoryProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return "bg-green-100 text-green-800"
      case "card":
        return "bg-blue-100 text-blue-800"
      case "bank_transfer":
        return "bg-purple-100 text-purple-800"
      case "mobile_payment":
        return "bg-orange-100 text-orange-800"
      case "check":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>
          Complete payment history for invoice #{paymentRecord.invoiceNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(paymentRecord.payments || []).length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payments recorded yet</p>
              <p className="text-sm text-muted-foreground">Add the first payment to get started</p>
            </div>
          ) : (
            <div className="border rounded-lg">
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
                  {(paymentRecord.payments || []).map((payment, index) => {
                    // Calculate remaining amount after this payment
                    const remainingAfterThis = paymentRecord.totalAmount - 
                      (paymentRecord.payments || []).slice(0, index + 1).reduce((sum, p) => sum + p.amount, 0)
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {formatDate(payment.date)}
                        </TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          Rs{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getMethodColor(payment.method)}>
                            {payment.method.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-orange-600">
                          Rs{remainingAfterThis.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.notes || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
