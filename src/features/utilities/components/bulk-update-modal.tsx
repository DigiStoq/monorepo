import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  Modal,
  Button,
  Select,
  Input,
  type SelectOption,
  Card,
  CardBody,
  Badge,
} from "@/components/ui";
import {
  Layers,
  DollarSign,
  Tag,
  Package,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { BulkUpdateType, BulkPriceUpdate, BulkUpdateResult } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: Array<{ id: string; name: string; salePrice?: number; purchasePrice?: number }>;
  categories: Array<{ id: string; name: string }>;
  onUpdate: (type: BulkUpdateType, config: unknown) => Promise<BulkUpdateResult>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const updateTypeOptions: Array<{ value: BulkUpdateType; label: string; icon: React.ReactNode; description: string }> = [
  {
    value: "price",
    label: "Update Prices",
    icon: <DollarSign className="h-5 w-5" />,
    description: "Increase or decrease prices by fixed amount or percentage",
  },
  {
    value: "category",
    label: "Change Category",
    icon: <Tag className="h-5 w-5" />,
    description: "Move items to a different category",
  },
  {
    value: "status",
    label: "Change Status",
    icon: <Layers className="h-5 w-5" />,
    description: "Activate or deactivate selected items",
  },
  {
    value: "stock",
    label: "Adjust Stock",
    icon: <Package className="h-5 w-5" />,
    description: "Set, add, or subtract stock quantities",
  },
];

const priceTypeOptions: SelectOption[] = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount ($)" },
];

const priceApplyOptions: SelectOption[] = [
  { value: "sale", label: "Sale Price Only" },
  { value: "purchase", label: "Purchase Price Only" },
  { value: "both", label: "Both Prices" },
];

const stockTypeOptions: SelectOption[] = [
  { value: "set", label: "Set to specific value" },
  { value: "add", label: "Add to current stock" },
  { value: "subtract", label: "Subtract from current stock" },
];

