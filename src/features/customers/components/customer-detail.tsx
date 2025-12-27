import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Table,
  type Column,
} from "@/components/ui";
import { EmptyState, CardSkeleton, TableSkeleton } from "@/components/common";
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  Edit,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import type { Customer, CustomerTransaction } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface CustomerDetailProps {
  customer: Customer | null;
  transactions: CustomerTransaction[] | null;
  isLoading?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddTransaction?: (type: "payment-in" | "payment-out") => void;
  className?: string;
}

// ============================================================================
// INFO ITEM
// ============================================================================

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null | undefined;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-100 rounded-lg shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomerDetail({
  customer,
  transactions,
  isLoading,
  onEdit,
  onDelete,
  onAddTransaction,
  className,
}: CustomerDetailProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Math.abs(value));

  // Transaction table columns
  const columns: Column<CustomerTransaction>[] = [
    {
      key: "date",
      header: "Date",
      accessor: (row) => row.date,
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {new Date(row.date).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => {
        const typeLabels: Record<CustomerTransaction["type"], string> = {
          sale: "Sale",
          purchase: "Purchase",
          "payment-in": "Payment In",
          "payment-out": "Payment Out",
          "credit-note": "Credit Note",
          "debit-note": "Debit Note",
        };
        const isCredit = ["sale", "payment-in", "debit-note"].includes(row.type);
        return (
          <Badge variant={isCredit ? "success" : "error"} size="sm">
            {typeLabels[row.type]}
          </Badge>
        );
      },
    },
    {
      key: "invoiceNumber",
      header: "Reference",
      accessor: (row) => row.invoiceNumber || "-",
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      accessor: (row) => row.amount,
      cell: (row) => {
        const isCredit = ["sale", "payment-in", "debit-note"].includes(row.type);
        return (
          <span className={cn("font-medium", isCredit ? "text-success" : "text-error")}>
            {isCredit ? "+" : "-"}
            {formatCurrency(row.amount)}
          </span>
        );
      },
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      accessor: (row) => row.balance,
      cell: (row) => (
        <span className={cn("font-medium", row.balance >= 0 ? "text-success" : "text-error")}>
          {formatCurrency(row.balance)}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <CardSkeleton bodyLines={5} />
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  if (!customer) {
    return (
      <EmptyState
        title="Select a customer"
        description="Choose a customer from the list to view details"
        className={className}
      />
    );
  }

  const isReceivable = customer.currentBalance > 0;
  const hasBalance = customer.currentBalance !== 0;

  const fullAddress = [customer.address, customer.city, customer.state, customer.zipCode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Customer Info Card */}
      <Card>
        <CardHeader
          title={customer.name}
          subtitle={
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  customer.type === "customer"
                    ? "success"
                    : customer.type === "supplier"
                    ? "warning"
                    : "info"
                }
              >
                {customer.type === "customer"
                  ? "Customer"
                  : customer.type === "supplier"
                  ? "Supplier"
                  : "Customer & Supplier"}
              </Badge>
              {!customer.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
          }
          action={
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-error" />
              </Button>
            </div>
          }
        />

        <CardBody>
          {/* Balance Display */}
          {hasBalance && (
            <div
              className={cn(
                "p-4 rounded-xl mb-6",
                isReceivable ? "bg-success-light" : "bg-error-light"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {isReceivable ? "You will receive" : "You will pay"}
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      isReceivable ? "text-success" : "text-error"
                    )}
                  >
                    {formatCurrency(customer.currentBalance)}
                  </p>
                </div>
                <div
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center",
                    isReceivable ? "bg-success/20" : "bg-error/20"
                  )}
                >
                  {isReceivable ? (
                    <ArrowDownLeft className={cn("h-6 w-6", isReceivable ? "text-success" : "text-error")} />
                  ) : (
                    <ArrowUpRight className={cn("h-6 w-6", isReceivable ? "text-success" : "text-error")} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact & Address Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoItem
              icon={<Phone className="h-4 w-4 text-slate-500" />}
              label="Phone"
              value={customer.phone}
            />
            <InfoItem
              icon={<Mail className="h-4 w-4 text-slate-500" />}
              label="Email"
              value={customer.email}
            />
            <InfoItem
              icon={<MapPin className="h-4 w-4 text-slate-500" />}
              label="Address"
              value={fullAddress || undefined}
            />
            <InfoItem
              icon={<Building2 className="h-4 w-4 text-slate-500" />}
              label="Tax ID"
              value={customer.taxId}
            />
            {customer.creditLimit && customer.creditLimit > 0 && (
              <InfoItem
                icon={<CreditCard className="h-4 w-4 text-slate-500" />}
                label="Credit Limit"
                value={formatCurrency(customer.creditLimit)}
              />
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => onAddTransaction?.("payment-in")}
            >
              Payment In
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => onAddTransaction?.("payment-out")}
            >
              Payment Out
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader title="Transaction History" />
        <CardBody className="p-0">
          {!transactions || transactions.length === 0 ? (
            <EmptyState
              title="No transactions"
              description="Transactions will appear here"
              compact
            />
          ) : (
            <Table
              columns={columns}
              data={transactions}
              getRowKey={(row) => row.id}
              hoverable
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
