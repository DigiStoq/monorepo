import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Input,
  Select,
  Badge,
  type SelectOption,
} from "@/components/ui";
import { Search, Landmark, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Loan, LoanFilters, LoanType, LoanStatus } from "../types";

// ============================================================================
// PROPS
// ============================================================================

interface LoanListProps {
  loans: Loan[];
  onLoanClick: (loan: Loan) => void;
}

// ============================================================================
// OPTIONS
// ============================================================================

const typeOptions: SelectOption[] = [
  { value: "all", label: "All Types" },
  { value: "taken", label: "Loans Taken" },
  { value: "given", label: "Loans Given" },
];

const statusOptions: SelectOption[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "defaulted", label: "Defaulted" },
];

const statusConfig: Record<
  LoanStatus,
  { label: string; variant: "success" | "warning" | "error" | "default" }
> = {
  active: { label: "Active", variant: "success" },
  closed: { label: "Closed", variant: "default" },
  defaulted: { label: "Defaulted", variant: "error" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function LoanList({
  loans,
  onLoanClick,
}: LoanListProps): React.ReactNode {
  const [filters, setFilters] = useState<LoanFilters>({
    search: "",
    type: "all",
    status: "all",
  });

  // Filter loans
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesSearch =
        loan.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (loan.customerName
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ??
          false) ||
        (loan.lenderName
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ??
          false);
      const matchesType = filters.type === "all" || loan.type === filters.type;
      const matchesStatus =
        filters.status === "all" || loan.status === filters.status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [loans, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    const taken = filteredLoans
      .filter((l) => l.type === "taken")
      .reduce((sum, l) => sum + l.outstandingAmount, 0);
    const given = filteredLoans
      .filter((l) => l.type === "given")
      .reduce((sum, l) => sum + l.outstandingAmount, 0);
    return { taken, given, net: given - taken };
  }, [filteredLoans]);

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <ArrowDownLeft className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Loans Taken (Payable)</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(totals.taken)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  Loans Given (Receivable)
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totals.given)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Landmark className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Net Position</p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    totals.net >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {formatCurrency(Math.abs(totals.net))}
                  <span className="text-sm ml-1">
                    {totals.net >= 0 ? "Receivable" : "Payable"}
                  </span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search loans..."
            value={filters.search}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, search: e.target.value }));
            }}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          options={typeOptions}
          value={filters.type}
          onChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              type: value as LoanType | "all",
            }));
          }}
          className="w-40"
        />
        <Select
          options={statusOptions}
          value={filters.status}
          onChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              status: value as LoanStatus | "all",
            }));
          }}
          className="w-36"
        />
      </div>

      {/* Loan Cards */}
      {filteredLoans.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <Landmark className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No loans found
            </h3>
            <p className="text-slate-500">
              Try adjusting your filters or add a new loan
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredLoans.map((loan) => {
            const config = statusConfig[loan.status];
            const progress = loan.totalEmis
              ? (loan.paidEmis / loan.totalEmis) * 100
              : 0;

            return (
              <Card
                key={loan.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  onLoanClick(loan);
                }}
              >
                <CardBody className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          loan.type === "taken" ? "bg-red-100" : "bg-green-100"
                        )}
                      >
                        {loan.type === "taken" ? (
                          <ArrowDownLeft
                            className={cn("h-5 w-5", "text-red-600")}
                          />
                        ) : (
                          <ArrowUpRight
                            className={cn("h-5 w-5", "text-green-600")}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {loan.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {loan.type === "taken"
                            ? loan.lenderName
                            : loan.customerName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">
                            {loan.interestRate}% {loan.interestType}
                          </span>
                          {loan.emiAmount && (
                            <span className="text-xs text-slate-400">
                              • EMI: {formatCurrency(loan.emiAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={config.variant}>{config.label}</Badge>
                      <p
                        className={cn(
                          "text-lg font-bold mt-1",
                          loan.type === "taken"
                            ? "text-red-600"
                            : "text-green-600"
                        )}
                      >
                        {formatCurrency(loan.outstandingAmount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        of {formatCurrency(loan.principalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* EMI Progress */}
                  {loan.totalEmis && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>
                          {loan.paidEmis} of {loan.totalEmis} EMIs paid
                        </span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            loan.type === "taken"
                              ? "bg-red-500"
                              : "bg-green-500"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
