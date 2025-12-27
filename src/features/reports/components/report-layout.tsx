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
  filters,
  children,
  className,
}: ReportLayoutProps) {
  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={backPath}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            )}
            {onPrint && (
              <Button variant="ghost" size="sm" onClick={onPrint}>
                <Printer className="h-4 w-4" />
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            {actions}
          </div>
        </div>

        {/* Filters */}
        {filters && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {filters}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {children}
      </div>
    </div>
  );
}
