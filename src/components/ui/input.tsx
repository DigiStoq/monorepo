import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type InputSize = "sm" | "md" | "lg";
export type InputState = "default" | "error" | "success";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  /** Input size */
  size?: InputSize;
  /** Validation state */
  state?: InputState;
  /** Icon to display at the start */
  leftIcon?: ReactNode;
  /** Icon to display at the end */
  rightIcon?: ReactNode;
  /** Error message to display */
  error?: string | undefined;
  /** Helper text below input */
  helperText?: string;
  /** Label text */
  label?: string;
  /** Full width input */
  fullWidth?: boolean;
  /** Show password toggle for password inputs */
  showPasswordToggle?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const wrapperStyles = "relative flex flex-col gap-1.5";

const labelStyles = [
  "text-sm font-medium text-slate-700",
  "cursor-pointer",
].join(" ");

const inputWrapperStyles = "relative flex items-center";

const baseInputStyles = [
  "w-full",
  "bg-white",
  "border border-slate-300",
  "rounded-[10px]",
  "text-slate-900 placeholder:text-slate-400",
  "transition-all duration-200",
  "focus:outline-none focus:ring-2 focus:ring-offset-0",
  "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
].join(" ");

const sizeStyles: Record<InputSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-4 text-base",
};

const stateStyles: Record<InputState, string> = {
  default: [
    "border-slate-300",
    "hover:border-slate-400",
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

const iconStyles = "absolute text-slate-400 pointer-events-none";
const leftIconStyles = "left-3";
const rightIconStyles = "right-3";

const helperTextStyles = "text-xs";
const errorTextStyles = "text-error";
const defaultHelperStyles = "text-slate-500";

// ============================================================================
// COMPONENT
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = "md",
      state = "default",
      leftIcon,
      rightIcon,
      error,
      helperText,
      label,
      fullWidth = true,
      showPasswordToggle = false,
      type,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 9)}`;

    // Determine if password toggle should show
    const isPasswordType = type === "password";
    const shouldShowToggle = isPasswordType && showPasswordToggle;

    // Compute actual type
    const computedType =
      isPasswordType && showPassword ? "text" : (type ?? "text");

    // Compute state from error prop
    const computedState = error ? "error" : state;

    // Compute icon sizes based on input size
    const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

    // Compute padding for icons
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon =
      !!rightIcon || shouldShowToggle || computedState !== "default";

    const paddingLeft = hasLeftIcon
      ? size === "sm"
        ? "pl-8"
        : size === "lg"
          ? "pl-12"
          : "pl-10"
      : "";
    const paddingRight = hasRightIcon
      ? size === "sm"
        ? "pr-8"
        : size === "lg"
          ? "pr-12"
          : "pr-10"
      : "";

    // State icon
    const stateIcon =
      computedState === "error" ? (
        <AlertCircle size={iconSize} className="text-error" />
      ) : computedState === "success" ? (
        <CheckCircle2 size={iconSize} className="text-success" />
      ) : null;

    return (
      <div className={cn(wrapperStyles, fullWidth && "w-full")}>
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
          </label>
        )}

        <div className={inputWrapperStyles}>
          {/* Left Icon */}
          {leftIcon && (
            <span className={cn(iconStyles, leftIconStyles)}>{leftIcon}</span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={computedType}
            disabled={disabled}
            className={cn(
              baseInputStyles,
              sizeStyles[size],
              stateStyles[computedState],
              paddingLeft,
              paddingRight,
              className
            )}
            {...props}
          />

          {/* Right Side Icons */}
          <div
            className={cn(
              iconStyles,
              rightIconStyles,
              "flex items-center gap-1 pointer-events-auto"
            )}
          >
            {/* Custom right icon */}
            {rightIcon && !shouldShowToggle && !stateIcon && (
              <span className="pointer-events-none">{rightIcon}</span>
            )}

            {/* State icon */}
            {stateIcon && !shouldShowToggle && (
              <span className="pointer-events-none">{stateIcon}</span>
            )}

            {/* Password toggle */}
            {shouldShowToggle && (
              <button
                type="button"
                onClick={() => {
                  setShowPassword(!showPassword);
                }}
                className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={iconSize} />
                ) : (
                  <Eye size={iconSize} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Helper/Error Text */}
        {(error ?? helperText) && (
          <p
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
);

Input.displayName = "Input";

// ============================================================================
// SEARCH INPUT VARIANT
// ============================================================================

import { Search, X } from "lucide-react";

export interface SearchInputProps extends Omit<
  InputProps,
  "leftIcon" | "type"
> {
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Show clear button when value exists */
  showClearButton?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, showClearButton = true, value, className, ...props }, ref) => {
    const hasValue = value !== undefined && value !== "";

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="search"
          leftIcon={<Search size={16} />}
          value={value}
          className={cn(hasValue && showClearButton && "pr-10", className)}
          {...props}
        />
        {hasValue && showClearButton && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

// ============================================================================
// TEXTAREA
// ============================================================================

export interface TextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size"
> {
  /** Textarea size (affects padding/font) */
  size?: InputSize;
  /** Validation state */
  state?: InputState;
  /** Error message */
  error?: string | undefined;
  /** Helper text */
  helperText?: string;
  /** Label */
  label?: string;
  /** Full width */
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      size = "md",
      state = "default",
      error,
      helperText,
      label,
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const computedState = error ? "error" : state;

    const textareaSizeStyles: Record<InputSize, string> = {
      sm: "px-3 py-2 text-xs min-h-[80px]",
      md: "px-4 py-3 text-sm min-h-[100px]",
      lg: "px-4 py-3 text-base min-h-[120px]",
    };

    return (
      <div className={cn(wrapperStyles, fullWidth && "w-full")}>
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            baseInputStyles,
            textareaSizeStyles[size],
            stateStyles[computedState],
            "resize-y",
            className
          )}
          {...props}
        />

        {(error ?? helperText) && (
          <p
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
);

Textarea.displayName = "Textarea";
