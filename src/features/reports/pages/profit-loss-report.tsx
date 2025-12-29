import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui";
import { ReportLayout, DateRangeFilter } from "../components";
import { TrendingUp, TrendingDown, DollarSign, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DateRange } from "../types";
import { useProfitLossReport } from "@/hooks/useReports";

// ============================================================================
// COMPONENT
// ============================================================================

export function ProfitLossReportPage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  });

  // Fetch data from PowerSync
  const { report, isLoading } = useProfitLossReport(dateRange);

  // Calculate expense breakdown percentages
  const expenseBreakdown = useMemo(() => {
    if (!report) return [];
    const total = report.expenses.total;
    if (total === 0) return [];
    return [
      { category: "Cost of Goods Sold", amount: report.expenses.costOfGoodsSold, percentage: (report.expenses.costOfGoodsSold / total) * 100 },
      { category: "Operating Expenses", amount: report.expenses.operatingExpenses, percentage: (report.expenses.operatingExpenses / total) * 100 },
      { category: "Other Expenses", amount: report.expenses.otherExpenses, percentage: (report.expenses.otherExpenses / total) * 100 },
    ].filter(e => e.amount > 0);
  }, [report]);

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  // Loading state
  if (isLoading || !report) {
    return (
      <ReportLayout
        title="Profit & Loss Statement"
        subtitle="Income, expenses, and profitability analysis"
        filters={<DateRangeFilter value={dateRange} onChange={setDateRange} />}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading report data...</div>
        </div>
      </ReportLayout>
    );
  }

  const data = report;

  // Calculate percentages
  const grossMargin = data.revenue.total > 0 ? ((data.grossProfit / data.revenue.total) * 100).toFixed(1) : "0.0";
  const netMargin = data.profitMargin.toFixed(1);

  return (
    <ReportLayout
      title="Profit & Loss Statement"
      subtitle="Income, expenses, and profitability analysis"
      onRefresh={() => { /* TODO: Implement refresh */ }}
      onExport={() => { /* TODO: Implement export */ }}
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
                <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.revenue.total)}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.expenses.total)}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <TrendingDown className="h-5 w-5 text-red-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Gross Profit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.grossProfit)}</p>
                <p className="text-sm text-slate-500 mt-1">{grossMargin}% margin</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className={data.netProfit >= 0 ? "border-success" : "border-error"}>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Net Profit</p>
                <p className={cn("text-2xl font-bold", data.netProfit >= 0 ? "text-success" : "text-error")}>
                  {formatCurrency(data.netProfit)}
                </p>
                <p className="text-sm text-slate-500 mt-1">{netMargin}% margin</p>
              </div>
              <div className={cn("p-2 rounded-lg", data.netProfit >= 0 ? "bg-success-light" : "bg-error-light")}>
                {data.netProfit >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-error" />
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* P&L Statement */}
        <Card>
          <CardHeader title="Profit & Loss Statement" />
          <CardBody className="p-0">
            <table className="w-full">
              <tbody>
                {/* Revenue Section */}
                <tr className="bg-green-50">
                  <td colSpan={2} className="px-4 py-2 font-semibold text-green-800">
                    Revenue
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2 pl-8 text-slate-600">Sales Revenue</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(data.revenue.sales)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2 pl-8 text-slate-600">Other Income</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(data.revenue.otherIncome)}</td>
                </tr>
                <tr className="bg-green-50 border-b border-green-200">
                  <td className="px-4 py-2 font-semibold text-green-800">Total Revenue</td>
                  <td className="px-4 py-2 text-right font-bold text-green-800">{formatCurrency(data.revenue.total)}</td>
                </tr>

                {/* COGS */}
                <tr className="bg-orange-50">
                  <td colSpan={2} className="px-4 py-2 font-semibold text-orange-800">
                    Cost of Goods Sold
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2 pl-8 text-slate-600">Inventory Purchases</td>
                  <td className="px-4 py-2 text-right font-medium text-error">({formatCurrency(data.expenses.costOfGoodsSold)})</td>
                </tr>

                {/* Gross Profit */}
                <tr className="bg-blue-50 border-y border-blue-200">
                  <td className="px-4 py-3 font-bold text-blue-800">Gross Profit</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-800">{formatCurrency(data.grossProfit)}</td>
                </tr>

                {/* Operating Expenses */}
                <tr className="bg-red-50">
                  <td colSpan={2} className="px-4 py-2 font-semibold text-red-800">
                    Operating Expenses
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2 pl-8 text-slate-600">Salaries & Wages</td>
                  <td className="px-4 py-2 text-right font-medium text-error">({formatCurrency(8500)})</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2 pl-8 text-slate-600">Rent</td>
                  <td className="px-4 py-2 text-right font-medium text-error">({formatCurrency(2500)})</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2 pl-8 text-slate-600">Utilities</td>
                  <td className="px-4 py-2 text-right font-medium text-error">({formatCurrency(850)})</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2 pl-8 text-slate-600">Marketing</td>
                  <td className="px-4 py-2 text-right font-medium text-error">({formatCurrency(3200)})</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2 pl-8 text-slate-600">Other Expenses</td>
                  <td className="px-4 py-2 text-right font-medium text-error">({formatCurrency(3650)})</td>
                </tr>
                <tr className="bg-red-50 border-b border-red-200">
                  <td className="px-4 py-2 font-semibold text-red-800">Total Expenses</td>
                  <td className="px-4 py-2 text-right font-bold text-red-800">({formatCurrency(data.expenses.operatingExpenses + data.expenses.otherExpenses)})</td>
                </tr>

                {/* Net Profit */}
                <tr className={cn("border-t-2", data.netProfit >= 0 ? "bg-success-light" : "bg-error-light")}>
                  <td className={cn("px-4 py-4 font-bold text-lg", data.netProfit >= 0 ? "text-success" : "text-error")}>
                    Net Profit
                  </td>
                  <td className={cn("px-4 py-4 text-right font-bold text-lg", data.netProfit >= 0 ? "text-success" : "text-error")}>
                    {formatCurrency(data.netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader title="Expense Breakdown" />
          <CardBody>
            <div className="space-y-3">
              {expenseBreakdown.map((expense) => (
                <div key={expense.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">{expense.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(expense.amount)}</span>
                      <span className="text-xs text-slate-500 w-12 text-right">{expense.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        expense.category === "Cost of Goods Sold" ? "bg-orange-500" : "bg-red-400"
                      )}
                      style={{ width: `${expense.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Profit Flow Visual */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-4">Profit Flow</h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Revenue</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(data.revenue.total)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300" />
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Gross Profit</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(data.grossProfit)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300" />
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Net Profit</p>
                  <p className={cn("text-lg font-bold", data.netProfit >= 0 ? "text-success" : "text-error")}>
                    {formatCurrency(data.netProfit)}
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </ReportLayout>
  );
}
