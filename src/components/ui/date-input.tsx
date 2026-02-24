import { useState, useRef, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/cn";
import type { InputSize, InputState } from "./input";

export interface DateInputProps {
  /** Input size */
  size?: InputSize;
  /** Validation state */
  state?: InputState;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Label */
  label?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Mark field as required */
  required?: boolean;
  /** Show (Optional) label */
  showOptionalLabel?: boolean;
  /** Date value in YYYY-MM-DD format */
  value: string;
  /** Callback with YYYY-MM-DD string */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
}

const wrapperStyles = "relative flex flex-col gap-1.5";

const labelStyles = [
  "text-sm font-medium text-text-secondary",
  "cursor-pointer",
].join(" ");

const baseStyles = [
  "w-full",
  "bg-card",
  "border border-border-secondary",
  "rounded-[10px]",
  "text-text-primary placeholder:text-text-muted",
  "transition-all duration-200",
  "focus:outline-none focus:ring-2 focus:ring-offset-0",
  "disabled:bg-subtle disabled:text-text-tertiary disabled:cursor-not-allowed",
  "cursor-pointer select-none",
  "flex items-center justify-between",
].join(" ");

const sizeStyles: Record<InputSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-4 text-base",
};

const stateStyles: Record<InputState, string> = {
  default: [
    "border-border-secondary",
    "hover:border-border-primary",
    "focus:border-primary-500 focus:ring-primary-500/20",
  ].join(" "),
  error: [
    "border-error",
    "hover:border-error-dark",
    "focus:border-error focus:ring-error/20",
  ].join(" "),
  success: [
    "border-success",
    "hover:border-success-dark",
    "focus:border-success focus:ring-success/20",
  ].join(" "),
};

const helperTextStyles = "text-xs";
const errorTextStyles = "text-error";
const defaultHelperStyles = "text-text-tertiary";

function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  return format(date, "MMM d, yyyy");
}

export function DateInput({
  size = "md",
  state = "default",
  error,
  helperText,
  label,
  fullWidth = true,
  required,
  showOptionalLabel = false,
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  className,
  minDate,
  maxDate,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const computedState = error ? "error" : state;

  const selectedDate = parseDate(value);

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onChange(formatDate(date));
      }
      setOpen(false);
    },
    [onChange]
  );

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

  return (
    <div
      ref={containerRef}
      className={cn(wrapperStyles, fullWidth && "w-full", "relative")}
    >
      {label && (
        <label className={labelStyles}>
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
          {!required && showOptionalLabel && (
            <span className="text-text-tertiary text-xs ml-1">(Optional)</span>
          )}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen(!open);
        }}
        className={cn(
          baseStyles,
          sizeStyles[size],
          stateStyles[computedState],
          open && "border-primary-500 ring-2 ring-primary-500/20",
          className
        )}
      >
        <span
          className={cn(
            "truncate",
            value ? "text-text-primary" : "text-text-muted"
          )}
        >
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar size={iconSize} className="text-text-muted ml-2 shrink-0" />
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div
          className={cn(
            "absolute z-dropdown mt-1 bg-card border border-border-secondary rounded-[10px]",
            "shadow-card animate-fade-in",
            label ? "top-[calc(100%-2px)]" : "top-[calc(100%+4px)]"
          )}
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate ?? new Date()}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            classNames={{
              root: "p-3",
              months: "flex flex-col",
              month_caption: "flex justify-center items-center h-10",
              caption_label: "text-sm font-semibold text-text-primary",
              nav: "flex items-center gap-1",
              button_previous:
                "absolute left-3 top-3 h-8 w-8 flex items-center justify-center rounded-md hover:bg-subtle transition-colors text-text-secondary",
              button_next:
                "absolute right-3 top-3 h-8 w-8 flex items-center justify-center rounded-md hover:bg-subtle transition-colors text-text-secondary",
              weekdays: "flex",
              weekday:
                "w-9 text-center text-xs font-medium text-text-muted py-1",
              week: "flex",
              day: "w-9 h-9 flex items-center justify-center text-sm rounded-md transition-colors",
              day_button:
                "w-full h-full flex items-center justify-center rounded-md hover:bg-primary-50 transition-colors cursor-pointer",
              selected: "!bg-primary-500 !text-white font-semibold rounded-md",
              today: "font-bold text-primary-500",
              outside: "text-text-muted/40",
              disabled: "text-text-muted/30 cursor-not-allowed",
            }}
          />
        </div>
      )}

      {/* Helper/Error text */}
      {(error ?? helperText) && (
        <p
          role={error ? "alert" : undefined}
          aria-live={error ? "polite" : undefined}
          className={cn(
            helperTextStyles,
            error ? errorTextStyles : defaultHelperStyles
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}
