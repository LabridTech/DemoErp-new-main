"use client"

import React from 'react'

export interface YearlyBreakupProps {
  data: { quarter: string; revenue: number; color: string }[]
}

export default function YearlyBreakup({ data }: YearlyBreakupProps) {
  const totalRevenue = data.reduce((sum, q) => sum + q.revenue, 0)
  const maxRevenue = Math.max(...data.map(q => q.revenue), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-4">
        <div className="text-sm text-muted-foreground">
          Total: Rs {totalRevenue.toLocaleString()}
        </div>
      </div>

      <div className="space-y-4">
        {data.map((quarter) => (
          <div key={quarter.quarter} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{quarter.quarter}</span>
              <span className="text-sm text-muted-foreground">
                Rs {quarter.revenue.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
              <div
                className={`${quarter.color} h-3 rounded-full transition-all duration-500`}
                style={{
                  width: `${(quarter.revenue / maxRevenue) * 100}%`
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? ((quarter.revenue / totalRevenue) * 100).toFixed(1) : 0}% of total revenue
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center text-muted-foreground py-4">No quarterly data available</div>
        )}
      </div>

      <div className="pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className={`text-2xl font-bold ${(() => {
              const activeQuarters = data.filter(q => q.revenue > 0);
              if (activeQuarters.length === 0) return 'text-muted-foreground';
              if (activeQuarters.length === 1) return 'text-green-600';
              const first = activeQuarters[0];
              const last = activeQuarters[activeQuarters.length - 1];
              return last.revenue >= first.revenue ? 'text-green-600' : 'text-red-600';
            })()
              }`}>
              {(() => {
                const activeQuarters = data.filter(q => q.revenue > 0);
                if (activeQuarters.length === 0) return 'N/A';
                if (activeQuarters.length === 1) return '+100%';
                const first = activeQuarters[0];
                const last = activeQuarters[activeQuarters.length - 1];
                const growth = ((last.revenue - first.revenue) / first.revenue) * 100;
                return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
              })()}
            </p>
            <p className="text-xs text-muted-foreground">YTD Growth</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              Rs {data.length > 0 ? Math.round(totalRevenue / data.length).toLocaleString() : 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg Quarterly</p>
          </div>
        </div>
      </div>
    </div>
  )
}
