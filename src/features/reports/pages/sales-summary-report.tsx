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
import { cn } from "@/lib/cn";
import type { DateRange, SalesSummary } from "../types";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockSalesData: SalesSummary = {
  totalSales: 125000,
  totalInvoices: 156,
  totalPaid: 98500,
  totalDue: 26500,
  averageOrderValue: 801.28,
  topCustomers: [
    { customerId: "1", customerName: "Acme Electronics", amount: 28500 },
    { customerId: "2", customerName: "Global Traders Inc", amount: 22000 },
    { customerId: "3", customerName: "Metro Supplies Co", amount: 18750 },
    { customerId: "4", customerName: "City Hardware Ltd", amount: 15200 },
    { customerId: "5", customerName: "Valley Distributors", amount: 12800 },
  ],
  topItems: [
    { itemId: "1", itemName: "Laptop Pro 15", quantity: 45, amount: 54000 },
    { itemId: "2", itemName: "Office Chair Deluxe", quantity: 120, amount: 42000 },
    { itemId: "3", itemName: "Wireless Mouse", quantity: 350, amount: 8750 },
    { itemId: "4", itemName: "Desk Lamp LED", quantity: 200, amount: 9000 },
    { itemId: "5", itemName: "Tool Kit Professional", quantity: 60, amount: 10800 },
  ],
  salesByMonth: [
    { month: "Jan", amount: 18500 },
    { month: "Feb", amount: 22000 },
    { month: "Mar", amount: 19800 },
    { month: "Apr", amount: 25500 },
    { month: "May", amount: 21200 },
    { month: "Jun", amount: 18000 },
  ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SalesSummaryReport() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  });

  const data = mockSalesData;

  // Calculate growth (mock data - will be dynamic later)
  const growth = 12.5 as number;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- mock data comparison
  const isPositiveGrowth = growth >= 0;

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  // Max values for bar charts
  const maxCustomerAmount = Math.max(...data.topCustomers.map((c) => c.amount));
  const maxItemAmount = Math.max(...data.topItems.map((i) => i.amount));
  const maxMonthAmount = Math.max(...data.salesByMonth.map((m) => m.amount));

  return (
    <ReportLayout
      title="Sales Summary"
      subtitle="Overview of sales performance"
      onRefresh={() => { console.log("Refresh"); }}
      onExport={() => { console.log("Export"); }}
      onPrint={() => { window.print(); }}
      filters={
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.totalSales)}</p>
                <div className={cn(
                  "flex items-center gap-1 text-sm mt-1",
                  isPositiveGrowth ? "text-success" : "text-error"
                )}>
                  {isPositiveGrowth ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{Math.abs(growth)}% vs last period</span>
                </div>
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
                <p className="text-2xl font-bold text-slate-900">{data.totalInvoices}</p>
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
                <p className="text-2xl font-bold text-success">{formatCurrency(data.totalPaid)}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {((data.totalPaid / data.totalSales) * 100).toFixed(1)}% collected
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
                <p className="text-2xl font-bold text-error">{formatCurrency(data.totalDue)}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {((data.totalDue / data.totalSales) * 100).toFixed(1)}% outstanding
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
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Sales Trend */}
        <Card className="col-span-2">
          <CardHeader title="Sales Trend" />
          <CardBody>
            <div className="h-48 flex items-end gap-2">
              {data.salesByMonth.map((month) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600"
                    style={{ height: `${(month.amount / maxMonthAmount) * 180}px` }}
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
                      style={{ width: `${(customer.amount / maxCustomerAmount) * 100}%` }}
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
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">#</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Item</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Qty Sold</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Revenue</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3 w-48">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.topItems.map((item, index) => (
                <tr key={item.itemId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.itemName}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(item.amount / maxItemAmount) * 100}%` }}
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
