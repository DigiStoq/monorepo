# DigiStoq Implementation Plan

## Overview

Build a distinctive, production-grade accounting application with offline-first sync using PowerSync + Supabase.

---

## CURRENT TASK: PowerSync + Supabase Integration

### Goal

Remove all hardcoded mock data and integrate with Supabase backend using PowerSync for offline-first sync.

### Current State

- **PowerSync packages**: Installed (@powersync/react, @powersync/web)
- **Supabase packages**: Installed (@supabase/supabase-js)
- **Environment**: Configured (VITE_SUPABASE_URL, VITE_POWERSYNC_URL)
- **PowerSync schema**: Only 2 tables (products, sales) - needs expansion to 30+ tables
- **Mock data**: 71 constants across 14 page files need replacement

---

## Phase 1: Supabase Database Migrations

### 1.1 Core Tables (Run in Supabase SQL Editor)

```sql
-- ============================================================================
-- MIGRATION 001: Core Infrastructure
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'supplier', 'both')),
  phone VARCHAR(50),
  email VARCHAR(255),
  tax_id VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  opening_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  credit_limit DECIMAL(15,2),
  credit_days INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_type ON customers(type);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_is_active ON customers(is_active);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ITEMS TABLE
-- ============================================================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  type VARCHAR(20) DEFAULT 'product' CHECK (type IN ('product', 'service')),
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit VARCHAR(50) DEFAULT 'pcs',
  sale_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  purchase_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  stock_quantity DECIMAL(15,3) DEFAULT 0,
  low_stock_alert DECIMAL(15,3) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_sku ON items(sku);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_is_active ON items(is_active);
```

### 1.2 Sales Tables

```sql
-- ============================================================================
-- MIGRATION 002: Sales Module
-- ============================================================================

-- SALE INVOICES
CREATE TABLE sale_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  amount_due DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sale_invoices_customer ON sale_invoices(customer_id);
CREATE INDEX idx_sale_invoices_date ON sale_invoices(date);
CREATE INDEX idx_sale_invoices_status ON sale_invoices(status);

-- SALE INVOICE ITEMS
CREATE TABLE sale_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES sale_invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL
);

CREATE INDEX idx_sale_invoice_items_invoice ON sale_invoice_items(invoice_id);

-- PAYMENT INS
CREATE TABLE payment_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(20) CHECK (payment_mode IN ('cash', 'bank', 'card', 'ach', 'cheque', 'other')),
  reference_number VARCHAR(100),
  invoice_id UUID REFERENCES sale_invoices(id),
  invoice_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_ins_customer ON payment_ins(customer_id);
CREATE INDEX idx_payment_ins_date ON payment_ins(date);

-- ESTIMATES
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  valid_until DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  converted_to_invoice_id UUID REFERENCES sale_invoices(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESTIMATE ITEMS
CREATE TABLE estimate_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL
);

-- CREDIT NOTES
CREATE TABLE credit_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_note_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  invoice_id UUID REFERENCES sale_invoices(id),
  invoice_number VARCHAR(50),
  reason VARCHAR(20) CHECK (reason IN ('return', 'discount', 'error', 'other')),
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREDIT NOTE ITEMS
CREATE TABLE credit_note_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_note_id UUID NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(15,2) NOT NULL,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL
);
```

### 1.3 Purchase Tables

```sql
-- ============================================================================
-- MIGRATION 003: Purchase Module
-- ============================================================================

-- PURCHASE INVOICES
CREATE TABLE purchase_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_invoice_number VARCHAR(100),
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'received', 'paid', 'partial', 'overdue', 'cancelled')),
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  amount_due DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PURCHASE INVOICE ITEMS
CREATE TABLE purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL
);

-- PAYMENT OUTS
CREATE TABLE payment_outs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(20) CHECK (payment_mode IN ('cash', 'bank', 'card', 'ach', 'cheque', 'other')),
  reference_number VARCHAR(100),
  invoice_id UUID REFERENCES purchase_invoices(id),
  invoice_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXPENSES
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_number VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(30) CHECK (category IN ('rent', 'utilities', 'salaries', 'office', 'travel', 'marketing', 'maintenance', 'insurance', 'taxes', 'other')),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255),
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(20) CHECK (payment_mode IN ('cash', 'bank', 'card', 'ach', 'cheque', 'other')),
  reference_number VARCHAR(100),
  description TEXT NOT NULL,
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.4 Cash & Bank Tables

```sql
-- ============================================================================
-- MIGRATION 004: Cash & Bank Module
-- ============================================================================

