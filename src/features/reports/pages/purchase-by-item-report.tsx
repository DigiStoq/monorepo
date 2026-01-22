import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input } from "@/components/ui";
import { Search, Package, TrendingUp, TrendingDown } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";
import { usePurchaseByItemReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// COMPONENT
// ============================================================================

export function PurchaseByItemReport(): React.ReactNode {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"amount" | "quantity">("amount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch data from PowerSync
  const { data: itemData, isLoading } = usePurchaseByItemReport(dateRange);

  // Filter and sort data
  const processedData = useMemo(() => {
    const data = itemData.filter((item) =>
      item.itemName.toLowerCase().includes(search.toLowerCase())
    );

    data.sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      switch (sortBy) {
        case "amount":
          return (a.totalCost - b.totalCost) * multiplier;
        case "quantity":
          return (a.quantityPurchased - b.quantityPurchased) * multiplier;
        default:
          return 0;
      }
    });

    return data;
  }, [itemData, search, sortBy, sortOrder]);

  // Calculate totals
  const totals = useMemo(() => {
    return processedData.reduce(
      (acc, item) => ({
        quantity: acc.quantity + item.quantityPurchased,
        amount: acc.amount + item.totalCost,
      }),
      { quantity: 0, amount: 0 }
    );
  }, [processedData]);

  const { formatCurrency } = useCurrency();

  const handleSort = (column: "amount" | "quantity"): void => {
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
    column: "amount" | "quantity";
  }): React.ReactNode => {
    if (sortBy !== column) return null;
    return sortOrder === "desc" ? (
      <TrendingDown className="h-3 w-3 inline ml-1" />
    ) : (
      <TrendingUp className="h-3 w-3 inline ml-1" />
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Purchases by Item"
        subtitle="Item-wise purchase analysis"
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
      title="Purchases by Item"
      subtitle="Item-wise purchase analysis"
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
              placeholder="Search items..."
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Unique Items</p>
              <p className="text-xl font-bold text-text-heading">
                {processedData.length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Quantity</p>
              <p className="text-xl font-bold text-text-heading">
                {totals.quantity.toLocaleString()}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(totals.amount)}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-text-heading">
              Item Purchase Details
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-muted/50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Item
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => {
                        handleSort("quantity");
                      }}
                    >
                      Qty Purchased <SortIcon column="quantity" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Avg Price
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => {
                        handleSort("amount");
                      }}
                    >
                      Total Amount <SortIcon column="amount" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No items found</p>
                      </td>
                    </tr>
                  ) : (
                    processedData.map((item) => (
                      <tr key={item.itemId} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium text-text-heading">
                          {item.itemName}
                        </td>
                        <td className="px-4 py-3 text-right text-text-heading">
                          {item.quantityPurchased}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatCurrency(item.averagePrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-orange-600">
                          {formatCurrency(item.totalCost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {processedData.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/50 font-medium">
                      <td className="px-4 py-3 text-text-heading">Total</td>
                      <td className="px-4 py-3 text-right text-text-heading">
                        {totals.quantity}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right text-orange-600">
                        {formatCurrency(totals.amount)}
                      </td>
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
