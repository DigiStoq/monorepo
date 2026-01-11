import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input } from "@/components/ui";
import { Search, Package, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";
import { useStockMovementReport } from "@/hooks/useReports";

// ============================================================================
// COMPONENT
// ============================================================================

export function StockMovementReport(): React.ReactNode {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");

  // Fetch data from PowerSync
  const { data: movementData, isLoading } = useStockMovementReport(dateRange);

  // Filter data
  const filteredData = useMemo(() => {
    return movementData.filter((item) =>
      item.itemName.toLowerCase().includes(search.toLowerCase())
    );
  }, [movementData, search]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        opening: acc.opening + item.openingStock,
        purchased: acc.purchased + item.purchased,
        sold: acc.sold + item.sold,
        adjusted: acc.adjusted + item.adjusted,
        closing: acc.closing + item.closingStock,
      }),
      { opening: 0, purchased: 0, sold: 0, adjusted: 0, closing: 0 }
    );
  }, [filteredData]);

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Stock Movement Report"
        subtitle="Item-wise stock inflows and outflows"
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
      title="Stock Movement Report"
      subtitle="Item-wise stock inflows and outflows"
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Opening Stock</p>
              <p className="text-xl font-bold text-slate-900">
                {totals.opening.toLocaleString()}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-green-50 border-green-100">
            <CardBody className="py-3">
              <div className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3 text-success" />
                <p className="text-xs text-green-600">Purchased</p>
              </div>
              <p className="text-xl font-bold text-success">
                +{totals.purchased.toLocaleString()}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-red-50 border-red-100">
            <CardBody className="py-3">
              <div className="flex items-center gap-1">
                <ArrowDown className="h-3 w-3 text-error" />
                <p className="text-xs text-red-600">Sold</p>
              </div>
              <p className="text-xl font-bold text-error">
                -{totals.sold.toLocaleString()}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-amber-50 border-amber-100">
            <CardBody className="py-3">
              <div className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 text-amber-600" />
                <p className="text-xs text-amber-600">Adjusted</p>
              </div>
              <p className="text-xl font-bold text-amber-700">
                {totals.adjusted >= 0 ? "+" : ""}
                {totals.adjusted.toLocaleString()}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-teal-50 border-teal-100">
            <CardBody className="py-3">
              <p className="text-xs text-teal-600">Closing Stock</p>
              <p className="text-xl font-bold text-teal-700">
                {totals.closing.toLocaleString()}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Movement Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">
              Stock Movement Details
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Item
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Opening
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      <span className="text-success">+ Purchased</span>
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      <span className="text-error">- Sold</span>
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      <span className="text-amber-600">+/- Adjusted</span>
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Closing
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-40">
                      Movement
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No items found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      const netChange =
                        item.purchased - item.sold + item.adjusted;
                      const changePercent =
                        item.openingStock > 0
                          ? (netChange / item.openingStock) * 100
                          : 0;

                      return (
                        <tr key={item.itemId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900">
                            {item.openingStock}
                          </td>
                          <td className="px-4 py-3 text-right text-success">
                            +{item.purchased}
                          </td>
                          <td className="px-4 py-3 text-right text-error">
                            -{item.sold}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-600">
                            {item.adjusted >= 0 ? "+" : ""}
                            {item.adjusted}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-teal-700">
                            {item.closingStock}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {netChange >= 0 ? (
                                <ArrowUp className="h-4 w-4 text-success" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-error" />
                              )}
                              <span
                                className={
                                  netChange >= 0 ? "text-success" : "text-error"
                                }
                              >
                                {netChange >= 0 ? "+" : ""}
                                {netChange} ({changePercent >= 0 ? "+" : ""}
                                {changePercent.toFixed(1)}%)
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-medium">
                      <td className="px-4 py-3 text-slate-900">Total</td>
                      <td className="px-4 py-3 text-right text-slate-900">
                        {totals.opening}
                      </td>
                      <td className="px-4 py-3 text-right text-success">
                        +{totals.purchased}
                      </td>
                      <td className="px-4 py-3 text-right text-error">
                        -{totals.sold}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600">
                        {totals.adjusted >= 0 ? "+" : ""}
                        {totals.adjusted}
                      </td>
                      <td className="px-4 py-3 text-right text-teal-700">
                        {totals.closing}
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
