"use client"

import React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import AuthService from "@/lib/auth-service"
import { InvoiceCounterService } from "@/lib/invoice-counter-service"
import { UserService } from "@/lib/user-service"

export type UserRole = "admin" | "cashier"

interface LocalUser {
  email: string
  displayName: string
  uid: string
  role: UserRole
}

interface AuthContextType {
  user: LocalUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [loading, setLoading] = useState(true) // Start with loading true to prevent flash
  const { toast } = useToast()

  // Fast session restoration - check localStorage first, then initialize services
  useEffect(() => {
    const init = async () => {
      try {
        // First, quickly check for existing session in localStorage
        const savedRole = localStorage.getItem('userRole') as UserRole
        const savedUser = localStorage.getItem('auth_state')
        
        if (savedUser && savedRole) {
          try {
            const userData = JSON.parse(savedUser)
            setUser({
              email: userData.email,
              displayName: userData.name,
              uid: userData.id,
              role: savedRole,
            })
            
            // Small delay to prevent flash, then set loading false
            setTimeout(() => setLoading(false), 100)
            
            // Initialize services in background after user is set
            Promise.all([
              UserService.initializeDefaultUsers(),
              AuthService.initializeDefaultUser(),
              InvoiceCounterService.initializeCounter()
            ]).catch(e => console.warn("Background initialization failed", e))
            
            return
          } catch (e) {
            console.warn("Failed to parse saved user data", e)
            localStorage.removeItem('userRole')
            localStorage.removeItem('auth_state')
          }
        }
        
        // If no saved session, check AuthService fallback
        const state = AuthService.getAuthState()
        if (state.isAuthenticated && state.user) {
          const userRole = savedRole || 'admin'
          
          setUser({
            email: state.user.email,
            displayName: state.user.name,
            uid: state.user.id,
            role: userRole,
          })
          
          // Small delay to prevent flash, then set loading false
          setTimeout(() => setLoading(false), 100)
          
          // Initialize services in background
          Promise.all([
            UserService.initializeDefaultUsers(),
            InvoiceCounterService.initializeCounter()
          ]).catch(e => console.warn("Background initialization failed", e))
          
          return
        }
        
        // No existing session - initialize services and show sign-in
        await Promise.all([
          UserService.initializeDefaultUsers(),
          AuthService.initializeDefaultUser(),
          InvoiceCounterService.initializeCounter()
        ])
        
      } catch (e) {
        console.warn("Auth init failed", e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      // First try UserService authentication
      const userData = await UserService.authenticateUser(email, password)
      
      if (userData) {
        // User found in UserService, use their role
        localStorage.setItem('userRole', userData.role)
        
        // Save user data to localStorage for session persistence
        localStorage.setItem('auth_state', JSON.stringify({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        }))
        
        setUser({
          email: userData.email,
          displayName: userData.name,
          uid: userData.id,
          role: userData.role,
        })
        
        const roleText = userData.role === 'admin' ? 'Administrator' : 'Cashier'
        toast({ title: "Welcome back!", description: `Signed in as ${userData.name} (${roleText}).` })
        return
      }

      // Fallback to AuthService for backward compatibility
      const state = await AuthService.login(email, password)
      if (state.isAuthenticated && state.user) {
        // Determine user role based on email or default to admin
        let userRole: UserRole = 'admin'
        
        // Check if this is a cashier account (you can modify this logic)
        if (email.includes('cashier') || email.includes('pos')) {
          userRole = 'cashier'
        }
        
        // Save role to localStorage
        localStorage.setItem('userRole', userRole)
        
        setUser({
          email: state.user.email,
          displayName: state.user.name,
          uid: state.user.id,
          role: userRole,
        })
        
        const roleText = userRole === 'admin' ? 'Administrator' : 'Cashier'
        toast({ title: "Welcome back!", description: `Signed in as ${state.user.name} (${roleText}).` })
      }
    } catch (error: unknown) {
      toast({ title: "Sign In Failed", description: "Invalid email or password", variant: "destructive" })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to change password", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      
      // First verify current password by attempting to authenticate
      const userData = await UserService.getUserByEmail(user.email)
      if (!userData) {
        toast({ title: "Error", description: "User not found", variant: "destructive" })
        return
      }

      // Verify current password
      const bcrypt = (await import('bcryptjs')).default
      const isValidPassword = await bcrypt.compare(currentPassword, userData.password)
      if (!isValidPassword) {
        toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" })
        return
      }

      // Change password in database
      await UserService.changePassword(user.uid, newPassword)
      
      toast({ title: "Success", description: "Password changed successfully" })
    } catch (error) {
      console.error("Password change failed:", error)
      toast({ 
        title: "Error", 
        description: "Failed to change password. Please try again.", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      AuthService.logout()
      localStorage.removeItem('userRole')
      localStorage.removeItem('auth_state')
      setUser(null)
      toast({ title: "Signed Out", description: "You have been successfully signed out" })
    } catch (error: unknown) {
      toast({ title: "Sign Out Failed", description: "Sign out failed", variant: "destructive" })
      throw error
    } finally {
      setLoading(false)
    }
  }


  const hasRole = (role: UserRole): boolean => {
    return user?.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false
  }

  const value = { user, loading, signIn, logout, changePassword, hasRole, hasAnyRole }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}