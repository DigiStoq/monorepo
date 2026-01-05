import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input } from "@/components/ui";
import { Search, Users, TrendingUp, TrendingDown } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";
import { usePurchaseBySupplierReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// COMPONENT
// ============================================================================

export function PurchaseBySupplierReport(): React.ReactNode {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"purchases" | "invoices" | "due">(
    "purchases"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch data from PowerSync
  const { data: supplierData, isLoading } =
    usePurchaseBySupplierReport(dateRange);

  // Filter and sort data
  const processedData = useMemo(() => {
    const data = supplierData
      .map((s) => ({
        supplierId: s.supplierId,
        supplierName: s.supplierName,
        invoiceCount: s.invoiceCount,
        totalPurchases: s.totalAmount,
        totalPaid: s.paidAmount,
        totalDue: s.dueAmount,
        averageOrderValue:
          s.invoiceCount > 0 ? s.totalAmount / s.invoiceCount : 0,
      }))
      .filter((supplier) =>
        supplier.supplierName.toLowerCase().includes(search.toLowerCase())
      );

    data.sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      switch (sortBy) {
        case "purchases":
          return (a.totalPurchases - b.totalPurchases) * multiplier;
        case "invoices":
          return (a.invoiceCount - b.invoiceCount) * multiplier;
        case "due":
          return (a.totalDue - b.totalDue) * multiplier;
        default:
          return 0;
      }
    });

    return data;
  }, [supplierData, search, sortBy, sortOrder]);

  // Calculate totals
  const totals = useMemo(() => {
    return processedData.reduce(
      (acc, supplier) => ({
        invoices: acc.invoices + supplier.invoiceCount,
        purchases: acc.purchases + supplier.totalPurchases,
        paid: acc.paid + supplier.totalPaid,
        due: acc.due + supplier.totalDue,
      }),
      { invoices: 0, purchases: 0, paid: 0, due: 0 }
    );
  }, [processedData]);

  const { formatCurrency } = useCurrency();

  const handleSort = (column: "purchases" | "invoices" | "due"): void => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({
    column,
  }: {
    column: "purchases" | "invoices" | "due";
  }): React.ReactNode => {
    if (sortBy !== column) return null;
    return sortOrder === "desc" ? (
      <TrendingDown className="h-3 w-3 inline ml-1" />
    ) : (
      <TrendingUp className="h-3 w-3 inline ml-1" />
    );
  };

  // Calculate percentage of total for bar visualization
  const maxPurchases = Math.max(
    ...processedData.map((s) => s.totalPurchases),
    1
  );

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Purchases by Supplier"
        subtitle="Supplier-wise purchase analysis"
        backPath="/reports"
        filters={<DateRangeFilter value={dateRange} onChange={setDateRange} />}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading report data...</div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Purchases by Supplier"
      subtitle="Supplier-wise purchase analysis"
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
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Suppliers</p>
              <p className="text-xl font-bold text-slate-900">
                {processedData.length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Purchases</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(totals.purchases)}
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
        </div>

        {/* Supplier Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">
              Supplier Purchase Details
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Supplier
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => {
                        handleSort("invoices");
                      }}
                    >
                      Invoices <SortIcon column="invoices" />
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => {
                        handleSort("purchases");
                      }}
                    >
                      Total Purchases <SortIcon column="purchases" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Paid
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => {
                        handleSort("due");
                      }}
                    >
                      Due <SortIcon column="due" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Avg Order
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-32">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No suppliers found</p>
                      </td>
                    </tr>
                  ) : (
                    processedData.map((supplier) => {
                      const purchasePercentage =
                        (supplier.totalPurchases / maxPurchases) * 100;
                      return (
                        <tr
                          key={supplier.supplierId}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {supplier.supplierName}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {supplier.invoiceCount}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-orange-600">
                            {formatCurrency(supplier.totalPurchases)}
                          </td>
                          <td className="px-4 py-3 text-right text-success">
                            {formatCurrency(supplier.totalPaid)}
                          </td>
                          <td className="px-4 py-3 text-right text-error">
                            {formatCurrency(supplier.totalDue)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(supplier.averageOrderValue)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full"
                                style={{ width: `${purchasePercentage}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {processedData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-medium">
                      <td className="px-4 py-3 text-slate-900">Total</td>
                      <td className="px-4 py-3 text-right text-slate-900">
                        {totals.invoices}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600">
                        {formatCurrency(totals.purchases)}
                      </td>
                      <td className="px-4 py-3 text-right text-success">
                        {formatCurrency(totals.paid)}
                      </td>
                      <td className="px-4 py-3 text-right text-error">
                        {formatCurrency(totals.due)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(
                          totals.invoices > 0
                            ? totals.purchases / totals.invoices
                            : 0
                        )}
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
