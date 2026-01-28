import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input, Badge } from "@/components/ui";
import { Search, Users, AlertCircle } from "lucide-react";
import { ReportLayout, ExportModal } from "../components";
import { usePayablesReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";
import type { ExportColumn } from "../utils/export";

// ============================================================================
// TYPES
// ============================================================================

interface PayablesEntry {
  supplierName: string;
  invoiceCount: number;
  totalDue: number;
  overdueAmount: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PayablesReport(): React.ReactNode {
  const [search, setSearch] = useState("");
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Fetch data from PowerSync
  const { data: payablesData, isLoading } = usePayablesReport();

  // Filter data
  const filteredData = useMemo(() => {
    return payablesData.filter((entry) => {
      const matchesSearch = entry.supplierName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesOverdue = !showOnlyOverdue || entry.overdueAmount > 0;
      return matchesSearch && matchesOverdue;
    });
  }, [payablesData, search, showOnlyOverdue]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, entry) => ({
        due: acc.due + entry.totalDue,
        overdue: acc.overdue + entry.overdueAmount,
      }),
      { due: 0, overdue: 0 }
    );
  }, [filteredData]);

  const { formatCurrency } = useCurrency();

  const exportColumns: ExportColumn<PayablesEntry>[] = useMemo(
    () => [
      { key: "supplierName", label: "Supplier" },
      { key: "invoiceCount", label: "Invoices" },
      { key: "totalDue", label: "Amount Due", format: (val) => formatCurrency(Number(val)) },
      { key: "overdueAmount", label: "Overdue", format: (val) => formatCurrency(Number(val)) },
      { key: "overdueAmount", label: "Status", format: (val) => Number(val) > 0 ? "Overdue" : "Pending" },
    ],
    [formatCurrency]
  );

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Payables Report"
        subtitle="Outstanding amounts to suppliers"
        backPath="/reports"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading report data...</div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <>
      <ReportLayout
        title="Payables Report"
        subtitle="Outstanding amounts to suppliers"
        backPath="/reports"
        onExport={() => { setIsExportOpen(true); }}
        onPrint={() => { setIsExportOpen(true); }}
        filters={
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="text"
                placeholder="Search suppliers..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyOverdue}
                onChange={(e) => {
                  setShowOnlyOverdue(e.target.checked);
                }}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Show only overdue
            </label>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardBody className="py-3">
                <p className="text-xs text-slate-500 mb-1">
                  Suppliers with Balance
                </p>
                <p className="text-lg sm:text-xl font-bold text-text-heading">
                  {filteredData.length}
                </p>
              </CardBody>
            </Card>
            <Card className="bg-orange-50 border-orange-100">
              <CardBody className="py-3">
                <p className="text-xs text-orange-600 mb-1">Total Amount Due</p>
                <p
                  className="text-lg sm:text-xl font-bold text-orange-700"
                  title={formatCurrency(totals.due)}
                >
                  {formatCurrency(totals.due)}
                </p>
              </CardBody>
            </Card>
            <Card className="bg-red-50 border-red-100">
              <CardBody className="py-3">
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle className="h-3 w-3 text-error" />
                  <p className="text-xs text-red-600">Overdue Amount</p>
                </div>
                <p
                  className="text-lg sm:text-xl font-bold text-error"
                  title={formatCurrency(totals.overdue)}
                >
                  {formatCurrency(totals.overdue)}
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Payables Table */}
          <Card>
            <CardHeader>
              <h3 className="font-medium text-text-heading">Supplier Payables</h3>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-muted/50">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                        Supplier
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                        Invoices
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                        Amount Due
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                        Overdue
                      </th>
                      <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No payables found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((entry) => (
                        <tr key={entry.supplierId} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium text-text-heading">
                            {entry.supplierName}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {entry.invoiceCount}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-orange-600">
                            {formatCurrency(entry.totalDue)}
                          </td>
                          <td className="px-4 py-3 text-right text-error">
                            {entry.overdueAmount > 0
                              ? formatCurrency(entry.overdueAmount)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {entry.overdueAmount > 0 ? (
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
                      <tr className="bg-muted/50 font-medium">
                        <td className="px-4 py-3 text-text-heading">Total</td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {filteredData.reduce(
                            (sum, e) => sum + e.invoiceCount,
                            0
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-600">
                          {formatCurrency(totals.due)}
                        </td>
                        <td className="px-4 py-3 text-right text-error">
                          {formatCurrency(totals.overdue)}
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
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => { setIsExportOpen(false); }}
        data={filteredData}
        columns={exportColumns}
        title="Payables Report"
        filename={`payables-report-${new Date().toISOString().slice(0, 10)}`}
      />
    </>
  );
}
