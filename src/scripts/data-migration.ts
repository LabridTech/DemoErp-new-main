// Data Migration Script
// This script helps migrate data from your existing website to the new Firebase database

import AuthService from '../lib/auth-service'
import { 
  ProductService, 
  EmployeeService, 
  SalesService, 
  LedgerService
} from '../lib/firebase-services'

// Sample data structures based on your existing website
// You can modify these to match your actual data format

interface Product {
  name: string;
  code: string;
  fabricType: string;
  fabricColor: string;
  fabricPattern: string;
  fabricWeight: string;
  fabricWidth: string;
  fabricLength: string;
  size: string;
  purchaseCost: number;
  minSalePrice: number;
  maxSalePrice: number;
  currentPrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
  supplier: string;
  batchInfo: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdDate: string;
}

type EmployeeStatus = 'active' | 'inactive' | 'on-leave';

interface Employee {
  id?: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  joinDate: string;
  salary: number;
  commission: number;
  status: EmployeeStatus;
  address: string;
  emergencyContact: string;
  bankAccount: string;
  cnic: string;
}

export interface MigrationData {
  products?: Product[];
  employees?: Employee[];
  sales?: unknown[];
  creditEntries?: unknown[];
  debitEntries?: unknown[];
  bargainRecords?: unknown[];
  disposalRecords?: unknown[];
  dailyExpenses?: unknown[];
  attendance?: unknown[];
  salaryRecords?: unknown[];
  stockMovements?: unknown[];
}

class DataMigrationService {
  
  // Initialize the database with default user
  static async initializeDatabase(): Promise<void> {
    console.log('Initializing database with default user...')
    await AuthService.initializeDefaultUser()
    console.log('Database initialized successfully')
  }

  // Fetch data from your existing website
  static async fetchExistingData(websiteUrl: string = 'https://bin-sultan-fabrics.vercel.app'): Promise<MigrationData> {
    console.log(`Attempting to fetch data from ${websiteUrl}...`)
    
    try {
      // This is a placeholder - you'll need to implement actual data fetching
      // based on your website's API endpoints or data structure
      
      // If your website has API endpoints, you can fetch like this:
      // const response = await fetch(`${websiteUrl}/api/data`)
      // const data = await response.json()
      
      // For now, return empty structure
      const migrationData: MigrationData = {
        products: [],
        employees: [],
        sales: [],
        creditEntries: [],
        debitEntries: [],
        bargainRecords: [],
        disposalRecords: [],
        dailyExpenses: [],
        attendance: [],
        salaryRecords: [],
        stockMovements: []
      }
      
      console.log('Data fetching completed (placeholder implementation)')
      return migrationData
      
    } catch (error) {
      console.error('Error fetching existing data:', error)
      throw error
    }
  }

  // Transform data to match new interfaces
  static transformData(rawData: Record<string, unknown>): MigrationData {
    console.log('Transforming data to match new interfaces...')
    
    // Transform your existing data format to match the TypeScript interfaces
    // This is where you'll map your old data structure to the new one
    
    const transformedData: MigrationData = {
      products: Array.isArray(rawData.products) ? rawData.products.map((item: unknown) => {
        const product = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {};
        return {
          name: typeof product.name === 'string' ? product.name : '',
          code: typeof product.code === 'string' ? product.code : '',
          fabricType: typeof product.fabricType === 'string' ? product.fabricType : '',
          fabricColor: typeof product.fabricColor === 'string' ? product.fabricColor : '',
          fabricPattern: typeof product.fabricPattern === 'string' ? product.fabricPattern : '',
          fabricWeight: typeof product.fabricWeight === 'string' ? product.fabricWeight : '',
          fabricWidth: typeof product.fabricWidth === 'string' ? product.fabricWidth : '',
          fabricLength: typeof product.fabricLength === 'string' ? product.fabricLength : '',
          size: typeof product.size === 'string' ? product.size : '',
          purchaseCost: typeof product.purchaseCost === 'number' ? product.purchaseCost : 0,
          minSalePrice: typeof product.minSalePrice === 'number' ? product.minSalePrice : 0,
          maxSalePrice: typeof product.maxSalePrice === 'number' ? product.maxSalePrice : 0,
          currentPrice: typeof product.currentPrice === 'number' ? product.currentPrice : 0,
          stock: typeof product.stock === 'number' ? product.stock : 0,
          minStock: typeof product.minStock === 'number' ? product.minStock : 0,
          maxStock: typeof product.maxStock === 'number' ? product.maxStock : 0,
          supplier: typeof product.supplier === 'string' ? product.supplier : '',
          batchInfo: typeof product.batchInfo === 'string' ? product.batchInfo : '',
          status: ['active', 'inactive', 'discontinued'].includes(product.status as string) 
            ? product.status as 'active' | 'inactive' | 'discontinued' 
            : 'active',
          createdDate: typeof product.createdDate === 'string' 
            ? product.createdDate 
            : new Date().toISOString().split('T')[0]
        };
      }) : [],
      
      employees: Array.isArray(rawData.employees) ? rawData.employees.map((item: unknown) => {
        const employee = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {};
        return {
          name: typeof employee.name === 'string' ? employee.name : '',
          email: typeof employee.email === 'string' ? employee.email : '',
          phone: typeof employee.phone === 'string' ? employee.phone : '',
          position: typeof employee.position === 'string' ? employee.position : '',
          department: typeof employee.department === 'string' ? employee.department : '',
          joinDate: typeof employee.joinDate === 'string' 
            ? employee.joinDate 
            : new Date().toISOString().split('T')[0],
          salary: typeof employee.salary === 'number' ? employee.salary : 0,
          commission: typeof employee.commission === 'number' ? employee.commission : 0,
          status: (['active', 'inactive', 'on-leave'] as const).includes(employee.status as EmployeeStatus) 
            ? employee.status as EmployeeStatus 
            : 'active',
          address: typeof employee.address === 'string' ? employee.address : '',
          emergencyContact: typeof employee.emergencyContact === 'string' ? employee.emergencyContact : '',
          bankAccount: typeof employee.bankAccount === 'string' ? employee.bankAccount : '',
          cnic: typeof employee.cnic === 'string' ? employee.cnic : ''
        };
      }) : []
      
      // Add more transformations for other data types as needed
    }
    
    console.log('Data transformation completed')
    return transformedData
  }

