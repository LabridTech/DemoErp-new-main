import { ref, push, set, get, update as fbUpdate, update, remove, onValue, off, runTransaction } from "firebase/database"
import { db } from "@/lib/firebase";
import { SalesCounterService } from "./sales-counter-service";
// import { 
//   collection, 
//   doc, 
//   getDoc, 
//   getDocs, 
//   query, 
//   where, 
//   setDoc, 
//   updateDoc, 
//   deleteDoc, 
//   Timestamp, 
//   writeBatch,
//   getFirestore
// } from "firebase/firestore";

// Helper function to check if Firebase is initialized
const isFirebaseInitialized = () => {
  return typeof window !== 'undefined' && db !== null;
};

// Type definitions
export interface Product {
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
  createdAt?: string
  updatedAt?: string
}

export interface ProductPriceHistoryEntry {
  date: string
  purchaseCost: number
  minSalePrice: number
  maxSalePrice: number
  currentPrice: number
}

export interface Supplier {
  taxNumber?: string;
  id: string
  name: string
  phone: string
  address: string
  balance: number
  createdAt: string
  updatedAt?: string
  // Additional fields from database
  contactPerson?: string
  email?: string
  creditLimit?: number
  currentBalance?: number
  notes?: string
  paymentTerms?: string
  rating?: number
  supplierType?: string
}

// Supplier Credit System Types
export interface SupplierCredit {
  id: string
  supplierId: string
  supplierName: string
  amount: number
  type: "credit" | "debit"
  reason: string
  description?: string
  purchaseId?: string
  invoiceNumber?: string
  createdAt: string
  createdBy: string
  status: "active" | "used" | "expired" | "cancelled"
  expiryDate?: string
  usedAmount?: number
  remainingAmount?: number
}

export interface SupplierCreditTransaction {
  id: string
  creditId: string
  supplierId: string
  amount: number
  type: "used" | "refunded" | "expired"
  purchaseId?: string
  invoiceNumber?: string
  description: string
  createdAt: string
  createdBy: string
}

// Customer Credit System Types
export interface CustomerCredit {
  id: string
  customerId: string
  customerName: string
  customerPhone?: string
  amount: number
  type: "credit" | "debit"
  reason: string
  description?: string
  saleId?: string
  invoiceNumber?: string
  createdAt: string
  createdBy: string
  status: "active" | "used" | "expired" | "cancelled"
  expiryDate?: string
  usedAmount?: number
  remainingAmount?: number
}

export interface CustomerCreditTransaction {
  id: string
  creditId: string
  customerId: string
  amount: number
  type: "used" | "refunded" | "expired"
  saleId?: string
  invoiceNumber?: string
  description: string
  createdAt: string
  createdBy: string
}

export interface PurchaseItem {
  id?: string
  productId: string
  name: string
  code: string
  quantity: number
  unitPrice: number
  subtotal: number
  discount?: number
  finalPrice?: number
  fabricType?: string
  size?: string
  individualPrices?: number[]
  tradeDiscountFreeItems?: number
}

export interface Purchase {
  id: string
  invoiceNumber: string
  supplierId: string
  supplierName: string
  supplierPhone: string
  supplierAddress: string
  items: PurchaseItem[]
  subtotal: number
  discount: number
  totalAmount: number
  totalDiscount?: number
  total?: number
  date?: string
  time?: string
  staffName?: string
  staffMember?: string
  paymentMethod?: string
  paymentStatus?: "paid" | "pending"
  partialPaymentAmount?: string
  remainingAmount?: number
  paymentHistory?: Array<{
    id: string
    amount: number
    method: string
    date: string
    remainingAfter: number
    notes: string
  }>
  createdAt: string
  createdBy: string
  notes?: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  joinDate: string
  salary: number
  commission: number
  status: "active" | "inactive" | "on-leave"
  avatar?: string
  address: string
  emergencyContact: string
  bankAccount: string
  cnic: string
  role?: "admin" | "cashier"
  createdAt?: string
  updatedAt?: string
}

export interface EmployeePerformance {
  id: string
  employeeId: string
  employeeName: string
  monthlySales: number
  monthlyTarget: number
  attendanceRate: number
  performanceScore: number
  totalSales: number
  totalCommission: number
  month: string // Format: YYYY-MM
  year: number
  createdAt?: string
  updatedAt?: string
}

export interface SaleRecord {
  id: string
  invoiceNumber: string
  date: string
  time: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  customerType: "walk-in" | "regular" | "vip"
  items: SaleItem[]
  tradeDiscountItems?: Array<{
    productId: string
    productName: string
    quantity: number
    price: number
    purchaseCost?: number
  }>
  subtotal: number
  discount: number
  tax: number
  total: number
  totalDiscount?: number
  paymentMethod: "cash" | "card" | "mobile" | "credit"
  paymentStatus: "paid" | "partial" | "pending"
  deliveryStatus: "pickup" | "delivered" | "pending" | "cancelled"
  deliveryType: "pickup" | "delivery"
  deliveryAddress?: string
  deliveryDate?: string
  staffMember: string
  staffName?: string
  notes: string
  returnStatus: "none" | "partial" | "full"
  createdAt?: string
  updatedAt?: string
}

export interface CustomerReturnRecord {
  id: string
  returnNumber: string
  originalSaleId?: string
  originalInvoiceNumber?: string
  customerName: string
  customerPhone: string
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
  returnType: "manual" | "invoice"
  staffMember: string
  notes: string
  createdAt: string
}

export interface SupplierReturnRecord {
  id: string
  returnNumber: string
  originalPurchaseId?: string
  originalInvoiceNumber?: string
  supplierId: string
  supplierName: string
  supplierPhone: string
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
  returnType: "manual" | "invoice"
  staffMember: string
  notes: string
  createdAt: string
}

export interface SaleItem {
  id: string
  productId?: string
  name: string
  code: string
  quantity: number
  originalPrice: number
  finalPrice: number
  discount: number
  subtotal?: number
  fabricType?: string
  size?: string
  individualPrices?: number[]
  tradeDiscountFreeItems?: number
  unitPrice?: number
  purchaseCost?: number
}

export interface StockMovement {
  id: string
  itemId: string
  itemName: string
  type: "in" | "out" | "adjustment" | "damaged" | "returned"
  quantity: number
  reason: string
  staff: string
  date: string
  reference: string
  createdAt?: string
  updatedAt?: string
}

export interface CreditEntry {
  id: string
  customerName: string
  customerPhone: string
  amount: number
  dueDate: string
  saleDate: string
  invoiceNumber: string
  status: "pending" | "partial" | "paid" | "overdue"
  paidAmount: number
  remainingAmount: number
  paymentHistory: PaymentRecord[]
  notes: string
  createdAt?: string
  updatedAt?: string
}

export interface DebitEntry {
  id: string
  supplierName: string
  supplierPhone: string
  amount: number
  dueDate: string
  purchaseDate: string
  invoiceNumber: string
  status: "pending" | "partial" | "paid" | "overdue"
  paidAmount: number
  remainingAmount: number
  paymentHistory: PaymentRecord[]
  description: string
  category: string
  createdAt?: string
  updatedAt?: string
}

export interface PaymentRecord {
  id: string
  amount: number
  date: string
  method: string
  reference: string
  notes: string
}

export interface BargainRecord {
  id: string
  date: string
  time: string
  productName: string
  productCode: string
  originalPrice: number
  finalPrice: number
  discountAmount: number
  discountPercentage: number
  customerName?: string
  customerPhone?: string
  staffMember: string
  reason: string
  invoiceNumber: string
  category: string
  profitMargin: number
  status: "approved" | "rejected" | "pending"
  createdAt?: string
  updatedAt?: string
}

export interface DisposalRecord {
  id: string
  itemName: string
  itemCode: string
  category: string
  originalPrice: number
  disposalValue: number
  lossAmount: number
  quantity: number
  disposalDate: string
  reason: string
  condition: "damaged" | "expired" | "defective" | "unsold" | "stolen"
  disposalMethod: "discard" | "donate" | "sell-discount" | "return-supplier" | "recycle"
  approvedBy: string
  notes: string
  photos?: string[]
  batchNumber?: string
  supplierName?: string
  createdAt?: string
  updatedAt?: string
}

export interface DailyExpense {
  id: string
  date: string
  description: string
  amount: number
  createdAt?: string
  updatedAt?: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  checkIn: string
  checkOut: string
  hoursWorked: number
  status: "present" | "absent" | "late" | "half-day"
  notes: string
  createdAt?: string
  updatedAt?: string
}