-- BANK ACCOUNTS
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL UNIQUE,
  account_type VARCHAR(20) CHECK (account_type IN ('savings', 'checking', 'credit', 'loan', 'other')),
  opening_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BANK TRANSACTIONS
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES bank_accounts(id),
  date DATE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  reference_number VARCHAR(100),
  related_customer_id UUID REFERENCES customers(id),
  related_customer_name VARCHAR(255),
  related_invoice_id UUID,
  related_invoice_number VARCHAR(50),
  balance DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_transactions_account ON bank_transactions(account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(date);

-- CASH TRANSACTIONS
CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('in', 'out', 'adjustment')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  related_customer_id UUID REFERENCES customers(id),
  related_customer_name VARCHAR(255),
  related_invoice_id UUID,
  related_invoice_number VARCHAR(50),
  balance DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHEQUES
CREATE TABLE cheques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cheque_number VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) CHECK (type IN ('received', 'issued')),
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255),
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'bounced', 'cancelled')),
  related_invoice_id UUID,
  related_invoice_number VARCHAR(50),
  notes TEXT,
  cleared_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOANS
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('taken', 'given')),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255),
  lender_name VARCHAR(255),
  principal_amount DECIMAL(15,2) NOT NULL,
  outstanding_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  interest_type VARCHAR(20) DEFAULT 'simple' CHECK (interest_type IN ('simple', 'compound')),
  start_date DATE NOT NULL,
  end_date DATE,
  emi_amount DECIMAL(15,2),
  emi_day INTEGER,
  total_emis INTEGER,
  paid_emis INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'defaulted')),
  notes TEXT,
  linked_bank_account_id UUID REFERENCES bank_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOAN PAYMENTS
CREATE TABLE loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'bank', 'cheque')),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.5 Settings Tables

```sql
-- ============================================================================
-- MIGRATION 005: Settings & Configuration
-- ============================================================================

-- COMPANY SETTINGS (singleton)
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  logo_url TEXT,
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(100),
  address_postal_code VARCHAR(20),
  address_country VARCHAR(100) DEFAULT 'USA',
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_website VARCHAR(255),
  tax_id VARCHAR(50),
  ein VARCHAR(50),
  financial_year_start_month INTEGER DEFAULT 1,
  financial_year_start_day INTEGER DEFAULT 1,
  currency VARCHAR(10) DEFAULT 'USD',
  locale VARCHAR(20) DEFAULT 'en-US',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TAX RATES
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  type VARCHAR(20) DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICE SETTINGS (singleton)
CREATE TABLE invoice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prefix VARCHAR(20) DEFAULT 'INV',
  next_number INTEGER DEFAULT 1001,
  padding INTEGER DEFAULT 4,
  terms_and_conditions TEXT,
  notes TEXT,
  show_payment_qr BOOLEAN DEFAULT false,
  show_bank_details BOOLEAN DEFAULT true,
  due_date_days INTEGER DEFAULT 30,
  late_fees_enabled BOOLEAN DEFAULT false,
  late_fees_percentage DECIMAL(5,2),
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_name VARCHAR(255),
  bank_routing_number VARCHAR(50),
  bank_branch_name VARCHAR(255),
  bank_swift_code VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEQUENCE COUNTERS
CREATE TABLE sequence_counters (
  id VARCHAR(50) PRIMARY KEY,
  prefix VARCHAR(20) NOT NULL,
  next_number INTEGER NOT NULL DEFAULT 1,
  padding INTEGER DEFAULT 4,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize sequence counters
INSERT INTO sequence_counters (id, prefix, next_number) VALUES
  ('sale_invoice', 'INV', 1001),
  ('purchase_invoice', 'PUR', 1001),
  ('estimate', 'EST', 1001),
  ('credit_note', 'CN', 1001),
  ('payment_in', 'REC', 1001),
  ('payment_out', 'PAY', 1001),
  ('expense', 'EXP', 1001),
  ('cheque', 'CHQ', 1001);
```

### 1.6 Row Level Security (RLS)

```sql
-- ============================================================================
-- MIGRATION 006: Enable RLS for Multi-tenant Security
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for authenticated users - single tenant for now)
CREATE POLICY "Allow all for authenticated" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON sale_invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON sale_invoice_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON payment_ins FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON estimates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON estimate_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON credit_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON credit_note_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON purchase_invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON purchase_invoice_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON payment_outs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON bank_accounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON bank_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON cash_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON cheques FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON loans FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON loan_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON company_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON tax_rates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON invoice_settings FOR ALL USING (auth.role() = 'authenticated');
```

### 1.7 PowerSync Sync Rules

```sql
-- ============================================================================
-- MIGRATION 007: PowerSync Publication
-- ============================================================================

-- Create publication for PowerSync
CREATE PUBLICATION powersync FOR TABLE
  customers,
  items,
  categories,
  sale_invoices,
  sale_invoice_items,
  payment_ins,
  estimates,
  estimate_items,
  credit_notes,
  credit_note_items,
  purchase_invoices,
  purchase_invoice_items,
  payment_outs,
  expenses,
  bank_accounts,
  bank_transactions,
  cash_transactions,
  cheques,
  loans,
  loan_payments,
  company_settings,
  tax_rates,
  invoice_settings,
  sequence_counters;
```

