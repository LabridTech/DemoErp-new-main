"use client"

import React from 'react'
// import { Badge } from "@/components/ui/badge"

export interface ProductPerformanceProps {
  data: { name: string; sales: number; revenue: number; growth: string }[]
}

export default function ProductPerformance({ data }: ProductPerformanceProps) {
  return (
    <div className="space-y-4">


      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {data.map((fabric, index) => (
          <div key={fabric.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{fabric.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {fabric.sales} units sold
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">Rs {fabric.revenue.toLocaleString()}</p>
              {/* <Badge variant="secondary" className="text-xs">
                {fabric.growth}
              </Badge> */}
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center text-muted-foreground py-4">No product data available</div>
        )}
      </div>
    </div>
  )
}