const statusOptions: SelectOption[] = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkUpdateModal({
  isOpen,
  onClose,
  selectedItems,
  categories,
  onUpdate,
}: BulkUpdateModalProps) {
  const [updateType, setUpdateType] = useState<BulkUpdateType>("price");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BulkUpdateResult | null>(null);

  // Price update state
  const [priceType, setPriceType] = useState<"percentage" | "fixed">("percentage");
  const [priceValue, setPriceValue] = useState<number>(0);
  const [priceApplyTo, setPriceApplyTo] = useState<"sale" | "purchase" | "both">("both");
  const [roundTo, setRoundTo] = useState<number>(2);

  // Category update state
  const [categoryId, setCategoryId] = useState<string>("");

  // Status update state
  const [isActive, setIsActive] = useState<string>("true");

  // Stock update state
  const [stockType, setStockType] = useState<"set" | "add" | "subtract">("add");
  const [stockValue, setStockValue] = useState<number>(0);

  const categoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const handleUpdate = async () => {
    setIsProcessing(true);
    try {
      let config: unknown;

      switch (updateType) {
        case "price":
          config = {
            type: priceType,
            value: priceValue,
            applyTo: priceApplyTo,
            roundTo,
          } as BulkPriceUpdate;
          break;
        case "category":
          config = {
            categoryId,
            categoryName: categories.find((c) => c.id === categoryId)?.name || "",
          };
          break;
        case "status":
          config = { isActive: isActive === "true" };
          break;
        case "stock":
          config = { type: stockType, value: stockValue };
          break;
      }

      const updateResult = await onUpdate(updateType, config);
      setResult(updateResult);
    } catch {
      setResult({
        success: false,
        updated: 0,
        failed: selectedItems.length,
        errors: [{ id: "", message: "Update failed" }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  const getPreviewText = () => {
    switch (updateType) {
      case "price":
        if (priceValue === 0) return null;
        const changeText = priceValue > 0 ? "increase" : "decrease";
        const valueText = priceType === "percentage"
          ? `${Math.abs(priceValue)}%`
          : `$${Math.abs(priceValue).toFixed(2)}`;
        const applyText = priceApplyTo === "both" ? "both prices" : `${priceApplyTo} price`;
        return `Will ${changeText} ${applyText} by ${valueText}`;
      case "category":
        const cat = categories.find((c) => c.id === categoryId);
        return cat ? `Will move items to "${cat.name}"` : null;
      case "status":
        return `Will ${isActive === "true" ? "activate" : "deactivate"} all selected items`;
      case "stock":
        if (stockValue === 0 && stockType !== "set") return null;
        if (stockType === "set") return `Will set stock to ${stockValue}`;
        return `Will ${stockType} ${stockValue} units ${stockType === "add" ? "to" : "from"} stock`;
      default:
        return null;
    }
  };

  const canUpdate = () => {
    switch (updateType) {
      case "price":
        return priceValue !== 0;
      case "category":
        return !!categoryId;
      case "status":
        return true;
      case "stock":
        return stockType === "set" || stockValue !== 0;
      default:
        return false;
    }
  };

  if (result) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Update Complete" size="sm">
        <div className="py-8 text-center space-y-6">
          {result.success ? (
            <>
              <div className="w-20 h-20 mx-auto bg-success-light rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Update Successful!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {result.updated} items updated successfully
                </p>
              </div>
              {result.failed > 0 && (
                <Badge variant="warning">{result.failed} items failed</Badge>
              )}
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto bg-error-light rounded-full flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Update Failed</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Could not update the selected items
                </p>
              </div>
            </>
          )}
          <Button onClick={handleClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Update" size="md">
      <div className="space-y-6 py-4">
        {/* Selected Items Count */}
        <Card className="bg-primary-50 border-primary">
          <CardBody className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{selectedItems.length} items selected</p>
              <p className="text-xs text-slate-500">
                {selectedItems.slice(0, 3).map((i) => i.name).join(", ")}
                {selectedItems.length > 3 && ` and ${selectedItems.length - 3} more`}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Update Type Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What do you want to update?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {updateTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUpdateType(opt.value)}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition-all",
                  updateType === opt.value
                    ? "border-primary bg-primary-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    updateType === opt.value ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                  )}>
                    {opt.icon}
                  </div>
                  <span className="font-medium text-slate-900">{opt.label}</span>
                </div>
                <p className="text-xs text-slate-500">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Update Configuration */}
        <div className="space-y-4">
          {updateType === "price" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Change Type
                  </label>
                  <Select
                    options={priceTypeOptions}
                    value={priceType}
                    onChange={(v) => setPriceType(v as "percentage" | "fixed")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Value (use negative to decrease)
                  </label>
                  <Input
                    type="number"
                    value={priceValue}
                    onChange={(e) => setPriceValue(parseFloat(e.target.value) || 0)}
                    placeholder={priceType === "percentage" ? "e.g., 10 or -10" : "e.g., 5.00 or -5.00"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Apply To
                  </label>
                  <Select
                    options={priceApplyOptions}
                    value={priceApplyTo}
                    onChange={(v) => setPriceApplyTo(v as "sale" | "purchase" | "both")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Round to decimal places
                  </label>
                  <Input
                    type="number"
                    value={roundTo}
                    onChange={(e) => setRoundTo(parseInt(e.target.value) || 0)}
                    min={0}
                    max={4}
                  />
                </div>
              </div>
            </>
          )}

          {updateType === "category" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Category
              </label>
              <Select
                options={categoryOptions}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Select a category"
              />
            </div>
          )}

          {updateType === "status" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Set Status
              </label>
              <Select
                options={statusOptions}
                value={isActive}
                onChange={setIsActive}
              />
            </div>
          )}

          {updateType === "stock" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Operation
                </label>
                <Select
                  options={stockTypeOptions}
                  value={stockType}
                  onChange={(v) => setStockType(v as "set" | "add" | "subtract")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {stockType === "set" ? "New Value" : "Quantity"}
                </label>
                <Input
                  type="number"
                  value={stockValue}
                  onChange={(e) => setStockValue(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {getPreviewText() && (
          <Card className="bg-warning-light border-warning">
            <CardBody className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="font-medium text-slate-900">Preview</p>
                <p className="text-sm text-slate-600">{getPreviewText()}</p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdate}
          disabled={!canUpdate() || isProcessing}
          leftIcon={
            isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Layers className="h-4 w-4" />
            )
          }
        >
          {isProcessing ? "Updating..." : `Update ${selectedItems.length} Items`}
        </Button>
      </div>
    </Modal>
  );
}
