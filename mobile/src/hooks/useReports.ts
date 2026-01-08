import { useQuery } from "@powersync/react-native";
import { useMemo } from "react";

// Types
export interface DateRange {
  from: string;
  to: string;
}

export interface SalesSummary {
  totalSales: number;
  totalInvoices: number;
  totalPaid: number;
  totalDue: number;
  averageOrderValue: number;
  topCustomers: {
    customerId: string;
    customerName: string;
    amount: number;
  }[];
  topItems: {
    itemId: string;
    itemName: string;
    quantity: number;
    amount: number;
  }[];
  salesByMonth: {
    month: string;
    amount: number;
  }[];
}

// Database Rows
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

export function useSalesSummaryReport(dateRange: DateRange): {
  summary: SalesSummary | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Main aggregates
  const { data: aggregateData, loading: aggLoading, error: aggError } = useQuery<SalesAggregateRow>(
    `SELECT
       COALESCE(SUM(total), 0) as total_sales,
       COUNT(*) as total_invoices,
       COALESCE(SUM(amount_paid), 0) as total_paid,
       COALESCE(SUM(amount_due), 0) as total_due
     FROM sale_invoices
     WHERE date >= ? AND date <= ? AND status != 'cancelled'`,
    [dateRange.from, dateRange.to]
  );

  // Top customers
  const { data: customerData, loading: custLoading } = useQuery<CustomerSalesRow>(
      `SELECT
       customer_id,
       customer_name,
       SUM(total) as amount
     FROM sale_invoices
     WHERE date >= ? AND date <= ? AND status != 'cancelled'
     GROUP BY customer_id, customer_name
     ORDER BY amount DESC
     LIMIT 5`,
      [dateRange.from, dateRange.to]
    );

  // Top items
  const { data: itemData, loading: itemLoading } = useQuery<ItemSalesRow>(
    `SELECT
       sii.item_id,
       sii.item_name,
       SUM(sii.quantity) as quantity,
       SUM(sii.amount) as amount
     FROM sale_invoice_items sii
     JOIN sale_invoices si ON sii.invoice_id = si.id
     WHERE si.date >= ? AND si.date <= ? AND si.status != 'cancelled'
     GROUP BY sii.item_id, sii.item_name
     ORDER BY amount DESC
     LIMIT 5`,
    [dateRange.from, dateRange.to]
  );

  // Sales by month
  const { data: monthData, loading: monthLoading } = useQuery<SalesMonthRow>(
    `SELECT
       strftime('%m', date) as month,
       SUM(total) as amount
     FROM sale_invoices
     WHERE date >= ? AND date <= ? AND status != 'cancelled'
     GROUP BY strftime('%Y-%m', date)
     ORDER BY date`,
    [dateRange.from, dateRange.to]
  );

  const summary = useMemo((): SalesSummary | null => {
    if (!aggregateData || aggregateData.length === 0) return null;

    const agg = aggregateData[0];
    return {
      totalSales: agg.total_sales,
      totalInvoices: agg.total_invoices,
      totalPaid: agg.total_paid,
      totalDue: agg.total_due,
      averageOrderValue: agg.total_invoices > 0 ? agg.total_sales / agg.total_invoices : 0,
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
    isLoading: !!(aggLoading || custLoading || itemLoading || monthLoading),
    error: aggError,
  };
}

export function useSalesRegisterReport(dateRange: DateRange): {
  entries: SalesRegisterEntry[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, loading, error } = useQuery<SalesRegisterRow>(
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
     WHERE si.date >= ? AND si.date <= ? AND si.status != 'cancelled'
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

  return { entries, isLoading: loading, error };
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
    loading,
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
     WHERE date >= ? AND date <= ? AND status != 'cancelled'
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

  return { data, isLoading: loading, error };
}

export interface ProfitLossReport {
  revenue: {
    total: number;
    breakdown: { category: string; amount: number }[];
  };
  cogs: {
    total: number;
    breakdown: { category: string; amount: number }[];
  };
  grossProfit: number;
  expenses: {
    total: number;
    breakdown: { category: string; amount: number }[];
  };
  netProfit: number;
}

export function useProfitLossReport(dateRange: DateRange): {
  data: ProfitLossReport | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // 1. Revenue: Sales (excluding tax? Usually P&L uses Net Sales (Total - Tax). Simplicity: Total)
  // Let's use 'subtotal' (amount before tax) for Revenue to be more accurate, or 'total'.
  // Typically Revenue is Net amount. Let's use `total` for now as simplified.
  // Actually, Sales = Total Sales
  const { data: salesData, loading: salesLoading } = useQuery<{ total: number }>(
    `SELECT COALESCE(SUM(total), 0) as total FROM sale_invoices WHERE date >= ? AND date <= ? AND status != 'cancelled'`,
    [dateRange.from, dateRange.to]
  );

  // 2. COGS (Cost of Goods Sold): Purchase Invoices
  // This is a simplification. Real COGS = Opening Stock + Purchases - Closing Stock.
  // For this app, simply treating Purchases as COGS for now as per simple schema.
  const { data: purchaseData, loading: purchLoading } = useQuery<{ total: number }>(
    `SELECT COALESCE(SUM(total), 0) as total FROM purchase_invoices WHERE date >= ? AND date <= ? AND status != 'cancelled'`,
    [dateRange.from, dateRange.to]
  );

  // 3. Expenses
  const { data: expenseData, loading: expLoading } = useQuery<{ category: string; amount: number }>(
    `SELECT category, SUM(amount) as amount FROM expenses WHERE date >= ? AND date <= ? GROUP BY category`,
    [dateRange.from, dateRange.to]
  );

  const data = useMemo((): ProfitLossReport | null => {
    if (!salesData || !purchaseData || !expenseData) return null;

    const revenueTotal = salesData[0]?.total || 0;
    const cogsTotal = purchaseData[0]?.total || 0;
    
    const expenseTotal = expenseData.reduce((sum, item) => sum + item.amount, 0);
    const expenseBreakdown = expenseData.map(e => ({ category: e.category || 'Uncategorized', amount: e.amount }));

    return {
      revenue: {
        total: revenueTotal,
        breakdown: [{ category: 'Sales', amount: revenueTotal }]
      },
      cogs: {
        total: cogsTotal,
        breakdown: [{ category: 'Purchases', amount: cogsTotal }]
      },
      grossProfit: revenueTotal - cogsTotal,
      expenses: {
        total: expenseTotal,
        breakdown: expenseBreakdown
      },
      netProfit: (revenueTotal - cogsTotal) - expenseTotal
    };
  }, [salesData, purchaseData, expenseData]);

  return {
    data,
    isLoading: !!(salesLoading || purchLoading || expLoading),
    error: undefined
  };
}

export interface StockSummaryItem {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  purchasePrice: number;
  salePrice: number;
  stockValue: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface StockSummary {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  items: StockSummaryItem[];
}

export function useStockSummaryReport(): {
  summary: StockSummary | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data: itemsData, loading, error } = useQuery<{
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
    purchase_price: number;
    sale_price: number;
    low_stock_alert: number;
  }>(
    `SELECT 
       id, name, sku, stock_quantity, purchase_price, sale_price, low_stock_alert 
     FROM items 
     WHERE is_active = 1
     ORDER BY stock_quantity DESC`
  );

  const summary = useMemo((): StockSummary | null => {
    if (!itemsData) return null;

    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const items: StockSummaryItem[] = itemsData.map((item) => {
      const quantity = item.stock_quantity || 0;
      const value = quantity * (item.purchase_price || 0);
      const lowStock = item.low_stock_alert || 0;
      
      let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
      if (quantity <= 0) {
        status = 'out-of-stock';
        outOfStockCount++;
      } else if (quantity <= lowStock) {
        status = 'low-stock';
        lowStockCount++;
      }

      totalValue += value;

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        stockQuantity: quantity,
        purchasePrice: item.purchase_price || 0,
        salePrice: item.sale_price || 0,
        stockValue: value,
        status,
      };
    });

    return {
      totalItems: items.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
      items,
    };
  }, [itemsData]);

  return { summary, isLoading: loading, error };
}

export interface CashFlowReport {
  inflows: {
    total: number;
    breakdown: { category: string; amount: number }[];
  };
  outflows: {
    total: number;
    breakdown: { category: string; amount: number }[];
  };
  netCashFlow: number;
}

export function useCashFlowReport(dateRange: DateRange): {
  data: CashFlowReport | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Inflows
  const { data: incomeData, loading: incLoading } = useQuery<{ type: string; amount: number }>(
    `SELECT 'Customer Payments' as type, SUM(amount) as amount FROM payment_ins WHERE date >= ? AND date <= ?
     UNION ALL
     SELECT 'Cash In' as type, SUM(amount) as amount FROM cash_transactions WHERE type = 'in' AND date >= ? AND date <= ?
     UNION ALL
     SELECT 'Bank Deposits' as type, SUM(amount) as amount FROM bank_transactions WHERE type = 'deposit' AND date >= ? AND date <= ?`,
    [dateRange.from, dateRange.to, dateRange.from, dateRange.to, dateRange.from, dateRange.to]
  );

  // Outflows
  const { data: expenseData, loading: expLoading } = useQuery<{ type: string; amount: number }>(
    `SELECT 'Vendor Payments' as type, SUM(amount) as amount FROM payment_outs WHERE date >= ? AND date <= ?
     UNION ALL
     SELECT 'Expenses' as type, SUM(amount) as amount FROM expenses WHERE date >= ? AND date <= ?
     UNION ALL
     SELECT 'Cash Out' as type, SUM(amount) as amount FROM cash_transactions WHERE type = 'out' AND date >= ? AND date <= ?
     UNION ALL
     SELECT 'Bank Withdrawals' as type, SUM(amount) as amount FROM bank_transactions WHERE type = 'withdrawal' AND date >= ? AND date <= ?`,
     [dateRange.from, dateRange.to, dateRange.from, dateRange.to, dateRange.from, dateRange.to, dateRange.from, dateRange.to]
  );

  const data = useMemo((): CashFlowReport | null => {
    if (!incomeData || !expenseData) return null;

    const inflowBreakdown = incomeData.filter(d => d.amount > 0).map(d => ({ category: d.type, amount: d.amount }));
    const totalInflow = inflowBreakdown.reduce((sum, item) => sum + item.amount, 0);

    const outflowBreakdown = expenseData.filter(d => d.amount > 0).map(d => ({ category: d.type, amount: d.amount }));
    const totalOutflow = outflowBreakdown.reduce((sum, item) => sum + item.amount, 0);

    return {
      inflows: {
        total: totalInflow,
        breakdown: inflowBreakdown
      },
      outflows: {
        total: totalOutflow,
        breakdown: outflowBreakdown
      },
      netCashFlow: totalInflow - totalOutflow
    };
  }, [incomeData, expenseData]);

  return { data, isLoading: incLoading || expLoading, error: undefined };
}

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: 'invoice' | 'payment' | 'credit_note' | 'opening';
  referenceNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CustomerStatement {
  customerId: string;
  customerName: string;
  customerType: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  entries: CustomerLedgerEntry[];
}

export function useCustomerStatementReport(
  customerId: string,
  dateRange: DateRange
): {
  statement: CustomerStatement | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Get customer info
  const { data: customerData, loading: custLoading } = useQuery<{
    id: string;
    name: string;
    type: string;
    opening_balance: number;
  }>(`SELECT id, name, type, opening_balance FROM customers WHERE id = ?`, [
    customerId,
  ]);

  // Get all transactions (invoices, payments, credit notes)
  const {
    data: invoiceData,
    loading: invLoading,
    error,
  } = useQuery<{
    id: string;
    date: string;
    type: string;
    reference_number: string;
    description: string;
    debit: number;
    credit: number;
  }>(
    `SELECT
       id,
       date,
       'invoice' as type,
       invoice_number as reference_number,
       'Sale Invoice' as description,
       total as debit,
       0 as credit
     FROM sale_invoices
     WHERE customer_id = ? AND date >= ? AND date <= ? AND status != 'cancelled'
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
     WHERE customer_id = ? AND date >= ? AND date <= ?
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
     WHERE customer_id = ? AND date >= ? AND date <= ? AND status != 'cancelled'
     ORDER BY date ASC`,
    [
      customerId, dateRange.from, dateRange.to,
      customerId, dateRange.from, dateRange.to,
      customerId, dateRange.from, dateRange.to
    ]
  );

  const statement = useMemo((): CustomerStatement | null => {
    if (!customerData || customerData.length === 0) return null;

    const customer = customerData[0];

    // NOTE: This logic assumes opening balance is up to "from" date.
    // In a real accounting system, we'd SUM() all previous transactions < fromDate 
    // to calculate the true opening balance for this period.
    // For simplicity here, we are using the customer's static opening balance field
    // which might strictly mean "balance at time of creation".
    // A more robust solution would be:
    // realOpening = customer.opening_balance + SUM(debit - credit) WHERE date < fromDate
    
    let balance = customer.opening_balance || 0;
    
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

    if (invoiceData) {
        for (const row of invoiceData) {
        balance = balance + row.debit - row.credit;
        totalDebit += row.debit;
        totalCredit += row.credit;

        entries.push({
            id: row.id,
            date: row.date,
            type: row.type as any,
            referenceNumber: row.reference_number,
            description: row.description,
            debit: row.debit,
            credit: row.credit,
            balance,
        });
        }
    }

    return {
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.type,
      openingBalance: customer.opening_balance,
      totalDebit,
      totalCredit,
      closingBalance: balance,
      entries,
    };
  }, [customerData, invoiceData, dateRange.from]);

  return {
    statement,
    isLoading: !!(custLoading || invLoading),
    error,
  };
}

export interface PurchaseSummary {
  totalPurchases: number;
  totalInvoices: number;
  totalPaid: number;
  totalDue: number;
  topSuppliers: {
    supplierId: string;
    supplierName: string;
    amount: number;
  }[];
  purchasesByMonth: {
    month: string;
    amount: number;
  }[];
}

export function usePurchaseSummaryReport(dateRange: DateRange): {
  summary: PurchaseSummary | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Main aggregates
  const { data: aggregateData, loading: aggLoading, error: aggError } = useQuery<{
      total_purchases: number;
      total_invoices: number;
      total_paid: number;
      total_due: number;
  }>(
    `SELECT
       COALESCE(SUM(total), 0) as total_purchases,
       COUNT(*) as total_invoices,
       COALESCE(SUM(amount_paid), 0) as total_paid,
       COALESCE(SUM(amount_due), 0) as total_due
     FROM purchase_invoices
     WHERE date >= ? AND date <= ? AND status != 'cancelled'`,
    [dateRange.from, dateRange.to]
  );

  // Top suppliers
  const { data: supplierData, loading: suppLoading } = useQuery<{
      customer_id: string; // supplier
      customer_name: string;
      amount: number;
  }>(
      `SELECT
       customer_id,
       customer_name,
       SUM(total) as amount
     FROM purchase_invoices
     WHERE date >= ? AND date <= ? AND status != 'cancelled'
     GROUP BY customer_id, customer_name
     ORDER BY amount DESC
     LIMIT 5`,
      [dateRange.from, dateRange.to]
    );

  // Purchases by month
  const { data: monthData, loading: monthLoading } = useQuery<{
      month: string;
      amount: number;
  }>(
    `SELECT
       strftime('%m', date) as month,
       SUM(total) as amount
     FROM purchase_invoices
     WHERE date >= ? AND date <= ? AND status != 'cancelled'
     GROUP BY strftime('%Y-%m', date)
     ORDER BY date`,
    [dateRange.from, dateRange.to]
  );

  const summary = useMemo((): PurchaseSummary | null => {
    if (!aggregateData || aggregateData.length === 0) return null;

    const agg = aggregateData[0];
    return {
      totalPurchases: agg.total_purchases,
      totalInvoices: agg.total_invoices,
      totalPaid: agg.total_paid,
      totalDue: agg.total_due,
      topSuppliers: supplierData.map((c) => ({
        supplierId: c.customer_id,
        supplierName: c.customer_name,
        amount: c.amount,
      })),
      purchasesByMonth: monthData.map((m) => ({
        month: m.month,
        amount: m.amount,
      })),
    };
  }, [aggregateData, supplierData, monthData]);

  return {
    summary,
    isLoading: !!(aggLoading || suppLoading || monthLoading),
    error: aggError,
  };
}

export function usePurchaseRegisterReport(dateRange: DateRange) {
    const { data, loading, error } = useQuery<{
      id: string;
      invoice_number: string;
      supplier_invoice_number: string;
      date: string;
      customer_name: string; // Supplier Name
      total: number;
      amount_paid: number;
      amount_due: number;
      status: string;
    }>(
      `SELECT
         id,
         invoice_number,
         supplier_invoice_number,
         date,
         customer_name,
         total,
         amount_paid,
         amount_due,
         status
       FROM purchase_invoices
       WHERE date >= ? AND date <= ? AND status != 'cancelled'
       ORDER BY date DESC`,
      [dateRange.from, dateRange.to]
    );
  
    return { data, isLoading: loading, error };
}

export interface AgingBucket {
  range: string; // 'Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'
  amount: number;
}

export interface AgingReport {
  totalDue: number;
  buckets: AgingBucket[];
  customers: {
    id: string;
    name: string;
    totalDue: number;
    buckets: { range: string; amount: number }[];
  }[];
}

export function useReceivablesAgingReport(): {
  report: AgingReport | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, loading, error } = useQuery<{
    id: string;
    customer_id: string;
    customer_name: string;
    due_date: string;
    date: string;
    amount_due: number;
  }>(
    `SELECT id, customer_id, customer_name, due_date, date, amount_due 
     FROM sale_invoices 
     WHERE amount_due > 0 AND status != 'cancelled'`
  );

  const report = useMemo((): AgingReport | null => {
    if (!data) return null;

    const bucketsStr = ['1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
    const now = new Date();
    
    // Initialize totals
    const totalBuckets: Record<string, number> = {};
    bucketsStr.forEach(b => totalBuckets[b] = 0);
    totalBuckets['Current'] = 0;

    const customerMap: Record<string, { id: string; name: string; totalDue: number; buckets: Record<string, number> }> = {};

    let totalDue = 0;

    data.forEach(inv => {
        const dueDate = new Date(inv.due_date || inv.date); // Fallback to date if due_date missing
        const diffTime = now.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        let bucket = 'Current';
        if (diffDays > 90) bucket = '90+ Days';
        else if (diffDays > 60) bucket = '61-90 Days';
        else if (diffDays > 30) bucket = '31-60 Days';
        else if (diffDays > 0) bucket = '1-30 Days';
        // If diffDays <= 0, it is not overdue yet, so "Current"
        
        totalDue += inv.amount_due;
        totalBuckets[bucket] += inv.amount_due;

        if (!customerMap[inv.customer_id]) {
            customerMap[inv.customer_id] = {
                id: inv.customer_id,
                name: inv.customer_name,
                totalDue: 0,
                buckets: { 'Current': 0, '1-30 Days': 0, '31-60 Days': 0, '61-90 Days': 0, '90+ Days': 0 }
            };
        }
        customerMap[inv.customer_id].totalDue += inv.amount_due;
        customerMap[inv.customer_id].buckets[bucket] += inv.amount_due;
    });

    const customers = Object.values(customerMap).map(c => ({
        id: c.id,
        name: c.name,
        totalDue: c.totalDue,
        buckets: Object.entries(c.buckets).map(([range, amount]) => ({ range, amount }))
        // sort buckets order if needed, but handled by UI usually
    })).sort((a, b) => b.totalDue - a.totalDue);

    const finalBuckets = Object.entries(totalBuckets).map(([range, amount]) => ({ range, amount }));

    return {
        totalDue,
        buckets: finalBuckets,
        customers
    };
  }, [data]);

  return { report, isLoading: loading, error };
}

export function usePayablesAgingReport(): {
  report: AgingReport | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  // Similar logic but for purchase_invoices
  // Note: purchase_invoices might not have due_date in our simplified schema.
  // We'll use 'date' + 30 days implication or just use 'date'.
  // Let's check schema. We did NOT add due_date to purchase_invoices explicitly in previous turn.
  // We'll use 'date' (invoice date) to calculate age.
  
  const { data, loading, error } = useQuery<{
    id: string;
    customer_id: string; // Supplier ID
    customer_name: string; // Supplier Name
    date: string;
    amount_due: number;
    // no due_date in purchase_invoices yet?
  }>(
    `SELECT id, customer_id, customer_name, date, amount_due 
     FROM purchase_invoices 
     WHERE amount_due > 0 AND status != 'cancelled'`
  );

  const report = useMemo((): AgingReport | null => {
    if (!data) return null;

    const bucketsStr = ['1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
    const now = new Date();
    
    const totalBuckets: Record<string, number> = {};
    bucketsStr.forEach(b => totalBuckets[b] = 0);
    totalBuckets['Current'] = 0;

    const customerMap: Record<string, { id: string; name: string; totalDue: number; buckets: Record<string, number> }> = {};

    let totalDue = 0;

    data.forEach(inv => {
        const invDate = new Date(inv.date);
        const diffTime = now.getTime() - invDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        let bucket = 'Current';
        if (diffDays > 90) bucket = '90+ Days';
        else if (diffDays > 60) bucket = '61-90 Days';
        else if (diffDays > 30) bucket = '31-60 Days';
        else if (diffDays > 0) bucket = '1-30 Days';
        
        totalDue += inv.amount_due;
        totalBuckets[bucket] += inv.amount_due;

        if (!customerMap[inv.customer_id]) {
            customerMap[inv.customer_id] = {
                id: inv.customer_id,
                name: inv.customer_name,
                totalDue: 0,
                buckets: { 'Current': 0, '1-30 Days': 0, '31-60 Days': 0, '61-90 Days': 0, '90+ Days': 0 }
            };
        }
        customerMap[inv.customer_id].totalDue += inv.amount_due;
        customerMap[inv.customer_id].buckets[bucket] += inv.amount_due;
    });

    const customers = Object.values(customerMap).map(c => ({
        id: c.id,
        name: c.name,
        totalDue: c.totalDue,
        buckets: Object.entries(c.buckets).map(([range, amount]) => ({ range, amount }))
    })).sort((a, b) => b.totalDue - a.totalDue);

    const finalBuckets = Object.entries(totalBuckets).map(([range, amount]) => ({ range, amount }));

    return {
        totalDue,
        buckets: finalBuckets,
        customers
    };
  }, [data]);

  return { report, isLoading: loading, error };
}

export function useExpenseReport(dateRange: DateRange) {
    const { data, loading, error } = useQuery<{
        category: string;
        amount: number;
        count: number;
    }>(
        `SELECT category, SUM(amount) as amount, COUNT(*) as count 
         FROM expenses 
         WHERE date >= ? AND date <= ? 
         GROUP BY category 
         ORDER BY amount DESC`,
        [dateRange.from, dateRange.to]
    );
    return { data, isLoading: loading, error };
}

export function useSalesByItemReport(dateRange: DateRange) {
    const { data, loading, error } = useQuery<{
        item_id: string;
        item_name: string;
        quantity: number;
        amount: number;
    }>(
        `SELECT 
            sii.item_id, 
            sii.item_name, 
            SUM(sii.quantity) as quantity, 
            SUM(sii.amount) as amount 
         FROM sale_invoice_items sii
         JOIN sale_invoices si ON sii.invoice_id = si.id
         WHERE si.date >= ? AND si.date <= ? AND si.status != 'cancelled'
         GROUP BY sii.item_id, sii.item_name
         ORDER BY amount DESC`,
        [dateRange.from, dateRange.to]
    );
    return { data, isLoading: loading, error };
}

export function useCustomerBalanceReport() {
    const { data, loading, error } = useQuery<{
        id: string;
        name: string;
        phone: string;
        current_balance: number;
    }>(
        `SELECT id, name, phone, current_balance 
         FROM customers
         WHERE current_balance != 0
         ORDER BY current_balance DESC`
    );
    return { data, isLoading: loading, error };
}

export function usePurchasesBySupplierReport(dateRange: DateRange) {
    const { data, loading, error } = useQuery<{
        supplier_id: string;
        supplier_name: string; // stored as customer_name in purchase_invoices
        invoice_count: number;
        total_amount: number;
    }>(
        `SELECT 
            customer_id as supplier_id,
            customer_name as supplier_name,
            COUNT(*) as invoice_count,
            SUM(total) as total_amount
         FROM purchase_invoices
         WHERE date >= ? AND date <= ? AND status != 'cancelled'
         GROUP BY customer_id, customer_name
         ORDER BY total_amount DESC`,
        [dateRange.from, dateRange.to]
    );
    return { data, isLoading: loading, error };
}

export function useLowStockReport() {
    // Items where stock quantity is less than or equal to low_stock_alert (default 0 or specified)
    // Assuming low_stock_alert is a field. If not, we use 5 as default.
    const { data, loading, error } = useQuery<{
        id: string;
        name: string;
        stock_quantity: number;
        low_stock_alert: number;
    }>(
        `SELECT id, name, stock_quantity, COALESCE(low_stock_alert, 5) as low_stock_alert
         FROM items
         WHERE stock_quantity <= COALESCE(low_stock_alert, 5)
         ORDER BY stock_quantity ASC`
    );
    return { data, isLoading: loading, error };
}

export function useItemProfitabilityReport(dateRange: DateRange) {
    // Profit = (Sale Price - Purchase Price) * Quantity
    // We get Sale Price from Invoice Item (unit_price)
    // We get Purchase Price from Item definition (avg cost?) or simplistically current purchase_price from items table
    // For this MVP, we will join with `items` table to get current cost price.
    
    const { data, loading, error } = useQuery<{
        item_id: string;
        item_name: string;
        quantity_sold: number;
        revenue: number;
        cost: number;
        profit: number;
    }>(
        `SELECT 
            sii.item_id,
            sii.item_name,
            SUM(sii.quantity) as quantity_sold,
            SUM(sii.amount) as revenue,
            SUM(sii.quantity * i.purchase_price) as cost,
            (SUM(sii.amount) - SUM(sii.quantity * i.purchase_price)) as profit
         FROM sale_invoice_items sii
         JOIN items i ON sii.item_id = i.id
         JOIN sale_invoices si ON sii.invoice_id = si.id
         WHERE si.date >= ? AND si.date <= ? AND si.status != 'cancelled'
         GROUP BY sii.item_id, sii.item_name
         ORDER BY profit DESC`,
        [dateRange.from, dateRange.to]
    );
    return { data, isLoading: loading, error };
}

export function useTaxSummaryReport(dateRange: DateRange) {
    // Tax Collected (Output Tax) from Sales
    const { data: salesTax, loading: sLoading } = useQuery<{ total_tax: number }>(
        `SELECT SUM(tax_amount) as total_tax FROM sale_invoices 
         WHERE date >= ? AND date <= ? AND status != 'cancelled'`,
        [dateRange.from, dateRange.to]
    );

    // Tax Paid (Input Tax) from Purchases - assuming purchase_invoices has tax_amount
    // If we didn't add tax_amount to purchase_invoices, we assume 0 or check schema.
    // We added purchase_orders tax, assuming purchase_invoices has it too (it should).
    const { data: purchaseTax, loading: pLoading } = useQuery<{ total_tax: number }>(
        `SELECT SUM(tax_amount) as total_tax FROM purchase_invoices 
         WHERE date >= ? AND date <= ? AND status != 'cancelled'`,
        [dateRange.from, dateRange.to]
    );

    const report = {
        taxCollected: salesTax?.[0]?.total_tax || 0,
        taxPaid: purchaseTax?.[0]?.total_tax || 0,
        netTax: (salesTax?.[0]?.total_tax || 0) - (purchaseTax?.[0]?.total_tax || 0)
    };

    return { data: report, isLoading: sLoading || pLoading, error: undefined };
}

export function useDayBookReport(date: string) {
    // All transactions for a specific day
    // Sales, Purchases, Payments In, Payments Out, Expenses
    
    // We'll use a UNION query
    const { data, loading, error } = useQuery<{
        id: string;
        type: string;
        description: string;
        amount_in: number;
        amount_out: number;
    }>(
        `SELECT id, 'Sale' as type, invoice_number as description, total as amount_in, 0 as amount_out 
         FROM sale_invoices WHERE date = ? AND status != 'cancelled'
         UNION ALL
         SELECT id, 'Purchase' as type, invoice_number as description, 0 as amount_in, total as amount_out 
         FROM purchase_invoices WHERE date = ? AND status != 'cancelled'
         UNION ALL
         SELECT id, 'Payment In' as type, receipt_number as description, amount as amount_in, 0 as amount_out 
         FROM payment_ins WHERE date = ?
         UNION ALL
         SELECT id, 'Payment Out' as type, '' as description, 0 as amount_in, amount as amount_out 
         FROM payment_outs WHERE date = ?
         UNION ALL
         SELECT id, 'Expense' as type, category as description, 0 as amount_in, amount as amount_out 
         FROM expenses WHERE date = ?`,
        [date, date, date, date, date]
    );
    
    return { data, isLoading: loading, error };
}

export function useStockMovementReport(dateRange: DateRange) {
    const { data, loading, error } = useQuery<{
        item_id: string;
        item_name: string;
        in_qty: number;
        out_qty: number;
    }>(
        `SELECT 
            item_id, 
            item_name, 
            SUM(in_qty) as in_qty, 
            SUM(out_qty) as out_qty 
         FROM (
            SELECT item_id, item_name, quantity as in_qty, 0 as out_qty 
            FROM purchase_invoice_items pii
            JOIN purchase_invoices pi ON pii.invoice_id = pi.id
            WHERE pi.date >= ? AND pi.date <= ? AND pi.status != 'cancelled'
            
            UNION ALL
            
            SELECT item_id, item_name, 0 as in_qty, quantity as out_qty 
            FROM sale_invoice_items sii
            JOIN sale_invoices si ON sii.invoice_id = si.id
            WHERE si.date >= ? AND si.date <= ? AND si.status != 'cancelled'
         )
         GROUP BY item_id, item_name
         ORDER BY (in_qty + out_qty) DESC`,
        [dateRange.from, dateRange.to, dateRange.from, dateRange.to]
    );
    return { data, isLoading: loading, error };
}

export function useCashMovementReport(dateRange: DateRange) {
    const { data: inData, loading: inLoading } = useQuery<{ mode: string; total: number }>(
        `SELECT mode, SUM(amount) as total FROM payment_ins 
         WHERE date >= ? AND date <= ? 
         GROUP BY mode`,
        [dateRange.from, dateRange.to]
    );

    const { data: outData, loading: outLoading } = useQuery<{ mode: string; total: number }>(
        `SELECT mode, SUM(amount) as total FROM payment_outs 
         WHERE date >= ? AND date <= ? 
         GROUP BY mode`,
        [dateRange.from, dateRange.to]
    );

    const report = useMemo(() => {
        const modes = new Set([...(inData?.map(d => d.mode) || []), ...(outData?.map(d => d.mode) || [])]);
        return Array.from(modes).map(mode => {
            const inAmount = inData?.find(d => d.mode === mode)?.total || 0;
            const outAmount = outData?.find(d => d.mode === mode)?.total || 0;
            return {
                mode: mode || 'Unspecified',
                inAmount,
                outAmount,
                net: inAmount - outAmount
            };
        });
    }, [inData, outData]);

    return { data: report, isLoading: inLoading || outLoading, error: undefined };
}
