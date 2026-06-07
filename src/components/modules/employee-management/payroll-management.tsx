"use client"

import { useState, useRef } from "react"
import { PayrollEmployeeList } from "./payroll-employee-list"
import { PayrollEmployeeDetail } from "./payroll-employee-detail"
import { type Employee } from "@/lib/firebase-services"

export function PayrollManagement() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const listRef = useRef<{ refreshData: () => void }>(null)

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
  }

  const handleBackToList = () => {
    setSelectedEmployee(null)
    // Refresh the list data when returning from detail view
    setRefreshKey(prev => prev + 1)
    if (listRef.current) {
      listRef.current.refreshData()
    }
  }

  const handleInstallmentAdded = () => {
    // Refresh the list data when an installment is added
    setRefreshKey(prev => prev + 1)
    if (listRef.current) {
      listRef.current.refreshData()
    }
  }

  const handleBonusAdded = () => {
    // Refresh the list data when a bonus is added
    setRefreshKey(prev => prev + 1)
    if (listRef.current) {
      listRef.current.refreshData()
    }
  }

  if (selectedEmployee) {
    return (
      <PayrollEmployeeDetail 
        employee={selectedEmployee} 
        onBack={handleBackToList}
        onInstallmentAdded={handleInstallmentAdded}
        onBonusAdded={handleBonusAdded}
      />
    )
  }

  return (
    <PayrollEmployeeList 
      key={refreshKey}
      ref={listRef}
      onEmployeeSelect={handleEmployeeSelect}
    />
  )
}