export interface SalaryRecord {
  id: string
  employeeId: string
  employeeName: string
  month: string
  basicSalary: number
  commission: number
  bonus: number
  deductions: number
  totalSalary: number
  status: "paid" | "pending" | "processing"
  paidDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface PayrollInstallment {
  amount: number
  date: string
  notes?: string
}

export interface PayrollBonus {
  amount: number
  date: string
  reason: string
  notes?: string
}

export interface CreditSalePayment {
  amount: number
  date: string
  method: string
  notes?: string
}

export interface CreditSalePaymentRecord {
  id: string
  saleId: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  totalAmount: number
  payments: CreditSalePayment[]
  remainingAmount: number
  status: "pending" | "partial" | "paid" | "overdue"
  saleDate: string
  dueDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface EmployeePayroll {
  id: string
  employeeId: string
  employeeName: string
  month: string // Format: YYYY-MM
  year: number
  totalSalary: number
  installments: PayrollInstallment[]
  bonuses: PayrollBonus[]
  remainingSalary: number
  status: "pending" | "partial" | "paid" | "overdue"
  createdAt?: string
  updatedAt?: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  customerType: "walk-in" | "regular" | "vip"
  totalPurchases: number
  totalSpent: number
  lastPurchaseDate?: string
  creditLimit: number
  currentCredit: number
  rating?: number
  paymentTerms?: string
  taxNumber?: string
  notes: string
  status: "active" | "inactive"
  createdAt?: string
  updatedAt?: string
}

// Generic Firebase CRUD operations
export class FirebaseService {
  // Create
  static async create(path: string, data: Record<string, unknown>): Promise<string | null> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping create operation');
      return null;
    }
    try {
      const newRef = push(ref(db!, path))
      await set(newRef, { ...data, id: newRef.key, createdAt: new Date().toISOString() })
      return newRef.key
    } catch (error) {
      console.error(`Error creating ${path}:`, error)
      throw error
    }
  }

  // Create with custom ID
  static async createWithCustomId(path: string, id: string, data: Record<string, unknown>): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping create operation');
      return;
    }
    try {
      await set(ref(db!, `${path}/${id}`), { ...data, id, createdAt: new Date().toISOString() });
    } catch (error) {
      console.error(`Error creating ${path}/${id}:`, error);
      throw error;
    }
  }

  // Read all with proper typing
  static async getAll<T>(path: string): Promise<T[]> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning empty array');
      return [];
    }
    try {
      const snapshot = await get(ref(db!, path))
      if (snapshot.exists()) {
        const data = snapshot.val()
        return Object.values(data) as T[]
      }
      return []
    } catch (error) {
      console.error(`Error getting ${path}:`, error)
      throw error
    }
  }

  // Read by ID
  static async getById<T>(path: string, id: string): Promise<T | null> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning null');
      return null;
    }
    try {
      const snapshot = await get(ref(db!, `${path}/${id}`))
      return snapshot.exists() ? (snapshot.val() as T) : null
    } catch (error) {
      console.error(`Error getting ${path}/${id}:`, error)
      throw error
    }
  }

  // Update
  static async update(path: string, id: string, data: Record<string, unknown>): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping update operation');
      return;
    }
    try {
      console.log(`Firebase: Updating ${path}/${id} with data:`, data)
      await fbUpdate(ref(db!, `${path}/${id}`), { ...data, updatedAt: new Date().toISOString() })
      console.log(`Firebase: Successfully updated ${path}/${id}`)
    } catch (error) {
      console.error(`Error updating ${path}/${id}:`, error)
      throw error
    }
  }

  // Delete
  static async delete(path: string, id: string): Promise<void> {
    console.log(`Attempting to delete: ${path}/${id}`)
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping delete operation');
      return;
    }
    try {
      await remove(ref(db!, `${path}/${id}`))
      console.log(`Successfully deleted: ${path}/${id}`)
    } catch (error) {
      console.error(`Error deleting ${path}/${id}:`, error)
      throw error
    }
  }

  // Real-time listener with proper typing
  static subscribe<T>(path: string, callback: (data: T[]) => void): () => void {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning no-op unsubscribe function');
      return () => { };
    }
    const dbRef = ref(db!, path)
    onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        callback(Object.values(data) as T[])
      } else {
        callback([])
      }
    })
    return () => off(dbRef)
  }
}

// Product Services
export class ProductService extends FirebaseService {
  static async createProduct(product: Omit<Product, "id">): Promise<string> {
    // Use Firebase push() to generate a unique ID atomically
    const newRef = push(ref(db!, "products"));
    const newId = newRef.key!;
    await set(newRef, { ...product, id: newId, createdAt: new Date().toISOString() });
    return newId;
  }

  static async getAllProducts(): Promise<Product[]> {
    return this.getAll<Product>("products")
  }

  static async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    return this.update("products", id, product)
  }

  static async deleteProduct(id: string): Promise<void> {
    return this.delete("products", id)
  }

  static subscribeToProducts(callback: (products: Product[]) => void): () => void {
    return this.subscribe<Product>("products", callback)
  }

  static async getProductPriceHistory(id: string): Promise<ProductPriceHistoryEntry[]> {
    return this.getAll<ProductPriceHistoryEntry>(`products/${id}/history`)
  }

  static async addPriceHistory(id: string, entry: ProductPriceHistoryEntry): Promise<string | null> {
    return this.create(`products/${id}/history`, entry as unknown as Record<string, unknown>)
  }

  // Stock Movements for products
  static async getAllStockMovements() {
    return this.getAll<StockMovement>("stockMovements");
  }
  static async addStockMovement(movement: Omit<StockMovement, "id">) {
    return this.create("stockMovements", movement);
  }
}

// Employee Services
export class EmployeeService extends FirebaseService {
  static async createEmployee(employee: Omit<Employee, "id">): Promise<string> {
    // CRITICAL SAFEGUARD: Prevent performance data from being stored in employee table
    this.validateNoPerformanceData(employee);

    console.log('Creating employee in employees table:', employee);
    // Use Firebase push() to generate a unique ID atomically
    const newRef = push(ref(db!, "employees"));
    const newId = newRef.key!;
    await set(newRef, { ...employee, id: newId, createdAt: new Date().toISOString() });
    console.log(`Successfully created employee ${newId} in employees table`);
    return newId;
  }

  static async getAllEmployees(): Promise<Employee[]> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning empty array');
      return [];
    }
    try {
      const snapshot = await get(ref(db!, "employees"))
      if (snapshot.exists()) {
        const data = snapshot.val()
        const employees: Employee[] = []

        // Handle both Firebase-generated keys and custom keys
        for (const [key, employee] of Object.entries(data)) {
          const emp = employee as Record<string, unknown>
          if (emp && typeof emp === 'object') {
            // Ensure the employee has the correct ID (use the key as ID if not set or mismatched)
            const employeeWithCorrectId = {
              ...emp,
              id: emp.id && emp.id === key ? emp.id : key
            }
            employees.push(employeeWithCorrectId as Employee)
          }
        }
        return employees
      }
      return []
    } catch (error) {
      console.error(`Error getting employees:`, error)
      throw error
    }
  }

  static async updateEmployee(id: string, employee: Partial<Employee>): Promise<void> {
    // CRITICAL SAFEGUARD: Prevent performance data from being stored in employee table
    this.validateNoPerformanceData(employee);

    console.log(`Updating employee ${id} in employees table with:`, employee);
    return this.update("employees", id, employee)
  }

  // Validation method to ensure no performance data goes to employee table
  private static validateNoPerformanceData(data: Record<string, unknown>): void {
    const performanceFields = ['monthlySales', 'monthlyTarget', 'attendanceRate', 'performanceScore', 'totalSales', 'totalCommission'];
    const hasPerformanceFields = performanceFields.some(field => data.hasOwnProperty(field));

    if (hasPerformanceFields) {
      console.error('CRITICAL ERROR: Attempting to store performance data in employee table!', data);
      throw new Error('Performance data must ONLY be stored in employeePerformance table, not employee table. Use EmployeePerformanceService instead.');
    }
  }

  static async deleteEmployee(id: string): Promise<void> {
    return this.delete("employees", id)
  }

  static async createAttendanceRecord(record: Omit<AttendanceRecord, "id">): Promise<string | null> {
    return this.create("attendance", record)
  }

  static async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return this.getAll<AttendanceRecord>("attendance")
  }

  static async createSalaryRecord(record: Omit<SalaryRecord, "id">): Promise<string | null> {
    return this.create("salaryRecords", record)
  }

  static async updateSalaryRecord(id: string, record: Partial<SalaryRecord>): Promise<void> {
    return this.update("salaryRecords", id, record)
  }

  static async getAllSalaryRecords(): Promise<SalaryRecord[]> {
    return this.getAll<SalaryRecord>("salaryRecords")
  }

  static subscribeToEmployees(callback: (employees: Employee[]) => void): () => void {
    return this.subscribe<Employee>("employees", callback)
  }
}

// Employee Performance Services
export class EmployeePerformanceService extends FirebaseService {
  // Private constant to ensure we ONLY use the employeePerformance table
  private static readonly PERFORMANCE_TABLE = "employeePerformance";

