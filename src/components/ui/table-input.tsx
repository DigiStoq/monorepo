import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { NumberInput, type NumberInputProps } from "./number-input";
import { Input, type InputProps } from "./input";

// Shared styles from input.tsx to ensure mirror matches input
const sizeStyles = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-4 text-base",
};

export interface TableInputProps extends Omit<
  InputProps,
  "value" | "onChange"
> {
  value?: string | number | readonly string[] | undefined;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const TableInput = forwardRef<HTMLInputElement, TableInputProps>(
  ({ className, size = "sm", value, placeholder, ...props }, ref) => {
    return (
      <div className="grid">
        {/* Mirror */}
        <div
          aria-hidden
          className={cn(
            sizeStyles[size],
            "col-start-1 row-start-1 invisible whitespace-pre border border-transparent overflow-hidden pointer-events-none",
            className // Apply same alignment/width classes
          )}
        >
          {value !== undefined && value !== "" ? value : (placeholder ?? "0")}
        </div>

        {/* Actual Input */}
        <div className="col-start-1 row-start-1 w-full min-w-0">
          <Input
            ref={ref}
            value={value}
            size={size}
            className={className}
            placeholder={placeholder}
            {...props}
          />
        </div>
      </div>
    );
  }
);

TableInput.displayName = "TableInput";

export const TableNumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, size = "sm", value, placeholder, ...props }, ref) => {
    return (
      <div className="grid">
        {/* Mirror */}
        <div
          aria-hidden
          className={cn(
            sizeStyles[size],
            "col-start-1 row-start-1 invisible whitespace-pre border border-transparent overflow-hidden pointer-events-none",
            className // Apply same alignment/width classes
          )}
        >
          {/* Add extra chars to ensure comfortable typing space */}
          {(value?.toString() ?? placeholder ?? "0") + "00"}
        </div>

        {/* Actual Input */}
        <div className="col-start-1 row-start-1 w-full min-w-0">
          <NumberInput
            ref={ref}
            value={value}
            size={size}
            className={className}
            placeholder={placeholder}
            {...props}
          />
        </div>
      </div>
    );
  }
);

TableNumberInput.displayName = "TableNumberInput";
