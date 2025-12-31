import { cn } from "@/lib/cn";
import { Button, Badge } from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import { Plus, Phone, Mail, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Customer } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface CustomerListProps {
  customers: Customer[] | null;
  isLoading?: boolean;
  onCustomerClick?: (customer: Customer) => void;
  onAddCustomer?: () => void;
  className?: string;
  hasActiveFilters?: boolean;
}

// ============================================================================
// CUSTOMER CARD COMPONENT
// ============================================================================

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
}

function CustomerCard({
  customer,
  onClick,
}: CustomerCardProps): React.ReactNode {
  const isReceivable = customer.currentBalance > 0;
  const hasBalance = customer.currentBalance !== 0;

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Math.abs(value));

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
        {/* Customer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">
              {customer.name}
            </h3>
            <Badge
              variant={
                customer.type === "customer"
                  ? "success"
                  : customer.type === "supplier"
                    ? "warning"
                    : "info"
              }
              size="sm"
            >
              {customer.type === "both"
                ? "C/S"
                : customer.type.charAt(0).toUpperCase()}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {customer.phone}
              </span>
            )}
            {customer.email && (
              <span className="flex items-center gap-1 truncate max-w-[180px]">
                <Mail className="h-3.5 w-3.5" />
                {customer.email}
              </span>
            )}
          </div>

          {customer.city && (
            <p className="text-xs text-slate-400 mt-1 truncate">
              {customer.city}
              {customer.state && `, ${customer.state}`}
            </p>
          )}
        </div>

        {/* Balance */}
        {hasBalance && (
          <div className="text-right shrink-0">
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-semibold",
                isReceivable ? "text-success" : "text-error"
              )}
            >
              {isReceivable ? (
                <ArrowDownLeft className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
              {formatCurrency(customer.currentBalance)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isReceivable ? "To Receive" : "To Pay"}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CustomerList({
  customers,
  isLoading,
  onCustomerClick,
  onAddCustomer,
  className,
  hasActiveFilters = false,
}: CustomerListProps): React.ReactNode {
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
  const displayCustomers = customers ?? [];

  return (
    <div className={className}>
      {/* Customer List */}
      {displayCustomers.length === 0 ? (
        <EmptyState
          variant={hasActiveFilters ? "search" : "empty"}
          title={hasActiveFilters ? "No customers found" : "No customers yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Add your first customer or supplier to get started"
          }
          action={
            !hasActiveFilters && (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onAddCustomer}
              >
                Add Customer
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2 px-1">
            {displayCustomers.length}{" "}
            {displayCustomers.length === 1 ? "customer" : "customers"}
          </p>

          {displayCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onClick={() => onCustomerClick?.(customer)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
