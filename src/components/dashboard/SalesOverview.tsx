"use client"

import React from 'react'

export interface SalesOverviewProps {
  data: { name: string; sales: number }[]
}

export default function SalesOverview({ data }: SalesOverviewProps) {
  const maxSales = Math.max(...data.map(d => d.sales), 1) // Avoid division by zero

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-4">
        <div className="text-sm text-muted-foreground">
          Total: Rs {data.reduce((sum, d) => sum + d.sales, 0).toLocaleString()}
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center space-x-4">
            <div className="w-16 text-sm font-medium truncate" title={item.name}>{item.name}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(item.sales / maxSales) * 100}%` }}
                  />
                </div>
                <div className="w-20 text-sm text-right">
                  Rs {(item.sales / 1000).toFixed(0)}k
                </div>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center text-muted-foreground py-4">No sales data available</div>
        )}
      </div>
    </div>
  )
}
