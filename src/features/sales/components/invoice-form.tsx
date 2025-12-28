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
import { Plus, Trash2, Calendar, User, FileText } from "lucide-react";
import type { SaleInvoiceFormData } from "../types";
import type { Customer } from "@/features/customers";
import type { Item } from "@/features/inventory";

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceFormProps {
  customers: Customer[];
  items: Item[];
  initialData?: Partial<SaleInvoiceFormData>;
  isLoading?: boolean;
  onSubmit: (data: SaleInvoiceFormData) => void;
  onCancel: () => void;
  className?: string;
}

interface LineItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InvoiceForm({
  customers,
  items,
  initialData,
  isLoading,
  onSubmit,
  onCancel,
  className,
}: InvoiceFormProps) {
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState<string>(initialData?.customerId ?? "");
  const [date, setDate] = useState<string>(initialData?.date ?? defaultDate);
  const [dueDate, setDueDate] = useState<string>(initialData?.dueDate ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [terms, setTerms] = useState(initialData?.terms ?? "");
  const [discountPercent, setDiscountPercent] = useState(initialData?.discountPercent ?? 0);

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Customer options
  const customerOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "Select a customer..." },
      ...customers
        .filter((c) => c.type === "customer" || c.type === "both")
        .map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [customers]);

  // Item options
  const itemOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "Select an item..." },
      ...items.filter((i) => i.isActive).map((i) => ({
        value: i.id,
        label: `${i.name} - $${i.salePrice.toFixed(2)}`,
      })),
    ];
  }, [items]);

  // Add line item
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `line-${Date.now()}`,
      itemId: "",
      itemName: "",
      quantity: 1,
      unit: "pcs",
      unitPrice: 0,
      discountPercent: 0,
      taxPercent: 0,
      amount: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  // Update line item
  const handleUpdateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // If item selected, populate details
        if (field === "itemId" && value) {
          const selectedItem = items.find((i) => i.id === value);
          if (selectedItem) {
            updated.itemName = selectedItem.name;
            updated.unit = selectedItem.unit;
            updated.unitPrice = selectedItem.salePrice;
            updated.taxPercent = selectedItem.taxRate ?? 0;
          }
        }

        // Recalculate amount
        const subtotal = updated.quantity * updated.unitPrice;
        const discountAmount = subtotal * (updated.discountPercent / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (updated.taxPercent / 100);
        updated.amount = taxableAmount + taxAmount;

        return updated;
      })
    );
  };

  // Remove line item
  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const itemDiscounts = lineItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice * (item.discountPercent / 100);
    }, 0);

    const invoiceDiscount = (subtotal - itemDiscounts) * (discountPercent / 100);
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
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  // Handle submit
  const handleSubmit = () => {
    if (!customerId || lineItems.length === 0) return;

    const formData: SaleInvoiceFormData = {
      customerId,
      date,
      dueDate: dueDate || undefined,
      items: lineItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || undefined,
        taxPercent: item.taxPercent || undefined,
      })),
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
          <h1 className="text-2xl font-bold text-slate-900">New Sale Invoice</h1>
          <p className="text-slate-500">Create a new invoice for your customer</p>
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
            Create Invoice
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <User className="h-4 w-4 inline mr-1" />
                    Customer
                  </label>
                  <Select
                    options={customerOptions}
                    value={customerId}
                    onChange={setCustomerId}
                    placeholder="Select customer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Invoice Date
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => { setDueDate(e.target.value); }}
                  />
                </div>
              </div>

              {selectedCustomer && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-900">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && (
                    <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                  )}
                  {selectedCustomer.email && (
                    <p className="text-xs text-slate-500">{selectedCustomer.email}</p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader
              title="Items"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={handleAddItem}
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
                    onClick={handleAddItem}
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
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                          Item
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 w-24">
                          Qty
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 w-28">
                          Price
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 w-24">
                          Disc %
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 w-24">
                          Tax %
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3 w-28">
                          Amount
                        </th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Select
                              options={itemOptions}
                              value={item.itemId}
                              onChange={(value) =>
                                { handleUpdateLineItem(item.id, "itemId", value); }
                              }
                              size="sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                { handleUpdateLineItem(
                                  item.id,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                ); }
                              }
                              size="sm"
                              className="text-right"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                { handleUpdateLineItem(
                                  item.id,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                ); }
                              }
                              size="sm"
                              className="text-right"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountPercent}
                              onChange={(e) =>
                                { handleUpdateLineItem(
                                  item.id,
                                  "discountPercent",
                                  parseFloat(e.target.value) || 0
                                ); }
                              }
                              size="sm"
                              className="text-right"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.taxPercent}
                              onChange={(e) =>
                                { handleUpdateLineItem(
                                  item.id,
                                  "taxPercent",
                                  parseFloat(e.target.value) || 0
                                ); }
                              }
                              size="sm"
                              className="text-right"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-2 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { handleRemoveLineItem(item.id); }}
                            >
                              <Trash2 className="h-4 w-4 text-error" />
                            </Button>
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
                  onChange={(e) => { setNotes(e.target.value); }}
                />
                <Textarea
                  label="Terms & Conditions"
                  placeholder="Payment terms, delivery terms..."
                  rows={3}
                  value={terms}
                  onChange={(e) => { setTerms(e.target.value); }}
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
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Discount</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => { setDiscountPercent(parseFloat(e.target.value) || 0); }}
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
                <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-slate-900">Total</span>
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
                Create & Send
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
