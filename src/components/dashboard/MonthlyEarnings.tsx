"use client"

import React from 'react'

export interface MonthlyEarningsProps {
  data: { name: string; earnings: number; color?: string }[]
}

export default function MonthlyEarnings({ data }: MonthlyEarningsProps) {
  const maxEarnings = Math.max(...data.map(d => d.earnings), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-4">
        <div className="text-sm text-muted-foreground">
          Avg: Rs {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.earnings, 0) / data.length).toLocaleString() : 0}
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center space-x-3">
            <div className="w-16 text-sm font-medium truncate" title={item.name}>{item.name}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                  <div
                    className={`${item.color || 'bg-blue-500'} h-3 rounded-full transition-all duration-300`}
                    style={{ width: `${(item.earnings / maxEarnings) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-sm text-right font-medium">
                  Rs {(item.earnings / 1000).toFixed(0)}k
                </div>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center text-muted-foreground py-4">No earnings data available</div>
        )}
      </div>
    </div>
  )
}
