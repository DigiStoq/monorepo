import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  type SelectOption,
} from "@/components/ui";
import { Plus, Trash2, Edit2, RotateCcw } from "lucide-react";
import { InvoiceItemModal, type InvoiceLineItem } from "./invoice-item-modal";
import { useCurrency } from "@/hooks/useCurrency";
import type {
  CreditNoteFormData,
  CreditNoteReason,
  SaleInvoiceItemFormData,
} from "../types";
import type { Customer } from "@/features/customers";
import type { Item } from "@/features/inventory";

// ============================================================================
// TYPES
// ============================================================================

export interface CreditNoteFormProps {
  customers: Customer[];
  items: Item[];
  initialData?: Partial<CreditNoteFormData>;
  isLoading?: boolean;
  onSubmit: (data: CreditNoteFormData) => void;
  onCancel: () => void;
  className?: string;
}

// Use shared type
type LineItem = InvoiceLineItem;

// ============================================================================
// CONSTANTS
// ============================================================================

const reasonOptions: SelectOption[] = [
  { value: "return", label: "Product Return" },
  { value: "discount", label: "Post-Sale Discount" },
  { value: "error", label: "Invoice Error Correction" },
  { value: "other", label: "Other" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CreditNoteForm({
  customers,
  items,
  initialData,
  isLoading,
  onSubmit,
  onCancel,
  className,
}: CreditNoteFormProps): React.ReactNode {
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);

  const [customerId, setCustomerId] = useState<string>(
    initialData?.customerId ?? ""
  );
  const [date, setDate] = useState<string>(initialData?.date ?? defaultDate);
  const [reason, setReason] = useState<CreditNoteReason>(
    initialData?.reason ?? "return"
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | undefined>(
    undefined
  );

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Customer options
  const customerOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "Select a customer..." },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [customers]);

  // Modal Handlers
  const handleAddItemClick = (): void => {
    setEditingItem(undefined);
    setIsItemModalOpen(true);
  };

  const handleEditItemClick = (item: LineItem): void => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (item: LineItem): void => {
    setLineItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) => (i.id === item.id ? item : i));
      }
      return [...prev, item];
    });
  };

  // Remove line item
  const handleRemoveLineItem = (id: string): void => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const taxAmount = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = itemSubtotal * (item.discountPercent / 100);
      return sum + (itemSubtotal - itemDiscount) * (item.taxPercent / 100);
    }, 0);

    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  }, [lineItems]);

  const { formatCurrency } = useCurrency();

  // Handle submit
  const handleSubmit = (): void => {
    if (!customerId || lineItems.length === 0) return;

    const formData: CreditNoteFormData = {
      customerId,
      date,
      reason,
      items: lineItems.map(
        (item): SaleInvoiceItemFormData => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || undefined,
          taxPercent: item.taxPercent || undefined,
          batchNumber: item.batchNumber || undefined,
          mrp: item.mrp || undefined,
        })
      ),
      notes: notes || undefined,
    };

    onSubmit(formData);
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary-600" />
            New Credit Note
          </h1>
          <p className="text-slate-500">
            Record a return or credit for a customer
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!customerId || lineItems.length === 0}
            isLoading={isLoading}
          >
            Create Credit Note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left Column - Details */}
        <div className="col-span-2 space-y-4">
          {/* Customer & Reason */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Customer"
                    required
                    options={customerOptions}
                    value={customerId}
                    onChange={setCustomerId}
                    placeholder="Select customer"
                    searchable
                  />
                </div>

                <div>
                  <Input
                    label="Date"
                    required
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                    }}
                  />
                </div>

                <div className="col-span-2">
                  <Select
                    label="Reason"
                    required
                    options={reasonOptions}
                    value={reason}
                    onChange={(v) => {
                      setReason(v as CreditNoteReason);
                    }}
                  />
                </div>
              </div>

              {selectedCustomer && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-900">
                    {selectedCustomer.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Balance: {formatCurrency(selectedCustomer.currentBalance)}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader
              title="Items to Credit"
              className="pb-4"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={handleAddItemClick}
                >
                  Add Item
                </Button>
              }
            />
            <CardBody className="p-0">
              {lineItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>
                    No items added. Click &apos;Add Item&apos; to select
                    products for return/credit.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                          Item
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">
                          Qty
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">
                          Price
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">
                          Amount
                        </th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 group">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {item.itemName}
                            </div>
                            {item.batchNumber && (
                              <div className="text-xs text-slate-500">
                                Batch: {item.batchNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  handleEditItemClick(item);
                                }}
                              >
                                <Edit2 className="h-4 w-4 text-slate-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  handleRemoveLineItem(item.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-error" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Notes */}
          <Card>
            <CardBody>
              <Textarea
                label="Notes"
                placeholder="Internal notes or reason for credit..."
                rows={3}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                }}
              />
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
            <CardHeader title="Credit Summary" />
            <CardBody className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax Total</span>
                <span className="font-medium">
                  {formatCurrency(totals.taxAmount)}
                </span>
              </div>
              <div className="pt-3 border-t border-red-200">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-slate-900">
                    Total Credit
                  </span>
                  <span className="text-lg font-bold text-error">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Button
                fullWidth
                onClick={handleSubmit}
                disabled={!customerId || lineItems.length === 0}
                isLoading={isLoading}
              >
                Save & Issue Credit
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      <InvoiceItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
        }}
        onSave={handleSaveItem}
        item={editingItem}
        items={items}
      />
    </div>
  );
}
