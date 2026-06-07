import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Phone, 
  MapPin, 
  FileText,
  Eye,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { type SaleRecord, type CreditSalePaymentRecord, type Customer } from '@/lib/firebase-services'

interface CustomerProfileCardProps {
  customer: Customer
  sales: SaleRecord[]
  paymentRecords: CreditSalePaymentRecord[]
  onViewDetails: (sale: SaleRecord) => void
  onMakePayment: (customer: Customer, sales: SaleRecord[], paymentRecords: CreditSalePaymentRecord[]) => void
}

export function CustomerProfileCard({ 
  customer, 
  sales, 
  paymentRecords, 
  onViewDetails, 
  onMakePayment 
}: CustomerProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate customer totals
  const totalAmount = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
  const totalPaid = sales.reduce((sum, sale) => {
    const paymentRecord = paymentRecords.find(pr => pr.saleId === sale.id)
    return sum + (paymentRecord ? paymentRecord.totalAmount - paymentRecord.remainingAmount : 0)
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

  // Sort sales by date and time (latest first)
  const sortedSales = [...sales].sort((a, b) => {
    // Create date objects for comparison
    const aDate = new Date(a.createdAt || a.date)
    const bDate = new Date(b.createdAt || b.date)
    
    // If we have time information, add it to the date
    if (a.time) {
      const timeMatch = a.time.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i)
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10)
        const minutes = parseInt(timeMatch[2], 10)
        const seconds = parseInt(timeMatch[3], 10)
        const ampm = timeMatch[4].toUpperCase()
        
        if (ampm === 'PM' && hours !== 12) hours += 12
        if (ampm === 'AM' && hours === 12) hours = 0
        
        aDate.setHours(hours, minutes, seconds, 0)
      }
    }
    
    if (b.time) {
      const timeMatch = b.time.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i)
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10)
        const minutes = parseInt(timeMatch[2], 10)
        const seconds = parseInt(timeMatch[3], 10)
        const ampm = timeMatch[4].toUpperCase()
        
        if (ampm === 'PM' && hours !== 12) hours += 12
        if (ampm === 'AM' && hours === 12) hours = 0
        
        bDate.setHours(hours, minutes, seconds, 0)
      }
    }
    
    return bDate.getTime() - aDate.getTime() // Latest first
  })

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{customer.name}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3" />
                  <span>{customer.phone}</span>
                </div>
                {customer.address && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-32">{customer.address}</span>
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
            onClick={() => onMakePayment(customer, sales, paymentRecords)}
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
              <h4 className="font-medium text-sm text-muted-foreground">Bills ({sales.length})</h4>
              {sortedSales.map((sale) => {
                const paymentRecord = paymentRecords.find(pr => pr.saleId === sale.id)
                const saleTotal = sale.total || 0
                const salePaid = paymentRecord ? paymentRecord.totalAmount - paymentRecord.remainingAmount : 0
                const saleRemaining = paymentRecord ? paymentRecord.remainingAmount : saleTotal
                const saleProgress = saleTotal > 0 ? (salePaid / saleTotal) * 100 : 0

                return (
                  <div key={sale.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{sale.invoiceNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {sale.date}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(sale)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="ml-1 font-medium">Rs{saleTotal.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Paid:</span>
                        <span className="ml-1 font-medium text-green-600">Rs{salePaid.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="ml-1 font-medium text-orange-600">Rs{saleRemaining.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{saleProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={saleProgress} className="h-1" />
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
