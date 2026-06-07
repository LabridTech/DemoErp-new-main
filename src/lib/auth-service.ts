// Custom Authentication Service
// Stores user credentials in Firebase Realtime Database instead of Firebase Auth

import { ref, get, set } from "firebase/database"
import { db } from "./firebase"

export interface User {
  id: string
  email: string
  name: string
  password: string // In production, this should be hashed
  role: "admin"
  createdAt: string
  lastLogin?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: Omit<User, 'password'> | null
}

class AuthService {
  private static readonly STORAGE_KEY = 'auth_state'
  private static readonly USERS_PATH = 'users'

  // Initialize default admin user in database
  static async initializeDefaultUser(): Promise<void> {
    if (!db) {
      console.warn('Database not initialized')
      return
    }

    try {
      const usersRef = ref(db, this.USERS_PATH)
      const snapshot = await get(usersRef)
      
      // If no users exist, create the default admin user
      if (!snapshot.exists()) {
        const defaultUser: User = {
          id: 'admin-001',
          email: process.env.NEXT_PUBLIC_SINGLE_USER_EMAIL || 'ahmer@food.com',
          name: process.env.NEXT_PUBLIC_SINGLE_USER_NAME || 'Admin User',
          password: 'Ahmer1122', // In production, hash this password
          role: 'admin',
          createdAt: new Date().toISOString()
        }

        await set(ref(db, `${this.USERS_PATH}/${defaultUser.id}`), defaultUser)
        console.log('Default admin user created')
      }
    } catch (error) {
      console.error('Error initializing default user:', error)
    }
  }

  // Login with email and password
  static async login(email: string, password: string): Promise<AuthState> {
    console.log('🔐 Login attempt:', { email, password: '***' })
    
    if (!db) {
      console.error('❌ Database not initialized')
      throw new Error('Database not initialized')
    }
    console.log('✅ Database is initialized')

    try {
      const usersRef = ref(db, this.USERS_PATH)
      console.log('📍 Fetching users from path:', this.USERS_PATH)
      
      const snapshot = await get(usersRef)
      console.log('📊 Snapshot exists:', snapshot.exists())
      
      if (!snapshot.exists()) {
        console.error('❌ No users found in database')
        throw new Error('No users found in database')
      }

      const users = snapshot.val() as Record<string, User>
      console.log('👥 Users found:', Object.keys(users))
      console.log('🔍 Looking for user with email:', email)
      
      // Debug: Log all users for comparison
      Object.values(users).forEach(u => {
        console.log(`📋 User: ${u.email} (${u.name}) - Password match: ${u.password === password}`)
      })
      
      const user = Object.values(users).find(u => {
        const emailMatch = u.email.toLowerCase() === email.toLowerCase()
        const passwordMatch = u.password === password
        console.log(`🔎 Checking ${u.email}: email=${emailMatch}, password=${passwordMatch}`)
        return emailMatch && passwordMatch
      })

      if (!user) {
        console.error('❌ User not found or password mismatch')
        throw new Error('Invalid email or password')
      }
      
      console.log('✅ User authenticated:', user.name)

      // Update last login
      await set(ref(db, `${this.USERS_PATH}/${user.id}/lastLogin`), new Date().toISOString())

      const authState: AuthState = {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: new Date().toISOString()
        }
      }

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authState))
        console.log('💾 Auth state saved to localStorage')
      }

      console.log('🎉 Login successful')
      return authState
    } catch (error) {
      console.error('💥 Login error:', error)
      throw error
    }
  }

  // Logout
  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  // Get current auth state from localStorage
  static getAuthState(): AuthState {
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, user: null }
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as AuthState
      }
    } catch (error) {
      console.error('Error reading auth state:', error)
    }

    return { isAuthenticated: false, user: null }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getAuthState().isAuthenticated
  }

  // Get current user
  static getCurrentUser(): Omit<User, 'password'> | null {
    return this.getAuthState().user
  }

  // Validate session (optional - for additional security)
  static async validateSession(): Promise<boolean> {
    const authState = this.getAuthState()
    if (!authState.isAuthenticated || !authState.user) {
      return false
    }

    // You can add additional validation here, like checking if user still exists in database
    return true
  }
}

export default AuthService
