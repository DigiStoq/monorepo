import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardBody,
  Input,
  Select,
  type SelectOption,
} from "@/components/ui";
import {
  Search,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings2,
  Calendar,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { CashTransaction } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface CashTransactionListProps {
  transactions: CashTransaction[];
  currentBalance: number;
  onTransactionClick?: (transaction: CashTransaction) => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const typeConfig: Record<
  CashTransaction["type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  in: {
    label: "Cash In",
    icon: <ArrowUpCircle className="h-4 w-4" />,
    color: "text-success",
  },
  out: {
    label: "Cash Out",
    icon: <ArrowDownCircle className="h-4 w-4" />,
    color: "text-error",
  },
  adjustment: {
    label: "Adjustment",
    icon: <Settings2 className="h-4 w-4" />,
    color: "text-warning",
  },
};

const typeOptions: SelectOption[] = [
  { value: "all", label: "All Transactions" },
  { value: "in", label: "Cash In" },
  { value: "out", label: "Cash Out" },
  { value: "adjustment", label: "Adjustments" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CashTransactionList({
  transactions,
  currentBalance,
  onTransactionClick,
  className,
}: CashTransactionListProps): React.ReactNode {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CashTransaction["type"] | "all">(
    "all"
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        txn.description.toLowerCase().includes(search.toLowerCase()) ||
        (txn.relatedCustomerName
          ?.toLowerCase()
          .includes(search.toLowerCase()) ??
          false);

      const matchesType = typeFilter === "all" || txn.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, search, typeFilter]);

  // Calculate totals for filtered
  const totals = useMemo(() => {
    const cashIn = filteredTransactions
      .filter((t) => t.type === "in")
      .reduce((sum, t) => sum + t.amount, 0);
    const cashOut = filteredTransactions
      .filter((t) => t.type === "out")
      .reduce((sum, t) => sum + t.amount, 0);
    return { cashIn, cashOut };
  }, [filteredTransactions]);

  // Format currency
  const { formatCurrency } = useCurrency();

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
    <div className={cn("space-y-4", className)}>
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-100">
        <CardBody className="text-center py-8">
          <Wallet className="h-10 w-10 text-teal-600 mx-auto mb-2" />
          <p className="text-sm text-slate-600 mb-1">Cash in Hand</p>
          <p className="text-4xl font-bold text-teal-700">
            {formatCurrency(currentBalance)}
          </p>
        </CardBody>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-xs text-slate-500">Cash In</p>
                <p className="font-semibold text-success">
                  {formatCurrency(totals.cashIn)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-error" />
              <div>
                <p className="text-xs text-slate-500">Cash Out</p>
                <p className="font-semibold text-error">
                  {formatCurrency(totals.cashOut)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(value) => {
            setTypeFilter(value as CashTransaction["type"] | "all");
          }}
          className="w-48"
        />
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Wallet className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                No transactions found
              </h3>
              <p className="text-slate-500">
                {search || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Record your first cash transaction"}
              </p>
            </CardBody>
          </Card>
        ) : (
          filteredTransactions.map((txn) => {
            const config = typeConfig[txn.type];

            return (
              <Card
                key={txn.id}
                className={cn(
                  "transition-shadow",
                  onTransactionClick && "cursor-pointer hover:shadow-md"
                )}
                onClick={() => onTransactionClick?.(txn)}
              >
                <CardBody className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          txn.type === "in"
                            ? "bg-success-light"
                            : txn.type === "out"
                              ? "bg-error-light"
                              : "bg-warning-light"
                        )}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {txn.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(txn.date)}
                          </span>
                          {txn.relatedCustomerName && (
                            <>
                              <span>•</span>
                              <span>{txn.relatedCustomerName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-lg font-bold", config.color)}>
                        {txn.type === "in"
                          ? "+"
                          : txn.type === "out"
                            ? "-"
                            : ""}
                        {formatCurrency(txn.amount)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Bal: {formatCurrency(txn.balance)}
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
