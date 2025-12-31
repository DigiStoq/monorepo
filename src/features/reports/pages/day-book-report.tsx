import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Badge,
  Select,
  type SelectOption,
  Input,
} from "@/components/ui";
import { ReportLayout } from "../components";
import {
  FileText,
  ShoppingCart,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  Settings2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { DayBookEntry } from "../types";
import { useDayBookReport } from "@/hooks/useReports";

// ============================================================================
// HELPERS
// ============================================================================

const typeConfig: Record<
  DayBookEntry["type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  sale: {
    label: "Sale",
    icon: <FileText className="h-4 w-4" />,
    color: "bg-green-100 text-green-700",
  },
  purchase: {
    label: "Purchase",
    icon: <ShoppingCart className="h-4 w-4" />,
    color: "bg-orange-100 text-orange-700",
  },
  payment_in: {
    label: "Payment In",
    icon: <ArrowUpCircle className="h-4 w-4" />,
    color: "bg-teal-100 text-teal-700",
  },
  payment_out: {
    label: "Payment Out",
    icon: <ArrowDownCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-700",
  },
  expense: {
    label: "Expense",
    icon: <Receipt className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-700",
  },
  adjustment: {
    label: "Adjustment",
    icon: <Settings2 className="h-4 w-4" />,
    color: "bg-slate-100 text-slate-700",
  },
};

const typeOptions: SelectOption[] = [
  { value: "all", label: "All Transactions" },
  { value: "sale", label: "Sales" },
  { value: "purchase", label: "Purchases" },
  { value: "payment_in", label: "Payments In" },
  { value: "payment_out", label: "Payments Out" },
  { value: "expense", label: "Expenses" },
  { value: "adjustment", label: "Adjustments" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function DayBookReport(): React.ReactNode {
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().slice(0, 10)
  );
  const [typeFilter, setTypeFilter] = useState<DayBookEntry["type"] | "all">(
    "all"
  );

  // Fetch data from PowerSync
  const {
    entries: dayBookEntries,
    totals,
    isLoading,
  } = useDayBookReport(selectedDate);

  // Filter entries by type
  const filteredEntries = useMemo(() => {
    if (typeFilter === "all") return dayBookEntries;
    return dayBookEntries.filter((entry) => entry.type === typeFilter);
  }, [dayBookEntries, typeFilter]);

  // Recalculate totals for filtered entries
  const filteredTotals = useMemo(() => {
    if (typeFilter === "all") {
      return {
        debit: totals.debit,
        credit: totals.credit,
        net: totals.debit - totals.credit,
      };
    }
    const debit = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
    const credit = filteredEntries.reduce((sum, e) => sum + e.credit, 0);
    return { debit, credit, net: debit - credit };
  }, [filteredEntries, totals, typeFilter]);

  // Format currency
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Loading state
  if (isLoading) {
    return (
      <ReportLayout
        title="Day Book"
        subtitle="All transactions for a specific day"
        filters={
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
              }}
              className="w-40"
            />
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
      title="Day Book"
      subtitle={`Transactions for ${formatDate(selectedDate)}`}
      onRefresh={() => {
        /* TODO: Implement refresh */
      }}
      onExport={() => {
        /* TODO: Implement export */
      }}
      onPrint={() => {
        window.print();
      }}
      filters={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
              }}
              className="w-40"
            />
          </div>
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value as DayBookEntry["type"] | "all");
            }}
            className="w-48"
          />
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Debit</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(filteredTotals.debit)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <ArrowUpCircle className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Credit</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredTotals.credit)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <ArrowDownCircle className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Net Movement</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    filteredTotals.net >= 0 ? "text-success" : "text-error"
                  )}
                >
                  {formatCurrency(Math.abs(filteredTotals.net))}
                  <span className="text-sm ml-1">
                    {filteredTotals.net >= 0 ? "Dr" : "Cr"}
                  </span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardBody className="p-0">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                No transactions found
              </h3>
              <p className="text-slate-500">
                No transactions recorded for this date
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">
                    Type
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">
                    Reference
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">
                    Customer
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">
                    Description
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-2">
                    Debit
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-2">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => {
                  const config = typeConfig[entry.type];

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <Badge
                          className={cn(
                            "flex items-center gap-1 w-fit",
                            config.color
                          )}
                          size="sm"
                        >
                          {config.icon}
                          {config.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-sm font-mono text-slate-600">
                        {entry.referenceNumber}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-900">
                        {entry.customerName ?? "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-600">
                        {entry.description}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {entry.debit > 0 && (
                          <span className="font-medium text-blue-600">
                            {formatCurrency(entry.debit)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {entry.credit > 0 && (
                          <span className="font-medium text-green-600">
                            {formatCurrency(entry.credit)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-medium">
                  <td colSpan={4} className="px-4 py-3 text-slate-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {formatCurrency(filteredTotals.debit)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatCurrency(filteredTotals.credit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardBody>
      </Card>
    </ReportLayout>
  );
}
