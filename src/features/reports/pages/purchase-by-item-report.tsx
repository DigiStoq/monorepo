import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Input } from "@/components/ui";
import { Search, Package, TrendingUp, TrendingDown } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import { DateRangeFilter } from "../components/date-range-filter";
import type { DateRange } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface ItemPurchaseData {
  itemId: string;
  itemName: string;
  sku: string;
  category: string;
  quantityPurchased: number;
  avgPurchasePrice: number;
  totalAmount: number;
  supplierCount: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockItemPurchases: ItemPurchaseData[] = [
  { itemId: "1", itemName: "Wireless Mouse", sku: "WM-001", category: "Electronics", quantityPurchased: 500, avgPurchasePrice: 15, totalAmount: 7500, supplierCount: 2 },
  { itemId: "2", itemName: "USB-C Cable", sku: "UC-002", category: "Accessories", quantityPurchased: 800, avgPurchasePrice: 5, totalAmount: 4000, supplierCount: 3 },
  { itemId: "3", itemName: "Laptop Stand", sku: "LS-003", category: "Office", quantityPurchased: 200, avgPurchasePrice: 25, totalAmount: 5000, supplierCount: 1 },
  { itemId: "4", itemName: "Webcam HD", sku: "WC-004", category: "Electronics", quantityPurchased: 150, avgPurchasePrice: 40, totalAmount: 6000, supplierCount: 2 },
  { itemId: "5", itemName: "Keyboard Mechanical", sku: "KM-005", category: "Electronics", quantityPurchased: 100, avgPurchasePrice: 60, totalAmount: 6000, supplierCount: 1 },
  { itemId: "6", itemName: "Monitor Arm", sku: "MA-006", category: "Office", quantityPurchased: 80, avgPurchasePrice: 40, totalAmount: 3200, supplierCount: 2 },
  { itemId: "7", itemName: "Desk Organizer", sku: "DO-007", category: "Office", quantityPurchased: 150, avgPurchasePrice: 10, totalAmount: 1500, supplierCount: 1 },
  { itemId: "8", itemName: "HDMI Cable", sku: "HC-008", category: "Accessories", quantityPurchased: 300, avgPurchasePrice: 5, totalAmount: 1500, supplierCount: 2 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PurchaseByItemReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"amount" | "quantity">("amount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort data
  const processedData = useMemo(() => {
    const data = mockItemPurchases.filter((item) =>
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );

    data.sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      switch (sortBy) {
        case "amount":
          return (a.totalAmount - b.totalAmount) * multiplier;
        case "quantity":
          return (a.quantityPurchased - b.quantityPurchased) * multiplier;
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
        quantity: acc.quantity + item.quantityPurchased,
        amount: acc.amount + item.totalAmount,
      }),
      { quantity: 0, amount: 0 }
    );
  }, [processedData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  const handleSort = (column: "amount" | "quantity") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ column }: { column: "amount" | "quantity" }) => {
    if (sortBy !== column) return null;
    return sortOrder === "desc" ? (
      <TrendingDown className="h-3 w-3 inline ml-1" />
    ) : (
      <TrendingUp className="h-3 w-3 inline ml-1" />
    );
  };

  return (
    <ReportLayout
      title="Purchases by Item"
      subtitle="Item-wise purchase analysis"
      backPath="/reports"
      onExport={() => { console.log("Export item purchases"); }}
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Unique Items</p>
              <p className="text-xl font-bold text-slate-900">{processedData.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Quantity</p>
              <p className="text-xl font-bold text-slate-900">{totals.quantity.toLocaleString()}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(totals.amount)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Item Purchase Details</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Item</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">SKU</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Category</th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("quantity"); }}
                    >
                      Qty Purchased <SortIcon column="quantity" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Avg Price</th>
                    <th
                      className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-slate-700"
                      onClick={() => { handleSort("amount"); }}
                    >
                      Total Amount <SortIcon column="amount" />
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Suppliers</th>
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
                    processedData.map((item) => (
                      <tr key={item.itemId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.itemName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.sku}</td>
                        <td className="px-4 py-3 text-slate-600">{item.category}</td>
                        <td className="px-4 py-3 text-right text-slate-900">{item.quantityPurchased}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.avgPurchasePrice)}</td>
                        <td className="px-4 py-3 text-right font-medium text-orange-600">{formatCurrency(item.totalAmount)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{item.supplierCount}</td>
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
                      <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(totals.amount)}</td>
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
