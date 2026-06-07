"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  FileText,
  Eye,
  ShoppingCart
} from "lucide-react"
import { type Customer, type SaleRecord, type CustomerCredit } from "@/lib/firebase-services"
import { CustomerProfileDetails } from "./customer-profile-details"
import { CustomerLedger } from "./customer-ledger"
import { MiniPOS } from "./mini-pos"

interface CustomerProfilePageProps {
  customer: Customer
  allSales: SaleRecord[]
  paymentRecords: CustomerCredit[]
  onBack: () => void
  onPaymentSuccess: () => void
  onSaleCreated: (sale: SaleRecord) => Promise<void>
}

export function CustomerProfilePage({
  customer,
  allSales,
  paymentRecords,
  onBack,
  onPaymentSuccess,
  onSaleCreated
}: CustomerProfilePageProps) {
  const [activeSection, setActiveSection] = useState<"details" | "ledger" | "mini-pos">("details")

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Get pending sales for this customer
  const pendingSales = allSales.filter(record => {
    const hasPaymentRecord = paymentRecords.some(pr => pr.saleId === record.id)
    return record.paymentStatus === "pending" || hasPaymentRecord
  })

  // Calculate customer totals
  const totalAmount = allSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
  const totalCredits = paymentRecords.reduce((sum, credit) => {
    return sum + (credit.type === "credit" ? credit.amount : 0)
  }, 0)
  const totalRemaining = totalAmount - totalCredits
  const progressPercentage = totalAmount > 0 ? (totalCredits / totalAmount) * 100 : 0

  // Debug logging
  console.log('Customer Profile Debug:', {
    customerName: customer.name,
    customerPhone: customer.phone,
    allSalesCount: allSales.length,
    allSales: allSales.map(s => ({ id: s.id, total: s.total, customerName: s.customerName, customerPhone: s.customerPhone })),
    paymentRecordsCount: paymentRecords.length,
    paymentRecords: paymentRecords.map(p => ({ id: p.id, customerId: p.customerId, amount: p.amount, type: p.type, customerName: p.customerName })),
    totalAmount,
    totalCredits,
    totalRemaining
  })

  // Get status based on remaining amount
  const getStatus = () => {
    if (totalRemaining <= 0) return { status: 'paid', color: 'bg-green-100 text-green-800' }
    if (totalCredits > 0) return { status: 'partial', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'pending', color: 'bg-gray-100 text-gray-800' }
  }

  const statusInfo = getStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{customer.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.address && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {allSales.length} sale{allSales.length !== 1 ? 's' : ''}
                </div>
                {totalRemaining > 0 && (
                  <div className="text-sm text-orange-600 font-medium">
                    Rs{totalRemaining.toLocaleString()} pending
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Badge className={`${statusInfo.color} text-sm px-3 py-1`}>
                  {statusInfo.status.toUpperCase()}
                </Badge>
                <div className="w-20">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Section Navigation */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as "details" | "ledger" | "mini-pos")}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Payment Details
              </TabsTrigger>
              <TabsTrigger value="mini-pos" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Mini POS
              </TabsTrigger>
              <TabsTrigger value="ledger" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Transaction Ledger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="p-0">
              <CustomerProfileDetails
                customer={customer}
                sales={pendingSales}
                paymentRecords={paymentRecords}
                onBack={onBack}
                onPaymentSuccess={onPaymentSuccess}
                onSaleCreated={onSaleCreated}
              />
            </TabsContent>

            <TabsContent value="mini-pos" className="p-0">
              <MiniPOS
                customer={customer}
                onSaleCreated={onSaleCreated}
                onClose={() => setActiveSection("details")}
              />
            </TabsContent>

            <TabsContent value="ledger" className="p-0">
              <CustomerLedger
                customerId={customer.id}
                customerName={customer.name}
                customerPhone={customer.phone}
                customerAddress={customer.address}
                initialBalance={0}
                onBack={onBack}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
