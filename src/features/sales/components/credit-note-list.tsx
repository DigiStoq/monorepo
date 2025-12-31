import { cn } from "@/lib/cn";
import { Button, Badge } from "@/components/ui";
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
  hasActiveFilters?: boolean;
}

// ============================================================================
// REASON CONFIG
// ============================================================================

const reasonConfig: Record<
  CreditNoteReason,
  {
    label: string;
    icon: typeof RotateCcw;
    variant: "info" | "warning" | "error" | "secondary";
  }
> = {
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

function CreditNoteCard({
  creditNote,
  onClick,
}: CreditNoteCardProps): React.ReactNode {
  const reason = reasonConfig[creditNote.reason];
  const ReasonIcon = reason.icon;

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
            {creditNote.items.length}{" "}
            {creditNote.items.length === 1 ? "item" : "items"}
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
  hasActiveFilters = false,
}: CreditNoteListProps): React.ReactNode {
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
  const displayCreditNotes = creditNotes ?? [];

  return (
    <div className={className}>
      {/* Credit Note List */}
      {displayCreditNotes.length === 0 ? (
        <EmptyState
          variant={hasActiveFilters ? "search" : "empty"}
          title={
            hasActiveFilters ? "No credit notes found" : "No credit notes yet"
          }
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Create a credit note for returns, discounts, or corrections"
          }
          action={
            !hasActiveFilters && (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onCreateCreditNote}
              >
                Create Credit Note
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2 px-1">
            {displayCreditNotes.length}{" "}
            {displayCreditNotes.length === 1 ? "credit note" : "credit notes"}
          </p>

          {displayCreditNotes.map((creditNote) => (
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
