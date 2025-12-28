import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader, Input } from "@/components/ui";
import { Search, Package, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange, ItemProfitability } from "../types";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockItemProfitability: ItemProfitability[] = [
  { itemId: "1", itemName: "Wireless Mouse", unitsSold: 150, revenue: 4498.50, cost: 2250, profit: 2248.50, margin: 50 },
  { itemId: "2", itemName: "USB-C Cable", unitsSold: 320, revenue: 4156.80, cost: 1600, profit: 2556.80, margin: 61.5 },
  { itemId: "3", itemName: "Laptop Stand", unitsSold: 85, revenue: 4249.15, cost: 2125, profit: 2124.15, margin: 50 },
  { itemId: "4", itemName: "Webcam HD", unitsSold: 62, revenue: 4959.38, cost: 2480, profit: 2479.38, margin: 50 },
  { itemId: "5", itemName: "Keyboard Mechanical", unitsSold: 48, revenue: 6239.52, cost: 2880, profit: 3359.52, margin: 53.8 },
  { itemId: "6", itemName: "Monitor Arm", unitsSold: 35, revenue: 3149.65, cost: 1400, profit: 1749.65, margin: 55.5 },
  { itemId: "7", itemName: "Desk Organizer", unitsSold: 95, revenue: 2374.05, cost: 950, profit: 1424.05, margin: 60 },
  { itemId: "8", itemName: "HDMI Cable", unitsSold: 200, revenue: 2998, cost: 1000, profit: 1998, margin: 66.6 },
  { itemId: "9", itemName: "USB Hub", unitsSold: 45, revenue: 1124.55, cost: 675, profit: 449.55, margin: 40 },
  { itemId: "10", itemName: "Screen Protector", unitsSold: 180, revenue: 1798.20, cost: 900, profit: 898.20, margin: 49.9 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ItemProfitabilityReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"profit" | "margin" | "revenue">("profit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort data
  const processedData = useMemo(() => {
    const data = mockItemProfitability.filter((item) =>
      item.itemName.toLowerCase().includes(search.toLowerCase())
    );

    data.sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      switch (sortBy) {
        case "profit":
          return (a.profit - b.profit) * multiplier;
        case "margin":
          return (a.margin - b.margin) * multiplier;
        case "revenue":
          return (a.revenue - b.revenue) * multiplier;
        default:
          return 0;
      }
    });

    return data;
  }, [search, sortBy, sortOrder]);

  // Calculate totals
  const totals = useMemo(() => {
    const result = processedData.reduce(
      (acc, item) => ({
        units: acc.units + item.unitsSold,
        revenue: acc.revenue + item.revenue,
        cost: acc.cost + item.cost,
        profit: acc.profit + item.profit,
      }),
      { units: 0, revenue: 0, cost: 0, profit: 0 }
    );
    return {
      ...result,
      margin: result.revenue > 0 ? (result.profit / result.revenue) * 100 : 0,
    };
  }, [processedData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  const handleSort = (column: "profit" | "margin" | "revenue") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ column }: { column: "profit" | "margin" | "revenue" }) => {
    if (sortBy !== column) return null;
    return sortOrder === "desc" ? (
      <TrendingDown className="h-3 w-3 inline ml-1" />
    ) : (
      <TrendingUp className="h-3 w-3 inline ml-1" />
    );
  };

  // Calculate max profit for bar visualization
  const maxProfit = Math.max(...processedData.map((i) => i.profit));

  return (
    <ReportLayout
      title="Item Profitability"
      subtitle="Profit margin analysis by item"
      backPath="/reports"
      onExport={() => { console.log("Export profitability report"); }}
      onPrint={() => { window.print(); }}
      filters={
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search items..."
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Items Analyzed</p>
              <p className="text-xl font-bold text-slate-900">{processedData.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Revenue</p>
              <p className="text-xl font-bold text-teal-600">{formatCurrency(totals.revenue)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Cost</p>
              <p className="text-xl font-bold text-slate-600">{formatCurrency(totals.cost)}</p>
            </CardBody>
          </Card>
          <Card className="bg-green-50 border-green-100">
            <CardBody className="py-3">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-success" />
                <p className="text-xs text-green-600">Total Profit</p>
              </div>
              <p className="text-xl font-bold text-success">{formatCurrency(totals.profit)}</p>
            </CardBody>
          </Card>
          <Card className="bg-teal-50 border-teal-100">
            <CardBody className="py-3">
              <p className="text-xs text-teal-600">Avg Margin</p>
              <p className="text-xl font-bold text-teal-700">{totals.margin.toFixed(1)}%</p>
            </CardBody>
          </Card>
        </div>

        {/* Profitability Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Item Profitability Details</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Item</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Units Sold</th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("revenue"); }}
                    >
                      Revenue <SortIcon column="revenue" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Cost</th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("profit"); }}
                    >
                      Profit <SortIcon column="profit" />
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("margin"); }}
                    >
                      Margin <SortIcon column="margin" />
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-40">Profit Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No items found</p>
                      </td>
                    </tr>
                  ) : (
                    processedData.map((item) => {
                      const profitPercentage = maxProfit > 0 ? (item.profit / maxProfit) * 100 : 0;
                      const marginColor = item.margin >= 50 ? "text-success" : item.margin >= 30 ? "text-amber-600" : "text-error";

                      return (
                        <tr key={item.itemId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.itemName}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{item.unitsSold}</td>
                          <td className="px-4 py-3 text-right text-teal-600">{formatCurrency(item.revenue)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.cost)}</td>
                          <td className="px-4 py-3 text-right font-medium text-success">{formatCurrency(item.profit)}</td>
                          <td className={cn("px-4 py-3 text-right font-medium", marginColor)}>{item.margin.toFixed(1)}%</td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div
                                className="bg-success h-2 rounded-full"
                                style={{ width: `${profitPercentage}%` }}
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
                      <td className="px-4 py-3 text-right text-slate-900">{totals.units}</td>
                      <td className="px-4 py-3 text-right text-teal-600">{formatCurrency(totals.revenue)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(totals.cost)}</td>
                      <td className="px-4 py-3 text-right text-success">{formatCurrency(totals.profit)}</td>
                      <td className="px-4 py-3 text-right text-teal-700">{totals.margin.toFixed(1)}%</td>
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
