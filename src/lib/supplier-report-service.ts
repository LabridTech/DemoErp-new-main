import { type Purchase } from './firebase-services'
import jsPDF from 'jspdf'

export interface SupplierReportData {
  supplierName: string
  supplierPhone: string
  supplierAddress: string
  reportPeriod: string
  generatedDate: string
  purchases: Purchase[]
  summary: {
    totalPurchases: number
    totalAmount: number
    totalDiscount: number
    totalPaid: number
    totalPending: number
    creditPurchases: number
    cashPurchases: number
    averagePurchase: number
    largestPurchase: number
    smallestPurchase: number
  }
  monthlyBreakdown: Array<{
    month: string
    count: number
    amount: number
    discount: number
  }>
  paymentMethodBreakdown: Array<{
    method: string
    count: number
    amount: number
    percentage: number
  }>
}

export class SupplierReportService {
  static generateReportData(
    supplierName: string,
    supplierPhone: string,
    supplierAddress: string,
    purchases: Purchase[],
    startDate?: Date,
    endDate?: Date
  ): SupplierReportData {
    // Filter purchases by date range if provided
    let filteredPurchases = purchases
    if (startDate && endDate) {
      filteredPurchases = purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.createdAt)
        return purchaseDate >= startDate && purchaseDate <= endDate
      })
    }

    // Calculate summary statistics
    const totalPurchases = filteredPurchases.length
    const totalAmount = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0)
    const totalDiscount = filteredPurchases.reduce((sum, purchase) => sum + (purchase.discount || 0), 0)
    
    const creditPurchases = filteredPurchases.filter(p => p.paymentMethod === 'credit')
    const cashPurchases = filteredPurchases.filter(p => p.paymentMethod === 'cash')
    
    const totalPaid = filteredPurchases.reduce((sum, purchase) => {
      if (purchase.paymentMethod === 'credit') {
        const partialAmount = parseFloat(purchase.partialPaymentAmount || '0') || 0
        return sum + partialAmount
      }
      return sum + purchase.totalAmount
    }, 0)
    
    const totalPending = creditPurchases.reduce((sum, purchase) => {
      const partialAmount = parseFloat(purchase.partialPaymentAmount || '0') || 0
      return sum + (purchase.totalAmount - partialAmount)
    }, 0)

    const averagePurchase = totalPurchases > 0 ? totalAmount / totalPurchases : 0
    const amounts = filteredPurchases.map(p => p.totalAmount)
    const largestPurchase = amounts.length > 0 ? Math.max(...amounts) : 0
    const smallestPurchase = amounts.length > 0 ? Math.min(...amounts) : 0

    // Monthly breakdown
    const monthlyData = new Map<string, { count: number; amount: number; discount: number }>()
    filteredPurchases.forEach(purchase => {
      const date = new Date(purchase.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { count: 0, amount: 0, discount: 0 })
      }
      
      const data = monthlyData.get(monthKey)!
      data.count += 1
      data.amount += purchase.totalAmount
      data.discount += purchase.discount || 0
    })

    const monthlyBreakdown = Array.from(monthlyData.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return {
          month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          count: data.count,
          amount: data.amount,
          discount: data.discount
        }
      })
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Payment method breakdown
    const paymentMethods = new Map<string, { count: number; amount: number }>()
    filteredPurchases.forEach(purchase => {
      const method = purchase.paymentMethod || 'unknown'
      if (!paymentMethods.has(method)) {
        paymentMethods.set(method, { count: 0, amount: 0 })
      }
      
      const data = paymentMethods.get(method)!
      data.count += 1
      data.amount += purchase.totalAmount
    })

    const paymentMethodBreakdown = Array.from(paymentMethods.entries())
      .map(([method, data]) => ({
        method: this.formatPaymentMethod(method),
        count: data.count,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)

    // Generate report period string
    let reportPeriod = 'All Time'
    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        reportPeriod = startDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      } else {
        reportPeriod = `${startDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })} - ${endDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}`
      }
    }

    return {
      supplierName,
      supplierPhone,
      supplierAddress,
      reportPeriod,
      generatedDate: new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      purchases: filteredPurchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      summary: {
        totalPurchases,
        totalAmount,
        totalDiscount,
        totalPaid,
        totalPending,
        creditPurchases: creditPurchases.length,
        cashPurchases: cashPurchases.length,
        averagePurchase,
        largestPurchase,
        smallestPurchase
      },
      monthlyBreakdown,
      paymentMethodBreakdown
    }
  }

  static formatPaymentMethod(method: string): string {
    switch (method) {
      case 'cash': return 'Cash'
      case 'credit': return 'Credit'
      case 'card': return 'Card'
      case 'bank_transfer': return 'Bank Transfer'
      default: return 'Unknown'
    }
  }


  static async exportToCSV(reportData: SupplierReportData): Promise<void> {
    // Create CSV content focused on money flow with order IDs
    let csvContent = ''
    
    // Header
    csvContent += 'Supplier Money Flow Report\n'
    csvContent += `Supplier: ${reportData.supplierName}\n`
    csvContent += `Phone: ${reportData.supplierPhone}\n`
    csvContent += `Address: ${reportData.supplierAddress}\n`
    csvContent += `Report Period: ${reportData.reportPeriod}\n`
    csvContent += `Generated: ${reportData.generatedDate}\n`
    csvContent += '\n'
    
    // Summary
    csvContent += 'SUMMARY\n'
    csvContent += `Total Orders,${reportData.summary.totalPurchases}\n`
    csvContent += `Total Amount,${reportData.summary.totalAmount}\n`
    csvContent += `Total Paid,${reportData.summary.totalPaid}\n`
    csvContent += `Total Pending,${reportData.summary.totalPending}\n`
    csvContent += '\n'
    
    // Sort purchases by date (chronological order)
    const sortedPurchases = [...reportData.purchases].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    // Money Flow Transactions
    csvContent += 'MONEY FLOW TRANSACTIONS (Chronological Order)\n'
    csvContent += 'Date,Time,Order ID,Transaction Type,Amount,Payment Method,Status,Remaining Balance,Notes\n'
    
    sortedPurchases.forEach(purchase => {
      const purchaseDate = new Date(purchase.createdAt)
      const dateStr = purchaseDate.toLocaleDateString()
      const timeStr = purchaseDate.toLocaleTimeString()
      
      // Main purchase transaction
      const transactionType = 'PURCHASE'
      const amount = purchase.totalAmount
      const paymentMethod = this.formatPaymentMethod(purchase.paymentMethod || '')
      const status = purchase.paymentMethod === 'credit' 
        ? (purchase.remainingAmount && purchase.remainingAmount > 0 ? 'PENDING' : 'PAID')
        : 'PAID'
      const remainingBalance = purchase.remainingAmount || 0
      const notes = `Order for ${purchase.items.length} items`
      
      csvContent += `${dateStr},${timeStr},${purchase.invoiceNumber},${transactionType},${amount},${paymentMethod},${status},${remainingBalance},"${notes}"\n`
      
      // If it's a credit purchase with payment history, show partial payments
      if (purchase.paymentHistory && purchase.paymentHistory.length > 0) {
        // Sort payment history by date
        const sortedPayments = [...purchase.paymentHistory].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        
        sortedPayments.forEach(payment => {
          const paymentDate = new Date(payment.date)
          const paymentDateStr = paymentDate.toLocaleDateString()
          const paymentTimeStr = paymentDate.toLocaleTimeString()
          
          csvContent += `${paymentDateStr},${paymentTimeStr},${purchase.invoiceNumber},PARTIAL_PAYMENT,${payment.amount},${payment.method},PAID,${payment.remainingAfter},"${payment.notes || 'Partial payment'}"\n`
        })
      }
      
      // If there are any additional payments or adjustments, show them
      if (purchase.partialPaymentAmount && parseFloat(purchase.partialPaymentAmount) > 0) {
        const paymentDate = new Date(purchase.createdAt)
        const paymentDateStr = paymentDate.toLocaleDateString()
        const paymentTimeStr = paymentDate.toLocaleTimeString()
        
        csvContent += `${paymentDateStr},${paymentTimeStr},${purchase.invoiceNumber},PARTIAL_PAYMENT,${purchase.partialPaymentAmount},CASH,PAID,${purchase.remainingAmount || 0},"Additional payment"\n`
      }
    })
    
    csvContent += '\n'
    
    // Order Summary
    csvContent += 'ORDER SUMMARY\n'
    csvContent += 'Order ID,Date,Total Amount,Paid Amount,Remaining Amount,Status,Items Count\n'
    
    sortedPurchases.forEach(purchase => {
      const paidAmount = purchase.totalAmount - (purchase.remainingAmount || 0)
      const remainingAmount = purchase.remainingAmount || 0
      const status = remainingAmount > 0 ? 'PENDING' : 'PAID'
      
      csvContent += `${purchase.invoiceNumber},${new Date(purchase.createdAt).toLocaleDateString()},${purchase.totalAmount},${paidAmount},${remainingAmount},${status},${purchase.items.length}\n`
    })
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Supplier_Money_Flow_${reportData.supplierName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  static async exportToPDF(reportData: SupplierReportData): Promise<void> {
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let yPosition = 20

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth?: number) => {
        if (maxWidth) {
          const lines = doc.splitTextToSize(text, maxWidth)
          doc.text(lines, x, y)
          return y + (lines.length * 5)
        } else {
          doc.text(text, x, y)
          return y + 5
        }
      }

      // Helper function to add a line
      const addLine = (y: number) => {
        doc.line(margin, y, pageWidth - margin, y)
        return y + 5
      }

      // Header
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      yPosition = addText('Supplier Money Flow Report', margin, yPosition)
      
      yPosition += 5
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      yPosition = addText(`Supplier: ${reportData.supplierName}`, margin, yPosition)
      yPosition = addText(`Phone: ${reportData.supplierPhone}`, margin, yPosition)
      yPosition = addText(`Address: ${reportData.supplierAddress}`, margin, yPosition)
      yPosition = addText(`Report Period: ${reportData.reportPeriod}`, margin, yPosition)
      yPosition = addText(`Generated: ${reportData.generatedDate}`, margin, yPosition)
      
      yPosition = addLine(yPosition + 5)

      // Summary
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      yPosition = addText('SUMMARY', margin, yPosition)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      yPosition = addText(`Total Orders: ${reportData.summary.totalPurchases}`, margin, yPosition)
      yPosition = addText(`Total Amount: Rs ${reportData.summary.totalAmount.toLocaleString()}`, margin, yPosition)
      yPosition = addText(`Total Paid: Rs ${reportData.summary.totalPaid.toLocaleString()}`, margin, yPosition)
      yPosition = addText(`Total Pending: Rs ${reportData.summary.totalPending.toLocaleString()}`, margin, yPosition)
      
      yPosition = addLine(yPosition + 5)

      // Sort purchases by date (chronological order)
      const sortedPurchases = [...reportData.purchases].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

      // Money Flow Transactions
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      yPosition = addText('MONEY FLOW TRANSACTIONS (Chronological Order)', margin, yPosition)
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      
      // Table headers
      const headers = ['Date', 'Time', 'Order ID', 'Type', 'Amount', 'Method', 'Status', 'Balance', 'Notes']
      const colWidths = [20, 15, 25, 20, 20, 15, 15, 20, 30]
      let xPosition = margin
      
      // Draw headers
      doc.setFont('helvetica', 'bold')
      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition)
        xPosition += colWidths[index]
      })
      yPosition += 5
      
      // Draw header line
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 3
      
      doc.setFont('helvetica', 'normal')
      
      sortedPurchases.forEach(purchase => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        
        const purchaseDate = new Date(purchase.createdAt)
        const dateStr = purchaseDate.toLocaleDateString()
        const timeStr = purchaseDate.toLocaleTimeString()
        
        // Main purchase transaction
        const transactionType = 'PURCHASE'
        const amount = `Rs ${purchase.totalAmount.toLocaleString()}`
        const paymentMethod = this.formatPaymentMethod(purchase.paymentMethod || '')
        const status = purchase.paymentMethod === 'credit' 
          ? (purchase.remainingAmount && purchase.remainingAmount > 0 ? 'PENDING' : 'PAID')
          : 'PAID'
        const remainingBalance = `Rs ${(purchase.remainingAmount || 0).toLocaleString()}`
        const notes = `${purchase.items.length} items`
        
        const rowData = [dateStr, timeStr, purchase.invoiceNumber, transactionType, amount, paymentMethod, status, remainingBalance, notes]
        
        xPosition = margin
        rowData.forEach((data, index) => {
          const text = data.length > 15 ? data.substring(0, 12) + '...' : data
          doc.text(text, xPosition, yPosition)
          xPosition += colWidths[index]
        })
        yPosition += 4
        
        // If it's a credit purchase with payment history, show partial payments
        if (purchase.paymentHistory && purchase.paymentHistory.length > 0) {
          const sortedPayments = [...purchase.paymentHistory].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          
          sortedPayments.forEach(payment => {
            if (yPosition > 250) {
              doc.addPage()
              yPosition = 20
            }
            
            const paymentDate = new Date(payment.date)
            const paymentDateStr = paymentDate.toLocaleDateString()
            const paymentTimeStr = paymentDate.toLocaleTimeString()
            
            const paymentRowData = [
              paymentDateStr, 
              paymentTimeStr, 
              purchase.invoiceNumber, 
              'PARTIAL', 
              `Rs ${payment.amount.toLocaleString()}`, 
              payment.method, 
              'PAID', 
              `Rs ${payment.remainingAfter.toLocaleString()}`, 
              payment.notes || 'Partial payment'
            ]
            
            xPosition = margin
            paymentRowData.forEach((data, index) => {
              const text = data.length > 15 ? data.substring(0, 12) + '...' : data
              doc.text(text, xPosition, yPosition)
              xPosition += colWidths[index]
            })
            yPosition += 4
          })
        }
        
        // If there are any additional payments
        if (purchase.partialPaymentAmount && parseFloat(purchase.partialPaymentAmount) > 0) {
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }
          
          const paymentDate = new Date(purchase.createdAt)
          const paymentDateStr = paymentDate.toLocaleDateString()
          const paymentTimeStr = paymentDate.toLocaleTimeString()
          
          const additionalRowData = [
            paymentDateStr, 
            paymentTimeStr, 
            purchase.invoiceNumber, 
            'PARTIAL', 
            `Rs ${purchase.partialPaymentAmount}`, 
            'CASH', 
            'PAID', 
            `Rs ${(purchase.remainingAmount || 0).toLocaleString()}`, 
            'Additional payment'
          ]
          
          xPosition = margin
          additionalRowData.forEach((data, index) => {
            const text = data.length > 15 ? data.substring(0, 12) + '...' : data
            doc.text(text, xPosition, yPosition)
            xPosition += colWidths[index]
          })
          yPosition += 4
        }
      })
      
      // Add new page for order summary
      doc.addPage()
      yPosition = 20
      
      // Order Summary
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      yPosition = addText('ORDER SUMMARY', margin, yPosition)
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      
      // Order summary headers
      const orderHeaders = ['Order ID', 'Date', 'Total', 'Paid', 'Remaining', 'Status', 'Items']
      const orderColWidths = [30, 20, 25, 25, 25, 15, 10]
      
      xPosition = margin
      doc.setFont('helvetica', 'bold')
      orderHeaders.forEach((header, index) => {
        doc.text(header, xPosition, yPosition)
        xPosition += orderColWidths[index]
      })
      yPosition += 5
      
      // Draw header line
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 3
      
      doc.setFont('helvetica', 'normal')
      
      sortedPurchases.forEach(purchase => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        
        const paidAmount = purchase.totalAmount - (purchase.remainingAmount || 0)
        const remainingAmount = purchase.remainingAmount || 0
        const status = remainingAmount > 0 ? 'PENDING' : 'PAID'
        
        const orderRowData = [
          purchase.invoiceNumber,
          new Date(purchase.createdAt).toLocaleDateString(),
          `Rs ${purchase.totalAmount.toLocaleString()}`,
          `Rs ${paidAmount.toLocaleString()}`,
          `Rs ${remainingAmount.toLocaleString()}`,
          status,
          purchase.items.length.toString()
        ]
        
        xPosition = margin
        orderRowData.forEach((data, index) => {
          const text = data.length > 20 ? data.substring(0, 17) + '...' : data
          doc.text(text, xPosition, yPosition)
          xPosition += orderColWidths[index]
        })
        yPosition += 4
      })
      
      // Save the PDF
      const fileName = `Supplier_Money_Flow_${reportData.supplierName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('PDF Export Error:', error)
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
