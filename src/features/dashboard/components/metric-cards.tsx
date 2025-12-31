import { cn } from "@/lib/cn";
import { MetricCard } from "@/components/ui";
import { MetricCardSkeleton } from "@/components/common";
import { TrendingUp, TrendingDown, ShoppingCart, Package } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardMetrics {
  totalReceivable: number;
  totalPayable: number;
  todaySales: number;
  todayPurchases: number;
  receivableChange?: number;
  payableChange?: number;
  salesChange?: number;
  purchasesChange?: number;
}

export interface MetricCardsProps {
  metrics: DashboardMetrics | null;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MetricCards({
  metrics,
  isLoading,
  className,
}: MetricCardsProps): React.ReactNode {
  if (isLoading || !metrics) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
          className
        )}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
    >
      <MetricCard
        title="Total Receivable"
        value={formatCurrency(metrics.totalReceivable)}
        {...(metrics.receivableChange !== undefined
          ? { change: metrics.receivableChange }
          : {})}
        changeLabel="vs last month"
        icon={<TrendingUp className="h-5 w-5 text-white" />}
        color="success"
      />

      <MetricCard
        title="Total Payable"
        value={formatCurrency(metrics.totalPayable)}
        {...(metrics.payableChange !== undefined
          ? { change: metrics.payableChange }
          : {})}
        changeLabel="vs last month"
        icon={<TrendingDown className="h-5 w-5 text-white" />}
        color="error"
      />

      <MetricCard
        title="Today's Sales"
        value={formatCurrency(metrics.todaySales)}
        {...(metrics.salesChange !== undefined
          ? { change: metrics.salesChange }
          : {})}
        changeLabel="vs yesterday"
        icon={<ShoppingCart className="h-5 w-5 text-white" />}
        color="primary"
      />

      <MetricCard
        title="Today's Purchases"
        value={formatCurrency(metrics.todayPurchases)}
        {...(metrics.purchasesChange !== undefined
          ? { change: metrics.purchasesChange }
          : {})}
        changeLabel="vs yesterday"
        icon={<Package className="h-5 w-5 text-white" />}
        color="info"
      />
    </div>
  );
}