  // Migrate data to Firebase
  static async migrateData(data: MigrationData): Promise<void> {
    console.log('Starting data migration to Firebase...')
    
    try {
      // Migrate Products
      if (data.products && data.products.length > 0) {
        console.log(`Migrating ${data.products.length} products...`)
        for (const product of data.products) {
          if (product) {
            await ProductService.createProduct(product as Parameters<typeof ProductService.createProduct>[0])
          }
        }
      }

      // Migrate Employees
      if (data.employees && data.employees.length > 0) {
        console.log(`Migrating ${data.employees.length} employees...`)
        for (const employee of data.employees) {
          if (employee) {
            await EmployeeService.createEmployee(employee as Omit<Employee, 'id'>)
          }
        }
      }

      // Migrate Sales
      if (data.sales && data.sales.length > 0) {
        console.log(`Migrating ${data.sales.length} sales records...`)
        for (const sale of data.sales) {
          if (sale) {
            await SalesService.createSale(sale as Parameters<typeof SalesService.createSale>[0])
          }
        }
      }

      // Migrate Credit Entries
      if (data.creditEntries && data.creditEntries.length > 0) {
        console.log(`Migrating ${data.creditEntries.length} credit entries...`)
        for (const entry of data.creditEntries) {
          if (entry) {
            await LedgerService.createCreditEntry(entry as Parameters<typeof LedgerService.createCreditEntry>[0])
          }
        }
      }

      // Migrate Debit Entries
      if (data.debitEntries && data.debitEntries.length > 0) {
        console.log(`Migrating ${data.debitEntries.length} debit entries...`)
        for (const entry of data.debitEntries) {
          if (entry) {
            await LedgerService.createDebitEntry(entry as Parameters<typeof LedgerService.createDebitEntry>[0])
          }
        }
      }

      // Add more migrations for other data types as needed

      console.log('Data migration completed successfully!')
      
    } catch (error) {
      console.error('Error during data migration:', error)
      throw error
    }
  }

  // Complete migration process
  static async runMigration(websiteUrl?: string): Promise<void> {
    try {
      console.log('=== Starting Complete Data Migration ===')
      
      // Step 1: Initialize database
      await this.initializeDatabase()
      
      // Step 2: Fetch existing data
      const rawData = await this.fetchExistingData(websiteUrl)
      
      // Step 3: Transform data
      const transformedData = this.transformData(rawData as Record<string, unknown>)
      
      // Step 4: Migrate to Firebase
      await this.migrateData(transformedData)
      
      console.log('=== Migration Completed Successfully ===')
      
    } catch (error) {
      console.error('=== Migration Failed ===', error)
      throw error
    }
  }

  // Create sample data for testing
  static async createSampleData(): Promise<void> {
    console.log('Creating sample data for testing...')
    
    try {
      // Sample Product
      await ProductService.createProduct({
        name: 'Premium Cotton Fabric',
        code: 'FAB001',
        fabricType: 'Cotton',
        fabricColor: 'White',
        fabricPattern: 'Solid',
        fabricWeight: '150',
        fabricWidth: '44',
        fabricLength: '10',
        size: 'Per Yard',
        purchaseCost: 50,
        minSalePrice: 80,
        maxSalePrice: 120,
        currentPrice: 100,
        stock: 100,
        minStock: 10,
        maxStock: 500,
        supplier: 'Fabric Supplier Co.',
        batchInfo: 'Batch-001',
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0]
      })

      // Sample Employee
      await EmployeeService.createEmployee({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        position: 'Sales Manager',
        department: 'Sales',
        joinDate: '2024-01-01',
        salary: 50000,
        commission: 5,
        status: 'active',
        address: '123 Main St',
        emergencyContact: '+1234567891',
        bankAccount: 'ACC123456',
        cnic: '12345-1234567-1'
      })

      console.log('Sample data created successfully!')
      
    } catch (error) {
      console.error('Error creating sample data:', error)
      throw error
    }
  }
}

export default DataMigrationService

// Usage example:
// To run migration: DataMigrationService.runMigration()
// To create sample data: DataMigrationService.createSampleData()
