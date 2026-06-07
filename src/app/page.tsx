"use client"

import { useState, useEffect } from "react"
import Dashboard from "@/components/dashboard"
import { POSModule } from "@/components/pos-module"
import { ProductManagement } from "@/components/product-management"
import { InventoryManagement } from "@/components/inventory-management"
import { BargainingTracker } from "@/components/bargaining-tracker"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { EmployeeManagement } from "@/components/employee-management"
import { ReportsModule } from "@/components/reports-module"
import { DisposalModule } from "@/components/disposal-module"
import { SalesLedger } from "@/components/sales-ledger"
import { CustomerManagement } from "@/components/customer-management"
import { DailyExpenseManagement } from "@/components/daily-expense-management"
import { PurchasingModule } from "@/components/purchasing-module"
import { PurchasingLedger } from "@/components/purchasing-ledger"
import { SupplierManagement } from "@/components/supplier-management"
import { RoleManagement } from "@/components/role-management"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { RoleProtectedRoute } from "@/components/auth/role-protected-route"
import { useAuth } from "@/contexts/auth-context"
import { LogOut, User, RefreshCw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChangePasswordModal } from "@/components/profile/change-password-modal"
import { CacheManager } from "@/components/cache-manager"
import Image from "next/image"
import Link from "next/link"
import AllPaymentsPage from "@/app/all-payments/page"

export default function ERPSystem() {
  const [activeModule, setActiveModule] = useState("pos")
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showCacheManager, setShowCacheManager] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const { user, logout } = useAuth()

  // Restore active module from localStorage on page load (synchronous for speed)
  useEffect(() => {
    try {
      const savedModule = localStorage.getItem('activeModule')
      if (savedModule) {
        setActiveModule(savedModule)
      }
    } catch (e) {
      console.warn("Failed to restore active module", e)
    } finally {
      setIsInitialized(true)
    }
  }, []) // Empty dependency array - only run once on mount

  // Save active module to localStorage when it changes (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('activeModule', activeModule)
    }
  }, [activeModule, isInitialized])


  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />
      case "pos":
        return <POSModule />
      case "purchasing":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <PurchasingModule defaultTab="purchase" />
          </RoleProtectedRoute>
        )
      case "supplier-management":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <SupplierManagement />
          </RoleProtectedRoute>
        )
      case "purchasing-ledger":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <PurchasingLedger />
          </RoleProtectedRoute>
        )
      case "products":
        return (
          <RoleProtectedRoute allowedRoles={["admin", "cashier"]}>
            <ProductManagement />
          </RoleProtectedRoute>
        )
      case "inventory":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <InventoryManagement />
          </RoleProtectedRoute>
        )
      case "bargaining":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <BargainingTracker />
          </RoleProtectedRoute>
        )
      case "employees":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <EmployeeManagement />
          </RoleProtectedRoute>
        )
      case "role-management":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <RoleManagement />
          </RoleProtectedRoute>
        )
      case "reports":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <ReportsModule />
          </RoleProtectedRoute>
        )
      case "customer-management":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <CustomerManagement />
          </RoleProtectedRoute>
        )
      case "daily-expenses":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <DailyExpenseManagement />
          </RoleProtectedRoute>
        )
      case "disposal":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <DisposalModule />
          </RoleProtectedRoute>
        )
      case "sales-ledger":
        return <SalesLedger />
      case "all-payments":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <AllPaymentsPage />
          </RoleProtectedRoute>
        )
      default:
        return <Dashboard />
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
        <main className="flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.06),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.08),_transparent_40%)]">
          <div className="flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-sm lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <Image src="/bs.jpg" alt="Bin Sultan Logo" className="h-10 w-10 rounded-xl border border-border object-cover shadow-sm" width={100} height={100} />
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-foreground">Bin Sultan Fabrics</h1>
                  <p className="text-xs text-muted-foreground">Smart Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-xl border-border/80 bg-card/70 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-card hover:shadow-md">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user.displayName || user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border border-border shadow-lg">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.displayName || user.email}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {user.role === 'admin' ? 'Administrator' : 'Cashier'}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)} className="hover:bg-accent/50">
                      <User className="mr-2 h-4 w-4" />
                      Change Password
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowCacheManager(true)} className="hover:bg-accent/50">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Clear Cache
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="hover:bg-accent/50">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" asChild className="hover:scale-105">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 lg:p-6 pb-8">{renderModule()}</div>
        </main>

        <ChangePasswordModal
          open={showChangePasswordModal}
          onOpenChange={setShowChangePasswordModal}
        />

        {showCacheManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <CacheManager showDebugInfo={true} />
              <div className="p-4 border-t">
                <Button
                  onClick={() => setShowCacheManager(false)}
                  className="w-full"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </SidebarProvider>
    </ProtectedRoute>
  )
}