"use client"

import { BarChart3, ShoppingCart, Package, Users, FileText, Trash2, TrendingDown, Warehouse, User, Receipt, ShoppingBag, Building2, FileSpreadsheet, Shield, CreditCard } from "lucide-react"

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,  }
 from "@/components/ui/sidebar"

import Image from "next/image"
import { useAuth, type UserRole } from "@/contexts/auth-context"

// Menu item interface
interface MenuItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  id: string
  allowedRoles: UserRole[]
}

// Organized menu items by logical groups with role permissions
const salesAndPurchasingItems: MenuItem[] = [
  {
    title: "POS System",
    icon: ShoppingCart,
    id: "pos",
    allowedRoles: ["admin", "cashier"],
  },
  {
    title: "Purchasing",
    icon: ShoppingBag,
    id: "purchasing",
    allowedRoles: ["admin"],
  },
  {
    title: "Sales Ledger",
    icon: FileText,
    id: "sales-ledger",
    allowedRoles: ["admin", "cashier"],
  },
  {
    title: "Purchasing Ledger",
    icon: FileSpreadsheet,
    id: "purchasing-ledger",
    allowedRoles: ["admin"],
  },
  {
    title: "Customer Management",
    icon: User,
    id: "customer-management",
    allowedRoles: ["admin"],
  },
  {
    title: "Supplier Management",
    icon: Building2,
    id: "supplier-management",
    allowedRoles: ["admin"],
  },
  {
    title: "All Payments",
    icon: CreditCard,
    id: "all-payments",
    allowedRoles: ["admin"],
  },
]

const inventoryItems: MenuItem[] = [
  {
    title: "Products & Pricing",
    icon: Package,
    id: "products",
    allowedRoles: ["admin", "cashier"],
  },
  {
    title: "Inventory Management",
    icon: Warehouse,
    id: "inventory",
    allowedRoles: ["admin"],
  },
  {
    title: "Bargaining Tracker",
    icon: TrendingDown,
    id: "bargaining",
    allowedRoles: ["admin"],
  },
  {
    title: "Credit Node (Returns)",
    icon: Trash2,
    id: "disposal",
    allowedRoles: ["admin"],
  },
]

const financialItems: MenuItem[] = [
  {
    title: "Daily Expenses",
    icon: Receipt,
    id: "daily-expenses",
    allowedRoles: ["admin"],
  },
]

const managementItems: MenuItem[] = [
  {
    title: "Employee Management",
    icon: Users,
    id: "employees",
    allowedRoles: ["admin"],
  },
  {
    title: "Role Management",
    icon: Shield,
    id: "role-management",
    allowedRoles: ["admin"],
  },
]

const analyticsItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: BarChart3,
    id: "dashboard",
    allowedRoles: ["admin", "cashier"],
  },
  {
    title: "Reports & Analytics",
    icon: BarChart3,
    id: "reports",
    allowedRoles: ["admin"],
  },
]

// Helper function to filter menu items based on user role
const filterMenuItemsByRole = (items: MenuItem[], userRole: UserRole): MenuItem[] => {
  return items.filter(item => item.allowedRoles.includes(userRole))
}

interface AppSidebarProps {
  activeModule: string
  setActiveModule: (module: string) => void
}

export function AppSidebar({ activeModule, setActiveModule }: AppSidebarProps) {
  const { user } = useAuth()
  
  // Filter menu items based on user role
  const filteredAnalyticsItems = filterMenuItemsByRole(analyticsItems, user?.role || 'admin')
  const filteredSalesAndPurchasingItems = filterMenuItemsByRole(salesAndPurchasingItems, user?.role || 'admin')
  const filteredInventoryItems = filterMenuItemsByRole(inventoryItems, user?.role || 'admin')
  const filteredFinancialItems = filterMenuItemsByRole(financialItems, user?.role || 'admin')
  const filteredManagementItems = filterMenuItemsByRole(managementItems, user?.role || 'admin')

  return (
    <Sidebar className="md:p-2">
      <SidebarHeader className="border border-sidebar-border/70 bg-sidebar/90 backdrop-blur-sm rounded-2xl">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 p-1 shadow-sm">
            <Image 
              src="/bs.jpg" 
              alt="Bin Sultan Logo" 
              width={100} height={100}
              className="h-9 w-9 rounded-lg object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Bin Sultan ERP</span>
            <span className="text-xs text-muted-foreground">Fabrics Management</span>
            {user && (
              <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-md mt-1 w-fit">
                {user.role === 'admin' ? 'Administrator' : 'Cashier'}
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pb-16 sidebar-scrollbar mt-2 rounded-2xl border border-sidebar-border/70 bg-sidebar/70 backdrop-blur-sm">
        {/* Analytics */}
        {filteredAnalyticsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAnalyticsItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setActiveModule(item.id)} isActive={activeModule === item.id} className="hover:bg-accent/50 hover:scale-105 transition-all duration-200">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Sales & Purchasing */}
        {filteredSalesAndPurchasingItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Sales & Purchasing</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSalesAndPurchasingItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setActiveModule(item.id)} isActive={activeModule === item.id} className="hover:bg-accent/50 hover:scale-105 transition-all duration-200">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Inventory */}
        {filteredInventoryItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Inventory</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredInventoryItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setActiveModule(item.id)} isActive={activeModule === item.id} className="hover:bg-accent/50 hover:scale-105 transition-all duration-200">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Financial */}
        {filteredFinancialItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Financial</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredFinancialItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setActiveModule(item.id)} isActive={activeModule === item.id} className="hover:bg-accent/50 hover:scale-105 transition-all duration-200">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Management */}
        {filteredManagementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredManagementItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => setActiveModule(item.id)} isActive={activeModule === item.id} className="hover:bg-accent/50 hover:scale-105 transition-all duration-200">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}