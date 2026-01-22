import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader, Input, Badge } from "@/components/ui";
import { Search, Package, AlertTriangle, TrendingDown } from "lucide-react";
import { ReportLayout } from "../components/report-layout";
import type { StockSummaryItem } from "../types";
import { useLowStockReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// COMPONENT
// ============================================================================

export function LowStockReport(): React.ReactNode {
  const [search, setSearch] = useState("");
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  // Fetch data from PowerSync
  const { data: lowStockData, isLoading } = useLowStockReport();

  // Filter data
  const filteredData = useMemo(() => {
    return lowStockData.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());
      const matchesOutOfStock = !showOutOfStock || item.stockQuantity === 0;
      return matchesSearch && matchesOutOfStock;
    });
  }, [lowStockData, search, showOutOfStock]);

  // Calculate stats
  const stats = useMemo(() => {
    const outOfStock = filteredData.filter((i) => i.stockQuantity === 0).length;
    const criticalLow = filteredData.filter(
      (i) => i.stockQuantity > 0 && i.stockQuantity <= i.lowStockAlert * 0.5
    ).length;
    const totalValue = filteredData.reduce((sum, i) => sum + i.stockValue, 0);
    return { outOfStock, criticalLow, total: filteredData.length, totalValue };
  }, [filteredData]);

  const { formatCurrency } = useCurrency();

  const getStockStatus = (
    item: StockSummaryItem
  ): { label: string; variant: "error" | "warning"; color: string } => {
    if (item.stockQuantity === 0)
      return {
        label: "Out of Stock",
        variant: "error" as const,
        color: "text-error",
      };
    if (item.stockQuantity <= item.lowStockAlert * 0.5)
      return {
        label: "Critical",
        variant: "error" as const,
        color: "text-error",
      };
    return {
      label: "Low Stock",
      variant: "warning" as const,
      color: "text-amber-600",
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Low Stock Alert"
        subtitle="Items below minimum stock levels"
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
      title="Low Stock Alert"
      subtitle="Items below minimum stock levels"
      backPath="/reports"
      onExport={() => {
        /* TODO: Implement export */
      }}
      onPrint={() => {
        window.print();
      }}
      filters={
        <div className="flex flex-wrap items-center gap-4">
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => {
                setShowOutOfStock(e.target.checked);
              }}
              className="rounded border-slate-300"
            />
            Show only out of stock
          </label>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
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
              <p className="text-xl font-bold text-orange-700">
                {stats.criticalLow}
              </p>
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
              <p className="text-xl font-bold text-text-heading">
                {formatCurrency(stats.totalValue)}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Low Stock Table */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-text-heading">Low Stock Items</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-muted/50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Item
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      SKU
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Category
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Current Stock
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Min. Level
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Shortage
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Purchase Price
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Reorder Cost
                    </th>
                    <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">
                          No low stock items found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      const status = getStockStatus(item);
                      const shortage = item.lowStockAlert - item.stockQuantity;
                      const reorderCost = shortage * item.purchasePrice;

                      return (
                        <tr
                          key={item.itemId}
                          className={cn(
                            "hover:bg-muted/50",
                            item.stockQuantity === 0 && "bg-red-50/50"
                          )}
                        >
                          <td className="px-4 py-3 font-medium text-text-heading">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.category}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn("font-medium", status.color)}>
                              {item.stockQuantity} {item.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {item.lowStockAlert} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-error font-medium">
                            -{shortage} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(item.purchasePrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-text-heading">
                            {formatCurrency(reorderCost)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredData.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/50 font-medium">
                      <td colSpan={7} className="px-4 py-3 text-text-heading">
                        Total Reorder Cost
                      </td>
                      <td className="px-4 py-3 text-right text-text-heading">
                        {formatCurrency(
                          filteredData.reduce((sum, item) => {
                            const shortage =
                              item.lowStockAlert - item.stockQuantity;
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
