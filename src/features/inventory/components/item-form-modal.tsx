import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Modal,
  Button,
  Input,
  Textarea,
  Select,
  type SelectOption,
} from "@/components/ui";
import { Package, DollarSign, Layers, Box, Plus, ChevronDown, ChevronUp, Barcode, Calendar, MapPin, Tag, Shield } from "lucide-react";
import { useCategoryMutations } from "@/hooks/useCategories";
import type { Item, ItemFormData, ItemType, Category } from "../types";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100),
  sku: z.string().max(50).optional(),
  type: z.enum(["product", "service"]),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  unit: z.string().min(1, "Unit is required").max(20),
  salePrice: z.number().min(0, "Sale price must be positive"),
  purchasePrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  openingStock: z.number().min(0).optional(),
  lowStockAlert: z.number().min(0).optional(),
  // Optional additional fields
  batchNumber: z.string().max(50).optional(),
  expiryDate: z.string().optional(),
  manufactureDate: z.string().optional(),
  barcode: z.string().max(50).optional(),
  hsnCode: z.string().max(20).optional(),
  warrantyDays: z.number().min(0).optional(),
  brand: z.string().max(100).optional(),
  modelNumber: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
});

type ItemSchemaType = z.infer<typeof itemSchema>;

// ============================================================================
// TYPES
// ============================================================================

export interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ItemFormData) => void;
  item?: Item | null;
  categories?: Category[];
  isLoading?: boolean;
}

// ============================================================================
// OPTIONS
// ============================================================================

const typeOptions: SelectOption[] = [
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
];

