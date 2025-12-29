import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { ItemList, ItemDetail, ItemFormModal, StockAdjustmentModal } from "./components";
import { useItems, useItemMutations } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import type { Item, ItemFormData } from "./types";

export function ItemsPage() {
  // Data from PowerSync
  const { items, isLoading: itemsLoading, error: itemsError } = useItems();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { createItem, updateItem, deleteItem, adjustStock } = useItemMutations();

  // State
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected item when data changes
  const currentSelectedItem = useMemo(() => {
    if (!selectedItem) return null;
    return items.find((i) => i.id === selectedItem.id) ?? null;
  }, [items, selectedItem]);

  // Handlers
  const handleAddItem = () => {
    setEditingItem(null);
    setIsFormModalOpen(true);
  };

  const handleEditItem = () => {
    if (currentSelectedItem) {
      setEditingItem(currentSelectedItem);
      setIsFormModalOpen(true);
    }
  };

  const handleDeleteItem = () => {
    if (currentSelectedItem) {
      setItemToDelete(currentSelectedItem);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      setIsSubmitting(true);
      try {
        await deleteItem(itemToDelete.id);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setSelectedItem(null);
      } catch (err) {
        console.error("Failed to delete item:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFormSubmit = async (data: ItemFormData) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data);
      } else {
        await createItem(data);
      }
      setIsFormModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error("Failed to save item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdjustStock = () => {
    if (currentSelectedItem) {
      setIsAdjustStockModalOpen(true);
    }
  };

  const handleAdjustStock = async (quantity: number) => {
    if (currentSelectedItem) {
      setIsSubmitting(true);
      try {
        await adjustStock(currentSelectedItem.id, quantity);
        setIsAdjustStockModalOpen(false);
      } catch (err) {
        console.error("Failed to adjust stock:", err);
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
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleAddItem}>
            Add Item
          </Button>
        }
      />

      {/* Content - Master-Detail Layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Item List (Master) */}
        <div className="w-[400px] shrink-0 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <ItemList
              items={items}
              categories={categories}
              onItemClick={setSelectedItem}
              onAddItem={handleAddItem}
              className="h-full"
            />
          )}
        </div>

        {/* Item Detail (Detail) */}
        <div className="flex-1 overflow-auto">
          <ItemDetail
            item={currentSelectedItem}
            onEdit={handleEditItem}
            onDelete={() => { handleDeleteItem(); }}
            onAdjustStock={handleOpenAdjustStock}
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
        onSubmit={(data) => { void handleFormSubmit(data); }}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader title="Delete Item" />
          <ModalBody>
            <p className="text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">{itemToDelete?.name}</span>?
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={() => { void handleConfirmDelete(); }} isLoading={isSubmitting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustStockModalOpen}
        onClose={() => { setIsAdjustStockModalOpen(false); }}
        onSubmit={handleAdjustStock}
        item={currentSelectedItem}
        isLoading={isSubmitting}
      />
    </div>
  );
}
