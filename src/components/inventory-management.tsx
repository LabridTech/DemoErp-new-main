"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Package, AlertTriangle, CheckCircle } from "lucide-react"
import { ProductService, EmployeeService, type Product, type StockMovement, type Employee } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

export function InventoryManagement() {
  // Only use products state
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name-asc")
  const { toast } = useToast()

  // Stock movements state for all products (for Stock Movements tab)
  const [allStockMovements, setAllStockMovements] = useState<StockMovement[]>([]);

  // Employees state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Fetch products, stock movements, and employees on mount
  useEffect(() => {
    setLoading(true)

    // Use real-time subscription for products with optimized deduplication
    const unsubscribeProducts = ProductService.subscribeToProducts((prods) => {
      console.log("Inventory Management: Received products update:", prods.length, "products")
      // Optimized deduplication using Map for better performance
      const productMap = new Map();
      prods.forEach(product => {
        if (product && product.id) {
          productMap.set(product.id, product);
        }
      });
      const uniqueProducts = Array.from(productMap.values());
      setProducts(uniqueProducts)
      setLoading(false)
    })

    // Load stock movements and employees
    ProductService.getAllStockMovements().then(setAllStockMovements)
    EmployeeService.getAllEmployees().then(setEmployees)

    // Cleanup subscription on unmount
    return () => {
      unsubscribeProducts()
    }
  }, [])

  // Memoized filtered products for better performance
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          (item.name || '').toLowerCase().includes(searchLower) ||
          (item.code || '').toLowerCase().includes(searchLower) ||
          item.fabricType?.toLowerCase().includes(searchLower)
      );
    }

    return result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "price-asc":
          return (a.currentPrice || 0) - (b.currentPrice || 0);
        case "price-desc":
          return (b.currentPrice || 0) - (a.currentPrice || 0);
        case "stock-asc":
          return (a.stock || 0) - (b.stock || 0);
        case "stock-desc":
          return (b.stock || 0) - (a.stock || 0);
        case "date-desc":
          return new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime();
        case "date-asc":
          return new Date(a.createdDate || 0).getTime() - new Date(b.createdDate || 0).getTime();
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });
  }, [products, searchTerm, sortBy]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);



  const getStockLevel = (item: Product) => {
    if (item.stock === 0) return { level: "Out of Stock", color: "text-red-600" }
    if (item.stock <= item.minStock) return { level: "Low Stock", color: "text-orange-600" }
    if (item.stock >= item.maxStock) return { level: "Overstock", color: "text-blue-600" }
    return { level: "Normal", color: "text-green-600" }
  }

  // Only keep restock (stock in/out) logic
  const [restockDialogOpen, setRestockDialogOpen] = useState(false)
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)
  const [restockAmount, setRestockAmount] = useState("")
  const [restockType, setRestockType] = useState<"in" | "out">("in")

  // Add state for stock movements dialog
  const [movementsDialogOpen, setMovementsDialogOpen] = useState(false);
  const [selectedProductMovements] = useState<StockMovement[]>([]);
  const [selectedProductForMovements] = useState<Product | null>(null);

  const openRestockDialog = (product: Product, type: "in" | "out") => {
    setRestockProduct(product)
    setRestockType(type)
    setRestockAmount("")
    setRestockDialogOpen(true)
  }

  // Update handleRestock to also create a stock movement record
  const handleRestock = async () => {
    if (!restockProduct) return;
    const amount = Number(restockAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const newStock = restockType === "in"
        ? restockProduct.stock + amount
        : Math.max(0, restockProduct.stock - amount);

      console.log("Inventory Management: Updating stock for product:", restockProduct.id, "from", restockProduct.stock, "to", newStock)

      await ProductService.updateProduct(restockProduct.id, {
        stock: newStock,
        updatedAt: new Date().toISOString()
      });

      // Find selected employee name
      const staffName = employees.find((e) => e.id === selectedEmployeeId)?.name || "Unknown";

      // Create stock movement record
      await ProductService.addStockMovement({
        itemId: restockProduct.id,
        itemName: restockProduct.name,
        type: restockType,
        quantity: amount,
        reason: restockType === "in" ? "Manual Stock In" : "Manual Stock Out",
        staff: staffName,
        date: new Date().toISOString(),
        reference: "Inventory Manual"
      });

      toast({
        title: restockType === "in" ? "Stock Added" : "Stock Removed",
        description: `Product stock has been updated.`,
      });

      setRestockDialogOpen(false);
      setRestockProduct(null);
      setRestockAmount("");
      setSelectedEmployeeId("");

      // Refresh stock movements (products will update automatically via subscription)
      ProductService.getAllStockMovements().then(setAllStockMovements);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        <div className="flex gap-2">
          {/* Remove add/edit/delete buttons */}
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                id="inventory-search"
                name="inventory-search"
                placeholder="Search by name, code, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Alphabetical (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Alphabetical (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
                  <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      {/* Navigation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Inventory Management</h3>
            <p className="text-sm text-muted-foreground">Monitor stock levels, movements, and alerts</p>
          </div>
        </div>

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="inventory">📦 Inventory Items</TabsTrigger>
            <TabsTrigger value="movements">📊 Stock Movements</TabsTrigger>
            <TabsTrigger value="alerts">⚠️ Stock Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory Items
                </CardTitle>
                <CardDescription>Manage your inventory stock levels and details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Stock Level</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Pricing</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Stock Update</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProducts.map((item, index) => {
                        const lowStock = item.stock <= item.minStock
                        // Find the latest stock movement for this item
                        const itemMovements = allStockMovements.filter((m) => m.itemId === item.id);
                        // Sort by date descending
                        const sortedMovements = [...itemMovements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        const lastStockMovement = sortedMovements[0];
                        return (
                          <TableRow key={`${item.id}-${index}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.code}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{item.fabricType}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.stock}</p>
                                <p className={`text-sm ${lowStock ? "text-orange-600" : "text-green-600"}`}>{lowStock ? "Low Stock" : "Normal"}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.supplier}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>Buy: Rs{(item.purchaseCost || 0).toLocaleString()}</p>
                                <p>Sell: Rs{(item.currentPrice || 0).toLocaleString()}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.stock === 0 ? "destructive" : "default"}>{item.stock === 0 ? "out-of-stock" : "available"}</Badge>
                            </TableCell>
                            <TableCell>
                              {lastStockMovement
                                ? (
                                  <div>
                                    <div className="text-xs">{new Date(lastStockMovement.date).toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {lastStockMovement.type === "in" ? "Stock In" : lastStockMovement.type === "out" ? "Stock Out" : lastStockMovement.type}
                                      {lastStockMovement.quantity ? ` (${lastStockMovement.quantity})` : ""}
                                      {lastStockMovement.staff ? ` by ${lastStockMovement.staff}` : ""}
                                    </div>
                                  </div>
                                )
                                : (
                                  <span className="text-xs text-muted-foreground">N/A</span>
                                )
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openRestockDialog(item, "in")}>Stock In</Button>
                                <Button size="sm" variant="outline" onClick={() => openRestockDialog(item, "out")}>Stock Out</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={!hasPrevPage}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!hasPrevPage}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!hasNextPage}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={!hasNextPage}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle>Stock Movements</CardTitle>
                <CardDescription>Track all inventory movements and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Staff</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStockMovements.length === 0 ? (
                        <TableRow key="no-movements">
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No stock movements found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        allStockMovements
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((m) => (
                            <TableRow key={m.id || `movement-${m.date}-${m.itemName}-${m.type}`}>
                              <TableCell>{new Date(m.date).toLocaleString()}</TableCell>
                              <TableCell>{m.itemName}</TableCell>
                              <TableCell>{m.type}</TableCell>
                              <TableCell>{m.quantity}</TableCell>
                              <TableCell>{m.reason}</TableCell>
                              <TableCell>
                                <div>
                                  <span>{m.staff}</span>
                                  {employees.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {employees.find((e) => e.name === m.staff)?.name || ""}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{m.reference}</TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Stock Alerts
                </CardTitle>
                <CardDescription>Items that need attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProducts
                    .filter((item) => item.stock <= item.minStock || item.stock === 0)
                    .map((item) => {
                      const stockLevel = getStockLevel(item)
                      return (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Current: {item.stock} | Min: {item.minStock}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">{stockLevel.level}</Badge>
                            <Button size="sm" onClick={() => openRestockDialog(item, "in")}>Restock</Button>
                          </div>
                        </div>
                      )
                    })}
                  {filteredProducts.filter((item) => item.stock <= item.minStock || item.stock === 0)
                    .length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium">All items are well stocked!</p>
                        <p className="text-muted-foreground">No stock alerts at this time.</p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProducts.length}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredProducts.filter((item) => item.stock <= item.minStock).length}
            </div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredProducts.filter((item) => item.stock === 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Urgent restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-2xl font-bold">
                  Rs{products.reduce((sum, item) => sum + (Math.max(0, Number(item.stock) || 0)) * (Number(item.purchaseCost) || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total Purchase Value</p>
              </div>
              <div className="pt-2 border-t">
                <div className="text-lg font-semibold text-green-600">
                  Rs{products.reduce((sum, item) => sum + (Math.max(0, Number(item.stock) || 0)) * (Number(item.currentPrice) || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total Sales Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Restock Dialog at the end of the component */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{restockType === "in" ? "Stock In" : "Stock Out"}</DialogTitle>
            <DialogDescription>Update product stock</DialogDescription>
          </DialogHeader>
          {restockProduct && (
            <div className="space-y-4">
              <Label>Product</Label>
              <Input value={restockProduct.name} disabled />
              <Label>Amount</Label>
              <Input type="number" value={restockAmount} onChange={e => setRestockAmount(e.target.value)} />
              <Label>Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRestockDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleRestock} disabled={!selectedEmployeeId}>Update</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Stock Movements Dialog at the end of the component */}
      <Dialog open={movementsDialogOpen} onOpenChange={setMovementsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Movements for {selectedProductForMovements?.name}</DialogTitle>
            <DialogDescription>All stock in/out/adjustments for this product</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedProductMovements.length === 0 ? (
              <p className="text-muted-foreground">No stock movements found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProductMovements
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((m) => (
                      <TableRow key={m.id || `dialog-movement-${m.date}-${m.type}-${m.quantity}`}>
                        <TableCell>{new Date(m.date).toLocaleString()}</TableCell>
                        <TableCell>{m.type}</TableCell>
                        <TableCell>{m.quantity}</TableCell>
                        <TableCell>{m.reason}</TableCell>
                        <TableCell>{m.staff}</TableCell>
                        <TableCell>{m.reference}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
