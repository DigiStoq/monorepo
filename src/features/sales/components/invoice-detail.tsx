import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Table,
  type Column,
} from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import {
  Edit,
  Trash2,
  Send,
  Download,
  Printer,
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import type { SaleInvoice, SaleInvoiceItem, InvoiceStatus } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceDetailProps {
  invoice: SaleInvoice | null;
  isLoading?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSend?: () => void;
  onRecordPayment?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  className?: string;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<InvoiceStatus, { label: string; variant: "success" | "warning" | "error" | "info" | "secondary"; icon: typeof CheckCircle }> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  sent: { label: "Sent", variant: "info", icon: Clock },
  paid: { label: "Paid", variant: "success", icon: CheckCircle },
  partial: { label: "Partial", variant: "warning", icon: AlertCircle },
  overdue: { label: "Overdue", variant: "error", icon: AlertCircle },
  cancelled: { label: "Cancelled", variant: "secondary", icon: XCircle },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function InvoiceDetail({
  invoice,
  isLoading,
  onEdit,
  onDelete,
  onSend,
  onRecordPayment,
  onDownload,
  onPrint,
  className,
}: InvoiceDetailProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // Item columns
  const columns: Column<SaleInvoiceItem>[] = [
    {
      key: "item",
      header: "Item",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.itemName}</p>
          {row.description && (
            <p className="text-xs text-slate-500">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Qty",
      align: "right",
      cell: (row) => (
        <span>
          {row.quantity} {row.unit}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      cell: (row) => formatCurrency(row.unitPrice),
    },
    {
      key: "discount",
      header: "Disc",
      align: "right",
      cell: (row) => (row.discountPercent ? `${row.discountPercent}%` : "-"),
    },
    {
      key: "tax",
      header: "Tax",
      align: "right",
      cell: (row) => (row.taxPercent ? `${row.taxPercent}%` : "-"),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (row) => (
        <span className="font-medium">{formatCurrency(row.amount)}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <CardSkeleton bodyLines={5} />
        <CardSkeleton bodyLines={8} />
      </div>
    );
  }

  if (!invoice) {
    return (
      <EmptyState
        title="Select an invoice"
        description="Choose an invoice from the list to view details"
        className={className}
      />
    );
  }

  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;
  const showPaymentButton =
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    invoice.status !== "draft";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Invoice Header Card */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {invoice.invoiceNumber}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={status.variant}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </div>
            </div>
          }
          action={
            <div className="flex gap-2">
              {invoice.status === "draft" && (
                <Button variant="outline" size="sm" onClick={onSend}>
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onPrint}>
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-error" />
              </Button>
            </div>
          }
        />

        <CardBody>
          {/* Amount Due Alert */}
          {invoice.amountDue > 0 && invoice.status !== "draft" && (
            <div
              className={cn(
                "p-4 rounded-xl mb-6",
                invoice.status === "overdue" ? "bg-error-light" : "bg-warning-light"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      invoice.status === "overdue" ? "text-error" : "text-warning-dark"
                    )}
                  >
                    Amount Due
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      invoice.status === "overdue" ? "text-error" : "text-warning-dark"
                    )}
                  >
                    {formatCurrency(invoice.amountDue)}
                  </p>
                </div>
                {showPaymentButton && (
                  <Button onClick={onRecordPayment}>
                    <DollarSign className="h-4 w-4 mr-1" />
                    Record Payment
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Invoice Info Grid */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Customer</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-900">{invoice.customerName}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Invoice Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-900">{formatDate(invoice.date)}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Due Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span
                  className={cn(
                    invoice.status === "overdue" ? "text-error font-medium" : "text-slate-900"
                  )}
                >
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Total Amount</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(invoice.total)}
              </p>
            </div>

            <div className="p-4 bg-success-light rounded-xl">
              <p className="text-xs text-success-dark mb-1">Amount Paid</p>
              <p className="text-xl font-bold text-success">
                {formatCurrency(invoice.amountPaid)}
              </p>
            </div>

            <div
              className={cn(
                "p-4 rounded-xl",
                invoice.amountDue > 0
                  ? invoice.status === "overdue"
                    ? "bg-error-light"
                    : "bg-warning-light"
                  : "bg-slate-50"
              )}
            >
              <p
                className={cn(
                  "text-xs mb-1",
                  invoice.amountDue > 0
                    ? invoice.status === "overdue"
                      ? "text-error-dark"
                      : "text-warning-dark"
                    : "text-slate-500"
                )}
              >
                Balance Due
              </p>
              <p
                className={cn(
                  "text-xl font-bold",
                  invoice.amountDue > 0
                    ? invoice.status === "overdue"
                      ? "text-error"
                      : "text-warning-dark"
                    : "text-slate-900"
                )}
              >
                {formatCurrency(invoice.amountDue)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardHeader title="Items" />
        <CardBody className="p-0">
          <Table columns={columns} data={invoice.items} getRowKey={(row) => row.id} />
        </CardBody>
      </Card>

      {/* Totals Card */}
      <Card>
        <CardBody>
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium text-success">
                    -{formatCurrency(invoice.discountAmount)}
                  </span>
                </div>
              )}

              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Notes & Terms */}
      {(invoice.notes ?? invoice.terms) && (
        <Card>
          <CardBody>
            <div className="grid grid-cols-2 gap-6">
              {invoice.notes && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Notes</p>
                  <p className="text-sm text-slate-600">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Terms & Conditions
                  </p>
                  <p className="text-sm text-slate-600">{invoice.terms}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
