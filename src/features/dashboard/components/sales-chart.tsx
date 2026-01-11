import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/cn";
import { Card, CardHeader, CardBody } from "@/components/ui";
import { CardSkeleton } from "@/components/common";

// ============================================================================
// TYPES
// ============================================================================

export interface SalesDataPoint {
  date: string;
  sales: number;
  purchases: number;
}

export interface SalesChartProps {
  data: SalesDataPoint[] | null;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="bg-white rounded-lg shadow-elevated border border-slate-200 p-3">
      <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SalesChart({ data, isLoading, className }: SalesChartProps) {
  // Generate mock data if not provided
  const chartData = useMemo(() => {
    if (data) return data;

    // Generate last 7 days of mock data
    const mockData: SalesDataPoint[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      mockData.push({
        date: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        sales: Math.floor(Math.random() * 50000) + 20000,
        purchases: Math.floor(Math.random() * 30000) + 10000,
      });
    }

    return mockData;
  }, [data]);

  if (isLoading) {
    return <CardSkeleton className={className} bodyLines={8} />;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader
        title="Sales & Purchases"
        subtitle="Last 7 days trend"
      />
      <CardBody className="pt-0">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="purchasesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="sales"
                name="Sales"
                stroke="#0d9488"
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
              <Area
                type="monotone"
                dataKey="purchases"
                name="Purchases"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#purchasesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
