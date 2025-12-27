import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner */
  isLoading?: boolean | undefined;
  /** Icon to display before text */
  leftIcon?: ReactNode;
  /** Icon to display after text */
  rightIcon?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const baseStyles = [
  "inline-flex items-center justify-center gap-2",
  "font-medium text-sm",
  "rounded-[10px]",
  "transition-all duration-200 ease-out",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  "disabled:opacity-50 disabled:pointer-events-none",
  "active:scale-[0.98]",
  "select-none",
];

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-primary-600 text-white",
    "hover:bg-primary-700",
    "focus-visible:ring-primary-500",
    "shadow-sm hover:shadow-md",
  ].join(" "),

  secondary: [
    "bg-slate-100 text-slate-700",
    "hover:bg-slate-200",
    "focus-visible:ring-slate-400",
  ].join(" "),

  ghost: [
    "bg-transparent text-slate-600",
    "hover:bg-slate-100 hover:text-slate-900",
    "focus-visible:ring-slate-400",
  ].join(" "),

  danger: [
    "bg-error text-white",
    "hover:bg-error-dark",
    "focus-visible:ring-error",
    "shadow-sm hover:shadow-md",
  ].join(" "),

  success: [
    "bg-success text-white",
    "hover:bg-success-dark",
    "focus-visible:ring-success",
    "shadow-sm hover:shadow-md",
  ].join(" "),

  outline: [
    "bg-transparent text-primary-600 border-2 border-primary-600",
    "hover:bg-primary-50",
    "focus-visible:ring-primary-500",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {size !== "icon" && <span>Loading...</span>}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="inline-flex shrink-0">{leftIcon}</span>
            )}
            {children}
            {rightIcon && (
              <span className="inline-flex shrink-0">{rightIcon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// ============================================================================
// ICON BUTTON VARIANT
// ============================================================================

export interface IconButtonProps
  extends Omit<ButtonProps, "leftIcon" | "rightIcon" | "children"> {
  /** Icon to display */
  icon: ReactNode;
  /** Accessible label */
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = "icon", ...props }, ref) => {
    return (
      <Button ref={ref} size={size} className={className} {...props}>
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = "IconButton";
