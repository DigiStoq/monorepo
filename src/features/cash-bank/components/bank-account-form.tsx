import { useState } from "react";
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
import { Building2, Hash, CreditCard } from "lucide-react";
import type { BankAccountFormData, BankAccountType } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface BankAccountFormProps {
  initialData?: Partial<BankAccountFormData>;
  isLoading?: boolean;
  onSubmit: (data: BankAccountFormData) => void;
  onCancel: () => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const accountTypeOptions: SelectOption[] = [
  { value: "savings", label: "Savings Account" },
  { value: "checking", label: "Checking Account" },
  { value: "credit", label: "Credit Card" },
  { value: "loan", label: "Loan Account" },
  { value: "other", label: "Other" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function BankAccountForm({
  initialData,
  isLoading,
  onSubmit,
  onCancel,
  className,
}: BankAccountFormProps) {
  // Form state
  const [name, setName] = useState(initialData?.name ?? "");
  const [bankName, setBankName] = useState(initialData?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(
    initialData?.accountNumber ?? ""
  );
  const [accountType, setAccountType] = useState<BankAccountType>(
    initialData?.accountType ?? "checking"
  );
  const [openingBalance, setOpeningBalance] = useState<number>(
    initialData?.openingBalance ?? 0
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  // Handle submit
  const handleSubmit = () => {
    if (!name || !bankName || !accountNumber) return;

    const formData: BankAccountFormData = {
      name,
      bankName,
      accountNumber,
      accountType,
      openingBalance,
      notes: notes || undefined,
    };

    onSubmit(formData);
  };

  const isValid = name && bankName && accountNumber;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Account Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Account Details" />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  placeholder="e.g., Business Checking"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Account Type
                </label>
                <Select
                  options={accountTypeOptions}
                  value={accountType}
                  onChange={(value) => {
                    setAccountType(value as BankAccountType);
                  }}
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
                  onChange={(e) => {
                    setBankName(e.target.value);
                  }}
                  placeholder="e.g., Chase Bank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Hash className="h-4 w-4 inline mr-1" />
                  Account Number
                </label>
                <Input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                  }}
                  placeholder="Enter account number"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Balance & Notes */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Opening Balance" />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Current Balance
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => {
                    setOpeningBalance(parseFloat(e.target.value) || 0);
                  }}
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Enter the current balance in this account. Use negative for
                  credit cards or loans.
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Textarea
                label="Notes (Optional)"
                placeholder="Add any notes about this account..."
                rows={4}
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
              openingBalance >= 0
                ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
                : "bg-gradient-to-br from-red-50 to-orange-50 border-red-100"
            )}
          >
            <CardBody className="text-center py-6">
              <p className="text-sm text-slate-600 mb-1">Opening Balance</p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  openingBalance >= 0 ? "text-success" : "text-error"
                )}
              >
                {formatCurrency(openingBalance)}
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
          Save Account
        </Button>
      </div>
    </div>
  );
}
