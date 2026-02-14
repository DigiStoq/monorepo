// ============================================================================
// COMMON REPORT TYPES
// ============================================================================

export interface DateRange {
  from: string;
  to: string;
}

export type ReportPeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "custom";

// ============================================================================
// SALES REPORT TYPES
// ============================================================================

export interface SalesSummary {
  totalSales: number;
  totalInvoices: number;
  totalPaid: number;
  totalDue: number;
  averageOrderValue: number;
  topCustomers: { customerId: string; customerName: string; amount: number }[];
  topItems: {
    itemId: string;
    itemName: string;
    quantity: number;
    amount: number;
  }[];
  salesByMonth: { month: string; amount: number }[];
}

export interface SalesRegisterEntry {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  itemCount: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  status: string;
}

// ============================================================================
// PURCHASE REPORT TYPES
// ============================================================================

export interface PurchaseRegisterEntry {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string; // The hook maps supplierName to customerName or similar field
  itemCount: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  status: string;
}

export interface PurchaseSummary {
  totalPurchases: number;
  totalInvoices: number;
  totalPaid: number;
  totalDue: number;
  averageOrderValue: number;
  topSuppliers: { supplierId: string; supplierName: string; amount: number }[];
  topItems: {
    itemId: string;
    itemName: string;
    quantity: number;
    amount: number;
  }[];
  purchasesByMonth: { month: string; amount: number }[];
}

// ============================================================================
// CUSTOMER REPORT TYPES
// ============================================================================

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: "invoice" | "payment" | "credit_note" | "opening";
  referenceNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CustomerStatement {
  customerId: string;
  customerName: string;
  customerType: "customer" | "supplier" | "both";
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  entries: CustomerLedgerEntry[];
}

export interface CustomerAging {
  customerId: string;
  customerName: string;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
  total: number;
}

// ============================================================================
// INVENTORY REPORT TYPES
// ============================================================================

export interface StockSummaryItem {
  itemId: string;
  itemName: string;
  sku: string;
  category?: string;
  unit: string;
  stockQuantity: number;
  purchasePrice: number;
  salePrice: number;
  stockValue: number;
  lowStockAlert: number;
  isLowStock: boolean;
}

export interface StockMovement {
  itemId: string;
  itemName: string;
  openingStock: number;
  purchased: number;
  sold: number;
  adjusted: number;
  closingStock: number;
}

export interface ItemProfitability {
  itemId: string;
  itemName: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

// ============================================================================
// FINANCIAL REPORT TYPES
// ============================================================================

export interface DayBookEntry {
  id: string;
  date: string;
  type:
    | "sale"
    | "purchase"
    | "payment_in"
    | "payment_out"
    | "expense"
    | "adjustment";
  referenceNumber: string;
  customerName?: string;
  description: string;
  debit: number;
  credit: number;
}

export interface ProfitLossReport {
  period: DateRange;
  revenue: {
    sales: number;
    otherIncome: number;
    total: number;
  };
  expenses: {
    costOfGoodsSold: number;
    operatingExpenses: number;
    otherExpenses: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export interface CashFlowReport {
  period: DateRange;
  openingBalance: number;
  inflows: {
    salesReceipts: number;
    otherReceipts: number;
    total: number;
  };
  outflows: {
    purchasePayments: number;
    expenses: number;
    otherPayments: number;
    total: number;
  };
  netCashFlow: number;
  closingBalance: number;
}

// ============================================================================
// TAX REPORT TYPES
// ============================================================================

export interface TaxSummary {
  period: DateRange;
  salesTax: {
    taxableAmount: number;
    taxCollected: number;
  };
  purchaseTax: {
    taxableAmount: number;
    taxPaid: number;
  };
  netTaxLiability: number;
}

// ============================================================================
// CASH MOVEMENT REPORT TYPES
// ============================================================================

export type PaymentMode = "cash" | "bank" | "card" | "ach" | "cheque" | "other";

export interface PaymentModeMovement {
  mode: PaymentMode;
  label: string;
  moneyIn: number;
  moneyOut: number;
  net: number;
  transactionCount: number;
}

export interface CashMovementTransaction {
  id: string;
  date: string;
  type: "payment_in" | "payment_out" | "expense";
  referenceNumber: string;
  partyName?: string;
  description: string;
  paymentMode: PaymentMode;
  moneyIn: number;
  moneyOut: number;
}

export interface CashMovementReport {
  period: DateRange;
  byMode: PaymentModeMovement[];
  totalMoneyIn: number;
  totalMoneyOut: number;
  netMovement: number;
  transactions: CashMovementTransaction[];
}
