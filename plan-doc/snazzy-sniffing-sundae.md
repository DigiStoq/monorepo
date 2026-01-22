# Plan: PowerSync Database Integration - Sprint Roadmap

## Current State Analysis

### PowerSync Rules (Already Deployed)

```yaml
# Core: customers, items, categories
# Sales: sale_invoices, sale_invoice_items, payment_ins, estimates, estimate_items, credit_notes, credit_note_items, invoice_history
# Purchases: purchase_invoices, purchase_invoice_items, payment_outs, expenses
# Cash-Bank: bank_accounts, bank_transactions, cash_transactions, cheques, loans, loan_payments
# Settings: company_settings, tax_rates, invoice_settings, sequence_counters
```

### Features PROPERLY Connected to PowerSync

| Feature              | Pages   | Hooks Used                                                    |
| -------------------- | ------- | ------------------------------------------------------------- |
| Sales                | 4 pages | useSaleInvoices, useEstimates, useCreditNotes, usePaymentIns  |
| Purchases            | 3 pages | usePurchaseInvoices, useExpenses, usePaymentOuts              |
| Customers            | 1 page  | useCustomers                                                  |
| Items/Inventory      | 1 page  | useItems, useCategories                                       |
| Cash-Bank            | 4 pages | useBankAccounts, useCashTransactions, useCheques, useLoans    |
| Dashboard            | 1 page  | useDashboardMetrics, useRecentTransactions, useSalesChartData |
| Company Settings     | 1 page  | useCompanySettings                                            |
| Tax/Invoice Settings | 1 page  | useInvoiceSettings, useTaxRates                               |

### Features NOT Connected (Using Mock Data)

#### Settings Module (4 pages) - Priority: Medium

| Page                    | Current State                  | Database Table Needed             |
| ----------------------- | ------------------------------ | --------------------------------- |
| `user-profile.tsx`      | Hardcoded mockUserProfile      | user_profiles                     |
| `preferences.tsx`       | Hardcoded mockPreferences      | user_preferences                  |
| `security-settings.tsx` | Hardcoded mockSecuritySettings | security_settings + login_history |
| `backup-settings.tsx`   | Hardcoded mockBackupSettings   | backup_settings + backup_history  |

#### Reports Module (16+ pages) - Priority: HIGH

| Report Category        | Pages | Data Source Needed                                |
| ---------------------- | ----- | ------------------------------------------------- |
| Sales Reports          | 4     | sale_invoices, sale_invoice_items                 |
| Purchase Reports       | 4     | purchase_invoices, purchase_invoice_items         |
| Customer/Party Reports | 4     | customers, sale_invoices, purchase_invoices       |
| Inventory Reports      | 4     | items, sale_invoice_items, purchase_invoice_items |
| Financial Reports      | 4     | All transaction tables                            |

All 16+ report pages use hardcoded static mock data with non-functional date filters.

#### Minor Issues

| Issue                 | Location                                      | Fix                          |
| --------------------- | --------------------------------------------- | ---------------------------- |
| useProducts pattern   | `src/features/inventory/hooks/useProducts.ts` | Refactor to useQuery pattern |
| Dashboard purchases   | `src/hooks/useDashboard.ts:243`               | Add purchase query to chart  |
| Customer transactions | `src/features/customers/customers-page.tsx`   | Add transactions hook        |

---

## Sprint Plan

### Sprint 1: Reports Infrastructure (Foundation)

**Goal:** Create the hooks and data layer for all reports

#### 1.1 Database Schema (Supabase)

No new tables needed - reports query existing tables with aggregations.

#### 1.2 Create Report Hooks (`src/hooks/useReports.ts`)

