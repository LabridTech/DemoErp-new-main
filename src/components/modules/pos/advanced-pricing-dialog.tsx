'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Save, X, AlertTriangle } from 'lucide-react';
import { ProductService, type Product } from '@/lib/firebase-services';
import { useToast } from '@/hooks/use-toast';

interface AdvancedPricingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPriceUpdate: (productId: string, newPrice: number, individualPrices: number[]) => void;
  product: Product | null;
  currentPrice: number;
  quantity: number;
}

export function AdvancedPricingDialog({ 
  isOpen, 
  onClose, 
  onPriceUpdate, 
  product, 
  currentPrice,
  quantity
}: AdvancedPricingDialogProps) {
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [pricePerUnit, setPricePerUnit] = useState<string>('');
  const [individualPrices, setIndividualPrices] = useState<number[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [priceError, setPriceError] = useState<string>('');
  const { toast } = useToast();

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (isOpen && product && quantity > 0) {
      const total = currentPrice * quantity;
      setTotalPrice(total.toString());
      setPricePerUnit(currentPrice.toString());
      setIndividualPrices(Array(quantity).fill(currentPrice));
      setPriceError('');
    } else {
      setTotalPrice('');
      setPricePerUnit('');
      setIndividualPrices([]);
      setPriceError('');
    }
  }, [isOpen, product, currentPrice, quantity]);

  const handleTotalPriceChange = (value: string) => {
    setTotalPrice(value);
    setPriceError('');
    
    const numValue = parseFloat(value);
    if (value !== '' && !isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
      const unitPrice = parseFloat((numValue / quantity).toFixed(2));
      if (isFinite(unitPrice)) {
        setPricePerUnit(unitPrice.toString());
        setIndividualPrices(Array(quantity).fill(unitPrice));
      }
    }
  };

  const handlePricePerUnitChange = (value: string) => {
    setPricePerUnit(value);
    setPriceError('');
    
    const numValue = parseFloat(value);
    if (value !== '' && !isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
      const total = parseFloat((numValue * quantity).toFixed(2));
      if (isFinite(total)) {
        setTotalPrice(total.toString());
        setIndividualPrices(Array(quantity).fill(numValue));
      }
    }
  };

  const handleIndividualPriceChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (isNaN(numValue) || !isFinite(numValue)) {
      return; // Don't update if invalid
    }
    
    const newIndividualPrices = [...individualPrices];
    newIndividualPrices[index] = numValue;
    setIndividualPrices(newIndividualPrices);
    
    // Update total and average
    const newTotal = newIndividualPrices.reduce((sum, price) => sum + price, 0);
    const newAverage = parseFloat((newTotal / quantity).toFixed(2));
    
    if (isFinite(newTotal) && isFinite(newAverage)) {
      setTotalPrice(newTotal.toString());
      setPricePerUnit(newAverage.toString());
    }
  };

  const validatePrices = () => {
    if (totalPrice === '' || parseFloat(totalPrice) < 0) {
      setPriceError('Please enter a valid total price');
      return false;
    }

    const totalPriceNum = parseFloat(totalPrice);
    if (isNaN(totalPriceNum) || !isFinite(totalPriceNum)) {
      setPriceError('Please enter a valid number for total price');
      return false;
    }

    if (totalPriceNum > 999999) {
      setPriceError('Total price seems too high. Please verify the amount.');
      return false;
    }

    const hasInvalidPrices = individualPrices.some(price => price < 0 || isNaN(price) || !isFinite(price));
    if (hasInvalidPrices) {
      setPriceError('Individual prices must be valid numbers and cannot be negative');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!product) return;

    if (!validatePrices()) {
      return;
    }

    const finalTotalPrice = parseFloat(totalPrice);
    const finalUnitPrice = parseFloat((finalTotalPrice / quantity).toFixed(2));

    if (finalUnitPrice === currentPrice) {
      toast({
        title: "No Changes",
        description: "The price is already set to this amount.",
        variant: "default",
      });
      onClose();
      return;
    }

    setIsUpdating(true);

    try {
      // Update the product in the database
      await ProductService.updateProduct(product.id, {
        currentPrice: finalUnitPrice,
      });

      // Update the cart with the new price and individual prices
      onPriceUpdate(product.id, finalUnitPrice, individualPrices);

      toast({
        title: "Price Updated",
        description: `${product.name} price updated to Rs${finalUnitPrice.toLocaleString()} per unit`,
        variant: "default",
      });

      onClose();
    } catch (error) {
      console.error('Error updating price:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update product price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isUpdating) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!product) return null;

  const priceDifference = parseFloat(totalPrice) - (currentPrice * quantity);
  const percentageChange = currentPrice > 0 ? (priceDifference / (currentPrice * quantity)) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Advanced Price Editor
          </DialogTitle>
          <DialogDescription>
            Set pricing for this product. This will update both the current sale and the product database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{product.name}</h3>
              <Badge variant="outline" className="text-xs">
                {product.code}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Size: {product.size}</p>
              <p>Fabric: {product.fabricType}</p>
              <p>Stock: {product.stock} yard(s)</p>
              <p>Quantity in Cart: {quantity} unit(s)</p>
            </div>
          </div>

          {/* Current Price */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Price</Label>
            <div className="bg-muted p-3 rounded-md">
              <span className="text-lg font-semibold">Rs{currentPrice.toLocaleString()} per unit</span>
              <span className="text-sm text-muted-foreground ml-2">
                (Total: Rs{(currentPrice * quantity).toLocaleString()})
              </span>
            </div>
          </div>

          {/* Quick Total Price Entry */}
          <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-sm">Quick Total Price Entry</h4>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Total Price for All Units:</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="999999"
                value={totalPrice}
                onChange={(e) => handleTotalPriceChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter total price"
                className="flex-1"
                autoFocus
              />
              <span className="text-sm text-muted-foreground">Rs</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This will set the same price for all units: Rs{totalPrice ? (parseFloat(totalPrice) / quantity).toFixed(2) : '0.00'} per unit
            </p>
          </div>

          {/* Price Per Unit Entry */}
          <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-sm">Price Per Unit</h4>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Price per Unit:</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="999999"
                value={pricePerUnit}
                onChange={(e) => handlePricePerUnitChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter price per unit"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">Rs</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Total for {quantity} units: Rs{pricePerUnit ? (parseFloat(pricePerUnit) * quantity).toFixed(2) : '0.00'}
            </p>
          </div>

          {/* Individual Price Inputs (for quantities > 1) */}
          {quantity > 1 && (
            <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium text-sm">Individual Unit Prices (Optional)</h4>
              <p className="text-xs text-muted-foreground">
                Set different prices for each unit if needed. Leave empty to use the same price for all units.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Array.from({ length: quantity }, (_, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs">Unit {index + 1}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={individualPrices[index] || ''}
                      onChange={(e) => handleIndividualPriceChange(index, e.target.value)}
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Change Preview */}
          {totalPrice && !priceError && parseFloat(totalPrice) !== (currentPrice * quantity) && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Price Change Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Total Change:</span>
                  <span className={`font-semibold ${priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceDifference >= 0 ? '+' : ''}Rs{priceDifference.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Percentage:</span>
                  <span className={`font-semibold ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>New Unit Price:</span>
                  <span className="font-semibold">Rs{totalPrice ? (parseFloat(totalPrice) / quantity).toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Total:</span>
                  <span className="font-semibold">Rs{totalPrice || '0.00'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {priceError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              {priceError}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating || !!priceError || totalPrice === '' || parseFloat(totalPrice) === (currentPrice * quantity)}
            className="flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Update Price
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