  static async createPerformanceRecord(performance: Omit<EmployeePerformance, "id">): Promise<string> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping performance record creation');
      return '';
    }

    try {
      console.log('Creating performance record in employeePerformance table:', performance);
      // Use Firebase push() to generate a unique ID atomically
      const newRef = push(ref(db!, this.PERFORMANCE_TABLE));
      const newId = newRef.key!;
      const recordWithMetadata = {
        ...performance,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(newRef, recordWithMetadata);
      console.log(`Successfully created performance record ${newId} in ${this.PERFORMANCE_TABLE} table`);
      return newId;
    } catch (error) {
      console.error('Error creating performance record:', error);
      throw error;
    }
  }

  static async getAllPerformanceRecords(): Promise<EmployeePerformance[]> {
    try {
      console.log(`Fetching all records from ${this.PERFORMANCE_TABLE} table`);
      return this.getAll<EmployeePerformance>(this.PERFORMANCE_TABLE);
    } catch (error) {
      console.error('Error getting performance records:', error);
      return [];
    }
  }

  static async getPerformanceByEmployee(employeeId: string): Promise<EmployeePerformance[]> {
    try {
      console.log(`Fetching performance records for employee ${employeeId} from ${this.PERFORMANCE_TABLE} table`);
      const allRecords = await this.getAllPerformanceRecords();
      return allRecords.filter(record => record.employeeId === employeeId);
    } catch (error) {
      console.error(`Error getting performance records for employee ${employeeId}:`, error);
      return [];
    }
  }

  static async getCurrentMonthPerformance(employeeId: string): Promise<EmployeePerformance | null> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format
      const currentYear = currentDate.getFullYear();

      console.log(`Fetching current month (${currentMonth}) performance for employee ${employeeId} from ${this.PERFORMANCE_TABLE} table`);
      const allRecords = await this.getAllPerformanceRecords();
      const record = allRecords.find(record =>
        record.employeeId === employeeId &&
        record.month === currentMonth &&
        record.year === currentYear
      ) || null;

      console.log(`Found current month performance record:`, record ? 'Yes' : 'No');
      return record;
    } catch (error) {
      console.error(`Error getting current month performance for employee ${employeeId}:`, error);
      return null;
    }
  }

  static async updatePerformanceRecord(id: string, performance: Partial<EmployeePerformance>): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping performance record update');
      return;
    }

    try {
      console.log(`Updating performance record ${id} in ${this.PERFORMANCE_TABLE} table with:`, performance);
      const updateData = {
        ...performance,
        updatedAt: new Date().toISOString()
      };

      await this.update(this.PERFORMANCE_TABLE, id, updateData);
      console.log(`Successfully updated performance record ${id} in ${this.PERFORMANCE_TABLE} table`);
    } catch (error) {
      console.error(`Error updating performance record ${id}:`, error);
      throw error;
    }
  }

  static async deletePerformanceRecord(id: string): Promise<void> {
    try {
      console.log(`Deleting performance record ${id} from ${this.PERFORMANCE_TABLE} table`);
      await this.delete(this.PERFORMANCE_TABLE, id);
      console.log(`Successfully deleted performance record ${id} from ${this.PERFORMANCE_TABLE} table`);
    } catch (error) {
      console.error(`Error deleting performance record ${id}:`, error);
      throw error;
    }
  }

  static async getOrCreateCurrentMonthPerformance(employeeId: string, employeeName: string): Promise<EmployeePerformance> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format
      const currentYear = currentDate.getFullYear();

      console.log(`Getting or creating current month performance for employee ${employeeId} (${employeeName}) for ${currentMonth}`);

      // Try to get existing record from employeePerformance table ONLY
      const existingRecord = await this.getCurrentMonthPerformance(employeeId);

      if (existingRecord) {
        console.log(`Found existing performance record for ${employeeId}:`, existingRecord.id);
        return existingRecord;
      }

      console.log(`No existing record found, creating new performance record for ${employeeId}`);

      // Create new record if none exists - ONLY in employeePerformance table
      const newRecord: Omit<EmployeePerformance, "id"> = {
        employeeId,
        employeeName,
        monthlySales: 0,
        monthlyTarget: 50000,
        attendanceRate: 100,
        performanceScore: 75,
        totalSales: 0,
        totalCommission: 0,
        month: currentMonth,
        year: currentYear,
      };

      const recordId = await this.createPerformanceRecord(newRecord);
      const createdRecord = { ...newRecord, id: recordId };
      console.log(`Created new performance record for ${employeeId}:`, createdRecord);

      return createdRecord;
    } catch (error) {
      console.error(`Error in getOrCreateCurrentMonthPerformance for employee ${employeeId}:`, error);
      throw error;
    }
  }

  static subscribeToPerformanceRecords(callback: (records: EmployeePerformance[]) => void): () => void {
    console.log(`Setting up subscription to ${this.PERFORMANCE_TABLE} table`);
    return this.subscribe<EmployeePerformance>(this.PERFORMANCE_TABLE, callback);
  }

  // Method to increment sales metrics - ensures we ONLY update performance table
  static async incrementSalesMetrics(employeeId: string, employeeName: string, saleAmount: number): Promise<void> {
    try {
      console.log(`Incrementing sales metrics for employee ${employeeId} with amount ${saleAmount}`);

      // Get or create current month's performance record
      const performanceRecord = await this.getOrCreateCurrentMonthPerformance(employeeId, employeeName);

      // Calculate new values
      const newMonthlySales = performanceRecord.monthlySales + saleAmount;
      const newTotalSales = performanceRecord.totalSales + saleAmount;

      // Calculate new performance score based on sales performance
      const targetAchievement = (newMonthlySales / performanceRecord.monthlyTarget) * 100;
      const newPerformanceScore = Math.min(100, Math.max(0,
        (performanceRecord.performanceScore * 0.7) + (Math.min(targetAchievement, 100) * 0.3)
      ));

      // Update the performance record in employeePerformance table ONLY
      await this.updatePerformanceRecord(performanceRecord.id, {
        monthlySales: newMonthlySales,
        totalSales: newTotalSales,
        performanceScore: Math.round(newPerformanceScore),
      });

      console.log(`Successfully incremented sales metrics for employee ${employeeId}`);
    } catch (error) {
      console.error(`Error incrementing sales metrics for employee ${employeeId}:`, error);
      throw error;
    }
  }
}

// Employee Payroll Services
export class EmployeePayrollService extends FirebaseService {
  private static readonly PAYROLL_TABLE = "employeePayroll";

