import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody, Button } from "@/components/ui";
import {
  X,
  Trash2,
  Edit2,
  Building2,
  CreditCard,
  Hash,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  Wallet,
  Landmark,
  MoreHorizontal,
} from "lucide-react";
import type { BankAccount, BankAccountType, BankTransaction } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface BankAccountDetailProps {
  account: BankAccount;
  transactions?: BankTransaction[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTransaction: () => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const accountTypeConfig: Record<
  BankAccountType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  savings: {
    label: "Savings Account",
    icon: <PiggyBank className="h-5 w-5" />,
    color: "bg-green-100 text-green-700",
  },
  checking: {
    label: "Checking Account",
    icon: <Wallet className="h-5 w-5" />,
    color: "bg-blue-100 text-blue-700",
  },
  credit: {
    label: "Credit Card",
    icon: <CreditCard className="h-5 w-5" />,
    color: "bg-purple-100 text-purple-700",
  },
  loan: {
    label: "Loan Account",
    icon: <Landmark className="h-5 w-5" />,
    color: "bg-orange-100 text-orange-700",
  },
  other: {
    label: "Other Account",
    icon: <MoreHorizontal className="h-5 w-5" />,
    color: "bg-slate-100 text-slate-700",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function BankAccountDetail({
  account,
  transactions = [],
  onClose,
  onEdit,
  onDelete,
  onAddTransaction,
  className,
}: BankAccountDetailProps): React.ReactNode {
  const config = accountTypeConfig[account.accountType];
  const isPositive = account.currentBalance >= 0;

  // Format currency
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Account Details
          </h2>
          <p className="text-sm text-slate-500">{account.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Balance Card */}
        <Card
          className={cn(
            "border",
            isPositive
              ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
              : "bg-gradient-to-br from-red-50 to-orange-50 border-red-100"
          )}
        >
          <CardBody className="text-center py-6">
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3",
                config.color
              )}
            >
              {config.icon}
              <span className="text-sm font-medium">{config.label}</span>
            </div>
            <p className="text-sm text-slate-600 mb-1">Current Balance</p>
            <p
              className={cn(
                "text-3xl font-bold",
                isPositive ? "text-success" : "text-error"
              )}
            >
              {formatCurrency(account.currentBalance)}
            </p>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onAddTransaction}>
            <ArrowUpCircle className="h-4 w-4 mr-1 text-success" />
            Deposit
          </Button>
          <Button variant="outline" size="sm" onClick={onAddTransaction}>
            <ArrowDownCircle className="h-4 w-4 mr-1 text-error" />
            Withdraw
          </Button>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader title="Account Information" />
          <CardBody className="space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Bank Name</p>
                <p className="font-medium text-slate-900">{account.bankName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Account Number</p>
                <p className="font-medium text-slate-900 font-mono">
                  {account.accountNumber}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Opening Balance</p>
                <p className="font-medium text-slate-900">
                  {formatCurrency(account.openingBalance)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader title="Recent Transactions" />
          <CardBody className="p-0">
            {transactions.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No transactions yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((txn) => (
                  <div
                    key={txn.id}
                    className="p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-1.5 rounded-full",
                          txn.type === "deposit"
                            ? "bg-success-light"
                            : "bg-error-light"
                        )}
                      >
                        {txn.type === "deposit" ? (
                          <ArrowUpCircle className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-error" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {txn.description}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(txn.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "font-medium",
                        txn.type === "deposit" ? "text-success" : "text-error"
                      )}
                    >
                      {txn.type === "deposit" ? "+" : "-"}
                      {formatCurrency(txn.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Notes */}
        {account.notes && (
          <Card>
            <CardHeader title="Notes" />
            <CardBody>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {account.notes}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Metadata */}
        <div className="text-xs text-slate-400 space-y-1">
          <p>Created: {new Date(account.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(account.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <Button variant="outline" size="sm" onClick={onEdit} fullWidth>
          <Edit2 className="h-4 w-4 mr-1" />
          Edit Account
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="w-full text-error hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Account
        </Button>
      </div>
    </div>
  );
}
