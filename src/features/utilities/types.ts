// ============================================================================
// IMPORT/EXPORT TYPES
// ============================================================================

export type ImportEntityType = "customers" | "items" | "invoices";
export type ExportEntityType =
  | "customers"
  | "items"
  | "sale-invoices"
  | "purchase-invoices"
  | "payments"
  | "expenses";
export type ExportFormat = "csv" | "xlsx" | "pdf";

export interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportError[];
  previewData: Record<string, unknown>[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: unknown;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export interface ExportOptions {
  entityType: ExportEntityType;
  format: ExportFormat;
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: Record<string, unknown>;
  columns?: string[];
}

export interface ExportResult {
  success: boolean;
  filename: string;
  recordCount: number;
  fileSize: number;
}

// ============================================================================
// BULK UPDATE TYPES
// ============================================================================

export type BulkUpdateType = "price" | "category" | "status" | "stock";

export interface BulkPriceUpdate {
  type: "fixed" | "percentage";
  value: number;
  applyTo: "sale" | "purchase" | "both";
  roundTo?: number;
}

export interface BulkUpdateResult {
  success: boolean;
  updated: number;
  failed: number;
  errors: { id: string; message: string }[];
}
