import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Input, Select, type SelectOption } from "@/components/ui";
import { Calendar } from "lucide-react";
import type { DateRange, ReportPeriod } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const periodOptions: SelectOption[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "last_quarter", label: "Last Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
  { value: "custom", label: "Custom Range" },
];

function getDateRangeForPeriod(period: ReportPeriod): DateRange {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const dayOfWeek = today.getDay();

  const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

  switch (period) {
    case "today":
      return { from: formatDate(today), to: formatDate(today) };

    case "yesterday": {
      const yesterday = new Date(year, month, day - 1);
      return { from: formatDate(yesterday), to: formatDate(yesterday) };
    }

    case "this_week": {
      const startOfWeek = new Date(year, month, day - dayOfWeek);
      return { from: formatDate(startOfWeek), to: formatDate(today) };
    }

    case "last_week": {
      const startOfLastWeek = new Date(year, month, day - dayOfWeek - 7);
      const endOfLastWeek = new Date(year, month, day - dayOfWeek - 1);
      return {
        from: formatDate(startOfLastWeek),
        to: formatDate(endOfLastWeek),
      };
    }

    case "this_month": {
      const startOfMonth = new Date(year, month, 1);
      return { from: formatDate(startOfMonth), to: formatDate(today) };
    }

    case "last_month": {
      const startOfLastMonth = new Date(year, month - 1, 1);
      const endOfLastMonth = new Date(year, month, 0);
      return {
        from: formatDate(startOfLastMonth),
        to: formatDate(endOfLastMonth),
      };
    }

    case "this_quarter": {
      const quarterStart = Math.floor(month / 3) * 3;
      const startOfQuarter = new Date(year, quarterStart, 1);
      return { from: formatDate(startOfQuarter), to: formatDate(today) };
    }

    case "last_quarter": {
      const currentQuarterStart = Math.floor(month / 3) * 3;
      const startOfLastQuarter = new Date(year, currentQuarterStart - 3, 1);
      const endOfLastQuarter = new Date(year, currentQuarterStart, 0);
      return {
        from: formatDate(startOfLastQuarter),
        to: formatDate(endOfLastQuarter),
      };
    }

    case "this_year": {
      const startOfYear = new Date(year, 0, 1);
      return { from: formatDate(startOfYear), to: formatDate(today) };
    }

    case "last_year": {
      const startOfLastYear = new Date(year - 1, 0, 1);
      const endOfLastYear = new Date(year - 1, 11, 31);
      return {
        from: formatDate(startOfLastYear),
        to: formatDate(endOfLastYear),
      };
    }

    default:
      return { from: formatDate(today), to: formatDate(today) };
  }
}

function detectPeriodFromRange(range: DateRange): ReportPeriod {
  const periods: ReportPeriod[] = [
    "today",
    "yesterday",
    "this_week",
    "last_week",
    "this_month",
    "last_month",
    "this_quarter",
    "last_quarter",
    "this_year",
    "last_year",
  ];

  for (const period of periods) {
    const periodRange = getDateRangeForPeriod(period);
    if (periodRange.from === range.from && periodRange.to === range.to) {
      return period;
    }
  }

  return "custom";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DateRangeFilter({
  value,
  onChange,
  className,
}: DateRangeFilterProps): React.ReactNode {
  const detectedPeriod = useMemo(() => detectPeriodFromRange(value), [value]);
  const [showCustom, setShowCustom] = useState(detectedPeriod === "custom");

  const handlePeriodChange = (period: string): void => {
    if (period === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const newRange = getDateRangeForPeriod(period as ReportPeriod);
      onChange(newRange);
    }
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Calendar className="h-4 w-4" />
        <span>Period:</span>
      </div>

      <Select
        options={periodOptions}
        value={showCustom ? "custom" : detectedPeriod}
        onChange={handlePeriodChange}
        className="w-40"
      />

      {showCustom && (
        <>
          <Input
            type="date"
            value={value.from}
            onChange={(e) => {
              onChange({ ...value, from: e.target.value });
            }}
            className="w-36"
          />
          <span className="text-slate-400">to</span>
          <Input
            type="date"
            value={value.to}
            onChange={(e) => {
              onChange({ ...value, to: e.target.value });
            }}
            className="w-36"
          />
        </>
      )}

      {!showCustom && (
        <span className="text-sm text-slate-600">
          {formatDisplayDate(value.from)} - {formatDisplayDate(value.to)}
        </span>
      )}
    </div>
  );
}
