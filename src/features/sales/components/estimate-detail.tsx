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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRightCircle,
  FileText,
  Send,
  FileCheck,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Estimate, EstimateStatus } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface EstimateDetailProps {
  estimate: Estimate;
  onClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onSend?: () => void;
  onConvertToInvoice?: () => void;
  onMarkAccepted?: () => void;
  onMarkRejected?: () => void;
  className?: string;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<
  EstimateStatus,
  {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "secondary";
    icon: typeof CheckCircle;
  }
> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  sent: { label: "Sent", variant: "info", icon: Clock },
  accepted: { label: "Accepted", variant: "success", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "error", icon: XCircle },
  expired: { label: "Expired", variant: "warning", icon: AlertCircle },
  converted: {
    label: "Converted to Invoice",
    variant: "success",
    icon: ArrowRightCircle,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function EstimateDetail({
  estimate,
  onClose,
  onEdit,
  onDelete,
  onPrint,
  onShare,
  onSend,
  onConvertToInvoice,
  onMarkAccepted,
  onMarkRejected,
  className,
}: EstimateDetailProps): React.ReactNode {
  const status = statusConfig[estimate.status];
  const StatusIcon = status.icon;

  const { formatCurrency } = useCurrency();

  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const isExpired = (): boolean => {
    if (estimate.status === "expired") return true;
    if (
      estimate.status === "converted" ||
      estimate.status === "accepted" ||
      estimate.status === "rejected"
    )
      return false;
    return new Date(estimate.validUntil) < new Date();
  };

  const canSend = estimate.status === "draft";
  const canAcceptReject = estimate.status === "sent" && !isExpired();
  const canConvert = estimate.status === "accepted";
  const canEdit = estimate.status === "draft" || estimate.status === "sent";

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-text-heading">
            {estimate.estimateNumber}
          </h2>
          <p className="text-sm text-slate-500">Estimate/Quotation</p>
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
        {/* Status Card */}
        <Card
          className={cn(
            estimate.status === "accepted" || estimate.status === "converted"
              ? "bg-success-light border-success/20"
              : estimate.status === "rejected"
                ? "bg-error-light border-error/20"
                : estimate.status === "expired"
                  ? "bg-warning-light border-warning/20"
                  : "bg-slate-50"
          )}
        >
          <CardBody className="text-center py-6">
            <Badge variant={status.variant} size="lg" className="mb-3">
              <StatusIcon className="h-4 w-4 mr-1" />
              {status.label}
            </Badge>
            <p className="text-3xl font-bold text-text-heading">
              {formatCurrency(estimate.total)}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {estimate.items.length}{" "}
              {estimate.items.length === 1 ? "item" : "items"}
            </p>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        {(canSend || canAcceptReject || canConvert) && (
          <Card>
            <CardBody className="space-y-2">
              {canSend && (
                <Button
                  fullWidth
                  variant="primary"
                  leftIcon={<Send className="h-4 w-4" />}
                  onClick={onSend}
                >
                  Send to Customer
                </Button>
              )}
              {canAcceptReject && (
                <>
                  <Button
                    fullWidth
                    variant="primary"
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    onClick={onMarkAccepted}
                  >
                    Mark as Accepted
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    leftIcon={<XCircle className="h-4 w-4" />}
                    onClick={onMarkRejected}
                  >
                    Mark as Rejected
                  </Button>
                </>
              )}
              {canConvert && (
                <Button
                  fullWidth
                  variant="primary"
                  leftIcon={<FileCheck className="h-4 w-4" />}
                  onClick={onConvertToInvoice}
                >
                  Convert to Invoice
                </Button>
              )}
            </CardBody>
          </Card>
        )}

        {/* Estimate Details */}
        <Card>
          <CardHeader title="Details" />
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Customer</p>
                <p className="font-medium text-text-heading">
                  {estimate.customerName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Date Created</p>
                <p className="font-medium text-text-heading">
                  {formatDate(estimate.date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  isExpired() ? "bg-error-light" : "bg-slate-100"
                )}
              >
                <Clock
                  className={cn(
                    "h-4 w-4",
                    isExpired() ? "text-error" : "text-slate-500"
                  )}
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">Valid Until</p>
                <p
                  className={cn(
                    "font-medium",
                    isExpired() ? "text-error" : "text-text-heading"
                  )}
                >
                  {formatDate(estimate.validUntil)}
                  {isExpired() && estimate.status !== "expired" && " (Expired)"}
                </p>
              </div>
            </div>

            {estimate.convertedToInvoiceId && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <FileCheck className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Converted to Invoice</p>
                  <p className="font-medium text-primary-600">View Invoice</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader title="Items" />
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {estimate.items.map((item) => (
                <div key={item.id} className="p-4 flex justify-between">
                  <div>
                    <p className="font-medium text-text-heading">
                      {item.itemName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.quantity} {item.unit} ×{" "}
                      {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-medium text-text-heading">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Summary */}
        <Card>
          <CardBody className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(estimate.subtotal)}
              </span>
            </div>
            {estimate.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium text-success">
                  -{formatCurrency(estimate.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax</span>
              <span className="font-medium">
                {formatCurrency(estimate.taxAmount)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between">
              <span className="font-semibold text-text-heading">Total</span>
              <span className="font-bold text-primary-600">
                {formatCurrency(estimate.total)}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Notes & Terms */}
        {(estimate.notes ?? estimate.terms) && (
          <Card>
            {estimate.notes && (
              <>
                <CardHeader title="Notes" />
                <CardBody>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {estimate.notes}
                  </p>
                </CardBody>
              </>
            )}
            {estimate.terms && (
              <>
                <CardHeader title="Terms & Conditions" />
                <CardBody>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {estimate.terms}
                  </p>
                </CardBody>
              </>
            )}
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardBody className="text-xs text-slate-400 space-y-1">
            <p>Created: {formatDate(estimate.createdAt)}</p>
            <p>Updated: {formatDate(estimate.updatedAt)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        {canEdit && (
          <Button
            fullWidth
            variant="outline"
            leftIcon={<Edit className="h-4 w-4" />}
            onClick={onEdit}
          >
            Edit Estimate
          </Button>
        )}
        <Button
          fullWidth
          variant="ghost"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={onDelete}
          className="text-error hover:bg-error-light"
        >
          Delete Estimate
        </Button>
      </div>
    </div>
  );
}
