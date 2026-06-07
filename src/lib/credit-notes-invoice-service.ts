import { type CustomerReturnRecord, type SupplierReturnRecord } from './firebase-services'

export interface CreditNoteInvoiceData {
  returnNumber: string
  returnType: 'customer' | 'supplier'
  customerName?: string
  customerPhone?: string
  supplierName?: string
  supplierPhone?: string
  supplierAddress?: string
  returnDate: string
  returnTime: string
  items: Array<{
    productId: string
    productName: string
    productCode: string
    quantity: number
    originalPrice: number
    returnReason: string
  }>
  totalAmount: number
  staffMember: string
  notes: string
  originalInvoiceNumber?: string
  generatedDate: string
  companyName: string
  companyAddress: string
  companyPhone: string
}

export class CreditNotesInvoiceService {
  static prepareCustomerReturnData(returnRecord: CustomerReturnRecord): CreditNoteInvoiceData {
    return {
      returnNumber: returnRecord.returnNumber,
      returnType: 'customer',
      customerName: returnRecord.customerName,
      customerPhone: returnRecord.customerPhone,
      returnDate: returnRecord.returnDate,
      returnTime: returnRecord.returnTime,
      items: returnRecord.items,
      totalAmount: returnRecord.totalAmount,
      originalInvoiceNumber: returnRecord.originalInvoiceNumber,
      staffMember: returnRecord.staffMember,
      notes: returnRecord.notes,
      generatedDate: new Date().toISOString(),
      companyName: 'BinSultan Fabric Management',
      companyAddress: 'Your Company Address',
      companyPhone: 'Your Company Phone'
    }
  }

  static prepareSupplierReturnData(returnRecord: SupplierReturnRecord): CreditNoteInvoiceData {
    return {
      returnNumber: returnRecord.returnNumber,
      returnType: 'supplier',
      supplierName: returnRecord.supplierName,
      supplierPhone: returnRecord.supplierPhone,
      supplierAddress: returnRecord.supplierAddress,
      returnDate: returnRecord.returnDate,
      returnTime: returnRecord.returnTime,
      items: returnRecord.items,
      totalAmount: returnRecord.totalAmount,
      originalInvoiceNumber: returnRecord.originalInvoiceNumber,
      staffMember: returnRecord.staffMember,
      notes: returnRecord.notes,
      generatedDate: new Date().toISOString(),
      companyName: 'BinSultan Fabric Management',
      companyAddress: 'Your Company Address',
      companyPhone: 'Your Company Phone'
    }
  }
}