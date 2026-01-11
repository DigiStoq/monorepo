import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input } from "@/components/ui";
import { Search, Users, TrendingUp, TrendingDown } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";
import { useSalesByCustomerReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// COMPONENT
// ============================================================================

export function SalesByCustomerReport(): React.ReactNode {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"sales" | "invoices" | "due">("sales");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch data from PowerSync
  const { data: customerSalesData, isLoading } =
    useSalesByCustomerReport(dateRange);

  // Filter and sort data
  const processedData = useMemo(() => {
    const data = customerSalesData
      .map((c) => ({
        customerId: c.customerId,
        customerName: c.customerName,
        invoiceCount: c.invoiceCount,
        totalSales: c.totalAmount,
        totalPaid: c.paidAmount,
        totalDue: c.dueAmount,
        averageOrderValue:
          c.invoiceCount > 0 ? c.totalAmount / c.invoiceCount : 0,
      }))
      .filter((customer) =>
        customer.customerName.toLowerCase().includes(search.toLowerCase())
      );

    data.sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      switch (sortBy) {
        case "sales":
          return (a.totalSales - b.totalSales) * multiplier;
        case "invoices":
          return (a.invoiceCount - b.invoiceCount) * multiplier;
        case "due":
          return (a.totalDue - b.totalDue) * multiplier;
        default:
          return 0;
      }
    });

    return data;
  }, [customerSalesData, search, sortBy, sortOrder]);

  // Calculate totals
  const totals = useMemo(() => {
    return processedData.reduce(
      (acc, customer) => ({
        invoices: acc.invoices + customer.invoiceCount,
        sales: acc.sales + customer.totalSales,
        paid: acc.paid + customer.totalPaid,
        due: acc.due + customer.totalDue,
      }),
      { invoices: 0, sales: 0, paid: 0, due: 0 }
    );
  }, [processedData]);

  const { formatCurrency } = useCurrency();

  const handleSort = (column: "sales" | "invoices" | "due"): void => {
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
    column: "sales" | "invoices" | "due";
  }): React.ReactNode => {
    if (sortBy !== column) return null;
    return sortOrder === "desc" ? (
      <TrendingDown className="h-3 w-3 inline ml-1" />
    ) : (
      <TrendingUp className="h-3 w-3 inline ml-1" />
    );
  };

  // Calculate percentage of total for bar visualization
  const maxSales = Math.max(...processedData.map((c) => c.totalSales), 1);

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Sales by Customer"
        subtitle="Customer-wise sales performance"
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
      title="Sales by Customer"
      subtitle="Customer-wise sales performance"
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
              placeholder="Search customers..."
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
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Customers</p>
              <p className="text-xl font-bold text-slate-900">
                {processedData.length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Sales</p>
              <p className="text-xl font-bold text-teal-600">
                {formatCurrency(totals.sales)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Amount Received</p>
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

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">
              Customer Sales Details
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Customer
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
                        handleSort("sales");
                      }}
                    >
                      Total Sales <SortIcon column="sales" />
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
                      Sales Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No customers found</p>
                      </td>
                    </tr>
                  ) : (
                    processedData.map((customer) => {
                      const salesPercentage =
                        (customer.totalSales / maxSales) * 100;
                      return (
                        <tr
                          key={customer.customerId}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {customer.customerName}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {customer.invoiceCount}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-teal-600">
                            {formatCurrency(customer.totalSales)}
                          </td>
                          <td className="px-4 py-3 text-right text-success">
                            {formatCurrency(customer.totalPaid)}
                          </td>
                          <td className="px-4 py-3 text-right text-error">
                            {formatCurrency(customer.totalDue)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(customer.averageOrderValue)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div
                                className="bg-teal-500 h-2 rounded-full"
                                style={{ width: `${salesPercentage}%` }}
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
                      <td className="px-4 py-3 text-right text-teal-600">
                        {formatCurrency(totals.sales)}
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
                            ? totals.sales / totals.invoices
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
