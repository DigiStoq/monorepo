import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  /** Sidebar content */
  sidebar?: ReactNode;
  /** Header content (optional top bar) */
  header?: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Sidebar collapsed state */
  sidebarCollapsed?: boolean;
  /** Hide sidebar completely */
  hideSidebar?: boolean;
  /** Fixed header */
  fixedHeader?: boolean;
}

// ============================================================================
// APP SHELL COMPONENT
// ============================================================================

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(
  (
    {
      sidebar,
      header,
      children,
      sidebarCollapsed = false,
      hideSidebar = false,
      fixedHeader = true,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-screen bg-slate-50 overflow-hidden", className)}
        {...props}
      >
        {/* Sidebar */}
        {!hideSidebar && sidebar && (
          <div className="relative shrink-0">{sidebar}</div>
        )}

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          {header && (
            <header
              className={cn(
                "shrink-0 bg-white border-b border-slate-200 z-sticky",
                fixedHeader && "sticky top-0"
              )}
            >
              {header}
            </header>
          )}

          {/* Content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    );
  }
);

AppShell.displayName = "AppShell";

// ============================================================================
// PAGE CONTAINER
// ============================================================================

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Max width constraint */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
}

const maxWidthStyles = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  (
    { maxWidth = "2xl", padding = "md", className, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full",
          maxWidthStyles[maxWidth],
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

PageContainer.displayName = "PageContainer";

// ============================================================================
// CONTENT AREA (Scrollable container with proper padding)
// ============================================================================

export interface ContentAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** Center content */
  centered?: boolean;
}

export const ContentArea = forwardRef<HTMLDivElement, ContentAreaProps>(
  ({ centered, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 overflow-y-auto",
          centered && "flex items-center justify-center",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ContentArea.displayName = "ContentArea";
