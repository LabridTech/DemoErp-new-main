"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type EmployeePayroll } from "@/lib/firebase-services"
import { Gift, Calendar, FileText } from "lucide-react"

interface PayrollBonusHistoryProps {
  payroll: EmployeePayroll
}

export function PayrollBonusHistory({ payroll }: PayrollBonusHistoryProps) {
  const bonuses = payroll.bonuses || []

  if (bonuses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Bonus History
          </CardTitle>
          <CardDescription>
            No bonuses have been given for this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bonuses will appear here when they are added to the employee&apos;s payroll.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Bonus History
        </CardTitle>
        <CardDescription>
          {bonuses.length} bonus{bonuses.length !== 1 ? 'es' : ''} totaling Rs{totalBonuses.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bonuses.map((bonus, index) => (
            <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {bonus.reason}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(bonus.date).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(bonus.date).toLocaleString()}
                </div>
                
                {bonus.notes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{bonus.notes}</span>
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">
                  Rs{bonus.amount.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
