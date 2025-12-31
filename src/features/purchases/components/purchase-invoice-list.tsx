import { cn } from "@/lib/cn";
import { Button, Badge } from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import {
  Plus,
  FileText,
  Calendar,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { PurchaseInvoice } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface PurchaseInvoiceListProps {
  invoices: PurchaseInvoice[] | null;
  isLoading?: boolean;
  onInvoiceClick?: (invoice: PurchaseInvoice) => void;
  onCreateInvoice?: () => void;
  className?: string;
  hasActiveFilters?: boolean;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "secondary";
    icon: typeof CheckCircle;
  }
> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  ordered: { label: "Ordered", variant: "info", icon: Clock },
  received: { label: "Received", variant: "warning", icon: CheckCircle },
  paid: { label: "Paid", variant: "success", icon: CheckCircle },
  returned: { label: "Returned", variant: "error", icon: XCircle },
  // Fallback for legacy/unknown statuses
  partial: { label: "Partial", variant: "warning", icon: AlertCircle },
  unpaid: { label: "Unpaid", variant: "warning", icon: Clock },
};

const defaultStatusConfig = {
  label: "Unknown",
  variant: "secondary" as const,
  icon: AlertCircle,
};

// ============================================================================
// INVOICE CARD COMPONENT
// ============================================================================

interface InvoiceCardProps {
  invoice: PurchaseInvoice;
  onClick?: () => void;
}

function InvoiceCard({ invoice, onClick }: InvoiceCardProps): React.ReactNode {
  const status = statusConfig[invoice.status] ?? defaultStatusConfig;
  const StatusIcon = status.icon;

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 bg-white rounded-lg border border-slate-200",
        "hover:border-primary-300 hover:shadow-soft",
        "transition-all duration-200 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Invoice Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">
              {invoice.invoiceNumber}
            </h3>
            <Badge variant={status.variant} size="sm">
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{invoice.customerName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(invoice.date)}
            </span>
            {invoice.supplierInvoiceNumber && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Ref: {invoice.supplierInvoiceNumber}
              </span>
            )}
            {invoice.status !== "paid" && invoice.status !== "returned" && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due: {formatDate(invoice.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="font-semibold text-slate-900">
            {formatCurrency(invoice.total)}
          </p>
          {invoice.amountDue > 0 && invoice.amountDue !== invoice.total && (
            <p className="text-sm text-error">
              Due: {formatCurrency(invoice.amountDue)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PurchaseInvoiceList({
  invoices,
  isLoading,
  onInvoiceClick,
  onCreateInvoice,
  className,
  hasActiveFilters = false,
}: PurchaseInvoiceListProps): React.ReactNode {
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} hasHeader={false} bodyLines={2} />
        ))}
      </div>
    );
  }

  // Items are already filtered by parent
  const displayInvoices = invoices ?? [];

  return (
    <div className={className}>
      {/* Invoice List */}
      {displayInvoices.length === 0 ? (
        <EmptyState
          variant={hasActiveFilters ? "search" : "empty"}
          title={hasActiveFilters ? "No purchases found" : "No purchases yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Record your first purchase invoice to get started"
          }
          action={
            !hasActiveFilters && (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onCreateInvoice}
              >
                Create Purchase
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2 px-1">
            {displayInvoices.length}{" "}
            {displayInvoices.length === 1 ? "purchase" : "purchases"}
          </p>

          {displayInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onClick={() => onInvoiceClick?.(invoice)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