  static async createPayrollRecord(payroll: Omit<EmployeePayroll, "id">): Promise<string> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping payroll record creation');
      return '';
    }

    try {
      console.log('Creating payroll record in employeePayroll table:', payroll);
      const newRef = push(ref(db!, this.PAYROLL_TABLE));
      const newId = newRef.key!;
      const recordWithMetadata = {
        ...payroll,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(newRef, recordWithMetadata);
      console.log(`Successfully created payroll record ${newId} in ${this.PAYROLL_TABLE} table`);
      return newId;
    } catch (error) {
      console.error('Error creating payroll record:', error);
      throw error;
    }
  }

  static async getAllPayrollRecords(): Promise<EmployeePayroll[]> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning empty array');
      return [];
    }

    try {
      console.log(`Fetching all records from ${this.PAYROLL_TABLE} table`);
      return this.getAll<EmployeePayroll>(this.PAYROLL_TABLE);
    } catch (error) {
      console.error('Error getting payroll records:', error);
      return [];
    }
  }

  static async getPayrollByEmployee(employeeId: string): Promise<EmployeePayroll[]> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning empty array');
      return [];
    }

    try {
      console.log(`Fetching payroll records for employee ${employeeId} from ${this.PAYROLL_TABLE} table`);
      const allRecords = await this.getAllPayrollRecords();
      return allRecords.filter(record => record.employeeId === employeeId);
    } catch (error) {
      console.error(`Error getting payroll records for employee ${employeeId}:`, error);
      return [];
    }
  }

  static async getCurrentMonthPayroll(employeeId: string): Promise<EmployeePayroll | null> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning null');
      return null;
    }

    try {
      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format
      const currentYear = currentDate.getFullYear();

      console.log(`Fetching current month (${currentMonth}) payroll for employee ${employeeId} from ${this.PAYROLL_TABLE} table`);
      const allRecords = await this.getAllPayrollRecords();
      const record = allRecords.find(record =>
        record.employeeId === employeeId &&
        record.month === currentMonth &&
        record.year === currentYear
      ) || null;

      console.log(`Found current month payroll record:`, record ? 'Yes' : 'No');

      // Ensure installments is always an array for existing records
      if (record && (!record.installments || !Array.isArray(record.installments))) {
        record.installments = [];
      }

      return record;
    } catch (error) {
      console.error(`Error getting current month payroll for employee ${employeeId}:`, error);
      return null;
    }
  }

  static async getPayrollByMonth(employeeId: string, month: string, year: number): Promise<EmployeePayroll | null> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning null');
      return null;
    }

    try {
      console.log(`Fetching payroll for employee ${employeeId} for ${month}/${year} from ${this.PAYROLL_TABLE} table`);
      const allRecords = await this.getAllPayrollRecords();
      const record = allRecords.find(record =>
        record.employeeId === employeeId &&
        record.month === month &&
        record.year === year
      ) || null;

      // Ensure installments is always an array for existing records
      if (record && (!record.installments || !Array.isArray(record.installments))) {
        record.installments = [];
      }

      return record;
    } catch (error) {
      console.error(`Error getting payroll for employee ${employeeId} for ${month}/${year}:`, error);
      return null;
    }
  }

  // Optimized method to get payroll data for multiple employees at once
  static async getBulkPayrollByMonth(employeeIds: string[], month: string, year: number): Promise<Map<string, EmployeePayroll>> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning empty map');
      return new Map();
    }

    try {
      console.log(`Fetching bulk payroll data for ${employeeIds.length} employees for ${month}/${year}`);
      const allRecords = await this.getAllPayrollRecords();
      const payrollMap = new Map<string, EmployeePayroll>();

      // Filter records for the specified month/year and employee IDs
      const relevantRecords = allRecords.filter(record =>
        employeeIds.includes(record.employeeId) &&
        record.month === month &&
        record.year === year
      );

      // Create map of employee ID to payroll record
      relevantRecords.forEach(record => {
        // Ensure installments is always an array for existing records
        if (!record.installments || !Array.isArray(record.installments)) {
          record.installments = [];
        }
        payrollMap.set(record.employeeId, record);
      });

      console.log(`Found ${payrollMap.size} payroll records for ${month}/${year}`);
      return payrollMap;
    } catch (error) {
      console.error(`Error getting bulk payroll data for ${month}/${year}:`, error);
      return new Map();
    }
  }

  static subscribeToPayrollRecords(callback: (records: EmployeePayroll[]) => void): () => void {
    console.log(`Setting up subscription to ${this.PAYROLL_TABLE} table`);
    return this.subscribe<EmployeePayroll>(this.PAYROLL_TABLE, callback);
  }

  static async updatePayrollRecord(id: string, payroll: Partial<EmployeePayroll>): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping payroll record update');
      return;
    }

    try {
      console.log(`Updating payroll record ${id} in ${this.PAYROLL_TABLE} table with:`, payroll);
      const updateData = {
        ...payroll,
        updatedAt: new Date().toISOString()
      };

      await this.update(this.PAYROLL_TABLE, id, updateData);
      console.log(`Successfully updated payroll record ${id} in ${this.PAYROLL_TABLE} table`);
    } catch (error) {
      console.error(`Error updating payroll record ${id}:`, error);
      throw error;
    }
  }

  static async deletePayrollRecord(id: string): Promise<void> {
    try {
      console.log(`Deleting payroll record ${id} from ${this.PAYROLL_TABLE} table`);
      await this.delete(this.PAYROLL_TABLE, id);
      console.log(`Successfully deleted payroll record ${id} from ${this.PAYROLL_TABLE} table`);
    } catch (error) {
      console.error(`Error deleting payroll record ${id}:`, error);
      throw error;
    }
  }

  static async getOrCreateCurrentMonthPayroll(employeeId: string, employeeName: string, totalSalary: number): Promise<EmployeePayroll> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, creating default payroll record');
      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().slice(0, 7);
      const currentYear = currentDate.getFullYear();

      return {
        id: '',
        employeeId,
        employeeName,
        month: currentMonth,
        year: currentYear,
        totalSalary,
        installments: [],
        bonuses: [],
        remainingSalary: totalSalary,
        status: "pending",
      };
    }

    try {
      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format
      const currentYear = currentDate.getFullYear();

      console.log(`Getting or creating current month payroll for employee ${employeeId} (${employeeName}) for ${currentMonth}`);

      // Try to get existing record from employeePayroll table
      const existingRecord = await this.getCurrentMonthPayroll(employeeId);

      if (existingRecord) {
        console.log(`Found existing payroll record for ${employeeId}:`, existingRecord.id);
        return existingRecord;
      }

      console.log(`No existing record found, creating new payroll record for ${employeeId}`);

      // Create new record if none exists - ONLY in employeePayroll table
      const newRecord: Omit<EmployeePayroll, "id"> = {
        employeeId,
        employeeName,
        month: currentMonth,
        year: currentYear,
        totalSalary,
        installments: [],
        bonuses: [],
        remainingSalary: totalSalary,
        status: "pending",
      };

      const recordId = await this.createPayrollRecord(newRecord);
      const createdRecord = { ...newRecord, id: recordId };
      console.log(`Created new payroll record for ${employeeId}:`, createdRecord);

      return createdRecord;
    } catch (error) {
      console.error(`Error in getOrCreateCurrentMonthPayroll for employee ${employeeId}:`, error);
      throw error;
    }
  }

  static async addInstallment(employeeId: string, employeeName: string, amount: number, notes?: string): Promise<EmployeePayroll> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, cannot add installment');
      throw new Error('Firebase not initialized. Please try again later.');
    }

    try {
      console.log(`Adding installment of ${amount} for employee ${employeeId}`);

      // Get current month payroll record
      const payrollRecord = await this.getCurrentMonthPayroll(employeeId);

      if (!payrollRecord) {
        throw new Error('No payroll record found for current month. Please create one first.');
      }

      // Validate installment amount
      if (amount <= 0) {
        throw new Error('Installment amount must be greater than 0');
      }

      if (amount > payrollRecord.remainingSalary) {
        throw new Error(`Installment amount (${amount}) cannot exceed remaining salary (${payrollRecord.remainingSalary})`);
      }

      // Create new installment
      const newInstallment: PayrollInstallment = {
        amount,
        date: new Date().toISOString(),
        notes: notes || ''
      };

      // Add installment to the array (ensure installments is always an array)
      const currentInstallments = payrollRecord.installments || [];
      const updatedInstallments = [...currentInstallments, newInstallment];

      // Calculate new remaining salary
      const totalPaid = updatedInstallments.reduce((sum, installment) => sum + installment.amount, 0);
      const newRemainingSalary = payrollRecord.totalSalary - totalPaid;

      // Determine new status
      let newStatus: "pending" | "partial" | "paid" | "overdue" = "pending";
      if (newRemainingSalary <= 0) {
        newStatus = "paid";
      } else if (totalPaid > 0) {
        newStatus = "partial";
      }

      // Update the payroll record
      const updatedRecord = {
        ...payrollRecord,
        installments: updatedInstallments,
        remainingSalary: newRemainingSalary,
        status: newStatus
      };

      await this.updatePayrollRecord(payrollRecord.id, updatedRecord);

      console.log(`Successfully added installment for employee ${employeeId}`);
      return updatedRecord;
    } catch (error) {
      console.error(`Error adding installment for employee ${employeeId}:`, error);
      throw error;
    }
  }

  static async addBonus(employeeId: string, employeeName: string, amount: number, reason: string, notes?: string): Promise<EmployeePayroll> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, cannot add bonus');
      throw new Error('Firebase not initialized. Please try again later.');
    }

    try {
      console.log(`Adding bonus of ${amount} for employee ${employeeId}`);

      // Get current month payroll record
      const payrollRecord = await this.getCurrentMonthPayroll(employeeId);

      if (!payrollRecord) {
        throw new Error('No payroll record found for current month. Please create one first.');
      }

      // Validate bonus amount
      if (amount <= 0) {
        throw new Error('Bonus amount must be greater than 0');
      }

      // Create new bonus
      const newBonus: PayrollBonus = {
        amount,
        date: new Date().toISOString(),
        reason,
        notes: notes || ''
      };

      // Add bonus to the array (ensure bonuses is always an array)
      const currentBonuses = payrollRecord.bonuses || [];
      const updatedBonuses = [...currentBonuses, newBonus];

      // Update the payroll record
      const updatedRecord = {
        ...payrollRecord,
        bonuses: updatedBonuses,
        updatedAt: new Date().toISOString()
      };

      await this.updatePayrollRecord(payrollRecord.id, updatedRecord);

      console.log(`Successfully added bonus for employee ${employeeId}`);
      return updatedRecord;
    } catch (error) {
      console.error(`Error adding bonus for employee ${employeeId}:`, error);
      throw error;
    }
  }
}

// Credit Sale Payment Services
export class CreditSalePaymentService extends FirebaseService {
  private static readonly CREDIT_SALE_PAYMENTS_TABLE = "creditSalePayments";

