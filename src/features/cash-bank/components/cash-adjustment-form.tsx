import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardBody,
  Button,
  Input,
  NumberInput,
  Textarea,
} from "@/components/ui";
import { ArrowUpCircle, ArrowDownCircle, Calendar } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { CashAdjustmentFormData } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface CashAdjustmentFormProps {
  currentBalance: number;
  isLoading?: boolean;
  onSubmit: (data: CashAdjustmentFormData) => void;
  onCancel: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CashAdjustmentForm({
  currentBalance,
  isLoading,
  onSubmit,
  onCancel,
  className,
}: CashAdjustmentFormProps): React.ReactNode {
  // Form state
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<"add" | "subtract">("add");
  const [date, setDate] = useState<string>(defaultDate);
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");

  // Calculate new balance
  const newBalance =
    type === "add" ? currentBalance + amount : currentBalance - amount;

  // Format currency
  const { formatCurrency } = useCurrency();

  // Handle submit
  const handleSubmit = (): void => {
    if (amount <= 0 || !description) return;

    const formData: CashAdjustmentFormData = {
      date,
      type,
      amount,
      description,
    };

    onSubmit(formData);
  };

  const isValid = amount > 0 && description;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Adjustment Type Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setType("add");
          }}
          className={cn(
            "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
            type === "add"
              ? "border-success bg-success-light text-success"
              : "border-slate-200 text-slate-500 hover:border-slate-300"
          )}
        >
          <ArrowUpCircle className="h-5 w-5" />
          <span className="font-medium">Add Cash</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setType("subtract");
          }}
          className={cn(
            "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
            type === "subtract"
              ? "border-error bg-error-light text-error"
              : "border-slate-200 text-slate-500 hover:border-slate-300"
          )}
        >
          <ArrowDownCircle className="h-5 w-5" />
          <span className="font-medium">Subtract Cash</span>
        </button>
      </div>

      {/* Form Fields */}
      <Card>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount
            </label>
            <NumberInput
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />
          </div>

          <div>
            <Textarea
              label="Description"
              placeholder="Reason for this adjustment..."
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Balance Preview */}
      <Card className="bg-slate-50">
        <CardBody className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Current Balance</span>
            <span className="font-medium">
              {formatCurrency(currentBalance)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Adjustment</span>
            <span
              className={cn(
                "font-medium",
                type === "add" ? "text-success" : "text-error"
              )}
            >
              {type === "add" ? "+" : "-"}
              {formatCurrency(amount)}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between">
            <span className="font-semibold text-slate-900">New Balance</span>
            <span
              className={cn(
                "font-bold",
                newBalance >= 0 ? "text-primary-600" : "text-error"
              )}
            >
              {formatCurrency(newBalance)}
            </span>
          </div>
        </CardBody>
      </Card>

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
          Save Adjustment
        </Button>
      </div>
    </div>
  );
}
