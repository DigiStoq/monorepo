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
import { Plus, Trash2, FileText } from "lucide-react";
import type {
  PurchaseInvoiceFormData,
  PurchaseInvoiceItemFormData,
} from "../types";
import type { Customer } from "@/features/customers";
import type { Item } from "@/features/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import {
  PurchaseItemModal,
  type PurchaseLineItem,
} from "./purchase-item-modal";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export interface PurchaseInvoiceFormProps {
  customers: Customer[];
  items: Item[];
  initialData?: Partial<PurchaseInvoiceFormData>;
  isLoading?: boolean;
  bankAccounts?: { id: string; name: string; bankName: string }[];
  onAddBankAccount?: (data: {
    name: string;
    bankName: string;
    accountNumber: string;
    openingBalance: number;
  }) => Promise<string>;
  onSubmit: (data: PurchaseInvoiceFormData) => void;
  onCancel: () => void;
  className?: string;
}

// Use shared type
type LineItem = PurchaseLineItem;

// ============================================================================
// COMPONENT
// ============================================================================

export function PurchaseInvoiceForm({
  customers,
  items,
  bankAccounts = [], // Default to empty array
  initialData,
  isLoading,
  onAddBankAccount,
  onSubmit,
  onCancel,
  className,
}: PurchaseInvoiceFormProps): React.ReactNode {
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState<string>(
    initialData?.customerId ?? ""
  );
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState(
    initialData?.supplierInvoiceNumber ?? ""
  );
  const [date, setDate] = useState<string>(initialData?.date ?? defaultDate);
  const [dueDate, setDueDate] = useState<string>(initialData?.dueDate ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [discountPercent, setDiscountPercent] = useState(
    initialData?.discountPercent ?? 0
  );

  // Payment State
  const [paymentStatus, setPaymentStatus] = useState<
    "paid" | "unpaid" | "partial"
  >(initialData?.initialPaymentStatus ?? "unpaid");
  const [amountPaid, setAmountPaid] = useState<number>(
    initialData?.initialAmountPaid ?? 0
  );
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank" | "cheque">(
    (initialData?.initialPaymentMode as
      | "cash"
      | "bank"
      | "cheque"
      | undefined) ?? "cash"
  );

  // Extra Payment Details State
  const [bankAccountId, setBankAccountId] = useState<string>(
    initialData?.initialBankAccountId ?? ""
  );
  const [chequeNumber, setChequeNumber] = useState<string>(
    initialData?.initialChequeNumber ?? ""
  );
  const [chequeBankName, setChequeBankName] = useState<string>(
    initialData?.initialChequeBankName ?? ""
  );
  const [chequeDueDate, setChequeDueDate] = useState<string>(
    initialData?.initialChequeDueDate ?? ""
  );

  // Add Bank Account State
  const [isAddingBankAccount, setIsAddingBankAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");

  const handleCreateBankAccount = async (): Promise<void> => {
    if (!onAddBankAccount) return;
    try {
      const id = await onAddBankAccount({
        name: newAccountName,
        bankName: newBankName,
        accountNumber: newAccountNumber,
        openingBalance: 0,
      });
      setBankAccountId(id);
      setIsAddingBankAccount(false);
      setNewAccountName("");
      setNewBankName("");
      setNewAccountNumber("");
    } catch (error) {
      console.error("Failed to create bank account", error);
    }
  };

  const [showValidation, setShowValidation] = useState(false);

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | undefined>(
    undefined
  );

  // Customer options (suppliers) - hook already filters by type
  const customerOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "Select a supplier..." },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [customers]);

  // Add line item
  const handleAddItem = (): void => {
    setEditingItem(undefined);
    setIsItemModalOpen(true);
  };

  // Edit line item
  const handleEditItem = (item: LineItem): void => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  // Save line item (from modal)
  const handleSaveItem = (item: LineItem): void => {
    setLineItems((prev) => {
      const index = prev.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        // Update existing
        const newItems = [...prev];
        newItems[index] = item;
        return newItems;
      } else {
        // Add new
        return [...prev, item];
      }
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

    // Auto-update amount paid if status is paid
    const effectiveAmountPaid =
      paymentStatus === "paid"
        ? total
        : paymentStatus === "unpaid"
          ? 0
          : amountPaid;

    const balanceDue = total - effectiveAmountPaid;

    return {
      subtotal,
      totalDiscount,
      taxAmount,
      total,
      effectiveAmountPaid,
      balanceDue,
    };
  }, [lineItems, discountPercent, paymentStatus, amountPaid]);

  // Format currency
  const { formatCurrency } = useCurrency();

  // Handle submit
  const handleSubmit = (): void => {
    if (!customerId || lineItems.length === 0) {
      setShowValidation(true);
      toast.error("Please select a supplier and add at least one item");
      return;
    }

    // Validate Payment Fields
    if (paymentStatus !== "unpaid") {
      if (paymentMode === "bank" && !bankAccountId) {
        setShowValidation(true);
        toast.error("Please select a bank account");
        return;
      }
      if (
        paymentMode === "cheque" &&
        (!chequeNumber || !chequeBankName || !chequeDueDate)
      ) {
        setShowValidation(true);
        toast.error("Please fill in all cheque details");
        return;
      }
    }

    const formData: PurchaseInvoiceFormData = {
      customerId,
      supplierInvoiceNumber: supplierInvoiceNumber || undefined,
      date,
      dueDate: dueDate || undefined,
      items: lineItems.map(
        (item): PurchaseInvoiceItemFormData => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || undefined,
          taxPercent: item.taxPercent || undefined,
        })
      ),
      discountPercent: discountPercent || undefined,
      notes: notes || undefined,
      initialPaymentStatus: paymentStatus,
      initialAmountPaid:
        paymentStatus === "paid"
          ? totals.total
          : paymentStatus === "partial"
            ? amountPaid
            : 0,
      initialPaymentMode: paymentStatus !== "unpaid" ? paymentMode : undefined,
      initialBankAccountId:
        paymentStatus !== "unpaid" && paymentMode === "bank"
          ? bankAccountId
          : undefined,
      initialChequeNumber:
        paymentStatus !== "unpaid" && paymentMode === "cheque"
          ? chequeNumber
          : undefined,
      initialChequeBankName:
        paymentStatus !== "unpaid" && paymentMode === "cheque"
          ? chequeBankName
          : undefined,
      initialChequeDueDate:
        paymentStatus !== "unpaid" && paymentMode === "cheque"
          ? chequeDueDate
          : undefined,
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
            New Purchase Invoice
          </h1>
          <p className="text-slate-500">Record a purchase from your supplier</p>
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
            Save Purchase
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left Column - Invoice Details */}
        <div className="col-span-2 space-y-4">
          {/* Supplier & Dates */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Select
                    label="Supplier"
                    required
                    options={customerOptions}
                    value={customerId}
                    onChange={setCustomerId}
                    placeholder="Select supplier"
                    searchable
                  />
                </div>

                <div>
                  <Input
                    type="text"
                    label="Supplier Invoice #"
                    showOptionalLabel
                    value={supplierInvoiceNumber}
                    onChange={(e) => {
                      setSupplierInvoiceNumber(e.target.value);
                    }}
                    placeholder="Supplier's invoice number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                        <th className="w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item) => (
                        <tr key={item.id} className="group hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {item.itemName || "Select Item"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.unit}{" "}
                              {item.batchNumber &&
                                `• Batch: ${item.batchNumber}`}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {item.quantity}
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
                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  handleEditItem(item);
                                }}
                              >
                                <Edit2 className="h-4 w-4 text-slate-400 hover:text-primary-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  handleRemoveLineItem(item.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-slate-400 hover:text-error" />
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
                showOptionalLabel
                placeholder="Add any notes about this purchase..."
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
          <Card>
            <CardHeader title="Purchase Summary" />
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

              {/* Payment Details Display in Summary */}
              {(paymentStatus === "paid" || paymentStatus === "partial") && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Amount Paid</span>
                    <span className="font-medium text-success">
                      {formatCurrency(totals.effectiveAmountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Balance Due</span>
                    <span className="font-medium text-error">
                      {formatCurrency(totals.balanceDue)}
                    </span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Payment Options */}
          <Card>
            <CardHeader title="Payment Details" />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["unpaid", "partial", "paid"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setPaymentStatus(
                          status as "unpaid" | "partial" | "paid"
                        );
                      }}
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-lg border",
                        paymentStatus === status
                          ? "bg-primary-50 border-primary-500 text-primary-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {paymentStatus !== "unpaid" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Payment Mode
                      </label>
                      <Select
                        options={[
                          { value: "cash", label: "Cash" },
                          { value: "bank", label: "Bank Transfer" },
                          { value: "cheque", label: "Cheque" },
                        ]}
                        value={paymentMode}
                        onChange={(val) => {
                          setPaymentMode(val as "cash" | "bank" | "cheque");
                        }}
                        size="sm"
                      />
                    </div>

                    {paymentStatus === "partial" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Amount Paid
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max={totals.total}
                          value={amountPaid}
                          onChange={(e) => {
                            setAmountPaid(parseFloat(e.target.value) || 0);
                          }}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Bank Account Selection */}
                  {paymentMode === "bank" && (
                    <div className="mt-3">
                      {!isAddingBankAccount ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-slate-700">
                              Withdraw From Account{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            {onAddBankAccount && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingBankAccount(true);
                                }}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add New
                              </button>
                            )}
                          </div>
                          <Select
                            options={[
                              { value: "", label: "Select Bank Account" },
                              ...bankAccounts.map((acc) => ({
                                value: acc.id,
                                label: `${acc.name} - ${acc.bankName}`,
                              })),
                            ]}
                            value={bankAccountId}
                            onChange={setBankAccountId}
                            size="sm"
                            className={cn(
                              showValidation &&
                                !bankAccountId &&
                                "border-red-500"
                            )}
                          />
                        </>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">
                              New Bank Account
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingBankAccount(false);
                              }}
                              className="text-xs text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                          <div className="space-y-2">
                            <Input
                              placeholder="Account Name (e.g. Business Checking)"
                              value={newAccountName}
                              onChange={(e) => {
                                setNewAccountName(e.target.value);
                              }}
                              size="sm"
                            />
                            <Input
                              placeholder="Bank Name (e.g. Chase)"
                              value={newBankName}
                              onChange={(e) => {
                                setNewBankName(e.target.value);
                              }}
                              size="sm"
                            />
                            <Input
                              placeholder="Account Number"
                              value={newAccountNumber}
                              onChange={(e) => {
                                setNewAccountNumber(e.target.value);
                              }}
                              size="sm"
                            />
                            <Button
                              size="sm"
                              fullWidth
                              onClick={() => {
                                void handleCreateBankAccount();
                              }}
                              disabled={
                                !newAccountName ||
                                !newBankName ||
                                !newAccountNumber
                              }
                            >
                              Save Account
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cheque Details */}
                  {paymentMode === "cheque" && (
                    <div className="space-y-3 pt-2 mt-3 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Cheque No. <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={chequeNumber}
                            onChange={(e) => {
                              setChequeNumber(e.target.value);
                            }}
                            size="sm"
                            placeholder="XXXXXX"
                            className={cn(
                              showValidation &&
                                !chequeNumber &&
                                "border-red-500"
                            )}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Bank Name <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={chequeBankName}
                            onChange={(e) => {
                              setChequeBankName(e.target.value);
                            }}
                            size="sm"
                            placeholder="Bank Name"
                            className={cn(
                              showValidation &&
                                !chequeBankName &&
                                "border-red-500"
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Cheque Date <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="date"
                          value={chequeDueDate}
                          onChange={(e) => {
                            setChequeDueDate(e.target.value);
                          }}
                          size="sm"
                          className={cn(
                            showValidation && !chequeDueDate && "border-red-500"
                          )}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
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
                Save Purchase
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      <PurchaseItemModal
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
