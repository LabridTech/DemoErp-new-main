// src/components/account-receivable-management.tsx
"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { CreditCard, Receipt, DollarSign } from "lucide-react"
import { SalesService, CustomerCreditService, type SaleRecord, type CustomerCredit } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

/**
 * AccountReceivableManagement
 *
 * Shows a combined view of all sales (sales ledger) and all payments received (customer credits).
 * It provides summary cards for total sales, total payments received, and outstanding amount.
 * A detailed table lists each sale with its invoice, customer, total amount, and payment status.
 */
export default function AccountReceivableManagement() {
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [credits, setCredits] = useState<CustomerCredit[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const [salesData, creditData] = await Promise.all([
        SalesService.getAllSales(),
        CustomerCreditService.getAll<CustomerCredit>("customerCredits"),
      ])
      setSales(salesData)
      setCredits(creditData)
    } catch (error) {
      console.error("Failed to load receivable data", error)
      toast({
        title: "Error",
        description: "Could not load receivable data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total || 0), 0)
  const totalPayments = credits.reduce((sum, c) => sum + Number(c.amount || 0), 0)
  const totalOutstanding = totalSales - totalPayments

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/5 backdrop-blur-sm border border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-primary">
              <DollarSign className="h-5 w-5" /> Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">Rs{totalSales.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-200/5 backdrop-blur-sm border border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CreditCard className="h-5 w-5" /> Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">Rs{totalPayments.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-pink-200/5 backdrop-blur-sm border border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Receipt className="h-5 w-5" /> Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">Rs{totalOutstanding.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sales Table */}
      <Card className="shadow-xl border border-muted/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Sales Ledger & Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="w-full">
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading receivable data...</TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">No sales records found.</TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => {
                  const relatedCredits = credits.filter((c) => c.invoiceNumber === sale.invoiceNumber)
                  const paidAmount = relatedCredits.reduce((sum, c) => sum + Number(c.amount || 0), 0)
                  const outstanding = Number(sale.total || 0) - paidAmount
                  return (
                    <TableRow key={sale.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>{sale.invoiceNumber}</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell className="text-right">Rs{Number(sale.total || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">Rs{paidAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">Rs{outstanding.toLocaleString()}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
