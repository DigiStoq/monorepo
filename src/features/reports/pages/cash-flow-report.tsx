import { useState } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader } from "@/components/ui";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";
import { useCashFlowReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// COMPONENT
// ============================================================================

export function CashFlowReportPage(): React.ReactNode {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });

  // Fetch data from PowerSync
  const { report, isLoading } = useCashFlowReport(dateRange);

  const { formatCurrency } = useCurrency();

  // Loading state
  if (isLoading || !report) {
    return (
      <ReportLayout
        title="Cash Flow Statement"
        subtitle="Summary of cash inflows and outflows"
        backPath="/reports"
        filters={
          <div className="flex items-center gap-4">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading report data...</div>
        </div>
      </ReportLayout>
    );
  }

  const data = report;

  return (
    <ReportLayout
      title="Cash Flow Statement"
      subtitle="Summary of cash inflows and outflows"
      backPath="/reports"
      onExport={() => {
        /* TODO: Implement export */
      }}
      onPrint={() => {
        window.print();
      }}
      filters={
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Opening Balance</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(data.openingBalance)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-green-50 border-green-100">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowUpCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-green-600">Cash Inflows</p>
                  <p className="text-xl font-bold text-success">
                    {formatCurrency(data.inflows.total)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-red-50 border-red-100">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowDownCircle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-xs text-red-600">Cash Outflows</p>
                  <p className="text-xl font-bold text-error">
                    {formatCurrency(data.outflows.total)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-teal-50 border-teal-100">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-teal-600">Closing Balance</p>
                  <p className="text-xl font-bold text-teal-700">
                    {formatCurrency(data.closingBalance)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Cash Flow Detail */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inflows */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-success" />
                <h3 className="font-medium text-slate-900">Cash Inflows</h3>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Sales Receipts</span>
                  <span className="font-medium text-success">
                    {formatCurrency(data.inflows.salesReceipts)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Other Receipts</span>
                  <span className="font-medium text-success">
                    {formatCurrency(data.inflows.otherReceipts)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-green-50">
                  <span className="font-medium text-slate-900">
                    Total Inflows
                  </span>
                  <span className="font-bold text-success">
                    {formatCurrency(data.inflows.total)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Outflows */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-error" />
                <h3 className="font-medium text-slate-900">Cash Outflows</h3>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Purchase Payments</span>
                  <span className="font-medium text-error">
                    {formatCurrency(data.outflows.purchasePayments)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Expenses</span>
                  <span className="font-medium text-error">
                    {formatCurrency(data.outflows.expenses)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Other Payments</span>
                  <span className="font-medium text-error">
                    {formatCurrency(data.outflows.otherPayments)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-red-50">
                  <span className="font-medium text-slate-900">
                    Total Outflows
                  </span>
                  <span className="font-bold text-error">
                    {formatCurrency(data.outflows.total)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Net Cash Flow */}
        <Card
          className={cn(
            data.netCashFlow >= 0
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          )}
        >
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {data.netCashFlow >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-success" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-error" />
                )}
                <div>
                  <p
                    className={cn(
                      "text-sm",
                      data.netCashFlow >= 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    Net Cash Flow
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-bold",
                      data.netCashFlow >= 0 ? "text-success" : "text-error"
                    )}
                  >
                    {data.netCashFlow >= 0 ? "+" : ""}
                    {formatCurrency(data.netCashFlow)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Change from opening</p>
                <p
                  className={cn(
                    "text-lg font-medium",
                    data.netCashFlow >= 0 ? "text-success" : "text-error"
                  )}
                >
                  {data.openingBalance > 0
                    ? `${data.netCashFlow >= 0 ? "+" : ""}${((data.netCashFlow / data.openingBalance) * 100).toFixed(1)}%`
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </ReportLayout>
  );
}
