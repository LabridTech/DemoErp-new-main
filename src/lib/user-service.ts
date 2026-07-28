import bcrypt from 'bcryptjs'
import { ref, get, set, push, update, remove } from 'firebase/database'
import { db } from './firebase'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: "admin" | "cashier"
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  role: "admin" | "cashier"
}

export interface UpdateUserData {
  name?: string
  email?: string
  role?: "admin" | "cashier"
}

class UserServiceClass {
  private usersPath = 'users'

  constructor() {
    // Initialize with default admin user if no users exist (non-blocking)
    this.initializeDefaultUsers().catch(e => console.warn("UserService init failed", e))
  }

  async initializeDefaultUsers() {
    try {
      // Check if we already have users
      const usersRef = ref(db, this.usersPath)
      const snapshot = await get(usersRef)
      
      if (!snapshot.exists()) {
        // Create default admin user
        const hashedPassword = await bcrypt.hash("Ahmer1122", 10)
        const defaultAdmin = {
          name: process.env.NEXT_PUBLIC_SINGLE_USER_NAME || "Admin User",
          email: process.env.NEXT_PUBLIC_SINGLE_USER_EMAIL || "ahmer@food.com",
          password: hashedPassword,
          role: "admin",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
        
        // Generate a unique ID for the admin user
        const adminId = 'admin-' + Date.now()
        await set(ref(db, `${this.usersPath}/${adminId}`), defaultAdmin)
      } else {
        // If users exist, check if ahmer@food.com exists. If not, add him.
        const users = snapshot.val()
        const expectedEmail = process.env.NEXT_PUBLIC_SINGLE_USER_EMAIL || "ahmer@food.com"
        const hasAhmer = Object.values(users).some((u: any) => u.email === expectedEmail)
        
        if (!hasAhmer) {
          const hashedPassword = await bcrypt.hash("Ahmer1122", 10)
          const defaultAdmin = {
            name: process.env.NEXT_PUBLIC_SINGLE_USER_NAME || "Admin User",
            email: expectedEmail,
            password: hashedPassword,
            role: "admin",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          }
          const adminId = 'admin-' + Date.now()
          await set(ref(db, `${this.usersPath}/${adminId}`), defaultAdmin)
        }
      }
    } catch (error) {
      console.error("Error initializing default users:", error)
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Check if user already exists
      const usersRef = ref(db, this.usersPath)
      const snapshot = await get(usersRef)
      
      if (snapshot.exists()) {
        const users = snapshot.val()
        const existingUser = Object.values(users).find((user: unknown) => (user as { email: string }).email === userData.email)
        if (existingUser) {
          throw new Error("User with this email already exists")
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      // Create new user in Realtime Database
      const userDoc = {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Generate unique ID and save user
      const newUserRef = push(ref(db, this.usersPath))
      const userId = newUserRef.key!
      await set(newUserRef, userDoc)
      
      return {
        id: userId,
        name: userData.name,
        email: userData.email,
        password: "***", // Hide password in response
        role: userData.role,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt
      }
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = ref(db, this.usersPath)
      const snapshot = await get(usersRef)
      
      if (!snapshot.exists()) {
        return []
      }

      const users = snapshot.val()
      return Object.entries(users)
        .map(([id, userData]: [string, unknown]) => {
          const user = userData as { name: string; email: string; role: "admin" | "cashier"; createdAt: string; updatedAt: string; lastLogin?: string }
          return {
            id,
            name: user.name,
            email: user.email,
            password: "***", // Hide password
            role: user.role,
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: user.updatedAt || new Date().toISOString(),
            lastLogin: user.lastLogin
          }
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error("Error getting users:", error)
      throw error
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const userRef = ref(db, `${this.usersPath}/${id}`)
      const snapshot = await get(userRef)
      
      if (!snapshot.exists()) return null

      const userData = snapshot.val()
      return {
        id,
        name: userData.name,
        email: userData.email,
        password: "***", // Hide password
        role: userData.role,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
        lastLogin: userData.lastLogin
      }
    } catch (error) {
      console.error("Error getting user by ID:", error)
      throw error
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersRef = ref(db, this.usersPath)
      const snapshot = await get(usersRef)
      
      if (!snapshot.exists()) return null

      const users = snapshot.val()
      const userEntry = Object.entries(users).find(([, userData]: [string, unknown]) => (userData as { email: string }).email === email)
      
      if (!userEntry) return null

      const [id, userData] = userEntry
      const user = userData as { name: string; email: string; password: string; role: "admin" | "cashier"; createdAt: string; updatedAt: string; lastLogin?: string }
      return {
        id,
        name: user.name,
        email: user.email,
        password: user.password, // Return password for authentication
        role: user.role,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString(),
        lastLogin: user.lastLogin
      }
    } catch (error) {
      console.error("Error getting user by email:", error)
      throw error
    }
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    try {
      const userRef = ref(db, `${this.usersPath}/${id}`)
      const snapshot = await get(userRef)
      
      if (!snapshot.exists()) {
        throw new Error("User not found")
      }

      const updateData: Record<string, unknown> = {
        ...userData,
        updatedAt: new Date().toISOString()
      }

      await update(userRef, updateData)

      // Return updated user
      const updatedSnapshot = await get(userRef)
      const updatedUserData = updatedSnapshot.val()
      
      return {
        id,
        name: updatedUserData.name,
        email: updatedUserData.email,
        password: "***", // Hide password
        role: updatedUserData.role,
        createdAt: updatedUserData.createdAt || new Date().toISOString(),
        updatedAt: updatedUserData.updatedAt || new Date().toISOString(),
        lastLogin: updatedUserData.lastLogin
      }
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const userRef = ref(db, `${this.usersPath}/${id}`)
      const snapshot = await get(userRef)
      
      if (!snapshot.exists()) {
        throw new Error("User not found")
      }

      const user = snapshot.val()

      // Prevent deleting the last admin
      if (user.role === "admin") {
        const usersRef = ref(db, this.usersPath)
        const allUsersSnapshot = await get(usersRef)
        
        if (allUsersSnapshot.exists()) {
          const allUsers = allUsersSnapshot.val()
          const adminUsers = Object.values(allUsers).filter((u: unknown) => (u as { role: string }).role === "admin")
          
          if (adminUsers.length <= 1) {
            throw new Error("Cannot delete the last admin user")
          }
        }
      }

      await remove(userRef)
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email)
      if (!user) return null

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) return null

      // Update last login
      const userRef = ref(db, `${this.usersPath}/${user.id}`)
      await update(userRef, {
        lastLogin: new Date().toISOString()
      })

      return {
        ...user,
        password: "***" // Hide password in response
      }
    } catch (error) {
      console.error("Error authenticating user:", error)
      throw error
    }
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      const userRef = ref(db, `${this.usersPath}/${userId}`)
      
      await update(userRef, {
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error("Error changing password:", error)
      throw error
    }
  }
}

export const UserService = new UserServiceClass()