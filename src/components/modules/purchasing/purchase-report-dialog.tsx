import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PurchaseReportDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  reportStartDate: string
  setReportStartDate: (date: string) => void
  reportEndDate: string
  setReportEndDate: (date: string) => void
  onGenerateReport: () => void
  isGeneratingReport: boolean
}

export function PurchaseReportDialog({
  isOpen,
  onOpenChange,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  onGenerateReport,
  isGeneratingReport,
}: PurchaseReportDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Purchase Report</DialogTitle>
          <DialogDescription>Select a date range for the report</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="start-date">Start Date</label>
            <Input
              id="start-date"
              type="date"
              value={reportStartDate}
              onChange={e => setReportStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="end-date">End Date</label>
            <Input
              id="end-date"
              type="date"
              value={reportEndDate}
              onChange={e => setReportEndDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onGenerateReport} disabled={isGeneratingReport}>
              {isGeneratingReport ? "Generating..." : "Download Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
