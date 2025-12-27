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
import { Building2, Calendar, Hash, ArrowDownLeft, ArrowUpRight } from "lucide-react";
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
}: ChequeFormProps) {
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<ChequeType>(initialData?.type ?? "received");
  const [chequeNumber, setChequeNumber] = useState(initialData?.chequeNumber ?? "");
  const [customerId, setCustomerId] = useState<string>(initialData?.customerId !== undefined ? initialData.customerId : "");
  const [bankName, setBankName] = useState(initialData?.bankName ?? "");
  const [date, setDate] = useState<string>(initialData?.date !== undefined ? initialData.date : defaultDate);
  const [dueDate, setDueDate] = useState<string>(initialData?.dueDate !== undefined ? initialData.dueDate : defaultDate);
  const [amount, setAmount] = useState<number>(initialData?.amount ?? 0);
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // Customer options
  const customerOptions: SelectOption[] = useMemo(() => {
    const filteredCustomers = type === "received"
      ? customers.filter((c) => c.type === "customer" || c.type === "both")
      : customers.filter((c) => c.type === "supplier" || c.type === "both");

    return [
      { value: "", label: `Select ${type === "received" ? "customer" : "supplier"}...` },
      ...filteredCustomers.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [customers, type]);

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  // Handle type change
  const handleTypeChange = (newType: ChequeType) => {
    setType(newType);
    setCustomerId(""); // Reset customer when type changes
  };

  // Handle submit
  const handleSubmit = () => {
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
          onClick={() => handleTypeChange("received")}
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
          onClick={() => handleTypeChange("issued")}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Hash className="h-4 w-4 inline mr-1" />
                  Cheque Number
                </label>
                <Input
                  type="text"
                  value={chequeNumber}
                  onChange={(e) => setChequeNumber(e.target.value)}
                  placeholder="Enter cheque number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  {isReceived ? "Received From" : "Issued To"}
                </label>
                <Select
                  options={customerOptions}
                  value={customerId}
                  onChange={setCustomerId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Bank Name
                </label>
                <Input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., Chase Bank"
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
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Dates & Notes */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Dates" />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Cheque Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Textarea
                label="Notes (Optional)"
                placeholder="Add any notes about this cheque..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardBody>
          </Card>

          {/* Summary */}
          <Card className={cn(
            "border",
            isReceived
              ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
              : "bg-gradient-to-br from-red-50 to-orange-50 border-red-100"
          )}>
            <CardBody className="text-center py-6">
              <p className="text-sm text-slate-600 mb-1">
                {isReceived ? "Cheque Received" : "Cheque Issued"}
              </p>
              <p className={cn("text-3xl font-bold", isReceived ? "text-success" : "text-error")}>
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