---

## Phase 2: PowerSync Schema Expansion

### File: `src/lib/powersync.ts`

Expand the existing schema to include all 25 tables:

```typescript
import { column, Schema, Table } from "@powersync/web";

// ============================================================================
// TABLE DEFINITIONS
// ============================================================================

const customers = new Table({
  name: column.text,
  type: column.text,
  phone: column.text,
  email: column.text,
  tax_id: column.text,
  address: column.text,
  city: column.text,
  state: column.text,
  zip_code: column.text,
  opening_balance: column.real,
  current_balance: column.real,
  credit_limit: column.real,
  credit_days: column.integer,
  notes: column.text,
  is_active: column.integer, // boolean as 0/1
  created_at: column.text,
  updated_at: column.text,
});

const categories = new Table({
  name: column.text,
  description: column.text,
  item_count: column.integer,
  created_at: column.text,
});

const items = new Table({
  name: column.text,
  sku: column.text,
  type: column.text,
  description: column.text,
  category_id: column.text,
  unit: column.text,
  sale_price: column.real,
  purchase_price: column.real,
  tax_rate: column.real,
  stock_quantity: column.real,
  low_stock_alert: column.real,
  is_active: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

// ... (similar definitions for all 25 tables)

export const AppSchema = new Schema({
  customers,
  categories,
  items,
  sale_invoices,
  sale_invoice_items,
  payment_ins,
  estimates,
  estimate_items,
  credit_notes,
  credit_note_items,
  purchase_invoices,
  purchase_invoice_items,
  payment_outs,
  expenses,
  bank_accounts,
  bank_transactions,
  cash_transactions,
  cheques,
  loans,
  loan_payments,
  company_settings,
  tax_rates,
  invoice_settings,
  sequence_counters,
});
```

---

## Phase 3: Data Hooks & Services

### 3.1 Create Hook Structure

```
src/hooks/
├── index.ts
├── useCustomers.ts
├── useItems.ts
├── useSaleInvoices.ts
├── usePaymentIns.ts
├── useEstimates.ts
├── useCreditNotes.ts
├── usePurchaseInvoices.ts
├── usePaymentOuts.ts
├── useExpenses.ts
├── useBankAccounts.ts
├── useBankTransactions.ts
├── useCashTransactions.ts
├── useCheques.ts
├── useLoans.ts
├── useLoanPayments.ts
├── useSettings.ts
└── useTaxRates.ts
```

### 3.2 Example Hook Pattern

```typescript
// src/hooks/useCustomers.ts
import { useQuery, useStatus } from "@powersync/react";
import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { Customer, CustomerFormData } from "@/features/customers/types";

export function useCustomers(filters?: { type?: string; isActive?: boolean }) {
  const { data, isLoading, error } = useQuery<Customer>(
    `SELECT * FROM customers
     WHERE ($1 IS NULL OR type = $1)
     AND ($2 IS NULL OR is_active = $2)
     ORDER BY name`,
    [filters?.type ?? null, filters?.isActive ?? null]
  );

  return { customers: data ?? [], isLoading, error };
}

export function useCustomerById(id: string | null) {
  const { data, isLoading } = useQuery<Customer>(
    `SELECT * FROM customers WHERE id = ?`,
    [id],
    { enabled: !!id }
  );
  return { customer: data?.[0] ?? null, isLoading };
}

export function useCustomerMutations() {
  const db = getPowerSyncDatabase();

  const createCustomer = useCallback(async (data: CustomerFormData) => {
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO customers (id, name, type, phone, email, ...) VALUES (?, ?, ?, ?, ?, ...)`,
      [id, data.name, data.type, data.phone, data.email, ...]
    );
    return id;
  }, [db]);

  const updateCustomer = useCallback(async (id: string, data: Partial<CustomerFormData>) => {
    await db.execute(
      `UPDATE customers SET name = ?, type = ?, updated_at = ? WHERE id = ?`,
      [data.name, data.type, new Date().toISOString(), id]
    );
  }, [db]);

  const deleteCustomer = useCallback(async (id: string) => {
    await db.execute(`DELETE FROM customers WHERE id = ?`, [id]);
  }, [db]);

  return { createCustomer, updateCustomer, deleteCustomer };
}
```

---

## Phase 4: Page Migration (Mock Data Removal)

### 4.1 Files to Modify (14 pages with 71 mock constants)

| File                                                | Mock Constants                                           | Priority |
| --------------------------------------------------- | -------------------------------------------------------- | -------- |
| `src/features/customers/customers-page.tsx`         | mockCustomers, mockTransactions                          | P0       |
| `src/features/inventory/items-page.tsx`             | mockItems, mockCategories                                | P0       |
| `src/features/dashboard/dashboard-page.tsx`         | mockMetrics, mockTransactions                            | P0       |
| `src/features/sales/sale-invoices-page.tsx`         | mockInvoices, mockCustomers, mockItems                   | P1       |
| `src/features/sales/payment-in-page.tsx`            | mockPayments, mockCustomers, mockInvoices                | P1       |
| `src/features/sales/estimates-page.tsx`             | mockEstimates, mockCustomers, mockItems                  | P1       |
| `src/features/sales/credit-notes-page.tsx`          | mockCreditNotes                                          | P1       |
| `src/features/purchases/purchase-invoices-page.tsx` | mockPurchases, mockCustomers, mockItems                  | P1       |
| `src/features/purchases/payment-out-page.tsx`       | mockPayments, mockCustomers, mockInvoices                | P1       |
| `src/features/purchases/expenses-page.tsx`          | mockExpenses, mockCustomers                              | P1       |
| `src/features/cash-bank/bank-accounts-page.tsx`     | mockAccounts, mockTransactions                           | P2       |
| `src/features/cash-bank/cash-in-hand-page.tsx`      | mockTransactions, CURRENT_BALANCE                        | P2       |
| `src/features/cash-bank/cheques-page.tsx`           | mockCheques, mockCustomers                               | P2       |
| `src/features/cash-bank/loans-page.tsx`             | mockLoans, mockPayments, mockCustomers, mockBankAccounts | P2       |

### 4.2 Migration Pattern

**Before:**

```typescript
const mockCustomers: Customer[] = [...];
const [customers] = useState<Customer[]>(mockCustomers);
```

**After:**

```typescript
import { useCustomers, useCustomerMutations } from "@/hooks/useCustomers";

