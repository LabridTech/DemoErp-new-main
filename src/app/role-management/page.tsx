"use client"

import { useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { RoleManagement } from "@/components/role-management"
import { Button } from "@/components/ui/button"
import { RoleProtectedRoute } from "@/components/auth/role-protected-route"
import { useAuth } from "@/contexts/auth-context"
import { LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChangePasswordModal } from "@/components/profile/change-password-modal"
import Image from "next/image"

export default function RoleManagementPage() {
  const [activeModule, setActiveModule] = useState("role-management")
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <SidebarProvider>
        <AppSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
        <main className="flex-1 overflow-hidden">
          <div className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
            <div className="flex items-center">
              <SidebarTrigger />
              <Image src="/bs.jpg" alt="Bin Sultan Logo" className="h-12 w-12 ml-4 rounded-full object-cover" width={100} height={100} />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                      <User className="h-4 w-4" />
                      {user.displayName || user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.displayName || user.email}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          Administrator
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)}>
                      <User className="mr-2 h-4 w-4" />
                      Change Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 lg:p-6 pb-8">
            <RoleManagement />
          </div>
        </main>
        
        <ChangePasswordModal 
          open={showChangePasswordModal} 
          onOpenChange={setShowChangePasswordModal} 
        />
      </SidebarProvider>
    </RoleProtectedRoute>
  )
}
