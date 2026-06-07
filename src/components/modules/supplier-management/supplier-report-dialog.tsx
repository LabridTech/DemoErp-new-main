"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Table, 
  Calendar,
  TrendingUp,
  DollarSign,
  CreditCard,
  Receipt
} from "lucide-react"
import { SupplierReportService, type SupplierReportData } from "@/lib/supplier-report-service"
import { type Purchase } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface SupplierReportDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  supplierName: string
  supplierPhone: string
  supplierAddress: string
  purchases: Purchase[]
}

type ReportPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'all'

export function SupplierReportDialog({
  isOpen,
  onOpenChange,
  supplierName,
  supplierPhone,
  supplierAddress,
  purchases
}: SupplierReportDialogProps) {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<SupplierReportData | null>(null)
  const { toast } = useToast()

  const getDateRange = (period: ReportPeriod): { startDate: Date; endDate: Date } | null => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (period) {
      case 'today':
        return { startDate: today, endDate: today }
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 7)
        return { startDate: weekStart, endDate: today }
      case 'month':
        const monthStart = new Date(today)
        monthStart.setDate(1)
        return { startDate: monthStart, endDate: today }
      case 'quarter':
        const quarterStart = new Date(today)
        quarterStart.setMonth(today.getMonth() - 3)
        return { startDate: quarterStart, endDate: today }
      case 'year':
        const yearStart = new Date(today)
        yearStart.setMonth(0, 1)
        return { startDate: yearStart, endDate: today }
      case 'custom':
        if (!customStartDate || !customEndDate) return null
        return { 
          startDate: new Date(customStartDate), 
          endDate: new Date(customEndDate) 
        }
      case 'all':
      default:
        return null
    }
  }

  const generateReport = () => {
    const dateRange = getDateRange(reportPeriod)
    
    if (reportPeriod === 'custom' && !dateRange) {
      toast({
        title: "Error",
        description: "Please select both start and end dates for custom range",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    
    try {
      const data = SupplierReportService.generateReportData(
        supplierName,
        supplierPhone,
        supplierAddress,
        purchases,
        dateRange?.startDate,
        dateRange?.endDate
      )
      
      setReportData(data)
      toast({
        title: "Success",
        description: "Report generated successfully",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }


  const exportToCSV = async () => {
    if (!reportData) return
    
    try {
      await SupplierReportService.exportToCSV(reportData)
      toast({
        title: "Success",
        description: "CSV report exported successfully",
      })
    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast({
        title: "Error",
        description: "Failed to export CSV",
        variant: "destructive",
      })
    }
  }

  const exportToPDF = async () => {
    if (!reportData) return
    
    try {
      await SupplierReportService.exportToPDF(reportData)
      toast({
        title: "Success",
        description: "PDF report exported successfully",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      })
    }
  }

  const resetDialog = () => {
    setReportPeriod('month')
    setCustomStartDate('')
    setCustomEndDate('')
    setReportData(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetDialog()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Supplier Report
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive reports for {supplierName} with detailed analytics and export options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Report Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="report-period" className="text-sm">Report Period</Label>
                  <Select value={reportPeriod} onValueChange={(value: ReportPeriod) => setReportPeriod(value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">Last 3 Months</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reportPeriod === 'custom' && (
                  <>
                    <div>
                      <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="text-sm">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </>
                )}
              </div>

              <Button 
                onClick={generateReport} 
                disabled={isGenerating}
                className="w-full h-9 text-sm"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Report Preview */}
          {reportData && (
            <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-primary" />
                Report Preview
              </CardTitle>
            </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Statistics */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Total Amount */}
                  <div className="p-3 border rounded-lg bg-blue-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                        <p className="text-sm font-semibold text-blue-700">
                          Rs{reportData.summary.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>

                  {/* Total Purchases */}
                  <div className="p-3 border rounded-lg bg-green-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Purchases</p>
                        <p className="text-sm font-semibold text-green-700">
                          {reportData.summary.totalPurchases}
                        </p>
                      </div>
                      <Receipt className="h-4 w-4 text-green-600" />
                    </div>
                  </div>

                  {/* Pending Amount */}
                  <div className="p-3 border rounded-lg bg-orange-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Pending Amount</p>
                        <p className="text-sm font-semibold text-orange-700">
                          Rs{reportData.summary.totalPending.toLocaleString()}
                        </p>
                      </div>
                      <CreditCard className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>

                  {/* Average Purchase */}
                  <div className="p-3 border rounded-lg bg-purple-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Average Purchase</p>
                        <p className="text-sm font-semibold text-purple-700">
                          Rs{Math.round(reportData.summary.averagePurchase).toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Payment Method Breakdown */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Payment Method Breakdown</h4>
                  <div className="space-y-1">
                    {reportData.paymentMethodBreakdown.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Badge variant="outline" className="text-xs">{payment.method}</Badge>
                          <span className="text-muted-foreground truncate">
                            {payment.count} transactions
                          </span>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-medium text-sm">Rs{payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{payment.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export Options */}
                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2 text-sm">Export Options</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={exportToCSV} variant="outline" className="flex-1 text-sm">
                      <Table className="h-4 w-4 mr-2" />
                      Export as CSV
                    </Button>
                    <Button onClick={exportToPDF} variant="outline" className="flex-1 text-sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
