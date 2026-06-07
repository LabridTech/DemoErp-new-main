import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Product {
  id: string
  name: string      
  code: string
  fabricType: string
  fabricColor: string
  fabricPattern: string
  fabricWeight: string
  fabricWidth: string
  fabricLength: string
  size: string
  purchaseCost: number
  minSalePrice: number
  maxSalePrice: number
  currentPrice: number
  stock: number
  minStock: number
  maxStock: number
  supplier: string
  batchInfo: string
  status: "active" | "inactive" | "discontinued"
  createdDate: string
}

interface ProductPriceHistoryEntry {
  date: string
  purchaseCost: number
  minSalePrice: number
  maxSalePrice: number
  currentPrice: number
}

interface PriceHistoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  historyProduct: Product | null
  priceHistory: ProductPriceHistoryEntry[]
  priceHistoryLoading: boolean
}

export function PriceHistoryDialog({
  isOpen,
  onOpenChange,
  historyProduct,
  priceHistory,
  priceHistoryLoading,
}: PriceHistoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto flex flex-col items-center justify-center">
        <DialogHeader>
          <DialogTitle>Product Price History</DialogTitle>
          <DialogDescription>
            History for {historyProduct?.name} ({historyProduct?.code})
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-muted-foreground w-full">
          {priceHistoryLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
              <span>Loading price history...</span>
            </div>
          ) : priceHistory.length === 0 ? (
            <p>No price history found for this product.</p>
          ) : (
            <div className="w-full flex justify-center">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center px-4 py-2 border-b">Date</TableHead>
                    <TableHead className="text-center px-4 py-2 border-b">Purchase Cost</TableHead>
                    <TableHead className="text-center px-4 py-2 border-b">Min Sale Price</TableHead>
                    <TableHead className="text-center px-4 py-2 border-b">Max Sale Price</TableHead>
                    <TableHead className="text-center px-4 py-2 border-b">Current Price</TableHead>
                    <TableHead className="text-center px-4 py-2 border-b">Previous Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceHistory.map((entry, idx) => {
                    const prev = priceHistory[idx + 1];
                    return (
                      <TableRow key={idx} className="align-middle">
                        <TableCell className="text-center px-4 py-2 border-b">
                          {new Date(entry.date).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-center px-4 py-2 border-b">Rs{entry.purchaseCost.toLocaleString()}</TableCell>
                        <TableCell className="text-center px-4 py-2 border-b">Rs{entry.minSalePrice.toLocaleString()}</TableCell>
                        <TableCell className="text-center px-4 py-2 border-b">Rs{entry.maxSalePrice.toLocaleString()}</TableCell>
                        <TableCell className="text-center px-4 py-2 border-b font-semibold">Rs{entry.currentPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-center px-4 py-2 border-b text-muted-foreground">{prev ? `Rs${prev.currentPrice.toLocaleString()}` : '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}