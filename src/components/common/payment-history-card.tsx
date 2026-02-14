import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import { DollarSign, Calendar, CreditCard, Trash2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { PaymentIn } from "@/features/sales/types";
import type { PaymentOut } from "@/features/purchases/types";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentHistoryCardProps {
  payments: (PaymentIn | PaymentOut)[];
  isLoading?: boolean;
  onDeletePayment?: (id: string) => void;
  type: "in" | "out";
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentHistoryCard({
  payments,
  isLoading,
  onDeletePayment,
  type,
  className,
}: PaymentHistoryCardProps): React.ReactNode {
  const { formatCurrency } = useCurrency();

  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getPaymentNumber = (p: PaymentIn | PaymentOut): string => {
    if ("receiptNumber" in p) return p.receiptNumber;
    if ("paymentNumber" in p) return p.paymentNumber;
    return "-";
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-slate-500" />
              <span>Payment History</span>
            </div>
          }
        />
        <CardBody>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-slate-500" />
            <span>Payment History</span>
            {payments.length > 0 && (
              <Badge variant="secondary" size="sm">
                {payments.length}
              </Badge>
            )}
          </div>
        }
        action={
          totalPaid > 0 ? (
            <span className="text-sm font-medium text-success">
              Total: {formatCurrency(totalPaid)}
            </span>
          ) : undefined
        }
      />
      <CardBody className="p-0">
        {payments.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            No payments recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-success-light flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-heading">
                      {getPaymentNumber(payment)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {formatDate(payment.date)}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 capitalize">
                        {payment.paymentMode}
                      </span>
                    </div>
                    {payment.referenceNumber && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ref: {payment.referenceNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-bold ${type === "in" ? "text-success" : "text-error"}`}
                  >
                    {type === "in" ? "+" : "-"}
                    {formatCurrency(payment.amount)}
                  </span>
                  {onDeletePayment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onDeletePayment(payment.id);
                      }}
                      className="text-slate-400 hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
