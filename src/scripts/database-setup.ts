// Database Setup and Initialization Script
// Run this script to set up your Firebase database with the proper structure

import AuthService from '../lib/auth-service'
import DataMigrationService from './data-migration'
import { InvoiceCounterService } from '../lib/invoice-counter-service'

export class DatabaseSetup {
  
  // Initialize the complete database structure
  static async setupDatabase(): Promise<void> {
    console.log('=== Firebase Database Setup Started ===')
    
    try {
      // Step 1: Initialize authentication with default user
      console.log('1. Setting up authentication...')
      await AuthService.initializeDefaultUser()
      
      // Step 2: Initialize invoice counter
      console.log('2. Initializing invoice counter...')
      await InvoiceCounterService.initializeCounter()
      
      // Step 3: Create sample data for testing
      console.log('3. Creating sample data...')
      await DataMigrationService.createSampleData()
      
      console.log('=== Database Setup Completed Successfully ===')
      console.log('')
      console.log('Your Firebase database is now ready!')
      console.log('Default login credentials:')
      console.log('Email: ahmer@food.com')
      console.log('Password: Ahmer1122')
      console.log('')
      console.log('Database structure includes:')
      console.log('- users (authentication)')
      console.log('- products')
      console.log('- employees') 
      console.log('- sales')
      console.log('- creditEntries')
      console.log('- debitEntries')
      console.log('- bargainRecords')
      console.log('- disposalRecords')
      console.log('- dailyExpenses')
      console.log('- attendance')
      console.log('- salaryRecords')
      console.log('- stockMovements')
      
    } catch (error) {
      console.error('=== Database Setup Failed ===')
      console.error(error)
      throw error
    }
  }

  // Run data migration from existing website
  static async migrateFromWebsite(websiteUrl: string = 'https://bin-sultan-fabrics.vercel.app'): Promise<void> {
    console.log('=== Starting Data Migration ===')
    
    try {
      await DataMigrationService.runMigration(websiteUrl)
      console.log('=== Migration Completed ===')
    } catch (error) {
      console.error('=== Migration Failed ===')
      console.error(error)
      throw error
    }
  }
}

// Export for use in other files
export default DatabaseSetup

// Usage:
// For initial setup: DatabaseSetup.setupDatabase()
// For migration: DatabaseSetup.migrateFromWebsite()
