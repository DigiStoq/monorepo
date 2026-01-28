// ============================================================================
// REPORT HOOKS - PowerSync Queries for All Reports
// ============================================================================

import { useQuery } from "@powersync/react";
import { useMemo } from "react";
import type {
  DateRange,
  SalesSummary,
  SalesRegisterEntry,
  PurchaseSummary,
  CustomerStatement,
  CustomerLedgerEntry,
  CustomerAging,
  StockSummaryItem,
  StockMovement,
  ItemProfitability,
  DayBookEntry,
  ProfitLossReport,
  CashFlowReport,
  TaxSummary,
  CashMovementReport,
  CashMovementTransaction,
  PaymentModeMovement,
  PaymentMode,
} from "@/features/reports/types";

// ============================================================================
// DATABASE ROW TYPES
// ============================================================================

interface SalesAggregateRow {
  total_sales: number;
  total_invoices: number;
  total_paid: number;
  total_due: number;
}

interface CustomerSalesRow {
  customer_id: string;
  customer_name: string;
  amount: number;
}

interface ItemSalesRow {
  item_id: string;
  item_name: string;
  quantity: number;
  amount: number;
}

interface SalesMonthRow {
  month: string;
  amount: number;
}

interface SalesRegisterRow {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  item_count: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  status: string;
}

interface PurchaseAggregateRow {
  total_purchases: number;
  total_invoices: number;
  total_paid: number;
  total_due: number;
}

interface SupplierPurchaseRow {
  supplier_id: string;
  supplier_name: string;
  amount: number;
}

interface ItemPurchaseRow {
  item_id: string;
  item_name: string;
  quantity: number;
  amount: number;
}

interface LedgerEntryRow {
  id: string;
  date: string;
  type: string;
  reference_number: string;
  description: string;
  debit: number;
  credit: number;
}

interface AgingRow {
  customer_id: string;
  customer_name: string;
  invoice_id: string;
  amount_due: number;
  due_date: string;
}

interface StockRow {
  id: string;
  name: string;
  sku: string;
  category_name: string | null;
  unit: string;
  stock_quantity: number;
  purchase_price: number;
  sale_price: number;
  low_stock_alert: number;
}

interface StockMovementRow {
  item_id: string;
  item_name: string;
  purchased: number;
  sold: number;
}

interface ItemProfitRow {
  item_id: string;
  item_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
}

interface DayBookRow {
  id: string;
  date: string;
  type: string;
  reference_number: string;
  customer_name: string | null;
  description: string;
  amount: number;
  is_debit: number;
}

interface CashFlowRow {
  type: string;
  total: number;
}

interface TaxRow {
  sales_taxable: number;
  sales_tax: number;
  purchase_taxable: number;
  purchase_tax: number;
}

// ============================================================================
// SALES REPORTS
// ============================================================================

export function useSalesSummaryReport(dateRange: DateRange): {
  summary: SalesSummary | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Main aggregates
  const {
    data: aggregateData,
    isLoading: aggLoading,
    error: aggError,
  } = useQuery<SalesAggregateRow>(
    `SELECT
       COALESCE(SUM(total), 0) as total_sales,
       COUNT(*) as total_invoices,
       COALESCE(SUM(amount_paid), 0) as total_paid,
       COALESCE(SUM(amount_due), 0) as total_due
     FROM sale_invoices
     WHERE date >= $1 AND date <= $2 AND status != 'cancelled'`,
    [dateRange.from, dateRange.to]
  );

  // Top customers
  const { data: customerData, isLoading: custLoading } =
    useQuery<CustomerSalesRow>(
      `SELECT
       customer_id,
       customer_name,
       SUM(total) as amount
     FROM sale_invoices
     WHERE date >= $1 AND date <= $2 AND status != 'cancelled'
     GROUP BY customer_id, customer_name
     ORDER BY amount DESC
     LIMIT 5`,
      [dateRange.from, dateRange.to]
    );

  // Top items
  const { data: itemData, isLoading: itemLoading } = useQuery<ItemSalesRow>(
    `SELECT
       sii.item_id,
       sii.item_name,
       SUM(sii.quantity) as quantity,
       SUM(sii.amount) as amount
     FROM sale_invoice_items sii
     JOIN sale_invoices si ON sii.invoice_id = si.id
     WHERE si.date >= $1 AND si.date <= $2 AND si.status != 'cancelled'
     GROUP BY sii.item_id, sii.item_name
     ORDER BY amount DESC
     LIMIT 5`,
    [dateRange.from, dateRange.to]
  );

  // Sales by month
  const { data: monthData, isLoading: monthLoading } = useQuery<SalesMonthRow>(
    `SELECT
       strftime('%b', date) as month,
       SUM(total) as amount
     FROM sale_invoices
     WHERE date >= $1 AND date <= $2 AND status != 'cancelled'
     GROUP BY strftime('%Y-%m', date)
     ORDER BY date`,
    [dateRange.from, dateRange.to]
  );

  const summary = useMemo((): SalesSummary | null => {
    if (aggregateData.length === 0) return null;

    const agg = aggregateData[0];
    return {
      totalSales: agg.total_sales,
      totalInvoices: agg.total_invoices,
      totalPaid: agg.total_paid,
      totalDue: agg.total_due,
      averageOrderValue:
        agg.total_invoices > 0 ? agg.total_sales / agg.total_invoices : 0,
      topCustomers: customerData.map((c) => ({
        customerId: c.customer_id,
        customerName: c.customer_name,
        amount: c.amount,
      })),
      topItems: itemData.map((i) => ({
        itemId: i.item_id,
        itemName: i.item_name,
        quantity: i.quantity,
        amount: i.amount,
      })),
      salesByMonth: monthData.map((m) => ({
        month: m.month,
        amount: m.amount,
      })),
    };
  }, [aggregateData, customerData, itemData, monthData]);

  return {
    summary,
    isLoading: aggLoading || custLoading || itemLoading || monthLoading,
    error: aggError,
  };
}

