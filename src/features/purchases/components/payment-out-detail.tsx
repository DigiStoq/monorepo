import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";
import {
  X,
  Calendar,
  Building2,
  Hash,
  FileText,
  Printer,
  Trash2,
  Edit2,
  Banknote,
  CreditCard,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { PaymentOut, PaymentOutMode } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentOutDetailProps {
  payment: PaymentOut;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
  className?: string;
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
    color: "bg-green-100 text-green-700",
  },
  bank: {
    label: "Bank Transfer",
    icon: <Building2 className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-700",
  },
  card: {
    label: "Card",
    icon: <CreditCard className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-700",
  },
  ach: {
    label: "ACH Transfer",
    icon: <Building2 className="h-4 w-4" />,
    color: "bg-teal-100 text-teal-700",
  },
  cheque: {
    label: "Cheque",
    icon: <CreditCard className="h-4 w-4" />,
    color: "bg-orange-100 text-orange-700",
  },
  other: {
    label: "Other",
    icon: <CreditCard className="h-4 w-4" />,
    color: "bg-slate-100 text-slate-700",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentOutDetail({
  payment,
  onClose,
  onEdit,
  onDelete,
  onPrint,
  className,
}: PaymentOutDetailProps): React.ReactNode {
  // Format currency
  const { formatCurrency } = useCurrency();

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const modeConfig = paymentModeConfig[payment.paymentMode];

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Payment Details
          </h2>
          <p className="text-sm text-slate-500">{payment.paymentNumber}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Amount Card */}
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
          <CardBody className="text-center py-6">
            <p className="text-sm text-slate-600 mb-1">Payment Amount</p>
            <p className="text-3xl font-bold text-error">
              {formatCurrency(payment.amount)}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge
                className={cn("flex items-center gap-1", modeConfig.color)}
              >
                {modeConfig.icon}
                {modeConfig.label}
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* Supplier Info */}
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Paid To</p>
                <p className="font-medium text-slate-900">
                  {payment.customerName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Payment Date</p>
                <p className="font-medium text-slate-900">
                  {formatDate(payment.date)}
                </p>
              </div>
            </div>

            {payment.referenceNumber && (
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Reference Number</p>
                  <p className="font-medium text-slate-900">
                    {payment.referenceNumber}
                  </p>
                </div>
              </div>
            )}

            {payment.invoiceNumber && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Applied to Invoice</p>
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

        {/* Metadata */}
        <div className="text-xs text-slate-400 space-y-1">
          <p>Created: {new Date(payment.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(payment.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="w-full text-error hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Payment
        </Button>
      </div>
    </div>
  );
}
