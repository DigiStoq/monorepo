import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Table,
  Select,
  type Column,
  type SelectOption,
} from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import {
  Edit,
  Trash2,
  Download,
  Printer,
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  History,
  PlusCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  useInvoiceHistory,
  type InvoiceHistoryAction,
} from "@/hooks/useInvoiceHistory";
import { useCurrency } from "@/hooks/useCurrency";
import type { SaleInvoice, SaleInvoiceItem, InvoiceStatus } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceDetailProps {
  invoice: SaleInvoice | null;
  isLoading?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: InvoiceStatus) => void;
  onRecordPayment?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  className?: string;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "secondary";
    icon: typeof CheckCircle;
  }
> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  unpaid: { label: "Unpaid", variant: "warning", icon: Clock },
  paid: { label: "Paid", variant: "success", icon: CheckCircle },
  returned: { label: "Returned", variant: "error", icon: RotateCcw },
};

// Get available status options based on current status
function getStatusOptions(currentStatus: InvoiceStatus): SelectOption[] {
  switch (currentStatus) {
    case "paid":
      // Paid invoices can only be returned
      return [
        { value: "paid", label: "Paid" },
        { value: "returned", label: "Returned" },
      ];
    case "returned":
      // Returned invoices cannot change status
      return [{ value: "returned", label: "Returned" }];
    case "draft":
      // Draft can go to unpaid or paid
      return [
        { value: "draft", label: "Draft" },
        { value: "unpaid", label: "Unpaid" },
        { value: "paid", label: "Paid" },
      ];
    case "unpaid":
    default:
      // Unpaid can go to paid or returned
      return [
        { value: "unpaid", label: "Unpaid" },
        { value: "paid", label: "Paid" },
        { value: "returned", label: "Returned" },
      ];
  }
}

const historyActionConfig: Record<
  InvoiceHistoryAction,
  { icon: typeof PlusCircle; color: string }
