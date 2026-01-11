import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange, CashFlowReport as CashFlowReportType } from "../types";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockCashFlow: CashFlowReportType = {
  period: {
    from: "2024-01-01",
    to: "2024-01-31",
  },
  openingBalance: 25000,
  inflows: {
    salesReceipts: 185000,
    otherReceipts: 5500,
    total: 190500,
  },
  outflows: {
    purchasePayments: 125000,
    expenses: 28500,
    otherPayments: 8000,
    total: 161500,
  },
  netCashFlow: 29000,
  closingBalance: 54000,
};

const mockMonthlyFlow = [
  { month: "Aug", inflow: 165000, outflow: 142000 },
  { month: "Sep", inflow: 175000, outflow: 155000 },
  { month: "Oct", inflow: 182000, outflow: 158000 },
  { month: "Nov", inflow: 195000, outflow: 168000 },
  { month: "Dec", inflow: 210000, outflow: 175000 },
  { month: "Jan", inflow: 190500, outflow: 161500 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CashFlowReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });

  const data = mockCashFlow;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  // Calculate max for chart scaling
  const maxFlow = useMemo(() => {
    return Math.max(
      ...mockMonthlyFlow.map((m) => Math.max(m.inflow, m.outflow))
    );
  }, []);

  return (
    <ReportLayout
      title="Cash Flow Statement"
      subtitle="Summary of cash inflows and outflows"
      backPath="/reports"
      onExport={() => console.log("Export cash flow")}
      onPrint={() => window.print()}
      filters={
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Opening Balance</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(data.openingBalance)}</p>
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
                  <p className="text-xl font-bold text-success">{formatCurrency(data.inflows.total)}</p>
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
                  <p className="text-xl font-bold text-error">{formatCurrency(data.outflows.total)}</p>
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
                  <p className="text-xl font-bold text-teal-700">{formatCurrency(data.closingBalance)}</p>
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
                  <span className="font-medium text-success">{formatCurrency(data.inflows.salesReceipts)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Other Receipts</span>
                  <span className="font-medium text-success">{formatCurrency(data.inflows.otherReceipts)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-green-50">
                  <span className="font-medium text-slate-900">Total Inflows</span>
                  <span className="font-bold text-success">{formatCurrency(data.inflows.total)}</span>
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
                  <span className="font-medium text-error">{formatCurrency(data.outflows.purchasePayments)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Expenses</span>
                  <span className="font-medium text-error">{formatCurrency(data.outflows.expenses)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Other Payments</span>
                  <span className="font-medium text-error">{formatCurrency(data.outflows.otherPayments)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-red-50">
                  <span className="font-medium text-slate-900">Total Outflows</span>
                  <span className="font-bold text-error">{formatCurrency(data.outflows.total)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Net Cash Flow */}
        <Card className={cn(
          data.netCashFlow >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        )}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {data.netCashFlow >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-success" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-error" />
                )}
                <div>
                  <p className={cn(
                    "text-sm",
                    data.netCashFlow >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    Net Cash Flow
                  </p>
                  <p className={cn(
                    "text-3xl font-bold",
                    data.netCashFlow >= 0 ? "text-success" : "text-error"
                  )}>
                    {data.netCashFlow >= 0 ? "+" : ""}{formatCurrency(data.netCashFlow)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Change from opening</p>
                <p className={cn(
                  "text-lg font-medium",
                  data.netCashFlow >= 0 ? "text-success" : "text-error"
                )}>
                  {data.openingBalance > 0
                    ? `${data.netCashFlow >= 0 ? "+" : ""}${((data.netCashFlow / data.openingBalance) * 100).toFixed(1)}%`
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Monthly Cash Flow Trend</h3>
          </CardHeader>
          <CardBody>
            <div className="flex items-end justify-between gap-4 h-56">
              {mockMonthlyFlow.map((month, index) => {
                const inflowHeight = (month.inflow / maxFlow) * 100;
                const outflowHeight = (month.outflow / maxFlow) * 100;
                const netFlow = month.inflow - month.outflow;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-48">
                      <span className={cn(
                        "text-xs font-medium mb-1",
                        netFlow >= 0 ? "text-success" : "text-error"
                      )}>
                        {netFlow >= 0 ? "+" : ""}{formatCurrency(netFlow)}
                      </span>
                      <div className="w-full flex gap-1 items-end justify-center">
                        <div
                          className="w-5 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                          style={{ height: `${inflowHeight}%` }}
                          title={`Inflow: ${formatCurrency(month.inflow)}`}
                        />
                        <div
                          className="w-5 bg-gradient-to-t from-red-500 to-red-400 rounded-t"
                          style={{ height: `${outflowHeight}%` }}
                          title={`Outflow: ${formatCurrency(month.outflow)}`}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 mt-2">{month.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm text-slate-600">Inflows</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-sm text-slate-600">Outflows</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </ReportLayout>
  );
}
