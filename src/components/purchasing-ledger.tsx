"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Search, Phone, MessageSquare, Eye, Trash2, Printer, Receipt, Edit, Building2, MapPin } from "lucide-react"
import { DateRangeFilter, DateFilterType } from "@/components/ui/date-range-filter"
import { useToast } from "@/hooks/use-toast"
import { PurchaseService, SupplierService, SupplierCreditService, type Purchase, type Supplier, type SupplierCredit } from "@/lib/firebase-services"
import { PurchaseDeleteDialog } from "@/components/modules/purchasing/purchase-delete-dialog"
import { PurchaseReportDialog } from "@/components/modules/purchasing/purchase-report-dialog"
import { EditPurchaseDialog } from "@/components/modules/purchasing/edit-purchase-dialog"
import { PurchaseDetail } from "@/components/modules/purchasing/purchase-detail"
import { PurchasePaymentDetail } from "@/components/modules/purchasing/purchase-payment-detail"
import { GlobalPaymentDialog } from "./modules/purchasing/global-payment-dialog"
import { SupplierProfileDetails } from "./modules/purchasing/supplier-profile-details"
import { SupplierLedgerPurchase } from "./modules/purchasing/supplier-ledger-purchase"
import { SupplierProfilePage } from "./modules/purchasing/supplier-profile-page"

