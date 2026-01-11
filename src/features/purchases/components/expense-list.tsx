import { cn } from "@/lib/cn";
import { Card, CardBody, Badge } from "@/components/ui";
import {
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
import { useCurrency } from "@/hooks/useCurrency";
import type { Expense, ExpenseCategory } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface ExpenseListProps {
  expenses: Expense[];
  onExpenseClick: (expense: Expense) => void;
  className?: string;
  hasActiveFilters?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

const categoryConfig: Record<
  ExpenseCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  rent: {
    label: "Rent",
    icon: <Home className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-700",
  },
  utilities: {
    label: "Utilities",
    icon: <Zap className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-700",
  },
  salaries: {
    label: "Salaries",
    icon: <Users className="h-4 w-4" />,
    color: "bg-green-100 text-green-700",
  },
  office: {
    label: "Office",
    icon: <Briefcase className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-700",
  },
  travel: {
    label: "Travel",
    icon: <Plane className="h-4 w-4" />,
    color: "bg-cyan-100 text-cyan-700",
  },
  marketing: {
    label: "Marketing",
    icon: <Megaphone className="h-4 w-4" />,
    color: "bg-pink-100 text-pink-700",
  },
  maintenance: {
    label: "Maintenance",
    icon: <Wrench className="h-4 w-4" />,
    color: "bg-orange-100 text-orange-700",
  },
  insurance: {
    label: "Insurance",
    icon: <Shield className="h-4 w-4" />,
    color: "bg-teal-100 text-teal-700",
  },
  taxes: {
    label: "Taxes",
    icon: <Landmark className="h-4 w-4" />,
    color: "bg-red-100 text-red-700",
  },
  other: {
    label: "Other",
    icon: <MoreHorizontal className="h-4 w-4" />,
    color: "bg-slate-100 text-slate-700",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ExpenseList({
  expenses,
  onExpenseClick,
  className,
  hasActiveFilters = false,
}: ExpenseListProps): React.ReactNode {
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

  const displayExpenses = expenses;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Expense List */}
      <div className="space-y-2">
        {displayExpenses.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                No expenses found
              </h3>
              <p className="text-slate-500">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Record your first expense"}
              </p>
            </CardBody>
          </Card>
        ) : (
          displayExpenses.map((expense) => {
            const config = categoryConfig[expense.category];

            return (
              <Card
                key={expense.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  onExpenseClick(expense);
                }}
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
                            {expense.description ?? "No description"}
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
