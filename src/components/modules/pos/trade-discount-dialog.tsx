import { FC, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Product, CartItem } from '@/types/pos';

interface TradeDiscountDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  cartItems: CartItem[];
  onAddFreeItem: (params: {
    product: Product;
    quantity: number;
    note: string;
    relatedPaidItemId: string | null;
  }) => void;
}

export const TradeDiscountDialog: FC<TradeDiscountDialogProps> = ({
  isOpen,
  onOpenChange,
  product,
  cartItems,
  onAddFreeItem,
}) => {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('Trade Discount');
  const [relatedItemId, setRelatedItemId] = useState<string | null>(null);

  const paidItems = cartItems.filter(item => item.lineType !== 'free');

  const handleSubmit = useCallback(() => {
    if (!product) return;
    
    if (quantity < 1) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a quantity of 1 or more',
        variant: 'destructive',
      });
      return;
    }

    onAddFreeItem({
      product,
      quantity,
      note,
      relatedPaidItemId: relatedItemId,
    });
    
    // Reset form
    setQuantity(1);
    setNote('Trade Discount');
    setRelatedItemId(null);
    onOpenChange(false);
  }, [product, quantity, note, relatedItemId, onAddFreeItem, onOpenChange, toast]);

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Free Item</DialogTitle>
          <DialogDescription>
            Add {product.name} as a free item to the cart
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="note" className="text-right">
              Note
            </Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="col-span-3"
              placeholder="Reason for free item"
            />
          </div>
          
          {paidItems.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="relatedItem" className="text-right">
                Link to Item (Optional)
              </Label>
              <select
                id="relatedItem"
                value={relatedItemId || ''}
                onChange={(e) => setRelatedItemId(e.target.value || null)}
                className="col-span-3 p-2 border rounded"
              >
                <option value="">None</option>
                {paidItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Qty: {item.quantity})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Free Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
