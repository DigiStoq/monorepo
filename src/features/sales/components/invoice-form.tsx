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
import {
  Plus,
  Trash2,
  Calendar,
  FileText,
  Truck,
  Percent,
  DollarSign,
  Edit2,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useTaxRates } from "@/hooks/useSettings";
import type { SaleInvoiceFormData } from "../types";
import type { Customer } from "@/features/customers";
import type { Item } from "@/features/inventory";
import { InvoiceItemModal, type InvoiceLineItem } from "./invoice-item-modal";

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceFormProps {
  customers: Customer[];
  items: Item[];
  initialData?: Partial<SaleInvoiceFormData>;
  isLoading?: boolean;
  isSubmitting?: boolean;
  isEditing?: boolean;
  onSubmit: (data: SaleInvoiceFormData) => void;
  onCancel: () => void;
  className?: string;
}

// Use shared type
type LineItem = InvoiceLineItem;

// ============================================================================
// COMPONENT
// ============================================================================

export function InvoiceForm({
  customers,
  items,
  initialData,
  isLoading,
  isSubmitting,
  isEditing,
  onSubmit,
  onCancel,
  className,
}: InvoiceFormProps): React.ReactNode {
  const formLoading = isLoading ?? isSubmitting;
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState<string>(
    initialData?.customerId ?? ""
  );
  const [date, setDate] = useState<string>(initialData?.date ?? defaultDate);
  const [dueDate, setDueDate] = useState<string>(initialData?.dueDate ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [terms, setTerms] = useState(initialData?.terms ?? "");
  const [transportName, setTransportName] = useState(
    initialData?.transportName ?? ""
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialData?.deliveryDate ?? ""
  );
  const [deliveryLocation, setDeliveryLocation] = useState(
    initialData?.deliveryLocation ?? ""
  );
  const [discountType, setDiscountType] = useState<"percent" | "amount">(
    initialData?.discountType ?? "percent"
  );
  const [discountValue, setDiscountValue] = useState(
    initialData?.discountType === "amount"
      ? (initialData.discountAmount ?? 0)
      : (initialData?.discountPercent ?? 0)
  );
  const [showValidation, setShowValidation] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | undefined>(
    undefined
  );

  // Initialize line items from initialData if editing
  const getInitialLineItems = (): LineItem[] => {
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
        batchNumber:
          (formItem as { batchNumber?: string }).batchNumber ??
          selectedItem?.batchNumber ??
          "",
        quantity: formItem.quantity,
        unit: selectedItem?.unit ?? "pcs",
        unitPrice: formItem.unitPrice,
        mrp: (formItem as { mrp?: number }).mrp ?? 0,
        discountPercent: discountPct,
        taxPercent: taxPct,
        amount,
      };
    });
  };

  // Line items state - initialize from initialData if editing
  const [lineItems, setLineItems] = useState<LineItem[]>(getInitialLineItems);

  // Customer options - hook already filters by type, no need to filter again
  const customerOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "Select a customer..." },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ],
    [customers]
  );

  const { taxRates } = useTaxRates();

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
      return sum + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);

    const itemDiscounts = lineItems.reduce((sum, item) => {
      return (
        sum +
        (item.quantity || 0) *
          (item.unitPrice || 0) *
          ((item.discountPercent || 0) / 100)
      );
    }, 0);

    let invoiceDiscount = 0;
    if (discountType === "percent") {
      invoiceDiscount =
        (subtotal - itemDiscounts) * ((discountValue || 0) / 100);
    } else {
      invoiceDiscount = discountValue || 0;
    }

    const totalDiscount = itemDiscounts + invoiceDiscount;

    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = lineItems.reduce((sum, item) => {
      const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const itemDiscount = itemSubtotal * ((item.discountPercent || 0) / 100);
      // Note: Tax calculation here assumes tax applies to (ItemAmount - ItemDiscount).
      // It does NOT currently account for the distributed invoice-level discount.
      // If we want exact tax accuracy with invoice-level discounts, we'd need to distribute it.
      // But for now, preserving existing 'independent' behavior as requested.
      return (
        sum + (itemSubtotal - itemDiscount) * ((item.taxPercent || 0) / 100)
      );
    }, 0);

    const total = taxableAmount + taxAmount;

    return { subtotal, totalDiscount, taxAmount, total };
  }, [lineItems, discountType, discountValue]);

  // Format currency
  const { formatCurrency } = useCurrency();

  // Handle submit
  const handleSubmit = (): void => {
    if (!customerId || lineItems.length === 0) {
      setShowValidation(true);
      return;
    }

    // Validate line items
    const hasInvalidItems = lineItems.some(
      (item) => !item.itemId || item.quantity <= 0 || item.unitPrice < 0
    );

    if (hasInvalidItems) {
      setShowValidation(true);
      return;
    }

    const formData: SaleInvoiceFormData = {
      customerId,
      date,
      dueDate: dueDate || undefined,
      items: lineItems.map((item) => ({
        itemId: item.itemId,
        batchNumber: item.batchNumber || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        mrp: item.mrp || undefined,
        discountPercent: item.discountPercent || undefined,
        taxPercent: item.taxPercent || undefined,
      })),
      discountType,
      discountPercent: discountType === "percent" ? discountValue : undefined,
      discountAmount: discountType === "amount" ? discountValue : undefined,
      notes: notes || undefined,
      terms: terms || undefined,
      transportName: transportName || undefined,
      deliveryDate: deliveryDate || undefined,
      deliveryLocation: deliveryLocation || undefined,
    };

    onSubmit(formData);
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? "Edit Sale Invoice" : "New Sale Invoice"}
          </h1>
          <p className="text-slate-500">
            {isEditing
              ? "Update invoice details"
              : "Create a new invoice for your customer"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!customerId || lineItems.length === 0}
            isLoading={formLoading}
          >
            {isEditing ? "Save Changes" : "Create Invoice"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left Column - Invoice Details */}
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
                    error={
                      showValidation && !customerId
                        ? "Customer is required"
                        : undefined
                    }
                  />
                </div>

                <div>
                  <Input
                    type="date"
                    label="Invoice Date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                    }}
                  />
                </div>

                <div>
                  <Input
                    type="date"
                    label="Due Date"
                    showOptionalLabel
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                    }}
                  />
                </div>
              </div>

              {selectedCustomer && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
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

          {/* Transport Details */}
          <Card>
            <CardHeader title="Transport Details" />
            <CardBody>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Truck className="h-4 w-4 inline mr-1" />
                    Transport Name
                  </label>
                  <Input
                    type="text"
                    value={transportName}
                    onChange={(e) => {
                      setTransportName(e.target.value);
                    }}
                    placeholder="e.g. FedEx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Delivery Date
                  </label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => {
                      setDeliveryDate(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Truck className="h-4 w-4 inline mr-1" />
                    Delivery Location
                  </label>
                  <Input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => {
                      setDeliveryLocation(e.target.value);
                    }}
                    placeholder="e.g. New York"
                  />
                </div>
              </div>
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
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[120px]">
                          Batch No.
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[100px]">
                          MRP
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[100px]">
                          Qty
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[100px]">
                          Rate
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[80px]">
                          {discountType === "percent" ? "Disc %" : "Disc $"}
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[80px]">
                          Tax %
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 min-w-[100px]">
                          Amount
                        </th>
                        <th className="w-10"></th>
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
                          <td className="px-4 py-3 text-slate-600">
                            {item.batchNumber || "-"}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(item.mrp)}
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
                  placeholder="Notes visible to customer..."
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                  }}
                />
                <Textarea
                  label="Terms & Conditions"
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
            <CardHeader title="Invoice Summary" />
            <CardBody className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Discount</span>
                <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("percent");
                    }}
                    className={cn(
                      "p-1.5 hover:bg-slate-100 transition-colors",
                      discountType === "percent"
                        ? "bg-primary-50 text-primary-600"
                        : "text-slate-500"
                    )}
                  >
                    <Percent className="h-3.5 w-3.5" />
                  </button>
                  <div className="w-[1px] h-full bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("amount");
                    }}
                    className={cn(
                      "p-1.5 hover:bg-slate-100 transition-colors",
                      discountType === "amount"
                        ? "bg-primary-50 text-primary-600"
                        : "text-slate-500"
                    )}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDiscountValue(val);
                  }}
                  size="sm"
                  className="w-20 text-right"
                  placeholder={discountType === "percent" ? "0%" : "0.00"}
                />
                <span className="text-sm text-slate-500">
                  {discountType === "percent" ? "%" : ""}
                </span>
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
              {!isEditing && (
                <Button variant="outline" fullWidth disabled>
                  Save as Draft
                </Button>
              )}
              <Button
                fullWidth
                disabled={!customerId || lineItems.length === 0}
                onClick={handleSubmit}
                isLoading={formLoading}
              >
                {isEditing ? "Save Changes" : "Create"}
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
        discountType={discountType}
        defaultTaxRate={taxRates.find((r) => r.isDefault)?.rate ?? 0}
      />
    </div>
  );
}
