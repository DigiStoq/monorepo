import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// ============================================================================
// TYPES
// ============================================================================

export type CardVariant = "default" | "outlined" | "elevated" | "gradient";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card visual variant */
  variant?: CardVariant;
  /** Add hover effect */
  hoverable?: boolean;
  /** Add click effect */
  clickable?: boolean;
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
}

export interface CardHeaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Title text */
  title?: ReactNode;
  /** Subtitle text */
  subtitle?: ReactNode;
  /** Action element (buttons, etc.) */
  action?: ReactNode;
}

export type CardBodyProps = HTMLAttributes<HTMLDivElement>;

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Alignment of footer content */
  align?: "left" | "center" | "right" | "between";
}

// ============================================================================
// STYLES
// ============================================================================

const baseStyles = ["bg-white", "rounded-lg", "overflow-hidden"].join(" ");

const variantStyles: Record<CardVariant, string> = {
  default: "border border-slate-200 shadow-soft",
  outlined: "border-2 border-slate-200",
  elevated: "border border-slate-100 shadow-card",
  gradient: [
    "border border-slate-100",
    "bg-gradient-to-br from-white via-slate-50/50 to-primary-50/30",
    "shadow-soft",
  ].join(" "),
};

const hoverStyles =
  "transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5";
const clickStyles = "cursor-pointer active:scale-[0.99] transition-transform";

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

// ============================================================================
// CARD COMPONENT
// ============================================================================

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      hoverable = false,
      clickable = false,
      padding = "none",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          hoverable && hoverStyles,
          clickable && clickStyles,
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// ============================================================================
// CARD HEADER
// ============================================================================

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between gap-4 p-6 pb-0",
          className
        )}
        {...props}
      >
        {title || subtitle ? (
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-slate-900 font-display truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500 truncate">{subtitle}</p>
            )}
          </div>
        ) : (
          <div className="flex-1 min-w-0">{children}</div>
        )}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

// ============================================================================
// CARD BODY
// ============================================================================

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("p-6", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = "CardBody";

// ============================================================================
// CARD FOOTER
// ============================================================================

const footerAlignStyles = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
  between: "justify-between",
};

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, align = "right", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 p-6 pt-0",
          footerAlignStyles[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

// ============================================================================
// METRIC CARD (Dashboard specific)
// ============================================================================

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Metric title */
  title: string;
  /** Metric value */
  value: string | number;
  /** Change percentage (positive = green, negative = red) */
  change?: number;
  /** Change label */
  changeLabel?: string;
  /** Icon to display */
  icon?: ReactNode;
  /** Color variant for the card */
  color?: "primary" | "success" | "warning" | "error" | "info";
}

const metricColorStyles = {
  primary: "from-primary-500 to-primary-600",
  success: "from-success to-green-600",
  warning: "from-warning to-amber-600",
  error: "from-error to-red-600",
  info: "from-info to-blue-600",
};

export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      className,
      title,
      value,
      change,
      changeLabel,
      icon,
      color = "primary",
      ...props
    },
    ref
  ) => {
    const isPositive = change !== undefined && change >= 0;

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl p-6",
          "bg-gradient-to-br",
          metricColorStyles[color],
          "text-white shadow-lg",
          className
        )}
        {...props}
      >
        {/* Background decoration */}
        <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute right-8 top-8 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">{title}</p>
              <p className="mt-2 text-3xl font-bold font-display">{value}</p>
            </div>
            {icon && <div className="rounded-lg bg-white/20 p-2.5">{icon}</div>}
          </div>

          {/* Change indicator */}
          {change !== undefined && (
            <div className="mt-4 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  isPositive
                    ? "bg-white/20 text-white"
                    : "bg-white/20 text-white"
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-white/70">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

MetricCard.displayName = "MetricCard";
