import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import { TableSkeleton } from "@/components/common";
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// TYPES
// ============================================================================

export type TransactionType =
  | "sale"
  | "purchase"
  | "payment-in"
  | "payment-out";

export interface Transaction {
  id: string;
  type: TransactionType;
  name: string;
  amount: number;
  date: string;
  invoiceNumber?: string;
}

export interface RecentTransactionsProps {
  transactions: Transaction[] | null;
  isLoading?: boolean;
  onViewAll?: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const typeConfig: Record<
  TransactionType,
  {
    label: string;
    color: "success" | "error" | "primary" | "warning";
    isIncoming: boolean;
  }
> = {
  sale: { label: "Sale", color: "success", isIncoming: true },
  purchase: { label: "Purchase", color: "error", isIncoming: false },
  "payment-in": { label: "Payment In", color: "success", isIncoming: true },
  "payment-out": { label: "Payment Out", color: "error", isIncoming: false },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function RecentTransactions({
  transactions,
  isLoading,
  onViewAll,
  onTransactionClick,
  className,
}: RecentTransactionsProps): React.ReactNode {
  const { formatCurrency } = useCurrency();

  if (isLoading) {
    return <TableSkeleton className={className} rows={5} columns={4} />;
  }

  const displayTransactions = transactions ?? [];

  return (
    <Card className={className}>
      <CardHeader
        title="Recent Transactions"
        subtitle="Latest activity"
        action={
          onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )
        }
      />
      <CardBody className="pt-0 px-0">
        {displayTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No recent transactions
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayTransactions.map((transaction) => {
              const config = typeConfig[transaction.type];
              const isIncoming = config.isIncoming;

              return (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() => onTransactionClick?.(transaction)}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-3",
                    "hover:bg-slate-50 transition-colors",
                    "text-left"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      isIncoming ? "bg-success-light" : "bg-error-light"
                    )}
                  >
                    {isIncoming ? (
                      <ArrowDownLeft className="h-5 w-5 text-success" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-error" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">
                        {transaction.name}
                      </span>
                      <Badge variant={config.color} size="sm">
                        {config.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {transaction.invoiceNumber &&
                        `${transaction.invoiceNumber} • `}
                      {transaction.date}
                    </div>
                  </div>

                  {/* Amount */}
                  <div
                    className={cn(
                      "text-right font-semibold shrink-0",
                      isIncoming ? "text-success" : "text-error"
                    )}
                  >
                    {isIncoming ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
