"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  SalesService,
  PurchaseService,
  CustomerCreditService,
  SupplierCreditService,
  type SaleRecord,
  type Purchase,
  type CustomerCredit,
  type SupplierCredit,
} from "@/lib/firebase-services"

type ClientLedgerRow = {
  invoiceNumber: string
  date: string
  clientName: string
  saleAmount: number
  paidAmount: number
  outstandingAmount: number
  paymentStatus: string
}

type VendorLedgerRow = {
  invoiceNumber: string
  date: string
  vendorName: string
  purchaseAmount: number
  paidAmount: number
  outstandingAmount: number
  paymentStatus: string
}

type PaymentRow = {
  date: string
  reference: string
  partyType: "client" | "vendor"
  partyName: string
  amount: number
  source: string
  status: string
}

function arrayToCSV<T extends Record<string, string | number>>(data: T[], columns: Array<keyof T>) {
  const header = columns.join(",")
  const rows = data.map((row) =>
    columns
      .map((column) => {
        const value = row[column] ?? ""
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      })
      .join(",")
  )
  return `${header}\n${rows.join("\n")}`
}

function formatCurrency(amount: number) {
  return `Rs ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`
}

function formatDate(value?: string) {
  if (!value) {
    return "-"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString()
}

export function GeneralLedgerManagement() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([])
  const [purchaseRecords, setPurchaseRecords] = useState<Purchase[]>([])
  const [customerCredits, setCustomerCredits] = useState<CustomerCredit[]>([])
  const [supplierCredits, setSupplierCredits] = useState<SupplierCredit[]>([])

  const loadLedgerData = useCallback(async () => {
    try {
      setLoading(true)
      const [sales, purchases, customerPayments, supplierPayments] = await Promise.all([
        SalesService.getAllSales(),
        PurchaseService.getAllPurchases(),
        CustomerCreditService.getAll<CustomerCredit>("customerCredits"),
        SupplierCreditService.getAll<SupplierCredit>("supplierCredits"),
      ])
      setSalesRecords(sales)
      setPurchaseRecords(purchases)
      setCustomerCredits(customerPayments)
      setSupplierCredits(supplierPayments)
    } catch (error) {
      console.error("Failed to load general ledger data", error)
      toast({
        title: "Error",
        description: "Could not load general ledger data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadLedgerData()
  }, [loadLedgerData])

  const customerPaymentsByInvoice = useMemo(() => {
    return customerCredits.reduce<Record<string, number>>((acc, payment) => {
      const key = payment.invoiceNumber || ""
      if (!key) {
        return acc
      }
      acc[key] = (acc[key] || 0) + Number(payment.amount || 0)
      return acc
    }, {})
  }, [customerCredits])

  const supplierPaymentsByInvoice = useMemo(() => {
    return supplierCredits.reduce<Record<string, number>>((acc, payment) => {
      const key = payment.invoiceNumber || ""
      if (!key) {
        return acc
      }
      acc[key] = (acc[key] || 0) + Number(payment.amount || 0)
      return acc
    }, {})
  }, [supplierCredits])

  const clientLedgerRows = useMemo<ClientLedgerRow[]>(() => {
    return [...salesRecords]
      .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
      .map((sale) => {
        const saleAmount = Number(sale.total || 0)
        const paidAmount = Number(customerPaymentsByInvoice[sale.invoiceNumber] || 0)
        const outstandingAmount = Math.max(saleAmount - paidAmount, 0)
        return {
          invoiceNumber: sale.invoiceNumber,
          date: sale.date || sale.createdAt || "",
          clientName: sale.customerName,
          saleAmount,
          paidAmount,
          outstandingAmount,
          paymentStatus: outstandingAmount <= 0 ? "paid" : sale.paymentStatus || "pending",
        }
      })
  }, [salesRecords, customerPaymentsByInvoice])

  const vendorLedgerRows = useMemo<VendorLedgerRow[]>(() => {
    return [...purchaseRecords]
      .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
      .map((purchase) => {
        const purchaseAmount = Number(purchase.totalAmount ?? purchase.total ?? purchase.subtotal ?? 0)
        const paidFromHistory = (purchase.paymentHistory || []).reduce((sum, record) => sum + Number(record.amount || 0), 0)
        const paidFromCredits = Number(supplierPaymentsByInvoice[purchase.invoiceNumber] || 0)
        const paidAmount = paidFromHistory + paidFromCredits
        const outstandingAmount = Math.max(purchaseAmount - paidAmount, 0)
        return {
          invoiceNumber: purchase.invoiceNumber,
          date: purchase.date || purchase.createdAt || "",
          vendorName: purchase.supplierName,
          purchaseAmount,
          paidAmount,
          outstandingAmount,
          paymentStatus: outstandingAmount <= 0 ? "paid" : purchase.paymentStatus || "pending",
        }
      })
  }, [purchaseRecords, supplierPaymentsByInvoice])

  const allPayments = useMemo<PaymentRow[]>(() => {
    const customerPaymentRows: PaymentRow[] = customerCredits.map((payment) => ({
      date: payment.createdAt,
      reference: payment.invoiceNumber || payment.id,
      partyType: "client",
      partyName: payment.customerName,
      amount: Number(payment.amount || 0),
      source: "Sales Payment",
      status: payment.status,
    }))

    const supplierPaymentRows: PaymentRow[] = supplierCredits.map((payment) => ({
      date: payment.createdAt,
      reference: payment.invoiceNumber || payment.id,
      partyType: "vendor",
      partyName: payment.supplierName,
      amount: Number(payment.amount || 0),
      source: "Purchase Payment",
      status: payment.status,
    }))

    const purchaseHistoryRows: PaymentRow[] = purchaseRecords.flatMap((purchase) =>
      (purchase.paymentHistory || []).map((payment) => ({
        date: payment.date,
        reference: purchase.invoiceNumber,
        partyType: "vendor" as const,
        partyName: purchase.supplierName,
        amount: Number(payment.amount || 0),
        source: "Purchase Payment History",
        status: purchase.paymentStatus || "paid",
      }))
    )

    return [...customerPaymentRows, ...supplierPaymentRows, ...purchaseHistoryRows].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    )
  }, [customerCredits, supplierCredits, purchaseRecords])

  const summary = useMemo(() => {
    const totalClientSales = clientLedgerRows.reduce((sum, row) => sum + row.saleAmount, 0)
    const totalClientPaid = clientLedgerRows.reduce((sum, row) => sum + row.paidAmount, 0)
    const totalClientOutstanding = clientLedgerRows.reduce((sum, row) => sum + row.outstandingAmount, 0)

    const totalVendorPurchases = vendorLedgerRows.reduce((sum, row) => sum + row.purchaseAmount, 0)
    const totalVendorPaid = vendorLedgerRows.reduce((sum, row) => sum + row.paidAmount, 0)
    const totalVendorOutstanding = vendorLedgerRows.reduce((sum, row) => sum + row.outstandingAmount, 0)

    return {
      totalClientSales,
      totalClientPaid,
      totalClientOutstanding,
      totalVendorPurchases,
      totalVendorPaid,
      totalVendorOutstanding,
      netOutstanding: totalClientOutstanding - totalVendorOutstanding,
    }
  }, [clientLedgerRows, vendorLedgerRows])

  const exportClientCSV = () => {
    const csv = arrayToCSV(
      clientLedgerRows.map((row) => ({
        date: row.date,
        invoiceNumber: row.invoiceNumber,
        clientName: row.clientName,
        saleAmount: row.saleAmount,
        paidAmount: row.paidAmount,
        outstandingAmount: row.outstandingAmount,
        paymentStatus: row.paymentStatus,
      })),
      ["date", "invoiceNumber", "clientName", "saleAmount", "paidAmount", "outstandingAmount", "paymentStatus"]
    )
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `client-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportVendorCSV = () => {
    const csv = arrayToCSV(
      vendorLedgerRows.map((row) => ({
        date: row.date,
        invoiceNumber: row.invoiceNumber,
        vendorName: row.vendorName,
        purchaseAmount: row.purchaseAmount,
        paidAmount: row.paidAmount,
        outstandingAmount: row.outstandingAmount,
        paymentStatus: row.paymentStatus,
      })),
      ["date", "invoiceNumber", "vendorName", "purchaseAmount", "paidAmount", "outstandingAmount", "paymentStatus"]
    )
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `vendor-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPaymentsCSV = () => {
    const csv = arrayToCSV(
      allPayments.map((row) => ({
        date: row.date,
        reference: row.reference,
        partyType: row.partyType,
        partyName: row.partyName,
        amount: row.amount,
        source: row.source,
        status: row.status,
      })),
      ["date", "reference", "partyType", "partyName", "amount", "source", "status"]
    )
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `all-payments-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Client Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-red-600">{formatCurrency(summary.totalClientOutstanding)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Vendor Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-orange-600">{formatCurrency(summary.totalVendorOutstanding)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Client Paid</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-green-600">{formatCurrency(summary.totalClientPaid)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Outstanding</CardTitle>
          </CardHeader>
          <CardContent className={`text-xl font-bold ${summary.netOutstanding >= 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(summary.netOutstanding)}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="client" className="space-y-4">
        <TabsList>
          <TabsTrigger value="client">Client Ledger</TabsTrigger>
          <TabsTrigger value="vendor">Vendor Ledger</TabsTrigger>
          <TabsTrigger value="payments">All Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="client" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Client General Ledger (Sales)</h2>
            <Button onClick={exportClientCSV}>Export CSV</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Sale</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center">Loading ledger...</TableCell>
                </TableRow>
              ) : clientLedgerRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center">No client ledger records found.</TableCell>
                </TableRow>
              ) : (
                clientLedgerRows.map((row) => (
                  <TableRow key={`client-${row.invoiceNumber}`}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>{row.invoiceNumber}</TableCell>
                    <TableCell>{row.clientName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.saleAmount)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(row.paidAmount)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(row.outstandingAmount)}</TableCell>
                    <TableCell className="uppercase">{row.paymentStatus}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="vendor" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Vendor General Ledger (Purchases)</h2>
            <Button onClick={exportVendorCSV}>Export CSV</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Purchase</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center">Loading ledger...</TableCell>
                </TableRow>
              ) : vendorLedgerRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center">No vendor ledger records found.</TableCell>
                </TableRow>
              ) : (
                vendorLedgerRows.map((row) => (
                  <TableRow key={`vendor-${row.invoiceNumber}`}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>{row.invoiceNumber}</TableCell>
                    <TableCell>{row.vendorName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.purchaseAmount)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(row.paidAmount)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(row.outstandingAmount)}</TableCell>
                    <TableCell className="uppercase">{row.paymentStatus}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="payments" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Payments Ledger</h2>
            <Button onClick={exportPaymentsCSV}>Export CSV</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Party</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center">Loading payments...</TableCell>
                </TableRow>
              ) : allPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center">No payment records found.</TableCell>
                </TableRow>
              ) : (
                allPayments.map((payment, index) => (
                  <TableRow key={`${payment.reference}-${payment.date}-${index}`}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell>{payment.reference}</TableCell>
                    <TableCell className="uppercase">{payment.partyType}</TableCell>
                    <TableCell>{payment.partyName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.source}</TableCell>
                    <TableCell className="uppercase">{payment.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}
