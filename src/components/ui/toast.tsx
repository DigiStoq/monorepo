import {
  forwardRef,
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = "success" | "error" | "warning" | "info";
export type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

export interface Toast {
  /** Unique identifier */
  id: string;
  /** Toast type */
  type: ToastType;
  /** Title */
  title: string;
  /** Description/message */
  description?: string;
  /** Duration in ms (0 = persistent) */
  duration?: number;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Dismiss callback */
  onDismiss?: () => void;
}

export interface ToastProps extends Omit<Toast, "id"> {
  id: string;
  onClose: () => void;
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Default position */
  position?: ToastPosition;
  /** Default duration in ms */
  defaultDuration?: number;
  /** Maximum visible toasts */
  maxToasts?: number;
}

// ============================================================================
// CONTEXT
// ============================================================================

// ============================================================================
// CONTEXT
// ============================================================================

interface ToastContextValue {
  toasts: Toast[];
  toast: (options: Omit<Toast, "id">) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ============================================================================
// STYLES & ICONS
// ============================================================================

const typeStyles: Record<
  ToastType,
  { bg: string; icon: LucideIcon; iconColor: string }
> = {
  success: {
    bg: "bg-success-light border-success/30",
    icon: CheckCircle2,
    iconColor: "text-success",
  },
  error: {
    bg: "bg-error-light border-error/30",
    icon: AlertCircle,
    iconColor: "text-error",
  },
  warning: {
    bg: "bg-warning-light border-warning/30",
    icon: AlertTriangle,
    iconColor: "text-warning-dark",
  },
  info: {
    bg: "bg-info-light border-info/30",
    icon: Info,
    iconColor: "text-info",
  },
};

const positionStyles: Record<ToastPosition, string> = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

const toastVariants = {
  initial: (position: ToastPosition) => ({
    opacity: 0,
    x: position.includes("right") ? 50 : position.includes("left") ? -50 : 0,
    y: position.includes("top") ? -20 : 20,
    scale: 0.95,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 300,
    },
  },
  exit: (position: ToastPosition) => ({
    opacity: 0,
    x: position.includes("right") ? 50 : position.includes("left") ? -50 : 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  }),
} as const;

// ============================================================================
// TOAST ITEM COMPONENT
// ============================================================================

const ToastItem = forwardRef<
  HTMLDivElement,
  ToastProps & { position: ToastPosition }
>(
  (
    {
      type,
      title,
      description,
      duration = 5000,
      action,
      onDismiss,
      onClose,
      position,
    },
    ref
  ) => {
    const { bg, icon: Icon, iconColor } = typeStyles[type];

    // Auto-dismiss
    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          onClose();
          onDismiss?.();
        }, duration);
        return () => {
          clearTimeout(timer);
        };
      }
      return undefined;
    }, [duration, onClose, onDismiss]);

    const handleClose = (): void => {
      onClose();
      onDismiss?.();
    };

    return (
      <motion.div
        ref={ref}
        layout
        custom={position}
        variants={toastVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          "relative w-80 p-4 rounded-lg border shadow-elevated",
          "flex items-start gap-3",
          bg
        )}
        role="alert"
      >
        {/* Icon */}
        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconColor)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          )}
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            "shrink-0 p-1 -mr-1 -mt-1 rounded",
            "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50",
            "transition-colors"
          )}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    );
  }
);

ToastItem.displayName = "ToastItem";

// ============================================================================
// TOAST CONTAINER
// ============================================================================

function ToastContainer({
  toasts,
  position,
  onClose,
}: {
  toasts: Toast[];
  position: ToastPosition;
  onClose: (id: string) => void;
}): JSX.Element | null {
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed z-toast pointer-events-none",
        positionStyles[position]
      )}
    >
      <div className="flex flex-col gap-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              {...toast}
              position={position}
              onClose={() => {
                onClose(toast.id);
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// TOAST PROVIDER
// ============================================================================

let toastCount = 0;

export function ToastProvider({
  children,
  position = "top-right",
  defaultDuration = 5000,
  maxToasts = 5,
}: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = useCallback(
    (options: Omit<Toast, "id">) => {
      const id = `toast-${++toastCount}`;
      const newToast: Toast = {
        id,
        duration: defaultDuration,
        ...options,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Limit max toasts
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      return id;
    },
    [defaultDuration, maxToasts]
  );

  const success = useCallback(
    (title: string, description?: string) => {
      const options: Omit<Toast, "id"> = { type: "success", title };
      if (description) options.description = description;
      return toast(options);
    },
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      const options: Omit<Toast, "id"> = { type: "error", title };
      if (description) options.description = description;
      return toast(options);
    },
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      const options: Omit<Toast, "id"> = { type: "warning", title };
      if (description) options.description = description;
      return toast(options);
    },
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      const options: Omit<Toast, "id"> = { type: "info", title };
      if (description) options.description = description;
      return toast(options);
    },
    [toast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast,
        success,
        error,
        warning,
        info,
        dismiss,
        dismissAll,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} position={position} onClose={dismiss} />
    </ToastContext.Provider>
  );
}
