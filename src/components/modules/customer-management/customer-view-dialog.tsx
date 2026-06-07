import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Phone, MapPin, FileText, UserCheck, Mail, Calendar, DollarSign, ShoppingBag, CreditCard } from "lucide-react"
import { Customer, SaleRecord } from "@/lib/firebase-services"

interface CustomerViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  recentSales: SaleRecord[]
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  getCustomerTypeColor: (type: string) => "destructive" | "default" | "secondary" | "outline" | undefined
}

export function CustomerViewDialog({ 
  open, 
  onOpenChange, 
  customer, 
  recentSales, 
  onEdit, 
  onDelete, 
  getCustomerTypeColor 
}: CustomerViewDialogProps) {
  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'partial':
        return 'outline'
      case 'unpaid':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getDeliveryStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'in_transit':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-[2400px] h-[95vh] max-h-[1800px] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-primary/10 rounded-lg">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="font-bold text-2xl">{customer.name}</div>
              <div className="text-base text-muted-foreground">Customer Profile</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-12 space-y-8">
          {/* Customer Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <User className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Type</p>
                    <Badge variant={getCustomerTypeColor(customer.customerType)} className="text-sm">
                      {customer.customerType ? customer.customerType.charAt(0).toUpperCase() + customer.customerType.slice(1) : 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Purchases</p>
                    <p className="text-xl font-semibold">{customer.totalPurchases || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Total Spent</p>
                    <p className="text-xl font-semibold">Rs{(customer.totalSpent || 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Last Purchase</p>
                    <p className="text-base font-semibold">
                      {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <User className="h-6 w-6" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Name</p>
                    <p className="text-lg font-medium">{customer.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Phone</p>
                    <p className="text-lg font-medium">{customer.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Email</p>
                    <p className="text-lg font-medium">{customer.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Address</p>
                    <p className="text-lg font-medium">{customer.address || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <CreditCard className="h-6 w-6" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Credit Limit</p>
                    <p className="text-lg font-medium">Rs{(customer.creditLimit || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Current Credit</p>
                    <p className="text-lg font-medium">Rs{(customer.currentCredit || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Account Created</p>
                    <p className="text-lg font-medium">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-base text-muted-foreground">Status</p>
                    <Badge variant={customer.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                      {customer.status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <FileText className="h-6 w-6" />
                Recent Purchase History
                <Badge variant="outline" className="ml-2 text-sm">{recentSales.length} transactions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-base">Date</TableHead>
                        <TableHead className="text-base">Items</TableHead>
                        <TableHead className="text-base">Amount</TableHead>
                        <TableHead className="text-base">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <div>
                              <p className="text-base font-medium">{sale.date}</p>
                              <p className="text-sm text-muted-foreground">{sale.time}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-md">
                              {(() => {
                                const itemNames = sale.items.map((item: { name: string }) => item.name).join(", ");
                                return (
                                  <p className="text-base truncate" title={itemNames}>
                                    {itemNames}
                                  </p>
                                );
                              })()}
                              <p className="text-sm text-muted-foreground">{sale.items.length} item(s)</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-base font-semibold">Rs{sale.total.toLocaleString()}</p>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Badge variant={getPaymentStatusColor(sale.paymentStatus)} className="text-sm">
                                {sale.paymentStatus}
                              </Badge>
                              <Badge variant={getDeliveryStatusColor(sale.deliveryStatus)} className="text-sm">
                                {sale.deliveryStatus}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <p className="text-lg text-muted-foreground">No purchase history available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => onEdit(customer)}
              className="flex-1 h-12 text-base"
            >
              <User className="h-5 w-5 mr-3" />
              Edit Customer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onDelete(customer)}
              className="flex-1 h-12 text-base text-destructive hover:text-destructive"
            >
              <UserCheck className="h-5 w-5 mr-3" />
              Delete Customer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}