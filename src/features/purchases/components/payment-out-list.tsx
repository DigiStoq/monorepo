import { cn } from "@/lib/cn";
import { Card, CardBody, Badge } from "@/components/ui";
import {
  Calendar,
  CreditCard,
  Banknote,
  Building2,
  ArrowDownCircle,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { PaymentOut, PaymentOutMode } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentOutListProps {
  payments: PaymentOut[];
  onPaymentClick: (payment: PaymentOut) => void;
  className?: string;
  hasActiveFilters?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

const paymentModeConfig: Record<
  PaymentOutMode,
  { label: string; icon: React.ReactNode; color: string }
> = {
  cash: {
    label: "Cash",
    icon: <Banknote className="h-4 w-4" />,
    color: "text-green-700",
  },
  bank: {
    label: "Bank Transfer",
    icon: <Building2 className="h-4 w-4" />,
    color: "text-blue-700",
  },
  card: {
    label: "Card",
    icon: <CreditCard className="h-4 w-4" />,
    color: "text-purple-700",
  },
  ach: {
    label: "ACH Transfer",
    icon: <Building2 className="h-4 w-4" />,
    color: "text-teal-700",
  },
  cheque: {
    label: "Cheque",
    icon: <CreditCard className="h-4 w-4" />,
    color: "text-orange-700",
  },
  other: {
    label: "Other",
    icon: <CreditCard className="h-4 w-4" />,
    color: "text-slate-700",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentOutList({
  payments,
  onPaymentClick,
  className,
  hasActiveFilters = false,
}: PaymentOutListProps): React.ReactNode {
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

  const displayPayments = payments;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Payment List */}
      <div className="space-y-2">
        {displayPayments.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <ArrowDownCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                No payments found
              </h3>
              <p className="text-slate-500">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Record your first payment to a supplier"}
              </p>
            </CardBody>
          </Card>
        ) : (
          displayPayments.map((payment) => {
            const modeConfig = paymentModeConfig[payment.paymentMode];

            return (
              <Card
                key={payment.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  onPaymentClick(payment);
                }}
              >
                <CardBody className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", modeConfig.color)}>
                        {modeConfig.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {payment.customerName}
                          </span>
                          <Badge variant="secondary" size="sm">
                            {payment.paymentNumber}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(payment.date)}
                          </span>
                          <span>{modeConfig.label}</span>
                          {payment.invoiceNumber && (
                            <span className="text-primary-600">
                              → {payment.invoiceNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-error">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.referenceNumber && (
                        <div className="text-xs text-slate-500">
                          Ref: {payment.referenceNumber}
                        </div>
                      )}
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
