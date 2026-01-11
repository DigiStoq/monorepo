import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody, Badge, Select, type SelectOption } from "@/components/ui";
import { ReportLayout, DateRangeFilter } from "../components";
import {
  FileText,
  ShoppingCart,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { DateRange, DayBookEntry } from "../types";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockDayBookData: DayBookEntry[] = [
  { id: "1", date: "2024-01-18", type: "sale", referenceNumber: "INV-1042", customerName: "Acme Electronics", description: "Sale - Laptop Pro x2", debit: 2400, credit: 0 },
  { id: "2", date: "2024-01-18", type: "payment_in", referenceNumber: "REC-018", customerName: "Metro Corp", description: "Payment received - INV-1035", debit: 0, credit: 2500 },
  { id: "3", date: "2024-01-18", type: "expense", referenceNumber: "EXP-012", description: "Office supplies purchase", debit: 0, credit: 245 },
  { id: "4", date: "2024-01-17", type: "purchase", referenceNumber: "PUR-008", customerName: "Global Supply Co", description: "Raw materials purchase", debit: 0, credit: 1800 },
  { id: "5", date: "2024-01-17", type: "sale", referenceNumber: "INV-1041", customerName: "Valley Distributors", description: "Sale - Storage Bins x50", debit: 750, credit: 0 },
  { id: "6", date: "2024-01-17", type: "payment_out", referenceNumber: "POUT-005", customerName: "Metro Distributors", description: "Supplier payment - PUR-003", debit: 0, credit: 1200 },
  { id: "7", date: "2024-01-16", type: "sale", referenceNumber: "INV-1040", customerName: "City Hardware Ltd", description: "Sale - Tool Kits x10", debit: 1800, credit: 0 },
  { id: "8", date: "2024-01-16", type: "payment_in", referenceNumber: "REC-017", customerName: "Global Traders Inc", description: "Payment received - INV-1030", debit: 0, credit: 3500 },
  { id: "9", date: "2024-01-16", type: "expense", referenceNumber: "EXP-011", description: "Electricity bill payment", debit: 0, credit: 350 },
  { id: "10", date: "2024-01-15", type: "purchase", referenceNumber: "PUR-007", customerName: "Valley Equipment Ltd", description: "Equipment purchase", debit: 0, credit: 2500 },
  { id: "11", date: "2024-01-15", type: "sale", referenceNumber: "INV-1039", customerName: "Acme Electronics", description: "Sale - Wireless Mouse x100", debit: 2500, credit: 0 },
  { id: "12", date: "2024-01-15", type: "adjustment", referenceNumber: "ADJ-002", description: "Cash adjustment - excess found", debit: 50, credit: 0 },
  { id: "13", date: "2024-01-14", type: "sale", referenceNumber: "INV-1038", customerName: "Metro Supplies Co", description: "Sale - Office Chairs x5", debit: 1750, credit: 0 },
  { id: "14", date: "2024-01-14", type: "payment_in", referenceNumber: "REC-016", customerName: "Acme Electronics", description: "Payment received - INV-1022", debit: 0, credit: 1250 },
  { id: "15", date: "2024-01-14", type: "expense", referenceNumber: "EXP-010", description: "Internet service monthly", debit: 0, credit: 120 },
];

// ============================================================================
// HELPERS
// ============================================================================

const typeConfig: Record<DayBookEntry["type"], { label: string; icon: React.ReactNode; color: string }> = {
  sale: { label: "Sale", icon: <FileText className="h-4 w-4" />, color: "bg-green-100 text-green-700" },
  purchase: { label: "Purchase", icon: <ShoppingCart className="h-4 w-4" />, color: "bg-orange-100 text-orange-700" },
  payment_in: { label: "Payment In", icon: <ArrowUpCircle className="h-4 w-4" />, color: "bg-teal-100 text-teal-700" },
  payment_out: { label: "Payment Out", icon: <ArrowDownCircle className="h-4 w-4" />, color: "bg-red-100 text-red-700" },
  expense: { label: "Expense", icon: <Receipt className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
  adjustment: { label: "Adjustment", icon: <Settings2 className="h-4 w-4" />, color: "bg-slate-100 text-slate-700" },
};

const typeOptions: SelectOption[] = [
  { value: "all", label: "All Transactions" },
  { value: "sale", label: "Sales" },
  { value: "purchase", label: "Purchases" },
  { value: "payment_in", label: "Payments In" },
  { value: "payment_out", label: "Payments Out" },
  { value: "expense", label: "Expenses" },
  { value: "adjustment", label: "Adjustments" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function DayBookReport() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  });

  const [typeFilter, setTypeFilter] = useState<DayBookEntry["type"] | "all">("all");

  // Filter entries
  const filteredEntries = useMemo(() => {
    return mockDayBookData.filter((entry) => {
      const matchesType = typeFilter === "all" || entry.type === typeFilter;
      const matchesDate = entry.date >= dateRange.from && entry.date <= dateRange.to;
      return matchesType && matchesDate;
    });
  }, [typeFilter, dateRange]);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const grouped: Record<string, DayBookEntry[]> = {};
    filteredEntries.forEach((entry) => {
      const existing = grouped[entry.date];
      if (existing) {
        existing.push(entry);
      } else {
        grouped[entry.date] = [entry];
      }
    });
    return grouped;
  }, [filteredEntries]);

  // Calculate totals
  const totals = useMemo(() => {
    const debit = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
    const credit = filteredEntries.reduce((sum, e) => sum + e.credit, 0);
    return { debit, credit, net: debit - credit };
  }, [filteredEntries]);

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const sortedDates = Object.keys(entriesByDate).sort((a, b) => b.localeCompare(a));

  return (
    <ReportLayout
      title="Day Book"
      subtitle="All transactions chronologically"
      onRefresh={() => console.log("Refresh")}
      onExport={() => console.log("Export")}
      onPrint={() => window.print()}
      filters={
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as DayBookEntry["type"] | "all")}
            className="w-48"
          />
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Debit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.debit)}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <ArrowUpCircle className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Credit</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.credit)}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <ArrowDownCircle className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Net Movement</p>
                <p className={cn("text-2xl font-bold", totals.net >= 0 ? "text-success" : "text-error")}>
                  {formatCurrency(Math.abs(totals.net))}
                  <span className="text-sm ml-1">{totals.net >= 0 ? "Dr" : "Cr"}</span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Day-wise Transactions */}
      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No transactions found</h3>
              <p className="text-slate-500">Try adjusting your filters or date range</p>
            </CardBody>
          </Card>
        ) : (
          sortedDates.map((date) => {
            const entries = entriesByDate[date] ?? [];
            const dayDebit = entries.reduce((sum, e) => sum + e.debit, 0);
            const dayCredit = entries.reduce((sum, e) => sum + e.credit, 0);

            return (
              <Card key={date}>
                <CardHeader
                  title={formatDate(date)}
                  action={
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-600 font-medium">Dr: {formatCurrency(dayDebit)}</span>
                      <span className="text-green-600 font-medium">Cr: {formatCurrency(dayCredit)}</span>
                    </div>
                  }
                />
                <CardBody className="p-0">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">Type</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">Reference</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">Customer</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">Description</th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-2">Debit</th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-2">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entries.map((entry) => {
                        const config = typeConfig[entry.type];

                        return (
                          <tr key={entry.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2">
                              <Badge className={cn("flex items-center gap-1 w-fit", config.color)} size="sm">
                                {config.icon}
                                {config.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-sm font-mono text-slate-600">
                              {entry.referenceNumber}
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-900">
                              {entry.customerName || "-"}
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-600">
                              {entry.description}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {entry.debit > 0 && (
                                <span className="font-medium text-blue-600">{formatCurrency(entry.debit)}</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {entry.credit > 0 && (
                                <span className="font-medium text-green-600">{formatCurrency(entry.credit)}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>
    </ReportLayout>
  );
}
