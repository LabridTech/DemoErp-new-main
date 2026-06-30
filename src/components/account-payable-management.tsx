// src/components/account-payable-management.tsx
"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { CreditCard, Receipt } from "lucide-react"
import { PurchaseService, SupplierService, type Purchase, type Supplier } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface SupplierBalance {
  supplierId: string
  supplierName: string
  totalPurchase: number
  totalPaid: number
  outstanding: number
}

export default function AccountPayableManagement() {
  const [balances, setBalances] = useState<SupplierBalance[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const [purchases, suppliers] = await Promise.all([
        PurchaseService.getAllPurchases(),
        SupplierService.getAllSuppliers(),
      ])

      const supplierMap: Record<string, Supplier> = {}
      suppliers.forEach((s) => (supplierMap[s.id] = s))

      const temp: Record<string, SupplierBalance> = {}

      purchases.forEach((p: Purchase) => {
        const sid = p.supplierId
        if (!temp[sid]) {
          const s = supplierMap[sid] ?? { id: sid, name: p.supplierName, phone: p.supplierPhone, address: p.supplierAddress, balance: 0, createdAt: "" }
          temp[sid] = {
            supplierId: sid,
            supplierName: s.name,
            totalPurchase: 0,
            totalPaid: 0,
            outstanding: 0,
          }
        }
        // Accumulate purchase total (use totalAmount if present, otherwise subtotal)
        const purchaseTotal = p.totalAmount ?? p.subtotal ?? 0
        temp[sid].totalPurchase += Number(purchaseTotal)
        // Sum payment history if any
        if (p.paymentHistory && Array.isArray(p.paymentHistory)) {
          const paid = p.paymentHistory.reduce((sum, rec) => sum + Number(rec.amount), 0)
          temp[sid].totalPaid += paid
        }
      })

      // Compute outstanding balances
      const result = Object.values(temp).map((b) => ({
        ...b,
        outstanding: b.totalPurchase - b.totalPaid,
      }))

      setBalances(result)
    } catch (error) {
      console.error("Failed to load account payable data", error)
      toast({
        title: "Error",
        description: "Could not load payable data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalPurchase = balances.reduce((sum, b) => sum + b.totalPurchase, 0)
  const totalPaid = balances.reduce((sum, b) => sum + b.totalPaid, 0)
  const totalOutstanding = balances.reduce((sum, b) => sum + b.outstanding, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/5 backdrop-blur-sm border border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Receipt className="h-5 w-5" /> Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">Rs{totalPurchase.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-200/5 backdrop-blur-sm border border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CreditCard className="h-5 w-5" /> Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">Rs{totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-pink-200/5 backdrop-blur-sm border border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <CreditCard className="h-5 w-5" /> Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">Rs{totalOutstanding.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="shadow-xl border border-muted/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Supplier Payables</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="w-full">
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Total Purchase</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading payable data...
                  </TableCell>
                </TableRow>
              ) : balances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No payable records found.
                  </TableCell>
                </TableRow>
              ) : (
                balances.map((b) => (
                  <TableRow key={b.supplierId} className="hover:bg-muted/10 transition-colors">
                    <TableCell>{b.supplierName}</TableCell>
                    <TableCell className="text-right">Rs{b.totalPurchase.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">Rs{b.totalPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-600">Rs{b.outstanding.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
