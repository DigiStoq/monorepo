import { Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";
import {
  X,
  Edit2,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Percent,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useCurrency } from "@/hooks/useCurrency";
import type { Loan, LoanPayment, LoanStatus } from "../types";

// ============================================================================
// PROPS
// ============================================================================

interface LoanDetailProps {
  loan: Loan;
  payments: LoanPayment[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPayment: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const statusConfig: Record<
  LoanStatus,
  { label: string; variant: "success" | "warning" | "error" | "default" }
> = {
  active: { label: "Active", variant: "success" },
  closed: { label: "Closed", variant: "default" },
  defaulted: { label: "Defaulted", variant: "error" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function LoanDetail({
  loan,
  payments,
  onClose,
  onEdit,
  onDelete,
  onAddPayment,
}: LoanDetailProps): React.ReactNode {
  const { formatCurrency } = useCurrency();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const config = statusConfig[loan.status];
  const progress = loan.totalEmis ? (loan.paidEmis / loan.totalEmis) * 100 : 0;
  const totalPaid = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalInterestPaid = payments.reduce(
    (sum, p) => sum + p.interestAmount,
    0
  );
  const totalPrincipalPaid = payments.reduce(
    (sum, p) => sum + p.principalAmount,
    0
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              loan.type === "taken" ? "bg-red-100" : "bg-green-100"
            )}
          >
            {loan.type === "taken" ? (
              <ArrowDownLeft className="h-5 w-5 text-red-600" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">{loan.name}</h2>
            <p className="text-sm text-slate-500">
              {loan.type === "taken" ? "Loan Taken" : "Loan Given"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status and Amount */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={config.variant}>{config.label}</Badge>
              <p
                className={cn(
                  "text-2xl font-bold",
                  loan.type === "taken" ? "text-red-600" : "text-green-600"
                )}
              >
                {formatCurrency(loan.outstandingAmount)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Principal Amount</p>
                <p className="font-medium">
                  {formatCurrency(loan.principalAmount)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Interest Rate</p>
                <p className="font-medium">
                  {loan.interestRate}% ({loan.interestType})
                </p>
              </div>
            </div>

            {/* EMI Progress */}
            {loan.totalEmis && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500">EMI Progress</span>
                  <span className="font-medium">
                    {loan.paidEmis} / {loan.totalEmis} paid
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      loan.type === "taken" ? "bg-red-500" : "bg-green-500"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {loan.emiAmount && (
                  <p className="text-sm text-slate-500 mt-2">
                    EMI Amount: {formatCurrency(loan.emiAmount)} on day{" "}
                    {loan.emiDay}
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Details */}
        <Card>
          <CardBody className="p-4 space-y-3">
            {loan.type === "taken" && loan.lenderName && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Lender</p>
                  <p className="text-sm font-medium">{loan.lenderName}</p>
                </div>
              </div>
            )}
            {loan.type === "given" && loan.customerName && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Borrower</p>
                  <p className="text-sm font-medium">{loan.customerName}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Start Date</p>
                <p className="text-sm font-medium">
                  {formatDate(loan.startDate)}
                </p>
              </div>
            </div>
            {loan.endDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">End Date</p>
                  <p className="text-sm font-medium">
                    {formatDate(loan.endDate)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Percent className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Interest Type</p>
                <p className="text-sm font-medium capitalize">
                  {loan.interestType}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <h3 className="font-medium text-slate-900">Payment Summary</h3>
          </CardHeader>
          <CardBody className="p-4 pt-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500">Total Paid</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Principal</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(totalPrincipalPaid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Interest</p>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(totalInterestPaid)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Payment History</h3>
              {loan.status === "active" && (
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-3 w-3" />}
                  onClick={onAddPayment}
                >
                  Add Payment
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {payments.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <p>No payments recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <div key={payment.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatCurrency(payment.totalAmount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Principal: {formatCurrency(payment.principalAmount)} |
                          Interest: {formatCurrency(payment.interestAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">
                          {formatDate(payment.date)}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                          {payment.paymentMethod}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Notes */}
        {loan.notes && (
          <Card>
            <CardHeader>
              <h3 className="font-medium text-slate-900">Notes</h3>
            </CardHeader>
            <CardBody className="p-4 pt-0">
              <p className="text-sm text-slate-600">{loan.notes}</p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            leftIcon={<Edit2 className="h-4 w-4" />}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-error hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
