import { useState } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader } from "@/components/ui";
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  Calculator,
  AlertCircle,
} from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";
import { useTaxSummaryReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// COMPONENT
// ============================================================================

export function TaxSummaryReport(): React.ReactNode {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });

  // Fetch data from PowerSync
  const { summary, isLoading } = useTaxSummaryReport(dateRange);

  const { formatCurrency } = useCurrency();

  // Loading state
  if (isLoading || !summary) {
    return (
      <ReportLayout
        title="Tax Summary"
        subtitle="Sales tax collected vs purchase tax paid"
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

  const data = summary;

  // Tax rate calculation
  const salesTaxRate =
    data.salesTax.taxableAmount > 0
      ? (data.salesTax.taxCollected / data.salesTax.taxableAmount) * 100
      : 0;
  const purchaseTaxRate =
    data.purchaseTax.taxableAmount > 0
      ? (data.purchaseTax.taxPaid / data.purchaseTax.taxableAmount) * 100
      : 0;

  return (
    <ReportLayout
      title="Tax Summary"
      subtitle="Sales tax collected vs purchase tax paid"
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
          <Card className="bg-green-50 border-green-100">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-green-600">
                    Tax Collected (Sales)
                  </p>
                  <p className="text-xl font-bold text-success">
                    {formatCurrency(data.salesTax.taxCollected)}
                  </p>
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
                  <p className="text-xs text-orange-600">
                    Tax Paid (Purchases)
                  </p>
                  <p className="text-xl font-bold text-orange-700">
                    {formatCurrency(data.purchaseTax.taxPaid)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card
            className={cn(
              data.netTaxLiability >= 0
                ? "bg-amber-50 border-amber-100"
                : "bg-teal-50 border-teal-100"
            )}
          >
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    data.netTaxLiability >= 0 ? "bg-amber-100" : "bg-teal-100"
                  )}
                >
                  <Calculator
                    className={cn(
                      "h-5 w-5",
                      data.netTaxLiability >= 0
                        ? "text-amber-600"
                        : "text-teal-600"
                    )}
                  />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-xs",
                      data.netTaxLiability >= 0
                        ? "text-amber-600"
                        : "text-teal-600"
                    )}
                  >
                    {data.netTaxLiability >= 0 ? "Tax Payable" : "Tax Credit"}
                  </p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      data.netTaxLiability >= 0
                        ? "text-amber-700"
                        : "text-teal-700"
                    )}
                  >
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
                  <p className="text-xl font-bold text-slate-900">
                    {salesTaxRate.toFixed(1)}%
                  </p>
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
                <h3 className="font-medium text-slate-900">
                  Sales Tax (Output Tax)
                </h3>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Taxable Sales Amount</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(data.salesTax.taxableAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Tax Rate</span>
                  <span className="font-medium text-slate-900">
                    {salesTaxRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-green-50">
                  <span className="font-medium text-slate-900">
                    Tax Collected
                  </span>
                  <span className="font-bold text-success">
                    {formatCurrency(data.salesTax.taxCollected)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Purchase Tax */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-600" />
                <h3 className="font-medium text-slate-900">
                  Purchase Tax (Input Tax)
                </h3>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">
                    Taxable Purchase Amount
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(data.purchaseTax.taxableAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-600">Tax Rate</span>
                  <span className="font-medium text-slate-900">
                    {purchaseTaxRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-orange-50">
                  <span className="font-medium text-slate-900">
                    Tax Paid (Credit)
                  </span>
                  <span className="font-bold text-orange-700">
                    {formatCurrency(data.purchaseTax.taxPaid)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Net Tax Liability */}
        <Card
          className={cn(
            data.netTaxLiability >= 0
              ? "bg-amber-50 border-amber-200"
              : "bg-teal-50 border-teal-200"
          )}
        >
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {data.netTaxLiability >= 0 ? (
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                ) : (
                  <Calculator className="h-8 w-8 text-teal-600" />
                )}
                <div>
                  <p
                    className={cn(
                      "text-sm",
                      data.netTaxLiability >= 0
                        ? "text-amber-600"
                        : "text-teal-600"
                    )}
                  >
                    {data.netTaxLiability >= 0
                      ? "Net Tax Payable to Government"
                      : "Net Tax Credit Available"}
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-bold",
                      data.netTaxLiability >= 0
                        ? "text-amber-700"
                        : "text-teal-700"
                    )}
                  >
                    {formatCurrency(Math.abs(data.netTaxLiability))}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Calculation</p>
                <p className="text-sm text-slate-600">
                  {formatCurrency(data.salesTax.taxCollected)} -{" "}
                  {formatCurrency(data.purchaseTax.taxPaid)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </ReportLayout>
  );
}
