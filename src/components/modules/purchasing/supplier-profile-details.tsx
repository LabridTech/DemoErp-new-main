import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatTime } from '@/lib/date-utils'
import { 
  Building2, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Receipt,
  MessageSquare,
  CreditCard,
  Plus
} from 'lucide-react'
import { type Purchase, type Supplier, type SupplierCredit, SupplierCreditService } from '@/lib/firebase-services'
import { useToast } from '@/hooks/use-toast'

interface SupplierProfileDetailsProps {
  supplier: Supplier
  purchases: Purchase[]
  credits: SupplierCredit[]
  onBack: () => void
  onPaymentSuccess: () => void
  onPurchaseCreated?: (purchase: Purchase) => Promise<void>
}

export function SupplierProfileDetails({ 
  supplier, 
  purchases, 
  credits,
  onBack,
  onPaymentSuccess
}: SupplierProfileDetailsProps) {
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  const { toast } = useToast()

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Calculate supplier totals
  const totalAmount = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0)
  
  // Calculate total payments from supplier credits (global payment system)
  const totalPaid = credits
    .filter(credit => credit.type === "credit")
    .reduce((sum, credit) => sum + (credit.amount || 0), 0)
  
  const totalRemaining = totalAmount - totalPaid
  const progressPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0

  // Get status based on remaining amount
  const getStatus = () => {
    if (totalRemaining <= 0) return { status: 'paid', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    return { status: 'pending', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
  }

  const statusInfo = getStatus()
  const StatusIcon = statusInfo.icon

  // Sort purchases by date and time (latest first)
  const sortedPurchases = [...purchases].sort((a, b) => {
    // Create date objects for comparison
    const aDate = new Date(a.createdAt || a.date || new Date())
    const bDate = new Date(b.createdAt || b.date || new Date())
    
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

  const validatePaymentAmount = (amount: string) => {
    if (!amount || amount.trim() === "") {
      setPaymentError("")
      return false
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setPaymentError("Please enter a valid payment amount")
      return false
    }

    if (numAmount > totalRemaining) {
      setPaymentError(`Payment amount cannot exceed remaining balance of Rs${totalRemaining.toLocaleString()}`)
      return false
    }

    setPaymentError("")
    return true
  }

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPaymentAmount(value)
    validatePaymentAmount(value)
  }

  const handleMakePayment = async () => {
    if (!validatePaymentAmount(paymentAmount)) {
      return
    }

    try {
      setIsProcessingPayment(true)
      
      const totalPaymentAmount = parseFloat(paymentAmount)
      
      console.log("Processing global payment:", totalPaymentAmount)
      console.log("Total remaining balance:", totalRemaining)
      
      if (totalRemaining <= 0) {
        toast({
          title: "No Pending Amount",
          description: "No pending amounts found to apply payment to.",
          variant: "destructive",
        })
        return
      }

      // Create a single credit entry for the global payment
      const paymentData = {
        supplierId: purchases[0]?.supplierId || '',
        type: "credit" as const,
        amount: totalPaymentAmount,
        reason: `Payment via ${paymentMethod}`,
        description: `Global payment against pending balance`,
        createdAt: new Date().toISOString(),
      }

      await SupplierCreditService.create("supplierCredits", paymentData)

      toast({
        title: "Payment Successful",
        description: `Payment of Rs${totalPaymentAmount.toLocaleString()} has been recorded against the pending balance`,
      })

      setPaymentAmount("")
      setPaymentError("")
      onPaymentSuccess()
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }



  // Print invoice handler (exact same as purchase ledger)
  const handlePrintInvoice = async (purchase: Purchase) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const invoiceHtml = generatePurchaseInvoiceHTML(purchase)
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  // Thermal print handler (exact same as purchase ledger)
  const handleThermalPrint = async (purchase: Purchase) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    if (!printWindow) return

    const thermalHtml = generateThermalPurchaseInvoiceHTML(purchase)
    printWindow.document.write(thermalHtml)
    printWindow.document.close()
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  // WhatsApp invoice handler (exact same as purchase ledger)
  const handleWhatsAppInvoice = async (purchase: Purchase) => {
    if (!purchase.supplierPhone) {
      toast({
        title: "Missing Phone Number",
        description: "Supplier phone number not available for WhatsApp",
        variant: "destructive",
      })
      return
    }

    const phone = purchase.supplierPhone.startsWith("0") && purchase.supplierPhone.length === 11 
      ? purchase.supplierPhone.replace("0", "+92")
      : purchase.supplierPhone.startsWith("+92") 
        ? purchase.supplierPhone 
        : `+92${purchase.supplierPhone}`

    const message = `Hi ${purchase.supplierName}! Your purchase invoice #${purchase.invoiceNumber} is ready. Please check the details.`
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }


  // Generate purchase invoice HTML (exact same as purchase ledger)
  const generatePurchaseInvoiceHTML = (purchase: Purchase) => {
    return `
      <html>
        <head>
          <title>Purchase Invoice</title>
          <style>
            @media print {
              @page {
                margin: 0.25in;
                size: A4;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                width: 100%;
                max-width: 100%;
              }
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: 100vh;
              background: white;
              color: #000;
              font-size: 9px;
            }
            .invoice-container {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
              padding: 0;
              box-sizing: border-box;
              overflow: hidden;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              margin-bottom: 8px; 
              border-bottom: 1px solid #333; 
              padding-bottom: 6px; 
            }
            .company-info { flex: 1; }
            .company-name { 
              font-size: 14px; 
              font-weight: bold; 
              margin-bottom: 4px; 
              color: #333; 
              text-align: center; 
            }
            .company-details { 
              font-size: 8px; 
              color: #666; 
              line-height: 1.2; 
              margin-bottom: 3px; 
              padding: 2px 0; 
            }
            .invoice-details { 
              background: #f8f9fa; 
              padding: 6px; 
              border-radius: 3px; 
              margin-bottom: 8px; 
              font-size: 8px; 
              border: 1px solid #e0e0e0;
            }
            .invoice-details p { 
              margin: 2px 0; 
              font-size: 8px; 
            }
            .section-separator {
              width: 100%;
              border: none;
              border-top: 1px dashed #2196f3;
              margin: 2px 0 4px 0;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 8px 0; 
              font-size: 8px; 
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 3px 2px; 
              text-align: left; 
              font-size: 8px; 
            }
            th { 
              background: #f5f5f5; 
              font-weight: bold; 
              color: #333; 
              font-size: 8px; 
            }
            tbody td { 
              font-size: 8px; 
            }
            .text-right { 
              text-align: right; 
            }
            .totals { 
              margin-top: 8px; 
            }
            .totals td, .totals .total-row { 
              font-size: 8px; 
            }
            .totals table { 
              border: none; 
              width: 200px;
              margin-left: auto;
            }
            .totals td { 
              border: none; 
              padding: 2px 0; 
              font-size: 8px; 
            }
            .totals .total-row { 
              font-weight: bold; 
              font-size: 9px; 
              border-top: 1px solid #333; 
              padding-top: 2px;
            }
            .discount-row { 
              color: #d32f2f; 
              font-weight: bold; 
            }
            .thank-you { 
              text-align: center; 
              margin-top: 8px; 
              padding: 4px; 
              font-size: 8px; 
            }
            .thank-you h3 { 
              margin-top: 0; 
              margin-bottom: 2px; 
              font-size: 9px; 
              color: #1976d2; 
            }
            .thank-you p { 
              margin: 1px 0; 
              color: #555; 
              font-size: 7px; 
            }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
            .brand-section { display: flex; align-items: flex-start; gap: 16px; }
            .logo-container { display: flex; flex-direction: column; align-items: flex-start; }
            .logo-and-text { display: flex; align-items: center; gap: 12px; }
            .brand-logo { width: 90px; height: 90px; border-radius: 50%; border: 2px solid #ddd; object-fit: cover; background: #fff; }
            .brand-name { font-size: 32px; font-weight: 900; color: #222; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-info">
              <div class="header-top">
                <div class="brand-section">
                  <div class="logo-container">
                    <div class="logo-and-text">
                      <img 
                        src="${window.location.origin}/bs.jpg" 
                        alt="Bin Sultan Logo" 
                        class="brand-logo"
                        onerror="this.style.display='none';"
                      />
                      <span class="brand-name">Bin Sultan Fabrics</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                <div class="company-details" style="flex: 1; padding-right: 20px;">
                  Premium Fabrics, Textiles & Garment Materials<br/>
                  Contact No. : 0321-7590700<br/>
                  Email: bin.sultanfabrics@gmail.com<br/>
                  Address: 99/B, Liberty Plaza, Gulberg
                </div>
                <div class="invoice-details" style="flex: 1; padding-left: 20px;">
                  <p><strong>Purchase Invoice #:</strong> ${purchase.invoiceNumber}</p>
                  <p><strong>Date:</strong> ${formatDate(purchase.date || new Date())} | <strong>Time:</strong> ${purchase.time || (purchase.createdAt ? new Date(purchase.createdAt).toLocaleTimeString() : 'N/A')}</p>
                  <p><strong>Supplier:</strong> ${purchase.supplierName}</p>
                  <p><strong>Supplier Address:</strong> ${purchase.supplierAddress || 'N/A'}</p>
                  <p><strong>Contact:</strong> ${purchase.supplierPhone}</p>
                  <p><strong>Staff Member:</strong> ${purchase.staffName}</p>
                </div>
              </div>
            </div>
          </div>
            
          <table style="font-size: 12px;">
            <thead>
            <tr>
              <th style="font-size: 12px;">Product Name</th>
              <th class="text-right" style="font-size: 12px;">Quantity(Per Yard)</th>
              <th class="text-right" style="font-size: 12px;">Price Per Unit</th>
              <th class="text-right" style="font-size: 12px;">Total</th>
            </tr>
            </thead>
            <tbody>
              ${purchase.items?.map((item) => `
                <tr>
                  <td style="font-size: 12px;">${item.name || 'N/A'}</td>
                  <td class="text-right" style="font-size: 12px;">${item.quantity || 0}${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? ` + ${item.tradeDiscountFreeItems}(TD)` : ''}</td>
                  <td class="text-right" style="font-size: 12px;">Rs${(item.unitPrice || 0).toLocaleString()}</td>
                  <td class="text-right" style="font-size: 12px;">Rs${((item.unitPrice || 0) * (item.quantity || 0)).toLocaleString()}</td>
                </tr>
              `).join('') || '<tr><td colspan="4" class="text-center">No items found</td></tr>'}
            </tbody>
          </table>
            
          <div style="display: flex; justify-content: flex-end; align-items: flex-end; margin-top: 18px;">
            <div class="totals">
              <table style="width: 300px; margin: 0;">
              <tr><td><strong>Subtotal:</strong></td><td class="text-right">Rs${(purchase.subtotal || 0).toLocaleString()}</td></tr>
              <tr class="discount-row">
                <td><strong>Total Discount: (${(purchase.totalDiscount || 0) > 0 && (purchase.subtotal || 0) > 0 ? Math.round(((purchase.totalDiscount || 0) / (purchase.subtotal || 0)) * 100) : 0}%)</strong></td>
                <td class="text-right">-Rs${(purchase.totalDiscount || 0).toLocaleString()}</td>
              </tr>
              <tr class="total-row"><td><strong>TOTAL:</strong></td><td class="text-right">Rs${(purchase.totalAmount || 0).toLocaleString()}</td></tr>
              </table>
            </div>
          </div>
          
          <div style="margin-top: 40px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #1976d2; font-weight: 500;">Thank you for ordering with us</p>
            <p style="margin: 2px 0; color: #555; font-size: 10px;">For any queries or support, please contact us at <strong>0321-7590700</strong></p>
            <p style="margin: 2px 0 0 0; color: #555; font-size: 10px;"><strong>Visit us again!</strong></p>
          </div>
          </div>
        </body>
      </html>
    `
  }

  // Generate thermal purchase invoice HTML (exact same as purchase ledger)
  const generateThermalPurchaseInvoiceHTML = (purchase: Purchase) => {
    return `
      <html>
        <head>
          <title>Thermal Purchase Invoice</title>
          <style>
            @media print {
              @page {
                margin: 0;
                size: 80mm auto;
              }
              body {
                margin: 0 !important;
                padding: 2mm !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 2mm;
              max-width: 80mm;
              background: white;
              color: black;
            }
            .header { text-align: center; margin-bottom: 8px; }
            .company-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            .company-details { font-size: 10px; margin-bottom: 4px; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            .invoice-info { margin-bottom: 6px; }
            .invoice-info p { margin: 1px 0; font-size: 10px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 4px 0; }
            .items-table td { padding: 1px 0; font-size: 10px; }
            .item-name { width: 40%; }
            .item-qty { width: 15%; text-align: right; }
            .item-price { width: 20%; text-align: right; }
            .item-total { width: 25%; text-align: right; }
            .totals { margin-top: 6px; }
            .totals p { margin: 1px 0; font-size: 10px; }
            .total-line { font-weight: bold; border-top: 1px solid #000; padding-top: 2px; }
            .footer { text-align: center; margin-top: 8px; font-size: 9px; }
            .center { text-align: center; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">BIN SULTAN FABRICS</div>
            <div class="company-details">
              99/B, Liberty Plaza, Gulberg<br/>
              Contact: 0321-7590700<br/>
              Email: bin.sultanfabrics@gmail.com
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="invoice-info">
            <p><strong>Purchase Invoice #:</strong> ${purchase.invoiceNumber}</p>
            <p><strong>Date:</strong> ${formatDate(purchase.createdAt || new Date())} | <strong>Time:</strong> ${purchase.time || (purchase.createdAt ? new Date(purchase.createdAt).toLocaleTimeString() : 'N/A')}</p>
            <p><strong>Supplier:</strong> ${purchase.supplierName}</p>
            ${purchase.supplierPhone ? `<p><strong>Phone:</strong> ${purchase.supplierPhone}</p>` : ''}
            <p><strong>Staff:</strong> ${purchase.staffMember || 'System'}</p>
          </div>
          
          <div class="divider"></div>
          
          <table class="items-table">
            <tr>
              <td class="item-name"><strong>ITEM</strong></td>
              <td class="item-qty"><strong>QTY</strong></td>
              <td class="item-price"><strong>PRICE</strong></td>
              <td class="item-total"><strong>TOTAL</strong></td>
            </tr>
            ${purchase.items?.map((item) => {
              const totalPrice = (item.unitPrice || 0) * (item.quantity || 0);
              return `
              <tr>
                <td class="item-name">${item.name || 'N/A'}</td>
                <td class="item-qty">${item.quantity || 0}${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? `+${item.tradeDiscountFreeItems}` : ''}</td>
                <td class="item-price">${(item.unitPrice || 0).toLocaleString()}</td>
                <td class="item-total">${totalPrice.toLocaleString()}</td>
              </tr>
              ${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? `
                <tr>
                  <td class="item-name" style="font-size: 9px; color: #666;">  └ Free: ${item.tradeDiscountFreeItems} yard(s)</td>
                  <td class="item-qty"></td>
                  <td class="item-price"></td>
                  <td class="item-total"></td>
                </tr>
              ` : ''}
            `;
            }).join('') || '<tr><td colspan="4" class="center">No items found</td></tr>'}
          </table>
          
          <div class="divider"></div>
          
          <div class="totals">
            <p class="right">Subtotal: Rs${(purchase.subtotal || 0).toLocaleString()}</p>
            ${(purchase.discount || 0) > 0 ? `<p class="right">Discount: -Rs${(purchase.discount || 0).toLocaleString()}</p>` : ''}
            <p class="right total-line">TOTAL: Rs${(purchase.totalAmount || 0).toLocaleString()}</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Visit us again</p>
            <p>For support: 0321-7590700</p>
          </div>
        </body>
      </html>
    `
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Profile</h1>
          <p className="text-muted-foreground">Detailed view of supplier bills and payment history</p>
        </div>
      </div>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{supplier.name}</CardTitle>
                <div className="flex items-center space-x-6 text-muted-foreground mt-2">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{supplier.phone}</span>
                  </div>
                  {supplier.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{supplier.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={`${statusInfo.color} text-sm px-3 py-1`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusInfo.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">Rs{totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total payments made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">Rs{totalRemaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progressPercentage.toFixed(0)}%</div>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Visual Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Visual line showing global due vs paid amounts */}
            <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full flex">
                {/* Paid amount (green) */}
                <div 
                  className="bg-green-500 h-full transition-all duration-300 flex items-center justify-center" 
                  style={{ width: `${progressPercentage}%` }}
                >
                  {progressPercentage > 10 && (
                    <span className="text-white text-xs font-medium">
                      Rs{totalPaid.toLocaleString()}
                    </span>
                  )}
                </div>
                {/* Remaining amount (orange) */}
                <div 
                  className="bg-orange-500 h-full transition-all duration-300 flex items-center justify-center" 
                  style={{ width: `${100 - progressPercentage}%` }}
                >
                  {100 - progressPercentage > 10 && (
                    <span className="text-white text-xs font-medium">
                      Rs{totalRemaining.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">
                  Paid: Rs{totalPaid.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-orange-600">
                  Pending: Rs{totalRemaining.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Global Payment Against Pending Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Payment Form */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="paymentAmount">Global Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  placeholder="Enter payment amount against total pending balance"
                  value={paymentAmount}
                  onChange={handlePaymentAmountChange}
                  max={totalRemaining}
                  className={paymentError ? "border-red-500" : ""}
                />
                {paymentError ? (
                  <p className="text-xs text-red-500 mt-1">{paymentError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Total pending balance: Rs{totalRemaining.toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <Button
                onClick={handleMakePayment}
                disabled={totalRemaining <= 0 || isProcessingPayment || !paymentAmount || !!paymentError}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isProcessingPayment ? "Processing..." : "Record Global Payment"}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Summary
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bills History ({purchases.length} bills)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedPurchases.map((purchase, index) => {
              const purchaseTotal = purchase.totalAmount || 0
              const isPaid = purchase.paymentStatus === "paid"
              const purchaseRemaining = isPaid ? 0 : purchaseTotal

              const getPurchaseStatus = () => {
                if (isPaid) return { status: 'paid', color: 'bg-green-100 text-green-800', icon: CheckCircle }
                return { status: 'pending', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
              }

              const purchaseStatusInfo = getPurchaseStatus()
              const PurchaseStatusIcon = purchaseStatusInfo.icon

              return (
                <div key={purchase.id} className="relative">
                  {/* Bill Number Badge */}
                  <div className="absolute -top-3 left-4 z-10 flex gap-2">
                    <Badge variant="outline" className="bg-background border-2 font-semibold">
                      Bill #{index + 1}
                    </Badge>
                    {index === 0 && (
                      <Badge className="bg-blue-600 text-white border-0 font-bold text-xs px-3 py-1 shadow-md animate-pulse">
                        ⭐ Latest
                      </Badge>
                    )}
                  </div>
                  
                  {/* Main Bill Card */}
                  <Card className={`border-2 shadow-sm hover:shadow-md transition-shadow ${
                    index === 0 
                      ? 'border-blue-400 bg-blue-100/50 dark:bg-blue-950/30 dark:border-blue-600 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800' 
                      : ''
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-primary">{purchase.invoiceNumber}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">{new Date(purchase.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">{new Date(purchase.createdAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge className={`${purchaseStatusInfo.color} text-sm px-4 py-2 font-semibold`}>
                          <PurchaseStatusIcon className="h-4 w-4 mr-2" />
                          {purchaseStatusInfo.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {/* Invoice Actions - Moved directly under bill number */}
                      <div className="mt-4 pt-3 border-t">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => handlePrintInvoice(purchase)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            title="Print Invoice"
                          >
                            <Printer className="h-4 w-4" />
                            Print Invoice
                          </Button>
                          <Button
                            onClick={() => handleThermalPrint(purchase)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            title="Thermal Print"
                          >
                            <Receipt className="h-4 w-4" />
                            Thermal Print
                          </Button>
                          <Button
                            onClick={() => handleWhatsAppInvoice(purchase)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            title="Send WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Send WhatsApp
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Purchase Items */}
                      <div>
                        <h4 className="font-semibold text-base text-foreground mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Items ({purchase.items?.length || 0})
                        </h4>
                        <div className="border rounded-lg overflow-hidden bg-muted/30">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted">
                                <TableHead className="font-semibold">Product</TableHead>
                                <TableHead className="text-right font-semibold">Quantity</TableHead>
                                <TableHead className="text-right font-semibold">Unit Price</TableHead>
                                <TableHead className="text-right font-semibold">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {purchase.items?.map((item, itemIndex) => (
                                <TableRow key={itemIndex} className="hover:bg-muted/50">
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{item.name || 'Unknown Product'}</p>
                                      {item.fabricType && (
                                        <p className="text-xs text-muted-foreground">Type: {item.fabricType}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{item.quantity || 0}</TableCell>
                                  <TableCell className="text-right font-medium">Rs{(item.unitPrice || 0).toLocaleString()}</TableCell>
                                  <TableCell className="text-right font-bold">Rs{(item.subtotal || (item.unitPrice || 0) * (item.quantity || 0)).toLocaleString()}</TableCell>
                                </TableRow>
                              )) || []}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Financial Summary for this purchase - Compact Design */}
                      <div className="bg-muted/30 rounded-lg p-3">
                        <h4 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Financial Summary
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span className="font-semibold text-blue-600">Rs{(purchase.subtotal || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground">Discount:</span>
                            <span className="font-semibold text-red-600">-Rs{(purchase.totalDiscount || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground">Total Amount:</span>
                            <span className="font-semibold text-primary">Rs{purchaseTotal.toLocaleString()}</span>
                          </div>
                           <div className="flex justify-between items-center py-1">
                             <span className="text-muted-foreground">Amount Paid:</span>
                             <span className="font-semibold text-green-600">Rs{isPaid ? purchaseTotal.toLocaleString() : '0'}</span>
                           </div>
                          <div className="flex justify-between items-center py-1 col-span-2 border-t pt-2">
                            <span className="text-muted-foreground font-medium">Remaining:</span>
                            <span className="font-bold text-orange-600 text-base">Rs{purchaseRemaining.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar for this purchase */}
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-semibold text-base text-foreground mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Payment Progress
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span>Payment Status</span>
                            <span className="text-lg font-bold">{isPaid ? '100%' : '0%'}</span>
                          </div>
                          <Progress value={isPaid ? 100 : 0} className="h-3" />
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {(() => {
            // Collect all payment records from supplier credits (global payment system)
            const allPaymentRecords: Array<{
              id: string
              amount: number
              method: string
              date: string
              remainingAfter: number
              notes: string
              invoiceNumber: string
            }> = []

            // Add supplier credits as payments
            credits
              .filter(credit => credit.type === "credit")
              .forEach(credit => {
                allPaymentRecords.push({
                  id: `credit-${credit.id}`,
                  amount: credit.amount,
                  method: credit.reason?.includes("via") ? credit.reason.split("via ")[1] : "Not specified",
                  date: credit.createdAt,
                  remainingAfter: 0, // Will be calculated based on running balance
                  notes: credit.description || credit.reason || "Global payment",
                  invoiceNumber: "Global Payment"
                })
              })

            // Sort by date (latest first)
            allPaymentRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            return allPaymentRecords.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No payment records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allPaymentRecords.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">#{payment.invoiceNumber}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.date)} at {formatTime(payment.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          Rs{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Paid</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {payment.method}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">
                        {payment.notes}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>

    </div>
  )
}
