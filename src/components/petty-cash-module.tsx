"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus, Search, Wallet, ArrowDownCircle, ArrowUpCircle, Clock,
  CheckCircle2, XCircle, AlertTriangle, Receipt, RefreshCw
} from "lucide-react"
import {
  getDrawers, createDrawer, requestCash, approveRequest,
  recordReplenishment, listPendingRequests, seedPettyCashData,
  type PettyCashDrawer, type PettyCashRequest
} from "@/lib/petty-cash-service"
import { collection, query, getDocs, Timestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

// Helper to format timestamps (supports both RTDB numbers and Firestore Timestamps)
function formatDate(ts: number | Timestamp | undefined): string {
  if (!ts) return "—"
  try {
    const date = typeof ts === "number" ? new Date(ts) : ts.toDate()
    return date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    })
  } catch {
    return "—"
  }
}

export function PettyCashModule() {
  // ── State ─────────────────────────────────────────
  const [drawers, setDrawers] = useState<PettyCashDrawer[]>([])
  const [pendingRequests, setPendingRequests] = useState<PettyCashRequest[]>([])
  const [allRequests, setAllRequests] = useState<PettyCashRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Dialogs
  const [showNewDrawer, setShowNewDrawer] = useState(false)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [showReplenish, setShowReplenish] = useState(false)
  const [selectedDrawerId, setSelectedDrawerId] = useState("")

  // Forms
  const [newDrawerForm, setNewDrawerForm] = useState({ name: "", balance: "", threshold: "" })
  const [newRequestForm, setNewRequestForm] = useState({ drawerId: "", amount: "", purpose: "" })
  const [replenishAmount, setReplenishAmount] = useState("")

  const { user } = useAuth()
  const { toast } = useToast()

  // ── Data fetching ─────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [drawerData, pendingData] = await Promise.all([
        getDrawers(),
        listPendingRequests()
      ])
      console.log("drawerData", drawerData);
      console.log("pendingData", pendingData);
      setDrawers(drawerData)
      setPendingRequests(pendingData as PettyCashRequest[])

      // Fetch all requests for history
      const reqCol = collection(firestore, "pettyCashRequests")
      const reqSnap = await getDocs(query(reqCol))
      const allReqs = reqSnap.docs.map(d => ({ id: d.id, ...d.data() } as PettyCashRequest))
      setAllRequests(allReqs)
    } catch (err) {
      console.error("Error fetching petty cash data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Handlers ──────────────────────────────────────
  const handleCreateDrawer = async () => {
    const balance = Number(newDrawerForm.balance)
    const threshold = Number(newDrawerForm.threshold)

    if (!newDrawerForm.name.trim() || !newDrawerForm.balance || !newDrawerForm.threshold) {
      toast({ title: "Missing Fields", description: "Please fill all fields.", variant: "destructive" })
      return
    }

    if (!Number.isFinite(balance) || !Number.isFinite(threshold) || balance < 0 || threshold < 0) {
      toast({ title: "Invalid Amount", description: "Enter valid non-negative numbers for balance and threshold.", variant: "destructive" })
      return
    }


    try {
      await createDrawer({
        name: newDrawerForm.name.trim(),
        balance,
        threshold,
      })
      console.log("drawer created", newDrawerForm.name, balance, threshold)
      toast({ title: "Drawer Created", description: `"${newDrawerForm.name}" has been created.` })
      setNewDrawerForm({ name: "", balance: "", threshold: "" })
      setShowNewDrawer(false)
      fetchData()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create drawer."
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const handleSubmitRequest = async () => {
    const amount = Number(newRequestForm.amount)

    if (!newRequestForm.drawerId || !newRequestForm.amount || !newRequestForm.purpose.trim()) {
      toast({ title: "Missing Fields", description: "Please fill all fields.", variant: "destructive" })
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter an amount greater than 0.", variant: "destructive" })
      return
    }

    try {
      await requestCash({
        drawerId: newRequestForm.drawerId,
        amount,
        purpose: newRequestForm.purpose.trim(),
        requestedBy: user?.uid || "unknown",
      })
      toast({ title: "Request Submitted", description: "Your petty cash request is pending approval." })
      setNewRequestForm({ drawerId: "", amount: "", purpose: "" })
      setShowNewRequest(false)
      fetchData()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit request."
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      await approveRequest(requestId, user?.uid || "unknown")
      toast({ title: "Approved", description: "Request approved and voucher generated." })
      fetchData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve."
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const handleReplenish = async () => {
    const amount = Number(replenishAmount)

    if (!selectedDrawerId || !replenishAmount) {
      toast({ title: "Missing Fields", description: "Select a drawer and enter an amount.", variant: "destructive" })
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter an amount greater than 0.", variant: "destructive" })
      return
    }

    try {
      await recordReplenishment(selectedDrawerId, amount)
      toast({ title: "Replenished", description: `Rs ${amount.toLocaleString()} added to drawer.` })
      setReplenishAmount("")
      setShowReplenish(false)
      fetchData()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to replenish drawer."
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const handleSeedData = async () => {
    try {
      setLoading(true)
      await seedPettyCashData()
      toast({ title: "Sample Data Loaded", description: "Sample drawers and requests have been generated." })
      await fetchData()
    } catch {
      toast({ title: "Error", description: "Failed to load sample data.", variant: "destructive" })
      setLoading(false)
    }
  }

  // ── Computed ──────────────────────────────────────
  const totalBalance = drawers.reduce((s, d) => s + d.balance, 0)
  const lowDrawers = drawers.filter(d => d.balance < d.threshold)

  const filteredRequests = allRequests.filter(r =>
    r.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "approved":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // ── Loading ───────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading petty cash data...</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Petty Cash Management</h2>
          <p className="text-muted-foreground mt-1">Manage drawers, requests &amp; vouchers</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => fetchData()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowNewRequest(true)}>
            <ArrowDownCircle className="h-4 w-4 mr-2" /> New Request
          </Button>
          <Button onClick={() => setShowNewDrawer(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Drawer
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across {drawers.length} drawer(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-500" /> Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allRequests.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Low Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowDrawers.length}</div>
            <p className="text-xs text-muted-foreground">Below threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ───────────────────────────────────── */}
      <Tabs defaultValue="drawers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="drawers">Cash Drawers</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-[10px]" variant="destructive">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Request History</TabsTrigger>
        </TabsList>

        {/* ── Drawers Tab ──────────────────────────── */}
        <TabsContent value="drawers" className="space-y-4">
          {drawers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">No Drawers Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first petty cash drawer to get started.</p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowNewDrawer(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Drawer
                  </Button>
                  <Button variant="secondary" onClick={handleSeedData}>
                    Load Sample Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drawers.map(drawer => {
                console.log(drawer);
                const isLow = drawer.balance < drawer.threshold
                const pct = drawer.threshold > 0 ? Math.min(100, Math.round((drawer.balance / (drawer.threshold * 3)) * 100)) : 50
                return (
                  <Card key={drawer.id} className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${isLow ? "border-red-500/40" : "border-border"}`}>
                    {isLow && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{drawer.name}</CardTitle>
                        {isLow && (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Low
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Created {formatDate(drawer.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-2xl font-bold">Rs {drawer.balance.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">Threshold: Rs {drawer.threshold.toLocaleString()}</span>
                        </div>
                        <Progress value={pct} className={`h-2 ${isLow ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                          setNewRequestForm(prev => ({ ...prev, drawerId: drawer.id }))
                          setShowNewRequest(true)
                        }}>
                          <ArrowDownCircle className="h-3.5 w-3.5 mr-1" /> Request
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                          setSelectedDrawerId(drawer.id)
                          setShowReplenish(true)
                        }}>
                          <ArrowUpCircle className="h-3.5 w-3.5 mr-1" /> Replenish
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Pending Approvals Tab ────────────────── */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Pending Approvals
              </CardTitle>
              <CardDescription>Review and approve or reject petty cash requests</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mb-3 text-emerald-500/50" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm">No pending requests to approve.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Drawer</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map(req => {
                        const drawerName = drawers.find(d => d.id === req.drawerId)?.name || req.drawerId
                        return (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.purpose}</TableCell>
                            <TableCell className="font-semibold">Rs {req.amount.toLocaleString()}</TableCell>
                            <TableCell>{drawerName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(req.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleApprove(req.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Request History Tab ──────────────────── */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" /> Request History
              </CardTitle>
              <CardDescription>All petty cash requests and their statuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by purpose or status..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <Receipt className="h-10 w-10 mb-3 opacity-50" />
                  <p className="font-medium">No requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Drawer</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map(req => {
                        const drawerName = drawers.find(d => d.id === req.drawerId)?.name || req.drawerId
                        return (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.purpose}</TableCell>
                            <TableCell className="font-semibold">Rs {req.amount.toLocaleString()}</TableCell>
                            <TableCell>{statusBadge(req.status)}</TableCell>
                            <TableCell>{drawerName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(req.createdAt)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══════════════════════════════════════════════
          DIALOGS
         ══════════════════════════════════════════════ */}

      {/* ── New Drawer Dialog ─────────────────────── */}
      <Dialog open={showNewDrawer} onOpenChange={setShowNewDrawer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Drawer</DialogTitle>
            <DialogDescription>Set up a new petty cash drawer with a name, starting balance, and low-balance threshold.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="drawer-name">Drawer Name</Label>
              <Input id="drawer-name" placeholder="e.g. Office Expenses" value={newDrawerForm.name}
                onChange={e => setNewDrawerForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drawer-balance">Starting Balance (Rs)</Label>
                <Input id="drawer-balance" type="number" placeholder="5000" value={newDrawerForm.balance}
                  onChange={e => setNewDrawerForm(p => ({ ...p, balance: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drawer-threshold">Warning Threshold (Rs)</Label>
                <Input id="drawer-threshold" type="number" placeholder="1000" value={newDrawerForm.threshold}
                  onChange={e => setNewDrawerForm(p => ({ ...p, threshold: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDrawer(false)}>Cancel</Button>
            <Button onClick={handleCreateDrawer}>Create Drawer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Request Dialog ────────────────────── */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Petty Cash Request</DialogTitle>
            <DialogDescription>Submit a request to withdraw funds from a petty cash drawer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Drawer</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newRequestForm.drawerId}
                onChange={e => setNewRequestForm(p => ({ ...p, drawerId: e.target.value }))}
              >
                <option value="">Choose a drawer...</option>
                {drawers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} (Rs {d.balance.toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-amount">Amount (Rs)</Label>
              <Input id="req-amount" type="number" placeholder="500" value={newRequestForm.amount}
                onChange={e => setNewRequestForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-purpose">Purpose</Label>
              <Textarea id="req-purpose" placeholder="e.g. Office tea supplies, stationery..." value={newRequestForm.purpose}
                onChange={e => setNewRequestForm(p => ({ ...p, purpose: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
            <Button onClick={handleSubmitRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Replenish Dialog ──────────────────────── */}
      <Dialog open={showReplenish} onOpenChange={setShowReplenish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replenish Drawer</DialogTitle>
            <DialogDescription>Add funds back to the selected petty cash drawer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="replenish-amount">Amount to Add (Rs)</Label>
              <Input id="replenish-amount" type="number" placeholder="5000" value={replenishAmount}
                onChange={e => setReplenishAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplenish(false)}>Cancel</Button>
            <Button onClick={handleReplenish}>Replenish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
