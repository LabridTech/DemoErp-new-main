"use client"


import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { SalesService, ProductService, EmployeeService, BargainingService, DisposalService, LedgerService, type SaleRecord, type Product, type Employee, type BargainRecord, type DisposalRecord, type CreditEntry } from "@/lib/firebase-services";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTheme } from "next-themes";

export function ReportsModule() {
  const [activeTab, setActiveTab] = useState("daily-sales");
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();

  // Data states
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bargains, setBargains] = useState<BargainRecord[]>([]);
  const [disposals, setDisposals] = useState<DisposalRecord[]>([]);
  const [credits, setCredits] = useState<CreditEntry[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
        SalesService.getAllSales(),
        ProductService.getAllProducts(),
        EmployeeService.getAllEmployees(),
      BargainingService.getAllBargainRecords(),
      DisposalService.getAllDisposalRecords(),
      LedgerService.getAllCreditEntries(),
    ]).then(([sales, products, employees, bargains, disposals, credits]) => {
      setSales(sales);
      setProducts(products);
      setEmployees(employees);
      setBargains(bargains);
      setDisposals(disposals);
      setCredits(credits);
      setLoading(false);
    });
  }, []);

  // --- Data processing for each report section ---
  // 1. Daily Sales Summary
  const dailySales = (() => {
    const map = new Map();
    sales.forEach(sale => {
      const day = new Date(sale.date).toLocaleDateString();
      if (!map.has(day)) map.set(day, { day, total: 0, count: 0 });
      map.get(day).total += sale.total;
      map.get(day).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
  })();

  // 2. Monthly Profit Report
  const monthlyProfit = (() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let totalRevenue = 0, totalCost = 0;
    sales.forEach(sale => {
      const d = new Date(sale.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        totalRevenue += sale.total;
        sale.items.forEach(item => {
          const product = products.find(p => p.name === item.name);
          totalCost += (product?.purchaseCost || 0) * item.quantity;
        });
      }
    });
    return {
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
    };
  })();

  // 3. Bargain Impact Report
  const bargainImpact = (() => {
    let totalDiscount = 0, count = 0;
    bargains.forEach(b => {
      totalDiscount += b.discountAmount || 0;
      count += 1;
    });
    return { totalDiscount, count };
  })();

  // 4. Disposal Loss Chart
  const disposalLoss = (() => {
    const map = new Map();
    disposals.forEach(d => {
      const day = new Date(d.disposalDate).toLocaleDateString();
      if (!map.has(day)) map.set(day, { day, loss: 0 });
      map.get(day).loss += d.lossAmount || 0;
    });
    return Array.from(map.values()).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
  })();

  // 5. Credit Aging Report
  const creditAging = (() => {
    const now = new Date();
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    credits.forEach(c => {
      const due = new Date(c.dueDate);
      const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= 30) buckets['0-30'] += c.remainingAmount || 0;
      else if (diff <= 60) buckets['31-60'] += c.remainingAmount || 0;
      else if (diff <= 90) buckets['61-90'] += c.remainingAmount || 0;
      else buckets['90+'] += c.remainingAmount || 0;
    });
    return Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }));
  })();

  // 6. Employee Sales Report
  const employeeSales = employees.map(emp => {
    const empSales = sales.filter(sale => sale.staffMember === emp.name).reduce((sum, sale) => sum + sale.total, 0);
    return { name: emp.name, sales: empSales };
  });

  // 7. Top 10 Selling Items
  const topSelling = (() => {
    const map = new Map();
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!map.has(item.name)) map.set(item.name, { name: item.name, qty: 0, revenue: 0 });
        map.get(item.name).qty += item.quantity;
        map.get(item.name).revenue += item.finalPrice * item.quantity;
      });
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);
  })();

  // --- PDF export handler ---
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      if (!reportRef.current) return;

      // Remove all oklch color backgrounds before rendering to canvas
      // This is a workaround for html2canvas not supporting oklch()
      // We'll set a white background for the report container and all its children
      const reportEl = reportRef.current;
      const originalBackgrounds: { el: HTMLElement, bg: string | null }[] = [];
      const setWhiteBgRecursively = (el: HTMLElement) => {
        if (el.style) {
          originalBackgrounds.push({ el, bg: el.style.backgroundColor });
          el.style.backgroundColor = "#fff";
        }
        Array.from(el.children).forEach(child => setWhiteBgRecursively(child as HTMLElement));
      };
      setWhiteBgRecursively(reportEl);

      // Also, temporarily set the body's background to white to avoid inherited oklch
      const originalBodyBg = document.body.style.backgroundColor;
      document.body.style.backgroundColor = "#fff";

      // Define a custom type for html2canvas options to avoid using 'any'
      type Html2CanvasOptions = {
        backgroundColor?: string;
        allowTaint?: boolean;
        useCORS?: boolean;
        scale?: number;
        // Add other html2canvas options as needed
      };

      const options: Html2CanvasOptions = {
        backgroundColor: '#ffffff',
        allowTaint: true,
        useCORS: true,
        scale: 2,
      };

      const canvas = await html2canvas(reportRef.current, options);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('erp-report.pdf');

      // Restore original backgrounds
      originalBackgrounds.forEach(({ el, bg }) => {
        el.style.backgroundColor = bg ?? "";
      });
      document.body.style.backgroundColor = originalBodyBg;
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast({
        title: "PDF Export Error",
        description: "Failed to generate PDF. Please try again or check for unsupported CSS features.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports data...</div>;
  }

  return (
    <div className="space-y-6 min-h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
          {isGeneratingPDF ? (
            <span className="animate-spin mr-2"><Download className="h-4 w-4" /></span>
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download PDF
        </Button>
      </div>
      <div
        ref={reportRef}
        className={`space-y-6 p-4 rounded-lg ${
          resolvedTheme === "dark"
            ? "bg-neutral-900 text-white"
            : "bg-white text-black"
        }`}
        style={{ boxShadow: resolvedTheme === "dark" ? "0 2px 8px #0006" : "0 2px 8px #0001" }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily-sales">Daily Sales Summary</TabsTrigger>
            <TabsTrigger value="monthly-profit">Monthly Profit Report</TabsTrigger>
            <TabsTrigger value="bargain-impact">Bargain Impact Report</TabsTrigger>
            <TabsTrigger value="disposal-loss">Disposal Loss Chart</TabsTrigger>
            <TabsTrigger value="credit-aging">Credit Aging Report</TabsTrigger>
            <TabsTrigger value="employee-sales">Employee Sales Report</TabsTrigger>
            <TabsTrigger value="top-selling">Top 10 Selling Items</TabsTrigger>
          </TabsList>
          <TabsContent value="daily-sales">
            <Card className={resolvedTheme === "dark" ? "bg-neutral-800 text-white" : "bg-white text-black"}>
              <CardHeader>
                <CardTitle>Daily Sales Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySales} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid stroke={resolvedTheme === "dark" ? "#444" : "#eee"} strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke={resolvedTheme === "dark" ? "#fff" : "#222"} tick={{ fill: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <YAxis stroke={resolvedTheme === "dark" ? "#fff" : "#222"} tick={{ fill: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <Tooltip contentStyle={{ background: resolvedTheme === "dark" ? "#222" : "#fff", color: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <Bar dataKey="total" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="monthly-profit">
            <Card className={resolvedTheme === "dark" ? "bg-neutral-800 text-white" : "bg-white text-black"}>
              <CardHeader>
                <CardTitle>Monthly Profit Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div><b>Month:</b> {monthlyProfit.month}</div>
                  <div><b>Total Revenue:</b> Rs{monthlyProfit.totalRevenue.toLocaleString()}</div>
                  <div><b>Total Cost:</b> Rs{monthlyProfit.totalCost.toLocaleString()}</div>
                  <div><b>Profit:</b> Rs{monthlyProfit.profit.toLocaleString()}</div>
                  <div><b>Profit Margin:</b> {monthlyProfit.margin.toFixed(2)}%</div>
                </div>
              </CardContent>
            </Card>
        </TabsContent>
          <TabsContent value="bargain-impact">
            <Card className={resolvedTheme === "dark" ? "bg-neutral-800 text-white" : "bg-white text-black"}>
              <CardHeader>
                <CardTitle>Bargain Impact Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div><b>Total Bargains:</b> {bargainImpact.count}</div>
                  <div><b>Total Discount Given:</b> Rs{bargainImpact.totalDiscount.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="disposal-loss">
            <Card className={resolvedTheme === "dark" ? "bg-neutral-800 text-white" : "bg-white text-black"}>
              <CardHeader>
                <CardTitle>Disposal Loss Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={disposalLoss} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid stroke={resolvedTheme === "dark" ? "#444" : "#eee"} strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke={resolvedTheme === "dark" ? "#fff" : "#222"} tick={{ fill: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <YAxis stroke={resolvedTheme === "dark" ? "#fff" : "#222"} tick={{ fill: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <Tooltip contentStyle={{ background: resolvedTheme === "dark" ? "#222" : "#fff", color: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="credit-aging">
            <Card className={resolvedTheme === "dark" ? "bg-neutral-800 text-white" : "bg-white text-black"}>
              <CardHeader>
                <CardTitle>Credit Aging Report</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={creditAging} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid stroke={resolvedTheme === "dark" ? "#444" : "#eee"} strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" stroke={resolvedTheme === "dark" ? "#fff" : "#222"} tick={{ fill: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <YAxis stroke={resolvedTheme === "dark" ? "#fff" : "#222"} tick={{ fill: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <Tooltip contentStyle={{ background: resolvedTheme === "dark" ? "#222" : "#fff", color: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <Bar dataKey="amount" fill="#f59e42" />
                  </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
          <TabsContent value="employee-sales">
            <Card className={resolvedTheme === "dark" ? "bg-neutral-800 text-white" : "bg-white text-black"}>
              <CardHeader>
                <CardTitle>Employee Sales Report</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={employeeSales} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid stroke={resolvedTheme === "dark" ? "#444" : "#eee"} strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke={resolvedTheme === "dark" ? "#fff" : "#222"} tick={{ fill: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <YAxis stroke={resolvedTheme === "dark" ? "#fff" : "#222"} tick={{ fill: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <Tooltip contentStyle={{ background: resolvedTheme === "dark" ? "#222" : "#fff", color: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <Bar dataKey="sales" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="top-selling">
            <Card className={resolvedTheme === "dark" ? "bg-neutral-800 text-white" : "bg-white text-black"}>
              <CardHeader>
                <CardTitle>Top 10 Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={topSelling} dataKey="qty" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {topSelling.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={["#6366f1", "#f59e42", "#10b981", "#ef4444", "#fbbf24", "#3b82f6", "#a21caf", "#f472b6", "#14b8a6", "#f87171"][idx % 10]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: resolvedTheme === "dark" ? "#222" : "#fff", color: resolvedTheme === "dark" ? "#fff" : "#222" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
