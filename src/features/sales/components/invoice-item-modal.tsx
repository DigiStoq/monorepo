import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  Input,
  Select,
  type SelectOption,
} from "@/components/ui";
import { useCurrency } from "@/hooks/useCurrency";
import type { Item } from "@/features/inventory";
import { Percent, Hash, Tag } from "lucide-react";

// Matches the internal LineItem type in InvoiceForm
export interface InvoiceLineItem {
  id: string;
  itemId: string;
  itemName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  mrp: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
}

interface InvoiceItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InvoiceLineItem) => void;
  item?: InvoiceLineItem; // If editing
  items: Item[]; // Inventory items
  discountType?: "percent" | "amount"; // To match parent form preference
  defaultTaxRate?: number;
}

export function InvoiceItemModal({
  isOpen,
  onClose,
  onSave,
  item,
  items,
  discountType = "percent",
  defaultTaxRate = 0,
}: InvoiceItemModalProps): React.ReactNode {
  // State
  const [itemId, setItemId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [mrp, setMrp] = useState(0);
  const [discountInput, setDiscountInput] = useState(0); // Can be % or $ based on mode
  const [taxPercent, setTaxPercent] = useState(defaultTaxRate);

  // Computed
  const selectedInventoryItem = useMemo(
    () => items.find((i) => i.id === itemId),
    [items, itemId]
  );
  const unit = selectedInventoryItem?.unit ?? "pcs";

  // Effect to populate form on open/edit
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setItemId(item.itemId);
        setBatchNumber(item.batchNumber);
        setQuantity(item.quantity);
        setUnitPrice(item.unitPrice);
        setMrp(item.mrp);
        setTaxPercent(item.taxPercent);

        // Convert stored % back to input value if needed
        if (discountType === "amount") {
          const total = item.quantity * item.unitPrice;
          setDiscountInput(total * (item.discountPercent / 100));
        } else {
          setDiscountInput(item.discountPercent);
        }
      } else {
        // Reset for new item
        setItemId("");
        setBatchNumber("");
        setQuantity(1);
        setUnitPrice(0);
        setMrp(0);
        setDiscountInput(0);
        setTaxPercent(defaultTaxRate);
      }
    }
  }, [isOpen, item, defaultTaxRate, discountType]);

  // When item selection changes
  const handleItemChange = (newItemId: string): void => {
    setItemId(newItemId);
    const selected = items.find((i) => i.id === newItemId);
    if (selected) {
      setUnitPrice(selected.salePrice);
      setMrp(selected.mrp ?? selected.salePrice);
      setTaxPercent(selected.taxRate ?? defaultTaxRate);
      setBatchNumber(selected.batchNumber ?? "");
    }
  };

  // Calculations
  const subtotal = quantity * unitPrice;

  // Calculate discount % for storage
  const effectiveDiscountPercent = useMemo(() => {
    if (discountType === "percent") return discountInput;
    if (subtotal === 0) return 0;
    return (discountInput / subtotal) * 100;
  }, [discountType, discountInput, subtotal]);

  const discountAmount = subtotal * (effectiveDiscountPercent / 100);
  const taxable = subtotal - discountAmount;
  const taxAmount = taxable * (taxPercent / 100);
  const totalAmount = taxable + taxAmount;

  const { formatCurrency } = useCurrency();

  const handleSave = (): void => {
    onSave({
      id: item?.id ?? `line-${Date.now()}`,
      itemId,
      itemName: selectedInventoryItem?.name ?? item?.itemName ?? "",
      batchNumber,
      quantity,
      unit,
      unitPrice,
      mrp,
      discountPercent: effectiveDiscountPercent,
      taxPercent,
      amount: totalAmount,
    });
    onClose();
  };

  const itemOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "Select an item..." },
      ...items.map((i) => ({
        value: i.id,
        label: `${i.name} - ${formatCurrency(i.salePrice)}`,
      })),
    ],
    [items, formatCurrency]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? "Edit Item" : "Add Item"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!itemId || quantity <= 0}>
            {item ? "Update Item" : "Add Item"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Item Select */}
        <div>
          <Select
            label="Item"
            required
            options={itemOptions}
            value={itemId}
            onChange={handleItemChange}
            placeholder="Search for an item..."
            className="w-full"
            searchable
          />
        </div>

        {/* Row 1: Qty, Price, Unit */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            type="number"
            label="Quantity"
            required
            min={1}
            value={quantity}
            onChange={(e) => {
              setQuantity(parseFloat(e.target.value) || 0);
            }}
          />
          <Input
            type="number"
            label="Unit Price"
            required
            min={0}
            value={unitPrice}
            onChange={(e) => {
              setUnitPrice(parseFloat(e.target.value) || 0);
            }}
            leftIcon={
              <span className="text-sm font-medium text-slate-500">$</span>
            }
          />
          <Input
            label="Unit"
            value={unit}
            disabled
            readOnly
            className="bg-slate-50"
          />
        </div>

        {/* Row 2: MRP, Batch */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="MRP"
            min={0}
            value={mrp}
            onChange={(e) => {
              setMrp(parseFloat(e.target.value) || 0);
            }}
            leftIcon={<Tag className="h-4 w-4 text-slate-400" />}
          />
          <Input
            label="Batch Number"
            value={batchNumber}
            onChange={(e) => {
              setBatchNumber(e.target.value);
            }}
            leftIcon={<Hash className="h-4 w-4 text-slate-400" />}
            placeholder="Batch-001"
          />
        </div>

        {/* Row 3: Discount, Tax */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label={discountType === "percent" ? "Discount (%)" : "Discount ($)"}
            min={0}
            value={discountInput}
            onChange={(e) => {
              setDiscountInput(parseFloat(e.target.value) || 0);
            }}
            leftIcon={
              discountType === "percent" ? (
                <Percent className="h-4 w-4 text-slate-400" />
              ) : (
                <span className="text-sm text-slate-500">$</span>
              )
            }
          />
          <Input
            type="number"
            label="Tax (%)"
            min={0}
            value={taxPercent}
            onChange={(e) => {
              setTaxPercent(parseFloat(e.target.value) || 0);
            }}
            leftIcon={<Percent className="h-4 w-4 text-slate-400" />}
          />
        </div>

        {/* Summary Box */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Discount</span>
            <span className="text-green-600">
              -{formatCurrency(discountAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Tax</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
