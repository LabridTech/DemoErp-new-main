"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, AlertTriangle, Package, DollarSign, Trash2, RotateCcw, Receipt, User, FileText } from "lucide-react";
import { ProductService, DisposalService, SalesService, CustomerReturnService, SupplierReturnService, PurchaseService, SupplierService, ReturnCounterService, type DisposalRecord, type Product, type SaleRecord, type CustomerReturnRecord, type SupplierReturnRecord, type Purchase } from "@/lib/firebase-services";
import { useToast } from "@/hooks/use-toast";
import { CreditNotesInvoiceService } from "@/lib/credit-notes-invoice-service";
import jsPDF from 'jspdf';

import { AddDisposalDialog } from "./modules/disposal/add-disposal-dialog";
import { DeleteDisposalDialog } from "./modules/disposal/delete-disposal-dialog";


type ConditionType = "damaged" | "expired" | "defective" | "unsold" | "stolen";
type DisposalMethodType =
  | "discard"
  | "donate"
  | "sell-discount"
  | "return-supplier"
  | "recycle";

function toConditionType(value: string): ConditionType {
  if (
    value === "damaged" ||
    value === "expired" ||
    value === "defective" ||
    value === "unsold" ||
    value === "stolen"
  ) {
    return value;
  }
  return "damaged";
}

function toDisposalMethodType(value: string): DisposalMethodType {
  if (
    value === "discard" ||
    value === "donate" ||
    value === "sell-discount" ||
    value === "return-supplier" ||
    value === "recycle"
  ) {
    return value;
  }
  return "discard";
}

function getConditionColor(
  condition: string
): "destructive" | "default" | "secondary" | "outline" {
  switch (condition) {
    case "damaged":
    case "stolen":
      return "destructive";
    case "expired":
      return "secondary";
    case "defective":
      return "outline";
    case "unsold":
      return "default";
    default:
      return "outline";
  }
}

function getMethodColor(
  method: string
): "destructive" | "default" | "secondary" | "outline" {
  switch (method) {
    case "discard":
      return "destructive";
    case "donate":
    case "recycle":
      return "default";
    case "sell-discount":
      return "secondary";
    case "return-supplier":
      return "outline";
    default:
      return "outline";
  }
}

interface DisposalFormRecord {
  itemName: string
  itemCode: string
  category: string
  quantity: string
  originalPrice: string
  disposalValue: string
  condition: ConditionType
  disposalMethod: DisposalMethodType
  batchNumber: string
  supplierName: string
  reason: string
  notes: string
}


interface ReturnFormData {
  returnType: "manual" | "invoice"
  invoiceNumber: string
  customerName: string
  customerPhone: string
  selectedProducts: Array<{
    productId: string
    productName: string
    productCode: string
    quantity: number
    originalPrice: number
    returnReason: string
  }>
  notes: string
}

interface SupplierReturnFormData {
  returnType: "manual" | "invoice"
  invoiceNumber: string
  supplierId: string
  supplierName: string
  supplierPhone: string
  supplierAddress: string
  selectedProducts: Array<{
    productId: string
    productName: string
    productCode: string
    quantity: number
    originalPrice: number
    returnReason: string
  }>
  notes: string
}


