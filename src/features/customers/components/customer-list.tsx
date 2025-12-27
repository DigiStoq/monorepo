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
import { Plus, Phone, Mail, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Customer, CustomerType, CustomerFilters } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface CustomerListProps {
  customers: Customer[] | null;
  isLoading?: boolean;
  onCustomerClick?: (customer: Customer) => void;
  onAddCustomer?: () => void;
  className?: string;
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

const typeOptions: SelectOption[] = [
  { value: "all", label: "All Customers" },
  { value: "customer", label: "Customers" },
  { value: "supplier", label: "Suppliers" },
  { value: "both", label: "Both" },
];

const balanceOptions: SelectOption[] = [
  { value: "all", label: "All Balances" },
  { value: "receivable", label: "To Receive" },
  { value: "payable", label: "To Pay" },
];

// ============================================================================
// CUSTOMER CARD COMPONENT
// ============================================================================

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
}

function CustomerCard({ customer, onClick }: CustomerCardProps) {
  const isReceivable = customer.currentBalance > 0;
  const hasBalance = customer.currentBalance !== 0;

  const formatCurrency = (value: number) =>
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
              {customer.type === "both" ? "C/S" : customer.type.charAt(0).toUpperCase()}
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
}: CustomerListProps) {
  const [filters, setFilters] = useState<CustomerFilters>({
    search: "",
    type: "all",
    balanceType: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];

    return customers
      .filter((customer) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesName = customer.name.toLowerCase().includes(searchLower);
          const matchesPhone = customer.phone?.includes(filters.search);
          const matchesEmail = customer.email?.toLowerCase().includes(searchLower);
          if (!matchesName && !matchesPhone && !matchesEmail) return false;
        }

        // Type filter
        if (filters.type !== "all" && customer.type !== filters.type) {
          return false;
        }

        // Balance filter
        if (filters.balanceType === "receivable" && customer.currentBalance <= 0) {
          return false;
        }
        if (filters.balanceType === "payable" && customer.currentBalance >= 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (filters.sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "balance":
            comparison = Math.abs(b.currentBalance) - Math.abs(a.currentBalance);
            break;
          case "recent":
            comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            break;
        }

        return filters.sortOrder === "desc" ? -comparison : comparison;
      });
  }, [customers, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredCustomers.length) return { receivable: 0, payable: 0 };

    return filteredCustomers.reduce(
      (acc, customer) => {
        if (customer.currentBalance > 0) {
          acc.receivable += customer.currentBalance;
        } else {
          acc.payable += Math.abs(customer.currentBalance);
        }
        return acc;
      },
      { receivable: 0, payable: 0 }
    );
  }, [filteredCustomers]);

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
          placeholder="Search customers..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="flex-1"
        />

        <div className="flex gap-2">
          <Select
            options={typeOptions}
            value={filters.type}
            onChange={(value) =>
              setFilters((f) => ({ ...f, type: value as CustomerType | "all" }))
            }
            size="md"
          />

          <Select
            options={balanceOptions}
            value={filters.balanceType}
            onChange={(value) =>
              setFilters((f) => ({
                ...f,
                balanceType: value as "all" | "receivable" | "payable",
              }))
            }
            size="md"
          />

          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onAddCustomer}>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="bg-success-light border-success/20">
          <CardBody className="py-3">
            <p className="text-xs text-success-dark font-medium">To Receive</p>
            <p className="text-lg font-bold text-success">
              {formatCurrency(totals.receivable)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-error-light border-error/20">
          <CardBody className="py-3">
            <p className="text-xs text-error-dark font-medium">To Pay</p>
            <p className="text-lg font-bold text-error">
              {formatCurrency(totals.payable)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          variant={filters.search ? "search" : "empty"}
          title={filters.search ? "No customers found" : "No customers yet"}
          description={
            filters.search
              ? "Try adjusting your search or filters"
              : "Add your first customer or supplier to get started"
          }
          action={
            !filters.search && (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onAddCustomer}>
                Add Customer
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2">
            {filteredCustomers.length} {filteredCustomers.length === 1 ? "customer" : "customers"}
          </p>

          {filteredCustomers.map((customer) => (
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
