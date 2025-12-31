import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Input,
  Select,
  type SelectOption,
  Badge,
} from "@/components/ui";
import { Search, FileText, Calendar } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";
import { usePurchaseRegisterReport } from "@/hooks/useReports";

// ============================================================================
// HELPERS
// ============================================================================

const statusOptions: SelectOption[] = [
  { value: "all", label: "All Status" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "unpaid", label: "Unpaid" },
];

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "error" }
> = {
  paid: { label: "Paid", variant: "success" },
  partial: { label: "Partial", variant: "warning" },
  unpaid: { label: "Unpaid", variant: "error" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PurchaseRegisterReport(): React.ReactNode {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch data from PowerSync
  const { entries, isLoading } = usePurchaseRegisterReport(dateRange);

  // Filter data
  const filteredData = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        entry.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || entry.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [entries, search, statusFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, entry) => ({
        subtotal: acc.subtotal + entry.subtotal,
        tax: acc.tax + entry.tax,
        discount: acc.discount + entry.discount,
        total: acc.total + entry.total,
        paid: acc.paid + entry.paid,
        due: acc.due + entry.due,
      }),
      { subtotal: 0, tax: 0, discount: 0, total: 0, paid: 0, due: 0 }
    );
  }, [filteredData]);

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Purchase Register"
        subtitle="Detailed list of all purchase invoices"
        backPath="/reports"
        filters={
          <div className="flex flex-wrap items-center gap-4">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading register data...</div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Purchase Register"
      subtitle="Detailed list of all purchase invoices"
      backPath="/reports"
      onExport={() => {
        /* TODO: Implement export */
      }}
      onPrint={() => {
        window.print();
      }}
      filters={
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-40"
          />
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Purchases</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totals.total)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Amount Paid</p>
              <p className="text-xl font-bold text-success">
                {formatCurrency(totals.paid)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Amount Due</p>
              <p className="text-xl font-bold text-error">
                {formatCurrency(totals.due)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Invoices</p>
              <p className="text-xl font-bold text-slate-900">
                {filteredData.length}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Register Table */}
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Invoice
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Date
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Supplier
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Items
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Subtotal
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Tax
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Total
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Paid
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Due
                    </th>
                    <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No invoices found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((entry) => {
                      const config = statusConfig[entry.status] ?? {
                        label: entry.status,
                        variant: "warning" as const,
                      };
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {entry.invoiceNumber}
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-sm text-slate-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(entry.date)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-900">
                            {entry.customerName}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {entry.itemCount}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900">
                            {formatCurrency(entry.subtotal)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(entry.tax)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(entry.total)}
                          </td>
                          <td className="px-4 py-3 text-right text-success">
                            {formatCurrency(entry.paid)}
                          </td>
                          <td className="px-4 py-3 text-right text-error">
                            {formatCurrency(entry.due)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={config.variant}>
                              {config.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-medium">
                      <td colSpan={4} className="px-4 py-3 text-slate-900">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900">
                        {formatCurrency(totals.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(totals.tax)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900">
                        {formatCurrency(totals.total)}
                      </td>
                      <td className="px-4 py-3 text-right text-success">
                        {formatCurrency(totals.paid)}
                      </td>
                      <td className="px-4 py-3 text-right text-error">
                        {formatCurrency(totals.due)}
                      </td>
                      <td className="px-4 py-3"></td>
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
