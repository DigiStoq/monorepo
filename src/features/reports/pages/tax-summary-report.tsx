import { useState } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { Receipt, TrendingUp, TrendingDown, Calculator, AlertCircle } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange, TaxSummary } from "../types";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockTaxSummary: TaxSummary = {
  period: {
    from: "2024-01-01",
    to: "2024-01-31",
  },
  salesTax: {
    taxableAmount: 245000,
    taxCollected: 19600,
  },
  purchaseTax: {
    taxableAmount: 165000,
    taxPaid: 13200,
  },
  netTaxLiability: 6400,
};

const mockMonthlyTax = [
  { month: "Aug", collected: 15200, paid: 11500 },
  { month: "Sep", collected: 16800, paid: 12400 },
  { month: "Oct", collected: 18200, paid: 13100 },
  { month: "Nov", collected: 19500, paid: 14200 },
  { month: "Dec", collected: 21000, paid: 15500 },
  { month: "Jan", collected: 19600, paid: 13200 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function TaxSummaryReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });

  const data = mockTaxSummary;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  // Tax rate calculation
  const salesTaxRate = data.salesTax.taxableAmount > 0
    ? (data.salesTax.taxCollected / data.salesTax.taxableAmount) * 100
    : 0;
  const purchaseTaxRate = data.purchaseTax.taxableAmount > 0
    ? (data.purchaseTax.taxPaid / data.purchaseTax.taxableAmount) * 100
    : 0;

  return (
    <ReportLayout
      title="Tax Summary"
      subtitle="Sales tax collected vs purchase tax paid"
      backPath="/reports"
      onExport={() => console.log("Export tax summary")}
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
          <Card className="bg-green-50 border-green-100">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-green-600">Tax Collected (Sales)</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(data.salesTax.taxCollected)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-orange-50 border-orange-100">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-orange-600">Tax Paid (Purchases)</p>
                  <p className="text-xl font-bold text-orange-700">{formatCurrency(data.purchaseTax.taxPaid)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className={cn(
            data.netTaxLiability >= 0 ? "bg-amber-50 border-amber-100" : "bg-teal-50 border-teal-100"
          )}>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  data.netTaxLiability >= 0 ? "bg-amber-100" : "bg-teal-100"
                )}>
                  <Calculator className={cn(
                    "h-5 w-5",
                    data.netTaxLiability >= 0 ? "text-amber-600" : "text-teal-600"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "text-xs",
                    data.netTaxLiability >= 0 ? "text-amber-600" : "text-teal-600"
                  )}>
                    {data.netTaxLiability >= 0 ? "Tax Payable" : "Tax Credit"}
                  </p>
                  <p className={cn(
                    "text-xl font-bold",
                    data.netTaxLiability >= 0 ? "text-amber-700" : "text-teal-700"
                  )}>
                    {formatCurrency(Math.abs(data.netTaxLiability))}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Avg Tax Rate</p>
                  <p className="text-xl font-bold text-slate-900">{salesTaxRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Tax Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sales Tax */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <h3 className="font-medium text-slate-900">Sales Tax (Output Tax)</h3>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Taxable Sales Amount</span>
                  <span className="font-medium text-slate-900">{formatCurrency(data.salesTax.taxableAmount)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Tax Rate</span>
                  <span className="font-medium text-slate-900">{salesTaxRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-green-50">
                  <span className="font-medium text-slate-900">Tax Collected</span>
                  <span className="font-bold text-success">{formatCurrency(data.salesTax.taxCollected)}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Purchase Tax */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-600" />
                <h3 className="font-medium text-slate-900">Purchase Tax (Input Tax)</h3>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Taxable Purchase Amount</span>
                  <span className="font-medium text-slate-900">{formatCurrency(data.purchaseTax.taxableAmount)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Tax Rate</span>
                  <span className="font-medium text-slate-900">{purchaseTaxRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-orange-50">
                  <span className="font-medium text-slate-900">Tax Paid (Credit)</span>
                  <span className="font-bold text-orange-700">{formatCurrency(data.purchaseTax.taxPaid)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Net Tax Liability */}
        <Card className={cn(
          data.netTaxLiability >= 0 ? "bg-amber-50 border-amber-200" : "bg-teal-50 border-teal-200"
        )}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {data.netTaxLiability >= 0 ? (
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                ) : (
                  <Calculator className="h-8 w-8 text-teal-600" />
                )}
                <div>
                  <p className={cn(
                    "text-sm",
                    data.netTaxLiability >= 0 ? "text-amber-600" : "text-teal-600"
                  )}>
                    {data.netTaxLiability >= 0 ? "Net Tax Payable to Government" : "Net Tax Credit Available"}
                  </p>
                  <p className={cn(
                    "text-3xl font-bold",
                    data.netTaxLiability >= 0 ? "text-amber-700" : "text-teal-700"
                  )}>
                    {formatCurrency(Math.abs(data.netTaxLiability))}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Calculation</p>
                <p className="text-sm text-slate-600">
                  {formatCurrency(data.salesTax.taxCollected)} - {formatCurrency(data.purchaseTax.taxPaid)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Monthly Tax Trend</h3>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Month</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Tax Collected</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Tax Paid</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Net Liability</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-40">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockMonthlyTax.map((month) => {
                    const netLiability = month.collected - month.paid;
                    const maxLiability = Math.max(...mockMonthlyTax.map((m) => Math.abs(m.collected - m.paid)));
                    const barWidth = maxLiability > 0 ? (Math.abs(netLiability) / maxLiability) * 100 : 0;

                    return (
                      <tr key={month.month} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{month.month}</td>
                        <td className="px-4 py-3 text-right text-success">{formatCurrency(month.collected)}</td>
                        <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(month.paid)}</td>
                        <td className={cn(
                          "px-4 py-3 text-right font-medium",
                          netLiability >= 0 ? "text-amber-600" : "text-teal-600"
                        )}>
                          {netLiability >= 0 ? "" : "-"}{formatCurrency(Math.abs(netLiability))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full",
                                netLiability >= 0 ? "bg-amber-500" : "bg-teal-500"
                              )}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-medium">
                    <td className="px-4 py-3 text-slate-900">Total</td>
                    <td className="px-4 py-3 text-right text-success">
                      {formatCurrency(mockMonthlyTax.reduce((sum, m) => sum + m.collected, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600">
                      {formatCurrency(mockMonthlyTax.reduce((sum, m) => sum + m.paid, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-700">
                      {formatCurrency(mockMonthlyTax.reduce((sum, m) => sum + (m.collected - m.paid), 0))}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </ReportLayout>
  );
}
