"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type UserRole } from "@/contexts/auth-context"

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackPath?: string
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = "/not-authorized" 
}: RoleProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not logged in, redirect to login
        router.push("/sign-in")
        return
      }

      if (!allowedRoles.includes(user.role)) {
        // User doesn't have required role, redirect to not-authorized
        router.push(fallbackPath)
        return
      }
    }
  }, [user, loading, allowedRoles, fallbackPath, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Don't render children if user is not authenticated or doesn't have required role
  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

// Convenience components for specific roles
export function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      {children}
    </RoleProtectedRoute>
  )
}

export function CashierOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={["cashier"]}>
      {children}
    </RoleProtectedRoute>
  )
}

export function AdminOrCashierRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "cashier"]}>
      {children}
    </RoleProtectedRoute>
  )
}
