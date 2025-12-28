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
import { Package, DollarSign, Layers, Box } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"basic" | "pricing" | "stock">(
    "basic"
  );

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
      });
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
      });
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
    });
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "pricing", label: "Pricing" },
    ...(selectedType === "product" ? [{ id: "stock", label: "Stock" }] : []),
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
              <Select
                label="Category"
                options={categoryOptions}
                value={watch("category") ?? ""}
                onChange={(value) => {
                  setValue("category", value);
                }}
              />

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
      </form>
    </Modal>
  );
}
