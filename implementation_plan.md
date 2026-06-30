# ERP Upgrade Implementation Plan: Accounting, Operations, Domain, and Intelligence Features

This document outlines a detailed phase-by-step roadmap to implement the requested accounting, operations, domain-specific, and CRM features, along with a dedicated **Petty Cash Module**.

---

## User Review Required

> [!IMPORTANT]
> The proposed upgrade is extensive. We recommend implementing these features across 4 distinct phases to ensure system stability, complete testing, and seamless data migration. Please review the phase breakdown below and confirm if you would like to proceed with this roadmap or prioritize a specific phase first.

---

## Phase 1: Core Financials & Petty Cash

### Petty Cash Module [NEW]
Manage low-value, day-to-day office expenses (tea, stationary, small repairs) with controlled drawer amounts.
* **Database Updates**: Add `pettyCashDrawers`, `pettyCashVouchers`, and `pettyCashRequests` schemas.
* **Features**:
  * Petty Cash request and approval workflow.
  * Voucher creation with digital receipts/attachments.
  * Drawer replenishment history and automated warnings when petty cash falls below the threshold.
  * Daily reconciliation checks.

### Double-Entry Accounting & Chart of Accounts (COA) [NEW]
Transition the backend database logic from isolated flat collections to a structured double-entry ledger.
* **Features**:
  * General Ledger (GL) tracking.
  * Balanced Debits and Credits automatically generated upon sales, purchases, salary payouts, and petty cash releases.
  * Standard accounts structure: Assets, Liabilities, Equity, Revenues, Expenses.

### AR/AP Aging & Bank Reconciliation [NEW]
* **Features**:
  * Aging reports for customer collections (Receivables) and supplier dues (Payables).
  * CSV/Excel Bank Statement upload utility with fuzzy-matching of transaction records.

---

## Phase 2: Operations & Audit Tracking

### Multi-Warehouse & Location Management [NEW]
* **Features**:
  * Track stock levels dynamically across multiple physical locations (e.g., *Main Godown*, *Retail Store A*).
  * Internal Stock Transfer notes with double-signoff verification.
  * Section/Rack layout identifiers for fast product pickup.

### System Audit Log & Security Center [NEW]
* **Features**:
  * Centralized tamper-evident audit logs capturing record additions, modifications, and deletions.
  * Super-Admin log viewer with user, module, action, and timestamp filters.

---

## Phase 3: Tailoring & Fabric Production WIP

### Tailoring & Custom Orders Module [NEW]
* **Features**:
  * Custom measurement forms embedded in the sales flow.
  * Job Card generation and tailor assignments.
  * Real-time work status monitoring (*Cutting*, *Stitching*, *Quality Control*, *Ready*).

### Production & Processing WIP Tracker [NEW]
* **Features**:
  * Track fabrics sent to third-party processors for *Dyeing*, *Embroidery*, or *Printing*.
  * Automated calculation of processing overheads, updating the final unit cost of the finished fabric.

---

## Phase 4: Tax Compliance, CRM & Intelligence

### Tax & VAT Compliance Module [NEW]
* **Features**:
  * Multi-rate tax rules based on transaction type (wholesale vs. retail).
  * Automated tax balance summaries (Input VAT credit offsetting Output VAT collected).

### CRM & Loyalty Suite [NEW]
* **Features**:
  * Tiered customer loyalty program (Silver, Gold, Platinum).
  * Automatic discount rule triggering at Point of Sale.

### Smart Forecasting & Reordering [NEW]
* **Features**:
  * Forecast analysis on seasonal fabric trends.
  * Auto-generation of Purchase drafts based on low stock alerts.

---

## Verification Plan

### Automated Tests
- Unit tests to verify that every petty cash release generates correct balanced double-entry accounting records.
- Transaction validation tests to ensure inventory transfers deduct quantities from source warehouses and add to target warehouses correctly.

### Manual Verification
- Dry-run a full flow: create a Petty Cash drawer request, approve it, register a voucher, check the updated balance, and inspect the double-entry logs.
- Test custom measurements capture during checkout and assign stitching tasks to a test tailor profile.
