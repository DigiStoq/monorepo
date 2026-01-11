import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";
import {
  X,
  Trash2,
  Edit2,
  Building2,
  Calendar,
  Hash,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import type { Cheque, ChequeStatus } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface ChequeDetailProps {
  cheque: Cheque;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkCleared: () => void;
  onMarkBounced: () => void;
  onCancel: () => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const statusConfig: Record<ChequeStatus, { label: string; icon: React.ReactNode; variant: "success" | "warning" | "error" | "secondary"; color: string }> = {
  pending: { label: "Pending", icon: <Clock className="h-4 w-4" />, variant: "warning", color: "bg-warning-light border-warning/20" },
  cleared: { label: "Cleared", icon: <CheckCircle className="h-4 w-4" />, variant: "success", color: "bg-success-light border-success/20" },
  bounced: { label: "Bounced", icon: <AlertTriangle className="h-4 w-4" />, variant: "error", color: "bg-error-light border-error/20" },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-4 w-4" />, variant: "secondary", color: "bg-slate-100 border-slate-200" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ChequeDetail({
  cheque,
  onClose,
  onEdit,
  onDelete,
  onMarkCleared,
  onMarkBounced,
  onCancel,
  className,
}: ChequeDetailProps) {
  const status = statusConfig[cheque.status];
  const isReceived = cheque.type === "received";
  const isPending = cheque.status === "pending";

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cheque Details</h2>
          <p className="text-sm text-slate-500">#{cheque.chequeNumber}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Amount Card */}
        <Card className={cn("border", status.color)}>
          <CardBody className="text-center py-6">
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3",
              isReceived ? "bg-success-light text-success" : "bg-error-light text-error"
            )}>
              {isReceived ? (
                <ArrowDownLeft className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{isReceived ? "Cheque Received" : "Cheque Issued"}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(cheque.amount)}</p>
            <div className="mt-3">
              <Badge variant={status.variant} size="lg">
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions for Pending */}
        {isPending && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkCleared}
              className="border-success text-success hover:bg-success-light"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Cleared
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkBounced}
              className="border-error text-error hover:bg-error-light"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Mark Bounced
            </Button>
          </div>
        )}

        {/* Cheque Info */}
        <Card>
          <CardHeader title="Cheque Information" />
          <CardBody className="space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">{isReceived ? "Received From" : "Issued To"}</p>
                <p className="font-medium text-slate-900">{cheque.customerName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Cheque Number</p>
                <p className="font-medium text-slate-900 font-mono">{cheque.chequeNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Bank</p>
                <p className="font-medium text-slate-900">{cheque.bankName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Cheque Date</p>
                <p className="font-medium text-slate-900">{formatDate(cheque.date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Due Date</p>
                <p className="font-medium text-slate-900">{formatDate(cheque.dueDate)}</p>
              </div>
            </div>

            {cheque.clearedDate && (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Cleared Date</p>
                  <p className="font-medium text-success">{formatDate(cheque.clearedDate)}</p>
                </div>
              </div>
            )}

            {cheque.relatedInvoiceNumber && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Related Invoice</p>
                  <p className="font-medium text-primary-600">{cheque.relatedInvoiceNumber}</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Notes */}
        {cheque.notes && (
          <Card>
            <CardHeader title="Notes" />
            <CardBody>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{cheque.notes}</p>
            </CardBody>
          </Card>
        )}

        {/* Metadata */}
        <div className="text-xs text-slate-400 space-y-1">
          <p>Created: {new Date(cheque.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(cheque.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <Button variant="outline" size="sm" onClick={onEdit} fullWidth>
          <Edit2 className="h-4 w-4 mr-1" />
          Edit Cheque
        </Button>
        {isPending && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="w-full text-slate-600 hover:bg-slate-100"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Cancel Cheque
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="w-full text-error hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Cheque
        </Button>
      </div>
    </div>
  );
}
