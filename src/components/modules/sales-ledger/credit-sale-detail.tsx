"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, DollarSign, Calendar, Phone, MapPin, Plus, Eye } from "lucide-react"
import { CreditSalePaymentService, type CreditSalePaymentRecord } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import { AddPaymentDialog } from "./add-payment-dialog"
import { PaymentHistory } from "./payment-history"

interface CreditSaleDetailProps {
  paymentRecord: CreditSalePaymentRecord
  onBack: () => void
  onPaymentAdded?: () => void
}

export const CreditSaleDetail = memo(function CreditSaleDetail({ 
  paymentRecord, 
  onBack, 
  onPaymentAdded 
}: CreditSaleDetailProps) {
  const [currentPaymentRecord, setCurrentPaymentRecord] = useState<CreditSalePaymentRecord>(paymentRecord)
  const [isLoading, setIsLoading] = useState(false)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const { toast } = useToast()

  // Load updated payment record
  const loadPaymentRecord = useCallback(async () => {
    try {
      setIsLoading(true)
      const updatedRecord = await CreditSalePaymentService.getCreditSalePaymentBySaleId(paymentRecord.saleId)
      if (updatedRecord) {
        setCurrentPaymentRecord(updatedRecord)
      }
    } catch (error) {
      console.error("Error loading payment record:", error)
      toast({
        title: "Error",
        description: "Failed to load payment record. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [paymentRecord.saleId, toast])

  useEffect(() => {
    loadPaymentRecord()
  }, [loadPaymentRecord])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressPercentage = () => {
    if (!currentPaymentRecord.totalAmount || currentPaymentRecord.totalAmount === 0) return 0
    const totalPaid = currentPaymentRecord.totalAmount - currentPaymentRecord.remainingAmount
    return (totalPaid / currentPaymentRecord.totalAmount) * 100
  }

  const handlePaymentAdded = () => {
    loadPaymentRecord()
    onPaymentAdded?.()
  }

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="default" 
            size="sm" 
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="default" 
          size="sm" 
          onClick={onBack}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Payment Details - {currentPaymentRecord.invoiceNumber || 'N/A'}
          </h2>
          <p className="text-muted-foreground">Manage installment payments for this credit sale</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs{(currentPaymentRecord.totalAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Original sale amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs{((currentPaymentRecord.totalAmount || 0) - (currentPaymentRecord.remainingAmount || 0)).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total payments received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              Rs{(currentPaymentRecord.remainingAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Outstanding balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getStatusColor(currentPaymentRecord.status || 'pending')}>
                {(currentPaymentRecord.status || 'pending').toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Payment status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">{currentPaymentRecord.customerName || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{currentPaymentRecord.customerPhone || 'N/A'}</p>
              {currentPaymentRecord.customerAddress && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {currentPaymentRecord.customerAddress}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleCallCustomer(currentPaymentRecord.customerPhone || '')}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Customer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payment Progress
          </CardTitle>
          <CardDescription>
            {(currentPaymentRecord.payments || []).length} payment(s) received
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Progress</span>
              <span className="text-sm text-muted-foreground">
                {getProgressPercentage().toFixed(1)}%
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Rs{((currentPaymentRecord.totalAmount || 0) - (currentPaymentRecord.remainingAmount || 0)).toLocaleString()} paid</span>
              <span>Rs{(currentPaymentRecord.remainingAmount || 0).toLocaleString()} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage payments for this credit sale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsAddPaymentOpen(true)}
              disabled={(currentPaymentRecord.remainingAmount || 0) <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
            {(currentPaymentRecord.remainingAmount || 0) <= 0 && (
              <p className="text-sm text-muted-foreground flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                This sale is fully paid
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <PaymentHistory paymentRecord={currentPaymentRecord} />

      {/* Add Payment Dialog */}
      <AddPaymentDialog
        open={isAddPaymentOpen}
        onOpenChange={setIsAddPaymentOpen}
        paymentRecord={currentPaymentRecord}
        onPaymentAdded={handlePaymentAdded}
      />
    </div>
  )
})
