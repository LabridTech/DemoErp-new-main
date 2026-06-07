"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, DollarSign, Calendar, Phone, MapPin, Plus, Eye, Building2 } from "lucide-react"
import { PurchaseService, type Purchase } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import { AddPurchasePaymentDialog } from "./add-purchase-payment-dialog"
import { PurchasePaymentHistory } from "./purchase-payment-history"

interface PurchasePaymentDetailProps {
  purchase: Purchase
  onBack: () => void
  onPaymentAdded?: () => void
}

export const PurchasePaymentDetail = memo(function PurchasePaymentDetail({ 
  purchase, 
  onBack, 
  onPaymentAdded 
}: PurchasePaymentDetailProps) {
  const [currentPurchase, setCurrentPurchase] = useState<Purchase>(purchase)
  const [isLoading, setIsLoading] = useState(false)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const { toast } = useToast()

  // Load updated purchase record
  const loadPurchaseRecord = useCallback(async () => {
    try {
      setIsLoading(true)
      const updatedPurchase = await PurchaseService.getPurchaseById(purchase.id)
      if (updatedPurchase) {
        setCurrentPurchase(updatedPurchase)
      }
    } catch (error) {
      console.error("Error loading purchase record:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase record. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [purchase.id, toast])

  useEffect(() => {
    loadPurchaseRecord()
  }, [loadPurchaseRecord])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressPercentage = () => {
    if (!currentPurchase.totalAmount || currentPurchase.totalAmount === 0) return 0
    const partialAmount = parseFloat(currentPurchase.partialPaymentAmount || "0") || 0
    const totalPaid = partialAmount
    return (totalPaid / currentPurchase.totalAmount) * 100
  }

  const handlePaymentAdded = () => {
    loadPurchaseRecord()
    onPaymentAdded?.()
  }

  const handleCallSupplier = (phone: string) => {
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
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const partialAmount = parseFloat(currentPurchase.partialPaymentAmount || "0") || 0
  const remainingAmount = currentPurchase.totalAmount - partialAmount
  const progressPercentage = getProgressPercentage()

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Purchase Payment Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Invoice #{currentPurchase.invoiceNumber}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  Rs{currentPurchase.totalAmount?.toLocaleString() || 0}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Amount</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Rs{partialAmount.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  Rs{remainingAmount.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                <Badge className={getStatusColor(currentPurchase.paymentStatus || "pending")}>
                  {currentPurchase.paymentStatus || "Pending"}
                </Badge>
              </div>
              <Calendar className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Payment Progress</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">Total Amount</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                Rs{currentPurchase.totalAmount?.toLocaleString() || 0}
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-medium text-blue-900 dark:text-blue-200">Paid Amount</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                Rs{partialAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="font-medium text-red-900 dark:text-red-200">Remaining</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                Rs{remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Supplier Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{currentPurchase.supplierName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPurchase.supplierPhone}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPurchase.supplierAddress}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(currentPurchase.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Payment Method: {currentPurchase.paymentMethod || "Not specified"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Purchase Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentPurchase.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code: {item.code} | Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Rs{item.subtotal?.toLocaleString() || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rs{item.unitPrice?.toLocaleString() || 0} each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Payment Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => setIsAddPaymentOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={remainingAmount <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleCallSupplier(currentPurchase.supplierPhone)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Supplier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <PurchasePaymentHistory purchaseId={currentPurchase.id} />

      {/* Add Payment Dialog */}
      <AddPurchasePaymentDialog
        open={isAddPaymentOpen}
        onOpenChange={setIsAddPaymentOpen}
        purchase={currentPurchase}
        onPaymentAdded={handlePaymentAdded}
      />
    </div>
  )
})