```typescript
// Sales Reports
useSalesSummaryReport(dateRange: DateRange): SalesSummary
useSalesRegisterReport(dateRange: DateRange): SalesRegisterEntry[]
useSalesByCustomerReport(dateRange: DateRange): CustomerSalesData[]
useSalesByItemReport(dateRange: DateRange): ItemSalesData[]

// Purchase Reports
usePurchaseSummaryReport(dateRange: DateRange): PurchaseSummary
usePurchaseRegisterReport(dateRange: DateRange): PurchaseRegisterEntry[]
usePurchaseBySupplierReport(dateRange: DateRange): SupplierPurchaseData[]
usePurchaseByItemReport(dateRange: DateRange): ItemPurchaseData[]

// Party Reports
useCustomerStatementReport(customerId: string, dateRange: DateRange): StatementData
useAgingReport(type: 'receivable' | 'payable'): AgingData[]
useReceivablesReport(): ReceivablesData[]
usePayablesReport(): PayablesData[]

// Inventory Reports
useStockSummaryReport(): StockSummaryItem[]
useStockMovementReport(itemId?: string, dateRange?: DateRange): MovementEntry[]
useLowStockReport(): LowStockItem[]
useItemProfitabilityReport(dateRange: DateRange): ItemProfitData[]

// Financial Reports
useProfitLossReport(dateRange: DateRange): ProfitLossData
useCashFlowReport(dateRange: DateRange): CashFlowData
useDayBookReport(date: string): DayBookEntry[]
useTaxSummaryReport(dateRange: DateRange): TaxSummaryData
```

#### 1.3 Files to Create

- `src/hooks/useReports.ts` - All report query hooks
- `src/features/reports/types.ts` - Report-specific types (update existing)

#### 1.4 Files to Modify

- All 16+ report pages in `src/features/reports/pages/`

---

### Sprint 2: Sales & Purchase Reports

**Goal:** Connect all 8 sales and purchase report pages

#### 2.1 Sales Reports (4 pages)

| File                           | Hook                     | Query Pattern                         |
| ------------------------------ | ------------------------ | ------------------------------------- |
| `sales-summary-report.tsx`     | useSalesSummaryReport    | Aggregate totals from sale_invoices   |
| `sales-register-report.tsx`    | useSalesRegisterReport   | List all invoices with items          |
| `sales-by-customer-report.tsx` | useSalesByCustomerReport | Group by customer_id                  |
| `sales-by-item-report.tsx`     | useSalesByItemReport     | Group by item from sale_invoice_items |

#### 2.2 Purchase Reports (4 pages)

| File                              | Hook                        | Query Pattern      |
| --------------------------------- | --------------------------- | ------------------ |
| `purchase-summary-report.tsx`     | usePurchaseSummaryReport    | Aggregate totals   |
| `purchase-register-report.tsx`    | usePurchaseRegisterReport   | List all purchases |
| `purchase-by-supplier-report.tsx` | usePurchaseBySupplierReport | Group by supplier  |
| `purchase-by-item-report.tsx`     | usePurchaseByItemReport     | Group by item      |

---

### Sprint 3: Party & Inventory Reports

**Goal:** Connect party statements and inventory reports

#### 3.1 Party Reports (4 pages)

| File                            | Hook                       | Query Pattern                  |
| ------------------------------- | -------------------------- | ------------------------------ |
| `customer-statement-report.tsx` | useCustomerStatementReport | Customer transactions timeline |
| `aging-report.tsx`              | useAgingReport             | Unpaid invoices by age buckets |
| `receivables-report.tsx`        | useReceivablesReport       | Outstanding sale invoices      |
| `payables-report.tsx`           | usePayablesReport          | Outstanding purchase invoices  |

#### 3.2 Inventory Reports (4 pages)

| File                            | Hook                       | Query Pattern             |
| ------------------------------- | -------------------------- | ------------------------- |
| `stock-summary-report.tsx`      | useStockSummaryReport      | Current stock levels      |
| `stock-movement-report.tsx`     | useStockMovementReport     | Stock in/out history      |
| `low-stock-report.tsx`          | useLowStockReport          | Items below reorder level |
| `item-profitability-report.tsx` | useItemProfitabilityReport | Revenue - cost per item   |

---

### Sprint 4: Financial Reports

**Goal:** Connect profit/loss, cash flow, day book, tax summary

#### 4.1 Financial Reports (4 pages)

| File                     | Hook                | Query Pattern                 |
| ------------------------ | ------------------- | ----------------------------- |
| `profit-loss-report.tsx` | useProfitLossReport | Income - expenses calculation |
| `cash-flow-report.tsx`   | useCashFlowReport   | All cash movements            |
| `day-book-report.tsx`    | useDayBookReport    | All transactions for a day    |
| `tax-summary-report.tsx` | useTaxSummaryReport | Tax collected vs paid         |

---

### Sprint 5: Settings Module (Low Priority)

**Goal:** Connect remaining settings pages to database

#### 5.1 Database Schema (Supabase)

