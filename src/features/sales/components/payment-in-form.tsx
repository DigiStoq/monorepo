import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  DateInput,
  NumberInput,
  Textarea,
  Select,
  type SelectOption,
} from "@/components/ui";
import type { PaymentInFormData, PaymentMode, SaleInvoice } from "../types";
import type { Customer } from "@/features/customers";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentInFormProps {
  customers: Customer[];
  invoices?: SaleInvoice[];
  initialData?: Partial<PaymentInFormData>;
  isLoading?: boolean;
  onSubmit: (data: PaymentInFormData) => void;
  onCancel: () => void;
  className?: string;
}

// ============================================================================
// PAYMENT MODE OPTIONS
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

export function PaymentInForm({
  customers,
  invoices = [],
  initialData,
  isLoading,
  onSubmit,
  onCancel,
  className,
}: PaymentInFormProps): React.ReactNode {
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState<string>(
    initialData?.customerId ?? ""
  );
  const [date, setDate] = useState<string>(initialData?.date ?? defaultDate);
  const [amount, setAmount] = useState(initialData?.amount ?? 0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    initialData?.paymentMode ?? "cash"
  );
  const [referenceNumber, setReferenceNumber] = useState(
    initialData?.referenceNumber ?? ""
  );
  const [invoiceId, setInvoiceId] = useState(initialData?.invoiceId ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // Additional Payment Details State
  const [chequeNumber, setChequeNumber] = useState(
    initialData?.chequeNumber ?? ""
  );
  const [chequeDate, setChequeDate] = useState(
    initialData?.chequeDate ?? defaultDate
  );
  const [bankName, setBankName] = useState(initialData?.bankName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(
    initialData?.bankAccountNumber ?? ""
  );
  const [cardNumber, setCardNumber] = useState(initialData?.cardNumber ?? "");

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

  // Customer options - hook already filters by type
  const customerOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "Select a customer..." },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [customers]);

  // Invoice options for selected customer
  const invoiceOptions: SelectOption[] = useMemo(() => {
    // Show all unpaid invoices for the customer
    const customerInvoices = invoices.filter(
      (inv) => inv.customerId === customerId && inv.amountDue > 0
    );
    return [
      { value: "", label: "No invoice (advance payment)" },
      ...customerInvoices.map((inv) => ({
        value: inv.id,
        label: `${inv.invoiceNumber} - Due: $${inv.amountDue.toFixed(2)}`,
      })),
    ];
  }, [invoices, customerId]);

  // Get selected invoice details
  const selectedInvoice = invoices.find((inv) => inv.id === invoiceId);

  // Format currency
  const { formatCurrency } = useCurrency();

  // Handle submit
  const handleSubmit = (): void => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }

    const formData: PaymentInFormData = {
      customerId,
      date,
      amount,
      paymentMode,
      referenceNumber: referenceNumber || undefined,
      invoiceId: invoiceId || undefined,
      notes: notes || undefined,
      // Include conditional fields
      chequeNumber: paymentMode === "cheque" ? chequeNumber : undefined,
      chequeDate: paymentMode === "cheque" ? chequeDate : undefined,
      bankName:
        paymentMode === "bank" || paymentMode === "cheque"
          ? bankName
          : undefined,
      bankAccountNumber: paymentMode === "bank" ? bankAccountNumber : undefined,
      cardNumber: paymentMode === "card" ? cardNumber : undefined,
    };

    onSubmit(formData);
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Record Payment</h1>
          <p className="text-slate-500">
            Record a payment received from customer
          </p>
        </div>
        <div className="flex gap-2">
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

      <div className="grid grid-cols-3 gap-4">
        {/* Left Column - Payment Details */}
        <div className="col-span-2 space-y-4">
          {/* Customer & Date */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Customer"
                    required
                    options={customerOptions}
                    value={customerId}
                    onChange={(value) => {
                      setCustomerId(value);
                      setInvoiceId(""); // Reset invoice when customer changes
                    }}
                    placeholder="Select customer"
                    searchable
                  />
                </div>

                <div>
                  <DateInput
                    label="Payment Date"
                    required
                    value={date}
                    onChange={setDate}
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
                </div>
              )}
            </CardBody>
          </Card>

          {/* Amount & Payment Mode */}
          <Card>
            <CardHeader title="Payment Details" />
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <NumberInput
                    label="Amount"
                    required
                    value={amount}
                    onChange={setAmount}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Select
                    label="Payment Mode"
                    required
                    options={paymentModeOptions}
                    value={paymentMode}
                    onChange={(value) => {
                      setPaymentMode(value as PaymentMode);
                    }}
                  />
                </div>

                <div>
                  <Input
                    type="text"
                    label="Reference Number"
                    showOptionalLabel
                    value={referenceNumber}
                    onChange={(e) => {
                      setReferenceNumber(e.target.value);
                    }}
                    placeholder="Transaction ID, Ref #, etc."
                  />
                </div>

                <div>
                  <Select
                    label="Against Invoice"
                    showOptionalLabel
                    options={invoiceOptions}
                    value={invoiceId}
                    onChange={handleInvoiceChange}
                    disabled={!customerId}
                    searchable
                  />
                </div>
              </div>

              {/* Conditional Payment Details */}
              {paymentMode === "cheque" && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                  <Input
                    label="Cheque Number"
                    required
                    value={chequeNumber}
                    onChange={(e) => {
                      setChequeNumber(e.target.value);
                    }}
                    placeholder="Enter cheque number"
                  />
                  <DateInput
                    label="Cheque Date"
                    value={chequeDate}
                    onChange={setChequeDate}
                  />
                  <Input
                    label="Bank Name"
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                    }}
                    placeholder="Issuing Bank"
                  />
                </div>
              )}

              {paymentMode === "bank" && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                  <Input
                    label="Bank Name"
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                    }}
                    placeholder="Bank Name"
                  />
                  <Input
                    label="Account Number"
                    value={bankAccountNumber}
                    onChange={(e) => {
                      setBankAccountNumber(e.target.value);
                    }}
                    placeholder="Account Number"
                  />
                </div>
              )}

              {paymentMode === "card" && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                  <Input
                    label="Card Number (Last 4)"
                    value={cardNumber}
                    onChange={(e) => {
                      setCardNumber(e.target.value);
                    }}
                    placeholder="xxxx"
                    maxLength={4}
                  />
                  <Input
                    label="Bank / Provider"
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                    }}
                    placeholder="Bank or Provider Name"
                  />
                </div>
              )}

              {selectedInvoice && (
                <div className="mt-4 p-3 rounded-lg border border-primary-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-primary-900">
                        {selectedInvoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-primary-600">
                        Invoice Total: {formatCurrency(selectedInvoice.total)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-error">
                        Due: {formatCurrency(selectedInvoice.amountDue)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Paid: {formatCurrency(selectedInvoice.amountPaid)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Notes */}
          <Card>
            <CardBody>
              <Textarea
                label="Notes"
                placeholder="Add any notes about this payment..."
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
            <CardHeader title="Payment Summary" />
            <CardBody className="space-y-3">
              <div className="flex justify-between items-start text-sm">
                <span className="text-slate-500 shrink-0">Customer</span>
                <span className="font-medium text-right ml-4 break-words">
                  {selectedCustomer?.name ?? "-"}
                </span>
              </div>

              <div className="flex justify-between items-start text-sm">
                <span className="text-slate-500 shrink-0">Payment Mode</span>
                <span className="font-medium capitalize text-right ml-4">
                  {paymentMode}
                </span>
              </div>

              {selectedInvoice && (
                <div className="flex justify-between items-start text-sm">
                  <span className="text-slate-500 shrink-0">Invoice</span>
                  <span className="font-medium text-right ml-4 break-words">
                    {selectedInvoice.invoiceNumber}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-slate-900">
                    Amount
                  </span>
                  <span className="text-lg font-bold text-success">
                    {formatCurrency(amount)}
                  </span>
                </div>
              </div>

              {selectedInvoice && amount > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Remaining Due</span>
                    <span className="font-medium text-error">
                      {formatCurrency(
                        Math.max(0, selectedInvoice.amountDue - amount)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardBody className="space-y-2">
              <Button
                fullWidth
                disabled={!customerId || amount <= 0}
                onClick={handleSubmit}
                isLoading={isLoading}
              >
                Record Payment
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
