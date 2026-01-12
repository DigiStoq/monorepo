import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  TableNumberInput,
  Textarea,
  Select,
  type SelectOption,
} from "@/components/ui";
import { Plus, Trash2, Calendar, User, FileText, Truck } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useInvoiceSettings, useTaxRates } from "@/hooks/useSettings";
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
  isSubmitting?: boolean;
  isEditing?: boolean;
  onSubmit: (data: SaleInvoiceFormData) => void;
  onCancel: () => void;
  className?: string;
}

interface LineItem {
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
  const [discountPercent, setDiscountPercent] = useState(
    initialData?.discountPercent ?? 0
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

  // Item options - hook already filters by isActive, no need to filter again
  const itemOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "Select an item..." },
      ...items.map((i) => ({
        value: i.id,
        label: `${i.name} - $${i.salePrice.toFixed(2)}`,
      })),
    ],
    [items]
  );

  const { settings: invoiceSettings } = useInvoiceSettings();
  const { taxRates } = useTaxRates();

  // Add line item
  const handleAddItem = (): void => {
    const defaultTaxRate = taxRates.find((r) => r.isDefault)?.rate ?? 0;
    const taxEnabled = invoiceSettings?.taxEnabled ?? false;
    const effectiveTaxRate = taxEnabled ? defaultTaxRate : 0;

    const newItem: LineItem = {
      id: `line-${Date.now()}`,
      itemId: "",
      itemName: "",
      batchNumber: "",
      quantity: 1,
      unit: "pcs",
      unitPrice: 0,
      mrp: 0,
      discountPercent: 0,
      taxPercent: effectiveTaxRate,
      amount: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  // Update line item
  const handleUpdateLineItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ): void => {
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
            updated.batchNumber = selectedItem.batchNumber ?? "";
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

    const invoiceDiscount =
      (subtotal - itemDiscounts) * ((discountPercent || 0) / 100);
    const totalDiscount = itemDiscounts + invoiceDiscount;

    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = lineItems.reduce((sum, item) => {
      const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const itemDiscount = itemSubtotal * ((item.discountPercent || 0) / 100);
      return (
        sum + (itemSubtotal - itemDiscount) * ((item.taxPercent || 0) / 100)
      );
    }, 0);

    const total = taxableAmount + taxAmount;

    return { subtotal, totalDiscount, taxAmount, total };
  }, [lineItems, discountPercent]);

  // Format currency
  // Format currency
  const { formatCurrency } = useCurrency();

  // Handle submit
  const handleSubmit = (): void => {
    if (!customerId || lineItems.length === 0) return;

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
      discountPercent: discountPercent || undefined,
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
                    onChange={(e) => {
                      setDate(e.target.value);
                    }}
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
                          Disc %
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
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Select
                              options={itemOptions}
                              value={item.itemId}
                              onChange={(value) => {
                                handleUpdateLineItem(item.id, "itemId", value);
                              }}
                              size="sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="text"
                              value={item.batchNumber}
                              onChange={(e) => {
                                handleUpdateLineItem(
                                  item.id,
                                  "batchNumber",
                                  e.target.value
                                );
                              }}
                              size="sm"
                              placeholder="Batch"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <TableNumberInput
                              value={item.mrp}
                              onChange={(val) => {
                                handleUpdateLineItem(item.id, "mrp", val);
                              }}
                              size="sm"
                              className="text-right min-w-[80px]"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <TableNumberInput
                              value={item.quantity}
                              onChange={(val) => {
                                handleUpdateLineItem(item.id, "quantity", val);
                              }}
                              size="sm"
                              className="text-right min-w-[60px]"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <TableNumberInput
                              value={item.unitPrice}
                              onChange={(val) => {
                                handleUpdateLineItem(item.id, "unitPrice", val);
                              }}
                              size="sm"
                              className="text-right min-w-[80px]"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <TableNumberInput
                              value={item.discountPercent}
                              onChange={(val) => {
                                handleUpdateLineItem(
                                  item.id,
                                  "discountPercent",
                                  val
                                );
                              }}
                              size="sm"
                              className="text-right min-w-[60px]"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <TableNumberInput
                              value={item.taxPercent}
                              onChange={(val) => {
                                handleUpdateLineItem(
                                  item.id,
                                  "taxPercent",
                                  val
                                );
                              }}
                              size="sm"
                              className="text-right min-w-[60px]"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-2 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                handleRemoveLineItem(item.id);
                              }}
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
                {isEditing ? "Save Changes" : "Create & Send"}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
