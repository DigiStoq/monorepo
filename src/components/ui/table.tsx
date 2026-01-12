import {
  forwardRef,
  useState,
  useMemo,
  type HTMLAttributes,
  type ReactNode,
  type ThHTMLAttributes,
  type TdHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Check,
  Minus,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Header label */
  header: ReactNode;
  /** Cell renderer */
  cell?: (row: T, index: number) => ReactNode;
  /** Accessor function for sorting */
  accessor?: (row: T) => string | number | boolean | null | undefined;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Column width */
  width?: string | number;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** Sticky column */
  sticky?: "left" | "right";
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export interface TableProps<T> extends Omit<
  HTMLAttributes<HTMLTableElement>,
  "children"
> {
  /** Table columns configuration */
  columns: Column<T>[];
  /** Table data */
  data: T[];
  /** Unique key extractor */
  getRowKey: (row: T, index: number) => string | number;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: Set<string | number>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string | number>) => void;
  /** Enable single selection mode */
  singleSelect?: boolean;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state content */
  emptyContent?: ReactNode;
  /** Striped rows */
  striped?: boolean;
  /** Hover effect on rows */
  hoverable?: boolean;
  /** Compact padding */
  compact?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Max height for scrollable body */
  maxHeight?: string | number;
  /** Default sort column */
  defaultSortKey?: string;
  /** Default sort direction */
  defaultSortDirection?: SortDirection;
  /** Controlled sort key */
  sortKey?: string;
  /** Controlled sort direction */
  sortDirection?: SortDirection;
  /** Sort change handler */
  onSortChange?: (key: string, direction: SortDirection) => void;
}

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;
export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  clickable?: boolean;
}
export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
}
export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

// ============================================================================
// STYLES
// ============================================================================

const alignStyles = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

// ============================================================================
// TABLE PRIMITIVES
// ============================================================================

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-subtle", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("divide-y divide-border-primary", className)}
      {...props}
    />
  )
);
TableBody.displayName = "TableBody";

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, clickable, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "transition-colors",
        selected && "bg-primary-50",
        clickable && "cursor-pointer hover:bg-subtle",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider",
        sortable && "cursor-pointer select-none hover:bg-subtle",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        {children}
        {sortable && (
          <span className="shrink-0">
            {sortDirection === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5 text-primary-600" />
            ) : sortDirection === "desc" ? (
              <ChevronDown className="h-3.5 w-3.5 text-primary-600" />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 text-text-muted" />
            )}
          </span>
        )}
      </div>
    </th>
  )
);
TableHead.displayName = "TableHead";

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("px-4 py-3 text-sm text-text-secondary", className)}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

