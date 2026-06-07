import { ref, get, set, runTransaction } from 'firebase/database'
import { db } from './firebase'

export class SalesCounterService {
  private static readonly COUNTER_PATH = 'system/salesCounter'
  private static readonly STARTING_NUMBER = 1
  private static readonly MAX_NUMBER = 999999

  /**
   * Get the next sales ID in sequence (sale_001, sale_002, etc.)
   * This method is thread-safe and handles concurrent access
   */
  static async getNextSalesId(): Promise<string> {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const counterRef = ref(db, this.COUNTER_PATH)

    try {
      // Use Firebase transaction to ensure atomic increment
      const result = await runTransaction(counterRef, (currentValue: number | null) => {
        // If counter doesn't exist or is invalid, start from 1
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
        const salesNumber = result.snapshot.val()
        return `sale_${String(salesNumber).padStart(3, "0")}`
      } else {
        throw new Error('Failed to generate sales ID - transaction not committed')
      }
    } catch (error) {
      console.error('Error generating sales ID:', error)
      throw new Error('Failed to generate sales ID')
    }
  }

  /**
   * Get the current sales counter value without incrementing
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
      console.error('Error getting current sales counter:', error)
      return this.STARTING_NUMBER - 1
    }
  }

  /**
   * Reset the sales counter to starting value
   * Use with caution - this should only be used for testing or system reset
   */
  static async resetCounter(): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized')
    }

    try {
      await set(ref(db, this.COUNTER_PATH), this.STARTING_NUMBER - 1)
    } catch (error) {
      console.error('Error resetting sales counter:', error)
      throw new Error('Failed to reset sales counter')
    }
  }

  /**
   * Set the sales counter to a specific value
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
      console.error('Error setting sales counter:', error)
      throw new Error('Failed to set sales counter')
    }
  }

  /**
   * Initialize the sales counter if it doesn't exist
   * This should be called during system initialization
   */
  static async initializeCounter(): Promise<void> {
    if (!db) {
      console.warn('Database not initialized, skipping sales counter initialization')
      return
    }

    try {
      const snapshot = await get(ref(db, this.COUNTER_PATH))
      
      if (!snapshot.exists()) {
        await set(ref(db, this.COUNTER_PATH), this.STARTING_NUMBER - 1)
        console.log('Sales counter initialized to', this.STARTING_NUMBER - 1)
      }
    } catch (error) {
      console.error('Error initializing sales counter:', error)
    }
  }
}
