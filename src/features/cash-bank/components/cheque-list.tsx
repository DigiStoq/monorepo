import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardBody,
  Input,
  Badge,
  Select,
  type SelectOption,
} from "@/components/ui";
import {
  Search,
  FileCheck,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { Cheque, ChequeStatus, ChequeType } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface ChequeListProps {
  cheques: Cheque[];
  onChequeClick: (cheque: Cheque) => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const statusConfig: Record<
  ChequeStatus,
  {
    label: string;
    icon: React.ReactNode;
    variant: "success" | "warning" | "error" | "secondary";
  }
> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-4 w-4" />,
    variant: "warning",
  },
  cleared: {
    label: "Cleared",
    icon: <CheckCircle className="h-4 w-4" />,
    variant: "success",
  },
  bounced: {
    label: "Bounced",
    icon: <AlertTriangle className="h-4 w-4" />,
    variant: "error",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    variant: "secondary",
  },
};

const typeOptions: SelectOption[] = [
  { value: "all", label: "All Cheques" },
  { value: "received", label: "Received" },
  { value: "issued", label: "Issued" },
];

const statusOptions: SelectOption[] = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "cleared", label: "Cleared" },
  { value: "bounced", label: "Bounced" },
  { value: "cancelled", label: "Cancelled" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ChequeList({
  cheques,
  onChequeClick,
  className,
}: ChequeListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ChequeType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ChequeStatus | "all">("all");

  // Filter cheques
  const filteredCheques = useMemo(() => {
    return cheques.filter((cheque) => {
      const matchesSearch =
        cheque.chequeNumber.toLowerCase().includes(search.toLowerCase()) ||
        cheque.customerName.toLowerCase().includes(search.toLowerCase()) ||
        cheque.bankName.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || cheque.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || cheque.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [cheques, search, typeFilter, statusFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    const received = filteredCheques
      .filter((c) => c.type === "received" && c.status === "pending")
      .reduce((sum, c) => sum + c.amount, 0);
    const issued = filteredCheques
      .filter((c) => c.type === "issued" && c.status === "pending")
      .reduce((sum, c) => sum + c.amount, 0);
    return { received, issued };
  }, [filteredCheques]);

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

  // Check if due soon (within 7 days)
  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 && diffDays <= 7;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-success" />
              <div>
                <p className="text-xs text-slate-500">Pending Received</p>
                <p className="font-semibold text-success">
                  {formatCurrency(totals.received)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-error" />
              <div>
                <p className="text-xs text-slate-500">Pending Issued</p>
                <p className="font-semibold text-error">
                  {formatCurrency(totals.issued)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search cheques..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(value) => {
            setTypeFilter(value as ChequeType | "all");
          }}
          className="w-36"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value as ChequeStatus | "all");
          }}
          className="w-36"
        />
      </div>

      {/* Cheque List */}
      <div className="space-y-2">
        {filteredCheques.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <FileCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                No cheques found
              </h3>
              <p className="text-slate-500">
                {search || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Record your first cheque"}
              </p>
            </CardBody>
          </Card>
        ) : (
          filteredCheques.map((cheque) => {
            const status = statusConfig[cheque.status];
            const isReceived = cheque.type === "received";
            const dueSoon =
              cheque.status === "pending" && isDueSoon(cheque.dueDate);

            return (
              <Card
                key={cheque.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  onChequeClick(cheque);
                }}
              >
                <CardBody className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          isReceived ? "bg-success-light" : "bg-error-light"
                        )}
                      >
                        {isReceived ? (
                          <ArrowDownLeft className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-error" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {cheque.customerName}
                          </span>
                          <Badge variant={status.variant} size="sm">
                            {status.icon}
                            <span className="ml-1">{status.label}</span>
                          </Badge>
                          {dueSoon && (
                            <Badge variant="warning" size="sm">
                              Due Soon
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                          <span className="font-mono">
                            #{cheque.chequeNumber}
                          </span>
                          <span>•</span>
                          <span>{cheque.bankName}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(cheque.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-lg font-bold",
                          isReceived ? "text-success" : "text-error"
                        )}
                      >
                        {formatCurrency(cheque.amount)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isReceived ? "Received" : "Issued"}
                      </div>
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
