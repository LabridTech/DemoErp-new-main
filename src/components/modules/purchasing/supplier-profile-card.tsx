import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  Phone, 
  MapPin, 
  FileText,
  Eye,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { type Purchase, type Supplier } from '@/lib/firebase-services'

interface SupplierProfileCardProps {
  supplier: Supplier
  purchases: Purchase[]
  onViewDetails: (purchase: Purchase) => void
  onMakePayment: (supplier: Supplier, purchases: Purchase[]) => void
}

export function SupplierProfileCard({ 
  supplier, 
  purchases, 
  onViewDetails, 
  onMakePayment 
}: SupplierProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate supplier totals
  const totalAmount = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0)
  const totalPaid = purchases.reduce((sum, purchase) => {
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

  // Sort purchases by date (latest first)
  const sortedPurchases = [...purchases].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{supplier.name}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3" />
                  <span>{supplier.phone}</span>
                </div>
                {supplier.address && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-32">{supplier.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={statusInfo.color}>
              {statusInfo.status.toUpperCase()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Summary Section */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">Rs{totalAmount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Amount</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">Rs{totalPaid.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Amount Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">Rs{totalRemaining.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Payment Progress</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mb-4">
          <Button
            onClick={() => onMakePayment(supplier, purchases)}
            className="flex-1"
            disabled={totalRemaining <= 0}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Make Payment
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isExpanded ? 'Hide Bills' : 'View Bills'}
          </Button>
        </div>

        {/* Bills List - Expandable */}
        {isExpanded && (
          <div className="space-y-3">
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Bills ({purchases.length})</h4>
              {sortedPurchases.map((purchase) => {
                const purchaseTotal = purchase.totalAmount || 0
                const purchasePaid = parseFloat(purchase.partialPaymentAmount || "0") || 0
                const purchaseRemaining = purchaseTotal - purchasePaid
                const purchaseProgress = purchaseTotal > 0 ? (purchasePaid / purchaseTotal) * 100 : 0

                return (
                  <div key={purchase.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{purchase.invoiceNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(purchase)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="ml-1 font-medium">Rs{purchaseTotal.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Paid:</span>
                        <span className="ml-1 font-medium text-green-600">Rs{purchasePaid.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="ml-1 font-medium text-orange-600">Rs{purchaseRemaining.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{purchaseProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={purchaseProgress} className="h-1" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
