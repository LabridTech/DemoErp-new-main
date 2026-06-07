"use client"

import React from 'react'
import { Badge } from "@/components/ui/badge"

export interface RecentTransactionsProps {
  data: {
    id: string
    type: string
    title: string
    description: string
    amount: number
    status: string
    time: string
  }[]
}

export default function RecentTransactions({ data }: RecentTransactionsProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'default'
      case 'pending':
      case 'partial':
        return 'secondary'
      case 'failed':
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getTypeColor = (type: string) => {
    return type.toLowerCase().includes('sale') ? 'text-green-600' : 'text-blue-600'
  }

  return (
    <div className="space-y-4">


      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {data.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${transaction.type.toLowerCase().includes('sale') ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="font-medium text-sm">{transaction.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold text-sm ${getTypeColor(transaction.type)}`}>
                Rs {transaction.amount.toLocaleString()}
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusColor(transaction.status) as "default" | "destructive" | "secondary" | "outline"} className="text-xs">
                  {transaction.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {transaction.time}
                </span>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center text-muted-foreground py-4">No recent transactions</div>
        )}
      </div>
    </div>
  )
}
