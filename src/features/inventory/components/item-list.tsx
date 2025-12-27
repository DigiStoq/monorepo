import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardBody,
  SearchInput,
  Button,
  Badge,
  Select,
  type SelectOption,
} from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import { Plus, Package, AlertTriangle, Box, Layers } from "lucide-react";
import type { Item, ItemType, ItemFilters, Category } from "../types";

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
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

const typeOptions: SelectOption[] = [
  { value: "all", label: "All Types" },
  { value: "product", label: "Products" },
  { value: "service", label: "Services" },
];

const stockOptions: SelectOption[] = [
  { value: "all", label: "All Stock" },
  { value: "in-stock", label: "In Stock" },
  { value: "low-stock", label: "Low Stock" },
  { value: "out-of-stock", label: "Out of Stock" },
];

// ============================================================================
// ITEM CARD COMPONENT
// ============================================================================

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
}

function ItemCard({ item, onClick }: ItemCardProps) {
  const isLowStock = item.stockQuantity <= item.lowStockAlert && item.stockQuantity > 0;
  const isOutOfStock = item.stockQuantity === 0;

  const formatCurrency = (value: number) =>
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
              <Badge variant="error" size="sm">Out of Stock</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {item.sku && (
              <span className="flex items-center gap-1">
                SKU: {item.sku}
              </span>
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
  categories = [],
  isLoading,
  onItemClick,
  onAddItem,
  className,
}: ItemListProps) {
  const [filters, setFilters] = useState<ItemFilters>({
    search: "",
    type: "all",
    category: "all",
    stockStatus: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  // Category options
  const categoryOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [{ value: "all", label: "All Categories" }];
    categories.forEach((cat) => {
      options.push({ value: cat.id, label: cat.name });
    });
    return options;
  }, [categories]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items
      .filter((item) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesName = item.name.toLowerCase().includes(searchLower);
          const matchesSku = item.sku?.toLowerCase().includes(searchLower);
          const matchesCategory = item.category?.toLowerCase().includes(searchLower);
          if (!matchesName && !matchesSku && !matchesCategory) return false;
        }

        // Type filter
        if (filters.type !== "all" && item.type !== filters.type) {
          return false;
        }

        // Category filter
        if (filters.category !== "all" && item.category !== filters.category) {
          return false;
        }

        // Stock status filter
        if (filters.stockStatus !== "all" && item.type === "product") {
          if (filters.stockStatus === "out-of-stock" && item.stockQuantity > 0) {
            return false;
          }
          if (
            filters.stockStatus === "low-stock" &&
            (item.stockQuantity === 0 || item.stockQuantity > item.lowStockAlert)
          ) {
            return false;
          }
          if (
            filters.stockStatus === "in-stock" &&
            item.stockQuantity <= item.lowStockAlert
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (filters.sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "price":
            comparison = b.salePrice - a.salePrice;
            break;
          case "stock":
            comparison = b.stockQuantity - a.stockQuantity;
            break;
          case "recent":
            comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            break;
        }

        return filters.sortOrder === "desc" ? -comparison : comparison;
      });
  }, [items, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredItems.length) return { products: 0, services: 0, lowStock: 0 };

    return filteredItems.reduce(
      (acc, item) => {
        if (item.type === "product") {
          acc.products++;
          if (item.stockQuantity <= item.lowStockAlert) {
            acc.lowStock++;
          }
        } else {
          acc.services++;
        }
        return acc;
      },
      { products: 0, services: 0, lowStock: 0 }
    );
  }, [filteredItems]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-slate-200 rounded-lg animate-pulse" />
          <div className="w-32 h-10 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} hasHeader={false} bodyLines={2} />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          placeholder="Search items..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="flex-1"
        />

        <div className="flex gap-2 flex-wrap">
          <Select
            options={typeOptions}
            value={filters.type}
            onChange={(value) =>
              setFilters((f) => ({ ...f, type: value as ItemType | "all" }))
            }
            size="md"
          />

          {categories.length > 0 && (
            <Select
              options={categoryOptions}
              value={filters.category}
              onChange={(value) =>
                setFilters((f) => ({ ...f, category: value }))
              }
              size="md"
            />
          )}

          <Select
            options={stockOptions}
            value={filters.stockStatus}
            onChange={(value) =>
              setFilters((f) => ({
                ...f,
                stockStatus: value as ItemFilters["stockStatus"],
              }))
            }
            size="md"
          />

          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onAddItem}>
            Add Item
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card className="bg-primary-50 border-primary/20">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-primary-600" />
              <p className="text-xs text-primary-600 font-medium">Products</p>
            </div>
            <p className="text-lg font-bold text-primary-700">{totals.products}</p>
          </CardBody>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600" />
              <p className="text-xs text-purple-600 font-medium">Services</p>
            </div>
            <p className="text-lg font-bold text-purple-700">{totals.services}</p>
          </CardBody>
        </Card>

        <Card className="bg-warning-light border-warning/20">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-xs text-warning-dark font-medium">Low Stock</p>
            </div>
            <p className="text-lg font-bold text-warning-dark">{totals.lowStock}</p>
          </CardBody>
        </Card>
      </div>

      {/* Item List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          variant={filters.search ? "search" : "empty"}
          title={filters.search ? "No items found" : "No items yet"}
          description={
            filters.search
              ? "Try adjusting your search or filters"
              : "Add your first product or service to get started"
          }
          action={
            !filters.search && (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onAddItem}>
                Add Item
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
          </p>

          {filteredItems.map((item) => (
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
