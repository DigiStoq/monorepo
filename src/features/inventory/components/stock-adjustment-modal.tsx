import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Input } from "@/components/ui";
import { Package, Plus, Minus, AlertTriangle } from "lucide-react";
import type { Item } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quantity: number) => Promise<void>;
  item: Item | null;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StockAdjustmentModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  isLoading,
}: StockAdjustmentModalProps): React.ReactNode | null {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState<number>(0);

  // Reset state when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen) {
      setAdjustmentType("add");
      setQuantity(0);
    }
  }, [isOpen, item?.id]);

  // Calculate new stock and validation
  const { newStock, isValid, errorMessage } = useMemo(() => {
    if (!item) {
      return { newStock: 0, isValid: false, errorMessage: "No item selected" };
    }

    const adjustedQuantity = adjustmentType === "add" ? quantity : -quantity;
    const newStock = item.stockQuantity + adjustedQuantity;

    if (quantity <= 0) {
      return {
        newStock,
        isValid: false,
        errorMessage: "Enter a quantity greater than 0",
      };
    }

    if (newStock < 0) {
      return {
        newStock,
        isValid: false,
        errorMessage: `Cannot remove ${quantity} - only ${item.stockQuantity} in stock`,
      };
    }

    return { newStock, isValid: true, errorMessage: null };
  }, [item, adjustmentType, quantity]);

  const handleSubmit = async (): Promise<void> => {
    if (!isValid || !item) return;

    const adjustedQuantity = adjustmentType === "add" ? quantity : -quantity;
    await onSubmit(adjustedQuantity);
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Adjust Stock"
      description={`Adjust stock for ${item.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!isValid}
            isLoading={isLoading}
          >
            Adjust Stock
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Current Stock Display */}
        <div className="p-4 bg-slate-50 rounded-lg text-center">
          <p className="text-sm text-slate-500 mb-1">Current Stock</p>
          <div className="flex items-center justify-center gap-2">
            <Package className="h-5 w-5 text-slate-400" />
            <span className="text-2xl font-bold text-slate-900">
              {item.stockQuantity}
            </span>
            <span className="text-slate-500">{item.unit}</span>
          </div>
        </div>

        {/* Adjustment Type Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setAdjustmentType("add");
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
              adjustmentType === "add"
                ? "border-success bg-success-light text-success"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Add Stock</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAdjustmentType("remove");
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
              adjustmentType === "remove"
                ? "border-error bg-error-light text-error"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <Minus className="h-5 w-5" />
            <span className="font-medium">Remove Stock</span>
          </button>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Quantity to {adjustmentType === "add" ? "Add" : "Remove"}
          </label>
          <Input
            type="number"
            min={0}
            value={quantity || ""}
            onChange={(e) => {
              setQuantity(parseInt(e.target.value) || 0);
            }}
            placeholder="Enter quantity"
            autoFocus
          />
        </div>

        {/* New Stock Preview */}
        {quantity > 0 && (
          <div
            className={`p-4 rounded-lg ${
              isValid
                ? adjustmentType === "add"
                  ? "bg-success-light border border-success/20"
                  : "bg-warning-light border border-warning/20"
                : "bg-error-light border border-error/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">New Stock Level</p>
                <p
                  className={`text-xl font-bold ${
                    isValid ? "text-slate-900" : "text-error"
                  }`}
                >
                  {newStock} {item.unit}
                </p>
              </div>
              <div
                className={`text-sm font-medium ${
                  adjustmentType === "add" ? "text-success" : "text-warning"
                }`}
              >
                {adjustmentType === "add" ? "+" : "-"}
                {quantity}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && quantity > 0 && (
          <div className="flex items-center gap-2 text-error text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
