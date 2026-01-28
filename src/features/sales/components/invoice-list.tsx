import { cn } from "@/lib/cn";
import { Button, Badge } from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import {
  Plus,
  FileText,
  Calendar,
  User,
  Clock,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { SaleInvoice, InvoiceStatus } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceListProps {
  invoices: SaleInvoice[] | null;
  isLoading?: boolean;
  onInvoiceClick?: (invoice: SaleInvoice) => void;
  onCreateInvoice?: () => void;
  className?: string;
  hasActiveFilters?: boolean;
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

// ============================================================================
// INVOICE CARD COMPONENT
// ============================================================================

interface InvoiceCardProps {
  invoice: SaleInvoice;
  onClick?: () => void;
}

function InvoiceCard({ invoice, onClick }: InvoiceCardProps): React.ReactNode {
  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;

  const { formatCurrency } = useCurrency();

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
        "w-full p-4 bg-card rounded-lg border border-border-primary",
        "hover:border-primary-300 hover:shadow-soft",
        "transition-all duration-200 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Invoice Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-text-heading">
              {invoice.invoiceNumber}
            </h3>
            <Badge variant={status.variant} size="sm">
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-sm text-text-secondary mb-1">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{invoice.customerName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(invoice.date)}
            </span>
            {invoice.status !== "paid" && invoice.status !== "returned" && invoice.dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due: {formatDate(invoice.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="font-semibold text-text-number">
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

export function InvoiceList({
  invoices,
  isLoading,
  onInvoiceClick,
  onCreateInvoice,
  className,
  hasActiveFilters = false,
}: InvoiceListProps): React.ReactNode {
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
          title={hasActiveFilters ? "No invoices found" : "No invoices yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Create your first sale invoice to get started"
          }
          action={
            !hasActiveFilters && (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onCreateInvoice}
              >
                Create Invoice
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-text-tertiary mb-2 px-1">
            {displayInvoices.length}{" "}
            {displayInvoices.length === 1 ? "invoice" : "invoices"}
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
