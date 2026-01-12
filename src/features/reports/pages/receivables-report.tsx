import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input, Badge } from "@/components/ui";
import { Search, Users, AlertCircle } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { useReceivablesReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// COMPONENT
// ============================================================================

export function ReceivablesReport(): React.ReactNode {
  const [search, setSearch] = useState("");
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);

  // Fetch data from PowerSync
  const { data: receivablesData, isLoading } = useReceivablesReport();

  // Filter data
  const filteredData = useMemo(() => {
    return receivablesData.filter((entry) => {
      const matchesSearch = entry.customerName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesOverdue = !showOnlyOverdue || entry.overdueAmount > 0;
      return matchesSearch && matchesOverdue;
    });
  }, [receivablesData, search, showOnlyOverdue]);

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

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Receivables Report"
        subtitle="Outstanding amounts from customers"
        backPath="/reports"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading report data...</div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Receivables Report"
      subtitle="Outstanding amounts from customers"
      backPath="/reports"
      onExport={() => {
        /* TODO: Implement export */
      }}
      onPrint={() => {
        window.print();
      }}
      filters={
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyOverdue}
              onChange={(e) => {
                setShowOnlyOverdue(e.target.checked);
              }}
              className="rounded border-slate-300"
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
                Customers with Balance
              </p>
              <p className="text-lg sm:text-xl font-bold text-text-heading">
                {filteredData.length}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-amber-50 border-amber-100">
            <CardBody className="py-3">
              <p className="text-xs text-amber-600 mb-1">Total Amount Due</p>
              <p
                className="text-lg sm:text-xl font-bold text-amber-700"
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

        {/* Receivables Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-text-heading">Customer Receivables</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-muted/50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Customer
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
                        <p className="text-slate-500">No receivables found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((entry) => (
                      <tr key={entry.customerId} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium text-text-heading">
                          {entry.customerName}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {entry.invoiceCount}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-amber-600">
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
                      <td className="px-4 py-3 text-right text-amber-600">
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
  );
}
