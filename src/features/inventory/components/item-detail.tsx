import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import { useItemHistory, type ItemHistoryAction } from "@/hooks/useItemHistory";
import {
  Package,
  Layers,
  Edit,
  Trash2,
  DollarSign,
  Box,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  RefreshCw,
  PackagePlus,
  Power,
  History,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Item } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface ItemDetailProps {
  item: Item | null;
  isLoading?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAdjustStock?: () => void;
  onViewHistory?: () => void;
  className?: string;
}

// ============================================================================
// INFO ITEM
// ============================================================================

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null | undefined;
  valueColor?: string;
}

function InfoItem({
  icon,
  label,
  value,
  valueColor,
}: InfoItemProps): React.ReactNode | null {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-100 rounded-lg shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p
          className={cn("text-sm font-medium", valueColor ?? "text-slate-900")}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ItemDetail({
  item,
  isLoading,
  onEdit,
  onDelete,
  onAdjustStock,
  onViewHistory,
  className,
}: ItemDetailProps): React.ReactNode {
  // Fetch item history
  const { history, isLoading: historyLoading } = useItemHistory(
    item?.id ?? null
  );

  const { formatCurrency } = useCurrency();

  const formatDateTime = (dateStr: string): string =>
    new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const getActionIcon = (action: ItemHistoryAction): React.ReactNode => {
    const iconMap: Record<ItemHistoryAction, React.ReactNode> = {
      created: <PlusCircle className="h-4 w-4 text-success" />,
      updated: <RefreshCw className="h-4 w-4 text-primary-600" />,
      stock_adjusted: <PackagePlus className="h-4 w-4 text-info" />,
      activated: <Power className="h-4 w-4 text-success" />,
      deactivated: <Power className="h-4 w-4 text-slate-400" />,
      deleted: <Trash2 className="h-4 w-4 text-error" />,
    };
    return iconMap[action] ?? <History className="h-4 w-4 text-slate-400" />;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <CardSkeleton bodyLines={5} />
        <CardSkeleton bodyLines={3} />
      </div>
    );
  }

  if (!item) {
    return (
      <EmptyState
        title="Select an item"
        description="Choose an item from the list to view details"
        className={className}
      />
    );
  }

  const isLowStock =
    item.stockQuantity <= item.lowStockAlert && item.stockQuantity > 0;
  const isOutOfStock = item.stockQuantity === 0;
  const profitMargin =
    item.purchasePrice > 0
      ? ((item.salePrice - item.purchasePrice) / item.salePrice) * 100
      : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Item Info Card */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  item.type === "service" ? "bg-purple-100" : "bg-primary-100"
                )}
              >
                {item.type === "service" ? (
                  <Layers className="h-5 w-5 text-purple-600" />
                ) : (
                  <Package className="h-5 w-5 text-primary-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {item.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={item.type === "service" ? "info" : "primary"}>
                    {item.type === "service" ? "Service" : "Product"}
                  </Badge>
                  {item.category && (
                    <Badge variant="secondary">{item.category}</Badge>
                  )}
                  {!item.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>
          }
          action={
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-error" />
              </Button>
            </div>
          }
        />

        <CardBody>
          {/* Stock Alert */}
          {item.type === "product" && (isLowStock || isOutOfStock) && (
            <div
              className={cn(
                "p-4 rounded-xl mb-6 flex items-center gap-3",
                isOutOfStock ? "bg-error-light" : "bg-warning-light"
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  isOutOfStock ? "text-error" : "text-warning"
                )}
              />
              <div>
                <p
                  className={cn(
                    "font-medium",
                    isOutOfStock ? "text-error" : "text-warning-dark"
                  )}
                >
                  {isOutOfStock ? "Out of Stock" : "Low Stock Alert"}
                </p>
                <p className="text-sm text-slate-600">
                  {isOutOfStock
                    ? "This item needs to be restocked"
                    : `Stock is below the alert level of ${item.lowStockAlert} ${item.unit}`}
                </p>
              </div>
            </div>
          )}

          {/* Pricing Display */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Sale Price</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(item.salePrice)}
              </p>
            </div>

            {item.purchasePrice > 0 && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Cost Price</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(item.purchasePrice)}
                </p>
              </div>
            )}

            {profitMargin !== null && (
              <div className="p-4 bg-success-light rounded-xl">
                <p className="text-xs text-success-dark mb-1">Profit Margin</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-success">
                    {profitMargin.toFixed(1)}%
                  </p>
                  {profitMargin >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-error" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stock Info (Products only) */}
          {item.type === "product" && (
            <div className="p-4 bg-slate-50 rounded-xl mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Stock</p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      isOutOfStock
                        ? "text-error"
                        : isLowStock
                          ? "text-warning"
                          : "text-slate-900"
                    )}
                  >
                    {item.stockQuantity} {item.unit}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={onAdjustStock}>
                  Adjust Stock
                </Button>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Low stock alert: {item.lowStockAlert} {item.unit}
                </p>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            {item.sku && (
              <InfoItem
                icon={<Box className="h-4 w-4 text-slate-500" />}
                label="SKU / Item Code"
                value={item.sku}
              />
            )}
            <InfoItem
              icon={<Package className="h-4 w-4 text-slate-500" />}
              label="Unit"
              value={item.unit}
            />
            {item.taxRate && (
              <InfoItem
                icon={<DollarSign className="h-4 w-4 text-slate-500" />}
                label="Tax Rate"
                value={`${item.taxRate}%`}
              />
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-2">Description</p>
              <p className="text-sm text-slate-700">{item.description}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Item History Card */}
      <Card>
        <CardHeader
          title="History"
          action={
            <Button variant="ghost" size="sm" onClick={onViewHistory}>
              <History className="h-4 w-4 mr-2" />
              Full Ledger
            </Button>
          }
        />
        <CardBody>
          {historyLoading ? (
            <div className="text-center text-slate-500 py-4">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              title="No history yet"
              description="Stock adjustments and changes will appear here"
              compact
            />
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className="p-2 bg-white rounded-lg shrink-0">
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {entry.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500">
                        {formatDateTime(entry.createdAt)}
                      </p>
                      {entry.userName && (
                        <p className="text-xs text-slate-400">
                          by {entry.userName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
