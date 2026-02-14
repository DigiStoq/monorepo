import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";
import { Button, Badge } from "@/components/ui";
import { EmptyState, CardSkeleton } from "@/components/common";
import { Plus, Phone, Mail, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
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

  const { formatCurrency } = useCurrency();

  const getTypeBadge = (
    type: string
  ): {
    label: string;
    variant: "success" | "warning" | "info" | "secondary";
  } => {
    switch (type) {
      case "customer":
        return { label: "Customer", variant: "success" as const };
      case "supplier":
        return { label: "Supplier", variant: "warning" as const };
      case "both":
        return { label: "Both", variant: "info" as const };
      default:
        return { label: type, variant: "secondary" as const };
    }
  };

  const typeConfig = getTypeBadge(customer.type);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full bg-white rounded-xl border border-slate-200",
        "hover:border-primary-300 hover:shadow-md",
        "transition-all duration-200 text-left overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Avatar & Info */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Avatar / Icon */}
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm",
                customer.type === "customer"
                  ? "bg-success-50 text-success-600"
                  : customer.type === "supplier"
                    ? "bg-warning-50 text-warning-700"
                    : "bg-primary-50 text-primary-600"
              )}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 truncate text-base group-hover:text-primary-600 transition-colors">
                  {customer.name}
                </h3>
              </div>

              {/* Contact Info (Stacked) */}
              <div className="space-y-1">
                {customer.phone ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{customer.phone}</span>
                  </div>
                ) : (
                  <div className="h-5" /> /* Spacer to maintain height consistency if needed */
                )}

                {customer.email ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                ) : null}

                {/* City/State */}
                {(!!customer.city || !!customer.state) && (
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {customer.city}
                    {customer.city && customer.state && ", "}
                    {customer.state}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Balance & Badge */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              variant={typeConfig.variant}
              size="sm"
              className="capitalize"
            >
              {typeConfig.label}
            </Badge>

            {hasBalance && (
              <div className="text-right mt-1">
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 text-sm font-bold",
                    isReceivable ? "text-success-600" : "text-error-600"
                  )}
                >
                  {isReceivable ? (
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  )}
                  {formatCurrency(Math.abs(customer.currentBalance))}
                </div>
                <p
                  className={cn(
                    "text-[10px] uppercase tracking-wider font-medium",
                    isReceivable ? "text-success-600/70" : "text-error-600/70"
                  )}
                >
                  {isReceivable ? "To Receive" : "To Pay"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// VIRTUALIZED LIST COMPONENT
// ============================================================================

const GAP = 12;

interface VirtualizedCustomerListProps {
  customers: Customer[];
  onCustomerClick?: (customer: Customer) => void;
}

function VirtualizedCustomerList({
  customers,
  onCustomerClick,
}: VirtualizedCustomerListProps): React.ReactNode {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: customers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160, // approximate initial height
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      style={{ contain: "strict" }}
    >
      <p className="text-sm text-slate-500 mb-2 px-1 sticky top-0 bg-inherit z-10">
        {customers.length} {customers.length === 1 ? "customer" : "customers"}
      </p>

      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const customer = customers[virtualRow.index];
          return (
            <div
              key={customer.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: `${GAP}px`, // Use padding for gap
              }}
            >
              <CustomerCard
                customer={customer}
                onClick={() => onCustomerClick?.(customer)}
              />
            </div>
          );
        })}
      </div>
    </div>
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
    <div className={cn("h-full flex flex-col", className)}>
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
        <VirtualizedCustomerList
          customers={displayCustomers}
          onCustomerClick={onCustomerClick}
        />
      )}
    </div>
  );
}
