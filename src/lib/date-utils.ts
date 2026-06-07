/**
 * Utility functions for date handling and generation
 * Updated to include all required date formatting functions
 */

export interface DateOption {
  value: string;
  label: string;
}

/**
 * Generates dynamic date options for export time periods
 * Returns options for the current year and previous 2 years
 */
export function generateExportDateOptions(): DateOption[] {
  const options: DateOption[] = [
    { value: "past30days", label: "Past 30 Days" },
    { value: "all", label: "All Time" }
  ];

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // Generate options for current year and previous 2 years
  for (let year = currentYear; year >= currentYear - 2; year--) {
    for (let month = 12; month >= 1; month--) {
      const monthStr = month.toString().padStart(2, '0');
      const value = `${year}-${monthStr}`;
      const date = new Date(year, month - 1, 1);
      const label = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      options.push({ value, label });
    }
  }

  return options;
}

/**
 * Generates month options for payroll (current month, next month, and last 10 months)
 */
export function generatePayrollMonthOptions(): DateOption[] {
  const options: DateOption[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-based
  
  // Add next month (future) first
  const nextMonthNum = currentMonth + 1;
  const nextYear = nextMonthNum > 11 ? currentYear + 1 : currentYear;
  const nextMonthAdjusted = nextMonthNum > 11 ? 0 : nextMonthNum;
  const nextMonthStr = `${nextYear}-${String(nextMonthAdjusted + 1).padStart(2, '0')}`;
  const nextMonthDisplayStr = new Date(nextYear, nextMonthAdjusted, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  
  options.push({ value: nextMonthStr, label: nextMonthDisplayStr });
  
  // Add current month
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthDisplayStr = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  
  options.push({ value: currentMonthStr, label: currentMonthDisplayStr });
  
  // Add last 10 months (past)
  for (let i = 1; i <= 10; i++) {
    const pastMonthNum = currentMonth - i;
    const pastYear = pastMonthNum < 0 ? currentYear - 1 : currentYear;
    const pastMonthAdjusted = pastMonthNum < 0 ? 12 + pastMonthNum : pastMonthNum;
    const pastMonthStr = `${pastYear}-${String(pastMonthAdjusted + 1).padStart(2, '0')}`;
    const pastMonthDisplayStr = new Date(pastYear, pastMonthAdjusted, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    options.push({ value: pastMonthStr, label: pastMonthDisplayStr });
  }
  
  return options;
}

/**
 * Formats a date string for display
 */
export function formatDateForDisplay(dateString: string): string {
  if (dateString === 'past30days' || dateString === 'all') {
    return dateString === 'past30days' ? 'Past 30 Days' : 'All Time';
  }
  
  const [year, month] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats a date and time to a readable string
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formats time to a readable string
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Gets current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Gets current time in HH:MM format
 */
export function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}