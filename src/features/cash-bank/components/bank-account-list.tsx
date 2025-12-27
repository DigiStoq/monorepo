import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, Input, Badge, Select, type SelectOption } from "@/components/ui";
import {
  Search,
  Building2,
  CreditCard,
  Wallet,
  PiggyBank,
  Landmark,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { BankAccount, BankAccountType } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface BankAccountListProps {
  accounts: BankAccount[];
  onAccountClick: (account: BankAccount) => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const accountTypeConfig: Record<BankAccountType, { label: string; icon: React.ReactNode; color: string }> = {
  savings: { label: "Savings", icon: <PiggyBank className="h-4 w-4" />, color: "bg-green-100 text-green-700" },
  checking: { label: "Checking", icon: <Wallet className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" },
  credit: { label: "Credit Card", icon: <CreditCard className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
  loan: { label: "Loan", icon: <Landmark className="h-4 w-4" />, color: "bg-orange-100 text-orange-700" },
  other: { label: "Other", icon: <MoreHorizontal className="h-4 w-4" />, color: "bg-slate-100 text-slate-700" },
};

const typeOptions: SelectOption[] = [
  { value: "all", label: "All Account Types" },
  { value: "savings", label: "Savings" },
  { value: "checking", label: "Checking" },
  { value: "credit", label: "Credit Card" },
  { value: "loan", label: "Loan" },
  { value: "other", label: "Other" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function BankAccountList({ accounts, onAccountClick, className }: BankAccountListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<BankAccountType | "all">("all");

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        account.name.toLowerCase().includes(search.toLowerCase()) ||
        account.bankName.toLowerCase().includes(search.toLowerCase()) ||
        account.accountNumber.includes(search);

      const matchesType = typeFilter === "all" || account.accountType === typeFilter;

      return matchesSearch && matchesType && account.isActive;
    });
  }, [accounts, search, typeFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    const positive = filteredAccounts
      .filter((a) => a.currentBalance >= 0)
      .reduce((sum, a) => sum + a.currentBalance, 0);
    const negative = filteredAccounts
      .filter((a) => a.currentBalance < 0)
      .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
    return { positive, negative, net: positive - negative };
  }, [filteredAccounts]);

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  // Mask account number
  const maskAccountNumber = (num: string) => {
    if (num.length <= 4) return num;
    return "••••" + num.slice(-4);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as BankAccountType | "all")}
          className="w-48"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardBody className="py-3 text-center">
            <div className="flex items-center justify-center gap-1 text-success mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Assets</span>
            </div>
            <p className="text-xl font-bold text-success">{formatCurrency(totals.positive)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-3 text-center">
            <div className="flex items-center justify-center gap-1 text-error mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs">Liabilities</span>
            </div>
            <p className="text-xl font-bold text-error">{formatCurrency(totals.negative)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-primary-50 to-teal-50 border-primary-100">
          <CardBody className="py-3 text-center">
            <p className="text-xs text-slate-600 mb-1">Net Balance</p>
            <p className={cn("text-xl font-bold", totals.net >= 0 ? "text-primary-600" : "text-error")}>
              {formatCurrency(totals.net)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Account List */}
      <div className="space-y-2">
        {filteredAccounts.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No accounts found</h3>
              <p className="text-slate-500">
                {search || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first bank account"}
              </p>
            </CardBody>
          </Card>
        ) : (
          filteredAccounts.map((account) => {
            const config = accountTypeConfig[account.accountType];
            const isPositive = account.currentBalance >= 0;

            return (
              <Card
                key={account.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onAccountClick(account)}
              >
                <CardBody className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", config.color)}>
                        {config.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {account.name}
                          </span>
                          <Badge variant="secondary" size="sm">
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                          <span>{account.bankName}</span>
                          <span className="font-mono">{maskAccountNumber(account.accountNumber)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-lg font-bold", isPositive ? "text-success" : "text-error")}>
                        {formatCurrency(account.currentBalance)}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
