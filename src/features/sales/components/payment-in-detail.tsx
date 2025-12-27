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

const paymentModeConfig: Record<PaymentMode, { label: string; icon: typeof Banknote; color: string }> = {
  cash: { label: "Cash", icon: Banknote, color: "text-green-600 bg-green-100" },
  bank: { label: "Bank Transfer", icon: Building2, color: "text-blue-600 bg-blue-100" },
  card: { label: "Card", icon: CreditCard, color: "text-purple-600 bg-purple-100" },
  ach: { label: "ACH Transfer", icon: Building2, color: "text-teal-600 bg-teal-100" },
  cheque: { label: "Cheque", icon: FileText, color: "text-slate-600 bg-slate-100" },
  other: { label: "Other", icon: Wallet, color: "text-gray-600 bg-gray-100" },
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
}: PaymentInDetailProps) {
  const mode = paymentModeConfig[payment.paymentMode];
  const ModeIcon = mode.icon;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
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
            <p className="text-sm text-success-dark font-medium mb-1">Amount Received</p>
            <p className="text-3xl font-bold text-success">{formatCurrency(payment.amount)}</p>
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
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Customer</p>
                <p className="font-medium text-slate-900">{payment.customerName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-medium text-slate-900">{formatDate(payment.date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", mode.color)}>
                <ModeIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Payment Mode</p>
                <p className="font-medium text-slate-900">{mode.label}</p>
              </div>
            </div>

            {payment.referenceNumber && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Hash className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Reference Number</p>
                  <p className="font-medium text-slate-900">{payment.referenceNumber}</p>
                </div>
              </div>
            )}

            {payment.invoiceNumber && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Against Invoice</p>
                  <p className="font-medium text-primary-600">{payment.invoiceNumber}</p>
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
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{payment.notes}</p>
            </CardBody>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardBody className="text-xs text-slate-400 space-y-1">
            <p>Created: {formatDate(payment.createdAt)}</p>
            <p>Updated: {formatDate(payment.updatedAt)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <Button fullWidth variant="outline" leftIcon={<Edit className="h-4 w-4" />} onClick={onEdit}>
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
