import { ref, get, set, runTransaction } from 'firebase/database'
import { db } from './firebase'

export class InvoiceCounterService {
  private static readonly COUNTER_PATH = 'system/invoiceCounter'
  private static readonly STARTING_NUMBER = 500
  private static readonly MAX_NUMBER = 99999

  /**
   * Get the next invoice number in sequence
   * This method is thread-safe and handles concurrent access
   */
  static async getNextInvoiceNumber(): Promise<string> {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const counterRef = ref(db, this.COUNTER_PATH)

    try {
      // Use Firebase transaction to ensure atomic increment
      const result = await runTransaction(counterRef, (currentValue) => {
        // If counter doesn't exist or is invalid, start from 1000
        if (currentValue === null || typeof currentValue !== 'number' || currentValue < this.STARTING_NUMBER) {
          return this.STARTING_NUMBER
        }

        // If we've reached the maximum, wrap around to starting number
        if (currentValue >= this.MAX_NUMBER) {
          return this.STARTING_NUMBER
        }

        // Increment the counter
        return currentValue + 1
      })

      if (result.committed) {
        const invoiceNumber = result.snapshot.val()
        return invoiceNumber.toString()
      } else {
        throw new Error('Failed to generate invoice number - transaction not committed')
      }
    } catch (error) {
      console.error('Error generating invoice number:', error)
      throw new Error('Failed to generate invoice number')
    }
  }

  /**
   * Get the current invoice counter value without incrementing
   */
  static async getCurrentCounter(): Promise<number> {
    if (!db) {
      throw new Error('Database not initialized')
    }

    try {
      const snapshot = await get(ref(db, this.COUNTER_PATH))
      const currentValue = snapshot.val()
      
      if (currentValue === null || typeof currentValue !== 'number') {
        return this.STARTING_NUMBER - 1 // Return the number before starting
      }
      
      return currentValue
    } catch (error) {
      console.error('Error getting current counter:', error)
      return this.STARTING_NUMBER - 1
    }
  }

  /**
   * Reset the invoice counter to starting value
   * Use with caution - this should only be used for testing or system reset
   */
  static async resetCounter(): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized')
    }

    try {
      await set(ref(db, this.COUNTER_PATH), this.STARTING_NUMBER - 1)
    } catch (error) {
      console.error('Error resetting counter:', error)
      throw new Error('Failed to reset invoice counter')
    }
  }

  /**
   * Set the invoice counter to a specific value
   * Use with caution - this should only be used for migration or system setup
   */
  static async setCounter(value: number): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized')
    }

    if (value < this.STARTING_NUMBER || value > this.MAX_NUMBER) {
      throw new Error(`Counter value must be between ${this.STARTING_NUMBER} and ${this.MAX_NUMBER}`)
    }

    try {
      await set(ref(db, this.COUNTER_PATH), value)
    } catch (error) {
      console.error('Error setting counter:', error)
      throw new Error('Failed to set invoice counter')
    }
  }

  /**
   * Initialize the invoice counter if it doesn't exist
   * This should be called during system initialization
   */
  static async initializeCounter(): Promise<void> {
    if (!db) {
      console.warn('Database not initialized, skipping invoice counter initialization')
      return
    }

    try {
      const snapshot = await get(ref(db, this.COUNTER_PATH))
      
      if (!snapshot.exists()) {
        await set(ref(db, this.COUNTER_PATH), this.STARTING_NUMBER - 1)
        console.log('Invoice counter initialized to', this.STARTING_NUMBER - 1)
      }
    } catch (error) {
      console.error('Error initializing invoice counter:', error)
    }
  }
}
