import { useState } from "react";
import { Button, Input, Select, Textarea, type SelectOption } from "@/components/ui";
import type { Customer } from "@/features/customers";

// ============================================================================
// TYPES
// ============================================================================

export interface BankTransactionFormData {
  date: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  description: string;
  referenceNumber?: string;
  relatedCustomerId?: string;
  relatedInvoiceNumber?: string;
  transferToAccountId?: string;
}

interface BankTransactionFormProps {
  customers?: Customer[];
  bankAccounts?: Array<{ id: string; name: string }>;
  onSubmit: (data: BankTransactionFormData) => void;
  onCancel: () => void;
}

// ============================================================================
// OPTIONS
// ============================================================================

const transactionTypeOptions: SelectOption[] = [
  { value: "deposit", label: "Deposit" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "transfer", label: "Transfer to Another Account" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function BankTransactionForm({
  customers = [],
  bankAccounts = [],
  onSubmit,
  onCancel,
}: BankTransactionFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [formData, setFormData] = useState<BankTransactionFormData>({
    date: today,
    type: "deposit",
    amount: 0,
    description: "",
    referenceNumber: "",
    relatedCustomerId: "",
    relatedInvoiceNumber: "",
    transferToAccountId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handlers
  const handleChange = (field: keyof BankTransactionFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (formData.type === "transfer" && !formData.transferToAccountId) {
      newErrors.transferToAccountId = "Select destination account";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  // Build customer options
  const customerOptions: SelectOption[] = [
    { value: "", label: "Select Customer (Optional)" },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Build bank account options for transfers
  const accountOptions: SelectOption[] = [
    { value: "", label: "Select Account" },
    ...bankAccounts.map((a) => ({ value: a.id, label: a.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Transaction Type <span className="text-error">*</span>
        </label>
        <Select
          options={transactionTypeOptions}
          value={formData.type}
          onChange={(value) => handleChange("type", value)}
        />
      </div>

      {/* Date and Amount Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date <span className="text-error">*</span>
          </label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            error={errors.date}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Amount <span className="text-error">*</span>
          </label>
          <Input
            type="number"
            value={formData.amount || ""}
            onChange={(e) => handleChange("amount", parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            min={0}
            step={0.01}
            error={errors.amount}
          />
        </div>
      </div>

      {/* Transfer Destination (only for transfers) */}
      {formData.type === "transfer" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Transfer To <span className="text-error">*</span>
          </label>
          <Select
            options={accountOptions}
            value={formData.transferToAccountId || ""}
            onChange={(value) => handleChange("transferToAccountId", value)}
          />
          {errors.transferToAccountId && (
            <p className="mt-1 text-sm text-error">{errors.transferToAccountId}</p>
          )}
        </div>
      )}

      {/* Reference Number */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Reference Number
        </label>
        <Input
          type="text"
          value={formData.referenceNumber || ""}
          onChange={(e) => handleChange("referenceNumber", e.target.value)}
          placeholder="e.g., CHK-1234, TRF-001"
        />
      </div>

      {/* Related Customer (for deposits/withdrawals) */}
      {formData.type !== "transfer" && customers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Related Customer
          </label>
          <Select
            options={customerOptions}
            value={formData.relatedCustomerId || ""}
            onChange={(value) => handleChange("relatedCustomerId", value)}
          />
        </div>
      )}

      {/* Related Invoice */}
      {formData.type !== "transfer" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Related Invoice/Bill Number
          </label>
          <Input
            type="text"
            value={formData.relatedInvoiceNumber || ""}
            onChange={(e) => handleChange("relatedInvoiceNumber", e.target.value)}
            placeholder="e.g., INV-1234"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description <span className="text-error">*</span>
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter transaction description..."
          rows={2}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-error">{errors.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {formData.type === "deposit" && "Add Deposit"}
          {formData.type === "withdrawal" && "Add Withdrawal"}
          {formData.type === "transfer" && "Transfer Funds"}
        </Button>
      </div>
    </form>
  );
}
