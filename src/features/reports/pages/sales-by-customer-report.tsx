import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input } from "@/components/ui";
import { Search, Users, TrendingUp, TrendingDown } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface CustomerSalesData {
  partyId: string;
  partyName: string;
  invoiceCount: number;
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockCustomerSales: CustomerSalesData[] = [
  { partyId: "1", partyName: "Acme Corporation", invoiceCount: 12, totalSales: 45800, totalPaid: 42500, totalDue: 3300, averageOrderValue: 3816.67, lastPurchaseDate: "2024-01-25" },
  { partyId: "2", partyName: "Tech Solutions Inc", invoiceCount: 8, totalSales: 32400, totalPaid: 28000, totalDue: 4400, averageOrderValue: 4050, lastPurchaseDate: "2024-01-22" },
  { partyId: "3", partyName: "Global Traders", invoiceCount: 15, totalSales: 28900, totalPaid: 28900, totalDue: 0, averageOrderValue: 1926.67, lastPurchaseDate: "2024-01-20" },
  { partyId: "4", partyName: "Metro Retail", invoiceCount: 6, totalSales: 18500, totalPaid: 15000, totalDue: 3500, averageOrderValue: 3083.33, lastPurchaseDate: "2024-01-18" },
  { partyId: "5", partyName: "City Electronics", invoiceCount: 10, totalSales: 52000, totalPaid: 48000, totalDue: 4000, averageOrderValue: 5200, lastPurchaseDate: "2024-01-25" },
  { partyId: "6", partyName: "Premier Supplies", invoiceCount: 4, totalSales: 12800, totalPaid: 12800, totalDue: 0, averageOrderValue: 3200, lastPurchaseDate: "2024-01-15" },
  { partyId: "7", partyName: "Eastside Hardware", invoiceCount: 7, totalSales: 21500, totalPaid: 18000, totalDue: 3500, averageOrderValue: 3071.43, lastPurchaseDate: "2024-01-23" },
  { partyId: "8", partyName: "Northern Distributors", invoiceCount: 9, totalSales: 38200, totalPaid: 35000, totalDue: 3200, averageOrderValue: 4244.44, lastPurchaseDate: "2024-01-24" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function SalesByCustomerReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"sales" | "invoices" | "due">("sales");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort data
  const processedData = useMemo(() => {
    const data = mockCustomerSales.filter((customer) =>
      customer.partyName.toLowerCase().includes(search.toLowerCase())
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
  }, [search, sortBy, sortOrder]);

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleSort = (column: "sales" | "invoices" | "due") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ column }: { column: "sales" | "invoices" | "due" }) => {
    if (sortBy !== column) return null;
    return sortOrder === "desc" ? (
      <TrendingDown className="h-3 w-3 inline ml-1" />
    ) : (
      <TrendingUp className="h-3 w-3 inline ml-1" />
    );
  };

  // Calculate percentage of total for bar visualization
  const maxSales = Math.max(...processedData.map((c) => c.totalSales));

  return (
    <ReportLayout
      title="Sales by Customer"
      subtitle="Customer-wise sales performance"
      backPath="/reports"
      onExport={() => { console.log("Export customer sales"); }}
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
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Customers</p>
              <p className="text-xl font-bold text-slate-900">{processedData.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Sales</p>
              <p className="text-xl font-bold text-teal-600">{formatCurrency(totals.sales)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Amount Received</p>
              <p className="text-xl font-bold text-success">{formatCurrency(totals.paid)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Amount Due</p>
              <p className="text-xl font-bold text-error">{formatCurrency(totals.due)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Customer Sales Details</h3>
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
                      onClick={() => { handleSort("invoices"); }}
                    >
                      Invoices <SortIcon column="invoices" />
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("sales"); }}
                    >
                      Total Sales <SortIcon column="sales" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Paid
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("due"); }}
                    >
                      Due <SortIcon column="due" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Avg Order
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Last Purchase
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-32">
                      Sales Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No customers found</p>
                      </td>
                    </tr>
                  ) : (
                    processedData.map((customer) => {
                      const salesPercentage = (customer.totalSales / maxSales) * 100;
                      return (
                        <tr key={customer.partyId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{customer.partyName}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{customer.invoiceCount}</td>
                          <td className="px-4 py-3 text-right font-medium text-teal-600">{formatCurrency(customer.totalSales)}</td>
                          <td className="px-4 py-3 text-right text-success">{formatCurrency(customer.totalPaid)}</td>
                          <td className="px-4 py-3 text-right text-error">{formatCurrency(customer.totalDue)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(customer.averageOrderValue)}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{formatDate(customer.lastPurchaseDate)}</td>
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
                      <td className="px-4 py-3 text-right text-slate-900">{totals.invoices}</td>
                      <td className="px-4 py-3 text-right text-teal-600">{formatCurrency(totals.sales)}</td>
                      <td className="px-4 py-3 text-right text-success">{formatCurrency(totals.paid)}</td>
                      <td className="px-4 py-3 text-right text-error">{formatCurrency(totals.due)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(totals.invoices > 0 ? totals.sales / totals.invoices : 0)}
                      </td>
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
