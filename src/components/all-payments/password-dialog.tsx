"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Lock, Eye, EyeOff } from "lucide-react"
import { SettingsService } from "@/lib/firebase-services"
import { SetupPasswordDialog } from "./setup-password-dialog"

interface PasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
  action: 'edit' | 'delete'
}

export function PasswordDialog({ open, onOpenChange, onVerified, action }: PasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [showSetupPassword, setShowSetupPassword] = useState(false)
  const [noPasswordSet, setNoPasswordSet] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter the password",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const settings = await SettingsService.getSettings()
      const storedPassword = settings?.paymentPassword

      if (!storedPassword) {
        setNoPasswordSet(true)
        return
      }

      if (password === storedPassword) {
        onVerified()
        setPassword("")
      } else {
        toast({
          title: "Error",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying password:", error)
      toast({
        title: "Error",
        description: "Failed to verify password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = () => {
    setNoPasswordSet(false)
    setPassword("")
  }

  const handleClose = () => {
    setPassword("")
    setShowPassword(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose()
        } else {
          onOpenChange(isOpen)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Password Required</span>
            </DialogTitle>
            <DialogDescription>
              {noPasswordSet 
                ? "No payment password has been set up yet. Please set up a password to continue."
                : `Enter the payment management password to ${action} this payment record.`}
            </DialogDescription>
          </DialogHeader>
          {noPasswordSet ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You need to set up a payment password before you can manage payments.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowSetupPassword(true)}
                  disabled={loading}
                >
                  Set Up Password
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <SetupPasswordDialog
        open={showSetupPassword}
        onOpenChange={setShowSetupPassword}
        onSetupComplete={handleSetupComplete}
      />
    </>
  )
}
