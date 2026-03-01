import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardBody,
  Badge,
  Select,
  type SelectOption,
} from "@/components/ui";
import { ReportLayout } from "../components";
import { DateRangeFilter } from "../components/date-range-filter";
import {
  Banknote,
  Building2,
  CreditCard,
  FileCheck,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { DateRange, PaymentMode, CashMovementTransaction } from "../types";
import { useCashMovementReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";

// ============================================================================
// HELPERS
// ============================================================================

const modeConfig: Record<
  PaymentMode,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  cash: {
    label: "Cash",
    icon: <Banknote className="h-5 w-5" />,
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  bank: {
    label: "Bank",
    icon: <Building2 className="h-5 w-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  card: {
    label: "Card",
    icon: <CreditCard className="h-5 w-5" />,
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  ach: {
    label: "ACH",
    icon: <Building2 className="h-5 w-5" />,
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
  },
  cheque: {
    label: "Cheque",
    icon: <FileCheck className="h-5 w-5" />,
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  other: {
    label: "Other",
    icon: <MoreHorizontal className="h-5 w-5" />,
    color: "text-slate-700",
    bgColor: "bg-slate-100",
  },
};

const typeConfig: Record<
  CashMovementTransaction["type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  payment_in: {
    label: "Payment In",
    icon: <ArrowUpCircle className="h-4 w-4" />,
    color: "text-green-700",
  },
  payment_out: {
    label: "Payment Out",
    icon: <ArrowDownCircle className="h-4 w-4" />,
    color: "text-red-700",
  },
  expense: {
    label: "Expense",
    icon: <Receipt className="h-4 w-4" />,
    color: "text-orange-700",
  },
};

const modeFilterOptions: SelectOption[] = [
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

export function CashMovementReportPage(): React.ReactNode {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [modeFilter, setModeFilter] = useState<PaymentMode | "all">("all");

  // Fetch data from PowerSync
  const { report, isLoading } = useCashMovementReport(
    dateRange,
    modeFilter === "all" ? undefined : modeFilter
  );

  // Filter transactions by mode (for display when "all" is selected)
  const filteredTransactions = useMemo(() => {
    if (!report) return [];
    if (modeFilter === "all") return report.transactions;
    return report.transactions.filter((tx) => tx.paymentMode === modeFilter);
  }, [report, modeFilter]);

  // Format currency
  const { formatCurrency } = useCurrency();

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Loading state
  if (isLoading || !report) {
    return (
      <ReportLayout
        title="Cash Movement by Payment Mode"
        subtitle="Track money flow across different payment methods"
        backPath="/reports"
        filters={
          <div className="flex items-center gap-4">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading report data...</div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Cash Movement by Payment Mode"
      subtitle="Track money flow across different payment methods"
      backPath="/reports"
      onExport={() => {
        /* TODO: Implement export */
      }}
      onPrint={() => {
        window.print();
      }}
      filters={
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Select
            options={modeFilterOptions}
            value={modeFilter}
            onChange={(value) => {
              setModeFilter(value as PaymentMode | "all");
            }}
            className="w-48"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Overall Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-100">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <ArrowUpCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-green-600">Total Money In</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(report.totalMoneyIn)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-red-50 border-red-100">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <ArrowDownCircle className="h-6 w-6 text-error" />
                </div>
                <div>
                  <p className="text-sm text-red-600">Total Money Out</p>
                  <p className="text-2xl font-bold text-error">
                    {formatCurrency(report.totalMoneyOut)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card
            className={cn(
              report.netMovement >= 0
                ? "bg-teal-50 border-teal-100"
                : "bg-orange-50 border-orange-100"
            )}
          >
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    report.netMovement >= 0 ? "bg-teal-100" : "bg-orange-100"
                  )}
                >
                  {report.netMovement >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-teal-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-orange-600" />
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm",
                      report.netMovement >= 0
                        ? "text-teal-600"
                        : "text-orange-600"
                    )}
                  >
                    Net Movement
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      report.netMovement >= 0
                        ? "text-teal-700"
                        : "text-orange-700"
                    )}
                  >
                    {report.netMovement >= 0 ? "+" : ""}
                    {formatCurrency(report.netMovement)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Payment Mode Breakdown */}
        <Card>
          <CardBody className="p-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-muted/50">
              <h3 className="font-medium text-text-heading">
                Movement by Payment Mode
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {report.byMode.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No transactions found for the selected period
                </div>
              ) : (
                report.byMode.map((mode) => {
                  const config = modeConfig[mode.mode];
                  return (
                    <div
                      key={mode.mode}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
                        modeFilter === mode.mode && "bg-muted/50"
                      )}
                      onClick={() => {
                        setModeFilter(
                          modeFilter === mode.mode ? "all" : mode.mode
                        );
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            config.bgColor,
                            config.color
                          )}
                        >
                          {config.icon}
                        </div>
                        <div>
                          <p className="font-medium text-text-heading">
                            {config.label}
                          </p>
                          <p className="text-sm text-slate-500">
                            {mode.transactionCount} transaction
                            {mode.transactionCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-xs text-slate-500">In</p>
                          <p className="font-medium text-success">
                            {formatCurrency(mode.moneyIn)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Out</p>
                          <p className="font-medium text-error">
                            {formatCurrency(mode.moneyOut)}
                          </p>
                        </div>
                        <div className="w-28">
                          <p className="text-xs text-slate-500">Net</p>
                          <p
                            className={cn(
                              "font-bold",
                              mode.net >= 0
                                ? "text-teal-600"
                                : "text-orange-600"
                            )}
                          >
                            {mode.net >= 0 ? "+" : ""}
                            {formatCurrency(mode.net)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardBody>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardBody className="p-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-muted/50 flex items-center justify-between">
              <h3 className="font-medium text-text-heading">
                Transactions
                {modeFilter !== "all" && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    (Filtered by {modeConfig[modeFilter].label})
                  </span>
                )}
              </h3>
              <span className="text-sm text-slate-500">
                {filteredTransactions.length} transaction
                {filteredTransactions.length !== 1 ? "s" : ""}
              </span>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-text-heading mb-1">
                  No transactions found
                </h3>
                <p className="text-slate-500">
                  No payment transactions for the selected filters
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">
                      Date
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">
                      Reference
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">
                      Party
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">
                      Mode
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-2">
                      Money In
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-2">
                      Money Out
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => {
                    const txConfig = typeConfig[tx.type];
                    const mConfig = modeConfig[tx.paymentMode];

                    return (
                      <tr key={tx.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2 text-sm text-slate-600">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            className={cn(
                              "flex items-center gap-1 w-fit",
                              txConfig.color
                            )}
                            size="sm"
                          >
                            {txConfig.icon}
                            {txConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-sm font-mono text-slate-600">
                          {tx.referenceNumber}
                        </td>
                        <td className="px-4 py-2 text-sm text-text-heading">
                          {tx.partyName ?? "-"}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            className={cn(
                              "flex items-center gap-1 w-fit",
                              mConfig.bgColor,
                              mConfig.color
                            )}
                            size="sm"
                          >
                            {mConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          {tx.moneyIn > 0 && (
                            <span className="font-medium text-success">
                              {formatCurrency(tx.moneyIn)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          {tx.moneyOut > 0 && (
                            <span className="font-medium text-error">
                              {formatCurrency(tx.moneyOut)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-medium">
                    <td colSpan={5} className="px-4 py-3 text-text-heading">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-success">
                      {formatCurrency(
                        filteredTransactions.reduce(
                          (sum, tx) => sum + tx.moneyIn,
                          0
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-error">
                      {formatCurrency(
                        filteredTransactions.reduce(
                          (sum, tx) => sum + tx.moneyOut,
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </ReportLayout>
  );
}
