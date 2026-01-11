import { useState, useMemo } from "react";
import { Card, CardBody, Input, Select, Badge, type SelectOption } from "@/components/ui";
import { ReportLayout } from "../components";
import { Search, Package, AlertTriangle, DollarSign, Boxes, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import type { StockSummaryItem } from "../types";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockStockData: StockSummaryItem[] = [
  { itemId: "1", itemName: "Laptop Pro 15", sku: "LP-15", category: "Electronics", unit: "pcs", stockQuantity: 25, purchasePrice: 900, salePrice: 1200, stockValue: 22500, lowStockAlert: 5, isLowStock: false },
  { itemId: "2", itemName: "Wireless Mouse", sku: "WM-01", category: "Electronics", unit: "pcs", stockQuantity: 150, purchasePrice: 15, salePrice: 25, stockValue: 2250, lowStockAlert: 20, isLowStock: false },
  { itemId: "3", itemName: "Office Chair Deluxe", sku: "OCD-01", category: "Furniture", unit: "pcs", stockQuantity: 8, purchasePrice: 250, salePrice: 350, stockValue: 2000, lowStockAlert: 10, isLowStock: true },
  { itemId: "4", itemName: "Desk Lamp LED", sku: "DL-LED", category: "Electronics", unit: "pcs", stockQuantity: 200, purchasePrice: 28, salePrice: 45, stockValue: 5600, lowStockAlert: 30, isLowStock: false },
  { itemId: "5", itemName: "Tool Kit Professional", sku: "TKP-01", category: "Tools", unit: "sets", stockQuantity: 3, purchasePrice: 120, salePrice: 180, stockValue: 360, lowStockAlert: 5, isLowStock: true },
  { itemId: "6", itemName: "Storage Bins Large", sku: "SBL-01", category: "Storage", unit: "pcs", stockQuantity: 500, purchasePrice: 8, salePrice: 15, stockValue: 4000, lowStockAlert: 50, isLowStock: false },
  { itemId: "7", itemName: "Shelving Unit", sku: "SU-01", category: "Furniture", unit: "pcs", stockQuantity: 12, purchasePrice: 150, salePrice: 200, stockValue: 1800, lowStockAlert: 5, isLowStock: false },
  { itemId: "8", itemName: "USB-C Hub", sku: "UCH-01", category: "Electronics", unit: "pcs", stockQuantity: 45, purchasePrice: 35, salePrice: 55, stockValue: 1575, lowStockAlert: 15, isLowStock: false },
  { itemId: "9", itemName: "Monitor Stand", sku: "MS-01", category: "Accessories", unit: "pcs", stockQuantity: 4, purchasePrice: 45, salePrice: 75, stockValue: 180, lowStockAlert: 10, isLowStock: true },
  { itemId: "10", itemName: "Keyboard Wireless", sku: "KW-01", category: "Electronics", unit: "pcs", stockQuantity: 80, purchasePrice: 40, salePrice: 65, stockValue: 3200, lowStockAlert: 20, isLowStock: false },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function StockSummaryReport() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(mockStockData.map((item) => item.category).filter(Boolean))];
    return cats as string[];
  }, []);

  const categoryOptions: SelectOption[] = useMemo(() => [
    { value: "all", label: "All Categories" },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ], [categories]);

  // Filter items
  const filteredItems = useMemo(() => {
    return mockStockData.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesLowStock = !showLowStock || item.isLowStock;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [search, categoryFilter, showLowStock]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalItems = filteredItems.length;
    const totalQuantity = filteredItems.reduce((sum, item) => sum + item.stockQuantity, 0);
    const totalValue = filteredItems.reduce((sum, item) => sum + item.stockValue, 0);
    const lowStockCount = filteredItems.filter((item) => item.isLowStock).length;
    const potentialRevenue = filteredItems.reduce((sum, item) => sum + (item.stockQuantity * item.salePrice), 0);

    return { totalItems, totalQuantity, totalValue, lowStockCount, potentialRevenue };
  }, [filteredItems]);

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <ReportLayout
      title="Stock Summary"
      subtitle="Current inventory levels and valuations"
      onRefresh={() => console.log("Refresh")}
      onExport={() => console.log("Export")}
      onPrint={() => window.print()}
      filters={
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xs">
            <Input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            className="w-48"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-600">Low Stock Only</span>
          </label>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <CardBody className="p-4 text-center">
            <Boxes className="h-6 w-6 text-primary-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500 mb-1">Total Items</p>
            <p className="text-2xl font-bold text-slate-900">{totals.totalItems}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 text-center">
            <Package className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500 mb-1">Total Quantity</p>
            <p className="text-2xl font-bold text-slate-900">{totals.totalQuantity.toLocaleString()}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500 mb-1">Stock Value</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalValue)}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-teal-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500 mb-1">Potential Revenue</p>
            <p className="text-2xl font-bold text-teal-600">{formatCurrency(totals.potentialRevenue)}</p>
          </CardBody>
        </Card>

        <Card className={totals.lowStockCount > 0 ? "border-warning" : ""}>
          <CardBody className="p-4 text-center">
            <AlertTriangle className={cn("h-6 w-6 mx-auto mb-2", totals.lowStockCount > 0 ? "text-warning" : "text-slate-400")} />
            <p className="text-sm text-slate-500 mb-1">Low Stock</p>
            <p className={cn("text-2xl font-bold", totals.lowStockCount > 0 ? "text-warning" : "text-slate-900")}>
              {totals.lowStockCount}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <CardBody className="p-0">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Item</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">SKU</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Category</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Stock</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Purchase Price</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Sale Price</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Stock Value</th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.itemId} className={cn("hover:bg-slate-50", item.isLowStock && "bg-warning-light")}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">{item.itemName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-slate-600">{item.sku}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" size="sm">{item.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      "font-medium",
                      item.isLowStock ? "text-warning" : "text-slate-900"
                    )}>
                      {item.stockQuantity} {item.unit}
                    </span>
                    {item.isLowStock && (
                      <span className="text-xs text-warning block">
                        Min: {item.lowStockAlert}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">
                    {formatCurrency(item.purchasePrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-900">
                    {formatCurrency(item.salePrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {formatCurrency(item.stockValue)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.isLowStock ? (
                      <Badge variant="warning" size="sm">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">In Stock</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-slate-900">
                  Total ({filteredItems.length} items)
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">
                  {totals.totalQuantity.toLocaleString()}
                </td>
                <td colSpan={2}></td>
                <td className="px-4 py-3 text-right font-bold text-green-600">
                  {formatCurrency(totals.totalValue)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </CardBody>
      </Card>
    </ReportLayout>
  );
}
