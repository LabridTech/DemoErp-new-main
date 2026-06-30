"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Eye, User, UserCheck, TrendingUp, TrendingDown, Clock, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CustomerService, type Customer, CustomerCreditService, type CustomerCredit } from "@/lib/firebase-services"
import { SalesService, type SaleRecord } from "@/lib/firebase-services"
import { DateRangeFilter, DateFilterType } from "@/components/ui/date-range-filter"
import { CustomerViewDialog } from "@/components/modules/customer-management/customer-view-dialog"
import { CustomerEditDialog } from "@/components/modules/customer-management/customer-edit-dialog"
import { CustomerDeleteDialog } from "@/components/modules/customer-management/customer-delete-dialog"
import { CustomerDetail } from "@/components/modules/customer-management/customer-detail"

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([])
  const [customerCredits, setCustomerCredits] = useState<CustomerCredit[]>([])
  const [customerRunningBalances, setCustomerRunningBalances] = useState<{ [customerId: string]: number }>({})
  const [isCalculatingBalances, setIsCalculatingBalances] = useState(false)
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [avgCustomerValue, setAvgCustomerValue] = useState(0);
  const [customerRevenueMap, setCustomerRevenueMap] = useState<Record<string, number>>({});
  const [, setCustomerTransactionMap] = useState<Record<string, number>>({});

  // Date filter state
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("new_ver")
  const [startDate, setStartDate] = useState<Date | null>(() => {
    return new Date(2026, 1, 17); // Feb 17, 2026
  })
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [allSales, setAllSales] = useState<SaleRecord[]>([])

  const { toast } = useToast()

  const loadCustomersData = useCallback(async () => {
    try {
      setLoading(true)
      const [customersData, creditsData, salesData] = await Promise.all([
        CustomerService.getAllCustomers(),
        CustomerCreditService.getAll<CustomerCredit>("customerCredits"),
        SalesService.getAllSales()
      ])
      setCustomers(customersData)
      setCustomerCredits(creditsData)
      setRecentSales(salesData)
      setAllSales(salesData)
    } catch (error) {
      console.error("Error loading customers data:", error)
      toast({
        title: "Error",
        description: "Failed to load customers data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadCustomersData()
    return () => { }
  }, [loadCustomersData])

  useEffect(() => {
    if (selectedCustomer) {
      const fetchRecentSales = async () => {
        try {
          const sales = await SalesService.getAllSales()
          const filteredSales = sales.filter(sale => sale.customerName === selectedCustomer.name)
          const sortedSales = filteredSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          const recentSales = sortedSales.slice(0, 5)
          setRecentSales(recentSales);
        } catch (error) {
          console.error("Error fetching recent sales:", error);
          toast({
            title: "Error",
            description: "Failed to load recent sales. Please try again.",
            variant: "destructive",
          });
        }
      };
      fetchRecentSales();
    }
  }, [selectedCustomer, toast]);

  // Calculate analytics when allSales or date filter changes
  useEffect(() => {
    function calculateAnalytics() {
      if (allSales.length === 0) return;

      const filteredSales = allSales.filter(sale => {
        if (!sale.date) return false;

        // Parse date (assuming YYYY-MM-DD or DD/MM/YYYY)
        let recordDate: Date;
        if (sale.date.includes('/')) {
          const parts = sale.date.split('/');
          recordDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else if (sale.date.includes('-')) {
          // Check if T exists (ISO) or just YYYY-MM-DD
          if (sale.date.includes('T')) {
            const parts = sale.date.split('T')[0].split('-');
            recordDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            const parts = sale.date.split('-');
            recordDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        } else {
          recordDate = new Date(sale.date);
        }

        if (isNaN(recordDate.getTime())) return false;

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
      });

      setTotalTransactions(allSales.length); // All time transactions
      const revenue = filteredSales.reduce((sum, sale) => sum + (typeof sale.total === 'number' ? sale.total : 0), 0);
      setTotalRevenue(revenue);

      // We also update maps for Top Customers (keep filtered as it is revenue based)
      const revenueMap: Record<string, number> = {};
      const transactionMap: Record<string, number> = {};
      filteredSales.forEach(sale => {
        const key = sale.customerPhone || sale.customerName;
        if (!key) return;
        if (!revenueMap[key]) revenueMap[key] = 0;
        if (!transactionMap[key]) transactionMap[key] = 0;
        revenueMap[key] += typeof sale.total === 'number' ? sale.total : 0;
        transactionMap[key] += 1;
      });
      setCustomerRevenueMap(revenueMap);
      setCustomerTransactionMap(transactionMap);

      // Avg Customer Value based on All Time stats
      const allRevenue = allSales.reduce((sum, sale) => sum + (typeof sale.total === 'number' ? sale.total : 0), 0);
      const uniqueCustomersCount = new Set(allSales.map(s => s.customerPhone || s.customerName)).size;
      setAvgCustomerValue(uniqueCustomersCount > 0 ? Math.round(allRevenue / uniqueCustomersCount) : 0);
    }

    calculateAnalytics();
  }, [allSales, startDate, endDate]);

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCustomerDetail(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsEditDialogOpen(true)
  }

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDeleteDialogOpen(true)
  }

  // Calculate running balance for each customer (optimized)
  useEffect(() => {
    const calculateRunningBalances = async () => {
      if (customers.length === 0) return

      // Show initial balances immediately
      const initialBalances: { [customerId: string]: number } = {}
      customers.forEach(customer => {
        initialBalances[customer.id] = 0 // Customers start with 0 balance
      })
      setCustomerRunningBalances(initialBalances)

      setIsCalculatingBalances(true)

      try {
        // Load all data in parallel instead of per customer
        const [allSales, allCredits, allTransactions] = await Promise.all([
          SalesService.getAllSales(),
          CustomerCreditService.getAll<CustomerCredit>("customerCredits"),
          // Get transactions for all customers at once
          Promise.all(customers.map(customer =>
            CustomerCreditService.getCreditTransactions(customer.id)
          )).then(transactionArrays =>
            transactionArrays.flat().reduce((acc, transaction) => {
              if (!acc[transaction.customerId]) acc[transaction.customerId] = []
              acc[transaction.customerId].push(transaction)
              return acc
            }, {} as {
              [customerId: string]: Array<{
                id: string
                customerId: string
                amount: number
                type: string
                description: string
                createdAt: string
              }>
            })
          )
        ])

        const balances: { [customerId: string]: number } = {}

        // Process each customer
        for (const customer of customers) {
          // Filter data for this customer - use name as primary identifier
          const customerSales = allSales.filter(s =>
            s.customerName === customer.name
          )
          const customerCreditsList = allCredits.filter(c =>
            c.customerId === customer.id
          )
          const customerTransactions = allTransactions[customer.id] || []

          // Combine all transactions
          const allCustomerTransactions: Array<{
            date: string
            type: 'sale' | 'payment' | 'credit'
            amount: number
          }> = []

          // Add sales
          customerSales.forEach(sale => {
            allCustomerTransactions.push({
              date: sale.createdAt || sale.date,
              type: 'sale',
              amount: sale.total || 0
            })
          })

          // Add credit transactions
          customerCreditsList.forEach(credit => {
            if (credit.type === "credit") {
              allCustomerTransactions.push({
                date: credit.createdAt,
                type: 'payment',
                amount: credit.amount
              })
            }
          })

          // Add used credit transactions
          customerTransactions.forEach(transaction => {
            if (transaction.type === "used") {
              allCustomerTransactions.push({
                date: transaction.createdAt,
                type: 'sale',
                amount: transaction.amount
              })
            } else if (transaction.type === "refunded") {
              allCustomerTransactions.push({
                date: transaction.createdAt,
                type: 'payment',
                amount: transaction.amount
              })
            }
          })

          // Sort chronologically and calculate running balance
          const sortedTransactions = allCustomerTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          let runningBalance = 0 // Customers start with 0 balance

          sortedTransactions.forEach(transaction => {
            if (transaction.type === 'sale' || transaction.type === 'credit') {
              runningBalance += transaction.amount
            } else if (transaction.type === 'payment') {
              runningBalance -= transaction.amount
            }
          })

          balances[customer.id] = runningBalance
        }

        setCustomerRunningBalances(balances)
      } catch (error) {
        console.error("Error calculating running balances:", error)
        // Fallback to 0 balance if calculation fails
        const fallbackBalances: { [customerId: string]: number } = {}
        customers.forEach(customer => {
          fallbackBalances[customer.id] = 0
        })
        setCustomerRunningBalances(fallbackBalances)
      } finally {
        setIsCalculatingBalances(false)
      }
    }

    calculateRunningBalances()
  }, [customers, recentSales, customerCredits])

  const handleSaveCustomer = async (customer: Customer) => {
    try {
      if (customer.id) {
        await CustomerService.updateCustomer(customer.id, customer)
        toast({
          title: "Customer Updated",
          description: `Customer "${customer.name}" updated.`,
        })
      } else {
        await CustomerService.createCustomer({
          ...customer,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        toast({
          title: "Customer Added",
          description: `Customer "${customer.name}" added.`,
        })
      }
      setIsEditDialogOpen(false)
      loadCustomersData()
    } catch (error) {
      console.error("Error saving customer:", error)
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSuccess = () => {
    if (!selectedCustomer) return

    // Deletion is already handled by the CustomerDeleteDialog
    // We just need to update the UI
    toast({
      title: "Customer Deleted",
      description: `Customer "${selectedCustomer.name}" has been removed.`,
    })
    setIsDeleteDialogOpen(false)
    setShowCustomerDetail(false)
    loadCustomersData()
  }

  const handleBackToList = () => {
    setShowCustomerDetail(false)
    setSelectedCustomer(null)
  }

  const getCustomerTypeColor = (customerType: string) => {
    switch (customerType) {
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

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (customer.name || '').toLowerCase().includes(searchLower) ||
      (customer.phone || '').includes(searchTerm) ||
      (customer.email || '').toLowerCase().includes(searchLower) ||
      (customer.address || '').toLowerCase().includes(searchLower)
    )
  })

  const sortedCustomers = filteredCustomers.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading customer data...</p>
        </div>
      </div>
    )
  }

  // Show customer detail view if a customer is selected
  if (showCustomerDetail && selectedCustomer) {
    return (
      <CustomerDetail
        customer={selectedCustomer}
        onBack={handleBackToList}
        onCustomerUpdated={loadCustomersData}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
          <div className="flex bg-muted/50 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
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
        </div>
        <Button className="w-full sm:w-auto" onClick={() => {
          setSelectedCustomer({
            id: "",
            name: "",
            email: "",
            phone: "",
            address: "",
            customerType: "regular",
            totalPurchases: 0,
            totalSpent: 0,
            creditLimit: 0,
            currentCredit: 0,
            notes: "",
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          setIsEditDialogOpen(true)
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">Total registered customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Customer Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{avgCustomerValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime value per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All time transactions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-customers" className="space-y-4">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-2 p-1">
          <TabsTrigger value="all-customers">All Customers</TabsTrigger>
          <TabsTrigger value="top-customers">Top Customers</TabsTrigger>
          <TabsTrigger value="recent-customers">Recent Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="all-customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Customers
              </CardTitle>
              <CardDescription>Search by customer name, phone, email, or address</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search by name, phone, email, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer List
              </CardTitle>
              <CardDescription>Complete customer database with purchase history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Running Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCustomers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <Badge variant={getCustomerTypeColor(customer.customerType || "regular") as "destructive" | "default" | "secondary" | "outline" | undefined} className="text-xs">
                              {customer.customerType || "Regular"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{customer.phone}</p>
                          {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCustomerTypeColor(customer.customerType || "regular") as "destructive" | "default" | "secondary" | "outline" | undefined}>
                            {customer.customerType || "Regular"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(customerRunningBalances[customer.id] || 0) > 0 ? "destructive" : (customerRunningBalances[customer.id] || 0) < 0 ? "secondary" : "default"}>
                            {isCalculatingBalances ? (
                              <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (customerRunningBalances[customer.id] || 0) > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (customerRunningBalances[customer.id] || 0) < 0 ? (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            ) : null}
                            Rs{(customerRunningBalances[customer.id] || 0).toLocaleString()}
                            {isCalculatingBalances && (
                              <span className="ml-1 text-xs opacity-70">(calculating...)</span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewCustomer(customer)
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
                                handleEditCustomer(customer)
                              }}
                              title="Edit Customer"
                            >
                              <User className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCustomer(customer)
                              }}
                              title="Delete Customer"
                            >
                              <UserCheck className="h-4 w-4 text-red-500" />
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

        <TabsContent value="top-customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Customers by Revenue
              </CardTitle>
              <CardDescription>Your highest-value customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.slice(0, 10).map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{customer.name}</p>
                          <Badge variant={getCustomerTypeColor(customer.customerType || "regular") as "destructive" | "default" | "secondary" | "outline" | undefined}>
                            {customer.customerType || "Regular"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.email && <span>{customer.email} • </span>}
                          {customer.address && <span>{customer.address}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">Rs{(customerRevenueMap[customer.phone] || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Last purchase: {customer.updatedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Customers
              </CardTitle>
              <CardDescription>Customers who made purchases recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers
                  .sort((a, b) => new Date(b.updatedAt || "").getTime() - new Date(a.updatedAt || "").getTime())
                  .slice(0, 10)
                  .map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{customer.name}</p>
                          <Badge variant={getCustomerTypeColor(customer.customerType || "regular") as "destructive" | "default" | "secondary" | "outline" | undefined}>
                            {customer.customerType || "Regular"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.email && <span>{customer.email} • </span>}
                          {customer.address && <span>{customer.address}</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{customer.updatedAt}</p>
                        <p className="text-sm text-muted-foreground">Last updated</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CustomerViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        customer={selectedCustomer}
        recentSales={recentSales}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        getCustomerTypeColor={getCustomerTypeColor}
      />

      <CustomerEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        customer={selectedCustomer}
        onCustomerChange={setSelectedCustomer}
        onSave={handleSaveCustomer}
        isNew={!selectedCustomer?.id}
      />

      <CustomerDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        customer={selectedCustomer}
        onConfirm={handleDeleteSuccess}
      />
    </div >
  )
}