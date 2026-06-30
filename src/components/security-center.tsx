"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Search, ShieldAlert, FileText, Download, RefreshCw, Clock,
  Calendar
} from "lucide-react"
import { AuditLogService, type AuditLog } from "@/lib/operations-service"
import { useToast } from "@/hooks/use-toast"

export function SecurityCenter() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterModule, setFilterModule] = useState("all")
  const [filterAction, setFilterAction] = useState("all")
  const { toast } = useToast()

  // ── Data Fetching ─────────────────────────────────
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await AuditLogService.getLogs()
      setLogs(data)
    } catch (err) {
      console.error("Failed to load audit logs:", err)
      toast({ title: "Error", description: "Failed to load audit logs.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // ── Filtering & Computed ──────────────────────────
  const uniqueModules = useMemo(() => {
    const mods = new Set(logs.map(log => log.module).filter(Boolean))
    return Array.from(mods)
  }, [logs])

  const uniqueActions = useMemo(() => {
    const acts = new Set(logs.map(log => log.action).filter(Boolean))
    return Array.from(acts)
  }, [logs])

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesModule = filterModule === "all" || log.module === filterModule
        const matchesAction = filterAction === "all" || log.action === filterAction

        return matchesSearch && matchesModule && matchesAction
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [logs, searchTerm, filterModule, filterAction])

  // ── CSV Export ────────────────────────────────────
  const handleExportCSV = () => {
    try {
      if (filteredLogs.length === 0) {
        toast({ title: "No Data", description: "No logs available to export." })
        return
      }
      
      const headers = ["Timestamp", "User Name", "User Email", "Module", "Action", "Details"]
      const rows = filteredLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.userName,
        log.userEmail,
        log.module,
        log.action,
        `"${log.details?.replace(/"/g, '""')}"`
      ])

      const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `audit-log-export-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({ title: "Export Success", description: "CSV file downloaded." })
    } catch {
      toast({ title: "Error", description: "Failed to export logs.", variant: "destructive" })
    }
  }

  const getActionBadge = (action: AuditLog["action"]) => {
    switch (action) {
      case "CREATE":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Create</Badge>
      case "UPDATE":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Update</Badge>
      case "DELETE":
        return <Badge variant="destructive">Delete</Badge>
      case "TRANSFER":
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30">Transfer</Badge>
      case "SIGN":
        return <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/30">Signoff</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading audit log...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security &amp; Audit Logs</h2>
          <p className="text-muted-foreground mt-1">Super-Admin system monitoring, record additions, modifications, and deletions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export Logs (CSV)
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Total Logged Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Total audit records saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" /> Crucial Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.action === "DELETE").length}
            </div>
            <p className="text-xs text-muted-foreground">Deletions monitored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" /> Recent Actions (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
            </div>
            <p className="text-xs text-muted-foreground">Operations today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Audit table */}
      <Card>
        <CardHeader>
          <CardTitle>System Audit Logs Trail</CardTitle>
          <CardDescription>Tamper-evident logs of all system edits and actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by details, user name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-4">
              <div className="w-[180px]">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filterModule}
                  onChange={e => setFilterModule(e.target.value)}
                >
                  <option value="all">All Modules</option>
                  {uniqueModules.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="w-[180px]">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filterAction}
                  onChange={e => setFilterAction(e.target.value)}
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm">{log.userName}</p>
                          <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{log.module}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="text-sm max-w-md font-mono text-muted-foreground leading-relaxed break-words">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
