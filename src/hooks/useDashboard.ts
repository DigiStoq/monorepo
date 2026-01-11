import { useQuery } from "@powersync/react";

export interface DashboardMetrics {
  totalReceivable: number;
  totalPayable: number;
  todaySales: number;
  todayPurchases: number;
  receivableChange: number;
  payableChange: number;
  salesChange: number;
  purchasesChange: number;
}

export interface DashboardTransaction {
  id: string;
  type: "sale" | "purchase" | "payment-in" | "payment-out";
  partyName: string;
  amount: number;
  date: string;
  invoiceNumber?: string;
}

export function useDashboardMetrics(): { metrics: DashboardMetrics; isLoading: boolean } {
  // Total Receivable (from customers with positive balance)
  const { data: receivableData, isLoading: receivableLoading } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(current_balance), 0) as sum
     FROM customers
     WHERE type IN ('customer', 'both') AND current_balance > 0`
  );

  // Total Payable (from suppliers with negative balance)
  const { data: payableData, isLoading: payableLoading } = useQuery<{ sum: number }>(
    `SELECT COALESCE(ABS(SUM(current_balance)), 0) as sum
     FROM customers
     WHERE type IN ('supplier', 'both') AND current_balance < 0`
  );

  // Today's Sales
  const { data: todaySalesData, isLoading: todaySalesLoading } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum
     FROM sale_invoices
     WHERE date = date('now') AND status != 'cancelled'`
  );

  // Today's Purchases
  const { data: todayPurchasesData, isLoading: todayPurchasesLoading } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum
     FROM purchase_invoices
     WHERE date = date('now') AND status != 'cancelled'`
  );

  // Last month receivable (for change calculation)
  const { data: lastMonthReceivable } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount_due), 0) as sum
     FROM sale_invoices
     WHERE date >= date('now', 'start of month', '-1 month')
     AND date < date('now', 'start of month')
     AND status IN ('sent', 'partial', 'overdue')`
  );

  // Last month payable (for change calculation)
  const { data: lastMonthPayable } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount_due), 0) as sum
     FROM purchase_invoices
     WHERE date >= date('now', 'start of month', '-1 month')
     AND date < date('now', 'start of month')
     AND status IN ('received', 'partial', 'overdue')`
  );

  // Yesterday's sales (for change calculation)
  const { data: yesterdaySales } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum
     FROM sale_invoices
     WHERE date = date('now', '-1 day') AND status != 'cancelled'`
  );

  // Yesterday's purchases (for change calculation)
  const { data: yesterdayPurchases } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum
     FROM purchase_invoices
     WHERE date = date('now', '-1 day') AND status != 'cancelled'`
  );

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const totalReceivable = receivableData[0]?.sum ?? 0;
  const totalPayable = payableData[0]?.sum ?? 0;
  const todaySales = todaySalesData[0]?.sum ?? 0;
  const todayPurchases = todayPurchasesData[0]?.sum ?? 0;

  const metrics: DashboardMetrics = {
    totalReceivable,
    totalPayable,
    todaySales,
    todayPurchases,
    receivableChange: calculateChange(totalReceivable, lastMonthReceivable[0]?.sum ?? 0),
    payableChange: calculateChange(totalPayable, lastMonthPayable[0]?.sum ?? 0),
    salesChange: calculateChange(todaySales, yesterdaySales[0]?.sum ?? 0),
    purchasesChange: calculateChange(todayPurchases, yesterdayPurchases[0]?.sum ?? 0),
  };

  const isLoading =
    receivableLoading || payableLoading || todaySalesLoading || todayPurchasesLoading;

  return { metrics, isLoading };
}

export function useRecentTransactions(limit = 10): {
  transactions: DashboardTransaction[];
  isLoading: boolean;
} {
  // Combine recent sales, purchases, and payments
  const { data: salesData, isLoading: salesLoading } = useQuery<DashboardTransaction>(
    `SELECT
       id,
       'sale' as type,
       customer_name as partyName,
       total as amount,
       date,
       invoice_number as invoiceNumber
     FROM sale_invoices
     WHERE status != 'cancelled'
     ORDER BY created_at DESC
     LIMIT ?`,
    [Math.ceil(limit / 4)]
  );

  const { data: purchasesData, isLoading: purchasesLoading } = useQuery<DashboardTransaction>(
    `SELECT
       id,
       'purchase' as type,
       customer_name as partyName,
       total as amount,
       date,
       invoice_number as invoiceNumber
     FROM purchase_invoices
     WHERE status != 'cancelled'
     ORDER BY created_at DESC
     LIMIT ?`,
    [Math.ceil(limit / 4)]
  );

  const { data: paymentInsData, isLoading: paymentInsLoading } = useQuery<DashboardTransaction>(
    `SELECT
       id,
       'payment-in' as type,
       customer_name as partyName,
       amount,
       date,
       receipt_number as invoiceNumber
     FROM payment_ins
     ORDER BY created_at DESC
     LIMIT ?`,
    [Math.ceil(limit / 4)]
  );

  const { data: paymentOutsData, isLoading: paymentOutsLoading } = useQuery<DashboardTransaction>(
    `SELECT
       id,
       'payment-out' as type,
       customer_name as partyName,
       amount,
       date,
       payment_number as invoiceNumber
     FROM payment_outs
     ORDER BY created_at DESC
     LIMIT ?`,
    [Math.ceil(limit / 4)]
  );

  // Combine and sort all transactions
  const transactions = [
    ...(salesData ?? []),
    ...(purchasesData ?? []),
    ...(paymentInsData ?? []),
    ...(paymentOutsData ?? []),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map((tx) => ({
      ...tx,
      date: formatRelativeDate(tx.date),
    }));

  const isLoading = salesLoading || purchasesLoading || paymentInsLoading || paymentOutsLoading;

  return { transactions, isLoading };
}

// Helper to format dates as relative time
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

interface ChartDataPoint {
  date: string;
  sales: number;
  purchases: number;
}

export function useSalesChartData(days = 7): {
  chartData: ChartDataPoint[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery<{ date: string; total: number }>(
    `SELECT date, COALESCE(SUM(total), 0) as total
     FROM sale_invoices
     WHERE date >= date('now', '-${days} days')
     AND status != 'cancelled'
     GROUP BY date
     ORDER BY date ASC`
  );

  // Fill in missing dates with 0
  const chartData: ChartDataPoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayData = data?.find((d) => d.date === dateStr);
    chartData.push({
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      sales: dayData?.total ?? 0,
      purchases: 0, // TODO: Add purchase data
    });
  }

  return { chartData, isLoading };
}
