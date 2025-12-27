import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader, Input, Badge } from "@/components/ui";
import { Search, Package, AlertTriangle, TrendingDown } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import type { StockSummaryItem } from "../types";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockLowStockItems: StockSummaryItem[] = [
  { itemId: "1", itemName: "Wireless Mouse", sku: "WM-001", category: "Electronics", unit: "pcs", stockQuantity: 8, purchasePrice: 15, salePrice: 29.99, stockValue: 120, lowStockAlert: 20, isLowStock: true },
  { itemId: "2", itemName: "USB-C Hub", sku: "UH-001", category: "Accessories", unit: "pcs", stockQuantity: 3, purchasePrice: 25, salePrice: 49.99, stockValue: 75, lowStockAlert: 10, isLowStock: true },
  { itemId: "3", itemName: "Webcam HD", sku: "WC-004", category: "Electronics", unit: "pcs", stockQuantity: 5, purchasePrice: 40, salePrice: 79.99, stockValue: 200, lowStockAlert: 15, isLowStock: true },
  { itemId: "4", itemName: "Laptop Stand", sku: "LS-003", category: "Office", unit: "pcs", stockQuantity: 12, purchasePrice: 25, salePrice: 49.99, stockValue: 300, lowStockAlert: 15, isLowStock: true },
  { itemId: "5", itemName: "Monitor Arm", sku: "MA-006", category: "Office", unit: "pcs", stockQuantity: 0, purchasePrice: 40, salePrice: 89.99, stockValue: 0, lowStockAlert: 10, isLowStock: true },
  { itemId: "6", itemName: "Keyboard Mechanical", sku: "KM-005", category: "Electronics", unit: "pcs", stockQuantity: 7, purchasePrice: 60, salePrice: 129.99, stockValue: 420, lowStockAlert: 10, isLowStock: true },
  { itemId: "7", itemName: "Mouse Pad XL", sku: "MP-001", category: "Accessories", unit: "pcs", stockQuantity: 15, purchasePrice: 8, salePrice: 19.99, stockValue: 120, lowStockAlert: 25, isLowStock: true },
  { itemId: "8", itemName: "Cable Management Kit", sku: "CM-001", category: "Accessories", unit: "set", stockQuantity: 4, purchasePrice: 12, salePrice: 24.99, stockValue: 48, lowStockAlert: 10, isLowStock: true },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function LowStockReport() {
  const [search, setSearch] = useState("");
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  // Filter data
  const filteredData = useMemo(() => {
    return mockLowStockItems.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());
      const matchesOutOfStock = !showOutOfStock || item.stockQuantity === 0;
      return matchesSearch && matchesOutOfStock;
    });
  }, [search, showOutOfStock]);

  // Calculate stats
  const stats = useMemo(() => {
    const outOfStock = filteredData.filter((i) => i.stockQuantity === 0).length;
    const criticalLow = filteredData.filter((i) => i.stockQuantity > 0 && i.stockQuantity <= i.lowStockAlert * 0.5).length;
    const totalValue = filteredData.reduce((sum, i) => sum + i.stockValue, 0);
    return { outOfStock, criticalLow, total: filteredData.length, totalValue };
  }, [filteredData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  const getStockStatus = (item: StockSummaryItem) => {
    if (item.stockQuantity === 0) return { label: "Out of Stock", variant: "error" as const, color: "text-error" };
    if (item.stockQuantity <= item.lowStockAlert * 0.5) return { label: "Critical", variant: "error" as const, color: "text-error" };
    return { label: "Low Stock", variant: "warning" as const, color: "text-amber-600" };
  };

  return (
    <ReportLayout
      title="Low Stock Alert"
      subtitle="Items below minimum stock levels"
      backPath="/reports"
      onExport={() => console.log("Export low stock report")}
      onPrint={() => window.print()}
      filters={
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show only out of stock
          </label>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-red-50 border-red-100">
            <CardBody className="py-3">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-error" />
                <p className="text-xs text-red-600">Out of Stock</p>
              </div>
              <p className="text-xl font-bold text-error">{stats.outOfStock}</p>
            </CardBody>
          </Card>
          <Card className="bg-orange-50 border-orange-100">
            <CardBody className="py-3">
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-orange-600" />
                <p className="text-xs text-orange-600">Critical Low</p>
              </div>
              <p className="text-xl font-bold text-orange-700">{stats.criticalLow}</p>
            </CardBody>
          </Card>
          <Card className="bg-amber-50 border-amber-100">
            <CardBody className="py-3">
              <p className="text-xs text-amber-600">Total Low Stock Items</p>
              <p className="text-xl font-bold text-amber-700">{stats.total}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Stock Value at Risk</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Low Stock Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Low Stock Items</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Item</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">SKU</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Category</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Current Stock</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Min. Level</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Shortage</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Purchase Price</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Reorder Cost</th>
                    <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No low stock items found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      const status = getStockStatus(item);
                      const shortage = item.lowStockAlert - item.stockQuantity;
                      const reorderCost = shortage * item.purchasePrice;

                      return (
                        <tr key={item.itemId} className={cn("hover:bg-slate-50", item.stockQuantity === 0 && "bg-red-50/50")}>
                          <td className="px-4 py-3 font-medium text-slate-900">{item.itemName}</td>
                          <td className="px-4 py-3 text-slate-600">{item.sku}</td>
                          <td className="px-4 py-3 text-slate-600">{item.category}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn("font-medium", status.color)}>
                              {item.stockQuantity} {item.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">{item.lowStockAlert} {item.unit}</td>
                          <td className="px-4 py-3 text-right text-error font-medium">-{shortage} {item.unit}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.purchasePrice)}</td>
                          <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(reorderCost)}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-medium">
                      <td colSpan={7} className="px-4 py-3 text-slate-900">Total Reorder Cost</td>
                      <td className="px-4 py-3 text-right text-slate-900">
                        {formatCurrency(
                          filteredData.reduce((sum, item) => {
                            const shortage = item.lowStockAlert - item.stockQuantity;
                            return sum + shortage * item.purchasePrice;
                          }, 0)
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
