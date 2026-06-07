import { type EmployeePayroll, type PayrollInstallment, type PayrollBonus } from './firebase-services'

export interface PayrollInvoiceData {
  employeeId: string
  employeeName: string
  month: string
  year: number
  totalSalary: number
  installments: PayrollInstallment[]
  bonuses: PayrollBonus[]
  remainingSalary: number
  status: "pending" | "partial" | "paid" | "overdue"
  generatedDate: string
  companyName: string
  companyAddress: string
  companyPhone: string
}

export class PayrollInvoiceService {
  static prepareInvoiceData(payrollData: EmployeePayroll): PayrollInvoiceData {
    return {
      employeeId: payrollData.employeeId,
      employeeName: payrollData.employeeName,
      month: payrollData.month,
      year: payrollData.year,
      totalSalary: payrollData.totalSalary,
      installments: payrollData.installments,
      bonuses: payrollData.bonuses,
      remainingSalary: payrollData.remainingSalary,
      status: payrollData.status,
      generatedDate: new Date().toISOString(),
      companyName: 'BinSultan Fabric Management',
      companyAddress: 'Your Company Address',
      companyPhone: 'Your Company Phone'
    }
  }

  static formatMonthYear(month: string, year: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    const monthIndex = parseInt(month.split('-')[1]) - 1
    return `${monthNames[monthIndex]} ${year}`
  }
}