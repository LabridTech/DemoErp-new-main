import { ref, get, set, runTransaction } from "firebase/database"
import { db } from "./firebase"

export class SupplierInvoiceCounterService {
  private static readonly COUNTER_PATH = "settings/supplierInvoiceCounter"
  private static readonly STARTING_NUMBER = 500
  private static readonly MAX_NUMBER = 99999

  static async getNextSupplierInvoiceNumber(): Promise<string> {
    if (!db) {
      throw new Error("Firebase not initialized")
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
        return `${invoiceNumber}-S`
      } else {
        throw new Error('Failed to generate supplier invoice number - transaction not committed')
      }
    } catch (error) {
      console.error("Error getting next supplier invoice number:", error)
      // Fallback to timestamp-based number
      const timestamp = Date.now()
      return `${timestamp}-S`
    }
  }

  static async getCurrentSupplierInvoiceNumber(): Promise<number> {
    if (!db) {
      throw new Error("Firebase not initialized")
    }

    try {
      const counterRef = ref(db, this.COUNTER_PATH)
      const snapshot = await get(counterRef)
      
      return snapshot.exists() ? snapshot.val() || 1000 : 1000
    } catch (error) {
      console.error("Error getting current supplier invoice number:", error)
      return 1000
    }
  }

  static async resetSupplierInvoiceCounter(startNumber: number = 1000): Promise<void> {
    if (!db) {
      throw new Error("Firebase not initialized")
    }

    try {
      const counterRef = ref(db, this.COUNTER_PATH)
      await set(counterRef, startNumber)
    } catch (error) {
      console.error("Error resetting supplier invoice counter:", error)
      throw error
    }
  }
}
