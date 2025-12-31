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
import { Building2, Calendar, CreditCard, FileText, Hash } from "lucide-react";
import type {
  PaymentOutFormData,
  PaymentOutMode,
  PurchaseInvoice,
} from "../types";
import type { Customer } from "@/features/customers";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentOutFormProps {
  customers: Customer[];
  invoices?: PurchaseInvoice[];
  initialData?: Partial<PaymentOutFormData>;
  isLoading?: boolean;
  onSubmit: (data: PaymentOutFormData) => void;
  onCancel: () => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const paymentModeOptions: SelectOption[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "ach", label: "ACH Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentOutForm({
  customers,
  invoices = [],
  initialData,
  isLoading,
  onSubmit,
  onCancel,
  className,
}: PaymentOutFormProps): React.ReactNode {
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState<string>(
    initialData?.customerId ?? ""
  );
  const [date, setDate] = useState<string>(initialData?.date ?? defaultDate);
  const [amount, setAmount] = useState<number>(initialData?.amount ?? 0);
  const [paymentMode, setPaymentMode] = useState<PaymentOutMode>(
    initialData?.paymentMode ?? "cash"
  );
  const [referenceNumber, setReferenceNumber] = useState(
    initialData?.referenceNumber ?? ""
  );
  const [invoiceId, setInvoiceId] = useState<string>(
    initialData?.invoiceId ?? ""
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // Customer options - hook already filters by type (suppliers)
  const customerOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "Select a supplier..." },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [customers]);

  // Invoice options (filtered by customer)
  const invoiceOptions: SelectOption[] = useMemo(() => {
    const filteredInvoices = customerId
      ? invoices.filter(
          (inv) => inv.customerId === customerId && inv.amountDue > 0
        )
      : invoices.filter((inv) => inv.amountDue > 0);

    return [
      { value: "", label: "No invoice (advance payment)" },
      ...filteredInvoices.map((inv) => ({
        value: inv.id,
        label: `${inv.invoiceNumber} - Due: $${inv.amountDue.toFixed(2)}`,
      })),
    ];
  }, [invoices, customerId]);

  // Selected invoice
  const selectedInvoice = invoices.find((inv) => inv.id === invoiceId);

  // Format currency
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  // Handle invoice selection
  const handleInvoiceChange = (value: string): void => {
    setInvoiceId(value);
    if (value) {
      const invoice = invoices.find((inv) => inv.id === value);
      if (invoice) {
        setCustomerId(invoice.customerId);
        setAmount(invoice.amountDue);
      }
    }
  };

  // Handle submit
  const handleSubmit = (): void => {
    if (!customerId || amount <= 0) return;

    const formData: PaymentOutFormData = {
      customerId,
      date,
      amount,
      paymentMode,
      referenceNumber: referenceNumber || undefined,
      invoiceId: invoiceId || undefined,
      notes: notes || undefined,
    };

    onSubmit(formData);
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Payment Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Payment Details" />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Supplier
                </label>
                <Select
                  options={customerOptions}
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="Select supplier"
                />
                {selectedCustomer && (
                  <p className="mt-1 text-sm text-slate-500">
                    Current Balance:{" "}
                    {formatCurrency(selectedCustomer.currentBalance)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Payment Date
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
                  Amount
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(parseFloat(e.target.value) || 0);
                  }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Payment Mode
                </label>
                <Select
                  options={paymentModeOptions}
                  value={paymentMode}
                  onChange={(value) => {
                    setPaymentMode(value as PaymentOutMode);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Hash className="h-4 w-4 inline mr-1" />
                  Reference Number
                </label>
                <Input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => {
                    setReferenceNumber(e.target.value);
                  }}
                  placeholder="Transaction ID, cheque number, etc."
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Invoice & Notes */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Apply to Invoice (Optional)" />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Select Invoice
                </label>
                <Select
                  options={invoiceOptions}
                  value={invoiceId}
                  onChange={handleInvoiceChange}
                  placeholder="Select invoice..."
                />
              </div>

              {selectedInvoice && (
                <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Invoice Total</span>
                    <span className="font-medium">
                      {formatCurrency(selectedInvoice.total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Already Paid</span>
                    <span className="font-medium">
                      {formatCurrency(selectedInvoice.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                    <span className="text-slate-700 font-medium">
                      Amount Due
                    </span>
                    <span className="font-bold text-error">
                      {formatCurrency(selectedInvoice.amountDue)}
                    </span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Textarea
                label="Notes"
                placeholder="Add any notes about this payment..."
                rows={4}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                }}
              />
            </CardBody>
          </Card>

          {/* Summary */}
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
            <CardBody className="text-center py-6">
              <p className="text-sm text-slate-600 mb-1">Payment Amount</p>
              <p className="text-3xl font-bold text-error">
                {formatCurrency(amount)}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!customerId || amount <= 0}
          isLoading={isLoading}
        >
          Record Payment
        </Button>
      </div>
    </div>
  );
}
