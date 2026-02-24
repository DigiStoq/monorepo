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
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { ChequeFormData, ChequeType } from "../types";
import type { Customer } from "@/features/customers";

// ============================================================================
// TYPES
// ============================================================================

export interface ChequeFormProps {
  customers: Customer[];
  initialData?: Partial<ChequeFormData>;
  isLoading?: boolean;
  onSubmit: (data: ChequeFormData) => void;
  onCancel: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ChequeForm({
  customers,
  initialData,
  isLoading,
  onSubmit,
  onCancel,
  className,
}: ChequeFormProps): React.ReactNode {
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<ChequeType>(initialData?.type ?? "received");
  const [chequeNumber, setChequeNumber] = useState(
    initialData?.chequeNumber ?? ""
  );
  const [customerId, setCustomerId] = useState<string>(
    initialData?.customerId ?? ""
  );
  const [bankName, setBankName] = useState(initialData?.bankName ?? "");
  const [date, setDate] = useState<string>(initialData?.date ?? defaultDate);
  const [dueDate, setDueDate] = useState<string>(
    initialData?.dueDate ?? defaultDate
  );
  const [amount, setAmount] = useState<number>(initialData?.amount ?? 0);
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // Customer options
  const customerOptions: SelectOption[] = useMemo(() => {
    const filteredCustomers =
      type === "received"
        ? customers.filter((c) => c.type === "customer" || c.type === "both")
        : customers.filter((c) => c.type === "supplier" || c.type === "both");

    return [
      {
        value: "",
        label: `Select ${type === "received" ? "customer" : "supplier"}...`,
      },
      ...filteredCustomers.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [customers, type]);

  // Format currency
  const { formatCurrency } = useCurrency();

  // Handle type change
  const handleTypeChange = (newType: ChequeType): void => {
    setType(newType);
    setCustomerId(""); // Reset customer when type changes
  };

  // Handle submit
  const handleSubmit = (): void => {
    if (!chequeNumber || !customerId || !bankName || amount <= 0) return;

    const formData: ChequeFormData = {
      chequeNumber,
      type,
      customerId,
      bankName,
      date,
      dueDate,
      amount,
      notes: notes || undefined,
    };

    onSubmit(formData);
  };

  const isValid = chequeNumber && customerId && bankName && amount > 0;
  const isReceived = type === "received";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Type Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            handleTypeChange("received");
          }}
          className={cn(
            "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
            type === "received"
              ? "border-success bg-success-light text-success"
              : "border-slate-200 text-slate-500 hover:border-slate-300"
          )}
        >
          <ArrowDownLeft className="h-5 w-5" />
          <span className="font-medium">Cheque Received</span>
        </button>
        <button
          type="button"
          onClick={() => {
            handleTypeChange("issued");
          }}
          className={cn(
            "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
            type === "issued"
              ? "border-error bg-error-light text-error"
              : "border-slate-200 text-slate-500 hover:border-slate-300"
          )}
        >
          <ArrowUpRight className="h-5 w-5" />
          <span className="font-medium">Cheque Issued</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Cheque Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Cheque Details" />
            <CardBody className="space-y-4">
              <Input
                label="Cheque Number"
                required
                type="text"
                value={chequeNumber}
                onChange={(e) => {
                  setChequeNumber(e.target.value);
                }}
                placeholder="Enter cheque number"
              />

              <Select
                label={isReceived ? "Received From" : "Issued To"}
                required
                options={customerOptions}
                value={customerId}
                onChange={setCustomerId}
                searchable
                searchPlaceholder="Search..."
              />

              <Input
                label="Bank Name"
                required
                type="text"
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value);
                }}
                placeholder="e.g., Chase Bank"
              />

              <NumberInput
                label="Amount"
                required
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
              />
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Dates & Notes */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Dates" />
            <CardBody className="space-y-4">
              <DateInput
                label="Cheque Date"
                required
                value={date}
                onChange={setDate}
              />

              <DateInput
                label="Due Date"
                required
                value={dueDate}
                onChange={setDueDate}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Textarea
                label="Notes"
                showOptionalLabel
                placeholder="Add any notes about this cheque..."
                rows={3}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                }}
              />
            </CardBody>
          </Card>

          {/* Summary */}
          <Card
            className={cn(
              "border",
              isReceived
                ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
                : "bg-gradient-to-br from-red-50 to-orange-50 border-red-100"
            )}
          >
            <CardBody className="text-center py-6">
              <p className="text-sm text-slate-600 mb-1">
                {isReceived ? "Cheque Received" : "Cheque Issued"}
              </p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  isReceived ? "text-success" : "text-error"
                )}
              >
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
          disabled={!isValid}
          isLoading={isLoading}
        >
          Save Cheque
        </Button>
      </div>
    </div>
  );
}
