// // General Ledger Management component
// import React, { useEffect, useState } from "react";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
// import { SalesLedger } from "@/components/sales-ledger";
// import { PurchasingLedger } from "@/components/purchasing-ledger";
// import AllPayments from "@/components/all-payments/customer-payments";
// import { saveAs } from "file-saver";

// // Helper to convert an array of objects to CSV string
// function arrayToCSV(data, columns) {
//   const header = columns.join(",");
//   const rows = data.map(row =>
//     columns.map(col => {
//       const cell = row[col] ?? "";
//       const escaped = String(cell).replace(/"/g, "\"\"");
//       return `"${escaped}"`;
//     }).join(",")
//   );
//   return `${header}\n${rows.join("\n")}`;
// }

// export function GeneralLedgerManagement() {
//   const [salesData, setSalesData] = useState([]);
//   const [purchasingData, setPurchasingData] = useState([]);
//   const [paymentData, setPaymentData] = useState([]);

//   // Load data from each module's service (they expose a getAll method)
//   useEffect(() => {
//     // Sales
//     import("@/lib/firebase-services").then(mod => {
//       if (mod.SalesService && typeof mod.SalesService.getAllSales === "function") {
//         mod.SalesService.getAllSales().then(setSalesData).catch(console.error);
//       }
//     });
//     // Purchasing
//     import("@/lib/firebase-services").then(mod => {
//       if (mod.PurchasingService && typeof mod.PurchasingService.getAllPurchases === "function") {
//         mod.PurchasingService.getAllPurchases().then(setPurchasingData).catch(console.error);
//       }
//     });
//     // Payments (both customer and supplier payments)
//     import("@/lib/firebase-services").then(mod => {
//       const promises = [];
//       if (mod.CustomerPaymentService && typeof mod.CustomerPaymentService.getAll === "function") {
//         promises.push(mod.CustomerPaymentService.getAll("customerPayments"));
//       }
//       if (mod.SupplierPaymentService && typeof mod.SupplierPaymentService.getAll === "function") {
//         promises.push(mod.SupplierPaymentService.getAll("supplierPayments"));
//       }
//       Promise.all(promises).then(results => {
//         const combined = results.flat();
//         setPaymentData(combined);
//       }).catch(console.error);
//     });
//   }, []);

//   // Define column sets – we reuse the column headers from the respective components.
//   const salesColumns = ["date", "invoiceNumber", "customerName", "total", "paymentStatus", "deliveryStatus"];
//   const purchasingColumns = ["date", "invoiceNumber", "supplierName", "total", "paymentStatus", "deliveryStatus"];
//   const paymentColumns = ["date", "reference", "type", "amount", "method", "status"];

//   const handleExport = (type) => {
//     let data = [];
//     let cols = [];
//     switch (type) {
//       case "sales":
//         data = salesData; cols = salesColumns; break;
//       case "purchasing":
//         data = purchasingData; cols = purchasingColumns; break;
//       case "payments":
//         data = paymentData; cols = paymentColumns; break;
//     }
//     const csv = arrayToCSV(data, cols);
//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
//     saveAs(blob, `${type}_ledger_${new Date().toISOString().slice(0,10)}.csv`);
//   };

//   return (
//     <div className="p-4">
//       <Tabs defaultValue="sales" className="space-y-4">
//         <TabsList>
//           <TabsTrigger value="sales">Sales Ledger</TabsTrigger>
//           <TabsTrigger value="purchasing">Purchasing Ledger</TabsTrigger>
//           <TabsTrigger value="payments">All Payments</TabsTrigger>
//         </TabsList>
//         <TabsContent value="sales">
//           <div className="flex justify-between mb-2">
//             <h2 className="text-xl font-semibold">Sales Ledger</h2>
//             <Button onClick={() => handleExport("sales")}>Export CSV</Button>
//           </div>
//           <SalesLedger />
//         </TabsContent>
//         <TabsContent value="purchasing">
//           <div className="flex justify-between mb-2">
//             <h2 className="text-xl font-semibold">Purchasing Ledger</h2>
//             <Button onClick={() => handleExport("purchasing")}>Export CSV</Button>
//           </div>
//           <PurchasingLedger />
//         </TabsContent>
//         <TabsContent value="payments">
//           <div className="flex justify-between mb-2">
//             <h2 className="text-xl font-semibold">All Payments</h2>
//             <Button onClick={() => handleExport("payments")}>Export CSV</Button>
//           </div>
//           <AllPayments />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }
