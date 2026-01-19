import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// ============================================================================
// TYPES
// ============================================================================

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size */
  size?: BadgeSize;
  /** Icon before text */
  leftIcon?: ReactNode;
  /** Icon after text */
  rightIcon?: ReactNode;
  /** Dot indicator (no text, just colored dot) */
  dot?: boolean;
  /** Pill shape (more rounded) */
  pill?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const baseStyles = [
  "inline-flex items-center justify-center gap-1.5",
  "font-medium",
  "whitespace-nowrap",
  "transition-colors duration-150",
].join(" ");

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  primary: "bg-primary-100 text-primary-700",
  secondary: "bg-slate-200 text-slate-800",
  success: "bg-success-light text-success-dark",
  warning: "bg-warning-light text-warning-dark",
  error: "bg-error-light text-error-dark",
  info: "bg-info-light text-info-dark",
  outline: "bg-transparent border border-slate-300 text-slate-600",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-2xs rounded-md",
  md: "px-2.5 py-1 text-xs rounded-md",
  lg: "px-3 py-1.5 text-sm rounded-lg",
};

const pillStyles: Record<BadgeSize, string> = {
  sm: "px-2.5 py-0.5 text-2xs rounded-full",
  md: "px-3 py-1 text-xs rounded-full",
  lg: "px-4 py-1.5 text-sm rounded-full",
};

const dotVariantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  primary: "bg-primary-500",
  secondary: "bg-slate-500",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
  outline: "bg-slate-400",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      leftIcon,
      rightIcon,
      dot = false,
      pill = false,
      children,
      ...props
    },
    ref
  ) => {
    // Icon sizes based on badge size
    const iconSize = size === "sm" ? 10 : size === "lg" ? 14 : 12;

    if (dot) {
      return (
        <span
          ref={ref}
          className={cn("inline-flex items-center gap-2", className)}
          {...props}
        >
          <span
            className={cn(
              "rounded-full",
              dotVariantStyles[variant],
              size === "sm" && "h-1.5 w-1.5",
              size === "md" && "h-2 w-2",
              size === "lg" && "h-2.5 w-2.5"
            )}
          />
          {children && (
            <span
              className={cn(
                "text-slate-700",
                size === "sm" && "text-2xs",
                size === "md" && "text-xs",
                size === "lg" && "text-sm"
              )}
            >
              {children}
            </span>
          )}
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          pill ? pillStyles[size] : sizeStyles[size],
          className
        )}
        {...props}
      >
        {leftIcon && (
          <span className="inline-flex shrink-0" style={{ fontSize: iconSize }}>
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="inline-flex shrink-0" style={{ fontSize: iconSize }}>
            {rightIcon}
          </span>
        )}
      </span>
    );
  }
);

Badge.displayName = "Badge";

// ============================================================================
// STATUS BADGE (Common presets)
// ============================================================================

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "completed"
  | "cancelled"
  | "draft"
  | "paid"
  | "unpaid"
  | "partial"
  | "overdue";

const statusConfig: Record<
  StatusType,
  { variant: BadgeVariant; label: string }
> = {
  active: { variant: "success", label: "Active" },
  inactive: { variant: "default", label: "Inactive" },
  pending: { variant: "warning", label: "Pending" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "error", label: "Cancelled" },
  draft: { variant: "secondary", label: "Draft" },
  paid: { variant: "success", label: "Paid" },
  unpaid: { variant: "error", label: "Unpaid" },
  partial: { variant: "warning", label: "Partial" },
  overdue: { variant: "error", label: "Overdue" },
};

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  /** Status type */
  status: StatusType;
  /** Custom label (overrides default) */
  label?: string;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, label, ...props }, ref) => {
    const config = statusConfig[status];

    return (
      <Badge ref={ref} variant={config.variant} pill {...props}>
        {label ?? config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

// ============================================================================
// COUNT BADGE (For notification counts, etc.)
// ============================================================================

export interface CountBadgeProps extends Omit<BadgeProps, "children"> {
  /** Count value */
  count: number;
  /** Maximum count to display (shows "max+" if exceeded) */
  max?: number;
  /** Show zero count */
  showZero?: boolean;
}

export const CountBadge = forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ count, max = 99, showZero = false, variant = "error", ...props }, ref) => {
    if (count === 0 && !showZero) {
      return null;
    }

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
      <Badge
        ref={ref}
        variant={variant}
        size="sm"
        pill
        className="min-w-[20px] h-5 px-1.5"
        {...props}
      >
        {displayCount}
      </Badge>
    );
  }
);

CountBadge.displayName = "CountBadge";
