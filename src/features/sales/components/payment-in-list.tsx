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
  Banknote,
  Calendar,
  User,
  CreditCard,
  Building2,
  FileText,
  Wallet,
} from "lucide-react";
import type { PaymentIn, PaymentMode } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentInListProps {
  payments: PaymentIn[] | null;
  isLoading?: boolean;
  onPaymentClick?: (payment: PaymentIn) => void;
  onRecordPayment?: () => void;
  className?: string;
}

interface PaymentFilters {
  search: string;
  paymentMode: PaymentMode | "all";
  sortBy: "date" | "amount" | "party";
  sortOrder: "asc" | "desc";
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

const paymentModeOptions: SelectOption[] = [
  { value: "all", label: "All Modes" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "ach", label: "ACH Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

// ============================================================================
// PAYMENT MODE CONFIG
// ============================================================================

const paymentModeConfig: Record<PaymentMode, { label: string; icon: typeof Banknote; color: string }> = {
  cash: { label: "Cash", icon: Banknote, color: "text-green-600 bg-green-100" },
  bank: { label: "Bank", icon: Building2, color: "text-blue-600 bg-blue-100" },
  card: { label: "Card", icon: CreditCard, color: "text-purple-600 bg-purple-100" },
  ach: { label: "ACH Transfer", icon: Building2, color: "text-teal-600 bg-teal-100" },
  cheque: { label: "Cheque", icon: FileText, color: "text-slate-600 bg-slate-100" },
  other: { label: "Other", icon: Wallet, color: "text-gray-600 bg-gray-100" },
};

// ============================================================================
// PAYMENT CARD COMPONENT
// ============================================================================

interface PaymentCardProps {
  payment: PaymentIn;
  onClick?: () => void;
}

function PaymentCard({ payment, onClick }: PaymentCardProps) {
  const mode = paymentModeConfig[payment.paymentMode];
  const ModeIcon = mode.icon;

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
        {/* Payment Mode Icon */}
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", mode.color)}>
          <ModeIcon className="h-5 w-5" />
        </div>

        {/* Payment Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">
              {payment.receiptNumber}
            </h3>
            <Badge variant="success" size="sm">
              {mode.label}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{payment.customerName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(payment.date)}
            </span>
            {payment.invoiceNumber && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Invoice: {payment.invoiceNumber}
              </span>
            )}
            {payment.referenceNumber && (
              <span>Ref: {payment.referenceNumber}</span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="font-semibold text-success text-lg">
            {formatCurrency(payment.amount)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PaymentInList({
  payments,
  isLoading,
  onPaymentClick,
  onRecordPayment,
  className,
}: PaymentInListProps) {
  const [filters, setFilters] = useState<PaymentFilters>({
    search: "",
    paymentMode: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    if (!payments) return [];

    return payments
      .filter((payment) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesNumber = payment.receiptNumber.toLowerCase().includes(searchLower);
          const matchesParty = payment.customerName.toLowerCase().includes(searchLower);
          const matchesRef = payment.referenceNumber?.toLowerCase().includes(searchLower);
          if (!matchesNumber && !matchesParty && !matchesRef) return false;
        }

        // Payment mode filter
        if (filters.paymentMode !== "all" && payment.paymentMode !== filters.paymentMode) {
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
            comparison = b.amount - a.amount;
            break;
          case "party":
            comparison = a.customerName.localeCompare(b.customerName);
            break;
        }

        return filters.sortOrder === "desc" ? comparison : -comparison;
      });
  }, [payments, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredPayments.length) return { total: 0, cash: 0, bank: 0, other: 0 };

    return filteredPayments.reduce(
      (acc, payment) => {
        acc.total += payment.amount;
        if (payment.paymentMode === "cash") {
          acc.cash += payment.amount;
        } else if (payment.paymentMode === "bank") {
          acc.bank += payment.amount;
        } else {
          acc.other += payment.amount;
        }
        return acc;
      },
      { total: 0, cash: 0, bank: 0, other: 0 }
    );
  }, [filteredPayments]);

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
          placeholder="Search payments..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="flex-1"
        />

        <div className="flex gap-2">
          <Select
            options={paymentModeOptions}
            value={filters.paymentMode}
            onChange={(value) =>
              setFilters((f) => ({ ...f, paymentMode: value as PaymentMode | "all" }))
            }
            size="md"
          />

          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onRecordPayment}>
            Record Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="bg-slate-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-slate-500" />
              <p className="text-xs text-slate-500 font-medium">Total Received</p>
            </div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(totals.total)}</p>
          </CardBody>
        </Card>

        <Card className="bg-green-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">Cash</p>
            </div>
            <p className="text-lg font-bold text-green-700">{formatCurrency(totals.cash)}</p>
          </CardBody>
        </Card>

        <Card className="bg-blue-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-600 font-medium">Bank</p>
            </div>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totals.bank)}</p>
          </CardBody>
        </Card>

        <Card className="bg-purple-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <p className="text-xs text-purple-600 font-medium">Other</p>
            </div>
            <p className="text-lg font-bold text-purple-700">{formatCurrency(totals.other)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Payment List */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          variant={filters.search ? "search" : "empty"}
          title={filters.search ? "No payments found" : "No payments yet"}
          description={
            filters.search
              ? "Try adjusting your search or filters"
              : "Record your first payment receipt"
          }
          action={
            !filters.search && (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onRecordPayment}>
                Record Payment
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-2">
            {filteredPayments.length} {filteredPayments.length === 1 ? "payment" : "payments"}
          </p>

          {filteredPayments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onClick={() => onPaymentClick?.(payment)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
