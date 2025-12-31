import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./modal";
import { Input } from "./input";
import { Button } from "./button";
import { AlertTriangle, Trash2, Link2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface LinkedItem {
  /** Type of linked item (e.g., "Payment", "Invoice Item") */
  type: string;
  /** Count of linked items */
  count: number;
  /** Description of what will happen */
  description?: string;
}

export interface ConfirmDeleteDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Confirm callback - called when user types "delete" and confirms */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Name of item being deleted (e.g., "INV-001", "John Doe") */
  itemName: string;
  /** Type of item (e.g., "invoice", "customer", "expense") */
  itemType: string;
  /** Optional custom warning message */
  warningMessage?: ReactNode;
  /** List of linked items that will also be affected */
  linkedItems?: LinkedItem[];
  /** Loading state during deletion */
  isLoading?: boolean;
  /** Confirmation word to type (defaults to "delete") */
  confirmWord?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  warningMessage,
  linkedItems = [],
  isLoading = false,
  confirmWord = "delete",
}: ConfirmDeleteDialogProps): React.ReactNode {
  const [inputValue, setInputValue] = useState("");
  const isConfirmEnabled =
    inputValue.toLowerCase() === confirmWord.toLowerCase();

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
    }
  }, [isOpen]);

  const handleConfirm = (): void => {
    if (isConfirmEnabled && !isLoading) {
      onConfirm();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && isConfirmEnabled && !isLoading) {
      onConfirm();
    }
  };

  const hasLinkedItems =
    linkedItems.length > 0 && linkedItems.some((item) => item.count > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
    >
      <ModalHeader showCloseButton={!isLoading} onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-error-light flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-error" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">
              This action cannot be undone
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-4">
        {/* Item being deleted */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">{itemType}</p>
          <p className="font-semibold text-slate-900">{itemName}</p>
        </div>

        {/* Warning message */}
        {warningMessage && (
          <div className="text-sm text-slate-600">{warningMessage}</div>
        )}

        {/* Linked items that will be affected */}
        {hasLinkedItems && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Link2 className="h-4 w-4" />
              <span>The following will also be deleted:</span>
            </div>
            <div className="space-y-1.5">
              {linkedItems.map(
                (item, index) =>
                  item.count > 0 && (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-lg",
                        "bg-error-light/50 border border-error/20"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-3.5 w-3.5 text-error" />
                        <span className="text-sm text-slate-700">
                          {item.count} {item.type}
                          {item.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {item.description && (
                        <span className="text-xs text-slate-500">
                          {item.description}
                        </span>
                      )}
                    </div>
                  )
              )}
            </div>
          </div>
        )}

        {/* Confirmation input */}
        <div className="pt-2">
          <p className="text-sm text-slate-600 mb-2">
            Type{" "}
            <span className="font-semibold text-error">
              &quot;{confirmWord}&quot;
            </span>{" "}
            to confirm deletion:
          </p>
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Type "${confirmWord}" here`}
            autoFocus
            disabled={isLoading}
            state={inputValue && !isConfirmEnabled ? "error" : "default"}
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => {
            onClose();
          }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={!isConfirmEnabled}
          isLoading={isLoading}
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          Delete {itemType}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
