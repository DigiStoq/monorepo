import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader, Input, Select, type SelectOption } from "@/components/ui";
import { Search, Users, AlertTriangle } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import type { CustomerAging } from "../types";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockReceivableAging: CustomerAging[] = [
  { customerId: "1", customerName: "Acme Corporation", current: 3500, days30: 2000, days60: 800, days90: 200, over90: 0, total: 6500 },
  { customerId: "2", customerName: "Tech Solutions Inc", current: 4200, days30: 2000, days60: 0, days90: 0, over90: 0, total: 6200 },
  { customerId: "4", customerName: "Metro Retail", current: 0, days30: 0, days60: 2500, days90: 1500, over90: 500, total: 4500 },
  { customerId: "5", customerName: "City Electronics", current: 4000, days30: 2000, days60: 800, days90: 200, over90: 0, total: 7000 },
  { customerId: "7", customerName: "Eastside Hardware", current: 2800, days30: 1500, days60: 1000, days90: 500, over90: 0, total: 5800 },
];

const mockPayableAging: CustomerAging[] = [
  { customerId: "1", customerName: "Alpha Distributors", current: 2500, days30: 1500, days60: 0, days90: 0, over90: 0, total: 4000 },
  { customerId: "2", customerName: "Premier Wholesale", current: 2000, days30: 1500, days60: 800, days90: 200, over90: 0, total: 4500 },
  { customerId: "4", customerName: "Metro Traders", current: 2000, days30: 1500, days60: 1500, days90: 1000, over90: 500, total: 6500 },
  { customerId: "5", customerName: "Eastern Imports", current: 2200, days30: 1000, days60: 0, days90: 0, over90: 0, total: 3200 },
  { customerId: "7", customerName: "Central Supplies Co", current: 2000, days30: 1500, days60: 600, days90: 300, over90: 0, total: 4400 },
];

// ============================================================================
// HELPERS
// ============================================================================

const typeOptions: SelectOption[] = [
  { value: "receivable", label: "Receivables (Customers)" },
  { value: "payable", label: "Payables (Suppliers)" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function AgingReport() {
  const [reportType, setReportType] = useState<"receivable" | "payable">("receivable");
  const [search, setSearch] = useState("");

  const data = reportType === "receivable" ? mockReceivableAging : mockPayableAging;

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((entry) =>
      entry.customerName.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, entry) => ({
        current: acc.current + entry.current,
        days30: acc.days30 + entry.days30,
        days60: acc.days60 + entry.days60,
        days90: acc.days90 + entry.days90,
        over90: acc.over90 + entry.over90,
        total: acc.total + entry.total,
      }),
      { current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 }
    );
  }, [filteredData]);

  // Calculate aging buckets for chart
  const agingBuckets = [
    { label: "Current", amount: totals.current, color: "bg-success" },
    { label: "1-30 Days", amount: totals.days30, color: "bg-teal-500" },
    { label: "31-60 Days", amount: totals.days60, color: "bg-amber-500" },
    { label: "61-90 Days", amount: totals.days90, color: "bg-orange-500" },
    { label: "90+ Days", amount: totals.over90, color: "bg-error" },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const maxBucket = Math.max(...agingBuckets.map((b) => b.amount));

  return (
    <ReportLayout
      title="Aging Report"
      subtitle="Outstanding amounts by age"
      backPath="/reports"
      onExport={() => console.log("Export aging report")}
      onPrint={() => window.print()}
      filters={
        <div className="flex flex-wrap items-center gap-4">
          <Select
            options={typeOptions}
            value={reportType}
            onChange={(value) => setReportType(value as "receivable" | "payable")}
            className="w-56"
          />
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder={`Search ${reportType === "receivable" ? "customers" : "suppliers"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Aging Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="bg-green-50 border-green-100">
            <CardBody className="py-3 text-center">
              <p className="text-xs text-green-600">Current</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(totals.current)}</p>
            </CardBody>
          </Card>
          <Card className="bg-teal-50 border-teal-100">
            <CardBody className="py-3 text-center">
              <p className="text-xs text-teal-600">1-30 Days</p>
              <p className="text-lg font-bold text-teal-700">{formatCurrency(totals.days30)}</p>
            </CardBody>
          </Card>
          <Card className="bg-amber-50 border-amber-100">
            <CardBody className="py-3 text-center">
              <p className="text-xs text-amber-600">31-60 Days</p>
              <p className="text-lg font-bold text-amber-700">{formatCurrency(totals.days60)}</p>
            </CardBody>
          </Card>
          <Card className="bg-orange-50 border-orange-100">
            <CardBody className="py-3 text-center">
              <p className="text-xs text-orange-600">61-90 Days</p>
              <p className="text-lg font-bold text-orange-700">{formatCurrency(totals.days90)}</p>
            </CardBody>
          </Card>
          <Card className="bg-red-50 border-red-100">
            <CardBody className="py-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3 text-error" />
                <p className="text-xs text-red-600">90+ Days</p>
              </div>
              <p className="text-lg font-bold text-error">{formatCurrency(totals.over90)}</p>
            </CardBody>
          </Card>
          <Card className="bg-slate-100">
            <CardBody className="py-3 text-center">
              <p className="text-xs text-slate-600">Total</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(totals.total)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Aging Chart */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Aging Distribution</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {agingBuckets.map((bucket) => (
                <div key={bucket.label} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-slate-600">{bucket.label}</div>
                  <div className="flex-1">
                    <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={cn("h-6 rounded-full flex items-center justify-end pr-2", bucket.color)}
                        style={{ width: maxBucket > 0 ? `${(bucket.amount / maxBucket) * 100}%` : "0%" }}
                      >
                        {bucket.amount > 0 && (
                          <span className="text-xs font-medium text-white">{formatCurrency(bucket.amount)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Detail Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">
              {reportType === "receivable" ? "Customer" : "Supplier"} Aging Details
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      {reportType === "receivable" ? "Customer" : "Supplier"}
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Current</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">1-30 Days</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">31-60 Days</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">61-90 Days</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">90+ Days</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No data found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((entry) => (
                      <tr key={entry.customerId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{entry.customerName}</td>
                        <td className="px-4 py-3 text-right text-success">{entry.current > 0 ? formatCurrency(entry.current) : "-"}</td>
                        <td className="px-4 py-3 text-right text-teal-600">{entry.days30 > 0 ? formatCurrency(entry.days30) : "-"}</td>
                        <td className="px-4 py-3 text-right text-amber-600">{entry.days60 > 0 ? formatCurrency(entry.days60) : "-"}</td>
                        <td className="px-4 py-3 text-right text-orange-600">{entry.days90 > 0 ? formatCurrency(entry.days90) : "-"}</td>
                        <td className="px-4 py-3 text-right text-error">{entry.over90 > 0 ? formatCurrency(entry.over90) : "-"}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(entry.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-medium">
                      <td className="px-4 py-3 text-slate-900">Total</td>
                      <td className="px-4 py-3 text-right text-success">{formatCurrency(totals.current)}</td>
                      <td className="px-4 py-3 text-right text-teal-600">{formatCurrency(totals.days30)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(totals.days60)}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(totals.days90)}</td>
                      <td className="px-4 py-3 text-right text-error">{formatCurrency(totals.over90)}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(totals.total)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </ReportLayout>
  );
}
