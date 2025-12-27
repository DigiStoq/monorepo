import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// ============================================================================
// SKELETON BASE
// ============================================================================

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Animation variant */
  animation?: "pulse" | "shimmer" | "none";
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ animation = "pulse", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-slate-200 rounded",
          animation === "pulse" && "animate-pulse",
          animation === "shimmer" &&
            "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer",
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// ============================================================================
// SKELETON TEXT
// ============================================================================

export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of lines */
  lines?: number;
  /** Line width pattern */
  widths?: string[];
}

export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, widths, className, ...props }, ref) => {
    const defaultWidths = ["100%", "90%", "75%"];

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: widths?.[i] || defaultWidths[i % defaultWidths.length] }}
          />
        ))}
      </div>
    );
  }
);

SkeletonText.displayName = "SkeletonText";

// ============================================================================
// CARD SKELETON
// ============================================================================

export interface CardSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Show header */
  hasHeader?: boolean;
  /** Show footer */
  hasFooter?: boolean;
  /** Number of body lines */
  bodyLines?: number;
}

export const CardSkeleton = forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ hasHeader = true, hasFooter = false, bodyLines = 3, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-lg border border-slate-200 overflow-hidden",
          className
        )}
        {...props}
      >
        {hasHeader && (
          <div className="p-6 pb-0">
            <Skeleton className="h-5 w-1/3 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        )}
        <div className="p-6">
          <SkeletonText lines={bodyLines} />
        </div>
        {hasFooter && (
          <div className="p-6 pt-0 flex justify-end gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        )}
      </div>
    );
  }
);

CardSkeleton.displayName = "CardSkeleton";

// ============================================================================
// TABLE SKELETON
// ============================================================================

export interface TableSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
}

export const TableSkeleton = forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({ rows = 5, columns = 4, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-lg border border-slate-200 overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="bg-slate-50 px-4 py-3 flex gap-4 border-b border-slate-200">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="px-4 py-3 flex gap-4 border-b border-slate-100 last:border-0"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }
);

TableSkeleton.displayName = "TableSkeleton";

// ============================================================================
// METRIC CARD SKELETON
// ============================================================================

export const MetricCardSkeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-slate-100 rounded-xl p-6 animate-pulse",
          className
        )}
        {...props}
      >
        <Skeleton className="h-4 w-24 mb-3 bg-slate-200" />
        <Skeleton className="h-8 w-32 mb-4 bg-slate-200" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14 rounded-full bg-slate-200" />
          <Skeleton className="h-3 w-20 bg-slate-200" />
        </div>
      </div>
    );
  }
);

MetricCardSkeleton.displayName = "MetricCardSkeleton";

// ============================================================================
// LOADING SPINNER
// ============================================================================

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Size */
  size?: "sm" | "md" | "lg";
}

const spinnerSizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
};

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = "md", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-full border-slate-200 border-t-primary-600 animate-spin",
          spinnerSizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";

// ============================================================================
// FULL PAGE LOADING
// ============================================================================

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** Loading text */
  text?: string;
}

export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ text = "Loading...", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 bg-white/80 backdrop-blur-sm z-overlay",
          "flex flex-col items-center justify-center",
          className
        )}
        {...props}
      >
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-slate-600">{text}</p>
      </div>
    );
  }
);

LoadingOverlay.displayName = "LoadingOverlay";
