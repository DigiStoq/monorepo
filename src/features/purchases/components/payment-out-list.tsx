import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, Input, Badge, Select, type SelectOption } from "@/components/ui";
import { Search, ArrowDownCircle, Calendar, CreditCard, Banknote, Building2 } from "lucide-react";
import type { PaymentOut, PaymentOutMode } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentOutListProps {
  payments: PaymentOut[];
  onPaymentClick: (payment: PaymentOut) => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const paymentModeConfig: Record<PaymentOutMode, { label: string; icon: React.ReactNode; color: string }> = {
  cash: { label: "Cash", icon: <Banknote className="h-4 w-4" />, color: "bg-green-100 text-green-700" },
  bank: { label: "Bank Transfer", icon: <Building2 className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" },
  card: { label: "Card", icon: <CreditCard className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
  ach: { label: "ACH Transfer", icon: <Building2 className="h-4 w-4" />, color: "bg-teal-100 text-teal-700" },
  cheque: { label: "Cheque", icon: <CreditCard className="h-4 w-4" />, color: "bg-orange-100 text-orange-700" },
  other: { label: "Other", icon: <CreditCard className="h-4 w-4" />, color: "bg-slate-100 text-slate-700" },
};

const modeOptions: SelectOption[] = [
  { value: "all", label: "All Payment Modes" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "ach", label: "ACH Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentOutList({ payments, onPaymentClick, className }: PaymentOutListProps) {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<PaymentOutMode | "all">("all");

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
        payment.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (payment.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesMode = modeFilter === "all" || payment.paymentMode === modeFilter;

      return matchesSearch && matchesMode;
    });
  }, [payments, search, modeFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    return { total, count: filteredPayments.length };
  }, [filteredPayments]);

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search payments..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          options={modeOptions}
          value={modeFilter}
          onChange={(value) => { setModeFilter(value as PaymentOutMode | "all"); }}
          className="w-48"
        />
      </div>

      {/* Summary */}
      <Card>
        <CardBody className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-error" />
              <span className="text-sm text-slate-600">
                {totals.count} payment{totals.count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-lg font-bold text-error">
              {formatCurrency(totals.total)}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Payment List */}
      <div className="space-y-2">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <ArrowDownCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No payments found</h3>
              <p className="text-slate-500">
                {search || modeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Record your first payment to a supplier"}
              </p>
            </CardBody>
          </Card>
        ) : (
          filteredPayments.map((payment) => {
            const modeConfig = paymentModeConfig[payment.paymentMode];

            return (
              <Card
                key={payment.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => { onPaymentClick(payment); }}
              >
                <CardBody className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", modeConfig.color)}>
                        {modeConfig.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {payment.customerName}
                          </span>
                          <Badge variant="secondary" size="sm">
                            {payment.paymentNumber}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(payment.date)}
                          </span>
                          <span>{modeConfig.label}</span>
                          {payment.invoiceNumber && (
                            <span className="text-primary-600">
                              → {payment.invoiceNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-error">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.referenceNumber && (
                        <div className="text-xs text-slate-500">
                          Ref: {payment.referenceNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
