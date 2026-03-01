import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";
import {
  X,
  Calendar,
  Building2,
  Hash,
  FileText,
  Printer,
  Trash2,
  Edit2,
  CreditCard,
  Home,
  Zap,
  Users,
  User,
  Briefcase,
  Plane,
  Megaphone,
  Wrench,
  Shield,
  Landmark,
  MoreHorizontal,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Expense, ExpenseCategory, PaymentOutMode } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface ExpenseDetailProps {
  expense: Expense;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
  className?: string;
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
    color: "text-blue-700",
  },
  utilities: {
    label: "Utilities",
    icon: <Zap className="h-4 w-4" />,
    color: "text-yellow-700",
  },
  salaries: {
    label: "Salaries",
    icon: <Users className="h-4 w-4" />,
    color: "text-green-700",
  },
  office: {
    label: "Office",
    icon: <Briefcase className="h-4 w-4" />,
    color: "text-purple-700",
  },
  travel: {
    label: "Travel",
    icon: <Plane className="h-4 w-4" />,
    color: "text-cyan-700",
  },
  marketing: {
    label: "Marketing",
    icon: <Megaphone className="h-4 w-4" />,
    color: "text-pink-700",
  },
  maintenance: {
    label: "Maintenance",
    icon: <Wrench className="h-4 w-4" />,
    color: "text-orange-700",
  },
  insurance: {
    label: "Insurance",
    icon: <Shield className="h-4 w-4" />,
    color: "text-teal-700",
  },
  taxes: {
    label: "Taxes",
    icon: <Landmark className="h-4 w-4" />,
    color: "text-red-700",
  },
  other: {
    label: "Other",
    icon: <MoreHorizontal className="h-4 w-4" />,
    color: "text-slate-700",
  },
};

const paymentModeLabels: Record<PaymentOutMode, string> = {
  cash: "Cash",
  bank: "Bank Transfer",
  card: "Card",
  ach: "ACH Transfer",
  cheque: "Cheque",
  other: "Other",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ExpenseDetail({
  expense,
  onClose,
  onEdit,
  onDelete,
  onPrint,
  className,
}: ExpenseDetailProps): React.ReactNode {
  // Format currency
  const { formatCurrency } = useCurrency();

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const config = categoryConfig[expense.category];

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Expense Details
          </h2>
          <p className="text-sm text-slate-500">{expense.expenseNumber}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Amount Card */}
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
          <CardBody className="text-center py-6">
            <p className="text-sm text-slate-600 mb-1">Expense Amount</p>
            <p className="text-3xl font-bold text-error">
              {formatCurrency(expense.amount)}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge className={cn("flex items-center gap-1", config.color)}>
                {config.icon}
                {config.label}
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* Details */}
        <Card>
          <CardBody className="space-y-3">
            {expense.description && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="font-medium text-slate-900">
                    {expense.description}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-medium text-slate-900">
                  {formatDate(expense.date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Payment Mode</p>
                <p className="font-medium text-slate-900">
                  {paymentModeLabels[expense.paymentMode]}
                </p>
              </div>
            </div>

            {expense.customerName && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Vendor</p>
                  <p className="font-medium text-slate-900">
                    {expense.customerName}
                  </p>
                </div>
              </div>
            )}

            {expense.paidToName && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Paid To</p>
                  <p className="font-medium text-slate-900">
                    {expense.paidToName}
                  </p>
                  {expense.paidToDetails && (
                    <p className="text-sm text-slate-500">
                      {expense.paidToDetails}
                    </p>
                  )}
                </div>
              </div>
            )}

            {expense.referenceNumber && (
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Reference Number</p>
                  <p className="font-medium text-slate-900">
                    {expense.referenceNumber}
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Notes */}
        {expense.notes && (
          <Card>
            <CardHeader title="Notes" />
            <CardBody>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {expense.notes}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Metadata */}
        <div className="text-xs text-slate-400 space-y-1">
          <p>Created: {new Date(expense.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(expense.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="w-full text-error hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Expense
        </Button>
      </div>
    </div>
  );
}
