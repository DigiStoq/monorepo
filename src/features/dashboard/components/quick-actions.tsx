import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody } from "@/components/ui";
import {
  Plus,
  FileText,
  Users,
  Package,
  CreditCard,
  Receipt,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

export interface QuickActionsProps {
  onAction?: (actionId: string) => void;
  className?: string;
}

// ============================================================================
// DEFAULT ACTIONS
// ============================================================================

const defaultActions: Omit<QuickAction, "onClick">[] = [
  {
    id: "add-sale",
    label: "New Sale",
    icon: Plus,
    color: "bg-primary-600 hover:bg-primary-700",
  },
  {
    id: "add-purchase",
    label: "New Purchase",
    icon: FileText,
    color: "bg-info hover:bg-info-dark",
  },
  {
    id: "add-customer",
    label: "Add Customer",
    icon: Users,
    color: "bg-success hover:bg-success-dark",
  },
  {
    id: "add-item",
    label: "Add Item",
    icon: Package,
    color: "bg-warning hover:bg-warning-dark",
  },
  {
    id: "payment-in",
    label: "Payment In",
    icon: CreditCard,
    color: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    id: "payment-out",
    label: "Payment Out",
    icon: Receipt,
    color: "bg-rose-600 hover:bg-rose-700",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickActions({
  onAction,
  className,
}: QuickActionsProps): React.ReactNode {
  return (
    <Card className={className}>
      <CardHeader title="Quick Actions" subtitle="Common operations" />
      <CardBody className="pt-0">
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {defaultActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onAction?.(action.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl",
                  "text-white font-medium text-sm text-center leading-tight",
                  "transition-all duration-200",
                  "hover:shadow-md hover:-translate-y-0.5",
                  "active:scale-[0.98]",
                  action.color
                )}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// FLOATING ACTION BUTTON
// ============================================================================

export interface FloatingActionButtonProps {
  onClick?: () => void;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  className,
}: FloatingActionButtonProps): React.ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-sticky",
        "h-14 w-14 rounded-full",
        "bg-primary-600 text-white shadow-elevated",
        "flex items-center justify-center",
        "transition-all duration-200",
        "hover:bg-primary-700 hover:shadow-lg hover:scale-105",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        className
      )}
      aria-label="Quick action"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
