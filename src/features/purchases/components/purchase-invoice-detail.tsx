import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody, Button, Select } from "@/components/ui";
import {
  X,
  Printer,
  Trash2,
  Edit,
  Calendar,
  Building2,
  FileText,
  Clock,
  DollarSign,
  Download,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { PurchaseInvoice, PurchaseInvoiceStatus } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface PurchaseInvoiceDetailProps {
  invoice: PurchaseInvoice;
  onClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  onRecordPayment?: () => void;
  onStatusChange?: (newStatus: PurchaseInvoiceStatus) => void;
  className?: string;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusLabels: Record<string, string> = {
  draft: "Draft",
  ordered: "Ordered",
  received: "Received",
  paid: "Paid",
  returned: "Returned",
};

// Status progression order (can only move forward)
const statusOrder: string[] = [
  "draft",
  "ordered",
  "received",
  "paid",
  "returned",
];

function getAvailableStatuses(
  currentStatus: string
): { value: string; label: string }[] {
  const currentIndex = statusOrder.indexOf(currentStatus);
  if (currentIndex === -1) {
    // Unknown status - return all options
    return statusOrder.map((s) => ({ value: s, label: statusLabels[s] ?? s }));
  }
  // Only allow current status and statuses after it
  return statusOrder
    .slice(currentIndex)
    .map((s) => ({ value: s, label: statusLabels[s] ?? s }));
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PurchaseInvoiceDetail({
  invoice,
  onClose,
  onEdit,
  onDelete,
  onPrint,
  onDownload,
  onRecordPayment,
  onStatusChange,
  className,
}: PurchaseInvoiceDetailProps): React.ReactNode {
  const { formatCurrency } = useCurrency();

  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const canPay =
    invoice.status !== "paid" &&
    invoice.status !== "returned" &&
    invoice.amountDue > 0;

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-text-heading">
            {invoice.invoiceNumber}
          </h2>
          <p className="text-sm text-slate-500">Purchase Invoice</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status & Amount Card */}
        <Card
          className={cn(
            invoice.status === "paid"
              ? "bg-success-light border-success/20"
              : invoice.status === "returned"
                ? "bg-error-light border-error/20"
                : "bg-slate-50"
          )}
        >
          <CardBody className="text-center py-6">
            <div className="flex justify-center mb-3">
              <Select
                options={getAvailableStatuses(invoice.status)}
                value={invoice.status}
                onChange={(value) =>
                  onStatusChange?.(value as PurchaseInvoiceStatus)
                }
                size="sm"
              />
            </div>
            <p className="text-3xl font-bold text-text-heading">
              {formatCurrency(invoice.total)}
            </p>
            {invoice.amountDue > 0 && invoice.amountDue !== invoice.total && (
              <p className="text-lg text-error mt-1">
                Due: {formatCurrency(invoice.amountDue)}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Quick Action */}
        {canPay && (
          <Button
            fullWidth
            leftIcon={<DollarSign className="h-4 w-4" />}
            onClick={onRecordPayment}
          >
            Record Payment
          </Button>
        )}

        {/* Invoice Details */}
        <Card>
          <CardHeader title="Details" />
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Supplier</p>
                <p className="font-medium text-text-heading">
                  {invoice.customerName}
                </p>
              </div>
            </div>

            {invoice.supplierInvoiceNumber && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Supplier Invoice #</p>
                  <p className="font-medium text-text-heading">
                    {invoice.supplierInvoiceNumber}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Invoice Date</p>
                <p className="font-medium text-text-heading">
                  {formatDate(invoice.date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Due Date</p>
                <p className="font-medium text-text-heading">
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader title="Items" />
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
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
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium text-success">
                  -{formatCurrency(invoice.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax</span>
              <span className="font-medium">
                {formatCurrency(invoice.taxAmount)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between">
              <span className="font-semibold text-text-heading">Total</span>
              <span className="font-bold text-primary-600">
                {formatCurrency(invoice.total)}
              </span>
            </div>
            {invoice.amountPaid > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-medium text-success">
                    {formatCurrency(invoice.amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Balance Due</span>
                  <span className="font-medium text-error">
                    {formatCurrency(invoice.amountDue)}
                  </span>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader title="Notes" />
            <CardBody>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardBody className="text-xs text-slate-400 space-y-1">
            <p>Created: {formatDate(invoice.createdAt)}</p>
            <p>Updated: {formatDate(invoice.updatedAt)}</p>
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
          Edit Purchase
        </Button>
        <Button
          fullWidth
          variant="ghost"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={onDelete}
          className="text-error hover:bg-error-light"
        >
          Delete Purchase
        </Button>
      </div>
    </div>
  );
}