  static async createCreditSalePaymentRecord(paymentRecord: Omit<CreditSalePaymentRecord, "id">): Promise<string> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping credit sale payment record creation');
      return '';
    }

    try {
      console.log('Creating credit sale payment record in creditSalePayments table:', paymentRecord);
      const newRef = push(ref(db!, this.CREDIT_SALE_PAYMENTS_TABLE));
      const newId = newRef.key!;
      const recordWithMetadata = {
        ...paymentRecord,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(newRef, recordWithMetadata);
      console.log(`Successfully created credit sale payment record ${newId} in ${this.CREDIT_SALE_PAYMENTS_TABLE} table`);
      return newId;
    } catch (error) {
      console.error('Error creating credit sale payment record:', error);
      throw error;
    }
  }

  static async getAllCreditSalePaymentRecords(): Promise<CreditSalePaymentRecord[]> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning empty array');
      return [];
    }

    try {
      console.log(`Fetching all records from ${this.CREDIT_SALE_PAYMENTS_TABLE} table`);
      return this.getAll<CreditSalePaymentRecord>(this.CREDIT_SALE_PAYMENTS_TABLE);
    } catch (error) {
      console.error('Error getting credit sale payment records:', error);
      return [];
    }
  }

  static async getCreditSalePaymentBySaleId(saleId: string): Promise<CreditSalePaymentRecord | null> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, returning null');
      return null;
    }

    try {
      console.log(`Fetching credit sale payment record for sale ${saleId} from ${this.CREDIT_SALE_PAYMENTS_TABLE} table`);
      const allRecords = await this.getAllCreditSalePaymentRecords();
      return allRecords.find(record => record.saleId === saleId) || null;
    } catch (error) {
      console.error(`Error getting credit sale payment record for sale ${saleId}:`, error);
      return null;
    }
  }

  static async updateCreditSalePaymentRecord(id: string, paymentRecord: Partial<CreditSalePaymentRecord>): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping credit sale payment record update');
      return;
    }

    try {
      console.log(`Updating credit sale payment record ${id} in ${this.CREDIT_SALE_PAYMENTS_TABLE} table with:`, paymentRecord);
      const updateData = {
        ...paymentRecord,
        updatedAt: new Date().toISOString()
      };

      await this.update(this.CREDIT_SALE_PAYMENTS_TABLE, id, updateData);
      console.log(`Successfully updated credit sale payment record ${id} in ${this.CREDIT_SALE_PAYMENTS_TABLE} table`);
    } catch (error) {
      console.error(`Error updating credit sale payment record ${id}:`, error);
      throw error;
    }
  }

  static async addPayment(saleId: string, amount: number, method: string, notes?: string): Promise<CreditSalePaymentRecord> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, cannot add payment');
      throw new Error('Firebase not initialized. Please try again later.');
    }

    try {
      console.log(`Adding payment of ${amount} for sale ${saleId}`);

      // Get existing payment record
      const paymentRecord = await this.getCreditSalePaymentBySaleId(saleId);

      if (!paymentRecord) {
        throw new Error('No payment record found for this sale. Please create one first.');
      }

      // Validate payment amount
      if (amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (amount > paymentRecord.remainingAmount) {
        throw new Error(`Payment amount (${amount}) cannot exceed remaining amount (${paymentRecord.remainingAmount})`);
      }

      // Create new payment
      const newPayment: CreditSalePayment = {
        amount,
        date: new Date().toISOString(),
        method,
        notes: notes || ''
      };

      // Add payment to the array
      const currentPayments = paymentRecord.payments || [];
      const updatedPayments = [...currentPayments, newPayment];

      // Calculate new remaining amount
      const totalPaid = updatedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const newRemainingAmount = paymentRecord.totalAmount - totalPaid;

      // Determine new status
      let newStatus: "pending" | "partial" | "paid" | "overdue" = "pending";
      if (newRemainingAmount <= 0) {
        newStatus = "paid";
      } else if (totalPaid > 0) {
        newStatus = "partial";
      }

      // Update the payment record
      const updatedRecord = {
        ...paymentRecord,
        payments: updatedPayments,
        remainingAmount: newRemainingAmount,
        status: newStatus
      };

      await this.updateCreditSalePaymentRecord(paymentRecord.id, updatedRecord);

      console.log(`Successfully added payment for sale ${saleId}`);
      return updatedRecord;
    } catch (error) {
      console.error(`Error adding payment for sale ${saleId}:`, error);
      throw error;
    }
  }

  static async createPaymentRecordFromSale(sale: SaleRecord): Promise<CreditSalePaymentRecord> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, creating default payment record');
      const defaultRecord = {
        id: '',
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        customerAddress: sale.customerAddress,
        totalAmount: sale.total,
        payments: [],
        remainingAmount: sale.total,
        status: "pending" as "paid" | "partial" | "pending" | "overdue",
        saleDate: sale.date,
        ...(sale.deliveryDate ? { dueDate: sale.deliveryDate } : {}),
      };

      // dueDate is already included in the object above

      return defaultRecord;
    }

    try {
      console.log(`Creating payment record from sale ${sale.id}`);

      // Check if payment record already exists
      const existingRecord = await this.getCreditSalePaymentBySaleId(sale.id);
      if (existingRecord) {
        console.log(`Payment record already exists for sale ${sale.id}`);
        return existingRecord;
      }

      // Create new payment record
      const newRecord = {
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        customerAddress: sale.customerAddress,
        totalAmount: sale.total,
        payments: [],
        remainingAmount: sale.total,
        status: "pending" as "paid" | "partial" | "pending" | "overdue",
        saleDate: sale.date,
        ...(sale.deliveryDate ? { dueDate: sale.deliveryDate } : {}),
      };

      // dueDate is already included in the object above

      const recordId = await this.createCreditSalePaymentRecord(newRecord);
      const createdRecord = { ...newRecord, id: recordId };
      console.log(`Created new payment record for sale ${sale.id}:`, createdRecord);

      return createdRecord;
    } catch (error) {
      console.error(`Error creating payment record from sale ${sale.id}:`, error);
      throw error;
    }
  }

  static subscribeToCreditSalePaymentRecords(callback: (records: CreditSalePaymentRecord[]) => void): () => void {
    console.log(`Setting up subscription to ${this.CREDIT_SALE_PAYMENTS_TABLE} table`);
    return this.subscribe<CreditSalePaymentRecord>(this.CREDIT_SALE_PAYMENTS_TABLE, callback);
  }
}

// Sales Services
export class SalesService extends FirebaseService {
  static async createSale(sale: Omit<SaleRecord, "id">): Promise<string> {
    // Use thread-safe sales counter to generate sequential ID
    const newId = await SalesCounterService.getNextSalesId();
    await this.createWithCustomId("sales", newId, { ...sale, id: newId, createdAt: new Date().toISOString() });
    return newId;
  }

  static async getAllSales(): Promise<SaleRecord[]> {
    return this.getAll<SaleRecord>("sales")
  }

  static async updateSale(id: string, sale: Partial<SaleRecord>): Promise<void> {
    return this.update("sales", id, sale)
  }

  static async deleteSale(id: string): Promise<void> {
    return this.delete("sales", id)
  }