> = {
  created: { icon: PlusCircle, color: "text-success" },
  updated: { icon: RefreshCw, color: "text-primary-600" },
  status_changed: { icon: Clock, color: "text-warning-dark" },
  payment_recorded: { icon: DollarSign, color: "text-success" },
  deleted: { icon: Trash2, color: "text-error" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function InvoiceDetail({
  invoice,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
  onRecordPayment,
  onDownload,
  onPrint,
  className,
}: InvoiceDetailProps): React.ReactNode {
  // Fetch invoice history
  const { history, isLoading: historyLoading } = useInvoiceHistory(
    invoice?.id ?? null,
    "sale"
  );

  const { formatCurrency } = useCurrency();

  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (dateStr: string): string =>
    new Date(dateStr).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      key: "batchNumber",
      header: "Batch No.",
      cell: (row) => row.batchNumber ?? "-",
    },
    {
      key: "mrp",
      header: "MRP",
      align: "right",
      cell: (row) => (row.mrp ? formatCurrency(row.mrp) : "-"),
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
      header: "Rate",
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
  const showPaymentButton = invoice.status === "unpaid";

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
            <div className="flex items-center gap-2">
              <Select
                options={getStatusOptions(invoice.status)}
                value={invoice.status}
                onChange={(value) => {
                  onStatusChange?.(value as InvoiceStatus);
                }}
                className="w-32"
                disabled={invoice.status === "returned"}
              />
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
          {invoice.amountDue > 0 && invoice.status === "unpaid" && (
            <div className="p-4 rounded-xl mb-6 bg-warning-light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-warning-dark">
                    Amount Due
                  </p>
                  <p className="text-2xl font-bold text-warning-dark">
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
                <span className="font-medium text-slate-900">
                  {invoice.customerName}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">
                Invoice Date
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-900">
                  {formatDate(invoice.date)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Due Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span
                  className={cn(
                    invoice.status === "returned"
                      ? "text-error font-medium"
                      : "text-slate-900"
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
                  ? invoice.status === "returned"
                    ? "bg-error-light"
                    : "bg-warning-light"
                  : "bg-slate-50"
              )}
            >
              <p
                className={cn(
                  "text-xs mb-1",
                  invoice.amountDue > 0
                    ? invoice.status === "returned"
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
                    ? invoice.status === "returned"
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
          <Table
            columns={columns}
            data={invoice.items}
            getRowKey={(row) => row.id}
          />
        </CardBody>
      </Card>

      {/* Totals Card */}
      <Card>
        <CardBody>
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
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

              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.taxAmount)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-slate-900">
                    Total
                  </span>
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
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Notes
                  </p>
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

      {/* Invoice History */}
      <HistorySection
        history={history}
        isLoading={historyLoading}
        formatDateTime={formatDateTime}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}

// ============================================================================
// HISTORY SECTION COMPONENT
// ============================================================================

function HistorySection({
  history,
  isLoading,
  formatDateTime,
  formatCurrency,
}: {
  history: ReturnType<typeof useInvoiceHistory>["history"];
  isLoading: boolean;
  formatDateTime: (dateStr: string) => string;
  formatCurrency: (value: number) => string;
}): React.ReactNode {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatValue = (key: string, value: unknown): string | string[] => {
    if (value === null || value === undefined) return "—";

    // Handle arrays (like itemChanges)
    if (Array.isArray(value)) {
      return value.map((v) => String(v));
    }

    if (typeof value === "number") {
      if (
        key.toLowerCase().includes("amount") ||
        key.toLowerCase().includes("total")
      ) {
        return formatCurrency(value);
      }
      return value.toString();
    }

    // Handle objects
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value as string | number | boolean);
  };

  const isArrayValue = (value: unknown): value is string[] => {
    return Array.isArray(value);
  };

  const hasDetails = (entry: (typeof history)[0]): boolean => {
    const hasOld = !!(
      entry.oldValues && Object.keys(entry.oldValues).length > 0
    );
    const hasNew = !!(
      entry.newValues && Object.keys(entry.newValues).length > 0
    );
    return hasOld || hasNew;
  };

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            <span>Activity History</span>
          </div>
        }
      />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No activity recorded yet
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => {
              const actionConfig = historyActionConfig[entry.action];
              const ActionIcon = actionConfig.icon;
              const isExpanded = expandedIds.has(entry.id);
              const canExpand = hasDetails(entry);

              return (
                <div
                  key={entry.id}
                  className="border border-slate-100 rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (canExpand) toggleExpand(entry.id);
                    }}
                    className={cn(
                      "w-full flex gap-3 p-3 text-left",
                      canExpand && "hover:bg-slate-50 cursor-pointer",
                      !canExpand && "cursor-default"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        entry.action === "created" && "bg-success-light",
                        entry.action === "updated" && "bg-primary-100",
                        entry.action === "status_changed" && "bg-warning-light",
                        entry.action === "payment_recorded" &&
                          "bg-success-light",
                        entry.action === "deleted" && "bg-error-light"
                      )}
                    >
                      <ActionIcon
                        className={cn("h-4 w-4", actionConfig.color)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {formatDateTime(entry.createdAt)}
                        </span>
                        {entry.userName && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">
                              Changed by {entry.userName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {canExpand && (
                      <div className="shrink-0 text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && canExpand && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="ml-11 p-3 bg-slate-50 rounded-lg space-y-3">
                        {entry.oldValues &&
                          Object.keys(entry.oldValues).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                                Previous Values
                              </p>
                              <div className="space-y-1">
                                {Object.entries(entry.oldValues).map(
                                  ([key, value]) => {
                                    const formatted = formatValue(key, value);
                                    return (
                                      <div key={key} className="text-sm">
                                        {isArrayValue(formatted) ? (
                                          <div>
                                            <span className="text-slate-600 capitalize">
                                              {key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}
                                              :
                                            </span>
                                            <ul className="ml-4 mt-1 space-y-0.5">
                                              {formatted.map((item, idx) => (
                                                <li
                                                  key={idx}
                                                  className="text-slate-900"
                                                >
                                                  • {item}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        ) : (
                                          <div className="flex justify-between">
                                            <span className="text-slate-600 capitalize">
                                              {key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}
                                            </span>
                                            <span className="text-slate-900 font-medium">
                                              {formatted}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}
                        {entry.newValues &&
                          Object.keys(entry.newValues).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                                New Values
                              </p>
                              <div className="space-y-1">
                                {Object.entries(entry.newValues).map(
                                  ([key, value]) => {
                                    const formatted = formatValue(key, value);
                                    return (
                                      <div key={key} className="text-sm">
                                        {isArrayValue(formatted) ? (
                                          <div>
                                            <span className="text-slate-600 capitalize">
                                              {key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}
                                              :
                                            </span>
                                            <ul className="ml-4 mt-1 space-y-0.5">
                                              {formatted.map((item, idx) => (
                                                <li
                                                  key={idx}
                                                  className="text-slate-900"
                                                >
                                                  • {item}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        ) : (
                                          <div className="flex justify-between">
                                            <span className="text-slate-600 capitalize">
                                              {key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}
                                            </span>
                                            <span className="text-slate-900 font-medium">
                                              {formatted}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
