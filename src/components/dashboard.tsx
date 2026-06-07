"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, TrendingUp, Loader2 } from "lucide-react"
import SalesOverview from "@/components/dashboard/SalesOverview"
import MonthlyEarnings from "@/components/dashboard/MonthlyEarnings"
import ProductPerformance from "@/components/dashboard/ProductPerformance"
import RecentTransactions from "@/components/dashboard/RecentTransactions"
import YearlyBreakup from "@/components/dashboard/YearlyBreakup"
import PieChartComponent from "@/components/dashboard/PieChart"
import {
  CustomerService,
  PurchaseService,
  SalesService,
  ProductService,
  type SaleRecord,
  type Purchase,
  type Customer,
  type Product
} from "@/lib/firebase-services"
import { DateRangeFilter, type DateFilterType } from "@/components/ui/date-range-filter"

export default function Dashboard() {
  // Data State
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Filter State
  const [filterType, setFilterType] = useState<DateFilterType>("new_ver")
  const [startDate, setStartDate] = useState<Date | null>(new Date(2026, 1, 17))
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Fetch Data
  useEffect(() => {
    let unsubscribeSales: () => void

    const loadData = async () => {
      try {
        setLoading(true)

        // Initial Fetch
        const customersData = await CustomerService.getAllCustomers()

        setCustomers(customersData)

        const productsData = await ProductService.getAllProducts()
        setProducts(productsData)

        // Real-time subscriptions
        unsubscribeSales = SalesService.subscribeToSales((data) => {
          setSales(data)
        })

        // Initial fetch for purchases
        const purchasesData = await PurchaseService.getAllPurchases()
        setPurchases(purchasesData)

        setLoading(false)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        setLoading(false)
      }
    }

    loadData()

    return () => {
      if (unsubscribeSales) unsubscribeSales()
    }
  }, [])

  // Filter Logic
  const filteredData = useMemo(() => {
    if (!startDate) return { sales, purchases }

    const fromTime = startDate.getTime()
    const toTime = endDate ? endDate.getTime() : Infinity

    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date).getTime()
      return saleDate >= fromTime && saleDate <= toTime
    })

    const filteredPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.createdAt || new Date().toISOString()).getTime()
      return purchaseDate >= fromTime && purchaseDate <= toTime
    })

    return { sales: filteredSales, purchases: filteredPurchases }
  }, [sales, purchases, startDate, endDate])

  // KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredData.sales.reduce((sum, sale) => sum + sale.total, 0)
    const totalOrders = filteredData.sales.length
    // Unique customers in filtered sales
    const activeCustomersCount = new Set(filteredData.sales.map(s => s.customerPhone)).size

    // Calculate COGS and Net Profit
    let totalCOGS = 0;
    filteredData.sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId || p.code === item.code);
        const cost = item.purchaseCost !== undefined ? item.purchaseCost : (product?.purchaseCost || 0);
        totalCOGS += (item.quantity * cost);
        if (item.tradeDiscountFreeItems) {
          totalCOGS += (item.tradeDiscountFreeItems * cost);
        }
      });
      if (sale.tradeDiscountItems) {
        sale.tradeDiscountItems.forEach(td => {
          const product = products.find(p => p.id === td.productId);
          const cost = td.purchaseCost !== undefined ? td.purchaseCost : (product?.purchaseCost || 0);
          totalCOGS += (td.quantity * cost);
        });
      }
    });

    const netProfit = totalRevenue - totalCOGS;

    const totalPurchasesAmount = filteredData.purchases.reduce((sum, p) => sum + p.totalAmount, 0)

    return {
      revenue: totalRevenue,
      orders: totalOrders,
      activeCustomers: activeCustomersCount,
      totalCustomers: customers.length,
      purchasesAmount: totalPurchasesAmount,
      netProfit,
      totalCOGS
    }
  }, [filteredData, customers, products])

  // Charts Data Preparation

  // 1. Sales Trend & Earnings
  const chartData = useMemo(() => {
    const timeMap = new Map<string, { sales: number, earnings: number }>()

    // Determine grouping format based on filter
    const isDayView = filterType === 'today' || filterType === 'yesterday' || filterType === 'week'

    filteredData.sales.forEach(sale => {
      const date = new Date(sale.date)
      let key = ''

      if (isDayView) {
        // Hour or Day of week depending on range
        if (filterType === 'today' || filterType === 'yesterday') {
          key = date.toLocaleTimeString([], { hour: 'numeric', hour12: true })
        } else {
          key = date.toLocaleDateString([], { weekday: 'short' })
        }
      } else {
        // Month grouping (default for larger ranges)
        if (filterType === 'month' || filterType === 'custom') {
          key = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
        } else { // year or new_ver
          key = date.toLocaleDateString([], { month: 'short' })
        }
      }

      const current = timeMap.get(key) || { sales: 0, earnings: 0 }
      timeMap.set(key, {
        sales: current.sales + sale.total,
        earnings: current.earnings + (sale.total * 0.2) // Mock 20% margin for earnings visualization
      })
    })

    // Prepare array and sort if possible
    // Note: sorting keys like "Jan", "Feb" or "Mon", "Tue" requires custom logic.
    // For V1, passing map iterator is fine, effectively insertion order if processed sequentially.
    // Ideally we should sort by date. 

    return Array.from(timeMap.entries()).map(([name, data]) => ({
      name,
      sales: data.sales,
      earnings: data.earnings
    }))
  }, [filteredData, filterType])

  // 2. Product Performance
  const productPerformance = useMemo(() => {
    const productMap = new Map<string, { name: string, sales: number, revenue: number }>()

    filteredData.sales.forEach(sale => {
      sale.items.forEach(item => {
        // Use name as key if ID is not consistent, but ID is safer.
        const id = item.id || item.name
        const current = productMap.get(id) || { name: item.name, sales: 0, revenue: 0 }
        productMap.set(id, {
          name: item.name,
          sales: current.sales + item.quantity,
          revenue: current.revenue + (item.subtotal || 0)
        })
      })
    })

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        growth: '+0%' // Placeholder
      }))
  }, [filteredData])

  // 3. Recent Transactions
  const recentTransactions = useMemo(() => {
    const all = [
      ...filteredData.sales.map(s => ({
        id: s.id,
        type: 'Sale',
        title: s.customerName || 'Unknown Customer',
        description: `Invoice #${s.invoiceNumber}`,
        amount: s.total,
        status: s.paymentStatus || 'Completed',
        time: new Date(s.date).toLocaleDateString(), // Simplification
        rawDate: new Date(s.date)
      })),
      ...filteredData.purchases.map(p => ({
        id: p.id,
        type: 'Purchase',
        title: p.supplierName || 'Unknown Supplier',
        description: `Invoice #${p.invoiceNumber}`,
        amount: p.totalAmount,
        status: p.paymentStatus || 'Completed',
        time: new Date(p.createdAt || new Date()).toLocaleDateString(),
        rawDate: new Date(p.createdAt || new Date())
      }))
    ]

    return all.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 5)
  }, [filteredData])

  // 4. Yearly/Quarterly Breakup (Sales)
  const quarterlyData = useMemo(() => {
    const quarters = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }

    filteredData.sales.forEach(sale => {
      const month = new Date(sale.date).getMonth()
      if (month < 3) quarters.Q1 += sale.total
      else if (month < 6) quarters.Q2 += sale.total
      else if (month < 9) quarters.Q3 += sale.total
      else quarters.Q4 += sale.total
    })

    return [
      { quarter: 'Q1', revenue: quarters.Q1, color: 'bg-blue-500' },
      { quarter: 'Q2', revenue: quarters.Q2, color: 'bg-green-500' },
      { quarter: 'Q3', revenue: quarters.Q3, color: 'bg-purple-500' },
      { quarter: 'Q4', revenue: quarters.Q4, color: 'bg-orange-500' },
    ]
  }, [filteredData])

  // 5. Pie Chart Categories (Fabric Type)
  const categoryData = useMemo(() => {
    const catMap = new Map<string, number>()
    filteredData.sales.forEach(sale => {
      sale.items.forEach(item => {
        const type = item.fabricType || 'Other'
        catMap.set(type, (catMap.get(type) || 0) + (item.subtotal || 0))
      })
    })

    return Array.from(catMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: `hsl(${index * 60}, 70%, 50%)`
    }))
  }, [filteredData])


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg font-medium">Loading Dashboard...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Business insights and live performance overview</p>
          </div>
          <div className="flex items-center space-x-2">
          <DateRangeFilter
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={(start, end) => {
              setStartDate(start)
              setEndDate(end)
            }}
          />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500 bg-card/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {kpis.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredData.sales.length} transactions
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500 bg-card/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.orders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              avg. Rs {kpis.orders > 0 ? Math.round(kpis.revenue / kpis.orders).toLocaleString() : 0} / order
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500 bg-card/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {kpis.netProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Margin: {kpis.revenue > 0 ? ((kpis.netProfit / kpis.revenue) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500 bg-card/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs {kpis.purchasesAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredData.purchases.length} purchase orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="col-span-1 hover:shadow-lg transition-shadow rounded-2xl border-border/80 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesOverview data={chartData} />
          </CardContent>
        </Card>
        <Card className="col-span-1 hover:shadow-lg transition-shadow rounded-2xl border-border/80 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <MonthlyEarnings data={chartData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="col-span-1 hover:shadow-lg transition-shadow rounded-2xl border-border/80 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Yearly Breakup</CardTitle>
          </CardHeader>
          <CardContent>
            <YearlyBreakup data={quarterlyData} />
          </CardContent>
        </Card>

        <div className="col-span-1 h-full">
          <PieChartComponent
            title="Revenue Distribution"
            description="By Fabric Type"
            data={categoryData}
            total={categoryData.reduce((sum, item) => sum + item.value, 0)}
          />
        </div>

        <Card className="col-span-1 hover:shadow-lg transition-shadow rounded-2xl border-border/80 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductPerformance data={productPerformance} />
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-1 hover:shadow-lg transition-shadow rounded-2xl border-border/80 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactions data={recentTransactions} />
        </CardContent>
      </Card>
    </div>
  )
}
