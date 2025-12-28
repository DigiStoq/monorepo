import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input, Badge } from "@/components/ui";
import { Search, Users, AlertCircle } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface ReceivableEntry {
  customerId: string;
  customerName: string;
  invoiceCount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  overdueAmount: number;
  oldestDueDate: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockReceivables: ReceivableEntry[] = [
  { customerId: "1", customerName: "Acme Corporation", invoiceCount: 5, totalAmount: 28500, paidAmount: 22000, dueAmount: 6500, overdueAmount: 2500, oldestDueDate: "2024-01-05" },
  { customerId: "2", customerName: "Tech Solutions Inc", invoiceCount: 3, totalAmount: 18200, paidAmount: 12000, dueAmount: 6200, overdueAmount: 0, oldestDueDate: "2024-01-28" },
  { customerId: "3", customerName: "Global Traders", invoiceCount: 4, totalAmount: 22800, paidAmount: 22800, dueAmount: 0, overdueAmount: 0, oldestDueDate: "" },
  { customerId: "4", customerName: "Metro Retail", invoiceCount: 2, totalAmount: 9500, paidAmount: 5000, dueAmount: 4500, overdueAmount: 4500, oldestDueDate: "2023-12-15" },
  { customerId: "5", customerName: "City Electronics", invoiceCount: 6, totalAmount: 35000, paidAmount: 28000, dueAmount: 7000, overdueAmount: 3000, oldestDueDate: "2024-01-10" },
  { customerId: "6", customerName: "Premier Supplies", invoiceCount: 2, totalAmount: 12400, paidAmount: 12400, dueAmount: 0, overdueAmount: 0, oldestDueDate: "" },
  { customerId: "7", customerName: "Eastside Hardware", invoiceCount: 3, totalAmount: 15800, paidAmount: 10000, dueAmount: 5800, overdueAmount: 1800, oldestDueDate: "2024-01-08" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ReceivablesReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [showOnlyDue, setShowOnlyDue] = useState(false);

  // Filter data
  const filteredData = useMemo(() => {
    return mockReceivables.filter((entry) => {
      const matchesSearch = entry.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesDue = !showOnlyDue || entry.dueAmount > 0;
      return matchesSearch && matchesDue;
    });
  }, [search, showOnlyDue]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, entry) => ({
        total: acc.total + entry.totalAmount,
        paid: acc.paid + entry.paidAmount,
        due: acc.due + entry.dueAmount,
        overdue: acc.overdue + entry.overdueAmount,
      }),
      { total: 0, paid: 0, due: 0, overdue: 0 }
    );
  }, [filteredData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <ReportLayout
      title="Receivables Report"
      subtitle="Outstanding amounts from customers"
      backPath="/reports"
      onExport={() => { console.log("Export receivables"); }}
      onPrint={() => { window.print(); }}
      filters={
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyDue}
              onChange={(e) => { setShowOnlyDue(e.target.checked); }}
              className="rounded border-slate-300"
            />
            Show only with balance due
          </label>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Invoiced</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.total)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Amount Received</p>
              <p className="text-xl font-bold text-success">{formatCurrency(totals.paid)}</p>
            </CardBody>
          </Card>
          <Card className="bg-amber-50 border-amber-100">
            <CardBody className="py-3">
              <p className="text-xs text-amber-600">Amount Due</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(totals.due)}</p>
            </CardBody>
          </Card>
          <Card className="bg-red-50 border-red-100">
            <CardBody className="py-3">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-error" />
                <p className="text-xs text-red-600">Overdue</p>
              </div>
              <p className="text-xl font-bold text-error">{formatCurrency(totals.overdue)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Receivables Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Customer Receivables</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Customer</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Invoices</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Total Amount</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Paid</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Due</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Overdue</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Oldest Due</th>
                    <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No receivables found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((entry) => (
                      <tr key={entry.customerId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{entry.customerName}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{entry.invoiceCount}</td>
                        <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(entry.totalAmount)}</td>
                        <td className="px-4 py-3 text-right text-success">{formatCurrency(entry.paidAmount)}</td>
                        <td className="px-4 py-3 text-right font-medium text-amber-600">{formatCurrency(entry.dueAmount)}</td>
                        <td className="px-4 py-3 text-right text-error">
                          {entry.overdueAmount > 0 ? formatCurrency(entry.overdueAmount) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">{formatDate(entry.oldestDueDate)}</td>
                        <td className="px-4 py-3 text-center">
                          {entry.dueAmount === 0 ? (
                            <Badge variant="success">Paid</Badge>
                          ) : entry.overdueAmount > 0 ? (
                            <Badge variant="error">Overdue</Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-medium">
                      <td className="px-4 py-3 text-slate-900">Total</td>
                      <td className="px-4 py-3 text-right text-slate-600">{filteredData.reduce((sum, e) => sum + e.invoiceCount, 0)}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(totals.total)}</td>
                      <td className="px-4 py-3 text-right text-success">{formatCurrency(totals.paid)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(totals.due)}</td>
                      <td className="px-4 py-3 text-right text-error">{formatCurrency(totals.overdue)}</td>
                      <td colSpan={2} className="px-4 py-3"></td>
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
