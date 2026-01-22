import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import { ArrowLeft, Download, Printer, RefreshCw } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface ReportLayoutProps {
  title: string;
  subtitle?: string;
  backPath?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isLoading?: boolean;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReportLayout({
  title,
  subtitle,
  backPath = "/reports",
  onRefresh,
  onExport,
  onPrint,
  isLoading,
  actions,
  children,
  className,
}: ReportLayoutProps): React.ReactNode {
  return (
    <div className={cn("h-full flex flex-col bg-app", className)}>
      {/* Header */}
      <div className="border-b border-border-primary bg-card px-8 py-6 shadow-sm shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={backPath}>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl p-2 h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-text-primary tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-text-tertiary mt-1 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="rounded-xl p-2 h-10 w-10"
              >
                <RefreshCw
                  className={cn("h-5 w-5", isLoading && "animate-spin")}
                  strokeWidth={2}
                />
              </Button>
            )}
            {onPrint && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrint}
                className="rounded-xl p-2 h-10 w-10"
              >
                <Printer className="h-5 w-5" strokeWidth={2} />
              </Button>
            )}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="rounded-xl h-10"
              >
                <Download className="h-5 w-5 mr-2" strokeWidth={2} />
                Export
              </Button>
            )}
            {actions}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">{children}</div>
    </div>
  );
}
