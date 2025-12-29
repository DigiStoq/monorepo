import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { ShoppingCart, TrendingUp, Users, Package } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";
import { usePurchaseSummaryReport } from "@/hooks/useReports";

// ============================================================================
// COMPONENT
// ============================================================================

export function PurchaseSummaryReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });

  const { summary: data, isLoading } = usePurchaseSummaryReport(dateRange);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Purchase Summary"
        subtitle="Overview of purchase performance"
        backPath="/reports"
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
        title="Purchase Summary"
        subtitle="Overview of purchase performance"
        backPath="/reports"
        filters={<DateRangeFilter value={dateRange} onChange={setDateRange} />}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">No purchase data found for the selected period.</div>
        </div>
      </ReportLayout>
    );
  }

  // Calculate max for bar chart scaling
  const maxMonthlyPurchase = useMemo(() => {
    return data.purchasesByMonth.length > 0 ? Math.max(...data.purchasesByMonth.map((m) => m.amount)) : 1;
  }, [data.purchasesByMonth]);

  return (
    <ReportLayout
      title="Purchase Summary"
      subtitle="Overview of purchase performance"
      backPath="/reports"
      onExport={() => { /* TODO: Implement export */ }}
      onPrint={() => { window.print(); }}
      filters={
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Purchases</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(data.totalPurchases)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Avg Order Value</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(data.averageOrderValue)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-light rounded-lg">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Amount Paid</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(data.totalPaid)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-error-light rounded-lg">
                  <TrendingUp className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Amount Due</p>
                  <p className="text-xl font-bold text-error">{formatCurrency(data.totalDue)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Monthly Purchase Trend</h3>
          </CardHeader>
          <CardBody>
            <div className="flex items-end justify-between gap-2 h-48">
              {data.purchasesByMonth.map((month, index) => {
                const heightPercent = (month.amount / maxMonthlyPurchase) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-40">
                      <span className="text-xs font-medium text-slate-700 mb-1">
                        {formatCurrency(month.amount)}
                      </span>
                      <div
                        className="w-full max-w-12 bg-gradient-to-t from-orange-500 to-amber-400 rounded-t"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 mt-2">{month.month}</span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Top Suppliers and Items */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Suppliers */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <h3 className="font-medium text-slate-900">Top Suppliers</h3>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                {data.topSuppliers.map((supplier, index) => (
                  <div key={supplier.supplierId} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-slate-900">{supplier.supplierName}</span>
                    </div>
                    <span className="font-medium text-slate-900">{formatCurrency(supplier.amount)}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Top Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" />
                <h3 className="font-medium text-slate-900">Top Purchased Items</h3>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                {data.topItems.map((item, index) => (
                  <div key={item.itemId} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-slate-900">{item.itemName}</span>
                        <span className="text-xs text-slate-500 ml-2">({item.quantity} units)</span>
                      </div>
                    </div>
                    <span className="font-medium text-slate-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </ReportLayout>
  );
}
