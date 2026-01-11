import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { useItems } from "@/hooks/useItems";
import {
  Modal,
  Button,
  Select,
  Input,
  type SelectOption,
  Card,
  CardBody,
} from "@/components/ui";
import {
  Layers,
  DollarSign,
  Tag,
  Package,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import type {
  BulkUpdateType,
  BulkPriceUpdate,
  BulkUpdateResult,
} from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // selectedItems prop is removed/ignored in favor of internal selection
  selectedItems?: unknown[];
  categories: { id: string; name: string }[];
  onUpdate: (
    type: BulkUpdateType,
    selectedIds: string[],
    config: unknown
  ) => Promise<BulkUpdateResult>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const updateTypeOptions = [
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
  categories,
  onUpdate,
}: BulkUpdateModalProps): React.ReactNode {
  // Step state
  const [step, setStep] = useState<"select" | "configure" | "result">("select");

  // Selection state
  const { items, isLoading: isLoadingItems } = useItems();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Update Config State
  const [updateType, setUpdateType] = useState<BulkUpdateType>("price");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BulkUpdateResult | null>(null);

  // Price update state
  const [priceType, setPriceType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [priceValue, setPriceValue] = useState<number>(0);
  const [priceApplyTo, setPriceApplyTo] = useState<
    "sale" | "purchase" | "both"
  >("both");
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

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelection = (id: string): void => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleUpdate = async (): Promise<void> => {
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
            categoryName:
              categories.find((c) => c.id === categoryId)?.name ?? "",
          };
          break;
        case "status":
          config = { isActive: isActive === "true" };
          break;
        case "stock":
          config = { type: stockType, value: stockValue };
          break;
      }
      const ids = Array.from(selectedIds);
      const updateResult = await onUpdate(updateType, ids, config);
      setResult(updateResult);
      setStep("result");
    } catch {
      setResult({
        success: false,
        updated: 0,
        failed: selectedIds.size,
        errors: [{ id: "", message: "Update failed" }],
      });
      setStep("result");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = (): void => {
    setStep("select");
    setSelectedIds(new Set());
    setResult(null);
    onClose();
  };

  const canUpdate = (): boolean => {
    if (updateType === "price") return priceValue !== 0;
    if (updateType === "category") return !!categoryId;
    if (updateType === "stock") return stockType === "set" || stockValue !== 0;
    return true;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "select" ? "Select Items" : "Bulk Update"}
      size={step === "select" ? "lg" : "md"}
    >
      {/* STEP 1: SELECT */}
      {step === "select" && (
        <div className="flex flex-col h-[500px]">
          <div className="p-4 border-b space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search items by name or SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={
                    filteredItems.length > 0 &&
                    selectedIds.size === filteredItems.length
                  }
                  onChange={(e) => {
                    handleSelectAll(e.target.checked);
                  }}
                />
                <span>Select All ({filteredItems.length})</span>
              </div>
              <span>{selectedIds.size} selected</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingItems ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                Loading items...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                No items found
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer",
                    selectedIds.has(item.id) &&
                    "bg-primary/10 border-primary-100"
                  )}
                  onClick={() => {
                    toggleSelection(item.id);
                  }}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedIds.has(item.id)}
                    onChange={() => {
                      toggleSelection(item.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-text-heading">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      SKU: {item.sku || "-"} • Stock: {item.stockQuantity}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-text-heading">
                      ${item.salePrice}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t flex justify-between items-center">
            <span className="text-sm text-slate-500">
              {selectedIds.size} items selected
            </span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                disabled={selectedIds.size === 0}
                onClick={() => {
                  setStep("configure");
                }}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIGURE */}
      {step === "configure" && (
        <div className="py-4 space-y-6">
          <Card className="bg-primary/10 border-primary">
            <CardBody className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-text-heading">
                  {selectedIds.size} items selected
                </p>
                <p
                  className="text-xs text-slate-500 cursor-pointer hover:underline"
                  onClick={() => {
                    setStep("select");
                  }}
                >
                  Change selection
                </p>
              </div>
            </CardBody>
          </Card>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              What do you want to update?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {updateTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setUpdateType(opt.value as BulkUpdateType);
                  }}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all",
                    updateType === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={cn(
                        "p-1.5 rounded-lg",
                        updateType === opt.value
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {opt.icon}
                    </div>
                    <span className="font-medium text-text-heading">
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Config Fields */}
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
                      onChange={(v) => {
                        setPriceType(v as "percentage" | "fixed");
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Value
                    </label>
                    <Input
                      type="number"
                      value={priceValue || ""}
                      onChange={(e) => {
                        setPriceValue(parseFloat(e.target.value) || 0);
                      }}
                      placeholder="e.g., 10 or -10"
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
                      onChange={(v) => {
                        setPriceApplyTo(v as "sale" | "purchase" | "both");
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Round to
                    </label>
                    <Input
                      type="number"
                      value={roundTo}
                      onChange={(e) => {
                        setRoundTo(parseInt(e.target.value) || 0);
                      }}
                      min={0}
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
                    onChange={(v) => {
                      setStockType(v as "set" | "add" | "subtract");
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Value
                  </label>
                  <Input
                    type="number"
                    value={stockValue || ""}
                    onChange={(e) => {
                      setStockValue(parseInt(e.target.value) || 0);
                    }}
                    min={0}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setStep("select");
              }}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <Button
              onClick={() => {
                void handleUpdate();
              }}
              disabled={!canUpdate() || isProcessing}
              leftIcon={
                isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Layers className="h-4 w-4" />
                )
              }
            >
              {isProcessing ? "Updating..." : "Update Items"}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: RESULT */}
      {step === "result" && result && (
        <div className="py-8 text-center space-y-6">
          {result.success ? (
            <>
              <div className="w-20 h-20 mx-auto bg-success-light rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-heading">
                  Update Successful!
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {result.updated} items updated successfully
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto bg-error-light rounded-full flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-heading">
                  Update Failed
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {result.errors[0]?.message ?? "Could not update items"}
                </p>
              </div>
            </>
          )}
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