const unitOptions: SelectOption[] = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "lbs", label: "Pounds (lbs)" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "unit", label: "Unit" },
  { value: "hr", label: "Hour (hr)" },
  { value: "day", label: "Day" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ItemFormModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  categories = [],
  isLoading,
}: ItemFormModalProps) {
  const isEditing = Boolean(item);
  const [activeTab, setActiveTab] = useState<"basic" | "pricing" | "stock" | "additional">(
    "basic"
  );
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  // Category creation state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const { createCategory } = useCategoryMutations();

  // Category options
  const categoryOptions: SelectOption[] = [
    { value: "", label: "No Category" },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemSchemaType>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      sku: "",
      type: "product",
      description: "",
      category: "",
      unit: "pcs",
      salePrice: 0,
      purchasePrice: 0,
      taxRate: 0,
      openingStock: 0,
      lowStockAlert: 5,
      // Optional additional fields
      batchNumber: "",
      expiryDate: "",
      manufactureDate: "",
      barcode: "",
      hsnCode: "",
      warrantyDays: undefined,
      brand: "",
      modelNumber: "",
      location: "",
    },
  });

  const selectedType = watch("type");

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        sku: item.sku,
        type: item.type,
        description: item.description ?? "",
        category: item.category ?? "",
        unit: item.unit,
        salePrice: item.salePrice,
        purchasePrice: item.purchasePrice,
        taxRate: item.taxRate ?? 0,
        openingStock: item.stockQuantity,
        lowStockAlert: item.lowStockAlert,
        // Optional additional fields
        batchNumber: item.batchNumber ?? "",
        expiryDate: item.expiryDate ?? "",
        manufactureDate: item.manufactureDate ?? "",
        barcode: item.barcode ?? "",
        hsnCode: item.hsnCode ?? "",
        warrantyDays: item.warrantyDays,
        brand: item.brand ?? "",
        modelNumber: item.modelNumber ?? "",
        location: item.location ?? "",
      });
      // Show additional fields section if any field has a value
      const hasAdditionalData = item.batchNumber || item.expiryDate || item.manufactureDate ||
        item.barcode || item.hsnCode || item.warrantyDays || item.brand || item.modelNumber || item.location;
      setShowAdditionalFields(Boolean(hasAdditionalData));
    } else {
      reset({
        name: "",
        sku: "",
        type: "product",
        description: "",
        category: "",
        unit: "pcs",
        salePrice: 0,
        purchasePrice: 0,
        taxRate: 0,
        openingStock: 0,
        lowStockAlert: 5,
        // Optional additional fields
        batchNumber: "",
        expiryDate: "",
        manufactureDate: "",
        barcode: "",
        hsnCode: "",
        warrantyDays: undefined,
        brand: "",
        modelNumber: "",
        location: "",
      });
      setShowAdditionalFields(false);
    }
    setActiveTab("basic");
  }, [item, reset, isOpen]);

  const handleFormSubmit = (data: ItemSchemaType) => {
    onSubmit({
      ...data,
      sku: data.sku ?? undefined,
      description: data.description ?? undefined,
      category: data.category ?? undefined,
      purchasePrice: data.purchasePrice ?? undefined,
      taxRate: data.taxRate ?? undefined,
      openingStock: data.openingStock ?? undefined,
      lowStockAlert: data.lowStockAlert ?? undefined,
      // Optional additional fields
      batchNumber: data.batchNumber ?? undefined,
      expiryDate: data.expiryDate ?? undefined,
      manufactureDate: data.manufactureDate ?? undefined,
      barcode: data.barcode ?? undefined,
      hsnCode: data.hsnCode ?? undefined,
      warrantyDays: data.warrantyDays ?? undefined,
      brand: data.brand ?? undefined,
      modelNumber: data.modelNumber ?? undefined,
      location: data.location ?? undefined,
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    try {
      const newCategoryId = await createCategory({ name: newCategoryName.trim() });
      setValue("category", newCategoryId);
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "pricing", label: "Pricing" },
    ...(selectedType === "product" ? [{ id: "stock", label: "Stock" }] : []),
    { id: "additional", label: "More Details" },
  ] as const;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={isEditing ? "Edit Item" : "Add New Item"}
      description={
        isEditing ? `Update ${item?.name}` : "Add a product or service"
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSubmit(handleFormSubmit)();
            }}
            isLoading={isLoading}
          >
            {isEditing ? "Update Item" : "Add Item"}
          </Button>
        </>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
            }}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form className="space-y-4">
        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <>
            <Input
              label="Item Name"
              placeholder="Enter item name"
              leftIcon={<Package className="h-4 w-4" />}
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Item Type"
                options={typeOptions}
                value={selectedType}
                onChange={(value) => {
                  setValue("type", value as ItemType);
                }}
              />

              <Input
                label="SKU / Item Code"
                placeholder="Optional"
                error={errors.sku?.message}
                {...register("sku")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsAddCategoryOpen(true); }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                <Select
                  options={categoryOptions}
                  value={watch("category") ?? ""}
                  onChange={(value) => {
                    setValue("category", value);
                  }}
                  placeholder="Select category"
                />
              </div>

              <Select
                label="Unit"
                options={unitOptions}
                value={watch("unit")}
                onChange={(value) => {
                  setValue("unit", value);
                }}
              />
            </div>

            <Textarea
              label="Description"
              placeholder="Optional description..."
              rows={3}
              error={errors.description?.message}
              {...register("description")}
            />
          </>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Sale Price"
                type="number"
                step="0.01"
                placeholder="0.00"
                leftIcon={<DollarSign className="h-4 w-4" />}
                error={errors.salePrice?.message}
                {...register("salePrice", { valueAsNumber: true })}
              />

              <Input
                label="Purchase Price"
                type="number"
                step="0.01"
                placeholder="0.00"
                leftIcon={<DollarSign className="h-4 w-4" />}
                helperText="Cost price for inventory valuation"
                error={errors.purchasePrice?.message}
                {...register("purchasePrice", { valueAsNumber: true })}
              />
            </div>

            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.1"
              placeholder="0"
              helperText="Default tax rate for this item"
              error={errors.taxRate?.message}
              {...register("taxRate", { valueAsNumber: true })}
            />

            {/* Profit Preview */}
            {(() => {
              const salePrice = watch("salePrice");
              const purchasePrice = watch("purchasePrice") ?? 0;
              if (salePrice > 0 && purchasePrice > 0) {
                const profit = salePrice - purchasePrice;
                const margin = (profit / salePrice) * 100;
                return (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">Profit Margin</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-lg font-semibold text-success">
                          ${profit.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Per unit profit
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {margin.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-500">Margin</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </>
        )}

        {/* Stock Tab (Products only) */}
        {activeTab === "stock" && selectedType === "product" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {!isEditing && (
                <Input
                  label="Opening Stock"
                  type="number"
                  placeholder="0"
                  leftIcon={<Box className="h-4 w-4" />}
                  helperText="Initial stock quantity"
                  error={errors.openingStock?.message}
                  {...register("openingStock", { valueAsNumber: true })}
                />
              )}

              <Input
                label="Low Stock Alert"
                type="number"
                placeholder="5"
                leftIcon={<Layers className="h-4 w-4" />}
                helperText="Alert when stock falls below"
                error={errors.lowStockAlert?.message}
                {...register("lowStockAlert", { valueAsNumber: true })}
              />
            </div>

            {isEditing && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">Current Stock</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {item?.stockQuantity} {item?.unit}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust stock through stock adjustment or purchase/sale
                  transactions
                </p>
              </div>
            )}
          </>
        )}

        {/* Additional Details Tab */}
        {activeTab === "additional" && (
          <>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => { setShowAdditionalFields(!showAdditionalFields); }}
                className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {showAdditionalFields ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {showAdditionalFields ? "Hide optional fields" : "Show optional fields"}
              </button>
              <p className="text-xs text-slate-500 mt-1">
                Add batch tracking, expiry dates, barcodes, and more
              </p>
            </div>

            {showAdditionalFields && (
              <div className="space-y-4">
                {/* Batch & Tracking */}
                <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Batch & Tracking
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Batch Number"
                      placeholder="e.g., BATCH-001"
                      helperText="Lot or batch identifier"
                      error={errors.batchNumber?.message}
                      {...register("batchNumber")}
                    />
                    <Input
                      label="Barcode / UPC"
                      placeholder="e.g., 123456789012"
                      leftIcon={<Barcode className="h-4 w-4" />}
                      error={errors.barcode?.message}
                      {...register("barcode")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="HSN / SAC Code"
                      placeholder="e.g., 8471"
                      helperText="Tax classification code"
                      error={errors.hsnCode?.message}
                      {...register("hsnCode")}
                    />
                    <Input
                      label="Location"
                      placeholder="e.g., Warehouse A, Shelf 3"
                      leftIcon={<MapPin className="h-4 w-4" />}
                      helperText="Storage location"
                      error={errors.location?.message}
                      {...register("location")}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Dates
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Manufacture Date"
                      type="date"
                      error={errors.manufactureDate?.message}
                      {...register("manufactureDate")}
                    />
                    <Input
                      label="Expiry Date"
                      type="date"
                      error={errors.expiryDate?.message}
                      {...register("expiryDate")}
                    />
                  </div>
                </div>

                {/* Brand & Model */}
                <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Brand & Model
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Brand"
                      placeholder="e.g., Samsung, Apple"
                      error={errors.brand?.message}
                      {...register("brand")}
                    />
                    <Input
                      label="Model Number"
                      placeholder="e.g., SM-G950F"
                      error={errors.modelNumber?.message}
                      {...register("modelNumber")}
                    />
                  </div>
                  <Input
                    label="Warranty (Days)"
                    type="number"
                    placeholder="e.g., 365"
                    leftIcon={<Shield className="h-4 w-4" />}
                    helperText="Warranty period in days"
                    error={errors.warrantyDays?.message}
                    {...register("warrantyDays", { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}

            {!showAdditionalFields && (
              <div className="text-center py-8 text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No additional details configured</p>
                <p className="text-xs mt-1">Click above to add optional fields like batch number, expiry date, etc.</p>
              </div>
            )}
          </>
        )}
      </form>

      {/* Add Category Mini Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => {
              setIsAddCategoryOpen(false);
              setNewCategoryName("");
            }}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Add New Category
            </h3>
            <Input
              label="Category Name"
              placeholder="e.g., Electronics, Clothing"
              value={newCategoryName}
              onChange={(e) => { setNewCategoryName(e.target.value); }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreateCategory();
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddCategoryOpen(false);
                  setNewCategoryName("");
                }}
                disabled={isCreatingCategory}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => { void handleCreateCategory(); }}
                disabled={!newCategoryName.trim()}
                isLoading={isCreatingCategory}
              >
                Add Category
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
