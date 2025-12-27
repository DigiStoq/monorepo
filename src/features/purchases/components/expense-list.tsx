import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Card, CardBody, Input, Badge, Select, type SelectOption } from "@/components/ui";
import {
  Search,
  Receipt,
  Calendar,
  Home,
  Zap,
  Users,
  Briefcase,
  Plane,
  Megaphone,
  Wrench,
  Shield,
  Landmark,
  MoreHorizontal,
} from "lucide-react";
import type { Expense, ExpenseCategory } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface ExpenseListProps {
  expenses: Expense[];
  onExpenseClick: (expense: Expense) => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const categoryConfig: Record<ExpenseCategory, { label: string; icon: React.ReactNode; color: string }> = {
  rent: { label: "Rent", icon: <Home className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" },
  utilities: { label: "Utilities", icon: <Zap className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-700" },
  salaries: { label: "Salaries", icon: <Users className="h-4 w-4" />, color: "bg-green-100 text-green-700" },
  office: { label: "Office", icon: <Briefcase className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
  travel: { label: "Travel", icon: <Plane className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-700" },
  marketing: { label: "Marketing", icon: <Megaphone className="h-4 w-4" />, color: "bg-pink-100 text-pink-700" },
  maintenance: { label: "Maintenance", icon: <Wrench className="h-4 w-4" />, color: "bg-orange-100 text-orange-700" },
  insurance: { label: "Insurance", icon: <Shield className="h-4 w-4" />, color: "bg-teal-100 text-teal-700" },
  taxes: { label: "Taxes", icon: <Landmark className="h-4 w-4" />, color: "bg-red-100 text-red-700" },
  other: { label: "Other", icon: <MoreHorizontal className="h-4 w-4" />, color: "bg-slate-100 text-slate-700" },
};

const categoryOptions: SelectOption[] = [
  { value: "all", label: "All Categories" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "salaries", label: "Salaries" },
  { value: "office", label: "Office" },
  { value: "travel", label: "Travel" },
  { value: "marketing", label: "Marketing" },
  { value: "maintenance", label: "Maintenance" },
  { value: "insurance", label: "Insurance" },
  { value: "taxes", label: "Taxes" },
  { value: "other", label: "Other" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ExpenseList({ expenses, onExpenseClick, className }: ExpenseListProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.expenseNumber.toLowerCase().includes(search.toLowerCase()) ||
        expense.description.toLowerCase().includes(search.toLowerCase()) ||
        (expense.customerName?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

  // Calculate totals by category
  const totals = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = filteredExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);
    return { total, count: filteredExpenses.length, byCategory };
  }, [filteredExpenses]);

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
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          options={categoryOptions}
          value={categoryFilter}
          onChange={(value) => setCategoryFilter(value as ExpenseCategory | "all")}
          className="w-48"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardBody className="py-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-error">{formatCurrency(totals.total)}</p>
          </CardBody>
        </Card>
        {Object.entries(totals.byCategory).slice(0, 3).map(([category, amount]) => {
          const config = categoryConfig[category as ExpenseCategory];
          return (
            <Card key={category}>
              <CardBody className="py-3">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded", config.color)}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{config.label}</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(amount)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Expense List */}
      <div className="space-y-2">
        {filteredExpenses.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No expenses found</h3>
              <p className="text-slate-500">
                {search || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Record your first expense"}
              </p>
            </CardBody>
          </Card>
        ) : (
          filteredExpenses.map((expense) => {
            const config = categoryConfig[expense.category];

            return (
              <Card
                key={expense.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onExpenseClick(expense)}
              >
                <CardBody className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", config.color)}>
                        {config.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {expense.description}
                          </span>
                          <Badge variant="secondary" size="sm">
                            {expense.expenseNumber}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(expense.date)}
                          </span>
                          <Badge size="sm" className={config.color}>
                            {config.label}
                          </Badge>
                          {expense.customerName && (
                            <span>→ {expense.customerName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-error">
                        {formatCurrency(expense.amount)}
                      </div>
                      {expense.referenceNumber && (
                        <div className="text-xs text-slate-500">
                          Ref: {expense.referenceNumber}
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