  static async discardSale(id: string): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized, skipping discard sale operation');
      return;
    }

    try {
      // Get the sale record
      const saleSnapshot = await get(ref(db!, `sales/${id}`));
      if (!saleSnapshot.exists()) {
        throw new Error('Sale not found');
      }

      const sale = { id: saleSnapshot.key, ...saleSnapshot.val() } as SaleRecord;

      // Restore inventory for each item in the sale
      const updates: Record<string, string | number | Record<string, string | number>> = {};

      for (const item of sale.items) {
        const productRef = ref(db!, `products/${item.id}`);
        const productSnapshot = await get(productRef);

        if (productSnapshot.exists()) {
          const product = productSnapshot.val();
          const newStock = (product.stock || 0) + item.quantity;

          // Update product stock
          updates[`products/${item.id}/stock`] = newStock;
          updates[`products/${item.id}/updatedAt`] = new Date().toISOString();

          // Record stock movement
          const movementRef = push(ref(db!, 'stockMovements'));
          updates[`stockMovements/${movementRef.key}`] = {
            itemId: item.id,
            itemName: item.name,
            type: 'in',
            quantity: item.quantity,
            reason: 'Sale discard/return',
            staff: 'System',
            date: new Date().toISOString(),
            reference: `Sale: ${sale.invoiceNumber}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      }

      // Mark sale as cancelled and update timestamps
      updates[`sales/${id}/deliveryStatus`] = 'cancelled';
      updates[`sales/${id}/paymentStatus`] = 'pending';
      updates[`sales/${id}/updatedAt`] = new Date().toISOString();

      // Update all changes in a single transaction
      await fbUpdate(ref(db!), updates);

    } catch (error) {
      console.error('Error discarding sale:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  static subscribeToSales(callback: (sales: SaleRecord[]) => void): () => void {
    return this.subscribe<SaleRecord>("sales", callback);
  }

  static listenToSalesByCustomer(customerName: string, customerPhone: string, callback: (sales: SaleRecord[]) => void): () => void {
    const salesRef = ref(db!, "sales");
    return onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const salesData = snapshot.val();
        const sales = Object.values(salesData as Record<string, SaleRecord>)
          .filter(sale =>
            sale.customerName === customerName
          );
        callback(sales);
      } else {
        callback([]);
      }
    });
  }
}

// Credit/Debit Services
export class LedgerService extends FirebaseService {
  static async createCreditEntry(entry: Omit<CreditEntry, "id">): Promise<string | null> {
    return this.create("creditEntries", entry)
  }

  static async getAllCreditEntries(): Promise<CreditEntry[]> {
    return this.getAll<CreditEntry>("creditEntries")
  }

  static async updateCreditEntry(id: string, entry: Partial<CreditEntry>): Promise<void> {
    return this.update("creditEntries", id, entry)
  }

  static async createDebitEntry(entry: Omit<DebitEntry, "id">): Promise<string | null> {
    return this.create("debitEntries", entry)
  }

  static async getAllDebitEntries(): Promise<DebitEntry[]> {
    return this.getAll<DebitEntry>("debitEntries")
  }

  static async updateDebitEntry(id: string, entry: Partial<DebitEntry>): Promise<void> {
    return this.update("debitEntries", id, entry)
  }

  static subscribeToCreditEntries(callback: (entries: CreditEntry[]) => void): () => void {
    return this.subscribe<CreditEntry>("creditEntries", callback)
  }

  static subscribeToDebitEntries(callback: (entries: DebitEntry[]) => void): () => void {
    return this.subscribe<DebitEntry>("debitEntries", callback)
  }
}

// Bargaining Services
export class BargainingService extends FirebaseService {
  static async createBargainRecord(record: Omit<BargainRecord, "id">): Promise<string | null> {
    return this.create("bargainRecords", record)
  }

  static async getAllBargainRecords(): Promise<BargainRecord[]> {
    return this.getAll<BargainRecord>("bargainRecords")
  }

  static async updateBargainRecord(id: string, record: Partial<BargainRecord>): Promise<void> {
    return this.update("bargainRecords", id, record)
  }

  static subscribeToBargainRecords(callback: (records: BargainRecord[]) => void): () => void {
    return this.subscribe<BargainRecord>("bargainRecords", callback)
  }
}

// Disposal Services
export class DisposalService extends FirebaseService {
  static async createDisposalRecord(record: Omit<DisposalRecord, "id">): Promise<string | null> {
    return this.create("disposalRecords", record)
  }

  static async getAllDisposalRecords(): Promise<DisposalRecord[]> {
    return this.getAll<DisposalRecord>("disposalRecords")
  }

  static async updateDisposalRecord(id: string, record: Partial<DisposalRecord>): Promise<void> {
    return this.update("disposalRecords", id, record)
  }

  static async deleteDisposalRecord(id: string): Promise<void> {
    return this.delete("disposalRecords", id)
  }

  static subscribeToDisposalRecords(callback: (records: DisposalRecord[]) => void): () => void {
    return this.subscribe<DisposalRecord>("disposalRecords", callback)
  }
}

// Daily Expense Services
export class DailyExpenseService extends FirebaseService {
  static async createDailyExpense(expense: Omit<DailyExpense, "id">): Promise<string | null> {
    return this.create("dailyExpenses", expense)
  }

  static async getAllDailyExpenses(): Promise<DailyExpense[]> {
    return this.getAll<DailyExpense>("dailyExpenses")
  }

  static async updateDailyExpense(id: string, expense: Partial<DailyExpense>): Promise<void> {
    return this.update("dailyExpenses", id, expense)
  }

  static async deleteDailyExpense(id: string): Promise<void> {
    return this.delete("dailyExpenses", id)
  }

  static subscribeToDailyExpenses(callback: (expenses: DailyExpense[]) => void): () => void {
    return this.subscribe<DailyExpense>("dailyExpenses", callback)
  }
}

// Customer Services
export class CustomerService extends FirebaseService {
  static async createCustomer(customer: Omit<Customer, "id">): Promise<string> {
    // Use Firebase push() to generate a unique ID atomically
    const newRef = push(ref(db!, "customers"));
    const newId = newRef.key!;
    await set(newRef, { ...customer, id: newId, createdAt: new Date().toISOString() });
    return newId;
  }

  static async getAllCustomers(): Promise<Customer[]> {
    return this.getAll<Customer>("customers")
  }

  static async getCustomerById(id: string): Promise<Customer | null> {
    return this.getById<Customer>("customers", id)
  }

  static async updateCustomer(id: string, customer: Partial<Customer>): Promise<void> {
    return this.update("customers", id, customer)
  }

  static async deleteCustomer(id: string): Promise<void> {
    return this.delete("customers", id)
  }

  static subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    return this.subscribe<Customer>("customers", callback)
  }

  // Get customer sales history
  static async getCustomerSales(customerPhone: string): Promise<SaleRecord[]> {
    const allSales = await SalesService.getAllSales()
    return allSales.filter(sale => sale.customerPhone === customerPhone)
  }

  // Update customer stats based on sales
  static async updateCustomerStats(customerPhone: string): Promise<void> {
    const sales = await this.getCustomerSales(customerPhone)
    const customers = await this.getAllCustomers()
    const customer = customers.find(c => c.phone === customerPhone)

    if (customer) {
      const totalPurchases = sales.length
      const totalSpent = sales.reduce((sum, sale) => sum + sale.total, 0)
      const lastPurchaseDate = sales.length > 0
        ? sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : undefined

      await this.updateCustomer(customer.id, {
        totalPurchases,
        totalSpent,
        lastPurchaseDate
      })
    }
  }
}

// Supplier Services
export class SupplierService extends FirebaseService {
  static async createSupplier(supplier: Omit<Supplier, "id">): Promise<string> {
    // Use Firebase push() to generate a unique ID atomically
    const newRef = push(ref(db!, "suppliers"));
    const newId = newRef.key!;
    await set(newRef, { ...supplier, id: newId, createdAt: new Date().toISOString() });
    return newId;
  }

  static async getAllSuppliers(): Promise<Supplier[]> {
    return this.getAll<Supplier>("suppliers")
  }

  static async getSupplierById(id: string): Promise<Supplier | null> {
    return this.getById<Supplier>("suppliers", id)
  }

  static async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<void> {
    return this.update("suppliers", id, supplier)
  }

  static async deleteSupplier(id: string): Promise<void> {
    return this.delete("suppliers", id)
  }

  static subscribeToSuppliers(callback: (suppliers: Supplier[]) => void): () => void {
    return this.subscribe<Supplier>("suppliers", callback)
  }
}

// Supplier Credit Services
export class SupplierCreditService extends FirebaseService {
  private static readonly CREDITS_TABLE = "supplierCredits"
  private static readonly TRANSACTIONS_TABLE = "supplierCreditTransactions"

  // Get Firestore instance
  private static get db() {
    return db
  }

  // Create a new credit for a supplier
  static async createCredit(credit: Omit<SupplierCredit, "id">): Promise<string> {
    const newRef = push(ref(db!, this.CREDITS_TABLE));
    const newId = newRef.key!;

    const creditData = {
      ...credit,
      id: newId,
      remainingAmount: credit.amount,
      usedAmount: 0,
      createdAt: new Date().toISOString()
    };

    // Remove undefined values to prevent Firebase errors
    const cleanCreditData = Object.fromEntries(
      Object.entries(creditData).filter(([, value]) => value !== undefined)
    );

    await set(newRef, cleanCreditData);
    return newId;
  }

  // Get all credits for a specific supplier
  static async getCreditsBySupplier(supplierId: string): Promise<SupplierCredit[]> {
    const credits = await this.getAll<SupplierCredit>(this.CREDITS_TABLE);
    return credits.filter(credit => credit.supplierId === supplierId);
  }

  // Get all active credits for a supplier
  static async getActiveCreditsBySupplier(supplierId: string): Promise<SupplierCredit[]> {
    const credits = await this.getCreditsBySupplier(supplierId);
    return credits.filter(credit => credit.status === "active" && (credit.remainingAmount || 0) > 0);
  }

  // Get total available credit amount for a supplier
  static async getTotalAvailableCredit(supplierId: string): Promise<number> {
    const activeCredits = await this.getActiveCreditsBySupplier(supplierId);
    return activeCredits.reduce((total, credit) => total + (credit.remainingAmount || 0), 0);
  }

  // Use credit for a purchase
  static async useCredit(
    creditId: string,
    amount: number,
    purchaseId: string,
    invoiceNumber: string,
    createdBy: string
  ): Promise<void> {
    const creditRef = ref(db!, `${this.CREDITS_TABLE}/${creditId}`);
    const creditSnapshot = await get(creditRef);

    if (!creditSnapshot.exists()) {
      throw new Error("Credit not found");
    }

    const credit = creditSnapshot.val() as SupplierCredit;
    const remainingAmount = credit.remainingAmount || 0;

    if (amount > remainingAmount) {
      throw new Error("Insufficient credit amount");
    }

    const newRemainingAmount = remainingAmount - amount;
    const newUsedAmount = (credit.usedAmount || 0) + amount;
    const newStatus = newRemainingAmount <= 0 ? "used" : "active";

    // Update credit
    await update(creditRef, {
      remainingAmount: newRemainingAmount,
      usedAmount: newUsedAmount,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    // Create transaction record
    const transactionRef = push(ref(db!, this.TRANSACTIONS_TABLE));
    await set(transactionRef, {
      id: transactionRef.key!,
      creditId,
      supplierId: credit.supplierId,
      amount,
      type: "used",
      purchaseId,
      invoiceNumber,
      description: `Used credit for purchase ${invoiceNumber}`,
      createdAt: new Date().toISOString(),
      createdBy
    });
  }

  // Refund credit (when purchase is cancelled)
  static async refundCredit(
    creditId: string,
    amount: number,
    purchaseId: string,
    invoiceNumber: string,
    createdBy: string
  ): Promise<void> {
    const creditRef = ref(db!, `${this.CREDITS_TABLE}/${creditId}`);
    const creditSnapshot = await get(creditRef);

    if (!creditSnapshot.exists()) {
      throw new Error("Credit not found");
    }

    const credit = creditSnapshot.val() as SupplierCredit;
    const remainingAmount = (credit.remainingAmount || 0) + amount;
    const usedAmount = Math.max(0, (credit.usedAmount || 0) - amount);
    const newStatus = remainingAmount > 0 ? "active" : "used";

    // Update credit
    await update(creditRef, {
      remainingAmount,
      usedAmount,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    // Create transaction record
    const transactionRef = push(ref(db!, this.TRANSACTIONS_TABLE));
    await set(transactionRef, {
      id: transactionRef.key!,
      creditId,
      supplierId: credit.supplierId,
      amount,
      type: "refunded",
      purchaseId,
      invoiceNumber,
      description: `Refunded credit for cancelled purchase ${invoiceNumber}`,
      createdAt: new Date().toISOString(),
      createdBy
    });
  }

  // Get credit transactions for a supplier
  static async getCreditTransactions(supplierId: string): Promise<SupplierCreditTransaction[]> {
    const transactions = await this.getAll<SupplierCreditTransaction>(this.TRANSACTIONS_TABLE);
    return transactions.filter(transaction => transaction.supplierId === supplierId);
  }

  // Update credit
  static async updateCredit(creditId: string, data: Partial<SupplierCredit>): Promise<void> {
    await this.update(this.CREDITS_TABLE, creditId, data)
  }

  // Delete credit and all its transactions
  static async deleteCredit(creditId: string): Promise<void> {
    try {
      // First, get the credit to verify it exists
      const creditRef = ref(db!, `${this.CREDITS_TABLE}/${creditId}`);
      const creditSnap = await get(creditRef);

      if (!creditSnap.exists()) {
        throw new Error(`Credit with ID ${creditId} not found`);
      }

      // Get all transactions for this credit
      const transactionsRef = ref(db!, this.TRANSACTIONS_TABLE);
      const transactionsSnap = await get(transactionsRef);
      const updates: Record<string, null> = {};

      // Add the credit to delete
      updates[`${this.CREDITS_TABLE}/${creditId}`] = null;

      // Find and add all related transactions to delete
      if (transactionsSnap.exists()) {
        transactionsSnap.forEach((transaction) => {
          if (transaction.val().creditId === creditId) {
            updates[`${this.TRANSACTIONS_TABLE}/${transaction.key}`] = null;
          }
        });
      }

      // Perform all deletions in a single update
      await update(ref(db!), updates);

      console.log(`Successfully deleted credit ${creditId} and its transactions`);
    } catch (error) {
      console.error(`Error deleting credit ${creditId}:`, error);
      throw error instanceof Error ? error : new Error('Failed to delete credit');
    }
  }

  // Update credit status
  static async updateCreditStatus(creditId: string, status: SupplierCredit["status"]): Promise<void> {
    const creditRef = ref(db!, `${this.CREDITS_TABLE}/${creditId}`);
    await update(creditRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  }


  // Real-time listeners
  static listenToCreditsBySupplier(supplierId: string, callback: (credits: SupplierCredit[]) => void): () => void {
    return this.subscribe(this.CREDITS_TABLE, (credits: SupplierCredit[] = []) => {
      const filtered = credits.filter(credit => credit.supplierId === supplierId);
      callback(filtered);
    });
  }

  static listenToCreditTransactions(supplierId: string, callback: (transactions: SupplierCreditTransaction[]) => void): () => void {
    return this.subscribe(this.TRANSACTIONS_TABLE, (transactions: SupplierCreditTransaction[] = []) => {
      const filtered = transactions.filter(transaction => transaction.supplierId === supplierId);
      callback(filtered);
    });
  }
}

// Customer Credit Services
export class CustomerCreditService extends FirebaseService {
  private static readonly CREDITS_TABLE = "customerCredits";
  private static readonly TRANSACTIONS_TABLE = "customerCreditTransactions";

  // Create a new credit for a customer
  static async createCredit(credit: Omit<CustomerCredit, "id">): Promise<string> {
    const newRef = push(ref(db!, this.CREDITS_TABLE));
    const newId = newRef.key!;

    const creditData = {
      ...credit,
      id: newId,
      remainingAmount: credit.amount,
      usedAmount: 0,
      createdAt: new Date().toISOString()
    };

    // Remove undefined values to prevent Firebase errors
    const cleanCreditData = Object.fromEntries(
      Object.entries(creditData).filter(([, value]) => value !== undefined)
    );

    await set(newRef, cleanCreditData);
    return newId;
  }

  // Get all credits for a specific customer
  static async getCreditsByCustomer(customerId: string): Promise<CustomerCredit[]> {
    const credits = await this.getAll<CustomerCredit>(this.CREDITS_TABLE);
    return credits.filter(credit => credit.customerId === customerId);
  }

  // Get total available credit for a customer
  static async getTotalAvailableCredit(customerId: string): Promise<number> {
    const credits = await this.getCreditsByCustomer(customerId);
    return credits.filter(credit => credit.status === "active").reduce((total, credit) => total + (credit.remainingAmount || 0), 0);
  }

  // Use credit for a sale
  static async useCredit(
    creditId: string,
    amount: number,
    saleId: string,
    invoiceNumber: string,
    createdBy: string
  ): Promise<void> {
    const creditRef = ref(db!, `${this.CREDITS_TABLE}/${creditId}`);
    const creditSnapshot = await get(creditRef);

    if (!creditSnapshot.exists()) {
      throw new Error("Credit not found");
    }

    const credit = creditSnapshot.val() as CustomerCredit;
    const remainingAmount = credit.remainingAmount || 0;

    if (amount > remainingAmount) {
      throw new Error("Insufficient credit amount");
    }

    const newRemainingAmount = remainingAmount - amount;
    const newUsedAmount = (credit.usedAmount || 0) + amount;
    const newStatus = newRemainingAmount <= 0 ? "used" : "active";

    // Update credit
    await update(creditRef, {
      remainingAmount: newRemainingAmount,
      usedAmount: newUsedAmount,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    // Create transaction record
    const transactionRef = push(ref(db!, this.TRANSACTIONS_TABLE));
    await set(transactionRef, {
      id: transactionRef.key!,
      creditId,
      customerId: credit.customerId,
      amount,
      type: "used",
      saleId,
      invoiceNumber,
      description: `Used credit for sale ${invoiceNumber}`,
      createdAt: new Date().toISOString(),
      createdBy
    });
  }

  // Refund credit (when sale is cancelled)
  static async refundCredit(
    creditId: string,
    amount: number,
    saleId: string,
    invoiceNumber: string,
    createdBy: string
  ): Promise<void> {
    const creditRef = ref(db!, `${this.CREDITS_TABLE}/${creditId}`);
    const creditSnapshot = await get(creditRef);

    if (!creditSnapshot.exists()) {
      throw new Error("Credit not found");
    }

    const credit = creditSnapshot.val() as CustomerCredit;
    const remainingAmount = credit.remainingAmount || 0;
    const usedAmount = credit.usedAmount || 0;

    const newRemainingAmount = remainingAmount + amount;
    const newUsedAmount = Math.max(0, usedAmount - amount);
    const newStatus = newUsedAmount <= 0 ? "active" : "used";

    // Update credit
    await update(creditRef, {
      remainingAmount: newRemainingAmount,
      usedAmount: newUsedAmount,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    // Create transaction record
    const transactionRef = push(ref(db!, this.TRANSACTIONS_TABLE));
    await set(transactionRef, {
      id: transactionRef.key!,
      creditId,
      customerId: credit.customerId,
      amount,
      type: "refunded",
      saleId,
      invoiceNumber,
      description: `Refunded credit for cancelled sale ${invoiceNumber}`,
      createdAt: new Date().toISOString(),
      createdBy
    });
  }

  // Get credit transactions for a customer
  static async getCreditTransactions(customerId: string): Promise<CustomerCreditTransaction[]> {
    const transactions = await this.getAll<CustomerCreditTransaction>(this.TRANSACTIONS_TABLE);
    return transactions.filter(transaction => transaction.customerId === customerId);
  }

  // Update credit
  static async updateCredit(creditId: string, creditData: Partial<CustomerCredit>): Promise<void> {
    await this.update(this.CREDITS_TABLE, creditId, {
      ...creditData,
      updatedAt: new Date().toISOString()
    });
  }

  // Update credit status
  static async updateCreditStatus(creditId: string, status: CustomerCredit["status"]): Promise<void> {
    await this.update(this.CREDITS_TABLE, creditId, {
      status,
      updatedAt: new Date().toISOString()
    });
  }

  // Delete credit and all its transactions
  static async deleteCredit(creditId: string): Promise<void> {
    const credit = await this.getById<CustomerCredit>(this.CREDITS_TABLE, creditId);
    if (!credit) {
      throw new Error("Credit not found");
    }

    // Delete the credit
    await this.delete(this.CREDITS_TABLE, creditId);

    // Delete all associated transactions
    const transactionsRef = ref(db!, this.TRANSACTIONS_TABLE);
    const transactionsSnapshot = await get(transactionsRef);
    if (transactionsSnapshot.exists()) {
      const transactions = transactionsSnapshot.val() as Record<string, CustomerCreditTransaction>;
      const transactionUpdates: Record<string, null> = {};

      // Find and mark all transactions for this credit for deletion
      Object.entries(transactions).forEach(([id, transaction]) => {
        if (transaction.creditId === creditId) {
          transactionUpdates[`${this.TRANSACTIONS_TABLE}/${id}`] = null;
        }
      });

      // Delete all transactions in a single batch
      if (Object.keys(transactionUpdates).length > 0) {
        await update(ref(db!), transactionUpdates);
      }
    }
  }

  // Real-time listeners
  static listenToCreditsByCustomer(customerId: string, callback: (credits: CustomerCredit[]) => void): () => void {
    const creditsRef = ref(db!, this.CREDITS_TABLE);
    return onValue(creditsRef, (snapshot) => {
      if (snapshot.exists()) {
        const creditsData = snapshot.val();
        const credits = Object.values(creditsData as Record<string, CustomerCredit>)
          .filter(credit => credit.customerId === customerId);
        callback(credits);
      } else {
        callback([]);
      }
    });
  }

  static listenToCreditTransactions(customerId: string, callback: (transactions: CustomerCreditTransaction[]) => void): () => void {
    const transactionsRef = ref(db!, this.TRANSACTIONS_TABLE);
    return onValue(transactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const transactionsData = snapshot.val();
        const transactions = Object.values(transactionsData as Record<string, CustomerCreditTransaction>)
          .filter(transaction => transaction.customerId === customerId);
        callback(transactions);
      } else {
        callback([]);
      }
    });
  }
}

// Purchase Services
export class PurchaseService extends FirebaseService {
  static async createPurchase(purchase: Omit<Purchase, "id">): Promise<string> {
    // Use Firebase push() to generate a unique ID atomically
    const newRef = push(ref(db!, "purchases"));
    const newId = newRef.key!;
    await set(newRef, { ...purchase, id: newId, createdAt: new Date().toISOString() });
    return newId;
  }

  static async getAllPurchases(): Promise<Purchase[]> {
    return this.getAll<Purchase>("purchases")
  }

  static async getPurchaseById(id: string): Promise<Purchase | null> {
    return this.getById<Purchase>("purchases", id)
  }

  static async updatePurchase(id: string, purchase: Partial<Purchase>): Promise<void> {
    return this.update("purchases", id, purchase)
  }

  static async deletePurchase(id: string): Promise<void> {
    return this.delete("purchases", id)
  }

  static subscribeToPurchases(callback: (purchases: Purchase[]) => void): () => void {
    return this.subscribe<Purchase>("purchases", callback)
  }

  static async getPurchasesBySupplier(supplierId: string): Promise<Purchase[]> {
    const purchases = await this.getAll<Purchase>("purchases")
    return purchases.filter(purchase => purchase.supplierId === supplierId)
  }

  static listenToPurchasesBySupplier(supplierId: string, callback: (purchases: Purchase[]) => void): () => void {
    const purchasesRef = ref(db!, "purchases");
    return onValue(purchasesRef, (snapshot) => {
      if (snapshot.exists()) {
        const purchasesData = snapshot.val();
        const purchases = Object.values(purchasesData as Record<string, Purchase>)
          .filter(purchase => purchase.supplierId === supplierId);
        callback(purchases);
      } else {
        callback([]);
      }
    });
  }
}

// Customer Return Services
export class CustomerReturnService extends FirebaseService {
  static async createCustomerReturn(customerReturn: Omit<CustomerReturnRecord, "id">): Promise<string | null> {
    return this.create("customerReturns", customerReturn)
  }

  static async getAllCustomerReturns(): Promise<CustomerReturnRecord[]> {
    return this.getAll<CustomerReturnRecord>("customerReturns")
  }

  static async getCustomerReturnById(id: string): Promise<CustomerReturnRecord | null> {
    return this.getById<CustomerReturnRecord>("customerReturns", id)
  }

  static async updateCustomerReturn(id: string, customerReturn: Partial<CustomerReturnRecord>): Promise<void> {
    return this.update("customerReturns", id, customerReturn)
  }

  static async deleteCustomerReturn(id: string): Promise<void> {
    return this.delete("customerReturns", id)
  }
}

// Supplier Return Services
export class SupplierReturnService extends FirebaseService {
  static async createSupplierReturn(supplierReturn: Omit<SupplierReturnRecord, "id">): Promise<string | null> {
    return this.create("supplierReturns", supplierReturn)
  }

  static async getAllSupplierReturns(): Promise<SupplierReturnRecord[]> {
    return this.getAll<SupplierReturnRecord>("supplierReturns")
  }

  static async getSupplierReturnById(id: string): Promise<SupplierReturnRecord | null> {
    return this.getById<SupplierReturnRecord>("supplierReturns", id)
  }

  static async updateSupplierReturn(id: string, supplierReturn: Partial<SupplierReturnRecord>): Promise<void> {
    return this.update("supplierReturns", id, supplierReturn)
  }

  static async deleteSupplierReturn(id: string): Promise<void> {
    return this.delete("supplierReturns", id)
  }
}

// Return Counter Services
export class ReturnCounterService extends FirebaseService {
  static async getNextCustomerReturnNumber(): Promise<string> {
    try {
      if (!isFirebaseInitialized()) {
        throw new Error("Firebase not initialized")
      }

      const counterRef = ref(db, "counters/customerReturns")
      const STARTING_NUMBER = 1000
      const MAX_NUMBER = 99999

      // Use Firebase transaction to ensure atomic increment
      const result = await runTransaction(counterRef, (currentValue: number | null) => {
        // If counter doesn't exist or is invalid, start from 1000
        if (currentValue === null || typeof currentValue !== 'number' || currentValue < STARTING_NUMBER) {
          return STARTING_NUMBER
        }

        // If we've reached the maximum, wrap around to starting number
        if (currentValue >= MAX_NUMBER) {
          return STARTING_NUMBER
        }

        // Increment the counter
        return currentValue + 1
      })

      if (result.committed) {
        const returnNumber = result.snapshot.val()
        return `${returnNumber}-R`
      } else {
        throw new Error('Failed to generate customer return number - transaction not committed')
      }
    } catch (error) {
      console.error("Error getting next customer return number:", error)
      throw error
    }
  }

  static async getNextSupplierReturnNumber(): Promise<string> {
    try {
      if (!isFirebaseInitialized()) {
        throw new Error("Firebase not initialized")
      }

      const counterRef = ref(db, "counters/supplierReturns")
      const STARTING_NUMBER = 1000
      const MAX_NUMBER = 99999

      // Use Firebase transaction to ensure atomic increment
      const result = await runTransaction(counterRef, (currentValue: number | null) => {
        // If counter doesn't exist or is invalid, start from 1000
        if (currentValue === null || typeof currentValue !== 'number' || currentValue < STARTING_NUMBER) {
          return STARTING_NUMBER
        }

        // If we've reached the maximum, wrap around to starting number
        if (currentValue >= MAX_NUMBER) {
          return STARTING_NUMBER
        }

        // Increment the counter
        return currentValue + 1
      })

      if (result.committed) {
        const returnNumber = result.snapshot.val()
        return `${returnNumber}-SR`
      } else {
        throw new Error('Failed to generate supplier return number - transaction not committed')
      }
    } catch (error) {
      console.error("Error getting next supplier return number:", error)
      throw error
    }
  }
}

// Settings Service
export interface AppSettings {
  paymentPassword?: string
  defaultCurrency?: string
  companyName?: string
  companyAddress?: string
  [key: string]: unknown
}

export class SettingsService extends FirebaseService {
  static async getSettings(): Promise<AppSettings | null> {
    try {
      const settings = await this.getById<AppSettings>("settings", "settings")
      return settings || null
    } catch (error) {
      console.error("Error getting settings:", error)
      return null
    }
  }

  static async updateSettings(settings: AppSettings): Promise<void> {
    try {
      await this.update("settings", "settings", settings)
    } catch (error) {
      console.error("Error updating settings:", error)
      throw error
    }
  }

  static async initializeDefaultSettings(): Promise<void> {
    try {
      const existingSettings = await this.getSettings()
      if (!existingSettings) {
        const defaultSettings: AppSettings = {
          paymentPassword: "admin123",
          defaultCurrency: "PKR",
          companyName: "Bin Sultan",
          companyAddress: ""
        }
        await this.updateSettings(defaultSettings)
      }
    } catch (error) {
      console.error("Error initializing default settings:", error)
    }
  }
}

export interface ApplicationSettings {
  newVerStartDate: string; // ISO string
}

export class ApplicationSettingsService {
  static async getSettings(): Promise<ApplicationSettings> {
    if (!isFirebaseInitialized()) return { newVerStartDate: '2026-02-18T00:00:00.000Z' }; // Default
    try {
      const snapshot = await get(ref(db!, "settings/appSettings"));
      if (snapshot.exists()) {
        return snapshot.val() as ApplicationSettings;
      }
      return { newVerStartDate: '2026-02-18T00:00:00.000Z' }; // Default if not set
    } catch (error) {
      console.error("Error fetching app settings:", error);
      return { newVerStartDate: '2026-02-18T00:00:00.000Z' };
    }
  }

  static async updateSettings(settings: Partial<ApplicationSettings>): Promise<void> {
    if (!isFirebaseInitialized()) return;
    try {
      await fbUpdate(ref(db!, "settings/appSettings"), settings);
    } catch (error) {
      console.error("Error updating app settings:", error);
      throw error;
    }
  }

  static subscribeToSettings(callback: (settings: ApplicationSettings) => void): () => void {
    if (!isFirebaseInitialized()) return () => { };
    const settingsRef = ref(db!, "settings/appSettings");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as ApplicationSettings);
      } else {
        callback({ newVerStartDate: '2026-02-18T00:00:00.000Z' });
      }
    });
    return unsubscribe;
  }
}
