"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, Eye, Phone, MessageSquare, CheckCircle, DollarSign, Trash2, Printer, Receipt, Edit, User, MapPin } from "lucide-react"
import { ReportDialog } from "@/components/modules/sales-ledger/report-dialog"
import { DiscardSaleDialog } from "@/components/modules/sales-ledger/discard-sale-dialog"
import { SaleDetailsDialog } from "./modules/sales-ledger/sales-details-dialog"
import { EditSaleDialog } from "./modules/sales-ledger/edit-sale-dialog"
import { SaleDetail } from "./modules/sales-ledger/sale-detail"
import { DateRangeFilter, DateFilterType } from "@/components/ui/date-range-filter"
import { useToast } from "@/hooks/use-toast"
import { SalesService, CustomerService, CustomerCreditService, type SaleRecord, type CustomerCredit, type Customer } from "@/lib/firebase-services"
import { generatePDFFromHTML } from "@/lib/whatsapp-utils"
import { GlobalPaymentDialog } from "./modules/sales-ledger/global-payment-dialog"
import { CustomerProfileDetails } from "./modules/sales-ledger/customer-profile-details"
import { CustomerLedger } from "./modules/sales-ledger/customer-ledger"
import { CustomerProfilePage } from "./modules/sales-ledger/customer-profile-page"

