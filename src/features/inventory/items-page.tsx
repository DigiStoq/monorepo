import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import { Button, ConfirmDeleteDialog } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import {
  ItemList,
  ItemDetail,
  ItemFormModal,
  StockAdjustmentModal,
  StockHistoryModal,
} from "./components";
import { useItems, useItemMutations } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import type { Item, ItemFormData, ItemFilters, ItemType } from "./types";
import { SearchInput, Select, type SelectOption } from "@/components/ui";
import { Box, Layers, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function ItemsPage(): React.ReactNode {
  // Data from PowerSync
  const { items, isLoading: itemsLoading, error: itemsError } = useItems();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { createItem, updateItem, deleteItem, adjustStock } =
    useItemMutations();

  // State
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<ItemFilters>({
    search: "",
    type: "all",
    category: "all",
    stockStatus: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  // Filter Options
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

  const categoryOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [{ value: "all", label: "All Categories" }];
    categories.forEach((cat) => {
      options.push({ value: cat.id, label: cat.name });
    });
    return options;
  }, [categories]);

  // Filter Logic
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesName = item.name.toLowerCase().includes(searchLower);
          const matchesSku = item.sku.toLowerCase().includes(searchLower);
          const matchesCategory = item.category
            ?.toLowerCase()
            .includes(searchLower);
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
          if (
            filters.stockStatus === "out-of-stock" &&
            item.stockQuantity > 0
          ) {
            return false;
          }
          if (
            filters.stockStatus === "low-stock" &&
            (item.stockQuantity === 0 ||
              item.stockQuantity > item.lowStockAlert)
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
            comparison =
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            break;
        }

        return filters.sortOrder === "desc" ? -comparison : comparison;
      });
  }, [items, filters]);

  // Totals Calculation
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

  // Update selected item when data changes
  const currentSelectedItem = useMemo(() => {
    if (!selectedItem) return null;
    return items.find((i) => i.id === selectedItem.id) ?? null;
  }, [items, selectedItem]);

  // Handlers
  const handleAddItem = (): void => {
    setEditingItem(null);
    setIsFormModalOpen(true);
  };

  const handleEditItem = (): void => {
    if (currentSelectedItem) {
      setEditingItem(currentSelectedItem);
      setIsFormModalOpen(true);
    }
  };

  const handleDeleteItem = (): void => {
    if (currentSelectedItem) {
      setItemToDelete(currentSelectedItem);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (itemToDelete) {
      setIsSubmitting(true);
      try {
        await deleteItem(itemToDelete.id);
        toast.success("Item deleted successfully");
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setSelectedItem(null);
      } catch (err) {
        console.error("Failed to delete item:", err);
        toast.error("Failed to delete item");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFormSubmit = async (data: ItemFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data);
        toast.success("Item updated successfully");
      } else {
        await createItem(data);
        toast.success("Item created successfully");
      }
      setIsFormModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error("Failed to save item:", err);
      toast.error("Failed to save item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdjustStock = (): void => {
    if (currentSelectedItem) {
      setIsAdjustStockModalOpen(true);
    }
  };

  const handleAdjustStock = async (quantity: number): Promise<void> => {
    if (currentSelectedItem) {
      setIsSubmitting(true);
      try {
        await adjustStock(currentSelectedItem.id, quantity);
        toast.success("Stock adjusted successfully");
        setIsAdjustStockModalOpen(false);
      } catch (err) {
        console.error("Failed to adjust stock:", err);
        toast.error("Failed to adjust stock");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isLoading = itemsLoading || categoriesLoading;

  if (itemsError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load items</p>
          <p className="text-slate-500 text-sm">{itemsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <PageHeader
        title="Items"
        description="Manage your products and services"
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleAddItem}
          >
            Add Item
          </Button>
        }
      />

      {/* Filters Header - Full Width */}
      <div className="bg-card border-b border-border-primary px-6 py-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <SearchInput
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
              }}
              className="w-full sm:w-72"
            />

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Select
                options={typeOptions}
                value={filters.type}
                onChange={(value) => {
                  setFilters((f) => ({
                    ...f,
                    type: value as ItemType | "all",
                  }));
                }}
                size="md"
                className="min-w-[120px]"
              />

              {categories.length > 0 && (
                <Select
                  options={categoryOptions}
                  value={filters.category}
                  onChange={(value) => {
                    setFilters((f) => ({ ...f, category: value }));
                  }}
                  size="md"
                  className="min-w-[140px]"
                />
              )}

              <Select
                options={stockOptions}
                value={filters.stockStatus}
                onChange={(value) => {
                  setFilters((f) => ({
                    ...f,
                    stockStatus: value as ItemFilters["stockStatus"],
                  }));
                }}
                size="md"
                className="min-w-[120px]"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2 bg-primary-50 rounded-lg border border-primary/10 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <Box className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-primary-600 font-medium uppercase tracking-wider">
                  Products
                </p>
                <p className="text-lg font-bold text-primary-700 leading-none">
                  {totals.products}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-purple-50 rounded-lg border border-purple-100 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <Layers className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">
                  Services
                </p>
                <p className="text-lg font-bold text-purple-700 leading-none">
                  {totals.services}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-warning-light rounded-lg border border-warning/20 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-warning-dark font-medium uppercase tracking-wider">
                  Low Stock
                </p>
                <p className="text-lg font-bold text-warning-dark leading-none">
                  {totals.lowStock}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Master-Detail Layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden bg-slate-50">
        {/* Item List (Master) */}
        <div className="w-full max-w-[400px] shrink-0 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <ItemList
              items={filteredItems}
              categories={categories}
              onItemClick={setSelectedItem}
              onAddItem={handleAddItem}
              className="h-full overflow-auto pr-1"
              hasActiveFilters={
                !!filters.search ||
                filters.type !== "all" ||
                filters.category !== "all" ||
                filters.stockStatus !== "all"
              }
            />
          )}
        </div>

        {/* Item Detail (Detail) */}
        <div className="flex-1 overflow-auto">
          <ItemDetail
            item={currentSelectedItem}
            onEdit={handleEditItem}
            onDelete={() => {
              handleDeleteItem();
            }}
            onAdjustStock={handleOpenAdjustStock}
            onViewHistory={() => {
              setIsHistoryModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      <ItemFormModal
        isOpen={isFormModalOpen}
        item={editingItem}
        categories={categories}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={(data) => {
          void handleFormSubmit(data);
        }}
        isLoading={isSubmitting}
        checkSkuUnique={(sku, excludeId) => {
          return !items.some(
            (i) =>
              i.sku.toLowerCase() === sku.toLowerCase() && i.id !== excludeId
          );
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title="Delete Item"
        itemName={itemToDelete?.name ?? ""}
        itemType={itemToDelete?.type === "service" ? "Service" : "Product"}
        warningMessage={
          itemToDelete?.stockQuantity !== 0
            ? `This item has ${itemToDelete?.stockQuantity ?? 0} units in stock. Deleting will remove all stock and transaction history.`
            : "This will permanently delete this item."
        }
        isLoading={isSubmitting}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustStockModalOpen}
        onClose={() => {
          setIsAdjustStockModalOpen(false);
        }}
        onSubmit={handleAdjustStock}
        item={currentSelectedItem}
        isLoading={isSubmitting}
      />

      {/* Stock History Modal */}
      {currentSelectedItem && (
        <StockHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
          }}
          itemId={currentSelectedItem.id}
          itemName={currentSelectedItem.name}
        />
      )}
    </div>
  );
}