export function useSalesRegisterReport(dateRange: DateRange): {
  entries: SalesRegisterEntry[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<SalesRegisterRow>(
    `SELECT
       si.id,
       si.invoice_number,
       si.date,
       si.customer_name,
       (SELECT COUNT(*) FROM sale_invoice_items WHERE invoice_id = si.id) as item_count,
       si.subtotal,
       si.tax_amount,
       si.discount_amount,
       si.total,
       si.amount_paid,
       si.amount_due,
       si.status
     FROM sale_invoices si
     WHERE si.date >= $1 AND si.date <= $2 AND si.status != 'cancelled'
     ORDER BY si.date DESC, si.created_at DESC`,
    [dateRange.from, dateRange.to]
  );

  const entries = useMemo((): SalesRegisterEntry[] => {
    return data.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      date: row.date,
      customerName: row.customer_name,
      itemCount: row.item_count,
      subtotal: row.subtotal,
      tax: row.tax_amount,
      discount: row.discount_amount,
      total: row.total,
      paid: row.amount_paid,
      due: row.amount_due,
      status: row.status,
    }));
  }, [data]);

  return { entries, isLoading, error };
}

export function useSalesByCustomerReport(dateRange: DateRange): {
  data: {
    customerId: string;
    customerName: string;
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
  }[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<{
    customer_id: string;
    customer_name: string;
    invoice_count: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
  }>(
    `SELECT
       customer_id,
       customer_name,
       COUNT(*) as invoice_count,
       SUM(total) as total_amount,
       SUM(amount_paid) as paid_amount,
       SUM(amount_due) as due_amount
     FROM sale_invoices
     WHERE date >= $1 AND date <= $2 AND status != 'cancelled'
     GROUP BY customer_id, customer_name
     ORDER BY total_amount DESC`,
    [dateRange.from, dateRange.to]
  );

  const data = useMemo(() => {
    return rawData.map((row) => ({
      customerId: row.customer_id,
      customerName: row.customer_name,
      invoiceCount: row.invoice_count,
      totalAmount: row.total_amount,
      paidAmount: row.paid_amount,
      dueAmount: row.due_amount,
    }));
  }, [rawData]);

  return { data, isLoading, error };
}

export function useSalesByItemReport(dateRange: DateRange): {
  data: {
    itemId: string;
    itemName: string;
    quantitySold: number;
    totalRevenue: number;
    averagePrice: number;
  }[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<{
    item_id: string;
    item_name: string;
    quantity_sold: number;
    total_revenue: number;
  }>(
    `SELECT
       sii.item_id,
       sii.item_name,
       SUM(sii.quantity) as quantity_sold,
       SUM(sii.amount) as total_revenue
     FROM sale_invoice_items sii
     JOIN sale_invoices si ON sii.invoice_id = si.id
     WHERE si.date >= $1 AND si.date <= $2 AND si.status != 'cancelled'
     GROUP BY sii.item_id, sii.item_name
     ORDER BY total_revenue DESC`,
    [dateRange.from, dateRange.to]
  );

  const data = useMemo(() => {
    return rawData.map((row) => ({
      itemId: row.item_id,
      itemName: row.item_name,
      quantitySold: row.quantity_sold,
      totalRevenue: row.total_revenue,
      averagePrice:
        row.quantity_sold > 0 ? row.total_revenue / row.quantity_sold : 0,
    }));
  }, [rawData]);

  return { data, isLoading, error };
}

// ============================================================================
// PURCHASE REPORTS
// ============================================================================

export function usePurchaseSummaryReport(dateRange: DateRange): {
  summary: PurchaseSummary | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Main aggregates
  const {
    data: aggregateData,
    isLoading: aggLoading,
    error: aggError,
  } = useQuery<PurchaseAggregateRow>(
    `SELECT
       COALESCE(SUM(total), 0) as total_purchases,
       COUNT(*) as total_invoices,
       COALESCE(SUM(amount_paid), 0) as total_paid,
       COALESCE(SUM(amount_due), 0) as total_due
     FROM purchase_invoices
     WHERE date >= $1 AND date <= $2 AND status != 'cancelled'`,
    [dateRange.from, dateRange.to]
  );

  // Top suppliers
  const { data: supplierData, isLoading: suppLoading } =
    useQuery<SupplierPurchaseRow>(
      `SELECT
       customer_id as supplier_id,
       customer_name as supplier_name,
       SUM(total) as amount
     FROM purchase_invoices
     WHERE date >= $1 AND date <= $2 AND status != 'cancelled'
     GROUP BY customer_id, customer_name
     ORDER BY amount DESC
     LIMIT 5`,
      [dateRange.from, dateRange.to]
    );

  // Top items
  const { data: itemData, isLoading: itemLoading } = useQuery<ItemPurchaseRow>(
    `SELECT
       pii.item_id,
       pii.item_name,
       SUM(pii.quantity) as quantity,
       SUM(pii.amount) as amount
     FROM purchase_invoice_items pii
     JOIN purchase_invoices pi ON pii.invoice_id = pi.id
     WHERE pi.date >= $1 AND pi.date <= $2 AND pi.status != 'cancelled'
     GROUP BY pii.item_id, pii.item_name
     ORDER BY amount DESC
     LIMIT 5`,
    [dateRange.from, dateRange.to]
  );

  // Purchases by month
  const { data: monthData, isLoading: monthLoading } = useQuery<SalesMonthRow>(
    `SELECT
       strftime('%b', date) as month,
       SUM(total) as amount
     FROM purchase_invoices
     WHERE date >= $1 AND date <= $2 AND status != 'cancelled'
     GROUP BY strftime('%Y-%m', date)
     ORDER BY date`,
    [dateRange.from, dateRange.to]
  );

  const summary = useMemo((): PurchaseSummary | null => {
    if (aggregateData.length === 0) return null;

    const agg = aggregateData[0];
    return {
      totalPurchases: agg.total_purchases,
      totalInvoices: agg.total_invoices,
      totalPaid: agg.total_paid,
      totalDue: agg.total_due,
      averageOrderValue:
        agg.total_invoices > 0 ? agg.total_purchases / agg.total_invoices : 0,
      topSuppliers: supplierData.map((s) => ({
        supplierId: s.supplier_id,
        supplierName: s.supplier_name,
        amount: s.amount,
      })),
      topItems: itemData.map((i) => ({
        itemId: i.item_id,
        itemName: i.item_name,
        quantity: i.quantity,
        amount: i.amount,
      })),
      purchasesByMonth: monthData.map((m) => ({
        month: m.month,
        amount: m.amount,
      })),
    };
  }, [aggregateData, supplierData, itemData, monthData]);

  return {
    summary,
    isLoading: aggLoading || suppLoading || itemLoading || monthLoading,
    error: aggError,
  };
}

export function usePurchaseRegisterReport(dateRange: DateRange): {
  entries: SalesRegisterEntry[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<SalesRegisterRow>(
    `SELECT
       pi.id,
       pi.invoice_number,
       pi.date,
       pi.customer_name,
       (SELECT COUNT(*) FROM purchase_invoice_items WHERE invoice_id = pi.id) as item_count,
       pi.subtotal,
       pi.tax_amount,
       pi.discount_amount,
       pi.total,
       pi.amount_paid,
       pi.amount_due,
       pi.status
     FROM purchase_invoices pi
     WHERE pi.date >= $1 AND pi.date <= $2 AND pi.status != 'cancelled'
     ORDER BY pi.date DESC, pi.created_at DESC`,
    [dateRange.from, dateRange.to]
  );

  const entries = useMemo((): SalesRegisterEntry[] => {
    return data.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      date: row.date,
      customerName: row.customer_name,
      itemCount: row.item_count,
      subtotal: row.subtotal,
      tax: row.tax_amount,
      discount: row.discount_amount,
      total: row.total,
      paid: row.amount_paid,
      due: row.amount_due,
      status: row.status,
    }));
  }, [data]);

  return { entries, isLoading, error };
}

