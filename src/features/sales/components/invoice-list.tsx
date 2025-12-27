import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardBody,
  SearchInput,
  Button,
  Badge,
  Select,
  type SelectOption,
} from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import {
  Plus,
  FileText,
  Calendar,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { SaleInvoice, InvoiceStatus, SaleFilters } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceListProps {
  invoices: SaleInvoice[] | null;
  isLoading?: boolean;
  onInvoiceClick?: (invoice: SaleInvoice) => void;
  onCreateInvoice?: () => void;
  className?: string;
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

const statusOptions: SelectOption[] = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

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
// INVOICE CARD COMPONENT
// ============================================================================

interface InvoiceCardProps {
  invoice: SaleInvoice;
  onClick?: () => void;
}

function InvoiceCard({ invoice, onClick }: InvoiceCardProps) {
  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;

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
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{invoice.customerName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(invoice.date)}
            </span>
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
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

export function InvoiceList({
  invoices,
  isLoading,
  onInvoiceClick,
  onCreateInvoice,
  className,
}: InvoiceListProps) {
  const [filters, setFilters] = useState<SaleFilters>({
    search: "",
    status: "all",
    customerId: "all",
    dateRange: { from: null, to: null },
    sortBy: "date",
    sortOrder: "desc",
  });

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    return invoices
      .filter((invoice) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesNumber = invoice.invoiceNumber.toLowerCase().includes(searchLower);
          const matchesParty = invoice.customerName.toLowerCase().includes(searchLower);
          if (!matchesNumber && !matchesParty) return false;
        }

        // Status filter
        if (filters.status !== "all" && invoice.status !== filters.status) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (filters.sortBy) {
          case "date":
            comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
            break;
          case "number":
            comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
            break;
          case "amount":
            comparison = b.total - a.total;
            break;
          case "party":
            comparison = a.customerName.localeCompare(b.customerName);
            break;
        }

        return filters.sortOrder === "desc" ? comparison : -comparison;
      });
  }, [invoices, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredInvoices.length) return { total: 0, paid: 0, pending: 0, overdue: 0 };

    return filteredInvoices.reduce(
      (acc, inv) => {
        acc.total += inv.total;
        acc.paid += inv.amountPaid;
        if (inv.status === "overdue") {
          acc.overdue += inv.amountDue;
        } else if (inv.amountDue > 0) {
          acc.pending += inv.amountDue;
        }
        return acc;
      },
      { total: 0, paid: 0, pending: 0, overdue: 0 }
    );
  }, [filteredInvoices]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-slate-200 rounded-lg animate-pulse" />
          <div className="w-32 h-10 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} hasHeader={false} bodyLines={2} />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          placeholder="Search invoices..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="flex-1"
        />

        <div className="flex gap-2">
          <Select
            options={statusOptions}
            value={filters.status}
            onChange={(value) =>
              setFilters((f) => ({ ...f, status: value as InvoiceStatus | "all" }))
            }
            size="md"
          />

          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreateInvoice}>
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="bg-slate-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <p className="text-xs text-slate-500 font-medium">Total</p>
            </div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(totals.total)}</p>
          </CardBody>
        </Card>

        <Card className="bg-success-light">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <p className="text-xs text-success-dark font-medium">Paid</p>
            </div>
            <p className="text-lg font-bold text-success">{formatCurrency(totals.paid)}</p>
          </CardBody>
        </Card>

        <Card className="bg-warning-light">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <p className="text-xs text-warning-dark font-medium">Pending</p>
            </div>
            <p className="text-lg font-bold text-warning-dark">{formatCurrency(totals.pending)}</p>
          </CardBody>
        </Card>

        <Card className="bg-error-light">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-error" />
              <p className="text-xs text-error-dark font-medium">Overdue</p>
            </div>
            <p className="text-lg font-bold text-error">{formatCurrency(totals.overdue)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          variant={filters.search ? "search" : "empty"}
          title={filters.search ? "No invoices found" : "No invoices yet"}
          description={
            filters.search
              ? "Try adjusting your search or filters"
              : "Create your first sale invoice to get started"
          }
          action={
            !filters.search && (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreateInvoice}>
                Create Invoice
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2">
            {filteredInvoices.length} {filteredInvoices.length === 1 ? "invoice" : "invoices"}
          </p>

          {filteredInvoices.map((invoice) => (
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
