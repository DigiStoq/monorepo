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
  XCircle,
  AlertCircle,
  ArrowRightCircle,
} from "lucide-react";
import type { Estimate, EstimateStatus } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface EstimateListProps {
  estimates: Estimate[] | null;
  isLoading?: boolean;
  onEstimateClick?: (estimate: Estimate) => void;
  onCreateEstimate?: () => void;
  className?: string;
  hasActiveFilters?: boolean;
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
  converted: { label: "Converted", variant: "success", icon: ArrowRightCircle },
};

// ============================================================================
// ESTIMATE CARD COMPONENT
// ============================================================================

interface EstimateCardProps {
  estimate: Estimate;
  onClick?: () => void;
}

function EstimateCard({
  estimate,
  onClick,
}: EstimateCardProps): React.ReactNode {
  const status = statusConfig[estimate.status];
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

  const isExpiringSoon = (): boolean => {
    if (estimate.status !== "sent") return false;
    const validUntil = new Date(estimate.validUntil);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  };

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
        {/* Estimate Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">
              {estimate.estimateNumber}
            </h3>
            <Badge variant={status.variant} size="sm">
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
            {isExpiringSoon() && (
              <Badge variant="warning" size="sm">
                Expiring Soon
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{estimate.customerName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(estimate.date)}
            </span>
            {estimate.status !== "converted" && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Valid until: {formatDate(estimate.validUntil)}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="font-semibold text-slate-900">
            {formatCurrency(estimate.total)}
          </p>
          <p className="text-xs text-slate-500">
            {estimate.items.length}{" "}
            {estimate.items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EstimateList({
  estimates,
  isLoading,
  onEstimateClick,
  onCreateEstimate,
  className,
  hasActiveFilters = false,
}: EstimateListProps): React.ReactNode {
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
  const displayEstimates = estimates ?? [];

  return (
    <div className={className}>
      {/* Estimate List */}
      {displayEstimates.length === 0 ? (
        <EmptyState
          variant={hasActiveFilters ? "search" : "empty"}
          title={hasActiveFilters ? "No estimates found" : "No estimates yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Create your first estimate or quotation"
          }
          action={
            !hasActiveFilters && (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onCreateEstimate}
              >
                Create Estimate
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2 px-1">
            {displayEstimates.length}{" "}
            {displayEstimates.length === 1 ? "estimate" : "estimates"}
          </p>

          {displayEstimates.map((estimate) => (
            <EstimateCard
              key={estimate.id}
              estimate={estimate}
              onClick={() => onEstimateClick?.(estimate)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
