import { useState, useMemo, useEffect } from "react";
import { Card, CardBody, Select, type SelectOption } from "@/components/ui";
import { ReportLayout, DateRangeFilter, ExportModal } from "../components";
import { User, ArrowUpCircle, ArrowDownCircle, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  DateRange,
  CustomerLedgerEntry,
} from "../types";
import { useCurrency } from "@/hooks/useCurrency";
import type { ExportColumn } from "../utils/export";
import { useCustomerStatementReport } from "@/hooks/useReports";
import { useCustomers } from "@/hooks/useCustomers";

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomerStatementReport(): React.ReactNode {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Fetch customers for dropdown
  const { customers } = useCustomers();

  // Fetch report data
  const { statement, isLoading } = useCustomerStatementReport(
    selectedCustomerId,
    dateRange
  );

  // Select the first customer by default if available and none selected
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const customerOptions: SelectOption[] = useMemo(
    () => [
      ...customers.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.type})`,
      })),
    ],
    [customers]
  );

  // Format currency
  const { formatCurrency } = useCurrency();

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const exportColumns: ExportColumn<CustomerLedgerEntry>[] = useMemo(
    () => [
      { key: "date", label: "Date", format: (val) => formatDate(String(val)) },
      { key: "referenceNumber", label: "Ref No." },
      { key: "description", label: "Description" },
      { key: "type", label: "Type" },
      { key: "debit", label: "Debit", format: (val) => formatCurrency(Number(val)) },
      { key: "credit", label: "Credit", format: (val) => formatCurrency(Number(val)) },
      { key: "balance", label: "Balance", format: (val) => formatCurrency(Number(val)) },
    ],
    [formatCurrency]
  );

  return (
    <>
      <ReportLayout
        title="Customer Statement"
        subtitle="Detailed ledger of customer transactions"
        backPath="/reports"
        onExport={() => { setIsExportOpen(true); }}
        onPrint={() => { setIsExportOpen(true); }}
        filters={
          <div className="flex flex-wrap items-center gap-4">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <div className="w-[300px]">
              <Select
                options={customerOptions}
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                placeholder="Select a customer..."
                searchable
                searchPlaceholder="Search customers..."
              />
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : !statement ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Search className="h-10 w-10 mb-2 opacity-20" />
            <p>Select a customer to view their statement</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-primary-50 border-primary-100">
                <CardBody className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-full text-primary-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-primary-700 font-medium">Opening Balance</p>
                      <p className="text-2xl font-bold text-primary-800">
                        {formatCurrency(statement.openingBalance)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-emerald-50 border-emerald-100">
                <CardBody className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                      <ArrowDownCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-700 font-medium">Total Credits</p>
                      <p className="text-2xl font-bold text-emerald-800">
                        {formatCurrency(statement.totalCredit)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-amber-50 border-amber-100">
                <CardBody className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                      <ArrowUpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-700 font-medium">Closing Balance</p>
                      <p className="text-2xl font-bold text-amber-800">
                        {formatCurrency(statement.closingBalance)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Ledger Table */}
            <Card>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border-primary">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Ref #</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Debit</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Credit</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary">
                      {statement.entries.map((entry) => (
                        <tr key={entry.id} className={cn(
                          "hover:bg-muted/30 transition-colors",
                          entry.type === 'opening' && "bg-muted/10 italic"
                        )}>
                          <td className="py-3 px-4 text-sm text-text-primary whitespace-nowrap">
                            {formatDate(entry.date)}
                          </td>
                          <td className="py-3 px-4 text-sm text-text-secondary font-mono">
                            {entry.referenceNumber}
                          </td>
                          <td className="py-3 px-4 text-sm text-text-primary">
                            {entry.description}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-amber-600">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-emerald-600">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-bold text-text-primary">
                            {formatCurrency(entry.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </ReportLayout>
      {statement && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => { setIsExportOpen(false); }}
          data={statement.entries}
          columns={exportColumns}
          title={`Statement - ${statement.customerName}`}
          filename={`statement-${statement.customerName}-${dateRange.from}-${dateRange.to}`}
        />
      )}
    </>
  );
}
