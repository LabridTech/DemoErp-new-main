import { db } from '@/lib/firebase'; // placeholder import, adjust if needed

export const InsightsService = {
  async getSalesOverTime() {
    // Mock sales data for the past 12 months
    const now = new Date();
    const points = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const date = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const amount = Math.round(5000 + Math.random() * 15000);
      points.push({ date, amount });
    }
    return points;
  },
  async getTotalExpenses() {
    // Mock total expenses value
    return Math.round(20000 + Math.random() * 5000);
  },
  async getInventoryStats() {
    // Mock inventory stats used for turnover calculation
    return { averageQuantity: Math.round(100 + Math.random() * 200) };
  },
};
