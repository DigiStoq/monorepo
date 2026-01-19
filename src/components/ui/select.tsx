import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { ChevronDown, Check, Search, X } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export type SelectSize = "sm" | "md" | "lg";

export interface SelectProps {
  /** Options to display */
  options: SelectOption[];
  /** Currently selected value */
  value?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Size variant */
  size?: SelectSize;
  /** Disabled state */
  disabled?: boolean;
  /** Enable search filtering */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Show clear button */
  clearable?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Additional class name */
  className?: string;
  /** ID for accessibility */
  id?: string;
  /** Name for form submission */
  name?: string;
}

export interface MultiSelectProps extends Omit<
  SelectProps,
  "value" | "onChange"
> {
  /** Currently selected values */
  value?: string[];
  /** Callback when values change */
  onChange?: (values: string[]) => void;
  /** Maximum selections allowed */
  maxSelections?: number;
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<
  SelectSize,
  { trigger: string; option: string; icon: string }
> = {
  sm: {
    trigger: "h-8 px-3 text-xs",
    option: "px-3 py-1.5 text-xs",
    icon: "h-3.5 w-3.5",
  },
  md: {
    trigger: "h-10 px-3 text-sm",
    option: "px-3 py-2 text-sm",
    icon: "h-4 w-4",
  },
  lg: {
    trigger: "h-12 px-4 text-base",
    option: "px-4 py-2.5 text-base",
    icon: "h-5 w-5",
  },
};

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -4,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 400,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
} as const;

