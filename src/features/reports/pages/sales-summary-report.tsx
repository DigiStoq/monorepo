import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui";
import { ReportLayout, DateRangeFilter } from "../components";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Users,
  Package,
} from "lucide-react";
import type { DateRange } from "../types";
import { useSalesSummaryReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// COMPONENT
// ============================================================================

export function SalesSummaryReport(): React.ReactNode {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  });

  const { summary: data, isLoading } = useSalesSummaryReport(dateRange);

  // Format currency
  // Format currency
  const { formatCurrency } = useCurrency();

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Sales Summary"
        subtitle="Overview of sales performance"
        filters={<DateRangeFilter value={dateRange} onChange={setDateRange} />}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading report data...</div>
        </div>
      </ReportLayout>
    );
  }

  // Empty state
  if (!data) {
    return (
      <ReportLayout
        title="Sales Summary"
        subtitle="Overview of sales performance"
        filters={<DateRangeFilter value={dateRange} onChange={setDateRange} />}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">
            No sales data found for the selected period.
          </div>
        </div>
      </ReportLayout>
    );
  }

  // Max values for bar charts
  const maxCustomerAmount =
    data.topCustomers.length > 0
      ? Math.max(...data.topCustomers.map((c) => c.amount))
      : 1;
  const maxItemAmount =
    data.topItems.length > 0
      ? Math.max(...data.topItems.map((i) => i.amount))
      : 1;
  const maxMonthAmount =
    data.salesByMonth.length > 0
      ? Math.max(...data.salesByMonth.map((m) => m.amount))
      : 1;

  // Calculate collection percentage
  const collectionPercent =
    data.totalSales > 0
      ? ((data.totalPaid / data.totalSales) * 100).toFixed(1)
      : "0";
  const outstandingPercent =
    data.totalSales > 0
      ? ((data.totalDue / data.totalSales) * 100).toFixed(1)
      : "0";

  return (
    <ReportLayout
      title="Sales Summary"
      subtitle="Overview of sales performance"
      onRefresh={() => {
        /* TODO: Implement refresh */
      }}
      onExport={() => {
        /* TODO: Implement export */
      }}
      onPrint={() => {
        window.print();
      }}
      filters={<DateRangeFilter value={dateRange} onChange={setDateRange} />}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Sales</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {formatCurrency(data.totalSales)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {data.totalInvoices} invoices
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Invoices</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {data.totalInvoices}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Avg: {formatCurrency(data.averageOrderValue)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Amount Received</p>
                <p className="text-xl sm:text-2xl font-bold text-success">
                  {formatCurrency(data.totalPaid)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {collectionPercent}% collected
                </p>
              </div>
              <div className="p-2 rounded-lg bg-teal-100">
                <TrendingUp className="h-5 w-5 text-teal-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Amount Due</p>
                <p className="text-xl sm:text-2xl font-bold text-error">
                  {formatCurrency(data.totalDue)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {outstandingPercent}% outstanding
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <TrendingDown className="h-5 w-5 text-red-700" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Sales Trend */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader title="Sales Trend" />
          <CardBody>
            <div className="h-48 flex items-end gap-2">
              {data.salesByMonth.map((month) => (
                <div
                  key={month.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600"
                    style={{
                      height: `${(month.amount / maxMonthAmount) * 180}px`,
                    }}
                  />
                  <span className="text-xs text-slate-500">{month.month}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader
            title="Top Customers"
            action={<Users className="h-4 w-4 text-slate-400" />}
          />
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {data.topCustomers.slice(0, 5).map((customer, index) => (
                <div key={customer.customerId} className="px-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {index + 1}. {customer.customerName}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(customer.amount)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{
                        width: `${(customer.amount / maxCustomerAmount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top Items */}
      <Card>
        <CardHeader
          title="Top Selling Items"
          action={<Package className="h-4 w-4 text-slate-400" />}
        />
        <CardBody className="p-0">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                  #
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                  Item
                </th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">
                  Qty Sold
                </th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">
                  Revenue
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3 w-48">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.topItems.map((item, index) => (
                <tr key={item.itemId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {item.itemName}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${(item.amount / maxItemAmount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right">
                        {((item.amount / data.totalSales) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </ReportLayout>
  );
}
