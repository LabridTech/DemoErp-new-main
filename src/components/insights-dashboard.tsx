import React, { useEffect, useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { InsightsService } from "@/lib/insights-service";
import { Button } from "@/components/ui/button";

interface SalesPoint {
  date: string; // formatted date e.g. "2023-07-01"
  amount: number;
}

export function InsightsDashboard() {
  const [sales, setSales] = useState<SalesPoint[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [inventoryTurnover, setInventoryTurnover] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [salesData, expensesData, inventoryData] = await Promise.all([
          InsightsService.getSalesOverTime(),
          InsightsService.getTotalExpenses(),
          InsightsService.getInventoryStats(),
        ]);
        setSales(salesData);
        const salesSum = salesData.reduce((a, p) => a + p.amount, 0);
        setTotalSales(salesSum);
        setTotalExpenses(expensesData);
        // inventory turnover = total sales / average inventory quantity
        const avgInventory = inventoryData.averageQuantity || 1;
        setInventoryTurnover(salesSum / avgInventory);
      } catch (e) {
        console.error("Failed to load insights", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading insights…</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">AI‑Driven Insights Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-4 shadow-lg">
          <h2 className="text-lg font-medium">Total Sales</h2>
          <p className="text-3xl font-semibold">${totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-lg">
          <h2 className="text-lg font-medium">Total Expenses</h2>
          <p className="text-3xl font-semibold">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-lg">
          <h2 className="text-lg font-medium">Inventory Turnover</h2>
          <p className="text-3xl font-semibold">{inventoryTurnover.toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-card rounded-lg p-4 shadow-lg">
        <h2 className="text-lg font-medium mb-2">Sales Over Time</h2>
        <ChartContainer config={{ sales: { label: "Sales", color: "var(--color-primary)" } }}>
          <LineChart data={sales} syncId="insights">
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="amount" stroke="var(--color-primary)" dot={false} />
          </LineChart>
        </ChartContainer>
      </div>
      <div className="flex justify-end">
        <Button variant="glass" size="sm" onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    </div>
  );
}