const { customers, isLoading, error } = useCustomers();
const { createCustomer, updateCustomer, deleteCustomer } =
  useCustomerMutations();
```

---

## Phase 5: Implementation Checklist

### Step 1: Supabase Setup

- [ ] Run Migration 001 (Core tables)
- [ ] Run Migration 002 (Sales tables)
- [ ] Run Migration 003 (Purchase tables)
- [ ] Run Migration 004 (Cash & Bank tables)
- [ ] Run Migration 005 (Settings tables)
- [ ] Run Migration 006 (RLS policies)
- [ ] Run Migration 007 (PowerSync publication)
- [ ] Configure PowerSync sync rules in PowerSync dashboard

### Step 2: PowerSync Schema

- [ ] Update `src/lib/powersync.ts` with full 25-table schema
- [ ] Test database initialization

### Step 3: Create Hooks (Priority Order)

- [ ] `useCustomers.ts` - Customer CRUD
- [ ] `useItems.ts` - Item/Inventory CRUD
- [ ] `useCategories.ts` - Category management
- [ ] `useSaleInvoices.ts` - Sales with line items
- [ ] `usePaymentIns.ts` - Payment recording
- [ ] `useEstimates.ts` - Quotation management
- [ ] `usePurchaseInvoices.ts` - Purchases
- [ ] `usePaymentOuts.ts` - Supplier payments
- [ ] `useExpenses.ts` - Expense tracking
- [ ] `useBankAccounts.ts` - Bank management
- [ ] `useBankTransactions.ts` - Bank transactions
- [ ] `useCashTransactions.ts` - Cash management
- [ ] `useCheques.ts` - Cheque tracking
- [ ] `useLoans.ts` - Loan management
- [ ] `useSettings.ts` - App settings
- [ ] `useTaxRates.ts` - Tax configuration
- [ ] `useSequence.ts` - Auto-numbering

### Step 4: Page Migrations

- [ ] Dashboard (metrics from aggregations)
- [ ] Customers page
- [ ] Items page
- [ ] Sale Invoices page
- [ ] Payment In page
- [ ] Estimates page
- [ ] Credit Notes page
- [ ] Purchase Invoices page
- [ ] Payment Out page
- [ ] Expenses page
- [ ] Bank Accounts page
- [ ] Cash In Hand page
- [ ] Cheques page
- [ ] Loans page
- [ ] Settings pages

### Step 5: Testing & Polish

- [ ] Test offline functionality
- [ ] Test sync on reconnect
- [ ] Test CRUD operations
- [ ] Test data integrity
- [ ] Remove all console.log placeholders

---

## Critical Files to Modify

| File                            | Purpose                                 |
| ------------------------------- | --------------------------------------- |
| `src/lib/powersync.ts`          | Expand schema from 2 to 25 tables       |
| `src/lib/supabase-connector.ts` | No changes needed                       |
| `src/hooks/*.ts`                | Create 17 new hook files                |
| `src/features/*/[page].tsx`     | Replace mock data with hooks (14 files) |

---

## Notes

1. **Supabase credentials** are already configured in `.env`
2. **PowerSync URL** is already configured
3. **Run migrations in order** (001 → 007)
4. **Test sync** after each migration before proceeding
5. **Backup before running** migrations in production

---

## COMPLETED TASKS (Previous Sprints)

- US Localization + Multi-Regional Support

### Goal

Make the app **region-agnostic** with US defaults, allowing users to configure region-specific settings (timezone, currency, tax rates, etc.) from the Settings page.

### Changes Required

#### 1. Remove India-Specific Terms (Replace with Generic)

| Current Term       | New Term                             | Files                                                                                                     |
| ------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| GSTIN              | Tax ID                               | customers/types.ts, customer-form-modal.tsx, customer-detail.tsx, settings/types.ts, company-settings.tsx |
| PAN                | (Remove - use Tax ID)                | customers/types.ts, customer-form-modal.tsx, customer-detail.tsx                                          |
| Pincode            | ZIP Code                             | customers/types.ts, customer-form-modal.tsx, customer-detail.tsx                                          |
| IFSC Code          | Routing Number                       | settings/types.ts, tax-invoice-settings.tsx                                                               |
| CIN                | (Remove)                             | settings/types.ts, company-settings.tsx                                                                   |
| TAN                | (Remove)                             | settings/types.ts, company-settings.tsx                                                                   |
| UPI                | ACH/Wire Transfer                    | sales/types.ts, purchases/types.ts, payment forms/lists                                                   |
| GST 5%/12%/18%/28% | Standard Tax Rate / State Tax / etc. | tax-invoice-settings.tsx                                                                                  |

#### 2. Update Currency to USD Default (Configurable)

| File                                         | Change                                    |
| -------------------------------------------- | ----------------------------------------- |
| dashboard/components/metric-cards.tsx        | INR → USD                                 |
| dashboard/components/recent-transactions.tsx | INR → USD                                 |
| dashboard/components/sales-chart.tsx         | INR → USD, ₹ → $                          |
| settings/pages/company-settings.tsx          | Default currency: USD, keep INR as option |

#### 3. Update Sample/Mock Data to US

| File                     | Change                                                     |
| ------------------------ | ---------------------------------------------------------- |
| company-settings.tsx     | Mumbai → New York, Maharashtra → NY, India → USA, +91 → +1 |
| tax-invoice-settings.tsx | HDFC Bank → Chase Bank, Mumbai Branch → NYC Branch         |
| security-settings.tsx    | Mumbai/Delhi India → US cities                             |

#### 4. Update Timezone Default

| File                 | Change                                     |
| -------------------- | ------------------------------------------ |
| company-settings.tsx | Asia/Kolkata → America/New_York as default |

#### 5. Update Validation Patterns

| File                    | Change                                                                |
| ----------------------- | --------------------------------------------------------------------- |
| customer-form-modal.tsx | Remove GSTIN/PAN Indian regex patterns, use generic Tax ID validation |

#### 6. Payment Methods Update

| Current   | New          | Files                              |
| --------- | ------------ | ---------------------------------- |
| upi       | ach          | sales/types.ts, purchases/types.ts |
| UPI label | ACH Transfer | All payment forms and lists        |

### Files to Modify (Priority Order)

1. **Types First:**
   - `src/features/customers/types.ts` - gstin→taxId, remove pan, pincode→zipCode
   - `src/features/settings/types.ts` - gstin→taxId, remove pan/cin/tan, ifscCode→routingNumber
   - `src/features/sales/types.ts` - upi→ach
   - `src/features/purchases/types.ts` - upi→ach

2. **Customer Module:**
   - `src/features/customers/components/customer-form-modal.tsx`
   - `src/features/customers/components/customer-detail.tsx`

3. **Settings Module:**
   - `src/features/settings/pages/company-settings.tsx`
   - `src/features/settings/pages/tax-invoice-settings.tsx`
   - `src/features/settings/pages/security-settings.tsx`

4. **Dashboard (Currency):**
   - `src/features/dashboard/components/metric-cards.tsx`
   - `src/features/dashboard/components/recent-transactions.tsx`
   - `src/features/dashboard/components/sales-chart.tsx`

5. **Payment Forms (UPI→ACH):**
   - `src/features/sales/components/payment-in-form.tsx`
   - `src/features/sales/components/payment-in-list.tsx`
   - `src/features/sales/components/payment-in-detail.tsx`
   - `src/features/sales/payment-in-page.tsx`
   - `src/features/purchases/components/payment-out-form.tsx`
   - `src/features/purchases/components/payment-out-list.tsx`
   - `src/features/purchases/components/payment-out-detail.tsx`
   - `src/features/purchases/payment-out-page.tsx`
   - `src/features/purchases/components/expense-form.tsx`
   - `src/features/purchases/components/expense-detail.tsx`

---

## Sprint 6: Utilities & Polish (After Localization)

### 6.1 Import/Export Functionality

- Excel/CSV import wizard for items, customers
- Export data to Excel/PDF
- Bulk data operations

### 6.2 Backup/Restore

- Manual backup trigger
- Auto-backup scheduling
- Restore from backup wizard

### 6.3 Bulk Updates

- Mass item price updates
- Bulk status changes
- Category reassignment

### 6.4 Tax Management

- Configurable tax rates (not GST-specific)
- Tax exemption settings
- Tax report generation

### 6.5 Animation Polish

- Page transitions with Framer Motion
- Micro-interactions on buttons/cards
- Loading state animations

### 6.6 Testing & Bug Fixes

- Component testing
- Integration testing
- UI/UX refinements

---

## Multi-Platform Strategy

This is a **monorepo** that will eventually support:

- **Desktop**: Tauri app (current)
- **Mobile**: React Native / Expo (future)
- **Web**: React web app (future)

### Component Architecture for Cross-Platform

```
src/
├── components/
│   └── ui/           # Platform-agnostic design tokens & types
│       ├── primitives/    # Base unstyled components (logic only)
│       └── styled/        # Tailwind-styled web components
├── packages/         # Future: shared packages
│   ├── ui-core/      # Shared component logic & types
│   └── ui-native/    # React Native implementations
```

**Strategy**: Build components with **separated logic and styling**:

1. Component logic/behavior → reusable across platforms
2. Styling → platform-specific (Tailwind for web, StyleSheet for native)
3. Types/interfaces → shared across all platforms

## Design Direction

### Visual Identity

- **Aesthetic**: Clean, data-dense layouts with bold accent moments
- **Color Palette**: Teal primary (#0d9488 / teal-600) with slate neutrals
- **Typography**: Sharp, professional - use `DM Sans` for headings, `Inter` for body
- **Cards**: Subtle glassmorphism with soft shadows, slight backdrop blur
- **Accents**: Vibrant teal CTAs, gradient highlights on key metrics
- **Dark sidebar** with light content area (like Vyapar but with teal accents)

### Key Differentiators from Vyapar

1. Rounded corners (12-16px) vs Vyapar's sharper edges
2. Gradient metric cards vs flat cards
3. Animated micro-interactions on hover/click
4. Modern iconography with consistent stroke weight
5. More whitespace and breathing room
6. Subtle background patterns/noise for depth

---

## Phase 1: Design System & Component Library

### 1.1 Design Tokens (`src/lib/design-tokens.ts`)

```
Colors: teal-50 to teal-950, slate palette, semantic colors
Spacing: 4px base unit scale
Radii: sm(6px), md(10px), lg(16px), xl(24px)
Shadows: soft, medium, heavy variants
Typography: display, heading, body, caption scales
```

### 1.2 Core Components (`src/components/ui/`)

| Component    | Priority | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `Button`     | P0       | Primary, secondary, ghost, danger variants |
| `Input`      | P0       | Text, number, search, with icons           |
| `Select`     | P0       | Dropdown with search capability            |
| `Modal`      | P0       | Dialog with backdrop, animations           |
| `Card`       | P0       | Container with header, body, footer        |
| `Table`      | P0       | Sortable, filterable data grid             |
| `Badge`      | P1       | Status indicators, tags                    |
| `Tabs`       | P1       | Navigation tabs                            |
| `DatePicker` | P1       | Date/range selection                       |
| `Toast`      | P1       | Notifications                              |
| `Sidebar`    | P0       | Navigation sidebar                         |
| `Dropdown`   | P1       | Action menus                               |

### 1.3 Layout Components (`src/components/layout/`)

- `AppShell` - Main app layout with sidebar
- `PageHeader` - Title + actions sticky header
- `MasterDetail` - List-detail split view pattern
- `EmptyState` - Empty data illustrations
- `LoadingState` - Skeleton loaders

---

## Phase 2: Navigation & Routing

### 2.1 Route Structure

```
/                     → Dashboard (Home)
/parties              → Party list + detail
/items                → Items/Inventory management
/sale                 → Sale submenu
  /sale/invoices      → Sale invoices
  /sale/estimates     → Estimates/Quotations
  /sale/payment-in    → Payment-in records
  /sale/credit-notes  → Credit notes
