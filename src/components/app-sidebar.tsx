"use client"

import React from "react"

import {
  BarChart3, ShoppingCart, Package, Users, FileText, Trash2,
  TrendingDown, Warehouse, User, Receipt, ShoppingBag, Building2,
  FileSpreadsheet, Shield, CreditCard, Sparkles, ArrowLeftRight
} from "lucide-react"
import { Calendar } from "lucide-react"

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
} from "@/components/ui/sidebar"

import Image from "next/image"
import { useAuth, type UserRole } from "@/contexts/auth-context"

interface MenuItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  id: string
  allowedRoles: UserRole[]
}

const salesAndPurchasingItems: MenuItem[] = [
  { title: "POS System", icon: ShoppingCart, id: "pos", allowedRoles: ["admin", "cashier"] },
  { title: "Purchasing", icon: ShoppingBag, id: "purchasing", allowedRoles: ["admin"] },
  { title: "Sales Ledger", icon: FileText, id: "sales-ledger", allowedRoles: ["admin", "cashier"] },
  { title: "Purchasing Ledger", icon: FileSpreadsheet, id: "purchasing-ledger", allowedRoles: ["admin"] },
  { title: "Customer Management", icon: User, id: "customer-management", allowedRoles: ["admin"] },
  { title: "Supplier Management", icon: Building2, id: "supplier-management", allowedRoles: ["admin"] },
  { title: "All Payments", icon: CreditCard, id: "all-payments", allowedRoles: ["admin"] },
  { title: "Automated Procurement", icon: Sparkles, id: "automated-procurement", allowedRoles: ["admin"] },
]

const inventoryItems: MenuItem[] = [
  { title: "Products & Pricing", icon: Package, id: "products", allowedRoles: ["admin", "cashier"] },
  { title: "Inventory Management", icon: Warehouse, id: "inventory", allowedRoles: ["admin"] },
  { title: "Warehouse Management", icon: ArrowLeftRight, id: "warehouse-management", allowedRoles: ["admin"] },
  { title: "Bargaining Tracker", icon: TrendingDown, id: "bargaining", allowedRoles: ["admin"] },
  { title: "Credit Node (Returns)", icon: Trash2, id: "disposal", allowedRoles: ["admin"] },
]

const financialItems: MenuItem[] = [
  { title: "Daily Expenses", icon: Receipt, id: "daily-expenses", allowedRoles: ["admin"] },
  { title: "Monthly Expenses", icon: Calendar, id: "monthly-expenses", allowedRoles: ["admin"] },
  { title: "Petty Cash", icon: Receipt, id: "petty-cash", allowedRoles: ["admin"] },
  { title: "Account Payable", icon: CreditCard, id: "account-payable", allowedRoles: ["admin"] },
  { title: "Account Receivable", icon: CreditCard, id: "account-receivable", allowedRoles: ["admin"] },
];


const managementItems: MenuItem[] = [
  { title: "Employee Management", icon: Users, id: "employees", allowedRoles: ["admin"] },
  { title: "Role Management", icon: Shield, id: "role-management", allowedRoles: ["admin"] },
  { title: "Security Center", icon: Shield, id: "security-center", allowedRoles: ["admin"] },
]

const analyticsItems: MenuItem[] = [
  { title: "Dashboard", icon: BarChart3, id: "dashboard", allowedRoles: ["admin", "cashier"] },
  { title: "Insights", icon: BarChart3, id: "insights", allowedRoles: ["admin", "cashier"] },
  { title: "Reports & Analytics", icon: BarChart3, id: "reports", allowedRoles: ["admin"] },
]

const filterMenuItemsByRole = (items: MenuItem[], userRole: UserRole): MenuItem[] =>
  items.filter((item) => item.allowedRoles.includes(userRole))

interface AppSidebarProps {
  activeModule: string
  setActiveModule: (module: string) => void
}

/* ── Shared menu renderer ─────────────────────────────── */
function MenuSection({
  label,
  items,
  activeModule,
  setActiveModule,
}: {
  label: string
  items: MenuItem[]
  activeModule: string
  setActiveModule: (m: string) => void
}) {
  if (!items.length) return null
  return (
    <SidebarGroup className="px-2 py-1">
      <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-0.5">
          {items.map((item) => {
            const isActive = activeModule === item.id
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => setActiveModule(item.id)}
                  isActive={isActive}
                  className={`
                    group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                    text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "sidebar-item-active"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }
                  `}
                >
                  {/* Active indicator stripe */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
                  )}
                  <item.icon
                    className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      }`}
                  />
                  <span>{item.title}</span>

                  {/* Hover shimmer */}
                  {!isActive && (
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                     bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar({ activeModule, setActiveModule }: AppSidebarProps) {
  const { user } = useAuth()
  const role = user?.role || "admin"

  const filteredAnalytics = filterMenuItemsByRole(analyticsItems, role)
  const filteredSales = filterMenuItemsByRole(salesAndPurchasingItems, role)
  const filteredInventory = filterMenuItemsByRole(inventoryItems, role)
  const filteredFinancial = filterMenuItemsByRole(financialItems, role)
  const filteredManagement = filterMenuItemsByRole(managementItems, role)

  return (
    <Sidebar className="md:p-2">
      {/* ── Header ──────────────────────────────────── */}
      <SidebarHeader className="rounded-2xl border border-sidebar-border/70 bg-sidebar/95 backdrop-blur-sm mb-2">
        <div className="flex items-center gap-3 px-4 py-4">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-secondary/30 blur-md" />
            <div className="relative h-11 w-11 rounded-xl border border-primary/20 overflow-hidden shadow-lg">
              <Image
                src="/bs.jpg"
                alt="Bin Sultan Logo"
                fill
                className="object-cover"
              />
            </div>
            {/* Online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-sidebar ring-1 ring-emerald-400/50" />
          </div>

          {/* Brand text */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">Bin Sultan ERP</span>
            <span className="text-xs text-muted-foreground truncate">Fabrics Management</span>
            {user && (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold
                               bg-gradient-to-r from-primary/15 to-secondary/15 text-primary
                               border border-primary/20 px-2 py-0.5 rounded-full w-fit">
                <Sparkles className="h-2.5 w-2.5" />
                {user.role === "admin" ? "Administrator" : "Cashier"}
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>

      {/* ── Navigation content ──────────────────────── */}
      <SidebarContent
        className="pb-16 sidebar-scrollbar rounded-2xl border border-sidebar-border/70
                   bg-sidebar/80 backdrop-blur-sm"
      >
        <div className="pt-2 space-y-1">
          <MenuSection label="Analytics" items={filteredAnalytics} activeModule={activeModule} setActiveModule={setActiveModule} />
          <MenuSection label="Sales & Purchasing" items={filteredSales} activeModule={activeModule} setActiveModule={setActiveModule} />
          <MenuSection label="Inventory" items={filteredInventory} activeModule={activeModule} setActiveModule={setActiveModule} />
          <MenuSection label="Financial" items={filteredFinancial} activeModule={activeModule} setActiveModule={setActiveModule} />
          <MenuSection label="Management" items={filteredManagement} activeModule={activeModule} setActiveModule={setActiveModule} />
        </div>

        {/* Bottom branding */}
        <div className="mx-3 mb-3 mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
            Powered by LabridTech
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}