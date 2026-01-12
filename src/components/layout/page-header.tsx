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
                className="p-1 text-text-muted hover:text-text-secondary transition-colors rounded hover:bg-subtle"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </button>
            </li>
            <li className="text-text-muted">
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
                    "text-text-tertiary hover:text-text-secondary hover:bg-subtle",
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
                    isLast ? "text-text-primary font-medium" : "text-text-tertiary"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}

              {!isLast && <ChevronRight className="h-4 w-4 text-text-muted" />}
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
          "bg-card border-b border-border-primary shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200",
          sticky && "sticky top-0 z-sticky",
          className
        )}
        {...props}
      >
        <div className="px-8 py-6">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs
              items={breadcrumbs}
              showHomeIcon={showHomeIcon}
              {...(onNavigate ? { onNavigate } : {})}
              className="mb-4"
            />
          )}

          {/* Title Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Back + Title */}
              <div className="flex items-center gap-4">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className={cn(
                      "p-2 -ml-2 rounded-xl",
                      "text-text-muted hover:text-text-secondary hover:bg-subtle",
                      "transition-colors"
                    )}
                    aria-label="Go back"
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" strokeWidth={2.5} />
                  </button>
                )}
                <h1 className="text-3xl font-black text-text-primary font-display tracking-tight truncate">
                  {title}
                </h1>
              </div>

              {/* Description */}
              {description && (
                <p className="mt-1 text-sm text-text-tertiary max-w-2xl">
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
          <h2 className={cn("text-text-primary font-display", styles.title)}>
            {title}
          </h2>
          {description && (
            <p className={cn("mt-1 text-text-tertiary", styles.description)}>
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
