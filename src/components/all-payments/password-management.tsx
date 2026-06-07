"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Key, Eye, EyeOff, Save } from "lucide-react"
import { SettingsService } from "@/lib/firebase-services"

export function PasswordManagement() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const { toast } = useToast()

  // Check if password is already set
  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const settings = await SettingsService.getSettings()
        if (!settings?.paymentPassword) {
          setIsFirstTime(true)
        }
      } catch (error) {
        console.error("Error checking password status:", error)
      }
    }
    
    checkPasswordStatus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isFirstTime) {
      if (!newPassword || !confirmPassword) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive",
        })
        return
      }
      
      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        })
        return
      }
      
      if (newPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        })
        return
      }
      
      setLoading(true)
      try {
        // For first-time setup, just save the new password
        await SettingsService.updateSettings({
          paymentPassword: newPassword
        })
        
        toast({
          title: "Success",
          description: "Payment password has been set successfully!",
        })
        
        // Update UI to show password change form
        setIsFirstTime(false)
        setNewPassword("")
        setConfirmPassword("")
      } catch (error) {
        console.error("Error setting password:", error)
        toast({
          title: "Error",
          description: "Failed to set password. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
      
    } else {
      // Existing password change logic
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive",
        })
        return
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        })
        return
      }

      if (newPassword.length < 6) {
        toast({
          title: "Error",
          description: "New password must be at least 6 characters long",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      try {
        // Get current settings
        const settings = await SettingsService.getSettings()
        const storedPassword = settings?.paymentPassword || "admin123" // Default password

        // Verify current password
        if (currentPassword !== storedPassword) {
          toast({
            title: "Error",
            description: "Current password is incorrect",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        // Update password
        await SettingsService.updateSettings({
          ...settings,
          paymentPassword: newPassword
        })

        toast({
          title: "Success",
          description: "Password updated successfully",
        })

        // Clear form
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } catch (error) {
        console.error("Error updating password:", error)
        toast({
          title: "Error",
          description: "Failed to update password. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          <CardTitle>
            {isFirstTime ? "Set Up Payment Password" : "Change Payment Password"}
          </CardTitle>
        </div>
        <CardDescription>
          {isFirstTime 
            ? "Set a password to secure your payment operations"
            : "Update your payment password for secure transactions"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isFirstTime && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pr-10"
                disabled={loading}
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>{loading ? "Updating..." : "Update Password"}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
