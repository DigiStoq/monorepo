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
  RotateCcw,
  Percent,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";
import type { CreditNote, CreditNoteReason } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface CreditNoteListProps {
  creditNotes: CreditNote[] | null;
  isLoading?: boolean;
  onCreditNoteClick?: (creditNote: CreditNote) => void;
  onCreateCreditNote?: () => void;
  className?: string;
}

interface CreditNoteFilters {
  search: string;
  reason: CreditNoteReason | "all";
  sortBy: "date" | "amount" | "customer";
  sortOrder: "asc" | "desc";
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

const reasonOptions: SelectOption[] = [
  { value: "all", label: "All Reasons" },
  { value: "return", label: "Return" },
  { value: "discount", label: "Discount" },
  { value: "error", label: "Error Correction" },
  { value: "other", label: "Other" },
];

// ============================================================================
// REASON CONFIG
// ============================================================================

const reasonConfig: Record<CreditNoteReason, { label: string; icon: typeof RotateCcw; variant: "info" | "warning" | "error" | "secondary" }> = {
  return: { label: "Return", icon: RotateCcw, variant: "info" },
  discount: { label: "Discount", icon: Percent, variant: "warning" },
  error: { label: "Error", icon: AlertTriangle, variant: "error" },
  other: { label: "Other", icon: MoreHorizontal, variant: "secondary" },
};

// ============================================================================
// CREDIT NOTE CARD COMPONENT
// ============================================================================

interface CreditNoteCardProps {
  creditNote: CreditNote;
  onClick?: () => void;
}

function CreditNoteCard({ creditNote, onClick }: CreditNoteCardProps) {
  const reason = reasonConfig[creditNote.reason];
  const ReasonIcon = reason.icon;

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
        {/* Credit Note Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">
              {creditNote.creditNoteNumber}
            </h3>
            <Badge variant={reason.variant} size="sm">
              <ReasonIcon className="h-3 w-3 mr-1" />
              {reason.label}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{creditNote.customerName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(creditNote.date)}
            </span>
            {creditNote.invoiceNumber && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Invoice: {creditNote.invoiceNumber}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="font-semibold text-error text-lg">
            -{formatCurrency(creditNote.total)}
          </p>
          <p className="text-xs text-slate-500">
            {creditNote.items.length} {creditNote.items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CreditNoteList({
  creditNotes,
  isLoading,
  onCreditNoteClick,
  onCreateCreditNote,
  className,
}: CreditNoteListProps) {
  const [filters, setFilters] = useState<CreditNoteFilters>({
    search: "",
    reason: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  // Filter and sort credit notes
  const filteredCreditNotes = useMemo(() => {
    if (!creditNotes) return [];

    return creditNotes
      .filter((cn) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesNumber = cn.creditNoteNumber.toLowerCase().includes(searchLower);
          const matchesCustomer = cn.customerName.toLowerCase().includes(searchLower);
          const matchesInvoice = cn.invoiceNumber?.toLowerCase().includes(searchLower);
          if (!matchesNumber && !matchesCustomer && !matchesInvoice) return false;
        }

        // Reason filter
        if (filters.reason !== "all" && cn.reason !== filters.reason) {
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
          case "amount":
            comparison = b.total - a.total;
            break;
          case "customer":
            comparison = a.customerName.localeCompare(b.customerName);
            break;
        }

        return filters.sortOrder === "desc" ? comparison : -comparison;
      });
  }, [creditNotes, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredCreditNotes.length) return { total: 0, returns: 0, discounts: 0, errors: 0 };

    return filteredCreditNotes.reduce(
      (acc, cn) => {
        acc.total += cn.total;
        if (cn.reason === "return") {
          acc.returns += cn.total;
        } else if (cn.reason === "discount") {
          acc.discounts += cn.total;
        } else if (cn.reason === "error") {
          acc.errors += cn.total;
        }
        return acc;
      },
      { total: 0, returns: 0, discounts: 0, errors: 0 }
    );
  }, [filteredCreditNotes]);

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
          placeholder="Search credit notes..."
          value={filters.search}
          onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); }}
          className="flex-1"
        />

        <div className="flex gap-2">
          <Select
            options={reasonOptions}
            value={filters.reason}
            onChange={(value) =>
              { setFilters((f) => ({ ...f, reason: value as CreditNoteReason | "all" })); }
            }
            size="md"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="bg-slate-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <p className="text-xs text-slate-500 font-medium">Total Credits</p>
            </div>
            <p className="text-lg font-bold text-error">{formatCurrency(totals.total)}</p>
          </CardBody>
        </Card>

        <Card className="bg-blue-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-600 font-medium">Returns</p>
            </div>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totals.returns)}</p>
          </CardBody>
        </Card>

        <Card className="bg-warning-light">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-warning" />
              <p className="text-xs text-warning-dark font-medium">Discounts</p>
            </div>
            <p className="text-lg font-bold text-warning-dark">{formatCurrency(totals.discounts)}</p>
          </CardBody>
        </Card>

        <Card className="bg-error-light">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-error" />
              <p className="text-xs text-error-dark font-medium">Errors</p>
            </div>
            <p className="text-lg font-bold text-error">{formatCurrency(totals.errors)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Credit Note List */}
      {filteredCreditNotes.length === 0 ? (
        <EmptyState
          variant={filters.search ? "search" : "empty"}
          title={filters.search ? "No credit notes found" : "No credit notes yet"}
          description={
            filters.search
              ? "Try adjusting your search or filters"
              : "Create a credit note for returns, discounts, or corrections"
          }
          action={
            !filters.search && (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreateCreditNote}>
                Create Credit Note
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2">
            {filteredCreditNotes.length} {filteredCreditNotes.length === 1 ? "credit note" : "credit notes"}
          </p>

          {filteredCreditNotes.map((creditNote) => (
            <CreditNoteCard
              key={creditNote.id}
              creditNote={creditNote}
              onClick={() => onCreditNoteClick?.(creditNote)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
