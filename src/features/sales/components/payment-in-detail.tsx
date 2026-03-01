import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";
import {
  X,
  Printer,
  Share2,
  Trash2,
  Edit,
  Calendar,
  User,
  Hash,
  FileText,
  Banknote,
  Building2,
  CreditCard,
  Wallet,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { PaymentIn, PaymentMode } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentInDetailProps {
  payment: PaymentIn;
  onClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  className?: string;
}

// ============================================================================
// PAYMENT MODE CONFIG
// ============================================================================

const paymentModeConfig: Record<
  PaymentMode,
  { label: string; icon: typeof Banknote; color: string }
> = {
  cash: { label: "Cash", icon: Banknote, color: "text-green-600" },
  bank: {
    label: "Bank Transfer",
    icon: Building2,
    color: "text-blue-600",
  },
  card: {
    label: "Card",
    icon: CreditCard,
    color: "text-purple-600",
  },
  ach: {
    label: "ACH Transfer",
    icon: Building2,
    color: "text-teal-600",
  },
  cheque: {
    label: "Cheque",
    icon: FileText,
    color: "text-slate-600",
  },
  other: { label: "Other", icon: Wallet, color: "text-gray-600" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentInDetail({
  payment,
  onClose,
  onEdit,
  onDelete,
  onPrint,
  onShare,
  className,
}: PaymentInDetailProps): React.ReactNode {
  const mode = paymentModeConfig[payment.paymentMode];
  const ModeIcon = mode.icon;

  const { formatCurrency } = useCurrency();

  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (dateStr: string): string =>
    new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-text-heading">
            {payment.receiptNumber}
          </h2>
          <p className="text-sm text-slate-500">Payment Receipt</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Amount Card */}
        <Card className="bg-success-light border-success/20">
          <CardBody className="text-center py-6">
            <p className="text-sm text-success-dark font-medium mb-1">
              Amount Received
            </p>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(payment.amount)}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge variant="success" size="md">
                <ModeIcon className="h-4 w-4 mr-1" />
                {mode.label}
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader title="Payment Details" />
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Customer</p>
                <p className="font-medium text-text-heading">
                  {payment.customerName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-medium text-text-heading">
                  {formatDate(payment.date)}
                  <span className="text-slate-400 font-normal ml-2">
                    {formatTime(payment.createdAt)}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "h-8 w-8 flex items-center justify-center shrink-0",
                  mode.color
                )}
              >
                <ModeIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Payment Mode</p>
                <p className="font-medium text-text-heading">{mode.label}</p>
              </div>
            </div>

            {/* Conditional Payment Details */}
            {payment.chequeNumber && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cheque Details</p>
                  <p className="font-medium text-text-heading">
                    #{payment.chequeNumber}
                  </p>
                  {payment.chequeDate && (
                    <p className="text-xs text-slate-500">
                      Date: {formatDate(payment.chequeDate)}
                    </p>
                  )}
                  {payment.bankName && (
                    <p className="text-xs text-slate-500">
                      Bank: {payment.bankName}
                    </p>
                  )}
                </div>
              </div>
            )}

            {payment.paymentMode === "bank" && payment.bankName && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Bank Details</p>
                  <p className="font-medium text-text-heading">
                    {payment.bankName}
                  </p>
                  {payment.bankAccountNumber && (
                    <p className="text-xs text-slate-500">
                      Acc: {payment.bankAccountNumber}
                    </p>
                  )}
                </div>
              </div>
            )}

            {payment.paymentMode === "card" && payment.cardNumber && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Card Details</p>
                  <p className="font-medium text-text-heading">
                    Ending in {payment.cardNumber}
                  </p>
                  {payment.bankName && (
                    <p className="text-xs text-slate-500">{payment.bankName}</p>
                  )}
                </div>
              </div>
            )}

            {payment.referenceNumber && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 flex items-center justify-center shrink-0">
                  <Hash className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Reference Number</p>
                  <p className="font-medium text-text-heading">
                    {payment.referenceNumber}
                  </p>
                </div>
              </div>
            )}

            {payment.invoiceNumber && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Against Invoice</p>
                  <p className="font-medium text-primary-600">
                    {payment.invoiceNumber}
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Notes */}
        {payment.notes && (
          <Card>
            <CardHeader title="Notes" />
            <CardBody>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {payment.notes}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardBody className="text-xs text-slate-400 space-y-1">
            <p>
              Created: {formatDate(payment.createdAt)}{" "}
              {formatTime(payment.createdAt)}
            </p>
            <p>Updated: {formatDate(payment.updatedAt)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <Button
          fullWidth
          variant="outline"
          leftIcon={<Edit className="h-4 w-4" />}
          onClick={onEdit}
        >
          Edit Payment
        </Button>
        <Button
          fullWidth
          variant="ghost"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={onDelete}
          className="text-error hover:bg-error-light"
        >
          Delete Payment
        </Button>
      </div>
    </div>
  );
}
