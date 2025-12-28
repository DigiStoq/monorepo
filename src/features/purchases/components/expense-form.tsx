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
import type { ExpenseFormData, ExpenseCategory, PaymentOutMode } from "../types";
import type { Customer } from "@/features/customers";

// ============================================================================
// TYPES
// ============================================================================

export interface ExpenseFormProps {
  customers: Customer[];
  initialData?: Partial<ExpenseFormData>;
  isLoading?: boolean;
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const categoryOptions: SelectOption[] = [
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "salaries", label: "Salaries" },
  { value: "office", label: "Office Supplies" },
  { value: "travel", label: "Travel" },
  { value: "marketing", label: "Marketing" },
  { value: "maintenance", label: "Maintenance" },
  { value: "insurance", label: "Insurance" },
  { value: "taxes", label: "Taxes" },
  { value: "other", label: "Other" },
];

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

export function ExpenseForm({
  customers,
  initialData,
  isLoading,
  onSubmit,
  onCancel,
  className,
}: ExpenseFormProps) {
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category ?? "other");
  const [customerId, setCustomerId] = useState<string>(initialData?.customerId ?? "");
  const [date, setDate] = useState<string>(initialData?.date ?? defaultDate);
  const [amount, setAmount] = useState<number>(initialData?.amount ?? 0);
  const [paymentMode, setPaymentMode] = useState<PaymentOutMode>(initialData?.paymentMode ?? "cash");
  const [referenceNumber, setReferenceNumber] = useState(initialData?.referenceNumber ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // Customer options (suppliers)
  const customerOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "No vendor (internal expense)" },
      ...customers
        .filter((c) => c.type === "supplier" || c.type === "both")
        .map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [customers]);

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  // Handle submit
  const handleSubmit = () => {
    if (!description || amount <= 0) return;

    const formData: ExpenseFormData = {
      category,
      customerId: customerId || undefined,
      date,
      amount,
      paymentMode,
      referenceNumber: referenceNumber || undefined,
      description,
      notes: notes || undefined,
    };

    onSubmit(formData);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Expense Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Expense Details" />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <Select
                  options={categoryOptions}
                  value={category}
                  onChange={(value) => { setCategory(value as ExpenseCategory); }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Description
                </label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); }}
                  placeholder="What was this expense for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); }}
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
                  onChange={(e) => { setAmount(parseFloat(e.target.value) || 0); }}
                  placeholder="0.00"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Payment & Notes */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Payment Details" />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Payment Mode
                </label>
                <Select
                  options={paymentModeOptions}
                  value={paymentMode}
                  onChange={(value) => { setPaymentMode(value as PaymentOutMode); }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Paid To (Optional)
                </label>
                <Select
                  options={customerOptions}
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="Select vendor..."
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
                  onChange={(e) => { setReferenceNumber(e.target.value); }}
                  placeholder="Bill number, receipt number, etc."
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Textarea
                label="Notes"
                placeholder="Add any additional notes..."
                rows={3}
                value={notes}
                onChange={(e) => { setNotes(e.target.value); }}
              />
            </CardBody>
          </Card>

          {/* Summary */}
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
            <CardBody className="text-center py-6">
              <p className="text-sm text-slate-600 mb-1">Expense Amount</p>
              <p className="text-3xl font-bold text-error">{formatCurrency(amount)}</p>
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
          disabled={!description || amount <= 0}
          isLoading={isLoading}
        >
          Record Expense
        </Button>
      </div>
    </div>
  );
}
