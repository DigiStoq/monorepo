import { cn } from "@/lib/cn";
import { Button, Badge } from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import { Plus, Package, AlertTriangle, Layers } from "lucide-react";
import type { Item, Category } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface ItemListProps {
  items: Item[] | null;
  categories?: Category[];
  isLoading?: boolean;
  onItemClick?: (item: Item) => void;
  onAddItem?: () => void;
  className?: string;
  hasActiveFilters?: boolean;
}

// ============================================================================
// ITEM CARD COMPONENT
// ============================================================================

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
}

function ItemCard({ item, onClick }: ItemCardProps): React.ReactNode {
  const isLowStock =
    item.stockQuantity <= item.lowStockAlert && item.stockQuantity > 0;
  const isOutOfStock = item.stockQuantity === 0;

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 bg-white rounded-lg border border-slate-200",
        "hover:border-primary-300 hover:shadow-soft",
        "transition-all duration-200 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Item Icon */}
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            item.type === "service" ? "bg-purple-100" : "bg-primary-100"
          )}
        >
          {item.type === "service" ? (
            <Layers className="h-5 w-5 text-purple-600" />
          ) : (
            <Package className="h-5 w-5 text-primary-600" />
          )}
        </div>

        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">
              {item.name}
            </h3>
            {isLowStock && (
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            )}
            {isOutOfStock && (
              <Badge variant="error" size="sm">
                Out of Stock
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {item.sku && (
              <span className="flex items-center gap-1">SKU: {item.sku}</span>
            )}
            {item.category && (
              <Badge variant="secondary" size="sm">
                {item.category}
              </Badge>
            )}
          </div>
        </div>

        {/* Price & Stock */}
        <div className="text-right shrink-0">
          <p className="font-semibold text-slate-900">
            {formatCurrency(item.salePrice)}
          </p>
          {item.type === "product" && (
            <p
              className={cn(
                "text-sm",
                isOutOfStock
                  ? "text-error"
                  : isLowStock
                    ? "text-warning"
                    : "text-slate-500"
              )}
            >
              {item.stockQuantity} {item.unit}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ItemList({
  items,
  isLoading,
  onItemClick,
  onAddItem,
  className,
  hasActiveFilters = false,
}: ItemListProps): React.ReactNode {
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} hasHeader={false} bodyLines={2} />
        ))}
      </div>
    );
  }

  // Items are already filtered by parent
  const displayItems = items ?? [];

  return (
    <div className={className}>
      {/* Item List */}
      {displayItems.length === 0 ? (
        <EmptyState
          variant={hasActiveFilters ? "search" : "empty"}
          title={hasActiveFilters ? "No items found" : "No items yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Add your first product or service to get started"
          }
          action={
            !hasActiveFilters && (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onAddItem}
              >
                Add Item
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2 px-1">
            {displayItems.length} {displayItems.length === 1 ? "item" : "items"}
          </p>

          {displayItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