```sql
-- User Profiles (if not using Supabase Auth profile)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'staff',
  language TEXT DEFAULT 'en',
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  theme TEXT DEFAULT 'system',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  decimal_separator TEXT DEFAULT '.',
  thousands_separator TEXT DEFAULT ',',
  decimal_places INTEGER DEFAULT 2,
  compact_mode BOOLEAN DEFAULT false,
  auto_save BOOLEAN DEFAULT true,
  dashboard_widgets JSONB,
  print_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Security Settings
CREATE TABLE security_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method TEXT,
  session_timeout INTEGER DEFAULT 30,
  require_password_change BOOLEAN DEFAULT false,
  password_change_days INTEGER,
  allowed_ips TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Login History
CREATE TABLE login_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  timestamp TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  success BOOLEAN
);

-- Backup Settings (if implementing local backups)
CREATE TABLE backup_settings (
  id UUID PRIMARY KEY,
  auto_backup_enabled BOOLEAN DEFAULT false,
  backup_frequency TEXT DEFAULT 'weekly',
  backup_time TEXT DEFAULT '02:00',
  retention_days INTEGER DEFAULT 30,
  backup_destination TEXT DEFAULT 'local',
  cloud_provider TEXT,
  last_backup TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 5.2 Update PowerSync Rules

```yaml
# Add to bucket_definitions.global.data:
- SELECT * FROM user_profiles
- SELECT * FROM user_preferences
- SELECT * FROM security_settings
- SELECT * FROM login_history
- SELECT * FROM backup_settings
```

#### 5.3 Files to Create

- `src/hooks/useUserProfile.ts`
- `src/hooks/usePreferences.ts`
- `src/hooks/useSecuritySettings.ts`
- `src/hooks/useBackupSettings.ts`

#### 5.4 Files to Modify

- `src/features/settings/pages/user-profile.tsx`
- `src/features/settings/pages/preferences.tsx`
- `src/features/settings/pages/security-settings.tsx`
- `src/features/settings/pages/backup-settings.tsx`
- `src/lib/powersync.ts` (add new table schemas)

---

### Sprint 6: Minor Fixes & Cleanup

**Goal:** Fix remaining inconsistencies

#### 6.1 useProducts Hook Refactor

- Location: `src/features/inventory/hooks/useProducts.ts`
- Change from `usePowerSync().getAll()` to standard `useQuery()` pattern
- Match pattern used in other hooks

#### 6.2 Dashboard Purchase Chart

- Location: `src/hooks/useDashboard.ts` line 243
- Add purchase invoice query to chart data
- Replace hardcoded `purchases: 0`

#### 6.3 Customer Transactions

- Location: `src/features/customers/customers-page.tsx`
- Add hook to fetch customer's invoices and payments
- Replace empty array placeholder

---

## Priority Order

| Sprint   | Priority | Effort | Impact                             |
| -------- | -------- | ------ | ---------------------------------- |
| Sprint 1 | HIGH     | Large  | Foundation for all reports         |
| Sprint 2 | HIGH     | Medium | Core business reports              |
| Sprint 3 | HIGH     | Medium | Party management & inventory       |
| Sprint 4 | HIGH     | Medium | Financial insights                 |
| Sprint 5 | LOW      | Medium | User preferences (works with mock) |
| Sprint 6 | LOW      | Small  | Code quality                       |

---

## Implementation Notes

### Query Pattern for Reports

All report hooks should follow this pattern:

```typescript
export function useSalesSummaryReport(dateRange: DateRange) {
  const { data, isLoading, error } = useQuery<SalesRow>(
    `SELECT
       COUNT(*) as total_invoices,
       SUM(total) as total_sales,
       SUM(tax_amount) as total_tax,
       SUM(discount_amount) as total_discount
     FROM sale_invoices
     WHERE date >= $1 AND date <= $2`,
    [dateRange.from, dateRange.to]
  );

  return {
    summary: data[0] ? mapToSummary(data[0]) : null,
    isLoading,
    error,
  };
}
```

### Date Filtering

Reports should accept `DateRange` prop and pass to SQL queries:

```typescript
interface DateRange {
  from: string; // ISO date
  to: string; // ISO date
}
```

### Existing Hook Examples to Follow

- `src/hooks/useSaleInvoices.ts` - Standard CRUD pattern
- `src/hooks/useDashboard.ts` - Aggregate queries pattern
- `src/hooks/useSettings.ts` - Settings/config pattern
