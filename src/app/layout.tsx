import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { POSProvider } from "@/contexts/POSContext"
import { PurchaseProvider } from "@/contexts/PurchaseContext"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Bin Sultan Fabrics Management System",
  description: "Bin Sultan Fabrics Company - Comprehensive ERP solution for fabric and textile business management",
  other: {
    'version': '1.0.0',
    'build-time': new Date().toISOString(),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <POSProvider>
              <PurchaseProvider>
                {children}
                <Toaster />
              </PurchaseProvider>
            </POSProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
