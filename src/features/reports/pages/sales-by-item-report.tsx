import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input } from "@/components/ui";
import { Search, Package, TrendingUp, TrendingDown } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface ItemSalesData {
  itemId: string;
  itemName: string;
  sku: string;
  category: string;
  quantitySold: number;
  unitPrice: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  margin: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockItemSales: ItemSalesData[] = [
  { itemId: "1", itemName: "Wireless Mouse", sku: "WM-001", category: "Electronics", quantitySold: 150, unitPrice: 29.99, totalRevenue: 4498.50, totalCost: 2250, profit: 2248.50, margin: 50 },
  { itemId: "2", itemName: "USB-C Cable", sku: "UC-002", category: "Accessories", quantitySold: 320, unitPrice: 12.99, totalRevenue: 4156.80, totalCost: 1600, profit: 2556.80, margin: 61.5 },
  { itemId: "3", itemName: "Laptop Stand", sku: "LS-003", category: "Office", quantitySold: 85, unitPrice: 49.99, totalRevenue: 4249.15, totalCost: 2125, profit: 2124.15, margin: 50 },
  { itemId: "4", itemName: "Webcam HD", sku: "WC-004", category: "Electronics", quantitySold: 62, unitPrice: 79.99, totalRevenue: 4959.38, totalCost: 2480, profit: 2479.38, margin: 50 },
  { itemId: "5", itemName: "Keyboard Mechanical", sku: "KM-005", category: "Electronics", quantitySold: 48, unitPrice: 129.99, totalRevenue: 6239.52, totalCost: 2880, profit: 3359.52, margin: 53.8 },
  { itemId: "6", itemName: "Monitor Arm", sku: "MA-006", category: "Office", quantitySold: 35, unitPrice: 89.99, totalRevenue: 3149.65, totalCost: 1400, profit: 1749.65, margin: 55.5 },
  { itemId: "7", itemName: "Desk Organizer", sku: "DO-007", category: "Office", quantitySold: 95, unitPrice: 24.99, totalRevenue: 2374.05, totalCost: 950, profit: 1424.05, margin: 60 },
  { itemId: "8", itemName: "HDMI Cable", sku: "HC-008", category: "Accessories", quantitySold: 200, unitPrice: 14.99, totalRevenue: 2998, totalCost: 1000, profit: 1998, margin: 66.6 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function SalesByItemReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"revenue" | "quantity" | "profit">("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort data
  const processedData = useMemo(() => {
    const data = mockItemSales.filter((item) =>
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );

    data.sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      switch (sortBy) {
        case "revenue":
          return (a.totalRevenue - b.totalRevenue) * multiplier;
        case "quantity":
          return (a.quantitySold - b.quantitySold) * multiplier;
        case "profit":
          return (a.profit - b.profit) * multiplier;
        default:
          return 0;
      }
    });

    return data;
  }, [search, sortBy, sortOrder]);

  // Calculate totals
  const totals = useMemo(() => {
    return processedData.reduce(
      (acc, item) => ({
        quantity: acc.quantity + item.quantitySold,
        revenue: acc.revenue + item.totalRevenue,
        cost: acc.cost + item.totalCost,
        profit: acc.profit + item.profit,
      }),
      { quantity: 0, revenue: 0, cost: 0, profit: 0 }
    );
  }, [processedData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  const handleSort = (column: "revenue" | "quantity" | "profit") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ column }: { column: "revenue" | "quantity" | "profit" }) => {
    if (sortBy !== column) return null;
    return sortOrder === "desc" ? (
      <TrendingDown className="h-3 w-3 inline ml-1" />
    ) : (
      <TrendingUp className="h-3 w-3 inline ml-1" />
    );
  };

  return (
    <ReportLayout
      title="Sales by Item"
      subtitle="Item-wise sales performance analysis"
      backPath="/reports"
      onExport={() => { console.log("Export item sales"); }}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Items Sold</p>
              <p className="text-xl font-bold text-slate-900">{totals.quantity.toLocaleString()}</p>
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
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Profit</p>
              <p className="text-xl font-bold text-success">{formatCurrency(totals.profit)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Item Sales Details</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Item
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      SKU
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Category
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("quantity"); }}
                    >
                      Qty Sold <SortIcon column="quantity" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Unit Price
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("revenue"); }}
                    >
                      Revenue <SortIcon column="revenue" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Cost
                    </th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("profit"); }}
                    >
                      Profit <SortIcon column="profit" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Margin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No items found</p>
                      </td>
                    </tr>
                  ) : (
                    processedData.map((item) => (
                      <tr key={item.itemId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.itemName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.sku}</td>
                        <td className="px-4 py-3 text-slate-600">{item.category}</td>
                        <td className="px-4 py-3 text-right text-slate-900">{item.quantitySold}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-medium text-teal-600">{formatCurrency(item.totalRevenue)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.totalCost)}</td>
                        <td className="px-4 py-3 text-right font-medium text-success">{formatCurrency(item.profit)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{item.margin.toFixed(1)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {processedData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-medium">
                      <td colSpan={3} className="px-4 py-3 text-slate-900">Total</td>
                      <td className="px-4 py-3 text-right text-slate-900">{totals.quantity}</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right text-teal-600">{formatCurrency(totals.revenue)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(totals.cost)}</td>
                      <td className="px-4 py-3 text-right text-success">{formatCurrency(totals.profit)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%
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
