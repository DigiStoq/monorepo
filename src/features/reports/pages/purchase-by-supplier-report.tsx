import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input } from "@/components/ui";
import { Search, Users, TrendingUp, TrendingDown } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface SupplierPurchaseData {
  partyId: string;
  partyName: string;
  invoiceCount: number;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockSupplierPurchases: SupplierPurchaseData[] = [
  { partyId: "1", partyName: "Alpha Distributors", invoiceCount: 18, totalPurchases: 52000, totalPaid: 48000, totalDue: 4000, averageOrderValue: 2888.89, lastPurchaseDate: "2024-01-25" },
  { partyId: "2", partyName: "Premier Wholesale", invoiceCount: 12, totalPurchases: 38500, totalPaid: 35000, totalDue: 3500, averageOrderValue: 3208.33, lastPurchaseDate: "2024-01-22" },
  { partyId: "3", partyName: "National Supplies", invoiceCount: 8, totalPurchases: 28000, totalPaid: 28000, totalDue: 0, averageOrderValue: 3500, lastPurchaseDate: "2024-01-20" },
  { partyId: "4", partyName: "Metro Traders", invoiceCount: 10, totalPurchases: 24500, totalPaid: 22000, totalDue: 2500, averageOrderValue: 2450, lastPurchaseDate: "2024-01-24" },
  { partyId: "5", partyName: "Eastern Imports", invoiceCount: 6, totalPurchases: 18500, totalPaid: 15000, totalDue: 3500, averageOrderValue: 3083.33, lastPurchaseDate: "2024-01-18" },
  { partyId: "6", partyName: "Western Distributors", invoiceCount: 5, totalPurchases: 14200, totalPaid: 14200, totalDue: 0, averageOrderValue: 2840, lastPurchaseDate: "2024-01-15" },
  { partyId: "7", partyName: "Central Supplies Co", invoiceCount: 7, totalPurchases: 19800, totalPaid: 16000, totalDue: 3800, averageOrderValue: 2828.57, lastPurchaseDate: "2024-01-23" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PurchaseBySupplierReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"purchases" | "invoices" | "due">("purchases");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort data
  const processedData = useMemo(() => {
    const data = mockSupplierPurchases.filter((supplier) =>
      supplier.partyName.toLowerCase().includes(search.toLowerCase())
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
  }, [search, sortBy, sortOrder]);

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

  const handleSort = (column: "purchases" | "invoices" | "due") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ column }: { column: "purchases" | "invoices" | "due" }) => {
    if (sortBy !== column) return null;
    return sortOrder === "desc" ? (
      <TrendingDown className="h-3 w-3 inline ml-1" />
    ) : (
      <TrendingUp className="h-3 w-3 inline ml-1" />
    );
  };

  // Calculate percentage of total for bar visualization
  const maxPurchases = Math.max(...processedData.map((s) => s.totalPurchases));

  return (
    <ReportLayout
      title="Purchases by Supplier"
      subtitle="Supplier-wise purchase analysis"
      backPath="/reports"
      onExport={() => { console.log("Export supplier purchases"); }}
      onPrint={() => { window.print(); }}
      filters={
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search suppliers..."
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
              <p className="text-xs text-slate-500">Total Suppliers</p>
              <p className="text-xl font-bold text-slate-900">{processedData.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Purchases</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(totals.purchases)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Amount Paid</p>
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

        {/* Supplier Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Supplier Purchase Details</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Supplier</th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("invoices"); }}
                    >
                      Invoices <SortIcon column="invoices" />
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("purchases"); }}
                    >
                      Total Purchases <SortIcon column="purchases" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Paid</th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("due"); }}
                    >
                      Due <SortIcon column="due" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Avg Order</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Last Purchase</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-32">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No suppliers found</p>
                      </td>
                    </tr>
                  ) : (
                    processedData.map((supplier) => {
                      const purchasePercentage = (supplier.totalPurchases / maxPurchases) * 100;
                      return (
                        <tr key={supplier.partyId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{supplier.partyName}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{supplier.invoiceCount}</td>
                          <td className="px-4 py-3 text-right font-medium text-orange-600">{formatCurrency(supplier.totalPurchases)}</td>
                          <td className="px-4 py-3 text-right text-success">{formatCurrency(supplier.totalPaid)}</td>
                          <td className="px-4 py-3 text-right text-error">{formatCurrency(supplier.totalDue)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(supplier.averageOrderValue)}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{formatDate(supplier.lastPurchaseDate)}</td>
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
                      <td className="px-4 py-3 text-right text-slate-900">{totals.invoices}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(totals.purchases)}</td>
                      <td className="px-4 py-3 text-right text-success">{formatCurrency(totals.paid)}</td>
                      <td className="px-4 py-3 text-right text-error">{formatCurrency(totals.due)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(totals.invoices > 0 ? totals.purchases / totals.invoices : 0)}
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
