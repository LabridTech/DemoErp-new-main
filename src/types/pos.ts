export interface Product {
  id: string;
  name: string;
  code: string;
  currentPrice: number;
  stock: number;
  sku?: string;
  barcode?: string;
  fabricType?: string;
  fabricColor?: string;
  fabricPattern?: string;
  fabricWeight?: string;
  fabricWidth?: string;
  fabricLength?: string;
  costPrice?: number;
  sellingPrice?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  location?: string;
  notes?: string;
  isActive?: boolean;
  lastUpdated?: Date;
  size?: string;
  supplier?: string;
  batchInfo?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
  discount: number;
  finalPrice: number;
  availableStock: number;
  lineType: 'paid' | 'free';
  freeReason?: string;
  relatedPaidItemId?: string | null;
  sku?: string;
  isTradeDiscount?: boolean;
  timestamp?: string;
  originalPrice?: number;
  tradeDiscountQuantity?: number;
  tradeDiscountFreeItems?: Array<{
    id: string;
    productId: string;
    quantity: number;
  }>;
}

export interface SaleItem {
  id: string;
  productId: string;
  name: string;
  code: string;
  quantity: number;
  originalPrice: number;
  finalPrice: number;
  discount: number;
  lineType?: 'paid' | 'free';
  freeReason?: string;
  relatedPaidItemId?: string | null;
  isTradeDiscount?: boolean;
  timestamp?: string;
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerType: 'walk-in' | 'regular' | 'vip';
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'credit';
  paymentStatus: 'paid' | 'partial' | 'pending';
  deliveryStatus: 'pickup' | 'delivered' | 'pending' | 'cancelled';
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  deliveryDate?: string;
  staffMember: string;
  notes: string;
  returnStatus: 'none' | 'partial' | 'full';
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
}

export interface TradeDiscountParams {
  product: Product;
  quantity: number;
  note: string;
  relatedPaidItemId: string | null;
}

export interface InvoiceData extends Omit<SaleRecord, 'items'> {
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    originalPrice?: number;
    discount?: number;
    finalPrice?: number;
  }>;
  // These are already included from SaleRecord:
  // - id
  // - invoiceNumber
  // - customerName
  // - customerPhone
  // - date
  // - paymentMethod
  // - staffMember
  // - subtotal
  // - tax
  // - discount
  // - total
}

export type CartLineType = 'paid' | 'free';

export interface TradeDiscountFreeLine {
  productId: string;
  productName: string;
  freeQuantity: number;
  relatedPaidItemId?: string;
  note?: string;
  createdAt: number;
  createdBy?: string;
}