export function PurchasingLedger() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [purchaseRecords, setPurchaseRecords] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierCredits, setSupplierCredits] = useState<SupplierCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("all")

  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("new_ver")
  const [startDate, setStartDate] = useState<Date | null>(() => {
    return new Date(2026, 1, 17); // Feb 17, 2026
  })
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  // const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null)
  const [selectedPurchaseForDetail, setSelectedPurchaseForDetail] = useState<Purchase | null>(null)
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<Purchase | null>(null)
  const [activeView, setActiveView] = useState<"list" | "detail" | "payment">("list")
  const [activeTab, setActiveTab] = useState("all-purchases")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [reportStartDate, setReportStartDate] = useState("")
  const [reportEndDate, setReportEndDate] = useState("")
  const [pendingPaymentsSearchTerm, setPendingPaymentsSearchTerm] = useState("")
  const { toast } = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PURCHASES_PER_PAGE = 10;

  // Supplier profile state
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null)
  const [selectedSupplierPurchases, setSelectedSupplierPurchases] = useState<Purchase[]>([])
  const [isGlobalPaymentDialogOpen, setIsGlobalPaymentDialogOpen] = useState(false)

  // Supplier profile details state
  const [showSupplierProfileDetails, setShowSupplierProfileDetails] = useState(false)
  const [selectedSupplierForDetails, setSelectedSupplierForDetails] = useState<Supplier | null>(null)
  const [selectedSupplierDetailsPurchases, setSelectedSupplierDetailsPurchases] = useState<Purchase[]>([])

  // Supplier ledger state
  const [showSupplierLedger, setShowSupplierLedger] = useState(false)
  const [selectedSupplierForLedger, setSelectedSupplierForLedger] = useState<Supplier | null>(null)

  // Supplier profile page state
  const [showSupplierProfilePage, setShowSupplierProfilePage] = useState(false)
  const [selectedSupplierForProfilePage, setSelectedSupplierForProfilePage] = useState<Supplier | null>(null)

  // Restore profile state from localStorage on component mount
  useEffect(() => {
    const savedProfileState = localStorage.getItem('purchasingLedgerProfileState')
    console.log('Profile restoration check:', { savedProfileState, loading, suppliersLength: suppliers.length, purchaseRecordsLength: purchaseRecords.length })

    if (savedProfileState && !loading && suppliers.length > 0 && purchaseRecords.length > 0) {
      try {
        const { showProfile, supplierId } = JSON.parse(savedProfileState)
        console.log('Parsed profile state:', { showProfile, supplierId })

        if (showProfile && supplierId) {
          const supplier = suppliers.find(s => s.id === supplierId)
          console.log('Found supplier:', supplier)

          if (supplier) {
            // Check if there are purchases for this supplier
            const supplierPurchases = purchaseRecords.filter(purchase => purchase.supplierId === supplier.id)
            console.log('Supplier purchases found:', supplierPurchases.length)

            if (supplierPurchases.length > 0) {
              console.log('Restoring profile for supplier:', supplier.name)
              setSelectedSupplierForProfilePage(supplier)
              setShowSupplierProfilePage(true)
              // Scroll to top when opening profile
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
              console.log('No purchases found for supplier, clearing state')
              // Clear invalid state if no purchases found
              localStorage.removeItem('purchasingLedgerProfileState')
            }
          } else {
            console.log('Supplier not found, clearing state')
            // Clear invalid state if supplier not found
            localStorage.removeItem('purchasingLedgerProfileState')
          }
        }
      } catch (error) {
        console.error('Error restoring profile state:', error)
        localStorage.removeItem('purchasingLedgerProfileState')
      }
    }
  }, [suppliers, purchaseRecords, loading])

  // Save profile state to localStorage when profile is opened/closed
  useEffect(() => {
    if (showSupplierProfilePage && selectedSupplierForProfilePage) {
      localStorage.setItem('purchasingLedgerProfileState', JSON.stringify({
        showProfile: true,
        supplierId: selectedSupplierForProfilePage.id
      }))
    } else {
      localStorage.removeItem('purchasingLedgerProfileState')
    }
  }, [showSupplierProfilePage, selectedSupplierForProfilePage])

  // useCallback to avoid warning about loadPurchaseData in useEffect deps
  const loadPurchaseData = useCallback(async () => {
    try {
      setLoading(true)
      const [purchases, suppliersData, creditsData] = await Promise.all([
        PurchaseService.getAllPurchases(),
        SupplierService.getAllSuppliers(),
        SupplierCreditService.getAll<SupplierCredit>("supplierCredits")
      ])
      setPurchaseRecords(purchases)
      setSuppliers(suppliersData)
      setSupplierCredits(creditsData)
    } catch (error) {
      console.error("Error loading purchase data:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadPurchaseData()
  }, [loadPurchaseData])

  // Handle URL parameters for supplier profile details
  useEffect(() => {
    const supplierId = searchParams.get('supplierId')
    if (supplierId && !loading && purchaseRecords.length > 0) {
      // Find supplier and their purchases
      const supplierPurchases = purchaseRecords.filter(purchase => purchase.supplierId === supplierId)
      if (supplierPurchases.length > 0) {
        const supplier: Supplier = {
          id: supplierId,
          name: supplierPurchases[0].supplierName,
          phone: supplierPurchases[0].supplierPhone,
          address: supplierPurchases[0].supplierAddress || "",
          balance: 0,
          createdAt: new Date().toISOString()
        }

        setSelectedSupplierForDetails(supplier)
        setSelectedSupplierDetailsPurchases(supplierPurchases)
        setShowSupplierProfileDetails(true)
        // Scroll to top when opening profile details
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [searchParams, purchaseRecords, loading])


  useEffect(() => {
    setCurrentPage(1);
  }, [purchaseRecords, searchTerm, supplierFilter]);

  // Debug useEffect for delete dialog state
  useEffect(() => {
    console.log("Delete dialog state changed:", {
      isDeleteDialogOpen,
      deletingPurchase: deletingPurchase?.invoiceNumber,
      deletingPurchaseId: deletingPurchase?.id
    })
  }, [isDeleteDialogOpen, deletingPurchase])


  const handleCallSupplier = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_blank')
      toast({
        title: "Calling Supplier",
        description: `Initiating call to ${phone}`,
      })
    } else {
      toast({
        title: "Error",
        description: "No phone number available",
        variant: "destructive",
      })
    }
  }


  const handleViewPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowViewModal(true)
  }


  const handlePurchaseDetailOpen = (purchase: Purchase, fromTab?: string) => {
    setSelectedPurchaseForDetail(purchase)
    setActiveView("detail")
    // Remember which tab we came from if specified
    if (fromTab) {
      setActiveTab(fromTab)
    }
  }

  const handleBackToList = () => {
    setActiveView("list")
    setSelectedPurchaseForDetail(null)
    setSelectedPurchaseForPayment(null)
    // Keep the current active tab (it was set when opening details)
    // Reset pagination to page 1 when going back
    setCurrentPage(1)
  }

  // Note: handlePurchaseDetailBack is no longer used
  // const handlePurchaseDetailBack = () => { ... }

  const handleDeletePurchase = (purchase: Purchase) => {
    console.log("Opening delete dialog for purchase:", purchase.invoiceNumber, purchase.id)
    setDeletingPurchase(purchase)
    setIsDeleteDialogOpen(true)
  }

  const handleEditPurchase = (purchase: Purchase) => {
    handlePurchaseDetailOpen(purchase)
  }

  // Supplier profile handlers

  const handleGlobalPaymentSuccess = async () => {
    await loadPurchaseData()
    setIsGlobalPaymentDialogOpen(false)
    setSelectedSupplierForPayment(null)
    setSelectedSupplierPurchases([])
  }

  // Supplier profile details handlers

  // Supplier ledger handlers

  const handleSupplierLedgerBack = () => {
    setShowSupplierLedger(false)
    setSelectedSupplierForLedger(null)
  }

  // Supplier profile page handlers
  const handleSupplierProfilePage = (supplier: Supplier) => {
    setSelectedSupplierForProfilePage(supplier)
    setShowSupplierProfilePage(true)
    // Scroll to top when opening profile
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSupplierProfilePageBack = () => {
    setShowSupplierProfilePage(false)
    setSelectedSupplierForProfilePage(null)
  }

  const handleSupplierProfileDetailsBack = () => {
    setShowSupplierProfileDetails(false)
    setSelectedSupplierForDetails(null)
    setSelectedSupplierDetailsPurchases([])

    // Remove URL parameter
    const params = new URLSearchParams(searchParams.toString())
    params.delete('supplierId')
    router.push(`?${params.toString()}`)
  }

  const handleSupplierProfileDetailsPaymentSuccess = async () => {
    await loadPurchaseData()
    // Keep the details view open but refresh the data
  }




  const handleProfilePurchaseCreated = async (purchase: Purchase) => {
    // Refresh main data
    await loadPurchaseData()

    // Refresh profile data if we're in profile view
    if (showSupplierProfileDetails && selectedSupplierForDetails) {
      // Get fresh data after the main data is loaded
      const freshPurchases = await PurchaseService.getAllPurchases()
      const supplierPurchases = freshPurchases.filter(p => p.supplierId === selectedSupplierForDetails.id)
      setSelectedSupplierDetailsPurchases(supplierPurchases)
    }

    toast({
      title: "Purchase Created",
      description: `Credit purchase #${purchase.invoiceNumber} created successfully`,
    })
  }

  // Helper function to format date as MM/DD/YYYY
  const formatDate = (date: Date | string) => {
    // If it's already a formatted string, return it
    if (typeof date === 'string') {
      return date
    }

    // If it's a Date object, format it
    if (date instanceof Date && !isNaN(date.getTime())) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${month}/${day}/${year}`
    }

    // Fallback to current date if invalid
    const now = new Date()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const year = now.getFullYear()
    return `${month}/${day}/${year}`
  }

  // Print invoice handler
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

  // Thermal print handler
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

  // WhatsApp invoice handler
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

  // Generate purchase invoice HTML
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
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
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
                  <p><strong>Date:</strong> ${formatDate(purchase.date || new Date())} | <strong>Time:</strong> ${purchase.time || 'N/A'}</p>
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
              ${purchase.items.map((item) => `
                <tr>
                  <td style="font-size: 12px;">${item.name || 'N/A'}</td>
                  <td class="text-right" style="font-size: 12px;">${item.quantity || 0}${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? ` + ${item.tradeDiscountFreeItems}(TD)` : ''}</td>
                  <td class="text-right" style="font-size: 12px;">Rs${(item.unitPrice || 0).toLocaleString()}</td>
                  <td class="text-right" style="font-size: 12px;">Rs${((item.unitPrice || 0) * (item.quantity || 0)).toLocaleString()}</td>
                </tr>
              `).join('')}
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

  // Generate thermal purchase invoice HTML (compact format for thermal printers)
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
            <p><strong>Date:</strong> ${formatDate(purchase.date || new Date())} | <strong>Time:</strong> ${purchase.time || 'N/A'}</p>
            <p><strong>Supplier:</strong> ${purchase.supplierName}</p>
            ${purchase.supplierPhone ? `<p><strong>Phone:</strong> ${purchase.supplierPhone}</p>` : ''}
            <p><strong>Staff:</strong> ${purchase.staffName}</p>
          </div>
          
          <div class="divider"></div>
          
          <table class="items-table">
            <tr>
              <td class="item-name"><strong>ITEM</strong></td>
              <td class="item-qty"><strong>QTY</strong></td>
              <td class="item-price"><strong>PRICE</strong></td>
              <td class="item-total"><strong>TOTAL</strong></td>
            </tr>
            ${purchase.items.map((item) => {
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
    }).join('')}
          </table>
          
          <div class="divider"></div>
          
          <div class="totals">
            <p class="right">Subtotal: Rs${(purchase.subtotal || 0).toLocaleString()}</p>
            ${(purchase.totalDiscount || 0) > 0 ? `<p class="right">Discount: -Rs${(purchase.totalDiscount || 0).toLocaleString()}</p>` : ''}
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

  const confirmDeletePurchase = async () => {
    if (!deletingPurchase) {
      console.log("No purchase selected for deletion")
      return
    }

    console.log("Attempting to delete purchase:", deletingPurchase.id, deletingPurchase.invoiceNumber)

    try {
      await PurchaseService.deletePurchase(deletingPurchase.id)
      console.log("Purchase deleted successfully from database")

      // Reload purchases
      const purchasesData = await PurchaseService.getAllPurchases()
      console.log("Reloaded purchases:", purchasesData)
      setPurchaseRecords(purchasesData)

      // Check if current page is still valid after deletion
      const currentFilteredPurchases = purchasesData.filter((record) => {
        const matchesSearch = (record.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (record.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (record.supplierPhone || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesSupplier = supplierFilter === "all" || record.supplierId === supplierFilter
        return matchesSearch && matchesSupplier
      });

      const totalPages = Math.ceil(currentFilteredPurchases.length / PURCHASES_PER_PAGE);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }

      setDeletingPurchase(null)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Success",
        description: "Purchase record deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting purchase:", error)
      toast({
        title: "Error",
        description: "Failed to delete purchase record. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Generate purchase report
  const generatePurchaseReport = async () => {
    try {
      setIsGeneratingReport(true)

      // Filter purchases by date range if both dates are set
      let filteredPurchases = purchaseRecords;
      if (reportStartDate && reportEndDate) {
        const start = new Date(reportStartDate);
        const end = new Date(reportEndDate);
        // Set end date to end of day to include all records from that day
        end.setHours(23, 59, 59, 999);

        filteredPurchases = purchaseRecords.filter(record => {
          if (!record.date) return false;
          // Handle different date formats (DD/MM/YYYY or ISO string)
          let purchaseDate;
          if (record.date.includes('/')) {
            // Handle DD/MM/YYYY format
            const parts = record.date.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
              const year = parseInt(parts[2], 10);
              purchaseDate = new Date(year, month, day);
            } else {
              purchaseDate = new Date(record.date);
            }
          } else {
            purchaseDate = new Date(record.date);
          }
          // Check if date is valid
          if (isNaN(purchaseDate.getTime())) {
            console.warn('Invalid date found:', record.date);
            return false;
          }
          return purchaseDate >= start && purchaseDate <= end;
        });
      }

      console.log('Total purchase records:', purchaseRecords.length);
      console.log('Filtered purchase records:', filteredPurchases.length);
      console.log('Date range:', reportStartDate, 'to', reportEndDate);

      // If no records found with date filter, use all records
      if (filteredPurchases.length === 0 && purchaseRecords.length > 0) {
        console.log('No records found with date filter, using all records');
        filteredPurchases = purchaseRecords;
      }

      // Create CSV content
      const headers = [
        'Invoice Number',
        'Supplier Name',
        'Supplier Phone',
        'Date',
        'Total Amount',
        'Items Count',
        'Payment Method',
        'Status'
      ];

      const csvContent = [
        headers.join(','),
        ...filteredPurchases.map(purchase => [
          `"${purchase.invoiceNumber || ''}"`,
          `"${purchase.supplierName || ''}"`,
          `"${purchase.supplierPhone || ''}"`,
          `"${purchase.date || ''}"`,
          purchase.totalAmount || 0,
          purchase.items?.length || 0,
          `"Cash"`,
          `"Completed"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `purchase-report-${reportStartDate || 'all'}-to-${reportEndDate || 'all'}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Report Generated",
        description: "Purchase report has been downloaded successfully",
      })
      setIsReportDialogOpen(false);
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate purchase report",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Helper function to check if a date matches the filter
  const matchesDateFilter = (record: Purchase) => {
    if (!startDate && !endDate) return true;
    if (!record.date) return false;

    // Parse record date (assuming consistent format, e.g., DD/MM/YYYY or YYYY-MM-DD or ISO)
    // Based on previous file viewing, record.date might be DD/MM/YYYY or similar.
    // Line 833 in earlier view suggests checking record.date format.
    let recordDate: Date;
    if (record.date.includes('/')) {
      const parts = record.date.split('/');
      // Assuming DD/MM/YYYY
      recordDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      // Assuming ISO string or other format, let Date constructor handle it,
      // OR handle YYYY-MM-DD if split by '-'
      if (record.date.includes('-') && record.date.length === 10) {
        const parts = record.date.split('-');
        recordDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        recordDate = new Date(record.date);
      }
    }

    if (isNaN(recordDate.getTime())) {
      return false;
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (recordDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (recordDate > end) return false;
    }
    return true;
  };

  // Filter and sort purchases
  const filteredPurchases = purchaseRecords.filter((record) => {
    const matchesSearch = (record.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.supplierPhone || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSupplier = supplierFilter === "all" || record.supplierId === supplierFilter
    // matchesDate is unused for the main list
    return matchesSearch && matchesSupplier
  })

  // Sort by date (newest first)
  const sortedFilteredPurchases = [...filteredPurchases].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Pagination
  const totalPages = Math.ceil(sortedFilteredPurchases.length / PURCHASES_PER_PAGE);
  const paginatedPurchases = sortedFilteredPurchases.slice((currentPage - 1) * PURCHASES_PER_PAGE, currentPage * PURCHASES_PER_PAGE);

  const filteredRecords = paginatedPurchases;

  const dateFilteredPurchases = purchaseRecords.filter(matchesDateFilter);

  const totalPurchases = dateFilteredPurchases.reduce((sum, record) => sum + (record.totalAmount || 0), 0)
  const totalDiscount = dateFilteredPurchases.reduce((sum, record) => sum + (record.discount || 0), 0)

  // Active Suppliers: All time unique suppliers
  const activeSupplierIds = new Set(purchaseRecords.map(p => p.supplierId).filter(Boolean));
  const activeSuppliersCount = activeSupplierIds.size;

  const totalItems = purchaseRecords.reduce((sum, record) => sum + (record.items?.length || 0), 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading purchase data...</div>
  }

  return (
    <div className="space-y-6">
      {showSupplierProfilePage && selectedSupplierForProfilePage ? (
        <SupplierProfilePage
          supplier={selectedSupplierForProfilePage}
          allPurchases={purchaseRecords.filter(purchase =>
            purchase.supplierName === selectedSupplierForProfilePage.name &&
            purchase.supplierPhone === selectedSupplierForProfilePage.phone
          )}
          credits={supplierCredits.filter(credit => credit.supplierId === selectedSupplierForProfilePage.id)}
          onBack={handleSupplierProfilePageBack}
          onPaymentSuccess={handleSupplierProfileDetailsPaymentSuccess}
          onPurchaseCreated={handleProfilePurchaseCreated}
        />
      ) : showSupplierProfileDetails && selectedSupplierForDetails ? (
        <SupplierProfileDetails
          supplier={selectedSupplierForDetails}
          purchases={selectedSupplierDetailsPurchases}
          credits={supplierCredits.filter(credit => credit.supplierId === selectedSupplierForDetails.id)}
          onBack={handleSupplierProfileDetailsBack}
          onPaymentSuccess={handleSupplierProfileDetailsPaymentSuccess}
          onPurchaseCreated={handleProfilePurchaseCreated}
        />
      ) : showSupplierLedger && selectedSupplierForLedger ? (
        <SupplierLedgerPurchase
          supplierId={selectedSupplierForLedger.id}
          supplierName={selectedSupplierForLedger.name}
          supplierPhone={selectedSupplierForLedger.phone}
          supplierAddress={selectedSupplierForLedger.address}
          initialBalance={0}
          onBack={handleSupplierLedgerBack}
        />
      ) : activeView === "detail" && selectedPurchaseForDetail ? (
        <PurchaseDetail
          purchase={selectedPurchaseForDetail}
          onBack={handleBackToList}
          onPurchaseUpdated={loadPurchaseData}
        />
      ) : activeView === "payment" && selectedPurchaseForPayment ? (
        <PurchasePaymentDetail
          purchase={selectedPurchaseForPayment}
          onBack={handleBackToList}
          onPaymentAdded={loadPurchaseData}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Purchasing Ledger</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="flex bg-muted/50 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
                <DateRangeFilter
                  filterType={dateFilterType}
                  onFilterTypeChange={setDateFilterType}
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsReportDialogOpen(true)}
                  disabled={isGeneratingReport}
                  className="w-full sm:w-auto"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isGeneratingReport ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs{totalPurchases.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{dateFilteredPurchases.length} transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Rs{totalDiscount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {totalPurchases > 0 ? ((totalDiscount / (totalPurchases + totalDiscount)) * 100).toFixed(1) : 0}% of gross purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{activeSuppliersCount}</div>
                <p className="text-xs text-muted-foreground">Total active suppliers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{totalItems}</div>
                <p className="text-xs text-muted-foreground">Total items purchased (All time)</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-2 p-1">
              <TabsTrigger value="all-purchases">📊 All Purchases</TabsTrigger>
              <TabsTrigger value="recent-purchases">📅 Recent Purchases</TabsTrigger>
              <TabsTrigger value="pending-payments">💳 Credit Purchases</TabsTrigger>
            </TabsList>

            <TabsContent value="all-purchases" className="space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search & Filter Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 w-full">
                      <Input
                        id="purchase-search"
                        name="purchase-search"
                        placeholder="Search by invoice, supplier name, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Purchases Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Purchase Records
                  </CardTitle>
                  <CardDescription>Complete purchase history with supplier and payment details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.map((record) => (
                          <TableRow
                            key={record.id}
                            className="h-24 cursor-pointer hover:bg-muted/50"
                            onClick={() => handlePurchaseDetailOpen(record, "all-purchases")}
                          >
                            <TableCell className="h-24 align-top">
                              <div>
                                <p className="font-medium">{record.invoiceNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(record.createdAt).toLocaleDateString()} • {new Date(record.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="h-24 align-top">
                              <div>
                                <p className="font-medium">{record.supplierName}</p>
                                <p className="text-sm text-muted-foreground">{record.supplierPhone}</p>
                                {record.supplierAddress && (
                                  <p className="text-xs text-muted-foreground">{record.supplierAddress}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="h-24 align-top">
                              <div>
                                <p className="text-sm">{record.items?.length ?? 0} items</p>
                                <p className="text-xs text-muted-foreground">
                                  {Array.isArray(record.items)
                                    ? record.items.reduce((sum, item) => sum + (typeof item.quantity === "number" ? item.quantity : 0), 0)
                                    : 0} units
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="h-24 align-top">
                              <div>
                                <p className="font-medium">Rs{(record.totalAmount || 0).toLocaleString()}</p>
                                {(record.discount || 0) > 0 && (
                                  <p className="text-xs text-green-600">-Rs{(record.discount || 0).toLocaleString()} discount</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="h-24 align-top">
                              <div className="space-y-1">
                                {record.paymentStatus === "pending" ? (
                                  <div className="flex flex-col space-y-1">
                                    <Badge variant="destructive" className="text-xs w-fit">
                                      Pending
                                    </Badge>
                                    <Badge variant={record.paymentMethod === "credit" ? "secondary" : "default"} className="text-xs w-fit">
                                      {record.paymentMethod === "credit" ? "Credit" : "Cash"}
                                    </Badge>
                                  </div>
                                ) : (
                                  <div className="flex flex-col space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      {record.paymentStatus === "paid" ? "Paid" :
                                        record.paymentStatus === "partial" ? "Partial" : "Unknown"}
                                    </p>
                                    <Badge variant={record.paymentMethod === "credit" ? "secondary" : "default"} className="text-xs w-fit">
                                      {record.paymentMethod === "credit" ? "Credit" : "Cash"}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="h-24 align-top">
                              <div>
                                <p className="text-sm">{new Date(record.createdAt).toLocaleDateString()}</p>
                                <p className="text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleTimeString()}</p>
                              </div>
                            </TableCell>
                            <TableCell className="h-24 align-top">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewPurchase(record)
                                  }}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditPurchase(record)
                                  }}
                                  title="Edit Purchase"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePrintInvoice(record)
                                  }}
                                  title="Print Invoice"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleThermalPrint(record)
                                  }}
                                  title="Thermal Print"
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleWhatsAppInvoice(record)
                                  }}
                                  title="Send WhatsApp"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCallSupplier(record.supplierPhone)
                                  }}
                                  title="Call Supplier"
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeletePurchase(record)
                                  }}
                                  title="Delete Purchase"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * PURCHASES_PER_PAGE) + 1} to {Math.min(currentPage * PURCHASES_PER_PAGE, sortedFilteredPurchases.length)} of {sortedFilteredPurchases.length} purchases
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-3 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recent-purchases" className="space-y-4">
              {/* Recent Purchases - Last 7 days */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Purchases (Last 7 Days)
                  </CardTitle>
                  <CardDescription>Purchases made in the last week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseRecords
                          .filter(record => {
                            const recordDate = new Date(record.createdAt)
                            const weekAgo = new Date()
                            weekAgo.setDate(weekAgo.getDate() - 7)
                            return recordDate >= weekAgo
                          })
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 10)
                          .map((record) => (
                            <TableRow
                              key={record.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handlePurchaseDetailOpen(record, "recent-purchases")}
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium">{record.invoiceNumber}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(record.createdAt).toLocaleDateString()} • {new Date(record.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{record.supplierName}</p>
                                  <p className="text-sm text-muted-foreground">{record.supplierPhone}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{record.items?.length ?? 0} items</p>
                                  <p className="text-xs text-muted-foreground">
                                    {Array.isArray(record.items)
                                      ? record.items.reduce((sum, item) => sum + (typeof item.quantity === "number" ? item.quantity : 0), 0)
                                      : 0} units
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">Rs{(record.totalAmount || 0).toLocaleString()}</p>
                                  {(record.discount || 0) > 0 && (
                                    <p className="text-xs text-green-600">-Rs{(record.discount || 0).toLocaleString()} discount</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{new Date(record.createdAt).toLocaleDateString()}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleTimeString()}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewPurchase(record)
                                    }}
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePrintInvoice(record)
                                    }}
                                    title="Print Invoice"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleThermalPrint(record)
                                    }}
                                    title="Thermal Print"
                                  >
                                    <Receipt className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleWhatsAppInvoice(record)
                                    }}
                                    title="Send WhatsApp"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCallSupplier(record.supplierPhone)
                                    }}
                                    title="Call Supplier"
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeletePurchase(record)
                                    }}
                                    title="Delete Purchase"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending-payments" className="space-y-4">
              {/* Search Bar for Pending Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search Supplier Profiles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Search by supplier name, phone, or address..."
                    value={pendingPaymentsSearchTerm}
                    onChange={(e) => setPendingPaymentsSearchTerm(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Unified Supplier Profiles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Supplier Profiles
                  </CardTitle>
                  <CardDescription>Manage payments and view detailed ledgers for suppliers</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Get all suppliers with purchases and apply search filter
                    const suppliersWithPurchases = suppliers.filter(supplier => {
                      const hasPurchases = purchaseRecords.some(purchase =>
                        purchase.supplierName === supplier.name && purchase.supplierPhone === supplier.phone
                      )

                      if (!hasPurchases) return false

                      // Apply search filter
                      if (pendingPaymentsSearchTerm.trim()) {
                        const searchLower = pendingPaymentsSearchTerm.toLowerCase()
                        return (
                          supplier.name.toLowerCase().includes(searchLower) ||
                          supplier.phone.includes(pendingPaymentsSearchTerm) ||
                          (supplier.address && supplier.address.toLowerCase().includes(searchLower))
                        )
                      }

                      return true
                    })

                    if (suppliersWithPurchases.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 mx-auto text-green-500 mb-4" />
                          <p className="text-muted-foreground">
                            {pendingPaymentsSearchTerm.trim()
                              ? "No suppliers found matching your search"
                              : "No suppliers with purchases found"
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pendingPaymentsSearchTerm.trim()
                              ? "Try adjusting your search terms"
                              : "Supplier profiles will appear here once purchases are made"
                            }
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-3">
                        {suppliersWithPurchases.map((supplier) => {
                          // Get all purchases for this supplier
                          const supplierPurchases = purchaseRecords.filter(purchase =>
                            purchase.supplierName === supplier.name && purchase.supplierPhone === supplier.phone
                          )


                          // Calculate totals using global payment system
                          const totalAmount = supplierPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0)

                          // Calculate total payments from supplier credits (global payment system)
                          const supplierCreditsForThisSupplier = supplierCredits.filter(credit =>
                            credit.supplierId === supplier.id
                          )
                          const totalPaid = supplierCreditsForThisSupplier
                            .filter(credit => credit.type === "credit")
                            .reduce((sum, credit) => sum + (credit.amount || 0), 0)

                          const totalRemaining = totalAmount - totalPaid
                          const progressPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0

                          // Get status based on remaining amount (binary system)
                          const getStatus = () => {
                            if (totalRemaining <= 0) return { status: 'paid', color: 'bg-green-100 text-green-800' }
                            return { status: 'pending', color: 'bg-gray-100 text-gray-800' }
                          }

                          const statusInfo = getStatus()

                          return (
                            <div
                              key={supplier.id}
                              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => handleSupplierProfilePage(supplier)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="p-2 bg-primary/10 rounded-full">
                                    <Building2 className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg">{supplier.name}</h3>
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
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <div className="text-sm text-muted-foreground">
                                      {supplierPurchases.length} purchase{supplierPurchases.length !== 1 ? 's' : ''}
                                    </div>
                                    {totalRemaining > 0 && (
                                      <div className="text-sm text-orange-600 font-medium">
                                        Rs{totalRemaining.toLocaleString()} pending
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-center space-y-2">
                                    <Badge className={`${statusInfo.color} text-xs`}>
                                      {statusInfo.status.toUpperCase()}
                                    </Badge>

                                    {/* Visual line showing global due vs paid amounts */}
                                    <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full flex">
                                        {/* Paid amount (green) */}
                                        <div
                                          className="bg-green-500 h-full transition-all duration-300"
                                          style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                        {/* Remaining amount (orange) */}
                                        <div
                                          className="bg-orange-500 h-full transition-all duration-300"
                                          style={{ width: `${100 - progressPercentage}%` }}
                                        ></div>
                                      </div>
                                    </div>

                                    <div className="text-xs text-center space-y-1">
                                      <div className="flex items-center justify-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-green-600 font-medium">Rs{totalPaid.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center justify-center space-x-2">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span className="text-orange-600 font-medium">Rs{totalRemaining.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          {/* View Purchase Modal */}
          <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Purchase Details
                </DialogTitle>
                <DialogDescription>
                  Detailed view of purchase items and information
                </DialogDescription>
              </DialogHeader>

              {selectedPurchase && (
                <div className="space-y-6">
                  {/* Purchase Header */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedPurchase.invoiceNumber}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedPurchase.createdAt).toLocaleDateString()} at {new Date(selectedPurchase.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">Rs{(selectedPurchase.totalAmount || 0).toLocaleString()}</p>
                      {(selectedPurchase.discount || 0) > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Discount: Rs{(selectedPurchase.discount || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Supplier Information */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Supplier Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{selectedPurchase.supplierName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedPurchase.supplierPhone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{selectedPurchase.supplierAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Items */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Purchase Items ({selectedPurchase.items?.length || 0})
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedPurchase.items?.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.name || 'Unknown Product'}</p>
                                  {item.fabricType && (
                                    <p className="text-xs text-muted-foreground">Type: {item.fabricType}</p>
                                  )}
                                  {item.size && (
                                    <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{item.code || 'N/A'}</TableCell>
                              <TableCell className="text-right">{item.quantity || 0}</TableCell>
                              <TableCell className="text-right">Rs{(item.unitPrice || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right font-medium">Rs{(item.subtotal || 0).toLocaleString()}</TableCell>
                            </TableRow>
                          )) || []}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Purchase Summary */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Purchase Summary</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>Rs{(selectedPurchase.subtotal || 0).toLocaleString()}</span>
                        </div>
                        {(selectedPurchase.discount || 0) > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Discount:</span>
                            <span>-Rs{(selectedPurchase.discount || 0).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>Rs{(selectedPurchase.totalAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Delete Purchase Dialog */}
      <PurchaseDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        purchase={deletingPurchase}
        onConfirm={confirmDeletePurchase}
      />

      {/* Purchase Report Dialog */}
      <PurchaseReportDialog
        isOpen={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        reportStartDate={reportStartDate}
        setReportStartDate={setReportStartDate}
        reportEndDate={reportEndDate}
        setReportEndDate={setReportEndDate}
        onGenerateReport={generatePurchaseReport}
        isGeneratingReport={isGeneratingReport}
      />

      {/* Edit Purchase Dialog */}
      <EditPurchaseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        purchase={null}
        onPurchaseUpdated={loadPurchaseData}
      />

      {/* Global Payment Dialog */}
      {selectedSupplierForPayment && (
        <GlobalPaymentDialog
          open={isGlobalPaymentDialogOpen}
          onOpenChange={setIsGlobalPaymentDialogOpen}
          supplier={selectedSupplierForPayment}
          purchases={selectedSupplierPurchases}
          onPaymentSuccess={handleGlobalPaymentSuccess}
        />
      )}

    </div>
  )
}
