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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRightCircle,
  DollarSign,
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
}

interface EstimateFilters {
  search: string;
  status: EstimateStatus | "all";
  sortBy: "date" | "validUntil" | "amount" | "party";
  sortOrder: "asc" | "desc";
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

const statusOptions: SelectOption[] = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "converted", label: "Converted" },
];

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<EstimateStatus, { label: string; variant: "success" | "warning" | "error" | "info" | "secondary"; icon: typeof CheckCircle }> = {
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

function EstimateCard({ estimate, onClick }: EstimateCardProps) {
  const status = statusConfig[estimate.status];
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

  const isExpiringSoon = () => {
    if (estimate.status !== "sent") return false;
    const validUntil = new Date(estimate.validUntil);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
            {estimate.items.length} {estimate.items.length === 1 ? "item" : "items"}
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
}: EstimateListProps) {
  const [filters, setFilters] = useState<EstimateFilters>({
    search: "",
    status: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  // Filter and sort estimates
  const filteredEstimates = useMemo(() => {
    if (!estimates) return [];

    return estimates
      .filter((estimate) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesNumber = estimate.estimateNumber.toLowerCase().includes(searchLower);
          const matchesParty = estimate.customerName.toLowerCase().includes(searchLower);
          if (!matchesNumber && !matchesParty) return false;
        }

        // Status filter
        if (filters.status !== "all" && estimate.status !== filters.status) {
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
          case "validUntil":
            comparison = new Date(b.validUntil).getTime() - new Date(a.validUntil).getTime();
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
  }, [estimates, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredEstimates.length) return { total: 0, pending: 0, accepted: 0, converted: 0 };

    return filteredEstimates.reduce(
      (acc, est) => {
        acc.total += est.total;
        if (est.status === "sent") {
          acc.pending += est.total;
        } else if (est.status === "accepted") {
          acc.accepted += est.total;
        } else if (est.status === "converted") {
          acc.converted += est.total;
        }
        return acc;
      },
      { total: 0, pending: 0, accepted: 0, converted: 0 }
    );
  }, [filteredEstimates]);

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
          placeholder="Search estimates..."
          value={filters.search}
          onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); }}
          className="flex-1"
        />

        <div className="flex gap-2">
          <Select
            options={statusOptions}
            value={filters.status}
            onChange={(value) =>
              { setFilters((f) => ({ ...f, status: value as EstimateStatus | "all" })); }
            }
            size="md"
          />

          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreateEstimate}>
            New Estimate
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="bg-slate-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <p className="text-xs text-slate-500 font-medium">Total Value</p>
            </div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(totals.total)}</p>
          </CardBody>
        </Card>

        <Card className="bg-blue-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-600 font-medium">Pending</p>
            </div>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totals.pending)}</p>
          </CardBody>
        </Card>

        <Card className="bg-success-light">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <p className="text-xs text-success-dark font-medium">Accepted</p>
            </div>
            <p className="text-lg font-bold text-success">{formatCurrency(totals.accepted)}</p>
          </CardBody>
        </Card>

        <Card className="bg-primary-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <ArrowRightCircle className="h-4 w-4 text-primary-600" />
              <p className="text-xs text-primary-600 font-medium">Converted</p>
            </div>
            <p className="text-lg font-bold text-primary-700">{formatCurrency(totals.converted)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Estimate List */}
      {filteredEstimates.length === 0 ? (
        <EmptyState
          variant={filters.search ? "search" : "empty"}
          title={filters.search ? "No estimates found" : "No estimates yet"}
          description={
            filters.search
              ? "Try adjusting your search or filters"
              : "Create your first estimate or quotation"
          }
          action={
            !filters.search && (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreateEstimate}>
                Create Estimate
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2">
            {filteredEstimates.length} {filteredEstimates.length === 1 ? "estimate" : "estimates"}
          </p>

          {filteredEstimates.map((estimate) => (
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
