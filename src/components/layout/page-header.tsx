import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { ChevronRight, Home } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Route path (if clickable) */
  href?: string;
  /** Icon */
  icon?: ReactNode;
}

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Page title */
  title: string;
  /** Page description/subtitle */
  description?: string;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons/elements */
  actions?: ReactNode;
  /** Back button handler */
  onBack?: () => void;
  /** Show home icon in breadcrumbs */
  showHomeIcon?: boolean;
  /** Navigation handler for breadcrumbs */
  onNavigate?: (item: BreadcrumbItem) => void;
  /** Sticky header */
  sticky?: boolean;
}

// ============================================================================
// BREADCRUMBS COMPONENT
// ============================================================================

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHomeIcon?: boolean;
  onNavigate?: (item: BreadcrumbItem) => void;
  className?: string;
}

export function Breadcrumbs({
  items,
  showHomeIcon = true,
  onNavigate,
  className,
}: BreadcrumbsProps): React.ReactNode {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-sm">
        {/* Home Icon */}
        {showHomeIcon && (
          <>
            <li>
              <button
                type="button"
                onClick={() => onNavigate?.({ label: "Home", href: "/" })}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-100"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </button>
            </li>
            <li className="text-slate-300">
              <ChevronRight className="h-4 w-4" />
            </li>
          </>
        )}

        {/* Breadcrumb Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <button
                  type="button"
                  onClick={() => onNavigate?.(item)}
                  className={cn(
                    "flex items-center gap-1.5 px-1.5 py-0.5 rounded",
                    "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
                    "transition-colors"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1.5 px-1.5 py-0.5",
                    isLast ? "text-slate-900 font-medium" : "text-slate-500"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}

              {!isLast && <ChevronRight className="h-4 w-4 text-slate-300" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================================================
// PAGE HEADER COMPONENT
// ============================================================================

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      description,
      breadcrumbs,
      actions,
      onBack,
      showHomeIcon = true,
      onNavigate,
      sticky = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border-b border-slate-200",
          sticky && "sticky top-0 z-sticky",
          className
        )}
        {...props}
      >
        <div className="px-6 py-4">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs
              items={breadcrumbs}
              showHomeIcon={showHomeIcon}
              {...(onNavigate ? { onNavigate } : {})}
              className="mb-3"
            />
          )}

          {/* Title Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Back + Title */}
              <div className="flex items-center gap-3">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className={cn(
                      "p-1.5 -ml-1.5 rounded-lg",
                      "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
                      "transition-colors"
                    )}
                    aria-label="Go back"
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                  </button>
                )}
                <h1 className="text-2xl font-bold text-slate-900 font-display truncate">
                  {title}
                </h1>
              </div>

              {/* Description */}
              {description && (
                <p className="mt-1 text-sm text-slate-500 max-w-2xl">
                  {description}
                </p>
              )}
            </div>

            {/* Actions */}
            {actions && (
              <div className="shrink-0 flex items-center gap-2">{actions}</div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";

// ============================================================================
// SECTION HEADER (For in-page sections)
// ============================================================================

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Action buttons */
  actions?: ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const sectionSizeStyles = {
  sm: {
    title: "text-base font-semibold",
    description: "text-xs",
    gap: "mb-3",
  },
  md: {
    title: "text-lg font-semibold",
    description: "text-sm",
    gap: "mb-4",
  },
  lg: {
    title: "text-xl font-bold",
    description: "text-sm",
    gap: "mb-5",
  },
};

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ title, description, actions, size = "md", className, ...props }, ref) => {
    const styles = sectionSizeStyles[size];

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between gap-4",
          styles.gap,
          className
        )}
        {...props}
      >
        <div className="flex-1 min-w-0">
          <h2 className={cn("text-slate-900 font-display", styles.title)}>
            {title}
          </h2>
          {description && (
            <p className={cn("mt-1 text-slate-500", styles.description)}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="shrink-0 flex items-center gap-2">{actions}</div>
        )}
      </div>
    );
  }
);

SectionHeader.displayName = "SectionHeader";