/purchase             → Purchase submenu
  /purchase/invoices  → Purchase invoices
  /purchase/payment-out → Payment-out records
  /purchase/expenses  → Expenses
/cash-bank            → Cash & Bank submenu
  /cash-bank/accounts → Bank accounts
  /cash-bank/cash     → Cash in hand
  /cash-bank/cheques  → Cheques
  /cash-bank/loans    → Loan accounts
/reports              → Reports hub
/settings             → App settings
/utilities            → Import/Export, Bulk updates
```

### 2.2 Files to Create

- `src/routes/__root.tsx` - Root layout
- `src/routes/index.tsx` - Dashboard
- `src/routes/parties/` - Party routes
- `src/routes/items/` - Items routes
- (etc. for each feature)

---

## Phase 3: Feature Modules

### 3.1 Dashboard (`src/features/dashboard/`)

- **Metrics cards**: Total Receivable, Total Payable (with gradients)
- **Sales graph**: Area chart with teal gradient fill
- **Quick reports**: Card links to common reports
- **Quick actions**: Floating "Add Sale" / "Add Purchase" buttons

### 3.2 Party Management (`src/features/parties/`)

- **PartyList**: Searchable list with amount badges
- **PartyDetail**: Contact info + transaction table
- **AddPartyModal**: Create/edit party form
- **Types**: Party, PartyTransaction interfaces

### 3.3 Items/Inventory (`src/features/inventory/`) - ENHANCE EXISTING

- **ItemList**: Enhanced with categories filter
- **ItemDetail**: Full item view with stock history
- **AddItemModal**: Multi-step form (Details → Pricing → Stock)
- **CategoryManager**: Category CRUD
- **UnitSelector**: Unit management

### 3.4 Sales Module (`src/features/sales/`)

- **SaleInvoiceList**: Invoice list with status badges
- **SaleInvoiceForm**: Full invoice creation form
- **EstimateList/Form**: Quotation management
- **PaymentInList/Form**: Payment recording
- **CreditNoteList/Form**: Returns/credit notes

### 3.5 Purchase Module (`src/features/purchases/`)

- **PurchaseInvoiceList/Form**: Purchase invoices
- **PaymentOutList/Form**: Payment recording
- **ExpenseList/Form**: Expense tracking with categories

### 3.6 Cash & Bank (`src/features/cash-bank/`)

- **BankAccountList**: Bank accounts management
- **CashInHand**: Cash tracking with adjustments
- **ChequeList**: Cheque management
- **LoanAccountList**: Loan tracking

### 3.7 Reports (`src/features/reports/`)

- **ReportHub**: Report type selector
- **SaleReport**: Filtered sales data
- **PurchaseReport**: Filtered purchase data
- **PartyStatement**: Party-wise statements
- **DaybookReport**: Daily transactions
- **ProfitLoss**: P&L statement

### 3.8 Utilities (`src/features/utilities/`)

- **ImportItems/Parties**: Excel import wizard
- **ExportModal**: Data export options
- **BulkUpdate**: Mass item updates
- **RecycleBin**: Deleted items recovery
- **GSTUpdate**: Tax rate management

### 3.9 Sync & Backup (`src/features/sync/`)

- **BackupManager**: Local/Drive backup
- **RestoreWizard**: Restore from backup
- **SyncStatus**: Sync indicator component

### 3.10 Settings Module (`src/features/settings/`) - CURRENT TASK

#### Structure

```
src/features/settings/
├── index.ts                    # Exports
├── types.ts                    # Settings types
├── settings-page.tsx           # Main settings hub
├── pages/
│   ├── index.ts
│   ├── company-settings.tsx    # Company profile
│   ├── user-profile.tsx        # User account settings
│   ├── preferences.tsx         # App preferences
│   ├── tax-invoice-settings.tsx # Tax and invoice config
│   ├── security-settings.tsx   # Security & access
│   └── backup-settings.tsx     # Backup & data
└── components/
    ├── index.ts
    ├── settings-layout.tsx     # Shared layout
    ├── settings-card.tsx       # Settings section card
    └── settings-nav.tsx        # Settings navigation
