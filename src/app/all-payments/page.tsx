"use client"

import { useState } from "react"
import { CustomerPayments } from "@/components/all-payments/customer-payments"
import { SupplierPayments } from "@/components/all-payments/supplier-payments"
import { PasswordManagement } from "@/components/all-payments/password-management"
import { CustomerProfileDetails } from "@/components/all-payments/customer-profile-details"
import { SupplierProfileDetails } from "@/components/all-payments/supplier-profile-details"

export default function AllPaymentsPage() {
  // view is either 'list', or {type: 'customer'|'supplier', id}
  const [view, setView] = useState<'list'|{type:'customer'|'supplier'; id:string}>("list")
  const [tab, setTab] = useState<'customers'|'suppliers'|'settings'>('customers')

  if (view !== 'list') {
    // in profile detail view
    if (view.type === 'customer') {
      return (
        <CustomerProfileDetails customerId={view.id} onBack={() => setView('list')} />
      )
    } else {
      return (
        <SupplierProfileDetails supplierId={view.id} onBack={() => setView('list')} />
      )
    }
  }
  // main payment tab view
  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Payments</h1>
          <p className="text-muted-foreground">Manage all customer and supplier payments in one place</p>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex border-b">
          <button className={`px-4 py-2 ${tab==='customers' && 'border-b-2 border-primary font-bold'}`} onClick={()=>setTab('customers')}>Customer Payments</button>
          <button className={`px-4 py-2 ${tab==='suppliers' && 'border-b-2 border-primary font-bold'}`} onClick={()=>setTab('suppliers')}>Supplier Payments</button>
          <button className={`px-4 py-2 ${tab==='settings' && 'border-b-2 border-primary font-bold'}`} onClick={()=>setTab('settings')}>Password Settings</button>
        </div>
      </div>
      {tab==='customers' && <CustomerPayments onProfileClick={id=>setView({type:'customer',id})} />}
      {tab==='suppliers' && <SupplierPayments onProfileClick={id=>setView({type:'supplier',id})} />}
      {tab==='settings' && <PasswordManagement />}
    </>
  )
}
