import {
  forwardRef,
  createContext,
  useContext,
  useState,
  type ReactNode,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface Tab {
  /** Unique identifier */
  id: string;
  /** Tab label */
  label: string;
  /** Tab icon */
  icon?: ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Badge content */
  badge?: ReactNode;
}

export type TabsVariant = "default" | "pills" | "underline" | "enclosed";
export type TabsSize = "sm" | "md" | "lg";

export interface TabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  /** Available tabs */
  tabs?: Tab[];
  /** Currently active tab id */
  value?: string;
  /** Default active tab (uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Visual variant */
  variant?: TabsVariant;
  /** Size */
  size?: TabsSize;
  /** Full width tabs */
  fullWidth?: boolean;
  /** Children (for compound component pattern) */
  children?: ReactNode;
}

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tab value */
  value: string;
  /** Tab icon */
  icon?: ReactNode;
  /** Badge content */
  badge?: ReactNode;
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Tab value this content belongs to */
  value: string;
  /** Force render even when inactive */
  forceMount?: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
  variant: TabsVariant;
  size: TabsSize;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<TabsSize, { trigger: string; icon: string }> = {
  sm: {
    trigger: "px-3 py-1.5 text-xs gap-1.5",
    icon: "h-3.5 w-3.5",
  },
  md: {
    trigger: "px-4 py-2 text-sm gap-2",
    icon: "h-4 w-4",
  },
  lg: {
    trigger: "px-5 py-2.5 text-base gap-2",
    icon: "h-5 w-5",
  },
};

const variantStyles = {
  default: {
    list: "bg-muted p-1 rounded-lg",
    trigger: "rounded-md",
    active: "bg-card shadow-sm text-text-primary",
    inactive: "text-text-secondary hover:text-text-primary hover:bg-muted/80",
  },
  pills: {
    list: "gap-2",
    trigger: "rounded-full",
    active: "bg-primary-600 text-white shadow-sm",
    inactive: "text-text-secondary hover:bg-muted",
  },
  underline: {
    list: "border-b border-border-primary gap-0",
    trigger: "rounded-none border-b-2 -mb-px",
    active: "border-primary-600 text-primary-600",
    inactive:
      "border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary",
  },
  enclosed: {
    list: "border-b border-border-primary",
    trigger: "rounded-t-lg border border-b-0 -mb-px",
    active: "bg-card border-border-primary text-text-primary",
    inactive:
      "bg-muted/50 border-transparent text-text-secondary hover:text-text-primary",
  },
};

// ============================================================================
// TABS ROOT COMPONENT
// ============================================================================

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      tabs,
      value: controlledValue,
      defaultValue,
      onChange,
      variant = "default",
      size = "md",
      fullWidth = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(
      defaultValue ?? tabs?.[0]?.id ?? ""
    );

    const value = controlledValue ?? internalValue;

    const handleChange = (newValue: string): void => {
      if (onChange) {
        onChange(newValue);
      } else {
        setInternalValue(newValue);
      }
    };

    // Simple mode: render tabs from props
    if (tabs && !children) {
      return (
        <div ref={ref} className={cn("w-full", className)} {...props}>
          <TabsContext.Provider
            value={{ value, onChange: handleChange, variant, size }}
          >
            <TabsList className={cn(fullWidth && "w-full")}>
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  disabled={tab.disabled}
                  icon={tab.icon}
                  badge={tab.badge}
                  className={cn(fullWidth && "flex-1")}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </TabsContext.Provider>
        </div>
      );
    }

    // Compound component mode
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <TabsContext.Provider
          value={{ value, onChange: handleChange, variant, size }}
        >
          {children}
        </TabsContext.Provider>
      </div>
    );
  }
);

Tabs.displayName = "Tabs";

// ============================================================================
// TABS LIST COMPONENT
// ============================================================================

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    const { variant } = useTabsContext();
    const styles = variantStyles[variant];

    return (
      <div
        ref={ref}
        role="tablist"
        className={cn("inline-flex items-center", styles.list, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsList.displayName = "TabsList";

// ============================================================================
// TABS TRIGGER COMPONENT
// ============================================================================

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  (
    { value: tabValue, icon, badge, disabled, className, children, ...props },
    ref
  ) => {
    const { value, onChange, variant, size } = useTabsContext();
    const isActive = value === tabValue;
    const styles = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${tabValue}`}
        disabled={disabled}
        onClick={() => {
          onChange(tabValue);
        }}
        className={cn(
          "relative inline-flex items-center justify-center font-medium",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeStyle.trigger,
          styles.trigger,
          isActive ? styles.active : styles.inactive,
          className
        )}
        {...props}
      >
        {icon && <span className={cn("shrink-0", sizeStyle.icon)}>{icon}</span>}
        <span>{children}</span>
        {badge && (
          <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-xs font-medium bg-slate-200 text-slate-700 rounded-full">
            {badge}
          </span>
        )}

        {/* Active indicator for underline variant */}
        {variant === "underline" && isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-x-0 -bottom-px h-0.5 bg-primary-600"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";

// ============================================================================
// TABS CONTENT COMPONENT
// ============================================================================

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value: tabValue, forceMount, className, children, ...props }, ref) => {
    const { value } = useTabsContext();
    const isActive = value === tabValue;

    if (!isActive && !forceMount) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${tabValue}`}
        aria-labelledby={tabValue}
        hidden={!isActive}
        className={cn(
          "mt-4 focus-visible:outline-none",
          !isActive && "hidden",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = "TabsContent";
