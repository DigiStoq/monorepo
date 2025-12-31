import { useState } from "react";
import {
  Button,
  Input,
  Select,
  Textarea,
  type SelectOption,
} from "@/components/ui";
import type { LoanPaymentFormData } from "../types";

// ============================================================================
// PROPS
// ============================================================================

interface LoanPaymentFormProps {
  loanName: string;
  outstandingAmount: number;
  suggestedEmiAmount?: number | undefined;
  onSubmit: (data: LoanPaymentFormData) => void;
  onCancel: () => void;
}

// ============================================================================
// OPTIONS
// ============================================================================

const paymentMethodOptions: SelectOption[] = [
  { value: "bank", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function LoanPaymentForm({
  loanName,
  outstandingAmount,
  suggestedEmiAmount,
  onSubmit,
  onCancel,
}: LoanPaymentFormProps): React.ReactNode {
  const today = new Date().toISOString().slice(0, 10);

  const [formData, setFormData] = useState<LoanPaymentFormData>({
    date: today,
    principalAmount: suggestedEmiAmount
      ? Math.round(suggestedEmiAmount * 0.7)
      : 0,
    interestAmount: suggestedEmiAmount
      ? Math.round(suggestedEmiAmount * 0.3)
      : 0,
    paymentMethod: "bank",
    referenceNumber: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalAmount = formData.principalAmount + formData.interestAmount;

  // Handlers
  const handleChange = (
    field: keyof LoanPaymentFormData,
    value: string | number | undefined
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (totalAmount <= 0) {
      newErrors.principalAmount = "Total payment must be greater than 0";
    }
    if (formData.principalAmount < 0) {
      newErrors.principalAmount = "Principal cannot be negative";
    }
    if (formData.interestAmount < 0) {
      newErrors.interestAmount = "Interest cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Loan Info */}
      <div className="p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Recording payment for</p>
            <p className="font-medium text-slate-900">{loanName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Outstanding</p>
            <p className="font-bold text-slate-900">
              {formatCurrency(outstandingAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Payment Date <span className="text-error">*</span>
        </label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => {
            handleChange("date", e.target.value);
          }}
          error={errors.date}
        />
      </div>

      {/* Principal and Interest */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Principal Amount
          </label>
          <Input
            type="number"
            value={formData.principalAmount || ""}
            onChange={(e) => {
              handleChange("principalAmount", parseFloat(e.target.value) || 0);
            }}
            placeholder="0.00"
            min={0}
            step={0.01}
            error={errors.principalAmount}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Interest Amount
          </label>
          <Input
            type="number"
            value={formData.interestAmount || ""}
            onChange={(e) => {
              handleChange("interestAmount", parseFloat(e.target.value) || 0);
            }}
            placeholder="0.00"
            min={0}
            step={0.01}
            error={errors.interestAmount}
          />
        </div>
      </div>

      {/* Total Amount Display */}
      <div className="p-3 bg-primary-50 rounded-lg flex items-center justify-between">
        <span className="text-sm font-medium text-primary-700">
          Total Payment
        </span>
        <span className="text-lg font-bold text-primary-700">
          {formatCurrency(totalAmount)}
        </span>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Payment Method
        </label>
        <Select
          options={paymentMethodOptions}
          value={formData.paymentMethod}
          onChange={(value) => {
            handleChange("paymentMethod", value as "cash" | "bank" | "cheque");
          }}
        />
      </div>

      {/* Reference Number */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Reference Number
        </label>
        <Input
          type="text"
          value={formData.referenceNumber ?? ""}
          onChange={(e) => {
            handleChange("referenceNumber", e.target.value || undefined);
          }}
          placeholder="Transaction ID, cheque number, etc."
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Notes
        </label>
        <Textarea
          value={formData.notes ?? ""}
          onChange={(e) => {
            handleChange("notes", e.target.value || undefined);
          }}
          placeholder="Additional notes..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Record Payment</Button>
      </div>
    </form>
  );
}
