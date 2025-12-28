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
import { IconButton, Button } from "./button";

// ============================================================================
// TYPES
// ============================================================================

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal size */
  size?: ModalSize;
  /** Modal title */
  title?: ReactNode;
  /** Modal description */
  description?: ReactNode;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Modal content */
  children: ReactNode;
  /** Footer content (buttons, etc.) */
  footer?: ReactNode;
  /** Additional class name for the modal panel */
  className?: string;
  /** Prevent body scroll when open */
  preventBodyScroll?: boolean;
}

export interface ModalHeaderProps extends Omit<
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

export type ModalBodyProps = HTMLAttributes<HTMLDivElement>;

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Alignment */
  align?: "left" | "center" | "right" | "between";
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
};

// ============================================================================
// ANIMATIONS
// ============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
} as const;

// ============================================================================
// MODAL COMPONENT
// ============================================================================

export function Modal({
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
}: ModalProps): JSX.Element | null {
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
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  // Render in portal
  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-modal">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
          />

          {/* Modal Container */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            {/* Modal Panel */}
            <motion.div
              className={cn(
                "relative w-full",
                "bg-white rounded-xl shadow-elevated",
                "flex flex-col max-h-[calc(100vh-2rem)]",
                sizeStyles[size],
                className
              )}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => {
                e.stopPropagation();
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
              aria-describedby={description ? "modal-description" : undefined}
            >
              {/* Header */}
              {(title ?? description ?? showCloseButton) && (
                <ModalHeader
                  title={title}
                  description={description}
                  showCloseButton={showCloseButton}
                  onClose={onClose}
                />
              )}

              {/* Body */}
              <ModalBody>{children}</ModalBody>

              {/* Footer */}
              {footer && <ModalFooter>{footer}</ModalFooter>}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ============================================================================
// MODAL HEADER
// ============================================================================

export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
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
          "flex items-start justify-between gap-4 px-6 pt-6 pb-4",
          "border-b border-slate-100",
          className
        )}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {title && (
            <h2
              id="modal-title"
              className="text-lg font-semibold text-slate-900 font-display"
            >
              {title}
            </h2>
          )}
          {description && (
            <p id="modal-description" className="mt-1 text-sm text-slate-500">
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
            aria-label="Close modal"
            className="shrink-0 -mr-2 -mt-2"
          />
        )}
      </div>
    );
  }
);

ModalHeader.displayName = "ModalHeader";

// ============================================================================
// MODAL BODY
// ============================================================================

export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-y-auto px-6 py-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalBody.displayName = "ModalBody";

// ============================================================================
// MODAL FOOTER
// ============================================================================

const footerAlignStyles = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
  between: "justify-between",
};

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, align = "right", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 px-6 py-4",
          "border-t border-slate-100 bg-slate-50/50",
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

ModalFooter.displayName = "ModalFooter";

// ============================================================================
// MODAL CONTENT (Wrapper for compound pattern)
// ============================================================================

export type ModalContentProps = HTMLAttributes<HTMLDivElement>;

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col", className)} {...props}>
        {children}
      </div>
    );
  }
);

ModalContent.displayName = "ModalContent";

// ============================================================================
// CONFIRM DIALOG (Common preset)
// ============================================================================

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Confirm callback */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: ReactNode;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Danger mode (destructive action) */
  danger?: boolean;
  /** Loading state */
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  isLoading = false,
}: ConfirmDialogProps): JSX.Element {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-slate-600">{message}</p>
    </Modal>
  );
}