export function usePurchaseBySupplierReport(dateRange: DateRange): {
  data: {
    supplierId: string;
    supplierName: string;
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
  }[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<{
    supplier_id: string;
    supplier_name: string;
    invoice_count: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
  }>(
    `SELECT
       customer_id as supplier_id,
       customer_name as supplier_name,
       COUNT(*) as invoice_count,
       SUM(total) as total_amount,
       SUM(amount_paid) as paid_amount,
       SUM(amount_due) as due_amount
     FROM purchase_invoices
     WHERE date >= $1 AND date <= $2 AND status != 'cancelled'
     GROUP BY customer_id, customer_name
     ORDER BY total_amount DESC`,
    [dateRange.from, dateRange.to]
  );

  const data = useMemo(() => {
    return rawData.map((row) => ({
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      invoiceCount: row.invoice_count,
      totalAmount: row.total_amount,
      paidAmount: row.paid_amount,
      dueAmount: row.due_amount,
    }));
  }, [rawData]);

  return { data, isLoading, error };
}

export function usePurchaseByItemReport(dateRange: DateRange): {
  data: {
    itemId: string;
    itemName: string;
    quantityPurchased: number;
    totalCost: number;
    averagePrice: number;
  }[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<{
    item_id: string;
    item_name: string;
    quantity_purchased: number;
    total_cost: number;
  }>(
    `SELECT
       pii.item_id,
       pii.item_name,
       SUM(pii.quantity) as quantity_purchased,
       SUM(pii.amount) as total_cost
     FROM purchase_invoice_items pii
     JOIN purchase_invoices pi ON pii.invoice_id = pi.id
     WHERE pi.date >= $1 AND pi.date <= $2 AND pi.status != 'cancelled'
     GROUP BY pii.item_id, pii.item_name
     ORDER BY total_cost DESC`,
    [dateRange.from, dateRange.to]
  );

  const data = useMemo(() => {
    return rawData.map((row) => ({
      itemId: row.item_id,
      itemName: row.item_name,
      quantityPurchased: row.quantity_purchased,
      totalCost: row.total_cost,
      averagePrice:
        row.quantity_purchased > 0
          ? row.total_cost / row.quantity_purchased
          : 0,
    }));
  }, [rawData]);

  return { data, isLoading, error };
}

// ============================================================================
// PARTY/CUSTOMER REPORTS
// ============================================================================

export function useCustomerStatementReport(
  customerId: string,
  dateRange: DateRange
): {
  statement: CustomerStatement | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Get customer info
  const { data: customerData, isLoading: custLoading } = useQuery<{
    id: string;
    name: string;
    type: string;
    opening_balance: number;
  }>(`SELECT id, name, type, opening_balance FROM customers WHERE id = $1`, [
    customerId,
  ]);

  // Get previous balance (net of transactions before start date)
  const { data: prevBalanceData } = useQuery<{
    prev_invoices: number;
    prev_payments: number;
    prev_credits: number;
  }>(
    `SELECT
       (SELECT COALESCE(SUM(total), 0) FROM sale_invoices WHERE customer_id = $1 AND date < $2 AND status != 'cancelled') as prev_invoices,
       (SELECT COALESCE(SUM(amount), 0) FROM payment_ins WHERE customer_id = $1 AND date < $2) as prev_payments,
       (SELECT COALESCE(SUM(total), 0) FROM credit_notes WHERE customer_id = $1 AND date < $2 AND status != 'cancelled') as prev_credits`,
    [customerId, dateRange.from]
  );

  // Get all transactions (invoices, payments, credit notes) in range
  const {
    data: invoiceData,
    isLoading: invLoading,
    error,
  } = useQuery<LedgerEntryRow>(
    `SELECT
       id,
       date,
       'invoice' as type,
       invoice_number as reference_number,
       'Sale Invoice' as description,
       total as debit,
       0 as credit
     FROM sale_invoices
     WHERE customer_id = $1 AND date >= $2 AND date <= $3 AND status != 'cancelled'
     UNION ALL
     SELECT
       id,
       date,
       'payment' as type,
       receipt_number as reference_number,
       'Payment Received' as description,
       0 as debit,
       amount as credit
     FROM payment_ins
     WHERE customer_id = $1 AND date >= $2 AND date <= $3
     UNION ALL
     SELECT
       id,
       date,
       'credit_note' as type,
       credit_note_number as reference_number,
       'Credit Note' as description,
       0 as debit,
       total as credit
     FROM credit_notes
     WHERE customer_id = $1 AND date >= $2 AND date <= $3 AND status != 'cancelled'
     ORDER BY date, type`,
    [customerId, dateRange.from, dateRange.to]
  );

  const statement = useMemo((): CustomerStatement | null => {
    if (customerData.length === 0) return null;

    const customer = customerData[0];
    
    // Calculate true opening balance for the period
    let prevNet = 0;
    if (prevBalanceData.length > 0) {
        const pb = prevBalanceData[0];
        prevNet = pb.prev_invoices - pb.prev_payments - pb.prev_credits;
    }
    
    const reportOpeningBalance = customer.opening_balance + prevNet;

    let balance = reportOpeningBalance;
    const entries: CustomerLedgerEntry[] = [
      {
        id: "opening",
        date: dateRange.from,
        type: "opening",
        referenceNumber: "-",
        description: "Opening Balance",
        debit: balance > 0 ? balance : 0,
        credit: balance < 0 ? Math.abs(balance) : 0,
        balance,
      },
    ];

    let totalDebit = 0;
    let totalCredit = 0;

    for (const row of invoiceData) {
      balance = balance + row.debit - row.credit;
      totalDebit += row.debit;
      totalCredit += row.credit;

      entries.push({
        id: row.id,
        date: row.date,
        type: row.type as "invoice" | "payment" | "credit_note" | "opening",
        referenceNumber: row.reference_number,
        description: row.description,
        debit: row.debit,
        credit: row.credit,
        balance,
      });
    }

    return {
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.type as "customer" | "supplier" | "both",
      openingBalance: reportOpeningBalance,
      totalDebit,
      totalCredit,
      closingBalance: balance,
      entries,
    };
  }, [customerData, invoiceData, prevBalanceData, dateRange.from]);

  return {
    statement,
    isLoading: custLoading || invLoading,
    error,
  };
}

export function useAgingReport(type: "receivable" | "payable"): {
  data: CustomerAging[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const table = type === "receivable" ? "sale_invoices" : "purchase_invoices";

  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<AgingRow>(
    `SELECT
       customer_id,
       customer_name,
       id as invoice_id,
       amount_due,
       due_date
     FROM ${table}
     WHERE amount_due > 0 AND status NOT IN ('paid', 'cancelled')
     ORDER BY customer_name, due_date`
  );

  const data = useMemo((): CustomerAging[] => {
    const today = new Date();
    const agingMap = new Map<string, CustomerAging>();

    for (const row of rawData) {
      const dueDate = new Date(row.due_date);
      const daysPastDue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (!agingMap.has(row.customer_id)) {
        agingMap.set(row.customer_id, {
          customerId: row.customer_id,
          customerName: row.customer_name,
          current: 0,
          days30: 0,
          days60: 0,
          days90: 0,
          over90: 0,
          total: 0,
        });
      }

      const aging = agingMap.get(row.customer_id);
      if (aging) {
        aging.total += row.amount_due;

        if (daysPastDue <= 0) {
          aging.current += row.amount_due;
        } else if (daysPastDue <= 30) {
          aging.days30 += row.amount_due;
        } else if (daysPastDue <= 60) {
          aging.days60 += row.amount_due;
        } else if (daysPastDue <= 90) {
          aging.days90 += row.amount_due;
        } else {
          aging.over90 += row.amount_due;
        }
      }
    }

    return Array.from(agingMap.values()).sort((a, b) => b.total - a.total);
  }, [rawData]);

  return { data, isLoading, error };
}

export function useReceivablesReport(): {
  data: {
    customerId: string;
    customerName: string;
    totalDue: number;
    overdueAmount: number;
    invoiceCount: number;
  }[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<{
    customer_id: string;
    customer_name: string;
    total_due: number;
    overdue_amount: number;
    invoice_count: number;
  }>(
    `SELECT
       customer_id,
       customer_name,
       SUM(amount_due) as total_due,
       SUM(CASE WHEN due_date < date('now') THEN amount_due ELSE 0 END) as overdue_amount,
       COUNT(*) as invoice_count
     FROM sale_invoices
     WHERE amount_due > 0 AND status NOT IN ('paid', 'cancelled')
     GROUP BY customer_id, customer_name
     ORDER BY total_due DESC`
  );

  const data = useMemo(() => {
    return rawData.map((row) => ({
      customerId: row.customer_id,
      customerName: row.customer_name,
      totalDue: row.total_due,
      overdueAmount: row.overdue_amount,
      invoiceCount: row.invoice_count,
    }));
  }, [rawData]);

  return { data, isLoading, error };
}

export function usePayablesReport(): {
  data: {
    supplierId: string;
    supplierName: string;
    totalDue: number;
    overdueAmount: number;
    invoiceCount: number;
  }[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<{
    supplier_id: string;
    supplier_name: string;
    total_due: number;
    overdue_amount: number;
    invoice_count: number;
  }>(
    `SELECT
       customer_id as supplier_id,
       customer_name as supplier_name,
       SUM(amount_due) as total_due,
       SUM(CASE WHEN due_date < date('now') THEN amount_due ELSE 0 END) as overdue_amount,
       COUNT(*) as invoice_count
     FROM purchase_invoices
     WHERE amount_due > 0 AND status NOT IN ('paid', 'cancelled')
     GROUP BY customer_id, customer_name
     ORDER BY total_due DESC`
  );

  const data = useMemo(() => {
    return rawData.map((row) => ({
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      totalDue: row.total_due,
      overdueAmount: row.overdue_amount,
      invoiceCount: row.invoice_count,
    }));
  }, [rawData]);

  return { data, isLoading, error };
}

// ============================================================================
// INVENTORY REPORTS
// ============================================================================

export function useStockSummaryReport(): {
  data: StockSummaryItem[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<StockRow>(
    `SELECT
       i.id,
       i.name,
       i.sku,
       c.name as category_name,
       i.unit,
       i.stock_quantity,
       i.purchase_price,
       i.sale_price,
       i.low_stock_alert
     FROM items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.is_active = 1
     ORDER BY i.name`
  );

  const data = useMemo((): StockSummaryItem[] => {
    return rawData.map((row) => {
      const item: StockSummaryItem = {
        itemId: row.id,
        itemName: row.name,
        sku: row.sku,
        unit: row.unit,
        stockQuantity: row.stock_quantity,
        purchasePrice: row.purchase_price,
        salePrice: row.sale_price,
        stockValue: row.stock_quantity * row.purchase_price,
        lowStockAlert: row.low_stock_alert,
        isLowStock: row.stock_quantity <= row.low_stock_alert,
      };
      if (row.category_name) item.category = row.category_name;
      return item;
    });
  }, [rawData]);

  return { data, isLoading, error };
}

export function useStockMovementReport(dateRange: DateRange): {
  data: StockMovement[];
  isLoading: boolean;
  error: Error | undefined;
} {
  // Get items with their opening stock
  const { data: itemsData, isLoading: itemsLoading } = useQuery<{
    id: string;
    name: string;
    stock_quantity: number;
  }>(`SELECT id, name, stock_quantity FROM items WHERE is_active = 1`);

  // Get purchases in period
  const { data: purchasesData, isLoading: purchasesLoading } =
    useQuery<StockMovementRow>(
      `SELECT
       pii.item_id,
       pii.item_name,
       SUM(pii.quantity) as purchased,
       0 as sold
     FROM purchase_invoice_items pii
     JOIN purchase_invoices pi ON pii.invoice_id = pi.id
     WHERE pi.date >= $1 AND pi.date <= $2 AND pi.status != 'cancelled'
     GROUP BY pii.item_id, pii.item_name`,
      [dateRange.from, dateRange.to]
    );

  // Get sales in period
  const {
    data: salesData,
    isLoading: salesLoading,
    error,
  } = useQuery<StockMovementRow>(
    `SELECT
       sii.item_id,
       sii.item_name,
       0 as purchased,
       SUM(sii.quantity) as sold
     FROM sale_invoice_items sii
     JOIN sale_invoices si ON sii.invoice_id = si.id
     WHERE si.date >= $1 AND si.date <= $2 AND si.status != 'cancelled'
     GROUP BY sii.item_id, sii.item_name`,
    [dateRange.from, dateRange.to]
  );

  const data = useMemo((): StockMovement[] => {
    const movementMap = new Map<string, StockMovement>();

    // Initialize with all items
    for (const item of itemsData) {
      movementMap.set(item.id, {
        itemId: item.id,
        itemName: item.name,
        openingStock: item.stock_quantity,
        purchased: 0,
        sold: 0,
        adjusted: 0,
        closingStock: item.stock_quantity,
      });
    }

    // Add purchases
    for (const purchase of purchasesData) {
      const movement = movementMap.get(purchase.item_id);
      if (movement) {
        movement.purchased = purchase.purchased;
        // Calculate opening = current - purchased + sold
        movement.openingStock =
          movement.closingStock - movement.purchased + movement.sold;
      }
    }

    // Add sales
    for (const sale of salesData) {
      const movement = movementMap.get(sale.item_id);
      if (movement) {
        movement.sold = sale.sold;
        movement.openingStock =
          movement.closingStock - movement.purchased + movement.sold;
      }
    }

    return Array.from(movementMap.values());
  }, [itemsData, purchasesData, salesData]);

  return {
    data,
    isLoading: itemsLoading || purchasesLoading || salesLoading,
    error,
  };
}

export function useLowStockReport(): {
  data: StockSummaryItem[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<StockRow>(
    `SELECT
       i.id,
       i.name,
       i.sku,
       c.name as category_name,
       i.unit,
       i.stock_quantity,
       i.purchase_price,
       i.sale_price,
       i.low_stock_alert
     FROM items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.is_active = 1 AND i.stock_quantity <= i.low_stock_alert
     ORDER BY (i.stock_quantity - i.low_stock_alert), i.name`
  );

  const data = useMemo((): StockSummaryItem[] => {
    return rawData.map((row) => {
      const item: StockSummaryItem = {
        itemId: row.id,
        itemName: row.name,
        sku: row.sku,
        unit: row.unit,
        stockQuantity: row.stock_quantity,
        purchasePrice: row.purchase_price,
        salePrice: row.sale_price,
        stockValue: row.stock_quantity * row.purchase_price,
        lowStockAlert: row.low_stock_alert,
        isLowStock: true,
      };
      if (row.category_name) item.category = row.category_name;
      return item;
    });
  }, [rawData]);

  return { data, isLoading, error };
}

export function useItemProfitabilityReport(dateRange: DateRange): {
  data: ItemProfitability[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<ItemProfitRow>(
    `SELECT
       sii.item_id,
       sii.item_name,
       SUM(sii.quantity) as units_sold,
       SUM(sii.amount) as revenue,
       SUM(sii.quantity * i.purchase_price) as cost
     FROM sale_invoice_items sii
     JOIN sale_invoices si ON sii.invoice_id = si.id
     JOIN items i ON sii.item_id = i.id
     WHERE si.date >= $1 AND si.date <= $2 AND si.status != 'cancelled'
     GROUP BY sii.item_id, sii.item_name
     ORDER BY (SUM(sii.amount) - SUM(sii.quantity * i.purchase_price)) DESC`,
    [dateRange.from, dateRange.to]
  );

  const data = useMemo((): ItemProfitability[] => {
    return rawData.map((row) => {
      const profit = row.revenue - row.cost;
      return {
        itemId: row.item_id,
        itemName: row.item_name,
        unitsSold: row.units_sold,
        revenue: row.revenue,
        cost: row.cost,
        profit,
        margin: row.revenue > 0 ? (profit / row.revenue) * 100 : 0,
      };
    });
  }, [rawData]);

  return { data, isLoading, error };
}

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

export function useDayBookReport(date: string): {
  entries: DayBookEntry[];
  totals: { debit: number; credit: number };
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<DayBookRow>(
    `SELECT id, date, 'sale' as type, invoice_number as reference_number, customer_name, 'Sale Invoice' as description, total as amount, 1 as is_debit
     FROM sale_invoices WHERE date = $1 AND status != 'cancelled'
     UNION ALL
     SELECT id, date, 'purchase' as type, invoice_number as reference_number, customer_name, 'Purchase Invoice' as description, total as amount, 0 as is_debit
     FROM purchase_invoices WHERE date = $1 AND status != 'cancelled'
     UNION ALL
     SELECT id, date, 'payment_in' as type, receipt_number as reference_number, customer_name, 'Payment Received' as description, amount, 0 as is_debit
     FROM payment_ins WHERE date = $1
     UNION ALL
     SELECT id, date, 'payment_out' as type, payment_number as reference_number, customer_name, 'Payment Made' as description, amount, 1 as is_debit
     FROM payment_outs WHERE date = $1
     UNION ALL
     SELECT id, date, 'expense' as type, expense_number as reference_number, supplier_name as customer_name, description, amount, 1 as is_debit
     FROM expenses WHERE date = $1
     ORDER BY type, reference_number`,
    [date]
  );

  const { entries, totals } = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    const mappedEntries: DayBookEntry[] = rawData.map((row) => {
      const debit = row.is_debit === 1 ? row.amount : 0;
      const credit = row.is_debit === 0 ? row.amount : 0;
      totalDebit += debit;
      totalCredit += credit;

      const entry: DayBookEntry = {
        id: row.id,
        date: row.date,
        type: row.type as DayBookEntry["type"],
        referenceNumber: row.reference_number,
        description: row.description,
        debit,
        credit,
      };
      if (row.customer_name) entry.customerName = row.customer_name;
      return entry;
    });

    return {
      entries: mappedEntries,
      totals: { debit: totalDebit, credit: totalCredit },
    };
  }, [rawData]);

  return { entries, totals, isLoading, error };
}

export function useProfitLossReport(dateRange: DateRange): {
  report: ProfitLossReport | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Sales revenue
  const { data: salesData, isLoading: salesLoading } = useQuery<{
    total: number;
  }>(
    `SELECT COALESCE(SUM(total), 0) as total
     FROM sale_invoices
     WHERE date >= $1 AND date <= $2 AND status != 'cancelled'`,
    [dateRange.from, dateRange.to]
  );

  // Cost of goods sold (purchase price of items sold)
  const { data: cogsData, isLoading: cogsLoading } = useQuery<{
    total: number;
  }>(
    `SELECT COALESCE(SUM(sii.quantity * i.purchase_price), 0) as total
     FROM sale_invoice_items sii
     JOIN sale_invoices si ON sii.invoice_id = si.id
     JOIN items i ON sii.item_id = i.id
     WHERE si.date >= $1 AND si.date <= $2 AND si.status != 'cancelled'`,
    [dateRange.from, dateRange.to]
  );

  // Operating expenses
  const {
    data: expensesData,
    isLoading: expLoading,
    error,
  } = useQuery<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM expenses
     WHERE date >= $1 AND date <= $2`,
    [dateRange.from, dateRange.to]
  );

  const report = useMemo((): ProfitLossReport | null => {
    const sales = salesData[0]?.total ?? 0;
    const cogs = cogsData[0]?.total ?? 0;
    const opex = expensesData[0]?.total ?? 0;

    const grossProfit = sales - cogs;
    const netProfit = grossProfit - opex;

    return {
      period: dateRange,
      revenue: {
        sales,
        otherIncome: 0,
        total: sales,
      },
      expenses: {
        costOfGoodsSold: cogs,
        operatingExpenses: opex,
        otherExpenses: 0,
        total: cogs + opex,
      },
      grossProfit,
      netProfit,
      profitMargin: sales > 0 ? (netProfit / sales) * 100 : 0,
    };
  }, [salesData, cogsData, expensesData, dateRange]);

  return {
    report,
    isLoading: salesLoading || cogsLoading || expLoading,
    error,
  };
}

export function useCashFlowReport(dateRange: DateRange): {
  report: CashFlowReport | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Cash inflows (payments received)
  const { data: inflowsData, isLoading: inflowsLoading } =
    useQuery<CashFlowRow>(
      `SELECT 'sales_receipts' as type, COALESCE(SUM(amount), 0) as total
     FROM payment_ins WHERE date >= $1 AND date <= $2
     UNION ALL
     SELECT 'cash_deposits' as type, COALESCE(SUM(amount), 0) as total
     FROM cash_transactions WHERE date >= $1 AND date <= $2 AND type = 'in'`,
      [dateRange.from, dateRange.to]
    );

  // Cash outflows (payments made)
  const {
    data: outflowsData,
    isLoading: outflowsLoading,
    error,
  } = useQuery<CashFlowRow>(
    `SELECT 'purchase_payments' as type, COALESCE(SUM(amount), 0) as total
     FROM payment_outs WHERE date >= $1 AND date <= $2
     UNION ALL
     SELECT 'expenses' as type, COALESCE(SUM(amount), 0) as total
     FROM expenses WHERE date >= $1 AND date <= $2
     UNION ALL
     SELECT 'cash_withdrawals' as type, COALESCE(SUM(amount), 0) as total
     FROM cash_transactions WHERE date >= $1 AND date <= $2 AND type = 'out'`,
    [dateRange.from, dateRange.to]
  );

  // Opening balance (cash at start of period)
  const { data: openingData, isLoading: openingLoading } = useQuery<{
    balance: number;
  }>(
    `SELECT COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END), 0) as balance
     FROM cash_transactions WHERE date < $1`,
    [dateRange.from]
  );

  const report = useMemo((): CashFlowReport | null => {
    const salesReceipts =
      inflowsData.find((r) => r.type === "sales_receipts")?.total ?? 0;
    const otherReceipts =
      inflowsData.find((r) => r.type === "cash_deposits")?.total ?? 0;

    const purchasePayments =
      outflowsData.find((r) => r.type === "purchase_payments")?.total ?? 0;
    const expenses =
      outflowsData.find((r) => r.type === "expenses")?.total ?? 0;
    const otherPayments =
      outflowsData.find((r) => r.type === "cash_withdrawals")?.total ?? 0;

    const totalInflows = salesReceipts + otherReceipts;
    const totalOutflows = purchasePayments + expenses + otherPayments;
    const netCashFlow = totalInflows - totalOutflows;
    const openingBalance = openingData[0]?.balance ?? 0;

    return {
      period: dateRange,
      openingBalance,
      inflows: {
        salesReceipts,
        otherReceipts,
        total: totalInflows,
      },
      outflows: {
        purchasePayments,
        expenses,
        otherPayments,
        total: totalOutflows,
      },
      netCashFlow,
      closingBalance: openingBalance + netCashFlow,
    };
  }, [inflowsData, outflowsData, openingData, dateRange]);

  return {
    report,
    isLoading: inflowsLoading || outflowsLoading || openingLoading,
    error,
  };
}

export function useTaxSummaryReport(dateRange: DateRange): {
  summary: TaxSummary | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<TaxRow>(
    `SELECT
       (SELECT COALESCE(SUM(subtotal), 0) FROM sale_invoices WHERE date >= $1 AND date <= $2 AND status != 'cancelled') as sales_taxable,
       (SELECT COALESCE(SUM(tax_amount), 0) FROM sale_invoices WHERE date >= $1 AND date <= $2 AND status != 'cancelled') as sales_tax,
       (SELECT COALESCE(SUM(subtotal), 0) FROM purchase_invoices WHERE date >= $1 AND date <= $2 AND status != 'cancelled') as purchase_taxable,
       (SELECT COALESCE(SUM(tax_amount), 0) FROM purchase_invoices WHERE date >= $1 AND date <= $2 AND status != 'cancelled') as purchase_tax`,
    [dateRange.from, dateRange.to]
  );

  const summary = useMemo((): TaxSummary | null => {
    if (rawData.length === 0) return null;

    const row = rawData[0];

    return {
      period: dateRange,
      salesTax: {
        taxableAmount: row.sales_taxable,
        taxCollected: row.sales_tax,
      },
      purchaseTax: {
        taxableAmount: row.purchase_taxable,
        taxPaid: row.purchase_tax,
      },
      netTaxLiability: row.sales_tax - row.purchase_tax,
    };
  }, [rawData, dateRange]);

  return { summary, isLoading, error };
}

// ============================================================================
// CASH MOVEMENT REPORT
// ============================================================================

interface CashMovementRow {
  id: string;
  date: string;
  type: string;
  reference_number: string;
  party_name: string | null;
  description: string;
  payment_mode: string;
  amount: number;
  is_money_in: number;
}

const paymentModeLabels: Record<PaymentMode, string> = {
  cash: "Cash",
  bank: "Bank Transfer",
  card: "Card",
  ach: "ACH Transfer",
  cheque: "Cheque",
  other: "Other",
};

export function useCashMovementReport(
  dateRange: DateRange,
  modeFilter?: PaymentMode
): {
  report: CashMovementReport | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Fetch all payment transactions
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<CashMovementRow>(
    `SELECT
       id, date, 'payment_in' as type, receipt_number as reference_number,
       customer_name as party_name, 'Payment Received' as description,
       payment_mode, amount, 1 as is_money_in
     FROM payment_ins
     WHERE date >= $1 AND date <= $2
       AND ($3 IS NULL OR payment_mode = $3)
     UNION ALL
     SELECT
       id, date, 'payment_out' as type, payment_number as reference_number,
       customer_name as party_name, 'Payment Made' as description,
       payment_mode, amount, 0 as is_money_in
     FROM payment_outs
     WHERE date >= $1 AND date <= $2
       AND ($3 IS NULL OR payment_mode = $3)
     UNION ALL
     SELECT
       id, date, 'expense' as type, expense_number as reference_number,
       COALESCE(paid_to_name, customer_name) as party_name,
       COALESCE(description, category) as description,
       payment_mode, amount, 0 as is_money_in
     FROM expenses
     WHERE date >= $1 AND date <= $2
       AND ($3 IS NULL OR payment_mode = $3)
     ORDER BY date DESC, type`,
    [dateRange.from, dateRange.to, modeFilter ?? null]
  );

  const report = useMemo((): CashMovementReport | null => {
    // Build transactions list
    const transactions: CashMovementTransaction[] = rawData.map((row) => ({
      id: row.id,
      date: row.date,
      type: row.type as CashMovementTransaction["type"],
      referenceNumber: row.reference_number,
      partyName: row.party_name ?? undefined,
      description: row.description,
      paymentMode: row.payment_mode as PaymentMode,
      moneyIn: row.is_money_in === 1 ? row.amount : 0,
      moneyOut: row.is_money_in === 0 ? row.amount : 0,
    }));

    // Aggregate by payment mode
    const modeMap = new Map<PaymentMode, PaymentModeMovement>();
    const allModes: PaymentMode[] = [
      "cash",
      "bank",
      "card",
      "ach",
      "cheque",
      "other",
    ];

    // Initialize all modes
    for (const mode of allModes) {
      modeMap.set(mode, {
        mode,
        label: paymentModeLabels[mode],
        moneyIn: 0,
        moneyOut: 0,
        net: 0,
        transactionCount: 0,
      });
    }

    // Aggregate transactions
    let totalMoneyIn = 0;
    let totalMoneyOut = 0;

    for (const tx of transactions) {
      const modeSummary = modeMap.get(tx.paymentMode);
      if (modeSummary) {
        modeSummary.moneyIn += tx.moneyIn;
        modeSummary.moneyOut += tx.moneyOut;
        modeSummary.transactionCount += 1;
      }
      totalMoneyIn += tx.moneyIn;
      totalMoneyOut += tx.moneyOut;
    }

    // Calculate net for each mode
    for (const summary of modeMap.values()) {
      summary.net = summary.moneyIn - summary.moneyOut;
    }

    // Filter to only modes with transactions (unless filtering by mode)
    const byMode = Array.from(modeMap.values()).filter((m) =>
      modeFilter ? m.mode === modeFilter : m.transactionCount > 0
    );

    return {
      period: dateRange,
      byMode,
      totalMoneyIn,
      totalMoneyOut,
      netMovement: totalMoneyIn - totalMoneyOut,
      transactions,
    };
  }, [rawData, dateRange, modeFilter]);

  return { report, isLoading, error };
}