// ============================================================================
// CHECKBOX COMPONENT (Internal)
// ============================================================================

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: CheckboxProps): JSX.Element {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
        checked || indeterminate
          ? "bg-primary-600 border-primary-600"
          : "border-border-secondary hover:border-border-primary",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {checked && <Check className="h-3 w-3 text-white" />}
      {indeterminate && !checked && <Minus className="h-3 w-3 text-white" />}
    </button>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton({
  columns,
  rows = 5,
}: {
  columns: number;
  rows?: number;
}): JSX.Element {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-muted rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({
  colSpan,
  content,
}: {
  colSpan: number;
  content?: ReactNode;
}): React.ReactNode {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        {content ?? (
          <div className="text-text-tertiary">
            <p className="text-sm">No data available</p>
          </div>
        )}
      </td>
    </tr>
  );
}

// ============================================================================
// MAIN TABLE COMPONENT
// ============================================================================

export function Table<T>({
  columns,
  data,
  getRowKey,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  singleSelect = false,
  onRowClick,
  isLoading = false,
  emptyContent,
  striped = false,
  hoverable = true,
  compact = false,
  stickyHeader = false,
  maxHeight,
  defaultSortKey,
  defaultSortDirection = "asc",
  sortKey: controlledSortKey,
  sortDirection: controlledSortDirection,
  onSortChange,
  className,
  ...props
}: TableProps<T>): React.ReactNode {
  // Internal sort state (for uncontrolled mode)
  const [internalSortKey, setInternalSortKey] = useState<string | undefined>(
    defaultSortKey
  );
  const [internalSortDirection, setInternalSortDirection] =
    useState<SortDirection>(defaultSortKey ? defaultSortDirection : null);

  // Use controlled or internal state
  const sortKey = controlledSortKey ?? internalSortKey;
  const sortDirection = controlledSortDirection ?? internalSortDirection;

  // Sort handler
  const handleSort = (key: string): void => {
    let newDirection: SortDirection;

    if (sortKey === key) {
      // Cycle: asc -> desc -> null
      if (sortDirection === "asc") {
        newDirection = "desc";
      } else if (sortDirection === "desc") {
        newDirection = null;
      } else {
        newDirection = "asc";
      }
    } else {
      newDirection = "asc";
    }

    if (onSortChange) {
      onSortChange(key, newDirection);
    } else {
      setInternalSortKey(newDirection ? key : undefined);
      setInternalSortDirection(newDirection);
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    const column = columns.find((col) => col.key === sortKey);
    if (!column?.accessor) return data;

    const accessor = column.accessor;
    return [...data].sort((a, b) => {
      const aVal = accessor(a);
      const bVal = accessor(b);

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        comparison = aVal === bVal ? 0 : aVal ? -1 : 1;
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [data, sortKey, sortDirection, columns]);

  // Selection handlers
  const allKeys = useMemo(
    () => new Set(data.map((row, i) => getRowKey(row, i))),
    [data, getRowKey]
  );
  const isAllSelected = selectedKeys.size === allKeys.size && allKeys.size > 0;
  const isSomeSelected = selectedKeys.size > 0 && !isAllSelected;

  const handleSelectAll = (): void => {
    if (isAllSelected) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(allKeys);
    }
  };

  const handleSelectRow = (key: string | number): void => {
    if (singleSelect) {
      onSelectionChange?.(new Set([key]));
    } else {
      const newKeys = new Set(selectedKeys);
      if (newKeys.has(key)) {
        newKeys.delete(key);
      } else {
        newKeys.add(key);
      }
      onSelectionChange?.(newKeys);
    }
  };

  const effectiveColumns = selectable ? columns.length + 1 : columns.length;

  return (
    <div
      className={cn(
        "overflow-auto rounded-lg border border-border-primary",
        maxHeight && "overflow-y-auto"
      )}
      style={{ maxHeight }}
    >
      <table
        className={cn("min-w-full divide-y divide-border-primary", className)}
        {...props}
      >
        <TableHeader className={cn(stickyHeader && "sticky top-0 z-10")}>
          <tr>
            {/* Selection Header */}
            {selectable && !singleSelect && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={handleSelectAll}
                />
              </TableHead>
            )}
            {selectable && singleSelect && <TableHead className="w-12" />}

            {/* Column Headers */}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                sortable={column.sortable ?? false}
                sortDirection={sortKey === column.key ? sortDirection : null}
                onSort={() => {
                  if (column.sortable) handleSort(column.key);
                }}
                className={cn(
                  alignStyles[column.align ?? "left"],
                  column.hideOnMobile && "hidden md:table-cell",
                  column.sticky === "left" && "sticky left-0 bg-subtle z-10",
                  column.sticky === "right" && "sticky right-0 bg-subtle z-10"
                )}
                style={{ width: column.width }}
              >
                {column.header}
              </TableHead>
            ))}
          </tr>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <LoadingSkeleton columns={effectiveColumns} />
          ) : sortedData.length === 0 ? (
            <EmptyState colSpan={effectiveColumns} content={emptyContent} />
          ) : (
            sortedData.map((row, index) => {
              const rowKey = getRowKey(row, index);
              const isSelected = selectedKeys.has(rowKey);

              return (
                <TableRow
                  key={rowKey}
                  selected={isSelected}
                  clickable={Boolean(onRowClick)}
                  onClick={() => onRowClick?.(row, index)}
                  className={cn(
                    striped && index % 2 === 1 && "bg-subtle",
                    hoverable && "hover:bg-subtle"
                  )}
                >
                  {/* Selection Cell */}
                  {selectable && (
                    <TableCell className="w-12">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {
                          handleSelectRow(rowKey);
                        }}
                      />
                    </TableCell>
                  )}

                  {/* Data Cells */}
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        alignStyles[column.align ?? "left"],
                        compact ? "py-2" : "py-3",
                        column.hideOnMobile && "hidden md:table-cell",
                        column.sticky === "left" &&
                        "sticky left-0 bg-card z-10",
                        column.sticky === "right" &&
                        "sticky right-0 bg-card z-10",
                        isSelected && column.sticky && "bg-primary-50"
                      )}
                      style={{ width: column.width }}
                    >
                      {column.cell
                        ? column.cell(row, index)
                        : column.accessor
                          ? String(column.accessor(row) ?? "")
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </table>
    </div>
  );
}

// ============================================================================
// PAGINATION COMPONENT
// ============================================================================

export interface TablePaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Items per page */
  pageSize?: number;
  /** Total items count */
  totalItems?: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Page size change handler */
  onPageSizeChange?: (size: number) => void;
  /** Additional class name */
  className?: string;
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  className,
}: TablePaginationProps): JSX.Element {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  // Calculate visible page numbers
  const getVisiblePages = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 bg-card border-t border-border-primary",
        className
      )}
    >
      {/* Left side - showing info */}
      <div className="text-sm text-text-secondary">
        {totalItems !== undefined && pageSize !== undefined && (
          <span>
            Showing {Math.min((page - 1) * pageSize + 1, totalItems)} -{" "}
            {Math.min(page * pageSize, totalItems)} of {totalItems}
          </span>
        )}
      </div>

      {/* Right side - pagination controls */}
      <div className="flex items-center gap-2">
        {/* Page size selector */}
        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-text-secondary">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
              }}
              className={cn(
                "h-8 px-2 text-sm border border-border-primary rounded-md bg-card text-text-primary",
                "focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              )}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Previous button */}
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => {
            onPageChange(page - 1);
          }}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            canGoPrev
              ? "text-slate-700 hover:bg-slate-100"
              : "text-slate-300 cursor-not-allowed"
          )}
        >
          Previous
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onPageChange(p);
                }}
                className={cn(
                  "min-w-[32px] h-8 px-2 text-sm font-medium rounded-md transition-colors",
                  p === page
                    ? "bg-primary-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next button */}
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => {
            onPageChange(page + 1);
          }}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            canGoNext
              ? "text-slate-700 hover:bg-slate-100"
              : "text-slate-300 cursor-not-allowed"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
