"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BarChartProps {
  title: string
  description: string
  data: Array<{ name: string; value: number; color: string }>
}

export default function BarChart({ title, description, data }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 overflow-hidden chart-container flex-1 min-h-0">
          {data.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1 min-w-0">{item.name}</span>
                <span className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                  Rs {(item.value / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-500 hover:opacity-80"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t flex-shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Volume</span>
            <span className="font-semibold">
              Rs {data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