```

#### Pages Detail

**Company Settings** (`/settings/company`)

- Business name, logo, address
- Contact information (phone, email, website)
- Business registration numbers (GSTIN, PAN, etc.)
- Financial year settings
- Currency and locale preferences

**User Profile** (`/settings/profile`)

- User name, email, avatar
- Password change
- Notification preferences
- Language preference

**Preferences** (`/settings/preferences`)

- Theme (light/dark/system)
- Date format preference
- Number format (decimal separator, etc.)
- Default invoice settings
- Dashboard widget preferences

**Tax & Invoice Settings** (`/settings/tax`)

- Tax rates configuration (GST slabs)
- Invoice numbering format
- Invoice terms and conditions templates
- Payment terms defaults
- E-invoice settings (future)

**Security Settings** (`/settings/security`)

- Two-factor authentication (future)
- Session management
- Login history
- API keys (future)
- Access logs

**Backup & Data** (`/settings/backup`)

- Manual backup trigger
- Auto-backup schedule
- Export all data
- Import data wizard
- Data cleanup options
- Account deletion

---

## Terminology Standardization - CURRENT TASK

### Party → Customer Rename

Replace "party/parties" with "customer/customers" throughout the codebase for industry standardization.

**Files to Update:**

- `src/features/parties/` → Rename to `src/features/customers/`
- All type definitions: `Party` → `Customer`, `partyId` → `customerId`
- Route: `/parties` → `/customers`
- Sidebar navigation labels
- All component names and imports
- Report pages referencing parties

**Strategy:**

1. Create new `src/features/customers/` directory with updated names
2. Update all imports and references
3. Update router configuration
4. Update sidebar navigation
5. Remove old parties directory

---

## Phase 4: State Management

### 4.1 Zustand Stores (`src/stores/`)

```typescript
useAuthStore     - User session, company info
useUIStore       - Sidebar state, modals, toasts
useFilterStore   - Global filters (date range, search)
useSyncStore     - Sync status, last backup
```

### 4.2 Data Hooks Pattern

Each feature will have hooks in `hooks/` folder:

- `useParties()`, `usePartyById()`, `useCreateParty()`
- `useSaleInvoices()`, `useCreateSaleInvoice()`
- etc.

---

## Phase 5: Database Schema Extensions

### 5.1 New Tables (PowerSync schema)

```
parties         - Customer/Vendor records
sale_invoices   - Sale invoice headers
sale_items      - Sale invoice line items
purchase_invoices - Purchase headers
purchase_items  - Purchase line items
payments        - Payment-in/out records
expenses        - Expense records
bank_accounts   - Bank account records
categories      - Item categories
units           - Measurement units
```

---

## Implementation Order

### Sprint 0: Setup & Dependencies (Day 1)

```bash
npm install framer-motion recharts react-hook-form @hookform/resolvers zod date-fns
npm install -D @types/node
```

### Sprint 1: Design System (Week 1)

1. **Design tokens** - Colors, typography, spacing, shadows
2. **Tailwind config update** - Custom theme with teal palette
3. **Base primitives** - Unstyled component logic (hooks, types)
4. **Core UI components**:
   - Button (primary, secondary, ghost, danger, loading states)
   - Input (text, number, search, with icons, validation states)
   - Select (single, searchable, with custom options)
   - Modal/Dialog (sizes, animations, backdrop)
   - Card (header, body, footer, hover states)
   - Badge (status colors, sizes)
   - Tabs (horizontal, with icons)
   - Toast notifications
5. **Form components**:
   - FormField wrapper with labels, errors
   - Checkbox, Radio, Switch
   - DatePicker, DateRangePicker
   - Textarea
6. **Data display**:
   - Table (sortable, filterable headers)
   - DataGrid (virtualized for large datasets)
   - EmptyState, LoadingState, ErrorState

### Sprint 2: Layout & Navigation (Week 2)

1. AppShell (sidebar + content layout)
2. Sidebar navigation component
3. PageHeader with breadcrumbs
4. MasterDetail split view
5. Routing setup with @tanstack/react-router
6. Zustand store setup (UI state, filters)

### Sprint 3: Core Features (Week 3-4)

1. Dashboard with metrics and graph
2. Party management (list, detail, CRUD)
3. Enhanced inventory management
4. Category & unit management

### Sprint 4: Transactions (Week 5-6)

1. Sale invoice creation flow
2. Purchase invoice flow
3. Payment-in/out recording
4. Expense tracking

### Sprint 5: Advanced Features (Week 7-8)

1. Cash & Bank management
2. Reports module
3. Estimates/Quotations
4. Credit/Debit notes

### Sprint 6: Utilities & Polish (Week 9-10)

1. Import/Export functionality
2. Backup/Restore
3. Bulk updates
4. GST management
5. Animation polish
6. Testing & bug fixes

---

## Files to Create (Initial)

### Components

- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/modal.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/index.ts`
- `src/components/layout/app-shell.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/page-header.tsx`