export function SalesLedger() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")

  // Date filter state
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("new_ver")
  const [startDate, setStartDate] = useState<Date | null>(() => {
    return new Date(2026, 1, 17); // Feb 17, 2026
  })
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<SaleRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState("");
  const [showSaleDetail, setShowSaleDetail] = useState(false)
  const [selectedSaleForDetail, setSelectedSaleForDetail] = useState<SaleRecord | null>(null)
  const [reportEndDate, setReportEndDate] = useState("");
  const [pendingPaymentSearchTerm, setPendingPaymentSearchTerm] = useState("")
  const { toast } = useToast()

  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [saleToDiscard, setSaleToDiscard] = useState<SaleRecord | null>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // const [saleToEdit, setSaleToEdit] = useState<SaleRecord | null>(null);

  // Pagination state for today's sales
  const [todaySalesPage, setTodaySalesPage] = useState(1);
  const todaySalesPerPage = 10;


  // Customer credit state
  const [creditSalePaymentRecords, setCreditSalePaymentRecords] = useState<CustomerCredit[]>([])

  // Track active tab and page when opening credit sale detail
  const [activeTab, setActiveTab] = useState("all-sales")

  // Customer profile state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null)
  const [selectedCustomerSales, setSelectedCustomerSales] = useState<SaleRecord[]>([])
  const [isGlobalPaymentDialogOpen, setIsGlobalPaymentDialogOpen] = useState(false)

  // Customer profile details state
  const [showCustomerProfileDetails, setShowCustomerProfileDetails] = useState(false)
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null)
  const [selectedCustomerDetailsSales, setSelectedCustomerDetailsSales] = useState<SaleRecord[]>([])
  const [selectedCustomerDetailsPaymentRecords, setSelectedCustomerDetailsPaymentRecords] = useState<CustomerCredit[]>([])

  // Customer ledger state
  const [showCustomerLedger, setShowCustomerLedger] = useState(false)
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null)

  // Customer profile page state
  const [showCustomerProfilePage, setShowCustomerProfilePage] = useState(false)
  const [selectedCustomerForProfilePage, setSelectedCustomerForProfilePage] = useState<Customer | null>(null)

  // Restore profile state from localStorage on component mount
  useEffect(() => {
    const savedProfileState = localStorage.getItem('salesLedgerProfileState')
    console.log('Profile restoration check:', { savedProfileState, loading, customersLength: customers.length, salesRecordsLength: salesRecords.length })

    if (savedProfileState && !loading && customers.length > 0 && salesRecords.length > 0) {
      try {
        const { showProfile, customerId } = JSON.parse(savedProfileState)
        console.log('Parsed profile state:', { showProfile, customerId })

        if (showProfile && customerId) {
          const customer = customers.find(c => c.id === customerId)
          console.log('Found customer:', customer)

          if (customer) {
            // Check if there are sales for this customer
            const customerSales = salesRecords.filter(sale => sale.customerName === customer.name)
            console.log('Customer sales found:', customerSales.length)

            if (customerSales.length > 0) {
              console.log('Restoring profile for customer:', customer.name)
              setSelectedCustomerForProfilePage(customer)
              setShowCustomerProfilePage(true)
              // Scroll to top when opening profile
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
              console.log('No sales found for customer, clearing state')
              // Clear invalid state if no sales found
              localStorage.removeItem('salesLedgerProfileState')
            }
          } else {
            console.log('Customer not found, clearing state')
            // Clear invalid state if customer not found
            localStorage.removeItem('salesLedgerProfileState')
          }
        }
      } catch (error) {
        console.error('Error restoring profile state:', error)
        localStorage.removeItem('salesLedgerProfileState')
      }
    }
  }, [customers, salesRecords, loading])

  // Save profile state to localStorage when profile is opened/closed
  useEffect(() => {
    if (showCustomerProfilePage && selectedCustomerForProfilePage) {
      localStorage.setItem('salesLedgerProfileState', JSON.stringify({
        showProfile: true,
        customerId: selectedCustomerForProfilePage.id
      }))
    } else {
      localStorage.removeItem('salesLedgerProfileState')
    }
  }, [showCustomerProfilePage, selectedCustomerForProfilePage])

  const handleDiscardSale = (record: SaleRecord) => {
    setSaleToDiscard(record);
    setIsDiscardDialogOpen(true);
  }

  const handleEditSale = (record: SaleRecord) => {
    handleSaleDetailOpen(record);
  }



  // Customer profile handlers

  const handleGlobalPaymentSuccess = async () => {
    await loadSalesData()
    setIsGlobalPaymentDialogOpen(false)
    setSelectedCustomerForPayment(null)
    setSelectedCustomerSales([])
  }

  // Customer profile details handlers

  // Customer ledger handlers

  const handleCustomerLedgerBack = () => {
    setShowCustomerLedger(false)
    setSelectedCustomerForLedger(null)
  }

  // Customer profile page handlers
  const handleCustomerProfilePage = (customer: Customer) => {
    setSelectedCustomerForProfilePage(customer)
    setShowCustomerProfilePage(true)
    // Scroll to top when opening profile
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCustomerProfilePageBack = () => {
    setShowCustomerProfilePage(false)
    setSelectedCustomerForProfilePage(null)
  }

  const handleCustomerProfileDetailsBack = () => {
    setShowCustomerProfileDetails(false)
    setSelectedCustomerForDetails(null)
    setSelectedCustomerDetailsSales([])
    setSelectedCustomerDetailsPaymentRecords([])

    // Remove URL parameter
    const params = new URLSearchParams(searchParams.toString())
    params.delete('customerId')
    router.push(`?${params.toString()}`)
  }

  const handleCustomerProfileDetailsPaymentSuccess = async () => {
    // Refresh main data
    await loadSalesData()

    // Refresh profile data if we're in profile view
    if (showCustomerProfileDetails && selectedCustomerForDetails) {
      // Get fresh customer credits after the main data is loaded
      const allCredits = await CustomerCreditService.getAll<CustomerCredit>("customerCredits")
      const customerCredits = allCredits.filter(credit => credit.customerId === selectedCustomerForDetails.id)
      setSelectedCustomerDetailsPaymentRecords(customerCredits)
    }
  }




  const handleProfileSaleCreated = async (sale: SaleRecord) => {
    // Refresh main data
    await loadSalesData()

    // Refresh profile data if we're in profile view
    if (showCustomerProfileDetails && selectedCustomerForDetails) {
      // Get fresh data after the main data is loaded
      const freshSales = await SalesService.getAllSales()
      const customerSales = freshSales.filter(s => s.customerName === selectedCustomerForDetails.name)
      const allCredits = await CustomerCreditService.getAll<CustomerCredit>("customerCredits")
      const customerCredits = allCredits.filter(credit => credit.customerId === selectedCustomerForDetails.id)

      setSelectedCustomerDetailsSales(customerSales)
      setSelectedCustomerDetailsPaymentRecords(customerCredits)
    }

    toast({
      title: "Sale Created",
      description: `Credit sale #${sale.invoiceNumber} created successfully`,
    })
  }

  const handleSaleDetailOpen = (sale: SaleRecord) => {
    setSelectedSaleForDetail(sale)
    setShowSaleDetail(true)
  }

  const handleSaleDetailBack = () => {
    setShowSaleDetail(false)
    setSelectedSaleForDetail(null)
  }

  const confirmDiscardSale = async () => {
    if (!saleToDiscard) return;

    try {
      setIsDiscarding(true);

      // Call the discard sale service method
      await SalesService.discardSale(saleToDiscard.id);

      // Check if current page is still valid after deletion
      // We need to recalculate the filtered sales after deletion
      const currentFilteredSales = salesRecords.filter((record) => {
        const matchesSearch =
          (record.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (record.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (record.customerPhone || '').includes(searchTerm) ||
          (record.customerAddress || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || record.deliveryStatus === statusFilter;
        const matchesPayment = paymentFilter === "all" || record.paymentStatus === paymentFilter;

        return matchesSearch && matchesStatus && matchesPayment;
      });

      const totalPages = Math.ceil(currentFilteredSales.length / SALES_PER_PAGE);
      if (allSalesPage > totalPages && totalPages > 0) {
        setAllSalesPage(totalPages);
      }

      toast({
        title: "Sale Discarded",
        description: `Sale ${saleToDiscard.invoiceNumber} has been discarded and inventory has been restored.`,
      });

      setIsDiscardDialogOpen(false);
      setSaleToDiscard(null);
    } catch (error) {
      console.error("Error discarding sale:", error);
      toast({
        title: "Error",
        description: "Failed to discard sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDiscarding(false);
    }
  };

  // Pagination state for each tab
  const [allSalesPage, setAllSalesPage] = useState(1);
  const SALES_PER_PAGE = 10;

  // useCallback to avoid warning about loadSalesData in useEffect deps
  const loadSalesData = useCallback(async () => {
    try {
      setLoading(true)
      const [sales, credits, customersData] = await Promise.all([
        SalesService.getAllSales(),
        CustomerCreditService.getAll<CustomerCredit>("customerCredits"),
        CustomerService.getAllCustomers()
      ])
      console.log('Loaded sales data:', sales.length, 'records');
      console.log('Sample sales record:', sales[0]);
      setSalesRecords(sales)
      setCreditSalePaymentRecords(credits)
      setCustomers(customersData)
    } catch (error) {
      console.error("Error loading sales data:", error)
      toast({
        title: "Error",
        description: "Failed to load sales data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSalesData()

    // Set up real-time listener
    const unsubscribe = SalesService.subscribeToSales((sales: SaleRecord[]) => {
      console.log('Real-time sales update:', sales.length, 'records');
      setSalesRecords(sales)
      setLoading(false)
    })

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [loadSalesData])

  // Handle URL parameters for customer profile details
  useEffect(() => {
    const customerId = searchParams.get('customerId')
    if (customerId && !loading && salesRecords.length > 0) {
      // Find first sale to get customer name (customerId might be phone or name)
      const firstSale = salesRecords.find(sale => sale.customerPhone === customerId || sale.customerName === customerId)
      if (firstSale) {
        // Filter all sales by customer name (names are unique)
        const customerSales = salesRecords.filter(sale => sale.customerName === firstSale.customerName)
        const customer: Customer = {
          id: customerId,
          name: firstSale.customerName,
          phone: firstSale.customerPhone,
          address: firstSale.customerAddress || "",
          email: "",
          customerType: "regular",
          totalPurchases: 0,
          totalSpent: 0,
          creditLimit: 0,
          currentCredit: 0,
          notes: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active"
        }

        // Load payment records for this customer
        const loadCustomerPaymentRecords = async () => {
          try {
            const allCredits = await CustomerCreditService.getAll<CustomerCredit>("customerCredits")
            const customerCredits = allCredits.filter(credit => credit.customerId === customerId)
            setSelectedCustomerForDetails(customer)
            setSelectedCustomerDetailsSales(customerSales)
            setSelectedCustomerDetailsPaymentRecords(customerCredits)
            setShowCustomerProfileDetails(true)
            // Scroll to top when opening profile details
            window.scrollTo({ top: 0, behavior: 'smooth' })
          } catch (error) {
            console.error("Error loading customer payment records:", error)
          }
        }

        loadCustomerPaymentRecords()
      }
    }
  }, [searchParams, salesRecords, loading])


  useEffect(() => {
    setAllSalesPage(1);
  }, [searchTerm, statusFilter, paymentFilter, /* dateFilter removed */]);

  // const updateDeliveryStatus = async (saleId: string, status: "pickup" | "delivered" | "pending" | "cancelled") => {
  //   try {
  //     await SalesService.updateSale(saleId, {
  //       deliveryStatus: status,
  //       updatedAt: new Date().toISOString(),
  //     })

  //     toast({
  //       title: "Success",
  //       description: `Delivery status updated to ${status}`,
  //     })
  //   } catch (error) {
  //     console.error("Error updating delivery status:", error)
  //     toast({
  //       title: "Error",
  //       description: "Failed to update delivery status",
  //       variant: "destructive",
  //     })
  //   }
  // }

  // const updatePaymentStatus = async (saleId: string, status: "paid" | "partial" | "pending") => {
  //   try {
  //     await SalesService.updateSale(saleId, {
  //       paymentStatus: status,
  //       updatedAt: new Date().toISOString(),
  //     })

  //     toast({
  //       title: "Success",
  //       description: `Payment status updated to ${status}`,
  //     })
  //   } catch (error) {
  //     console.error("Error updating payment status:", error)
  //     toast({
  //       title: "Error",
  //       description: "Failed to update payment status",
  //       variant: "destructive",
  //     })
  //   }
  // }

  const handleViewDetails = (record: SaleRecord) => {
    setSelectedRecord(record)
    setIsViewDialogOpen(true)
  }

  const handleCallCustomer = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_blank')
      toast({
        title: "Calling Customer",
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
  const handlePrintInvoice = async (record: SaleRecord) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const invoiceHtml = generateInvoiceHTML(record)
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
  const handleThermalPrint = async (record: SaleRecord) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    if (!printWindow) return

    const thermalHtml = generateThermalInvoiceHTML(record)
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
  const handleWhatsAppInvoice = async (record: SaleRecord) => {
    if (!record.customerPhone) {
      toast({
        title: "Missing Phone Number",
        description: "Customer phone number not available for WhatsApp",
        variant: "destructive",
      })
      return
    }

    const phone = record.customerPhone.startsWith("0") && record.customerPhone.length === 11
      ? record.customerPhone.replace("0", "+92")
      : record.customerPhone.startsWith("+92")
        ? record.customerPhone
        : `+92${record.customerPhone}`

    const message = `Hi ${record.customerName}! Your invoice #${record.invoiceNumber} is ready. Please check the details.`
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Generate invoice HTML (reusing POS invoice design)
  const generateInvoiceHTML = (record: SaleRecord) => {
    return `
      <html>
        <head>
          <title>Invoice</title>
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
                  <p><strong>Invoice Number:</strong> ${record.invoiceNumber}</p>
                  <p><strong>Date:</strong> ${formatDate(record.date)} | <strong>Time:</strong> ${record.time}</p>
                  <p><strong>Customer:</strong> ${record.customerName}</p>
                  <p><strong>Customer Address:</strong> ${record.customerAddress || 'N/A'}</p>
                  <p><strong>Contact:</strong> ${record.customerPhone}</p>
                  <p><strong>Staff Member:</strong> ${record.staffName}</p>
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
              ${record.items.map((item) => `
                <tr>
                  <td style="font-size: 12px;">${item.name || 'N/A'}</td>
                  <td class="text-right" style="font-size: 12px;">${item.quantity || 0}${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? ` + ${item.tradeDiscountFreeItems}(TD)` : ''}</td>
                  <td class="text-right" style="font-size: 12px;">${((item.unitPrice || item.finalPrice || 0) === 0 ? 'FREE' : `Rs${(item.unitPrice || item.finalPrice || 0).toLocaleString()}`)}</td>
                  <td class="text-right" style="font-size: 12px;">${((item.unitPrice || item.finalPrice || 0) === 0 ? 'Rs0' : `Rs${((item.unitPrice || item.finalPrice || 0) * (item.quantity || 0)).toLocaleString()}`)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="display: flex; justify-content: flex-end; align-items: flex-end; margin-top: 18px;">
            <div class="totals">
              <table style="width: 300px; margin: 0;">
              <tr><td><strong>Subtotal:</strong></td><td class="text-right">Rs${(record.subtotal || 0).toLocaleString()}</td></tr>
              <tr class="discount-row">
                <td><strong>Total Discount: (${(record.totalDiscount || 0) > 0 && (record.subtotal || 0) > 0 ? Math.round(((record.totalDiscount || 0) / (record.subtotal || 0)) * 100) : 0}%)</strong></td>
                <td class="text-right">-Rs${(record.totalDiscount || 0).toLocaleString()}</td>
              </tr>
              <tr class="total-row"><td><strong>TOTAL:</strong></td><td class="text-right">Rs${(record.total || 0).toLocaleString()}</td></tr>
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

  // Generate thermal invoice HTML (compact format for thermal printers)
  const generateThermalInvoiceHTML = (record: SaleRecord) => {
    return `
      <html>
        <head>
          <title>Thermal Invoice</title>
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
            <p><strong>Invoice #:</strong> ${record.invoiceNumber}</p>
            <p><strong>Date:</strong> ${formatDate(record.date)} | <strong>Time:</strong> ${record.time}</p>
            <p><strong>Customer:</strong> ${record.customerName}</p>
            ${record.customerPhone ? `<p><strong>Phone:</strong> ${record.customerPhone}</p>` : ''}
            <p><strong>Staff:</strong> ${record.staffName}</p>
          </div>
          
          <div class="divider"></div>
          
          <table class="items-table">
            <tr>
              <td class="item-name"><strong>ITEM</strong></td>
              <td class="item-qty"><strong>QTY</strong></td>
              <td class="item-price"><strong>PRICE</strong></td>
              <td class="item-total"><strong>TOTAL</strong></td>
            </tr>
            ${record.items.map((item) => {
      const unitPrice = item.unitPrice || item.finalPrice || 0;
      const totalPrice = unitPrice * (item.quantity || 0);
      return `
              <tr>
                <td class="item-name">${item.name || 'N/A'}</td>
                <td class="item-qty">${item.quantity || 0}${item.tradeDiscountFreeItems && item.tradeDiscountFreeItems > 0 ? `+${item.tradeDiscountFreeItems}` : ''}</td>
                <td class="item-price">${unitPrice === 0 ? 'FREE' : unitPrice.toLocaleString()}</td>
                <td class="item-total">${unitPrice === 0 ? 'FREE' : totalPrice.toLocaleString()}</td>
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
            <p class="right">Subtotal: Rs${(record.subtotal || 0).toLocaleString()}</p>
            ${(record.totalDiscount || 0) > 0 ? `<p class="right">Discount: -Rs${(record.totalDiscount || 0).toLocaleString()}</p>` : ''}
            <p class="right total-line">TOTAL: Rs${(record.total || 0).toLocaleString()}</p>
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

  const handleMessageCustomer = (phone: string, customerName: string) => {
    if (phone) {
      const message = `Hello ${customerName}, thank you for your purchase. We hope you're satisfied with your order!`
      const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      toast({
        title: "Messaging Customer",
        description: `Opening WhatsApp chat with ${customerName}`,
      })
    } else {
      toast({
        title: "Error",
        description: "No phone number available",
        variant: "destructive",
      })
    }
  }

  const generateSalesReport = async () => {
    try {
      setIsGeneratingReport(true)

      // Filter sales by date range if both dates are set
      let filteredSales = salesRecords;
      if (reportStartDate && reportEndDate) {
        const start = new Date(reportStartDate);
        const end = new Date(reportEndDate);
        // Set end date to end of day to include all records from that day
        end.setHours(23, 59, 59, 999);

        filteredSales = salesRecords.filter(record => {
          if (!record.date) return false;
          // Handle different date formats (DD/MM/YYYY or ISO string)
          let saleDate;
          if (record.date.includes('/')) {
            // Handle DD/MM/YYYY format
            const parts = record.date.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
              const year = parseInt(parts[2], 10);
              saleDate = new Date(year, month, day);
            } else {
              saleDate = new Date(record.date);
            }
          } else {
            saleDate = new Date(record.date);
          }
          // Check if date is valid
          if (isNaN(saleDate.getTime())) {
            console.warn('Invalid date found:', record.date);
            return false;
          }
          return saleDate >= start && saleDate <= end;
        });
      }

      console.log('Total sales records:', salesRecords.length);
      console.log('Filtered sales records:', filteredSales.length);
      console.log('Date range:', reportStartDate, 'to', reportEndDate);
      console.log('Sample sales record:', salesRecords[0]);
      console.log('Sample filtered record:', filteredSales[0]);

      // If no records found with date filter, use all records
      if (filteredSales.length === 0 && salesRecords.length > 0) {
        console.log('No records found with date filter, using all records');
        filteredSales = salesRecords;
      }

      // Final check - if still no records, log detailed info
      if (filteredSales.length === 0) {
        console.error('No sales records available for report generation');
        console.log('Sales records array:', salesRecords);
        console.log('Report start date:', reportStartDate);
        console.log('Report end date:', reportEndDate);

        // Force use all records as last resort
        if (salesRecords.length > 0) {
          console.log('Forcing use of all sales records as last resort');
          filteredSales = salesRecords;
        }
      }

      // Create CSV content
      const csvHeaders = [
        "Invoice Number",
        "Date",
        "Customer Name",
        "Customer Phone",
        "Customer Address",
        "Customer Type",
        "Items Count",
        "Subtotal",
        "Discount",
        "Total",
        "Payment Method",
        "Payment Status",
        "Delivery Status",
        "Staff Member",
        "Notes"
      ]

      const csvRows = filteredSales.map(record => [
        record.invoiceNumber,
        record.date,
        record.customerName,
        record.customerPhone,
        record.customerAddress || '',
        record.customerType,
        record.items?.length || 0,
        record.subtotal,
        record.discount,
        record.total,
        record.paymentMethod,
        record.paymentStatus,
        record.deliveryStatus,
        record.staffMember,
        record.notes
      ])

      console.log('CSV rows to generate:', csvRows.length);
      console.log('Sample CSV row:', csvRows[0]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      console.log('Generated CSV content length:', csvContent.length);
      console.log('CSV content preview:', csvContent.substring(0, 500));

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-report-${reportStartDate || 'all'}-to-${reportEndDate || 'all'}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Report Generated",
        description: "Sales report has been downloaded successfully",
      })
      setIsReportDialogOpen(false);
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate sales report",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const generateWhatsAppSalesReport = async () => {
    try {
      setIsGeneratingReport(true)

      // Filter sales by date range if both dates are set
      let filteredSales = salesRecords;
      if (reportStartDate && reportEndDate) {
        const start = new Date(reportStartDate);
        const end = new Date(reportEndDate);
        // Set end date to end of day to include all records from that day
        end.setHours(23, 59, 59, 999);

        filteredSales = salesRecords.filter(record => {
          if (!record.date) return false;
          // Handle different date formats (DD/MM/YYYY or ISO string)
          let saleDate;
          if (record.date.includes('/')) {
            // Handle DD/MM/YYYY format
            const parts = record.date.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
              const year = parseInt(parts[2], 10);
              saleDate = new Date(year, month, day);
            } else {
              saleDate = new Date(record.date);
            }
          } else {
            saleDate = new Date(record.date);
          }
          // Check if date is valid
          if (isNaN(saleDate.getTime())) {
            console.warn('Invalid date found:', record.date);
            return false;
          }
          return saleDate >= start && saleDate <= end;
        });
      }

      // If no records found with date filter, use all records
      if (filteredSales.length === 0 && salesRecords.length > 0) {
        filteredSales = salesRecords;
      }

      // Calculate totals
      const totalSales = filteredSales.reduce((sum, record) => sum + (record.total || 0), 0)
      const totalDiscount = filteredSales.reduce((sum, record) => sum + (record.discount || 0), 0)
      const totalTransactions = filteredSales.length

      // Generate HTML content for PDF
      const htmlContent = `
        <html>
          <head>
            <title>Sales Report - ${reportStartDate || 'All'} to ${reportEndDate || 'All'}</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white;
                line-height: 1.6;
                color: #333;
              }
              .report-container {
                background: white;
                padding: 30px;
                max-width: 100%;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
              }
              .header h1 { 
                margin: 0 0 10px 0; 
                font-size: 28px; 
                color: #1e40af;
                font-weight: 700;
              }
              .header h2 { 
                margin: 0; 
                font-size: 18px; 
                color: #6b7280;
                font-weight: 400;
              }
              .summary { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 20px; 
                margin-bottom: 30px; 
              }
              .summary-card { 
                background: #f8fafc; 
                padding: 20px; 
                border-radius: 8px; 
                text-align: center;
                border: 1px solid #e2e8f0;
              }
              .summary-card h3 { 
                margin: 0 0 10px 0; 
                font-size: 14px; 
                color: #64748b; 
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .summary-card .value { 
                font-size: 24px; 
                font-weight: 700; 
                color: #1e40af;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              th, td { 
                padding: 12px 15px; 
                text-align: left; 
                border-bottom: 1px solid #e2e8f0;
              }
              th { 
                background: #f8fafc; 
                font-weight: 600; 
                color: #374151;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              td { 
                font-size: 14px;
              }
              .footer { 
                margin-top: 30px; 
                text-align: center; 
                color: #6b7280; 
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="report-container">
              <div class="header">
                <h1>Sales Report</h1>
                <h2>${reportStartDate || 'All Time'} to ${reportEndDate || 'Present'}</h2>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="summary">
                <div class="summary-card">
                  <h3>Total Sales</h3>
                  <div class="value">Rs${totalSales.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                  <h3>Total Discount</h3>
                  <div class="value">Rs${totalDiscount.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                  <h3>Total Transactions</h3>
                  <div class="value">${totalTransactions}</div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredSales.slice(0, 50).map(record => `
                    <tr>
                      <td>${record.invoiceNumber}</td>
                      <td>${record.date}</td>
                      <td>${record.customerName}</td>
                      <td>${record.items?.length || 0}</td>
                      <td>Rs${(record.total || 0).toLocaleString()}</td>
                      <td>${record.paymentMethod}</td>
                      <td>${record.paymentStatus}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              ${filteredSales.length > 50 ? `<p style="text-align: center; margin-top: 20px; color: #6b7280;">Showing first 50 of ${filteredSales.length} transactions</p>` : ''}
              
              <div class="footer">
                <p>This report was generated on ${new Date().toLocaleString()}</p>
                <p>Bin Sultan Fabrics Management System</p>
              </div>
            </div>
          </body>
        </html>
      `

      // Generate PDF blob
      const pdfBlob = await generatePDFFromHTML(htmlContent, {
        fileName: `sales-report-${reportStartDate || 'all'}-to-${reportEndDate || 'all'}.pdf`,
        width: 800,
        height: 600
      })

      // For sales report, we'll need to get a phone number from the user or use a default
      // For now, we'll show a message that they need to provide a phone number
      toast({
        title: "WhatsApp Export",
        description: "PDF generated successfully. Please provide a phone number to send via WhatsApp.",
        variant: "default",
      })

      // For now, we'll just download the PDF
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-report-${reportStartDate || 'all'}-to-${reportEndDate || 'all'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setIsReportDialogOpen(false)
    } catch (error) {
      console.error("Error generating WhatsApp report:", error)
      toast({
        title: "Error",
        description: "Failed to generate WhatsApp report",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }


  // Memoized filtered sales for better performance
  // Helper function to check if a date matches the filter
  // Helper function to check if a date matches the filter
  const matchesDateFilter = useCallback((record: SaleRecord) => {
    if (!startDate && !endDate) return true;
    if (!record.date) return false;

    // Parse record date (handling YYYY-MM-DD format)
    let recordDate: Date;
    if (record.date.includes('/')) {
      const parts = record.date.split('/');
      // Assuming DD/MM/YYYY
      recordDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      const parts = record.date.split('-');
      // Assuming YYYY-MM-DD
      recordDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }

    // Check if date is valid
    if (isNaN(recordDate.getTime())) {
      return false;
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      // Debug log (only once or for first few items to avoid spam)
      // console.log(`Checking record date: ${record.date} (${recordDate.toDateString()}) against start: ${start.toDateString()} -> ${recordDate < start ? 'Fail' : 'Pass'}`);
      if (recordDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (recordDate > end) return false;
    }
    return true;
  }, [startDate, endDate]);

  const filteredSales = useMemo(() => {
    return salesRecords.filter((record) => {
      const matchesSearch =
        (record.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.customerPhone || '').includes(searchTerm) ||
        (record.customerAddress || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || record.deliveryStatus === statusFilter;
      const matchesPayment = paymentFilter === "all" || record.paymentStatus === paymentFilter;
      // matchesDate is unused for the main list
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [salesRecords, searchTerm, statusFilter, paymentFilter]);

  // Memoized sorted filtered sales
  const sortedFilteredSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      // Use createdAt if available, otherwise fall back to date+time combination
      const aDateTime = a.createdAt ? new Date(a.createdAt) : new Date(`${a.date}T${a.time ? a.time : '00:00:00'}`);
      const bDateTime = b.createdAt ? new Date(b.createdAt) : new Date(`${b.date}T${b.time ? b.time : '00:00:00'}`);
      return bDateTime.getTime() - aDateTime.getTime();
    });
  }, [filteredSales]);

  const allSalesTotalPages = Math.ceil(sortedFilteredSales.length / SALES_PER_PAGE);
  const paginatedSales = sortedFilteredSales.slice((allSalesPage - 1) * SALES_PER_PAGE, allSalesPage * SALES_PER_PAGE);

  // 4. Use paginatedSales for rendering
  const filteredRecords = paginatedSales;

  // Date filtered sales specifically for stats (ignoring search/status filters)
  const dateFilteredSales = useMemo(() => {
    return salesRecords.filter(matchesDateFilter);
  }, [salesRecords, matchesDateFilter]);

  const totalSales = dateFilteredSales.reduce((sum, record) => sum + (typeof record.total === "number" ? record.total : 0), 0)
  const totalDiscount = dateFilteredSales.reduce((sum, record) => sum + (typeof record.discount === "number" ? record.discount : 0), 0)

  // Paid sales cash within selected date range
  const paidSalesCashFiltered = dateFilteredSales
    .filter((record) =>
      record.deliveryStatus !== "cancelled" &&
      record.paymentStatus === "paid" &&
      (record.paymentMethod === "cash" || record.paymentMethod === "card" || record.paymentMethod === "mobile")
    )
    .reduce((sum, record) => sum + (typeof record.total === "number" ? record.total : 0), 0)

  // NOTE: Credit Pending Cash logic is complex to filter by date because "Pending" is a current state.
  // Using "Credit Sales made in date range" - "Payments made in date range" might be better?
  // Or just "Pending amount of sales made in date range"?
  // If I sold on credit yesterday, and paid today.
  // If filter is "Today", sale is not shown.
  // The user says "reset the amounts to zero... just in display".
  // Let's calculate "Credit Pending" for sales *originated* in the date range.
  // Ideally: sum(sale.total - sale.amountPaid) for sales in range where paymentStatus != paid.
  // But we don't track amountPaid on sale record directly in snippet? 
  // Let's look at `creditPendingCashToday` implementation in original code.
  // Calculate sales made today
  const today = new Date()
  // Use same format as POS system: YYYY-MM-DD format
  const todayYYYYMMDD = today.toISOString().split('T')[0]

  // Removed legacy "sales today" amount in favor of paidSalesCashToday



  // New Logic:
  // const creditSalesFiltered = dateFilteredSales.filter(r => r.paymentMethod === 'credit' && r.deliveryStatus !== 'cancelled');
  // const creditSalesAmountFiltered = creditSalesFiltered.reduce((sum, r) => sum + (r.total || 0), 0);

  // For partial payments, we need to know if they happened within the date range?
  // OR if they are against the sales within the date range?
  // The original code filtered payments made TODAY.
  // If I select "Last Month", I probably want:
  // Option A: Cash collected from credit sales (payments made in date range).
  // Option B: Outstanding balance of sales made in date range.
  // The card title is "Credit Pending Cash". This usually means "How much is yet to be collected from these sales".
  // So: Total Credit Sales in Range - Payments Recieved (TOTAL) for these sales.
  // OR: Total Credit Sales in Range - Payments Recieved (IN DATE RANGE) for these sales?
  // Let's stick to "Outstanding Balance of Sales in Range".
  // But `creditSalePaymentRecords` tracks payments.
  // I will simplify and just use: sum of (total) for credit sales in range. 
  // Wait, that's "Total Credit Sales". 
  // Let's look at `creditPendingCashToday` again.
  // `totalCreditSalesAmountToday - totalCreditPaymentsToday`.
  // `totalCreditPaymentsToday` was payments made TODAY against TODAY's sales.

  // I'll calculate: `creditSalesAmountInDateRange`.
  // And `paymentsInDateRange`? No, payments made *against those sales*.
  // Ideally, I should sum `currentDue` of customers? No.

  // Let's replicate original logic but generalized:
  // Credit Sales in Range.
  // Payments against THOSE sales (any time? or in range?). 
  // Original: Payments TODAY against TODAY sales.
  // So likely: Payments IN RANGE against SALES IN RANGE.
  // This gives "Net Cash Flow" view?
  // "Credit Pending Cash" usually implies "What is LEFT to collect".
  // If I use (Total Sales In Range) - (All Payments for those sales), that is "Pending Amount from these sales".
  // If I use (All Payments In Range), that is "Cash Collected".

  // Filter credit sales in the selected date range
  const creditSalesFiltered = dateFilteredSales.filter(r => r.paymentMethod === 'credit' && r.deliveryStatus !== 'cancelled');

  const creditSalesIds = new Set(creditSalesFiltered.map(s => s.id));
  const relevantPayments = creditSalePaymentRecords.filter(p =>
    p.saleId && creditSalesIds.has(p.saleId)
  );
  // Filter payments that are ALSO in date range?
  // "reset amounts to 0... based on selected date range".
  // Use payments made in that range.
  const paymentsInDateRange = relevantPayments.filter(p => {
    // Check p.createdAt in range
    if (!p.createdAt) return false;
    const pDate = new Date(p.createdAt);
    if (startDate && pDate < startDate) return false;
    if (endDate && pDate > endDate) return false;
    return true;
  });

  const totalCreditSalesAmountFiltered = creditSalesFiltered.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalCreditPaymentsFiltered = paymentsInDateRange.reduce((sum, p) => sum + (p.amount || 0), 0);

  const creditPendingCashFiltered = Math.max(0, totalCreditSalesAmountFiltered - totalCreditPaymentsFiltered);

  // Calculate today's sales with pagination - match YYYY-MM-DD format
  const todaySales = salesRecords.filter((record) => {
    if (!record.date) return false
    return record.date === todayYYYYMMDD && record.deliveryStatus !== "cancelled"
  }).sort((a, b) => {
    // Sort by invoice number (largest first)
    const aInvoiceNum = parseInt(a.invoiceNumber?.replace(/\D/g, '') || '0', 10)
    const bInvoiceNum = parseInt(b.invoiceNumber?.replace(/\D/g, '') || '0', 10)
    return bInvoiceNum - aInvoiceNum
  })
  const todaySalesTotalPages = Math.ceil(todaySales.length / todaySalesPerPage)
  const todaySalesStartIndex = (todaySalesPage - 1) * todaySalesPerPage
  const todaySalesEndIndex = todaySalesStartIndex + todaySalesPerPage
  const paginatedTodaySales = todaySales.slice(todaySalesStartIndex, todaySalesEndIndex)

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case "vip":
        return "default"
      case "regular":
        return "secondary"
      case "walk-in":
        return "outline"
      default:
        return "outline"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "partial":
        return "secondary"
      case "pending":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "default"
      case "pickup":
        return "secondary"
      case "pending":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading sales data...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {showCustomerProfilePage && selectedCustomerForProfilePage ? (
        <CustomerProfilePage
          customer={selectedCustomerForProfilePage}
          allSales={salesRecords.filter(sale =>
            sale.customerName === selectedCustomerForProfilePage.name
          )}
          paymentRecords={creditSalePaymentRecords.filter(pr =>
            pr.customerId === selectedCustomerForProfilePage.id
          )}
          onBack={handleCustomerProfilePageBack}
          onPaymentSuccess={handleCustomerProfileDetailsPaymentSuccess}
          onSaleCreated={handleProfileSaleCreated} // Fixed interface type
        />
      ) : showCustomerProfileDetails && selectedCustomerForDetails ? (
        <CustomerProfileDetails
          customer={selectedCustomerForDetails}
          sales={selectedCustomerDetailsSales}
          paymentRecords={selectedCustomerDetailsPaymentRecords}
          onBack={handleCustomerProfileDetailsBack}
          onPaymentSuccess={handleCustomerProfileDetailsPaymentSuccess}
          onSaleCreated={handleProfileSaleCreated}
        />
      ) : showCustomerLedger && selectedCustomerForLedger ? (
        <CustomerLedger
          customerId={selectedCustomerForLedger.id}
          customerName={selectedCustomerForLedger.name}
          customerPhone={selectedCustomerForLedger.phone}
          customerAddress={selectedCustomerForLedger.address}
          initialBalance={0}
          onBack={handleCustomerLedgerBack}
        />
      ) : showSaleDetail && selectedSaleForDetail ? (
        <SaleDetail
          sale={selectedSaleForDetail}
          onBack={handleSaleDetailBack}
          onSaleUpdated={loadSalesData}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Sales Ledger</h2>
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
          <div className="grid gap-2 sm:gap-3 md:gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs{totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{dateFilteredSales.length} transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">Rs{totalDiscount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {totalSales > 0 ? ((totalDiscount / (totalSales + totalDiscount)) * 100).toFixed(1) : 0}% of gross sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Paid Sales Cash</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Rs{paidSalesCashFiltered.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Cash from fully paid sales in period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Credit Pending Cash</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">Rs{creditPendingCashFiltered.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Cash pending from credit sales in period</p>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Sales Management</h3>
                <p className="text-sm text-muted-foreground">View and manage different types of sales records</p>
              </div>
            </div>

            {/* Show tabs - credit sale detail functionality removed in favor of customer credits */}
            {(
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="w-full justify-start flex-wrap h-auto gap-2 p-1">
                  <TabsTrigger value="all-sales">📊 All Sales</TabsTrigger>
                  <TabsTrigger value="pending-delivery">📅 Today&apos;s Sales</TabsTrigger>
                  <TabsTrigger value="pending-payment">💳 Pending Payment</TabsTrigger>
                </TabsList>

                <TabsContent value="all-sales" className="space-y-4">
                  {/* Search and Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Search & Filter Sales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 w-full">
                          <Input
                            placeholder="Search by invoice, customer name, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                          />
                        </div>

                        <div className="flex flex-row gap-2 w-full md:w-auto">
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="pickup">Pickup</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                            <SelectTrigger className="w-full md:w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Payments</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="partial">Partial</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sales Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Sales Records
                      </CardTitle>
                      <CardDescription>Complete transaction history with customer and delivery details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[140px]">Invoice</TableHead>
                              <TableHead className="min-w-[160px]">Customer</TableHead>
                              <TableHead className="hidden sm:table-cell">Items</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Payment</TableHead>
                              <TableHead className="hidden md:table-cell">Delivery</TableHead>
                              <TableHead className="hidden lg:table-cell">Staff</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRecords.map((record) => (
                              <TableRow key={record.id} className="h-24">
                                <TableCell className="h-24 align-top">
                                  <div>
                                    <p className="font-medium">{record.invoiceNumber}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {record.date} • {record.time}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="h-24 align-top">
                                  <div>
                                    <p className="font-medium">{record.customerName}</p>
                                    <p className="text-sm text-muted-foreground">{record.customerPhone}</p>
                                    {record.customerAddress && (
                                      <p className="text-xs text-muted-foreground">{record.customerAddress}</p>
                                    )}
                                    <Badge variant={getCustomerTypeColor(record.customerType) as "destructive" | "default" | "secondary" | "outline" | undefined} className="text-xs">
                                      {record.customerType}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="h-24 align-top hidden sm:table-cell">
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
                                    <p className="font-medium">Rs{typeof record.total === "number" ? record.total.toLocaleString() : 0}</p>
                                    {record.discount > 0 && (
                                      <p className="text-xs text-red-600">-Rs{typeof record.discount === "number" ? record.discount.toLocaleString() : 0} discount</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="h-24 align-top">
                                  <div className="space-y-1">
                                    <Badge variant={getPaymentStatusColor(record.paymentStatus) as "destructive" | "default" | "secondary" | "outline" | undefined}>
                                      {record.paymentStatus}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">{record.paymentMethod}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="h-24 align-top hidden md:table-cell">
                                  <div className="space-y-1">
                                    <Badge variant={getDeliveryStatusColor(record.deliveryStatus) as "destructive" | "default" | "secondary" | "outline" | undefined}>
                                      {record.deliveryStatus}
                                    </Badge>
                                    {/* Delivery status is now only shown, not editable here */}
                                    {record.deliveryAddress && (
                                      <p className="text-xs text-muted-foreground">{record.deliveryAddress}</p>
                                    )}
                                    {record.deliveryDate && (
                                      <p className="text-xs text-muted-foreground">{record.deliveryDate}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="h-24 align-top hidden lg:table-cell">
                                  <p className="text-sm">{record.staffName || record.staffMember}</p>
                                </TableCell>
                                <TableCell className="h-24 align-top">
                                  <div className="flex flex-wrap gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewDetails(record)}
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditSale(record)}
                                      title="Edit Sale"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePrintInvoice(record)}
                                      title="Print Invoice"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleThermalPrint(record)}
                                      title="Thermal Print"
                                    >
                                      <Receipt className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleWhatsAppInvoice(record)}
                                      title="Send WhatsApp"
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCallCustomer(record.customerPhone)}
                                      title="Call Customer"
                                    >
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDiscardSale(record)}
                                      title="Discard Sale"
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

                  {/* All Sales Pagination */}
                  {allSalesTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAllSalesPage(p => Math.max(1, p - 1))}
                        disabled={allSalesPage === 1}
                      >
                        Prev
                      </Button>
                      <span>{allSalesPage} / {allSalesTotalPages}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAllSalesPage(p => Math.min(allSalesTotalPages, p + 1))}
                        disabled={allSalesPage === allSalesTotalPages || allSalesTotalPages === 0}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pending-delivery" className="space-y-4">
                  {/* Today's Sales Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Today&apos;s Sales ({todaySales.length} transactions)
                      </CardTitle>
                      <CardDescription>All sales made today - {today.toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[140px]">Invoice</TableHead>
                              <TableHead className="min-w-[160px]">Customer</TableHead>
                              <TableHead className="hidden sm:table-cell">Items</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Payment</TableHead>
                              <TableHead className="hidden md:table-cell">Delivery</TableHead>
                              <TableHead className="hidden lg:table-cell">Staff</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedTodaySales.map((record) => (
                              <TableRow key={record.id} className="h-24">
                                <TableCell className="h-24 align-top">
                                  <div>
                                    <p className="font-medium">{record.invoiceNumber}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {record.date} • {record.time}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="h-24 align-top">
                                  <div>
                                    <p className="font-medium">{record.customerName}</p>
                                    <p className="text-sm text-muted-foreground">{record.customerPhone}</p>
                                    {record.customerAddress && (
                                      <p className="text-xs text-muted-foreground">{record.customerAddress}</p>
                                    )}
                                    <Badge variant={getCustomerTypeColor(record.customerType) as "destructive" | "default" | "secondary" | "outline" | undefined} className="text-xs">
                                      {record.customerType}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="h-24 align-top hidden sm:table-cell">
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
                                    <p className="font-medium">Rs{typeof record.total === "number" ? record.total.toLocaleString() : 0}</p>
                                    {record.discount > 0 && (
                                      <p className="text-xs text-red-600">-Rs{typeof record.discount === "number" ? record.discount.toLocaleString() : 0} discount</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="h-24 align-top">
                                  <div className="space-y-1">
                                    <Badge variant={getPaymentStatusColor(record.paymentStatus) as "destructive" | "default" | "secondary" | "outline" | undefined}>
                                      {record.paymentStatus}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">{record.paymentMethod}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="h-24 align-top hidden md:table-cell">
                                  <div className="space-y-1">
                                    <Badge variant={getDeliveryStatusColor(record.deliveryStatus) as "destructive" | "default" | "secondary" | "outline" | undefined}>
                                      {record.deliveryStatus}
                                    </Badge>
                                    {record.deliveryAddress && (
                                      <p className="text-xs text-muted-foreground">{record.deliveryAddress}</p>
                                    )}
                                    {record.deliveryDate && (
                                      <p className="text-xs text-muted-foreground">{record.deliveryDate}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="h-24 align-top hidden lg:table-cell">
                                  <p className="text-sm">{record.staffName || record.staffMember}</p>
                                </TableCell>
                                <TableCell className="h-24 align-top">
                                  <div className="flex flex-wrap gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewDetails(record)}
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditSale(record)}
                                      title="Edit Sale"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePrintInvoice(record)}
                                      title="Print Invoice"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleThermalPrint(record)}
                                      title="Thermal Print"
                                    >
                                      <Receipt className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDiscardSale(record)}
                                      title="Discard Sale"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {paginatedTodaySales.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                  <div className="text-center">
                                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No sales recorded today</p>
                                    <p className="text-sm text-muted-foreground">Sales made today will appear here</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pagination Controls for Today's Sales */}
                  {todaySales.length > todaySalesPerPage && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTodaySalesPage(p => Math.max(1, p - 1))}
                        disabled={todaySalesPage === 1}
                      >
                        Prev
                      </Button>
                      <span>{todaySalesPage} / {todaySalesTotalPages}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTodaySalesPage(p => Math.min(todaySalesTotalPages, p + 1))}
                        disabled={todaySalesPage === todaySalesTotalPages || todaySalesTotalPages === 0}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pending-payment" className="space-y-4">
                  {/* Search Bar for Pending Payments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Search Customer Profiles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input
                        placeholder="Search by customer name, phone, or address..."
                        value={pendingPaymentSearchTerm}
                        onChange={(e) => setPendingPaymentSearchTerm(e.target.value)}
                      />
                    </CardContent>
                  </Card>

                  {/* Unified Customer Profiles */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Customer Profiles ({(() => {
                          // Count customers that have sales
                          const customersWithSales = customers.filter(customer => {
                            return salesRecords.some(sale =>
                              sale.customerName === customer.name
                            )
                          })
                          return customersWithSales.length
                        })()})
                      </CardTitle>
                      <CardDescription>Manage payments and view detailed ledgers for customers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        // Get all customers with sales and apply search filter
                        const customersWithSales = customers.filter(customer => {
                          const hasSales = salesRecords.some(sale =>
                            sale.customerName === customer.name
                          )

                          if (!hasSales) return false

                          // Apply search filter
                          if (pendingPaymentSearchTerm.trim()) {
                            const searchLower = pendingPaymentSearchTerm.toLowerCase()
                            return (
                              customer.name.toLowerCase().includes(searchLower) ||
                              customer.phone.includes(pendingPaymentSearchTerm) ||
                              (customer.address && customer.address.toLowerCase().includes(searchLower))
                            )
                          }

                          return true
                        })

                        if (customersWithSales.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                              <p className="text-muted-foreground">
                                {pendingPaymentSearchTerm.trim()
                                  ? "No customers found matching your search"
                                  : "No customers with sales found"
                                }
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {pendingPaymentSearchTerm.trim()
                                  ? "Try adjusting your search terms"
                                  : "Customer profiles will appear here once sales are made"
                                }
                              </p>
                            </div>
                          )
                        }

                        return (
                          <div className="space-y-3">
                            {customersWithSales.map((customer) => {
                              // Get all sales for this customer
                              const customerSales = salesRecords.filter(sale =>
                                sale.customerName === customer.name
                              )


                              // Get payment records for this customer
                              const customerPaymentRecords = creditSalePaymentRecords.filter(pr =>
                                customerSales.some(sale => sale.id === pr.saleId)
                              )

                              // Calculate totals using global payment system
                              const totalAmount = customerSales.reduce((sum, sale) => sum + (sale.total || 0), 0)

                              // Calculate total payments from credit sale payment records (global payment system)
                              const totalPaid = creditSalePaymentRecords
                                .filter(record => record.customerId === customer.id)
                                .reduce((sum, record) => sum + (record.amount || 0), 0)

                              const totalRemaining = totalAmount - totalPaid
                              const progressPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0

                              // Debug logging for main page
                              console.log('Main Page Debug:', {
                                customerName: customer.name,
                                customerPhone: customer.phone,
                                customerSalesCount: customerSales.length,
                                customerSales: customerSales.map(s => ({ id: s.id, total: s.total, customerName: s.customerName, customerPhone: s.customerPhone })),
                                customerPaymentRecordsCount: customerPaymentRecords.length,
                                customerPaymentRecords: customerPaymentRecords.map(p => ({ id: p.id, customerId: p.customerId, amount: p.amount, type: p.type, customerName: p.customerName })),
                                totalAmount,
                                totalPaid,
                                totalRemaining
                              })

                              // Get status based on remaining amount (binary system)
                              const getStatus = () => {
                                if (totalRemaining <= 0) return { status: 'paid', color: 'bg-green-100 text-green-800' }
                                return { status: 'pending', color: 'bg-gray-100 text-gray-800' }
                              }

                              const statusInfo = getStatus()

                              return (
                                <div
                                  key={customer.id}
                                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                  onClick={() => handleCustomerProfilePage(customer)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="p-2 bg-primary/10 rounded-full">
                                        <User className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-lg">{customer.name}</h3>
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
                                    <div className="flex items-center space-x-4">
                                      <div className="text-right">
                                        <div className="text-sm text-muted-foreground">
                                          {customerSales.length} sale{customerSales.length !== 1 ? 's' : ''}
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
            )}
          </div>


          {/* Sale Details Dialog */}
          <SaleDetailsDialog
            isOpen={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            selectedRecord={selectedRecord}
            onCallCustomer={handleCallCustomer}
            onMessageCustomer={handleMessageCustomer}
            getCustomerTypeColor={getCustomerTypeColor}
            getPaymentStatusColor={getPaymentStatusColor}
            getDeliveryStatusColor={getDeliveryStatusColor}
          />
        </>
      )}

      {/* Date Range Report Dialog */}
      <ReportDialog
        isOpen={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        reportStartDate={reportStartDate}
        setReportStartDate={setReportStartDate}
        reportEndDate={reportEndDate}
        setReportEndDate={setReportEndDate}
        onGenerateReport={generateSalesReport}
        onGenerateWhatsAppReport={generateWhatsAppSalesReport}
        isGeneratingReport={isGeneratingReport}
      />

      {/* Discard Sale Confirmation Dialog */}
      <DiscardSaleDialog
        isOpen={isDiscardDialogOpen}
        onOpenChange={setIsDiscardDialogOpen}
        saleToDiscard={saleToDiscard}
        onConfirmDiscard={confirmDiscardSale}
        isDiscarding={isDiscarding}
      />

      {/* Edit Sale Dialog */}
      <EditSaleDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        sale={null}
        onSaleUpdated={loadSalesData}
      />

      {/* Global Payment Dialog */}
      {selectedCustomerForPayment && (
        <GlobalPaymentDialog
          open={isGlobalPaymentDialogOpen}
          onOpenChange={setIsGlobalPaymentDialogOpen}
          customer={selectedCustomerForPayment}
          sales={selectedCustomerSales}
          onPaymentSuccess={handleGlobalPaymentSuccess}
        />
      )}

    </div>
  )
}
