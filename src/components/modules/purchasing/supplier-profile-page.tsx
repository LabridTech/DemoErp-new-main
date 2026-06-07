"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Building2, 
  Phone, 
  MapPin, 
  FileText,
  Eye,
  Package
} from "lucide-react"
import { type Supplier, type Purchase, type SupplierCredit } from "@/lib/firebase-services"
import { SupplierProfileDetails } from "./supplier-profile-details"
import { SupplierLedgerPurchase } from "./supplier-ledger-purchase"
import { MiniPurchase } from "./mini-purchase"

interface SupplierProfilePageProps {
  supplier: Supplier
  allPurchases: Purchase[]
  credits: SupplierCredit[]
  onBack: () => void
  onPaymentSuccess: () => void
  onPurchaseCreated: (purchase: Purchase) => Promise<void>
}

export function SupplierProfilePage({
  supplier,
  allPurchases,
  credits,
  onBack,
  onPaymentSuccess,
  onPurchaseCreated
}: SupplierProfilePageProps) {
  const [activeSection, setActiveSection] = useState<"details" | "ledger" | "mini-purchase">("details")

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Get credit purchases for this supplier
  const creditPurchases = allPurchases.filter(record => 
    record.paymentMethod === "credit" && (record.paymentStatus === "pending" || record.paymentStatus === "paid")
  )

  // Calculate supplier totals
  const totalAmount = allPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0)
  const totalPaid = allPurchases.reduce((sum, purchase) => {
    const partialAmount = parseFloat(purchase.partialPaymentAmount || "0") || 0
    return sum + partialAmount
  }, 0)
  const totalRemaining = totalAmount - totalPaid
  const progressPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0

  // Get status based on remaining amount
  const getStatus = () => {
    if (totalRemaining <= 0) return { status: 'paid', color: 'bg-green-100 text-green-800' }
    if (totalPaid > 0) return { status: 'partial', color: 'bg-yellow-100 text-yellow-800' }
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
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{supplier.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{supplier.phone}</span>
                    </div>
                    {supplier.address && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{supplier.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {allPurchases.length} purchase{allPurchases.length !== 1 ? 's' : ''}
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
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as "details" | "ledger" | "mini-purchase")}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Payment Details
              </TabsTrigger>
              <TabsTrigger value="mini-purchase" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Mini Purchase
              </TabsTrigger>
              <TabsTrigger value="ledger" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Transaction Ledger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="p-0">
              <SupplierProfileDetails
                supplier={supplier}
                purchases={creditPurchases}
                credits={credits}
                onBack={onBack}
                onPaymentSuccess={onPaymentSuccess}
                onPurchaseCreated={onPurchaseCreated}
              />
            </TabsContent>

            <TabsContent value="mini-purchase" className="p-0">
              <MiniPurchase
                supplier={supplier}
                onPurchaseCreated={onPurchaseCreated}
                onClose={() => setActiveSection("details")}
              />
            </TabsContent>

            <TabsContent value="ledger" className="p-0">
              <SupplierLedgerPurchase
                supplierId={supplier.id}
                supplierName={supplier.name}
                supplierPhone={supplier.phone}
                supplierAddress={supplier.address}
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