### Design System

- `src/lib/design-tokens.ts`
- `tailwind.config.js` (update)
- `src/index.css` (update)

### Routing

- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routeTree.gen.ts`

### Stores

- `src/stores/ui-store.ts`
- `src/stores/auth-store.ts`
- `src/stores/index.ts`

---

## Key Technical Decisions

1. **Component Architecture**: Compound components where appropriate (e.g., `<Table.Header>`, `<Table.Row>`)
2. **Form Handling**: React Hook Form for complex forms
3. **Animations**: Framer Motion for page transitions, CSS for micro-interactions
4. **Charts**: Recharts for dashboard graphs
5. **Date Handling**: date-fns for date manipulation
6. **Icons**: Lucide React (already installed)
7. **Virtualization**: TanStack Virtual for long lists (already installed)

---

## Success Criteria

- [ ] All Vyapar UX flows are replicated
- [ ] UI is visually distinct and modern
- [ ] Offline-first with PowerSync sync
- [ ] Sub-200ms interaction response times
- [ ] Accessible (WCAG 2.1 AA)
- [ ] TypeScript strict mode compliant

---

## Mobile Implementation

### Initialization

- Scaffold new Expo application in `mobile` directory.

### Shared Logic Integration

- **Metro Config**: Configure Metro Bundler to allow imports from `../src/lib`.
- **Schema**: Import shared PowerSync schema from `src/lib/schema.ts`.
- **Authentication**: Setup Supabase client using Expo environment variables.
- **Sync**: Utilize Refactored `SupabaseConnector` for data synchronization.

### Dependencies

- `@powersync/react-native` (Native SQLite support)
- `@supabase/supabase-js`
- `expo-file-system` (Likely needed for PowerSync adapter)
