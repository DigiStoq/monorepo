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
import { Building2, Hash, CreditCard, Wallet } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { BankAccountFormData, BankAccountType } from "../types";

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

// Check if string looks like an IBAN (starts with 2 letters)
function isIBANFormat(value: string): boolean {
  const cleaned = value.replace(/\s/g, "").toUpperCase();
  return /^[A-Z]{2}/.test(cleaned);
}

// Validate IBAN format (2 letters + digits, typically 15-34 chars)
function validateIBAN(value: string): { valid: boolean; message: string } {
  const cleaned = value.replace(/\s/g, "").toUpperCase();

  if (cleaned.length < 15 || cleaned.length > 34) {
    return { valid: false, message: "IBAN should be 15-34 characters" };
  }

  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(cleaned)) {
    return {
      valid: false,
      message: "Invalid IBAN format (2 letters followed by alphanumeric)",
    };
  }

  return { valid: true, message: "" };
}

// Validate account number (typically 8-20 digits)
function validateAccountNumber(value: string): {
  valid: boolean;
  message: string;
} {
  const cleaned = value.replace(/\s|-/g, "");

  if (cleaned.length < 8 || cleaned.length > 20) {
    return { valid: false, message: "Account number should be 8-20 digits" };
  }

  if (!/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      message: "Account number should only contain digits",
    };
  }

  return { valid: true, message: "" };
}

// Luhn algorithm for credit card validation
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    const char = digits.charAt(i);
    let digit = parseInt(char, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Validate credit card (16 digits with Luhn check)
function validateCreditCard(value: string): {
  valid: boolean;
  message: string;
} {
  const cleaned = value.replace(/\s|-/g, "");

  if (!/^\d{13,19}$/.test(cleaned)) {
    return { valid: false, message: "Card number should be 13-19 digits" };
  }

  if (!luhnCheck(cleaned)) {
    return { valid: false, message: "Invalid card number" };
  }

  return { valid: true, message: "" };
}

// Validate phone number (for wallet accounts)
function isPhoneNumber(value: string): boolean {
  const cleaned = value.replace(/\s|-/g, "");
  return /^\+?\d{10,15}$/.test(cleaned);
}

// Validate "Other" type (IBAN, phone, or alphanumeric identifier)
function validateOther(value: string): { valid: boolean; message: string } {
  const cleaned = value.replace(/\s/g, "");

  if (cleaned.length < 3) {
    return { valid: false, message: "Identifier too short" };
  }

  // Check if it's an IBAN
  if (isIBANFormat(value)) {
    return validateIBAN(value);
  }

  // Check if it's a phone number
  if (isPhoneNumber(value)) {
    return { valid: true, message: "" };
  }

  // Accept alphanumeric identifiers for wallets (PayPal, Stripe, crypto, etc.)
  if (/^[a-zA-Z0-9@._-]+$/.test(cleaned) && cleaned.length >= 3) {
    return { valid: true, message: "" };
  }

  return {
    valid: false,
    message: "Enter a valid IBAN, phone number, or wallet identifier",
  };
}

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
}: BankAccountFormProps): React.ReactNode {
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
  const [touched, setTouched] = useState(false);

  // Get field configuration based on account type
  const fieldConfig = useMemo(() => {
    switch (accountType) {
      case "savings":
      case "checking":
        return {
          label: isIBANFormat(accountNumber) ? "IBAN" : "Account Number",
          icon: Hash,
          placeholder: "Enter IBAN or account number",
          helperText:
            "Auto-detects IBAN (starts with 2 letters) or account number",
        };
      case "credit":
        return {
          label: "Card Number",
          icon: CreditCard,
          placeholder: "1234 5678 9012 3456",
          helperText: "Enter your 13-19 digit card number",
        };
      case "loan":
        return {
          label: "Loan Account Number",
          icon: Hash,
          placeholder: "Enter loan account number",
          helperText: "Enter your loan account identifier",
        };
      case "other":
        return {
          label: "Account/Wallet ID",
          icon: Wallet,
          placeholder: "IBAN, phone, email, or wallet address",
          helperText:
            "Supports IBAN, phone number, PayPal, Stripe, crypto wallet, etc.",
        };
      default:
        return {
          label: "Account Number",
          icon: Hash,
          placeholder: "Enter account number",
          helperText: "",
        };
    }
  }, [accountType, accountNumber]);

  // Validate account number based on type
  const accountValidation = useMemo(() => {
    if (!accountNumber) {
      return { valid: false, message: "" };
    }

    switch (accountType) {
      case "savings":
      case "checking":
        // Auto-detect IBAN vs account number
        if (isIBANFormat(accountNumber)) {
          return validateIBAN(accountNumber);
        }
        return validateAccountNumber(accountNumber);
      case "credit":
        return validateCreditCard(accountNumber);
      case "loan":
        // Loan accounts can have various formats
        if (accountNumber.length >= 5) {
          return { valid: true, message: "" };
        }
        return { valid: false, message: "Loan account number too short" };
      case "other":
        return validateOther(accountNumber);
      default:
        return { valid: true, message: "" };
    }
  }, [accountType, accountNumber]);

  // Format currency
  const { formatCurrency } = useCurrency();

  // Handle submit
  const handleSubmit = (): void => {
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

  const isValid = name && bankName && accountNumber && accountValidation.valid;

  // Show error only if field has been touched and there's an error
  const showAccountError = touched && accountNumber && !accountValidation.valid;

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
                  <fieldConfig.icon className="h-4 w-4 inline mr-1" />
                  {fieldConfig.label}
                </label>
                <Input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                  }}
                  onBlur={() => {
                    setTouched(true);
                  }}
                  placeholder={fieldConfig.placeholder}
                  error={
                    showAccountError ? accountValidation.message : undefined
                  }
                  state={
                    showAccountError
                      ? "error"
                      : touched && accountNumber && accountValidation.valid
                        ? "success"
                        : "default"
                  }
                />
                {!showAccountError && fieldConfig.helperText && (
                  <p className="mt-1 text-xs text-slate-500">
                    {fieldConfig.helperText}
                  </p>
                )}
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
                <NumberInput
                  value={openingBalance}
                  onChange={setOpeningBalance}
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
