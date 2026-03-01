import { useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  DateInput,
  Textarea,
  Select,
  type SelectOption,
} from "@/components/ui";
import { Plus, Trash2, FileText, Edit2 } from "lucide-react";
import { InvoiceItemModal, type InvoiceLineItem } from "./invoice-item-modal";
import { useCurrency } from "@/hooks/useCurrency";
import type { EstimateFormData, SaleInvoiceItemFormData } from "../types";
import type { Customer } from "@/features/customers";
import type { Item } from "@/features/inventory";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export interface EstimateFormProps {
  customers: Customer[];
  items: Item[];
  initialData?: Partial<EstimateFormData>;
  isLoading?: boolean;
  onSubmit: (data: EstimateFormData) => void;
  onCancel: () => void;
  className?: string;
}

// Use shared type
type LineItem = InvoiceLineItem;

// ============================================================================
// COMPONENT
// ============================================================================

export function EstimateForm({
  customers,
  items,
  initialData,
  isLoading,
  onSubmit,
  onCancel,
  className,
}: EstimateFormProps): React.ReactNode {
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);
  const defaultValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10); // 30 days from now

  const [customerId, setCustomerId] = useState<string>(
    initialData?.customerId ?? ""
  );
  const [date, setDate] = useState<string>(initialData?.date ?? defaultDate);
  const [validUntil, setValidUntil] = useState<string>(
    initialData?.validUntil ?? defaultValidUntil
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [terms, setTerms] = useState(initialData?.terms ?? "");
  const [discountPercent, setDiscountPercent] = useState(
    initialData?.discountPercent ?? 0
  );

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | undefined>(
    undefined
  );

  // Customer options - hook already filters by type
  const customerOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "Select a customer..." },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [customers]);

  // Initialize line items from initialData if editing
  const getInitialLineItems = useCallback((): LineItem[] => {
    if (!initialData?.items || initialData.items.length === 0) return [];

    return initialData.items.map((formItem, index) => {
      const selectedItem = items.find((i) => i.id === formItem.itemId);
      const subtotal = formItem.quantity * formItem.unitPrice;
      const discountPct = formItem.discountPercent ?? 0;
      const taxPct = formItem.taxPercent ?? 0;
      const discountAmount = subtotal * (discountPct / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (taxPct / 100);
      const amount = taxableAmount + taxAmount;

      return {
        id: `line-${Date.now()}-${index}`,
        itemId: formItem.itemId,
        itemName: selectedItem?.name ?? "Unknown",
        batchNumber: formItem.batchNumber ?? "",
        quantity: formItem.quantity,
        unit: selectedItem?.unit ?? "pcs",
        unitPrice: formItem.unitPrice,
        mrp: formItem.mrp ?? 0,
        discountPercent: discountPct,
        taxPercent: taxPct,
        amount,
      };
    });
  }, [initialData, items]);

  useEffect(() => {
    if (initialData) {
      setCustomerId(initialData.customerId ?? "");
      setDate(initialData.date ?? defaultDate);
      setValidUntil(initialData.validUntil ?? defaultValidUntil);
      setNotes(initialData.notes ?? "");
      setTerms(initialData.terms ?? "");
      setDiscountPercent(initialData.discountPercent ?? 0);
      setLineItems(getInitialLineItems());
    }
  }, [initialData, defaultDate, defaultValidUntil, getInitialLineItems]);

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>(getInitialLineItems());

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

    const itemDiscounts = lineItems.reduce((sum, item) => {
      return (
        sum + item.quantity * item.unitPrice * (item.discountPercent / 100)
      );
    }, 0);

    const invoiceDiscount =
      (subtotal - itemDiscounts) * (discountPercent / 100);
    const totalDiscount = itemDiscounts + invoiceDiscount;

    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = itemSubtotal * (item.discountPercent / 100);
      return sum + (itemSubtotal - itemDiscount) * (item.taxPercent / 100);
    }, 0);

    const total = taxableAmount + taxAmount;

    return { subtotal, totalDiscount, taxAmount, total };
  }, [lineItems, discountPercent]);

  // Format currency
  // Format currency
  const { formatCurrency } = useCurrency();

  // Handle submit
  const handleSubmit = (): void => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (lineItems.length === 0) {
      toast.error("Please add at least one item to the estimate");
      return;
    }
    const hasInvalidItems = lineItems.some(
      (item) => !item.itemId || item.quantity <= 0 || item.unitPrice < 0
    );
    if (hasInvalidItems) {
      toast.error("Please fix invalid items before creating estimate");
      return;
    }

    const formData: EstimateFormData = {
      customerId,
      date,
      validUntil,
      items: lineItems.map(
        (item): SaleInvoiceItemFormData => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || undefined,
          taxPercent: item.taxPercent || undefined,
        })
      ),
      discountPercent: discountPercent || undefined,
      notes: notes || undefined,
      terms: terms || undefined,
    };

    onSubmit(formData);
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Estimate</h1>
          <p className="text-slate-500">Create a quotation for your customer</p>
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
            Create Estimate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left Column - Estimate Details */}
        <div className="col-span-2 space-y-4">
          {/* Customer & Dates */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
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
                  <DateInput
                    label="Estimate Date"
                    required
                    value={date}
                    onChange={setDate}
                  />
                </div>

                <div>
                  <DateInput
                    label="Valid Until"
                    showOptionalLabel
                    value={validUntil}
                    onChange={setValidUntil}
                  />
                </div>
              </div>

              {selectedCustomer && (
                <div className="mt-4 p-3 rounded-lg">
                  <p className="text-sm font-medium text-slate-900">
                    {selectedCustomer.name}
                  </p>
                  {selectedCustomer.phone && (
                    <p className="text-xs text-slate-500">
                      {selectedCustomer.phone}
                    </p>
                  )}
                  {selectedCustomer.email && (
                    <p className="text-xs text-slate-500">
                      {selectedCustomer.email}
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader
              title="Items"
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
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No items added yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={handleAddItemClick}
                    className="mt-3"
                  >
                    Add First Item
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[200px]">
                          Item
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[100px]">
                          Qty
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[100px]">
                          Price
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[80px]">
                          Disc %
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[80px]">
                          Tax %
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[100px]">
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
                          <td className="px-4 py-3 text-right text-slate-600">
                            {item.discountPercent}%
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {item.taxPercent}%
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

          {/* Notes & Terms */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <Textarea
                  label="Notes"
                  showOptionalLabel
                  placeholder="Notes visible to customer..."
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                  }}
                />
                <Textarea
                  label="Terms & Conditions"
                  showOptionalLabel
                  placeholder="Payment terms, delivery terms..."
                  rows={3}
                  value={terms}
                  onChange={(e) => {
                    setTerms(e.target.value);
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Estimate Summary" />
            <CardBody className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Discount</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => {
                    setDiscountPercent(parseFloat(e.target.value) || 0);
                  }}
                  size="sm"
                  className="w-16 text-right"
                />
                <span className="text-sm text-slate-500">%</span>
                <span className="ml-auto font-medium text-sm">
                  -{formatCurrency(totals.totalDiscount)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium">
                  {formatCurrency(totals.taxAmount)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-slate-900">
                    Total
                  </span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardBody className="space-y-2">
              <Button variant="outline" fullWidth disabled>
                Save as Draft
              </Button>
              <Button
                fullWidth
                disabled={!customerId || lineItems.length === 0}
                onClick={handleSubmit}
                isLoading={isLoading}
              >
                Create
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
        // Estimate uses straightforward discount percent usually
        discountType="percent"
      />
    </div>
  );
}