export function DisposalModule() {
  const [disposalRecords, setDisposalRecords] = useState<DisposalRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerReturnSearchTerm, setCustomerReturnSearchTerm] = useState("");
  const [supplierReturnSearchTerm, setSupplierReturnSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteCustomerReturnId, setDeleteCustomerReturnId] = useState<string | null>(null);
  const [deleteSupplierReturnId, setDeleteSupplierReturnId] = useState<string | null>(null);
  const { toast } = useToast();

  // Customer Return state
  const [customerReturns, setCustomerReturns] = useState<CustomerReturnRecord[]>([]);
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);
  const [returnFormData, setReturnFormData] = useState<ReturnFormData>({
    returnType: "invoice",
    invoiceNumber: "",
    customerName: "",
    customerPhone: "",
    selectedProducts: [],
    notes: ""
  });
  const [returnProductSearch, setReturnProductSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [invoiceSearchResults, setInvoiceSearchResults] = useState<SaleRecord[]>([]);
  const [showInvoiceResults, setShowInvoiceResults] = useState(false);
  const invoiceSearchRef = useRef<HTMLDivElement>(null);

  // Supplier Return state
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturnRecord[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<Purchase[]>([]);
  const [supplierReturnFormData, setSupplierReturnFormData] = useState<SupplierReturnFormData>({
    returnType: "invoice",
    invoiceNumber: "",
    supplierId: "",
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    selectedProducts: [],
    notes: ""
  });
  const [supplierReturnProductSearch, setSupplierReturnProductSearch] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseSearchResults, setPurchaseSearchResults] = useState<Purchase[]>([]);
  const [showPurchaseResults, setShowPurchaseResults] = useState(false);
  const purchaseSearchRef = useRef<HTMLDivElement>(null);

  const [newDisposal, setNewDisposal] = useState<DisposalFormRecord>({
    itemName: "",
    itemCode: "",
    category: "",
    originalPrice: "",
    disposalValue: "",
    quantity: "",
    reason: "",
    condition: "damaged", // Default condition
    disposalMethod: "discard", // Default method
    notes: "",
    batchNumber: "",
    supplierName: "",
  });
  const [productSearch, setProductSearch] = useState("");

  // For delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<DisposalRecord | null>(null);

  useEffect(() => {
    const unsubscribe = DisposalService.subscribeToDisposalRecords((records) => {
      setDisposalRecords(records || []);
      setLoading(false);
    });
    
    const loadData = async () => {
      try {
        const [productsData, salesData, customerReturnsData, purchaseData, , supplierReturnsData] = await Promise.all([
          ProductService.getAllProducts(),
          SalesService.getAllSales(),
          CustomerReturnService.getAllCustomerReturns(),
          PurchaseService.getAllPurchases(),
          SupplierService.getAllSuppliers(),
          SupplierReturnService.getAllSupplierReturns()
        ]);
        setProducts(productsData);
        setSalesRecords(salesData);
        setCustomerReturns(customerReturnsData);
        setPurchaseRecords(purchaseData);
        setSupplierReturns(supplierReturnsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    loadData();
    
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [toast]);

  // Handle click outside to close invoice search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (invoiceSearchRef.current && !invoiceSearchRef.current.contains(event.target as Node)) {
        setShowInvoiceResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // When a product is selected, auto-fill related fields
  const handleProductSelect = (product: Product | null, typedValue?: string) => {
    if (product) {
      setNewDisposal((prev) => ({
        ...prev,
        itemName: product.name,
        itemCode: product.code,
        category: product.fabricType || "",
        originalPrice: product.purchaseCost ? String(product.purchaseCost) : "",
        supplierName: product.supplier || "",
        batchNumber: product.batchInfo || "",
      }));
    } else {
      setNewDisposal((prev) => ({
        ...prev,
        itemName: typedValue || "",
        itemCode: "",
        category: "",
        originalPrice: "",
        supplierName: "",
        batchNumber: "",
      }));
    }
  };

  const filteredRecords = disposalRecords.filter((record) => {
    const term = searchTerm.toLowerCase();
    return (
      (record.itemName && record.itemName.toLowerCase().includes(term)) ||
      (record.itemCode && record.itemCode.toLowerCase().includes(term)) ||
      (record.reason && record.reason.toLowerCase().includes(term))
    );
  });

  // Filter customer returns based on search term
  const filteredCustomerReturns = customerReturns.filter((returnRecord) => {
    if (!searchTerm.trim() && !customerReturnSearchTerm.trim()) return true; // Show all if no search term
    const globalTerm = searchTerm.toLowerCase();
    const localTerm = customerReturnSearchTerm.toLowerCase();
    
    const matchesGlobal = !searchTerm.trim() || (
      (returnRecord.returnNumber && returnRecord.returnNumber.toLowerCase().includes(globalTerm)) ||
      (returnRecord.customerName && returnRecord.customerName.toLowerCase().includes(globalTerm)) ||
      (returnRecord.customerPhone && returnRecord.customerPhone.includes(globalTerm)) ||
      (returnRecord.originalInvoiceNumber && returnRecord.originalInvoiceNumber.toLowerCase().includes(globalTerm))
    );
    
    const matchesLocal = !customerReturnSearchTerm.trim() || (
      (returnRecord.returnNumber && returnRecord.returnNumber.toLowerCase().includes(localTerm)) ||
      (returnRecord.customerName && returnRecord.customerName.toLowerCase().includes(localTerm)) ||
      (returnRecord.customerPhone && returnRecord.customerPhone.includes(localTerm)) ||
      (returnRecord.originalInvoiceNumber && returnRecord.originalInvoiceNumber.toLowerCase().includes(localTerm)) ||
      (returnRecord.returnDate && returnRecord.returnDate.toLowerCase().includes(localTerm)) ||
      (returnRecord.returnTime && returnRecord.returnTime.toLowerCase().includes(localTerm)) ||
      (returnRecord.staffMember && returnRecord.staffMember.toLowerCase().includes(localTerm)) ||
      (returnRecord.notes && returnRecord.notes.toLowerCase().includes(localTerm)) ||
      (returnRecord.returnType && returnRecord.returnType.toLowerCase().includes(localTerm)) ||
      (returnRecord.items && returnRecord.items.some(item => 
        item.productName.toLowerCase().includes(localTerm) ||
        item.productCode.toLowerCase().includes(localTerm) ||
        item.returnReason.toLowerCase().includes(localTerm)
      ))
    );
    
    return matchesGlobal && matchesLocal;
  });

  // Filter supplier returns based on search term
  const filteredSupplierReturns = supplierReturns.filter((returnRecord) => {
    if (!searchTerm.trim() && !supplierReturnSearchTerm.trim()) return true; // Show all if no search term
    const globalTerm = searchTerm.toLowerCase();
    const localTerm = supplierReturnSearchTerm.toLowerCase();
    
    const matchesGlobal = !searchTerm.trim() || (
      (returnRecord.returnNumber && returnRecord.returnNumber.toLowerCase().includes(globalTerm)) ||
      (returnRecord.supplierName && returnRecord.supplierName.toLowerCase().includes(globalTerm)) ||
      (returnRecord.supplierPhone && returnRecord.supplierPhone.toLowerCase().includes(globalTerm)) ||
      (returnRecord.originalInvoiceNumber && returnRecord.originalInvoiceNumber.toLowerCase().includes(globalTerm))
    );
    
    const matchesLocal = !supplierReturnSearchTerm.trim() || (
      (returnRecord.returnNumber && returnRecord.returnNumber.toLowerCase().includes(localTerm)) ||
      (returnRecord.supplierName && returnRecord.supplierName.toLowerCase().includes(localTerm)) ||
      (returnRecord.supplierPhone && returnRecord.supplierPhone.toLowerCase().includes(localTerm)) ||
      (returnRecord.supplierAddress && returnRecord.supplierAddress.toLowerCase().includes(localTerm)) ||
      (returnRecord.originalInvoiceNumber && returnRecord.originalInvoiceNumber.toLowerCase().includes(localTerm)) ||
      (returnRecord.returnDate && returnRecord.returnDate.toLowerCase().includes(localTerm)) ||
      (returnRecord.returnTime && returnRecord.returnTime.toLowerCase().includes(localTerm)) ||
      (returnRecord.staffMember && returnRecord.staffMember.toLowerCase().includes(localTerm)) ||
      (returnRecord.notes && returnRecord.notes.toLowerCase().includes(localTerm)) ||
      (returnRecord.returnType && returnRecord.returnType.toLowerCase().includes(localTerm)) ||
      (returnRecord.items && returnRecord.items.some(item => 
        item.productName.toLowerCase().includes(localTerm) ||
        item.productCode.toLowerCase().includes(localTerm) ||
        item.returnReason.toLowerCase().includes(localTerm)
      ))
    );
    
    return matchesGlobal && matchesLocal;
  });

  // Calculate disposal analytics
  const disposalLoss = disposalRecords.reduce(
    (sum, record) => sum + (typeof record.lossAmount === "number" ? record.lossAmount : 0),
    0
  );
  const disposalRecovered = disposalRecords.reduce(
    (sum, record) => sum + (typeof record.disposalValue === "number" ? record.disposalValue : 0),
    0
  );
  const disposalItems = disposalRecords.reduce(
    (sum, record) => sum + (typeof record.quantity === "number" ? record.quantity : 0),
    0
  );
  const disposalOriginalValue = disposalRecords.reduce(
    (sum, record) =>
      sum +
      (typeof record.originalPrice === "number" && typeof record.quantity === "number"
        ? record.originalPrice * record.quantity
        : 0),
    0
  );

  // Calculate customer return analytics
  const customerReturnLoss = customerReturns.reduce(
    (sum, record) => sum + (typeof record.totalAmount === "number" ? record.totalAmount : 0),
    0
  );
  const customerReturnItems = customerReturns.reduce(
    (sum, record) => sum + record.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  // Calculate supplier return analytics
  const supplierReturnLoss = supplierReturns.reduce(
    (sum, record) => sum + (typeof record.totalAmount === "number" ? record.totalAmount : 0),
    0
  );
  const supplierReturnItems = supplierReturns.reduce(
    (sum, record) => sum + record.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  // Combined analytics
  const totalLoss = disposalLoss + customerReturnLoss + supplierReturnLoss;
  const totalRecovered = disposalRecovered; // Only disposal has recovery value
  const totalItems = disposalItems + customerReturnItems + supplierReturnItems;
  const totalOriginalValue = disposalOriginalValue + customerReturnLoss + supplierReturnLoss;

  const conditionStats: Record<
    string,
    { count: number; loss: number }
  > = disposalRecords.reduce((acc, record) => {
    if (!record.condition) return acc;
    if (!acc[record.condition]) {
      acc[record.condition] = { count: 0, loss: 0 };
    }
    acc[record.condition].count += typeof record.quantity === "number" ? record.quantity : 0;
    acc[record.condition].loss += typeof record.lossAmount === "number" ? record.lossAmount : 0;
    return acc;
  }, {} as Record<string, { count: number; loss: number }>);

  const methodStats: Record<
    string,
    { count: number; recovered: number }
  > = disposalRecords.reduce((acc, record) => {
    if (!record.disposalMethod) return acc;
    if (!acc[record.disposalMethod]) {
      acc[record.disposalMethod] = { count: 0, recovered: 0 };
    }
    acc[record.disposalMethod].count += typeof record.quantity === "number" ? record.quantity : 0;
    acc[record.disposalMethod].recovered +=
      typeof record.disposalValue === "number" ? record.disposalValue : 0;
    return acc;
  }, {} as Record<string, { count: number; recovered: number }>);

  const handleAddDisposal = async () => {
    try {
      const originalPrice = Number(newDisposal.originalPrice);
      const disposalValue = Number(newDisposal.disposalValue);
      const quantity = Number(newDisposal.quantity);
      const lossAmount = originalPrice * quantity - disposalValue;

      const disposal: Omit<DisposalRecord, "id"> = {
        itemName: newDisposal.itemName,
        itemCode: newDisposal.itemCode,
        category: newDisposal.category,
        originalPrice,
        disposalValue,
        lossAmount,
        quantity,
        disposalDate: new Date().toISOString().split("T")[0],
        reason: newDisposal.reason,
        condition: toConditionType(newDisposal.condition),
        disposalMethod: toDisposalMethodType(newDisposal.disposalMethod),
        approvedBy: "Current User", // Replace with actual user
        notes: newDisposal.notes,
        batchNumber: newDisposal.batchNumber,
        supplierName: newDisposal.supplierName,
      };

      await DisposalService.createDisposalRecord(disposal);

      // If disposal method is "return-supplier", add the quantity back to product stock
      const disposalMethod = toDisposalMethodType(newDisposal.disposalMethod);
      if (disposalMethod === "return-supplier") {
        const product = products.find(p => p.code === newDisposal.itemCode && p.name === newDisposal.itemName);
        
        if (product) {
          await ProductService.updateProduct(product.id, {
            stock: product.stock + quantity,
          });
          
          // Update local products state
          setProducts(products.map(p => 
            p.id === product.id 
              ? { ...p, stock: p.stock + quantity }
              : p
          ));
        }
      }

      setNewDisposal({
        itemName: "",
        itemCode: "",
        category: "",
        originalPrice: "",
        disposalValue: "",
        quantity: "",
        reason: "",
        condition: "damaged", // Reset to default condition
        disposalMethod: "discard", // Reset to default method
        notes: "",
        batchNumber: "",
        supplierName: "",
      });
      setIsDialogOpen(false);

      toast({
        title: "Disposal Record Added",
        description: "Disposal record has been successfully created",
      });
      
    } catch (err) {
      console.error("Error adding disposal record:", err);
      toast({
        title: "Error",
        description: "Failed to add disposal record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete handler
  const handleDeleteDisposal = async (record: DisposalRecord) => {
    try {
      await DisposalService.deleteDisposalRecord(record.id);
      toast({
        title: "Disposal Record Deleted",
        description: "Disposal record has been deleted.",
        variant: "default",
      });
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (err) {
      console.error("Error deleting disposal record:", err);
      toast({
        title: "Error",
        description: "Failed to delete disposal record. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  // Customer Return Functions
  const handleInvoiceSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setInvoiceSearchResults([]);
      setShowInvoiceResults(false);
      return;
    }

    const results = salesRecords.filter(sale => 
      sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerPhone.includes(searchTerm)
    );

    setInvoiceSearchResults(results);
    setShowInvoiceResults(true);
  };

  const handleSelectInvoice = (sale: SaleRecord) => {
    // Check if this invoice has already been returned
    const existingReturn = customerReturns.find(returnRecord => 
      returnRecord.originalInvoiceNumber === sale.invoiceNumber
    );

    if (existingReturn) {
      toast({
        title: "Invoice Already Returned",
        description: `Invoice ${sale.invoiceNumber} has already been returned (Return #${existingReturn.returnNumber})`,
        variant: "destructive",
      });
      setShowInvoiceResults(false);
      setInvoiceSearchResults([]);
      return;
    }

    setSelectedSale(sale);
    setReturnFormData(prev => ({
      ...prev,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      selectedProducts: sale.items.map(item => ({
        productId: item.id,
        productName: item.name,
        productCode: item.code,
        quantity: item.quantity,
        originalPrice: item.finalPrice,
        returnReason: ""
      }))
    }));
    setShowInvoiceResults(false);
    setInvoiceSearchResults([]);
    toast({
      title: "Sale Selected",
      description: `Selected sale ${sale.invoiceNumber} for ${sale.customerName}`,
    });
  };

  const handleAddProductToReturn = (product: Product) => {
    const existingProduct = returnFormData.selectedProducts.find(p => p.productId === product.id);
    if (existingProduct) {
      toast({
        title: "Product Already Added",
        description: "This product is already in the return list",
        variant: "destructive",
      });
      return;
    }

    setReturnFormData(prev => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: 1,
        originalPrice: product.currentPrice,
        returnReason: ""
      }]
    }));
  };

  const handleRemoveProductFromReturn = (productId: string) => {
    setReturnFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(p => p.productId !== productId)
    }));
  };

  const handleUpdateReturnQuantity = (productId: string, quantity: number) => {
    setReturnFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p =>
        p.productId === productId ? { ...p, quantity: quantity } : p
      )
    }));
  };

  const handleQuantityBlur = (productId: string, quantity: number) => {
    // Ensure minimum quantity of 1 when user finishes editing
    if (quantity < 1 || isNaN(quantity)) {
      handleUpdateReturnQuantity(productId, 1);
    }
  };

  const handleUpdateReturnReason = (productId: string, reason: string) => {
    setReturnFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p =>
        p.productId === productId ? { ...p, returnReason: reason } : p
      )
    }));
  };

  const handleProcessReturn = async () => {
    if (returnFormData.selectedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to return",
        variant: "destructive",
      });
      return;
    }

    if (!returnFormData.customerName || !returnFormData.customerPhone) {
      toast({
        title: "Missing Information",
        description: "Please provide customer name and phone number",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate invoice returns
    if (returnFormData.returnType === "invoice" && returnFormData.invoiceNumber) {
      const existingReturn = customerReturns.find(returnRecord => 
        returnRecord.originalInvoiceNumber === returnFormData.invoiceNumber
      );

      if (existingReturn) {
        toast({
          title: "Invoice Already Returned",
          description: `Invoice ${returnFormData.invoiceNumber} has already been returned (Return #${existingReturn.returnNumber})`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const returnNumber = await ReturnCounterService.getNextCustomerReturnNumber();
      const now = new Date();
      const totalAmount = returnFormData.selectedProducts.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);

      // Create return record without undefined values
      const returnRecord: Omit<CustomerReturnRecord, "id"> = {
        returnNumber,
        customerName: returnFormData.customerName,
        customerPhone: returnFormData.customerPhone,
        returnDate: now.toISOString().split('T')[0],
        returnTime: now.toTimeString().split(' ')[0],
        items: returnFormData.selectedProducts,
        totalAmount,
        returnType: returnFormData.returnType,
        staffMember: "Current User", // You can get this from auth context
        notes: returnFormData.notes,
        createdAt: now.toISOString()
      };

      // Add optional fields only if they have values
      if (selectedSale?.id) {
        returnRecord.originalSaleId = selectedSale.id;
      }
      if (returnFormData.invoiceNumber) {
        returnRecord.originalInvoiceNumber = returnFormData.invoiceNumber;
      }

      // Save customer return to database
      const returnId = await CustomerReturnService.createCustomerReturn(returnRecord);
      if (!returnId) {
        throw new Error("Failed to save customer return to database");
      }
      
      // Refresh customer returns from database to ensure consistency
      const updatedReturns = await CustomerReturnService.getAllCustomerReturns();
      setCustomerReturns(updatedReturns);

      // Restock inventory
      for (const item of returnFormData.selectedProducts) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await ProductService.updateProduct(item.productId, {
            stock: product.stock + item.quantity
          });
        }
      }

      // Update sale record if it's an invoice-based return
      if (returnFormData.returnType === "invoice" && selectedSale) {
        await SalesService.updateSale(selectedSale.id, {
          returnStatus: "full",
          updatedAt: now.toISOString()
        });
      }

      toast({
        title: "Return Processed",
        description: `Customer return ${returnNumber} has been processed successfully`,
      });

      // Reset form
      setReturnFormData({
        returnType: "invoice",
        invoiceNumber: "",
        customerName: "",
        customerPhone: "",
        selectedProducts: [],
        notes: ""
      });
      setSelectedSale(null);
      setIsDialogOpen(false);

    } catch (error) {
      console.error("Error processing return:", error);
      toast({
        title: "Error",
        description: "Failed to process return. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Supplier Return Functions
  const handlePurchaseSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setPurchaseSearchResults([]);
      setShowPurchaseResults(false);
      return;
    }

    const filtered = purchaseRecords.filter(purchase =>
      purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplierPhone.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setPurchaseSearchResults(filtered);
    setShowPurchaseResults(true);
  };

  const handleSelectPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setSupplierReturnFormData(prev => ({
      ...prev,
      invoiceNumber: purchase.invoiceNumber,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      supplierPhone: purchase.supplierPhone,
      supplierAddress: purchase.supplierAddress,
      selectedProducts: purchase.items.map(item => ({
        productId: item.productId,
        productName: item.name,
        productCode: item.code,
        quantity: item.quantity,
        originalPrice: item.unitPrice,
        returnReason: ""
      }))
    }));
    setShowPurchaseResults(false);
    toast({
      title: "Purchase Selected",
      description: `Selected purchase ${purchase.invoiceNumber} from ${purchase.supplierName}`,
    });
  };

  const handleAddProductToSupplierReturn = (product: Product) => {
    const existingProduct = supplierReturnFormData.selectedProducts.find(p => p.productId === product.id);
    if (existingProduct) {
      toast({
        title: "Product Already Added",
        description: "This product is already in the return list",
        variant: "destructive",
      });
      return;
    }

    setSupplierReturnFormData(prev => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: 1,
        originalPrice: product.purchaseCost,
        returnReason: ""
      }]
    }));
  };

  const handleRemoveProductFromSupplierReturn = (productId: string) => {
    setSupplierReturnFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(p => p.productId !== productId)
    }));
  };

  const handleUpdateSupplierReturnQuantity = (productId: string, quantity: number) => {
    setSupplierReturnFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p =>
        p.productId === productId ? { ...p, quantity: quantity } : p
      )
    }));
  };

  const handleSupplierReturnQuantityBlur = (productId: string, quantity: number) => {
    if (quantity < 1 || isNaN(quantity)) {
      handleUpdateSupplierReturnQuantity(productId, 1);
    }
  };

  const handleUpdateSupplierReturnReason = (productId: string, reason: string) => {
    setSupplierReturnFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p =>
        p.productId === productId ? { ...p, returnReason: reason } : p
      )
    }));
  };

  const handleProcessSupplierReturn = async () => {
    if (supplierReturnFormData.selectedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to return",
        variant: "destructive",
      });
      return;
    }

    if (!supplierReturnFormData.supplierName || !supplierReturnFormData.supplierPhone) {
      toast({
        title: "Missing Information",
        description: "Please provide supplier name and contact",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate invoice returns
    if (supplierReturnFormData.returnType === "invoice" && supplierReturnFormData.invoiceNumber) {
      const existingReturn = supplierReturns.find(returnRecord => 
        returnRecord.originalInvoiceNumber === supplierReturnFormData.invoiceNumber
      );

      if (existingReturn) {
        toast({
          title: "Invoice Already Returned",
          description: `Invoice ${supplierReturnFormData.invoiceNumber} has already been returned (Return #${existingReturn.returnNumber})`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const returnNumber = await ReturnCounterService.getNextSupplierReturnNumber();
      const now = new Date();
      const totalAmount = supplierReturnFormData.selectedProducts.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);

      // Create return record without undefined values
      const returnRecord: Omit<SupplierReturnRecord, "id"> = {
        returnNumber,
        supplierId: supplierReturnFormData.supplierId,
        supplierName: supplierReturnFormData.supplierName,
        supplierPhone: supplierReturnFormData.supplierPhone,
        supplierAddress: supplierReturnFormData.supplierAddress,
        returnDate: now.toISOString().split('T')[0],
        returnTime: now.toTimeString().split(' ')[0],
        items: supplierReturnFormData.selectedProducts,
        totalAmount,
        returnType: supplierReturnFormData.returnType,
        staffMember: "Current User", // You can get this from auth context
        notes: supplierReturnFormData.notes,
        createdAt: now.toISOString()
      };

      // Add optional fields only if they have values
      if (selectedPurchase?.id) {
        returnRecord.originalPurchaseId = selectedPurchase.id;
      }
      if (supplierReturnFormData.invoiceNumber) {
        returnRecord.originalInvoiceNumber = supplierReturnFormData.invoiceNumber;
      }

      // Save supplier return to database
      const returnId = await SupplierReturnService.createSupplierReturn(returnRecord);
      if (!returnId) {
        throw new Error("Failed to save supplier return to database");
      }
      
      // Refresh supplier returns from database to ensure consistency
      const updatedReturns = await SupplierReturnService.getAllSupplierReturns();
      setSupplierReturns(updatedReturns);

      // Reduce inventory stock
      for (const item of supplierReturnFormData.selectedProducts) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await ProductService.updateProduct(item.productId, {
            stock: Math.max(0, product.stock - item.quantity)
          });
        }
      }

      toast({
        title: "Supplier Return Processed",
        description: `Supplier return ${returnNumber} has been processed successfully`,
      });

      // Reset form
      setSupplierReturnFormData({
        returnType: "invoice",
        invoiceNumber: "",
        supplierId: "",
        supplierName: "",
        supplierPhone: "",
        supplierAddress: "",
        selectedProducts: [],
        notes: ""
      });
      setSelectedPurchase(null);

    } catch (error) {
      console.error("Error processing supplier return:", error);
      toast({
        title: "Error",
        description: "Failed to process supplier return. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCustomerReturn = async (returnId: string) => {
    try {
      // Get the return record to restore inventory
      const returnRecord = customerReturns.find(r => r.id === returnId);
      if (!returnRecord) {
        throw new Error("Return record not found");
      }

      // Restore inventory stock
      for (const item of returnRecord.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const updatedStock = product.stock + item.quantity;
          await ProductService.updateProduct(item.productId, { stock: updatedStock });
        }
      }

      // Delete the return record
      await CustomerReturnService.deleteCustomerReturn(returnId);

      // Refresh data
      const [updatedReturns, updatedProducts] = await Promise.all([
        CustomerReturnService.getAllCustomerReturns(),
        ProductService.getAllProducts()
      ]);
      setCustomerReturns(updatedReturns);
      setProducts(updatedProducts);

      toast({
        title: "Return Deleted",
        description: `Customer return ${returnRecord.returnNumber} has been deleted and inventory restored`,
      });

      setDeleteCustomerReturnId(null);
    } catch (error) {
      console.error("Error deleting customer return:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer return. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSupplierReturn = async (returnId: string) => {
    try {
      // Get the return record to restore inventory
      const returnRecord = supplierReturns.find(r => r.id === returnId);
      if (!returnRecord) {
        throw new Error("Return record not found");
      }

      // Restore inventory stock
      for (const item of returnRecord.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const updatedStock = product.stock + item.quantity;
          await ProductService.updateProduct(item.productId, { stock: updatedStock });
        }
      }

      // Delete the return record
      await SupplierReturnService.deleteSupplierReturn(returnId);

      // Refresh data
      const [updatedReturns, updatedProducts] = await Promise.all([
        SupplierReturnService.getAllSupplierReturns(),
        ProductService.getAllProducts()
      ]);
      setSupplierReturns(updatedReturns);
      setProducts(updatedProducts);

      toast({
        title: "Return Deleted",
        description: `Supplier return ${returnRecord.returnNumber} has been deleted and inventory restored`,
      });

      setDeleteSupplierReturnId(null);
    } catch (error) {
      console.error("Error deleting supplier return:", error);
      toast({
        title: "Error",
        description: "Failed to delete supplier return. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle PDF generation for customer returns
  const handleGenerateCustomerReturnPDF = async (returnRecord: CustomerReturnRecord) => {
    try {
      const invoiceData = CreditNotesInvoiceService.prepareCustomerReturnData(returnRecord);
      
      // Generate PDF in the component
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Helper function to add text
      const addText = (text: string, x: number, y: number, fontSize: number = 10, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.text(text, x, y);
        return y + (fontSize * 0.4);
      };

      // Helper function to add a line
      const addLine = (y: number) => {
        doc.line(margin, y, pageWidth - margin, y);
        return y + 5;
      };

      // Header (Red themed for credit note)
      doc.setFillColor(231, 76, 60); // Red background
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Company name
      doc.setTextColor(255, 255, 255);
      yPos = addText(invoiceData.companyName, margin, 25, 18, true);
      
      // Invoice title
      yPos = addText('CREDIT NOTE', pageWidth - 60, 25, 14, true);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPos = 50;

      // Credit Note Information
      yPos = addText('Credit Note Information', margin, yPos, 14, true);
      yPos = yPos + 5;
      
      yPos = addText(`Credit Note No: ${invoiceData.returnNumber}`, margin, yPos, 11);
      yPos = addText(`Date: ${new Date(invoiceData.returnDate).toLocaleDateString()} ${invoiceData.returnTime}`, margin, yPos, 11);
      if (invoiceData.originalInvoiceNumber) {
        yPos = addText(`Original Invoice No: ${invoiceData.originalInvoiceNumber}`, margin, yPos, 11);
      }
      
      yPos = addLine(yPos + 10);

      // Customer Information
      yPos = addText('Customer Information', margin, yPos, 14, true);
      yPos = yPos + 5;

      yPos = addText(`Name: ${invoiceData.customerName || 'N/A'}`, margin, yPos, 11);
      yPos = addText(`Phone: ${invoiceData.customerPhone || 'N/A'}`, margin, yPos, 11);
      
      yPos = addLine(yPos + 10);

      // Returned Items
      yPos = addText('Returned Items', margin, yPos, 14, true);
      yPos = yPos + 5;

      // Table headers
      const headers = ['Product', 'Code', 'Qty', 'Unit Price', 'Total', 'Reason'];
      const colWidths = [40, 25, 15, 25, 25, 40];
      let xPosition = margin;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPos);
        xPosition += colWidths[index];
      });
      yPos = yPos + 5;
      
      // Draw header line
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos = yPos + 3;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      invoiceData.items.forEach((item) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        const totalPrice = item.originalPrice * item.quantity;
        const rowData = [
          item.productName.length > 15 ? item.productName.substring(0, 12) + '...' : item.productName,
          item.productCode,
          item.quantity.toString(),
          `Rs ${item.originalPrice.toLocaleString()}`,
          `Rs ${totalPrice.toLocaleString()}`,
          item.returnReason.length > 12 ? item.returnReason.substring(0, 9) + '...' : item.returnReason
        ];

        xPosition = margin;
        rowData.forEach((data, index) => {
          doc.text(data, xPosition, yPos);
          xPosition += colWidths[index];
        });
        yPos = yPos + 4;
      });
      
      yPos = addLine(yPos + 10);

      // Total Amount
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Credit Amount: Rs ${invoiceData.totalAmount.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
      yPos = yPos + 10;

      // Staff Member
      yPos = addText(`Processed by: ${invoiceData.staffMember}`, margin, yPos, 10);
      yPos = yPos + 5;

      // Notes
      if (invoiceData.notes) {
        yPos = yPos + 10;
        yPos = addText('Notes', margin, yPos, 12, true);
        yPos = addText(invoiceData.notes, margin, yPos, 10);
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth - 60, footerY);
      
      doc.save(`Credit_Note_${invoiceData.returnNumber}.pdf`);

      toast({
        title: "Success",
        description: "Customer return PDF generated successfully",
      });
    } catch (error) {
      console.error("Error generating customer return PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate customer return PDF",
        variant: "destructive",
      });
    }
  };

  // Handle PDF generation for supplier returns
  const handleGenerateSupplierReturnPDF = async (returnRecord: SupplierReturnRecord) => {
    try {
      const invoiceData = CreditNotesInvoiceService.prepareSupplierReturnData(returnRecord);
      
      // Generate PDF in the component
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Helper function to add text
      const addText = (text: string, x: number, y: number, fontSize: number = 10, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.text(text, x, y);
        return y + (fontSize * 0.4);
      };

      // Helper function to add a line
      const addLine = (y: number) => {
        doc.line(margin, y, pageWidth - margin, y);
        return y + 5;
      };

      // Header (Red themed for credit note)
      doc.setFillColor(231, 76, 60); // Red background
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Company name
      doc.setTextColor(255, 255, 255);
      yPos = addText(invoiceData.companyName, margin, 25, 18, true);
      
      // Invoice title
      yPos = addText('CREDIT NOTE', pageWidth - 60, 25, 14, true);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPos = 50;

      // Credit Note Information
      yPos = addText('Credit Note Information', margin, yPos, 14, true);
      yPos = yPos + 5;
      
      yPos = addText(`Credit Note No: ${invoiceData.returnNumber}`, margin, yPos, 11);
      yPos = addText(`Date: ${new Date(invoiceData.returnDate).toLocaleDateString()} ${invoiceData.returnTime}`, margin, yPos, 11);
      if (invoiceData.originalInvoiceNumber) {
        yPos = addText(`Original Invoice No: ${invoiceData.originalInvoiceNumber}`, margin, yPos, 11);
      }
      
      yPos = addLine(yPos + 10);

      // Supplier Information
      yPos = addText('Supplier Information', margin, yPos, 14, true);
      yPos = yPos + 5;

      yPos = addText(`Name: ${invoiceData.supplierName || 'N/A'}`, margin, yPos, 11);
      yPos = addText(`Phone: ${invoiceData.supplierPhone || 'N/A'}`, margin, yPos, 11);
      if (invoiceData.supplierAddress) {
        yPos = addText(`Address: ${invoiceData.supplierAddress}`, margin, yPos, 11);
      }
      
      yPos = addLine(yPos + 10);

      // Returned Items
      yPos = addText('Returned Items', margin, yPos, 14, true);
      yPos = yPos + 5;

      // Table headers
      const headers = ['Product', 'Code', 'Qty', 'Unit Price', 'Total', 'Reason'];
      const colWidths = [40, 25, 15, 25, 25, 40];
      let xPosition = margin;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPos);
        xPosition += colWidths[index];
      });
      yPos = yPos + 5;
      
      // Draw header line
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos = yPos + 3;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      invoiceData.items.forEach((item) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        const totalPrice = item.originalPrice * item.quantity;
        const rowData = [
          item.productName.length > 15 ? item.productName.substring(0, 12) + '...' : item.productName,
          item.productCode,
          item.quantity.toString(),
          `Rs ${item.originalPrice.toLocaleString()}`,
          `Rs ${totalPrice.toLocaleString()}`,
          item.returnReason.length > 12 ? item.returnReason.substring(0, 9) + '...' : item.returnReason
        ];

        xPosition = margin;
        rowData.forEach((data, index) => {
          doc.text(data, xPosition, yPos);
          xPosition += colWidths[index];
        });
        yPos = yPos + 4;
      });
      
      yPos = addLine(yPos + 10);

      // Total Amount
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Credit Amount: Rs ${invoiceData.totalAmount.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
      yPos = yPos + 10;

      // Staff Member
      yPos = addText(`Processed by: ${invoiceData.staffMember}`, margin, yPos, 10);
      yPos = yPos + 5;

      // Notes
      if (invoiceData.notes) {
        yPos = yPos + 10;
        yPos = addText('Notes', margin, yPos, 12, true);
        yPos = addText(invoiceData.notes, margin, yPos, 10);
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth - 60, footerY);
      
      doc.save(`Credit_Note_${invoiceData.returnNumber}.pdf`);

      toast({
        title: "Success",
        description: "Supplier return PDF generated successfully",
      });
    } catch (error) {
      console.error("Error generating supplier return PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate supplier return PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading disposal records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Disposal Management</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Disposal
        </Button>
      </div>

      {/* Add Disposal Dialog */}
      <AddDisposalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        newDisposal={newDisposal}
        setNewDisposal={setNewDisposal}
        products={products}
        onProductSelect={handleProductSelect}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        onSubmit={handleAddDisposal}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDisposalDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        recordToDelete={recordToDelete}
        onConfirm={handleDeleteDisposal}
        onCancel={handleDeleteCancel}
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Returned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rs{totalLoss.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Financial impact</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recovered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs{totalRecovered.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Value recovered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items Disposed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Total quantity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalOriginalValue > 0
                ? ((totalRecovered / totalOriginalValue) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Value recovery percentage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debug Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Data Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Disposal Records</h4>
              <p className="text-xs text-muted-foreground">Records: {disposalRecords.length}</p>
              <p className="text-xs text-muted-foreground">Loss: Rs{disposalLoss.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Recovered: Rs{disposalRecovered.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Items: {disposalItems}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Customer Returns</h4>
              <p className="text-xs text-muted-foreground">Records: {customerReturns.length}</p>
              <p className="text-xs text-muted-foreground">Loss: Rs{customerReturnLoss.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Items: {customerReturnItems}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Supplier Returns</h4>
              <p className="text-xs text-muted-foreground">Records: {supplierReturns.length}</p>
              <p className="text-xs text-muted-foreground">Loss: Rs{supplierReturnLoss.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Items: {supplierReturnItems}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by return numbers, customer/supplier names, or invoice numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Navigation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Module Navigation</h3>
            <p className="text-sm text-muted-foreground">Choose a section to manage different aspects of disposal and returns</p>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="customer-returns" className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="customer-returns">🔄 Customer Returns</TabsTrigger>
            <TabsTrigger value="supplier-returns">🏭 Supplier Returns</TabsTrigger>
            <TabsTrigger value="records">📋 Disposal Records</TabsTrigger>
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
          </TabsList>

        <TabsContent value="records">
          {/* Search Results Summary */}
          {searchTerm && (
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>
                    {filteredRecords.length} disposal record{filteredRecords.length !== 1 ? 's' : ''} found matching &quot;{searchTerm}&quot;
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Disposal Records
              </CardTitle>
              <CardDescription>
                {searchTerm ? `Showing ${filteredRecords.length} of ${disposalRecords.length} disposal records matching "${searchTerm}"` : `Showing ${filteredRecords.length} of ${disposalRecords.length} disposal records`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Original Value</TableHead>
                      <TableHead>Recovery Value</TableHead>
                      <TableHead>Loss</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.itemName}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.itemCode}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.category}</Badge>
                        </TableCell>
                        <TableCell>{record.quantity}</TableCell>
                        <TableCell>
                          Rs
                          {typeof record.originalPrice === "number" &&
                          typeof record.quantity === "number"
                            ? (record.originalPrice * record.quantity).toLocaleString()
                            : "0"}
                        </TableCell>
                        <TableCell className="text-green-600">
                          Rs
                          {typeof record.disposalValue === "number"
                            ? record.disposalValue.toLocaleString()
                            : "0"}
                        </TableCell>
                        <TableCell className="text-red-600">
                          Rs
                          {typeof record.lossAmount === "number"
                            ? record.lossAmount.toLocaleString()
                            : "0"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getConditionColor(record.condition)}
                          >
                            {record.condition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getMethodColor(record.disposalMethod)}
                          >
                            {typeof record.disposalMethod === "string"
                              ? record.disposalMethod.replace("-", " ")
                              : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.disposalDate}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete"
                            onClick={() => {
                              setRecordToDelete(record);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer-returns">
          <div className="space-y-6">
            {/* Search Results Summary */}
            {searchTerm && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Search className="h-4 w-4" />
                    <span>
                      {filteredCustomerReturns.length} customer return{filteredCustomerReturns.length !== 1 ? 's' : ''} found matching &quot;{searchTerm}&quot;
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Return Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Process Customer Return
                </CardTitle>
                <CardDescription>Handle customer returns and restock inventory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Return Type Selection */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      variant={returnFormData.returnType === "invoice" ? "default" : "outline"}
                      onClick={() => setReturnFormData(prev => ({ ...prev, returnType: "invoice" }))}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Invoice Return
                    </Button>
                    <Button
                      variant={returnFormData.returnType === "manual" ? "default" : "outline"}
                      onClick={() => setReturnFormData(prev => ({ ...prev, returnType: "manual" }))}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Manual Return
                    </Button>
                  </div>

                  {/* Invoice Search */}
                  {returnFormData.returnType === "invoice" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search Invoice</label>
                      <div className="relative" ref={invoiceSearchRef}>
                        <Input
                          placeholder="Search by invoice number, customer name, or phone"
                          value={returnFormData.invoiceNumber}
                          onChange={(e) => {
                            setReturnFormData(prev => ({ ...prev, invoiceNumber: e.target.value }));
                            handleInvoiceSearch(e.target.value);
                          }}
                          onFocus={() => {
                            if (invoiceSearchResults.length > 0) {
                              setShowInvoiceResults(true);
                            }
                          }}
                        />
                        
                        {/* Search Results Dropdown */}
                        {showInvoiceResults && invoiceSearchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {invoiceSearchResults.map((sale) => {
                              const existingReturn = customerReturns.find(returnRecord => 
                                returnRecord.originalInvoiceNumber === sale.invoiceNumber
                              );
                              const isAlreadyReturned = !!existingReturn;

                              return (
                                <div
                                  key={sale.id}
                                  className={`p-3 border-b border-border last:border-b-0 ${
                                    isAlreadyReturned 
                                      ? 'bg-muted/50 cursor-not-allowed opacity-60' 
                                      : 'hover:bg-muted cursor-pointer'
                                  }`}
                                  onClick={() => !isAlreadyReturned && handleSelectInvoice(sale)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{sale.invoiceNumber}</p>
                                        {isAlreadyReturned && (
                                          <Badge variant="destructive" className="text-xs">
                                            Already Returned
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">{sale.customerName}</p>
                                      <p className="text-xs text-muted-foreground">{sale.customerPhone}</p>
                                      {isAlreadyReturned && (
                                        <p className="text-xs text-destructive">
                                          Return #: {existingReturn?.returnNumber}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium">Rs{sale.total.toLocaleString()}</p>
                                      <p className="text-xs text-muted-foreground">{sale.date}</p>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground">
                                      {sale.items.length} items • {sale.items.reduce((sum, item) => sum + item.quantity, 0)} units
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* No Results */}
                        {showInvoiceResults && invoiceSearchResults.length === 0 && returnFormData.invoiceNumber.trim() && (
                          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg p-3">
                            <p className="text-sm text-muted-foreground text-center">
                              No invoices found matching &quot;{returnFormData.invoiceNumber}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Customer Name</label>
                      <Input
                        placeholder="Customer name"
                        value={returnFormData.customerName}
                        onChange={(e) => setReturnFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Customer Phone</label>
                      <Input
                        placeholder="Customer phone"
                        value={returnFormData.customerPhone}
                        onChange={(e) => setReturnFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Product Selection for Manual Returns */}
                {returnFormData.returnType === "manual" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Add Products</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search products..."
                          value={returnProductSearch}
                          onChange={(e) => setReturnProductSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                        {products
                          .filter(product => 
                            product.name.toLowerCase().includes(returnProductSearch.toLowerCase()) ||
                            product.code.toLowerCase().includes(returnProductSearch.toLowerCase())
                          )
                          .slice(0, 10)
                          .map(product => (
                            <div key={product.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">Code: {product.code} | Price: Rs{product.currentPrice}</p>
                              </div>
                              <Button size="sm" onClick={() => handleAddProductToReturn(product)}>
                                Add
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Products */}
                {returnFormData.selectedProducts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Selected Products</h4>
                    <div className="space-y-2">
                      {returnFormData.selectedProducts.map((item) => (
                        <div key={item.productId} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">Code: {item.productCode}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Qty:</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  handleUpdateReturnQuantity(item.productId, 0);
                                } else {
                                  const numValue = parseInt(value);
                                  if (!isNaN(numValue)) {
                                    handleUpdateReturnQuantity(item.productId, numValue);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value);
                                handleQuantityBlur(item.productId, value);
                              }}
                              className="w-20"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Reason:</label>
                            <Input
                              placeholder="Return reason"
                              value={item.returnReason}
                              onChange={(e) => handleUpdateReturnReason(item.productId, e.target.value)}
                              className="w-40"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveProductFromReturn(item.productId)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input
                    placeholder="Additional notes"
                    value={returnFormData.notes}
                    onChange={(e) => setReturnFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                {/* Process Return Button */}
                <Button onClick={handleProcessReturn} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Process Return
                </Button>
              </CardContent>
            </Card>

            {/* Customer Return Records */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Customer Return Records
                </CardTitle>
                <CardDescription>History of all customer returns</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Customer Return Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search customer returns by any field..."
                      value={customerReturnSearchTerm}
                      onChange={(e) => setCustomerReturnSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {customerReturnSearchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {filteredCustomerReturns.length} result{filteredCustomerReturns.length !== 1 ? 's' : ''} found
                    </p>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Return Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Original Invoice</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomerReturns.length === 0 ? (
                        <TableRow key="no-returns">
                          <TableCell colSpan={8} className="text-center py-8">
                            <p className="text-muted-foreground">
                              {searchTerm ? `No customer returns found matching &quot;${searchTerm}&quot;` : "No customer returns recorded yet"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomerReturns.map((returnRecord) => (
                          <TableRow key={returnRecord.id}>
                            <TableCell>
                              <p className="font-medium">{returnRecord.returnNumber}</p>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{returnRecord.customerName}</p>
                                <p className="text-sm text-muted-foreground">{returnRecord.customerPhone}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {returnRecord.originalInvoiceNumber ? (
                                <Badge variant="outline">{returnRecord.originalInvoiceNumber}</Badge>
                              ) : (
                                <span className="text-muted-foreground">Manual</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{returnRecord.items.length} items</p>
                                <p className="text-xs text-muted-foreground">
                                  {returnRecord.items.reduce((sum, item) => sum + item.quantity, 0)} units
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">Rs{returnRecord.totalAmount.toLocaleString()}</p>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{returnRecord.returnDate}</p>
                                <p className="text-xs text-muted-foreground">{returnRecord.returnTime}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={returnRecord.returnType === "invoice" ? "default" : "secondary"}>
                                {returnRecord.returnType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGenerateCustomerReturnPDF(returnRecord)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeleteCustomerReturnId(returnRecord.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="supplier-returns">
          <div className="space-y-6">
            {/* Search Results Summary */}
            {searchTerm && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Search className="h-4 w-4" />
                    <span>
                      {filteredSupplierReturns.length} supplier return{filteredSupplierReturns.length !== 1 ? 's' : ''} found matching &quot;{searchTerm}&quot;
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Supplier Return Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Process Supplier Return
                </CardTitle>
                <CardDescription>Handle supplier returns and reduce inventory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Return Type Selection */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      variant={supplierReturnFormData.returnType === "invoice" ? "default" : "outline"}
                      onClick={() => setSupplierReturnFormData(prev => ({ ...prev, returnType: "invoice" }))}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Invoice Return
                    </Button>
                    <Button
                      variant={supplierReturnFormData.returnType === "manual" ? "default" : "outline"}
                      onClick={() => setSupplierReturnFormData(prev => ({ ...prev, returnType: "manual" }))}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Manual Return
                    </Button>
                  </div>

                  {/* Purchase Search */}
                  {supplierReturnFormData.returnType === "invoice" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search Purchase Invoice</label>
                      <div className="relative" ref={purchaseSearchRef}>
                        <Input
                          placeholder="Search by invoice number, supplier name, or contact"
                          value={supplierReturnFormData.invoiceNumber}
                          onChange={(e) => {
                            setSupplierReturnFormData(prev => ({ ...prev, invoiceNumber: e.target.value }));
                            handlePurchaseSearch(e.target.value);
                          }}
                          onFocus={() => {
                            if (purchaseSearchResults.length > 0) {
                              setShowPurchaseResults(true);
                            }
                          }}
                        />
                        
                        {/* Search Results Dropdown */}
                        {showPurchaseResults && purchaseSearchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {purchaseSearchResults.map((purchase) => {
                              const existingReturn = supplierReturns.find(returnRecord => 
                                returnRecord.originalInvoiceNumber === purchase.invoiceNumber
                              );
                              const isAlreadyReturned = !!existingReturn;

                              return (
                                <div
                                  key={purchase.id}
                                  className={`p-3 border-b border-border last:border-b-0 ${
                                    isAlreadyReturned 
                                      ? 'bg-muted/50 cursor-not-allowed opacity-60' 
                                      : 'hover:bg-muted cursor-pointer'
                                  }`}
                                  onClick={() => !isAlreadyReturned && handleSelectPurchase(purchase)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{purchase.invoiceNumber}</p>
                                        {isAlreadyReturned && (
                                          <Badge variant="destructive" className="text-xs">
                                            Already Returned
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">{purchase.supplierName}</p>
                                      <p className="text-xs text-muted-foreground">{purchase.supplierPhone}</p>
                                      {isAlreadyReturned && (
                                        <p className="text-xs text-destructive">
                                          Return #: {existingReturn?.returnNumber}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium">Rs{purchase.totalAmount.toLocaleString()}</p>
                                      <p className="text-xs text-muted-foreground">{purchase.createdAt.split('T')[0]}</p>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground">
                                      {purchase.items.length} items • {purchase.items.reduce((sum, item) => sum + item.quantity, 0)} units
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* No Results */}
                        {showPurchaseResults && purchaseSearchResults.length === 0 && supplierReturnFormData.invoiceNumber.trim() && (
                          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg p-3">
                            <p className="text-sm text-muted-foreground text-center">
                              No purchases found matching &quot;{supplierReturnFormData.invoiceNumber}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Supplier Information */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Supplier Name</label>
                      <Input
                        placeholder="Supplier name"
                        value={supplierReturnFormData.supplierName}
                        onChange={(e) => setSupplierReturnFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Supplier Contact</label>
                      <Input
                        placeholder="Supplier contact"
                        value={supplierReturnFormData.supplierPhone}
                        onChange={(e) => setSupplierReturnFormData(prev => ({ ...prev, supplierPhone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Supplier Address</label>
                    <Input
                      placeholder="Supplier address"
                      value={supplierReturnFormData.supplierAddress}
                      onChange={(e) => setSupplierReturnFormData(prev => ({ ...prev, supplierAddress: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Product Selection for Manual Returns */}
                {supplierReturnFormData.returnType === "manual" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Add Products</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search products..."
                          value={supplierReturnProductSearch}
                          onChange={(e) => setSupplierReturnProductSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                        {products
                          .filter(product => 
                            product.name.toLowerCase().includes(supplierReturnProductSearch.toLowerCase()) ||
                            product.code.toLowerCase().includes(supplierReturnProductSearch.toLowerCase())
                          )
                          .slice(0, 10)
                          .map(product => (
                            <div key={product.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">Code: {product.code} | Price: Rs{product.purchaseCost}</p>
                              </div>
                              <Button size="sm" onClick={() => handleAddProductToSupplierReturn(product)}>
                                Add
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Products */}
                {supplierReturnFormData.selectedProducts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Selected Products</h4>
                    <div className="space-y-2">
                      {supplierReturnFormData.selectedProducts.map((item) => (
                        <div key={item.productId} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">Code: {item.productCode}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Qty:</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  handleUpdateSupplierReturnQuantity(item.productId, 0);
                                } else {
                                  const numValue = parseInt(value);
                                  if (!isNaN(numValue)) {
                                    handleUpdateSupplierReturnQuantity(item.productId, numValue);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value);
                                handleSupplierReturnQuantityBlur(item.productId, value);
                              }}
                              className="w-20"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveProductFromSupplierReturn(item.productId)}
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="flex-1">
                            <label className="text-sm">Return Reason:</label>
                            <Input
                              placeholder="Reason for return"
                              value={item.returnReason}
                              onChange={(e) => handleUpdateSupplierReturnReason(item.productId, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input
                    placeholder="Additional notes about the return"
                    value={supplierReturnFormData.notes}
                    onChange={(e) => setSupplierReturnFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                {/* Process Button */}
                <Button
                  onClick={handleProcessSupplierReturn}
                  disabled={supplierReturnFormData.selectedProducts.length === 0}
                  className="w-full"
                >
                  Process Supplier Return
                </Button>
              </CardContent>
            </Card>

            {/* Supplier Returns History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Supplier Returns History
                </CardTitle>
                <CardDescription>View all processed supplier returns</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Supplier Return Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search supplier returns by any field..."
                      value={supplierReturnSearchTerm}
                      onChange={(e) => setSupplierReturnSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {supplierReturnSearchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {filteredSupplierReturns.length} result{filteredSupplierReturns.length !== 1 ? 's' : ''} found
                    </p>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Return Number</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Original Invoice</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSupplierReturns.length === 0 ? (
                        <TableRow key="no-supplier-returns">
                          <TableCell colSpan={8} className="text-center py-8">
                            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">
                              {searchTerm ? `No supplier returns found matching &quot;${searchTerm}&quot;` : "No supplier returns found"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSupplierReturns.map((returnRecord) => (
                          <TableRow key={returnRecord.id}>
                            <TableCell className="font-medium">{returnRecord.returnNumber}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{returnRecord.supplierName}</p>
                                <p className="text-sm text-muted-foreground">{returnRecord.supplierPhone}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                {returnRecord.originalInvoiceNumber ? (
                                  <div>
                                    <p className="font-medium text-sm">{returnRecord.originalInvoiceNumber}</p>
                                    <p className="text-xs text-muted-foreground">Purchase Invoice</p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Manual Return</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{returnRecord.items.length} items</p>
                                <p className="text-xs text-muted-foreground">
                                  {returnRecord.items.reduce((sum, item) => sum + item.quantity, 0)} units
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>Rs{returnRecord.totalAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{returnRecord.returnDate}</p>
                                <p className="text-xs text-muted-foreground">{returnRecord.returnTime}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={returnRecord.returnType === "manual" ? "outline" : "default"}>
                                {returnRecord.returnType === "manual" ? "Manual" : "Invoice"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGenerateSupplierReturnPDF(returnRecord)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeleteSupplierReturnId(returnRecord.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Disposal by Condition
                </CardTitle>
                <CardDescription>
                  Breakdown of items by condition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(conditionStats).map(([condition, stats]) => (
                    <div
                      key={condition}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={getConditionColor(condition)}>
                          {condition}
                        </Badge>
                        <div>
                          <p className="font-medium">{stats.count} items</p>
                          <p className="text-sm text-muted-foreground">
                            Loss: Rs{stats.loss.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {totalItems > 0
                            ? ((stats.count / totalItems) * 100).toFixed(1)
                            : "0.0"}
                          %
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Recovery by Method
                </CardTitle>
                <CardDescription>
                  Value recovered by disposal method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(methodStats).map(([method, stats]) => (
                    <div
                      key={method}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={getMethodColor(method)}>
                          {method.replace("-", " ")}
                        </Badge>
                        <div>
                          <p className="font-medium">{stats.count} items</p>
                          <p className="text-sm text-muted-foreground">
                            Recovered: Rs{stats.recovered.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {totalRecovered > 0
                            ? ((stats.recovered / totalRecovered) * 100).toFixed(1)
                            : "0.0"}
                          %
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialogs */}
      {deleteCustomerReturnId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Customer Return</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this customer return? This action will restore the inventory and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteCustomerReturnId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteCustomerReturn(deleteCustomerReturnId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteSupplierReturnId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Supplier Return</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this supplier return? This action will restore the inventory and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteSupplierReturnId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteSupplierReturn(deleteSupplierReturnId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}