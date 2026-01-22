import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import {
  FileQuestion,
  Search,
  Inbox,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type EmptyStateVariant = "default" | "search" | "error" | "empty";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: EmptyStateVariant;
  /** Custom icon */
  icon?: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button/element */
  action?: ReactNode;
  /** Compact mode */
  compact?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const variantIcons: Record<EmptyStateVariant, LucideIcon> = {
  default: Inbox,
  search: Search,
  error: AlertCircle,
  empty: FileQuestion,
};

const variantColors: Record<EmptyStateVariant, string> = {
  default: "text-text-muted",
  search: "text-text-muted",
  error: "text-error/50",
  empty: "text-text-muted",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      variant = "default",
      icon,
      title,
      description,
      action,
      compact = false,
      className,
      ...props
    },
    ref
  ) => {
    const Icon = icon ?? variantIcons[variant];
    const iconColor = variantColors[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          compact ? "py-8 px-4" : "py-16 px-6",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "rounded-full bg-slate-100 flex items-center justify-center",
            compact ? "h-12 w-12 mb-3" : "h-16 w-16 mb-4"
          )}
        >
          <Icon className={cn(iconColor, compact ? "h-6 w-6" : "h-8 w-8")} />
        </div>

        <h3
          className={cn(
            "font-semibold text-text-heading font-display",
            compact ? "text-base" : "text-lg"
          )}
        >
          {title}
        </h3>

        {description && (
          <p
            className={cn(
              "mt-1 text-text-tertiary max-w-sm",
              compact ? "text-sm" : "text-sm"
            )}
          >
            {description}
          </p>
        )}

        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
