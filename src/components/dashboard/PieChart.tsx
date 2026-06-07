"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PieChartProps {
  title: string
  description: string
  data: Array<{ name: string; value: number; color: string }>
  total: number
}

export default function PieChart({ title, description, data, total }: PieChartProps) {
  const radius = 60
  const centerX = 80
  const centerY = 80
  let cumulativePercentage = 0

  const createPath = (percentage: number) => {
    const startAngle = (cumulativePercentage * 360) - 90
    const endAngle = ((cumulativePercentage + percentage) * 360) - 90
    cumulativePercentage += percentage

    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180

    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)

    const largeArcFlag = percentage > 0.5 ? 1 : 0

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex flex-col items-center space-y-3 flex-1">
          <div className="relative">
            <svg width="140" height="140" className="transform -rotate-90">
              {data.map((item) => {
                const percentage = item.value / total
                return (
                  <path
                    key={item.name}
                    d={createPath(percentage)}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                )
              })}
            </svg>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Rs {(total / 1000).toFixed(0)}k
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Total Revenue
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-1.5 flex-shrink-0">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium truncate">{item.name}</span>
              </div>
              <div className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                Rs {(item.value / 1000).toFixed(0)}k
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
