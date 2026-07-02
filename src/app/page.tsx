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
import CustomerManagement from "@/components/customer-management"
import { DailyExpenseManagement } from "@/components/daily-expense-management"
import { MonthlyExpenseManagement } from "@/components/monthly-expense-management"
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
import AccountPayableManagement from "@/components/account-payable-management"
import AccountReceivableManagement from "@/components/account-receivable-management"
import { PettyCashModule } from "@/components/petty-cash-module"
import { WarehouseManagement } from "@/components/warehouse-management"
import { SecurityCenter } from "@/components/security-center"
import { AutomatedProcurement } from "@/components/automated-procurement"
import { InsightsDashboard } from "@/components/insights-dashboard"
import { GeneralLedgerManagement } from "@/components/general-ledger-management"

// import Dashboard from "@/components/dashboard"
// import { POSModule } from "@/components/pos-module"
// import { ProductManagement } from "@/components/product-management"
// import { InventoryManagement } from "@/components/inventory-management"
// import { BargainingTracker } from "@/components/bargaining-tracker"
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
// import { AppSidebar } from "@/components/app-sidebar"
// import { EmployeeManagement } from "@/components/employee-management"
// import { ReportsModule } from "@/components/reports-module"
// import { DisposalModule } from "@/components/disposal-module"
// import { SalesLedger } from "@/components/sales-ledger"
// import { CustomerManagement } from "@/components/customer-management"
// import { DailyExpenseManagement } from "@/components/daily-expense-management"
// import { MonthlyExpenseManagement } from "@/components/monthly-expense-management"
// import { PurchasingModule } from "@/components/purchasing-module"
// import { PurchasingLedger } from "@/components/purchasing-ledger"
// import { SupplierManagement } from "@/components/supplier-management"
// import { RoleManagement } from "@/components/role-management"
// import { Button } from "@/components/ui/button"
// import { ProtectedRoute } from "@/components/auth/protected-route"
// import { RoleProtectedRoute } from "@/components/auth/role-protected-route"
// import { useAuth } from "@/contexts/auth-context"
// import { LogOut, User, RefreshCw } from "lucide-react"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { ThemeToggle } from "@/components/theme-toggle"
// import { ChangePasswordModal } from "@/components/profile/change-password-modal"
// import { CacheManager } from "@/components/cache-manager"
// import Image from "next/image"
// import Link from "next/link"
// import AllPaymentsPage from "@/app/all-payments/page"
// import { AccountPayableManagement } from "@/components/account-payable-management"
// import { PettyCashModule } from "@/components/petty-cash-module"
// import { WarehouseManagement } from "@/components/warehouse-management"
// import { SecurityCenter } from "@/components/security-center"
// import { AutomatedProcurement } from "@/components/automated-procurement"
// import { InsightsDashboard } from "@/components/insights-dashboard"



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
      case "monthly-expenses":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <MonthlyExpenseManagement />
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
      case "petty-cash":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <PettyCashModule />
          </RoleProtectedRoute>
        )
      case "warehouse-management":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <WarehouseManagement />
          </RoleProtectedRoute>
        )
      case "security-center":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <SecurityCenter />
          </RoleProtectedRoute>
        )
      case "automated-procurement":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <AutomatedProcurement />
          </RoleProtectedRoute>
        )
      case "insights":
        return <InsightsDashboard />
      case "account-payable":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <AccountPayableManagement />
          </RoleProtectedRoute>
        )
      case "account-receivable":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <AccountReceivableManagement />
          </RoleProtectedRoute>
        )
      case "general-ledger":
        return (
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <GeneralLedgerManagement />
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

  // Map module IDs to readable names for breadcrumb
  const moduleLabels: Record<string, string> = {
    pos: "Point of Sale", purchasing: "Purchasing", "sales-ledger": "Sales Ledger",
    "purchasing-ledger": "Purchasing Ledger", products: "Products & Pricing",
    inventory: "Inventory Management", bargaining: "Bargaining Tracker",
    employees: "Employee Management", "role-management": "Role Management",
    reports: "Reports & Analytics", "customer-management": "Customer Management",
    "client-management": "Client Management",
    "daily-expenses": "Daily Expenses", disposal: "Credit Node (Returns)",
    dashboard: "Dashboard", "all-payments": "All Payments", "supplier-management": "Supplier Management",
    "petty-cash": "Petty Cash", "automated-procurement": "Automated Procurement", "insights": "Insights Dashboard",
    "general-ledger": "General Ledger Management",
  }

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar activeModule={activeModule} setActiveModule={setActiveModule} />

        <main className="flex-1 overflow-hidden relative"
          style={{
            background: "radial-gradient(ellipse at top left, rgba(79,70,229,0.05) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(6,182,212,0.05) 0%, transparent 50%)"
          }}
        >
          {/* ── Premium Header ─────────────────────── */}
          <header className="premium-header flex h-16 items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="rounded-lg hover:bg-muted/60 transition-colors duration-200" />

              {/* Separator */}
              <div className="hidden sm:block h-6 w-px bg-border/60" />

              {/* Logo + brand */}
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-border/60 shadow-sm flex-shrink-0">
                  <Image src="/bs.jpg" alt="Bin Sultan Logo" fill className="object-cover" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-bold text-foreground leading-none">Bin Sultan Fabrics</span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {moduleLabels[activeModule] || "Management System"}
                  </span>
                </div>
              </div>

              {/* Active module badge */}
              <div className="hidden md:flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary">
                  {moduleLabels[activeModule] || "Dashboard"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 rounded-xl border-border/60 bg-card/60
                                 shadow-sm backdrop-blur-sm transition-all duration-200
                                 hover:-translate-y-0.5 hover:bg-card hover:shadow-md hover:border-primary/30"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">
                        {user.displayName || user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-60 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-xl p-1"
                  >
                    {/* User info header */}
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 mb-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {user.displayName || user.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.role === "admin" ? "Administrator" : "Cashier"}
                        </span>
                      </div>
                    </div>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem
                      onClick={() => setShowChangePasswordModal(true)}
                      className="rounded-xl px-3 py-2 cursor-pointer hover:bg-accent/40 transition-colors duration-150"
                    >
                      <User className="mr-2.5 h-4 w-4 text-muted-foreground" />
                      Change Password
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setShowCacheManager(true)}
                      className="rounded-xl px-3 py-2 cursor-pointer hover:bg-accent/40 transition-colors duration-150"
                    >
                      <RefreshCw className="mr-2.5 h-4 w-4 text-muted-foreground" />
                      Clear Cache
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="rounded-xl px-3 py-2 cursor-pointer text-destructive hover:bg-destructive/10 transition-colors duration-150"
                    >
                      <LogOut className="mr-2.5 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" asChild
                  className="rounded-xl hover:scale-105 transition-transform duration-200">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              )}
            </div>
          </header>

          {/* ── Module content ──────────────────────── */}
          <div className="flex-1 overflow-auto p-4 lg:p-6 pb-8">
            {renderModule()}
          </div>
        </main>

        <ChangePasswordModal
          open={showChangePasswordModal}
          onOpenChange={setShowChangePasswordModal}
        />

        {showCacheManager && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <CacheManager showDebugInfo={true} />
              <div className="p-4 border-t border-border">
                <Button onClick={() => setShowCacheManager(false)} className="w-full rounded-xl" variant="outline">
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