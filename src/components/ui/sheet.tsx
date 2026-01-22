import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { IconButton } from "./button";

// ============================================================================
// TYPES
// ============================================================================

export type SheetSize = "sm" | "md" | "lg" | "xl" | "full";

export interface SheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Sheet size */
  size?: SheetSize;
  /** Sheet title */
  title?: ReactNode;
  /** Sheet description */
  description?: ReactNode;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Sheet content */
  children: ReactNode;
  /** Footer content (buttons, etc.) */
  footer?: ReactNode;
  /** Additional class name for the sheet panel */
  className?: string;
  /** Prevent body scroll when open */
  preventBodyScroll?: boolean;
}

export interface SheetHeaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Title text */
  title?: ReactNode;
  /** Description text */
  description?: ReactNode;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close callback */
  onClose?: () => void;
}

export type SheetBodyProps = HTMLAttributes<HTMLDivElement>;

export interface SheetFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Alignment */
  align?: "left" | "center" | "right" | "between";
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<SheetSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-2xl",
  full: "max-w-full",
};

// ============================================================================
// ANIMATIONS
// ============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

const sheetVariants = {
  hidden: {
    x: "100%",
    boxShadow: "none",
  },
  visible: {
    x: 0,
    boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 300,
    },
  },
  exit: {
    x: "100%",
    boxShadow: "none",
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
} as const;

// ============================================================================
// SHEET COMPONENT
// ============================================================================

export function Sheet({
  isOpen,
  onClose,
  size = "md",
  title,
  description,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
  footer,
  className,
  preventBodyScroll = true,
}: SheetProps): JSX.Element | null {
  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen && preventBodyScroll) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [isOpen, preventBodyScroll]);

  // Add escape key listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
    return undefined;
  }, [isOpen, handleEscape]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  // Render in portal
  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-modal overflow-hidden">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
          />

          {/* Sheet Container */}
          <div
            className="absolute inset-0 flex justify-end"
            onClick={handleBackdropClick}
          >
            {/* Sheet Panel */}
            <motion.div
              className={cn(
                "relative h-full w-full",
                "bg-card shadow-elevated",
                "flex flex-col",
                sizeStyles[size],
                className
              )}
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => {
                e.stopPropagation();
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "sheet-title" : undefined}
              aria-describedby={description ? "sheet-description" : undefined}
            >
              {/* Header */}
              {(title ?? description ?? showCloseButton) && (
                <SheetHeader
                  title={title}
                  description={description}
                  showCloseButton={showCloseButton}
                  onClose={onClose}
                />
              )}

              {/* Body */}
              <SheetBody>{children}</SheetBody>

              {/* Footer */}
              {footer && <SheetFooter>{footer}</SheetFooter>}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ============================================================================
// SHEET HEADER
// ============================================================================

export const SheetHeader = forwardRef<HTMLDivElement, SheetHeaderProps>(
  (
    {
      className,
      title,
      description,
      showCloseButton,
      onClose,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between gap-4 px-6 py-6",
          "border-b border-border-primary",
          className
        )}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {title && (
            <h2
              id="sheet-title"
              className="text-lg font-semibold text-text-primary font-display"
            >
              {title}
            </h2>
          )}
          {description && (
            <p
              id="sheet-description"
              className="mt-1 text-sm text-text-tertiary"
            >
              {description}
            </p>
          )}
          {children}
        </div>
        {showCloseButton && onClose && (
          <IconButton
            icon={<X size={18} />}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close sheet"
            className="shrink-0 -mr-2 -mt-2"
          />
        )}
      </div>
    );
  }
);

SheetHeader.displayName = "SheetHeader";

// ============================================================================
// SHEET BODY
// ============================================================================

export const SheetBody = forwardRef<HTMLDivElement, SheetBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-y-auto px-6 py-6", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SheetBody.displayName = "SheetBody";

// ============================================================================
// SHEET FOOTER
// ============================================================================

const footerAlignStyles = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
  between: "justify-between",
};

export const SheetFooter = forwardRef<HTMLDivElement, SheetFooterProps>(
  ({ className, align = "right", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 px-6 py-4",
          "border-t border-border-primary bg-subtle",
          footerAlignStyles[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SheetFooter.displayName = "SheetFooter";
