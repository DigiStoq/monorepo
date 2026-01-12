import { useState } from "react";
import {
  Button,
  Input,
  NumberInput,
  Select,
  Textarea,
  type SelectOption,
} from "@/components/ui";
import type { Customer } from "@/features/customers";
import type { LoanFormData, LoanType, BankAccount } from "../types";

// ============================================================================
// PROPS
// ============================================================================

interface LoanFormProps {
  initialData?: Partial<LoanFormData>;
  customers?: Customer[];
  bankAccounts?: BankAccount[];
  onSubmit: (data: LoanFormData) => void;
  onCancel: () => void;
}

// ============================================================================
// OPTIONS
// ============================================================================

const typeOptions: SelectOption[] = [
  { value: "taken", label: "Loan Taken (We owe)" },
  { value: "given", label: "Loan Given (They owe us)" },
];

const interestTypeOptions: SelectOption[] = [
  { value: "simple", label: "Simple Interest" },
  { value: "compound", label: "Compound Interest" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function LoanForm({
  initialData,
  customers = [],
  bankAccounts = [],
  onSubmit,
  onCancel,
}: LoanFormProps): React.ReactNode {
  const today = new Date().toISOString().slice(0, 10);

  const [formData, setFormData] = useState<LoanFormData>({
    name: initialData?.name ?? "",
    type: initialData?.type ?? "taken",
    customerId: initialData?.customerId ?? "",
    lenderName: initialData?.lenderName ?? "",
    principalAmount: initialData?.principalAmount ?? 0,
    interestRate: initialData?.interestRate ?? 0,
    interestType: initialData?.interestType ?? "simple",
    startDate: initialData?.startDate ?? today,
    endDate: initialData?.endDate ?? "",
    emiAmount: initialData?.emiAmount,
    emiDay: initialData?.emiDay ?? 1,
    totalEmis: initialData?.totalEmis,
    linkedBankAccountId: initialData?.linkedBankAccountId ?? "",
    notes: initialData?.notes ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handlers
  const handleChange = (
    field: keyof LoanFormData,
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

    if (!formData.name.trim()) {
      newErrors.name = "Loan name is required";
    }
    if (!formData.principalAmount || formData.principalAmount <= 0) {
      newErrors.principalAmount = "Principal amount must be greater than 0";
    }
    if (formData.interestRate < 0) {
      newErrors.interestRate = "Interest rate cannot be negative";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (formData.type === "taken" && !formData.lenderName?.trim()) {
      newErrors.lenderName = "Lender name is required for loans taken";
    }
    if (formData.type === "given" && !formData.customerId) {
      newErrors.customerId = "Select a customer for loans given";
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

  // Build customer options
  const customerOptions: SelectOption[] = [
    { value: "", label: "Select Customer" },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Build bank account options
  const bankAccountOptions: SelectOption[] = [
    { value: "", label: "No Linked Account" },
    ...bankAccounts
      .filter((a) => a.isActive)
      .map((a) => ({ value: a.id, label: `${a.name} (${a.bankName})` })),
  ];

  const isEditing = Boolean(initialData);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Loan Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Loan Type <span className="text-error">*</span>
        </label>
        <Select
          options={typeOptions}
          value={formData.type}
          onChange={(value) => {
            handleChange("type", value as LoanType);
          }}
        />
      </div>

      {/* Loan Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Loan Name <span className="text-error">*</span>
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => {
            handleChange("name", e.target.value);
          }}
          placeholder="e.g., Equipment Loan, Personal Loan"
          error={errors.name}
        />
      </div>

      {/* Lender Name (for loans taken) */}
      {formData.type === "taken" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Lender Name <span className="text-error">*</span>
          </label>
          <Input
            type="text"
            value={formData.lenderName ?? ""}
            onChange={(e) => {
              handleChange("lenderName", e.target.value);
            }}
            placeholder="Bank or lender name"
            error={errors.lenderName}
          />
        </div>
      )}

      {/* Customer (for loans given) */}
      {formData.type === "given" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Borrower <span className="text-error">*</span>
          </label>
          <Select
            options={customerOptions}
            value={formData.customerId ?? ""}
            onChange={(value) => {
              handleChange("customerId", value);
            }}
          />
          {errors.customerId && (
            <p className="mt-1 text-sm text-error">{errors.customerId}</p>
          )}
        </div>
      )}

      {/* Principal Amount and Interest Rate */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Principal Amount <span className="text-error">*</span>
          </label>
          <NumberInput
            value={formData.principalAmount}
            onChange={(val) => {
              handleChange("principalAmount", val);
            }}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Interest Rate (% per annum)
          </label>
          <NumberInput
            value={formData.interestRate}
            onChange={(val) => {
              handleChange("interestRate", val);
            }}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Interest Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Interest Type
        </label>
        <Select
          options={interestTypeOptions}
          value={formData.interestType}
          onChange={(value) => {
            handleChange("interestType", value as "simple" | "compound");
          }}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Start Date <span className="text-error">*</span>
          </label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => {
              handleChange("startDate", e.target.value);
            }}
            error={errors.startDate}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            End Date
          </label>
          <Input
            type="date"
            value={formData.endDate ?? ""}
            onChange={(e) => {
              handleChange("endDate", e.target.value || undefined);
            }}
          />
        </div>
      </div>

      {/* EMI Details */}
      <div className="p-4 bg-slate-50 rounded-lg space-y-4">
        <h4 className="text-sm font-medium text-slate-700">
          EMI Details (Optional)
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              EMI Amount
            </label>
            <NumberInput
              value={formData.emiAmount}
              onChange={(val) => {
                handleChange("emiAmount", val || undefined);
              }}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">EMI Day</label>
            <Input
              type="number"
              value={formData.emiDay ?? ""}
              onChange={(e) => {
                handleChange(
                  "emiDay",
                  e.target.value ? parseInt(e.target.value) : undefined
                );
              }}
              placeholder="1-31"
              min={1}
              max={31}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Total EMIs
            </label>
            <Input
              type="number"
              value={formData.totalEmis ?? ""}
              onChange={(e) => {
                handleChange(
                  "totalEmis",
                  e.target.value ? parseInt(e.target.value) : undefined
                );
              }}
              placeholder="e.g., 36"
              min={1}
            />
          </div>
        </div>
      </div>

      {/* Linked Bank Account */}
      {bankAccounts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Linked Bank Account
          </label>
          <Select
            options={bankAccountOptions}
            value={formData.linkedBankAccountId ?? ""}
            onChange={(value) => {
              handleChange("linkedBankAccountId", value || undefined);
            }}
          />
          <p className="text-xs text-slate-500 mt-1">
            Payments will be automatically linked to this account
          </p>
        </div>
      )}

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
          placeholder="Additional notes about this loan..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? "Update Loan" : "Create Loan"}
        </Button>
      </div>
    </form>
  );
}
