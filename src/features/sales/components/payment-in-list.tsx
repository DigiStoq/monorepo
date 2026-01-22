import { cn } from "@/lib/cn";
import { Button, Badge } from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import {
  Plus,
  Banknote,
  Calendar,
  User,
  CreditCard,
  Building2,
  FileText,
  Wallet,
} from "lucide-react";
import type { PaymentIn, PaymentMode } from "../types";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentInListProps {
  payments: PaymentIn[] | null;
  isLoading?: boolean;
  onPaymentClick?: (payment: PaymentIn) => void;
  onRecordPayment?: () => void;
  className?: string;
  hasActiveFilters?: boolean;
}

// ============================================================================
// PAYMENT MODE CONFIG
// ============================================================================

const paymentModeConfig: Record<
  PaymentMode,
  { label: string; icon: typeof Banknote; color: string }
> = {
  cash: { label: "Cash", icon: Banknote, color: "text-green-600 bg-green-100" },
  bank: { label: "Bank", icon: Building2, color: "text-blue-600 bg-blue-100" },
  card: {
    label: "Card",
    icon: CreditCard,
    color: "text-purple-600 bg-purple-100",
  },
  ach: {
    label: "ACH Transfer",
    icon: Building2,
    color: "text-teal-600 bg-teal-100",
  },
  cheque: {
    label: "Cheque",
    icon: FileText,
    color: "text-text-secondary bg-muted",
  },
  other: { label: "Other", icon: Wallet, color: "text-gray-600 bg-gray-100" },
};

// ============================================================================
// PAYMENT CARD COMPONENT
// ============================================================================

interface PaymentCardProps {
  payment: PaymentIn;
  onClick?: () => void;
}

function PaymentCard({ payment, onClick }: PaymentCardProps): React.ReactNode {
  const mode = paymentModeConfig[payment.paymentMode];
  const ModeIcon = mode.icon;

  const { formatCurrency } = useCurrency();

  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 bg-card rounded-lg border border-border-primary",
        "hover:border-primary-300 hover:shadow-soft",
        "transition-all duration-200 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Payment Mode Icon */}
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            mode.color
          )}
        >
          <ModeIcon className="h-5 w-5" />
        </div>

        {/* Payment Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-text-heading">
              {payment.receiptNumber}
            </h3>
            <Badge variant="success" size="sm">
              {mode.label}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-sm text-text-secondary mb-1">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{payment.customerName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(payment.date)}
            </span>
            {payment.invoiceNumber && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Invoice: {payment.invoiceNumber}
              </span>
            )}
            {payment.referenceNumber && (
              <span>Ref: {payment.referenceNumber}</span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="font-semibold text-success text-lg">
            {formatCurrency(payment.amount)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PaymentInList({
  payments,
  isLoading,
  onPaymentClick,
  onRecordPayment,
  className,
  hasActiveFilters = false,
}: PaymentInListProps): React.ReactNode {
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} hasHeader={false} bodyLines={2} />
        ))}
      </div>
    );
  }

  // Items are already filtered by parent
  const displayPayments = payments ?? [];

  return (
    <div className={className}>
      {/* Payment List */}
      {displayPayments.length === 0 ? (
        <EmptyState
          variant={hasActiveFilters ? "search" : "empty"}
          title={hasActiveFilters ? "No payments found" : "No payments yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Record your first payment receipt"
          }
          action={
            !hasActiveFilters && (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onRecordPayment}
              >
                Record Payment
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-text-tertiary mb-2 px-1">
            {displayPayments.length}{" "}
            {displayPayments.length === 1 ? "payment" : "payments"}
          </p>

          {displayPayments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onClick={() => onPaymentClick?.(payment)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
