import { useState } from "react";
import {
  Button,
  Input,
  Select,
  Textarea,
  type SelectOption,
} from "@/components/ui";
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
  bankAccounts?: { id: string; name: string }[];
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
}: BankTransactionFormProps): React.ReactNode {
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
  const handleChange = (
    field: keyof BankTransactionFormData,
    value: string | number
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

  const handleSubmit = (e: React.FormEvent): void => {
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
      <Select
        label="Transaction Type"
        required
        options={transactionTypeOptions}
        value={formData.type}
        onChange={(value) => {
          handleChange("type", value);
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          required
          type="date"
          value={formData.date}
          onChange={(e) => {
            handleChange("date", e.target.value);
          }}
          error={errors.date}
        />
        <Input
          label="Amount"
          required
          type="number"
          value={formData.amount || ""}
          onChange={(e) => {
            handleChange("amount", parseFloat(e.target.value) || 0);
          }}
          placeholder="0.00"
          min={0}
          step={0.01}
          error={errors.amount}
        />
      </div>

      {/* Transfer Destination (only for transfers) */}
      {formData.type === "transfer" && (
        <Select
          label="Transfer To"
          required
          options={accountOptions}
          value={formData.transferToAccountId ?? ""}
          onChange={(value) => {
            handleChange("transferToAccountId", value);
          }}
          error={errors.transferToAccountId}
        />
      )}

      <Input
        label="Reference Number"
        showOptionalLabel
        type="text"
        value={formData.referenceNumber ?? ""}
        onChange={(e) => {
          handleChange("referenceNumber", e.target.value);
        }}
        placeholder="e.g., CHK-1234, TRF-001"
      />

      {/* Related Customer (for deposits/withdrawals) */}
      {formData.type !== "transfer" && customers.length > 0 && (
        <Select
          label="Related Customer"
          showOptionalLabel
          options={customerOptions}
          value={formData.relatedCustomerId ?? ""}
          onChange={(value) => {
            handleChange("relatedCustomerId", value);
          }}
          searchable
          searchPlaceholder="Search customers..."
        />
      )}

      {/* Related Invoice */}
      {formData.type !== "transfer" && (
        <Input
          label="Related Invoice/Bill Number"
          showOptionalLabel
          type="text"
          value={formData.relatedInvoiceNumber ?? ""}
          onChange={(e) => {
            handleChange("relatedInvoiceNumber", e.target.value);
          }}
          placeholder="e.g., INV-1234"
        />
      )}

      <Textarea
        label="Description"
        required
        value={formData.description}
        onChange={(e) => {
          handleChange("description", e.target.value);
        }}
        placeholder="Enter transaction description..."
        rows={2}
        error={errors.description}
      />

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
