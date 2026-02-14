import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  NumberInput,
  Textarea,
  Select,
  type SelectOption,
} from "@/components/ui";
import { useCurrency } from "@/hooks/useCurrency";
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
  const { formatCurrency } = useCurrency();

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
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Payment Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Payment Details" />
            <CardBody className="space-y-4">
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
                {selectedCustomer && (
                  <p className="mt-1 text-sm text-slate-500">
                    Current Balance:{" "}
                    {formatCurrency(selectedCustomer.currentBalance)}
                  </p>
                )}
              </div>

              <div>
                <Input
                  type="date"
                  label="Payment Date"
                  required
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                  }}
                />
              </div>

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
                    setPaymentMode(value as PaymentOutMode);
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
            </CardBody>
          </Card>

          {/* Conditional Payment Details Card */}
          {(paymentMode === "cheque" ||
            paymentMode === "bank" ||
            paymentMode === "card") && (
            <Card>
              <CardHeader
                title={`${paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1)} Details`}
              />
              <CardBody className="space-y-4">
                {paymentMode === "cheque" && (
                  <>
                    <Input
                      label="Cheque Number"
                      required
                      value={chequeNumber}
                      onChange={(e) => {
                        setChequeNumber(e.target.value);
                      }}
                      placeholder="Enter cheque number"
                    />
                    <Input
                      type="date"
                      label="Cheque Date"
                      value={chequeDate}
                      onChange={(e) => {
                        setChequeDate(e.target.value);
                      }}
                    />
                    <Input
                      label="Bank Name"
                      value={bankName}
                      onChange={(e) => {
                        setBankName(e.target.value);
                      }}
                      placeholder="Issuing Bank"
                    />
                  </>
                )}

                {paymentMode === "bank" && (
                  <>
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
                  </>
                )}

                {paymentMode === "card" && (
                  <>
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
                  </>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Column - Invoice & Notes */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Apply to Invoice (Optional)" />
            <CardBody className="space-y-4">
              <div>
                <Select
                  label="Select Invoice"
                  showOptionalLabel
                  options={invoiceOptions}
                  value={invoiceId}
                  onChange={handleInvoiceChange}
                  placeholder="Select invoice..."
                  searchable
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
                showOptionalLabel
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