// ============================================================================
// SELECT COMPONENT
// ============================================================================

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select an option",
      label,
      helperText,
      error,
      size = "md",
      disabled = false,
      searchable = false,
      searchPlaceholder = "Search...",
      clearable = false,
      fullWidth = false,
      className,
      id,
      name,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const styles = sizeStyles[size];

    // Calculate dropdown position when opening
    useLayoutEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }, [isOpen]);

    // Filter options based on search
    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    // Close on outside click (check both container and portal dropdown)
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent): void => {
        const target = event.target as Node;
        const isInsideContainer = containerRef.current?.contains(target);
        const isInsideDropdown = dropdownRef.current?.contains(target);

        if (!isInsideContainer && !isInsideDropdown) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Focus search input when opened
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    // Reset highlighted index when options change
    useEffect(() => {
      setHighlightedIndex(0);
    }, [filteredOptions.length]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!isOpen) {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            setIsOpen(true);
          }
          return;
        }

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setHighlightedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : prev
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
            break;
          case "Enter":
            e.preventDefault();
            if (
              filteredOptions[highlightedIndex] &&
              !filteredOptions[highlightedIndex].disabled
            ) {
              onChange?.(filteredOptions[highlightedIndex].value);
              setIsOpen(false);
              setSearchQuery("");
            }
            break;
          case "Escape":
            e.preventDefault();
            setIsOpen(false);
            setSearchQuery("");
            break;
          case "Tab":
            setIsOpen(false);
            setSearchQuery("");
            break;
        }
      },
      [isOpen, filteredOptions, highlightedIndex, onChange]
    );

    // Scroll highlighted option into view
    useEffect(() => {
      if (isOpen && listRef.current) {
        const highlightedEl = listRef.current.children[highlightedIndex] as
          | HTMLElement
          | undefined;
        highlightedEl?.scrollIntoView({ block: "nearest" });
      }
    }, [highlightedIndex, isOpen]);

    const handleSelect = (optionValue: string): void => {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery("");
    };

    const handleClear = (e: React.MouseEvent): void => {
      e.stopPropagation();
      onChange?.("");
    };

    const hasError = Boolean(error);

    return (
      <div
        ref={containerRef}
        className={cn("relative", fullWidth && "w-full", className)}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}

        {/* Hidden input for form submission */}
        {name && <input type="hidden" name={name} value={value ?? ""} />}

        {/* Trigger Button */}
        <button
          ref={(node) => {
            // Handle both refs
            triggerRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative flex items-center justify-between gap-2 w-full",
            "bg-card border rounded-[10px]",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            styles.trigger,
            hasError
              ? "border-error focus-visible:ring-error/30"
              : "border-border-primary hover:border-border-secondary focus-visible:ring-primary-500/30 focus-visible:border-primary-500",
            disabled && "opacity-50 cursor-not-allowed bg-subtle",
            isOpen &&
              !hasError &&
              "border-primary-500 ring-2 ring-primary-500/30"
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span
            className={cn(
              "truncate text-left flex-1",
              selectedOption ? "text-text-primary" : "text-text-muted"
            )}
          >
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon}
                {selectedOption.label}
              </span>
            ) : (
              placeholder
            )}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {clearable && value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-subtle rounded transition-colors"
                aria-label="Clear selection"
              >
                <X className={cn(styles.icon, "text-text-muted")} />
              </button>
            )}
            <ChevronDown
              className={cn(
                styles.icon,
                "text-text-muted transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Dropdown - rendered in portal to escape overflow:hidden */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  ref={dropdownRef}
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{
                    position: "fixed",
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                  }}
                  className={cn(
                    "z-popover",
                    "bg-card rounded-lg shadow-elevated border border-border-primary",
                    "overflow-hidden"
                  )}
                >
                  {/* Search Input */}
                  {searchable && (
                    <div className="p-2 border-b border-border-primary">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder={searchPlaceholder}
                          className={cn(
                            "w-full pl-8 pr-3 py-1.5 text-sm",
                            "bg-subtle border border-border-primary rounded-md text-text-primary",
                            "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Options List */}
                  <div
                    ref={listRef}
                    className="max-h-60 overflow-y-auto py-1"
                    role="listbox"
                  >
                    {filteredOptions.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-text-tertiary">
                        No options found
                      </div>
                    ) : (
                      filteredOptions.map((option, index) => (
                        <button
                          key={option.value}
                          type="button"
                          disabled={option.disabled}
                          onClick={() => {
                            if (!option.disabled) handleSelect(option.value);
                          }}
                          onMouseEnter={() => {
                            setHighlightedIndex(index);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between gap-2",
                            "transition-colors duration-100",
                            styles.option,
                            option.disabled
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer",
                            highlightedIndex === index && "bg-primary-50",
                            option.value === value &&
                              "text-primary-600 font-medium"
                          )}
                          role="option"
                          aria-selected={option.value === value}
                        >
                          <span className="flex items-center gap-2 truncate">
                            {option.icon}
                            {option.label}
                          </span>
                          {option.value === value && (
                            <Check
                              className={cn(
                                styles.icon,
                                "text-primary-600 shrink-0"
                              )}
                            />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}

        {/* Helper/Error Text */}
        {(helperText ?? error) && (
          <p
            className={cn(
              "mt-1.5 text-xs",
              hasError ? "text-error" : "text-text-tertiary"
            )}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

// ============================================================================
// MULTI-SELECT COMPONENT
// ============================================================================

export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      value = [],
      onChange,
      placeholder = "Select options",
      label,
      helperText,
      error,
      size = "md",
      disabled = false,
      searchable = false,
      searchPlaceholder = "Search...",
      maxSelections,
      fullWidth = false,
      className,
      id,
      name,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const styles = sizeStyles[size];
    const selectedOptions = options.filter((opt) => value.includes(opt.value));

    // Calculate dropdown position when opening
    useLayoutEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }, [isOpen]);

    // Filter options based on search
    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    // Close on outside click (check both container and portal dropdown)
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent): void => {
        const target = event.target as Node;
        const isInsideContainer = containerRef.current?.contains(target);
        const isInsideDropdown = dropdownRef.current?.contains(target);

        if (!isInsideContainer && !isInsideDropdown) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Focus search input when opened
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    const handleToggle = (optionValue: string): void => {
      const isSelected = value.includes(optionValue);
      let newValue: string[];

      if (isSelected) {
        newValue = value.filter((v) => v !== optionValue);
      } else {
        if (maxSelections && value.length >= maxSelections) {
          return;
        }
        newValue = [...value, optionValue];
      }

      onChange?.(newValue);
    };

    const handleRemove = (optionValue: string, e: React.MouseEvent): void => {
      e.stopPropagation();
      onChange?.(value.filter((v) => v !== optionValue));
    };

    const hasError = Boolean(error);
    const canSelectMore = !maxSelections || value.length < maxSelections;

    return (
      <div
        ref={containerRef}
        className={cn("relative", fullWidth && "w-full", className)}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
            {maxSelections && (
              <span className="text-text-muted font-normal ml-1">
                ({value.length}/{maxSelections})
              </span>
            )}
          </label>
        )}

        {/* Hidden inputs for form submission */}
        {name &&
          value.map((v) => (
            <input key={v} type="hidden" name={`${name}[]`} value={v} />
          ))}

        {/* Trigger Button */}
        <button
          ref={(node) => {
            // Handle both refs
            triggerRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
          className={cn(
            "relative flex items-center justify-between gap-2 w-full min-h-[40px]",
            "bg-card border rounded-[10px]",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            "px-3 py-1.5",
            hasError
              ? "border-error focus-visible:ring-error/30"
              : "border-border-primary hover:border-border-secondary focus-visible:ring-primary-500/30 focus-visible:border-primary-500",
            disabled && "opacity-50 cursor-not-allowed bg-subtle",
            isOpen &&
              !hasError &&
              "border-primary-500 ring-2 ring-primary-500/30"
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex-1 flex flex-wrap gap-1.5">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5",
                    "bg-primary-50 text-primary-700 text-xs font-medium rounded-md"
                  )}
                >
                  {opt.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      handleRemove(opt.value, e);
                    }}
                    className="hover:bg-primary-100 rounded p-0.5 transition-colors"
                    aria-label={`Remove ${opt.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-text-muted text-sm">{placeholder}</span>
            )}
          </div>

          <ChevronDown
            className={cn(
              styles.icon,
              "text-text-muted transition-transform duration-200 shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown - rendered in portal to escape overflow:hidden */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  ref={dropdownRef}
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{
                    position: "fixed",
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                  }}
                  className={cn(
                    "z-popover",
                    "bg-card rounded-lg shadow-elevated border border-border-primary",
                    "overflow-hidden"
                  )}
                >
                  {/* Search Input */}
                  {searchable && (
                    <div className="p-2 border-b border-border-primary">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                          }}
                          placeholder={searchPlaceholder}
                          className={cn(
                            "w-full pl-8 pr-3 py-1.5 text-sm",
                            "bg-subtle border border-border-primary rounded-md text-text-primary",
                            "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Options List */}
                  <div className="max-h-60 overflow-y-auto py-1" role="listbox">
                    {filteredOptions.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-text-tertiary">
                        No options found
                      </div>
                    ) : (
                      filteredOptions.map((option, index) => {
                        const isSelected = value.includes(option.value);
                        const isDisabled =
                          (option.disabled ?? false) ||
                          (!isSelected && !canSelectMore);

                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              if (!isDisabled) handleToggle(option.value);
                            }}
                            onMouseEnter={() => {
                              setHighlightedIndex(index);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between gap-2",
                              "transition-colors duration-100",
                              styles.option,
                              isDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer",
                              highlightedIndex === index && "bg-primary-50",
                              isSelected && "text-primary-600"
                            )}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span className="flex items-center gap-2 truncate">
                              {option.icon}
                              {option.label}
                            </span>
                            <div
                              className={cn(
                                "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
                                "transition-colors duration-100",
                                isSelected
                                  ? "bg-primary-600 border-primary-600"
                                  : "border-border-secondary"
                              )}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}

        {/* Helper/Error Text */}
        {(helperText ?? error) && (
          <p
            className={cn(
              "mt-1.5 text-xs",
              hasError ? "text-error" : "text-text-tertiary"
            )}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";
