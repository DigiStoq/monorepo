// ============================================================================
// IMPORT/EXPORT TYPES
// ============================================================================

export type ImportEntityType = "customers" | "items" | "invoices";
export type ExportEntityType = "customers" | "items" | "sale-invoices" | "purchase-invoices" | "payments" | "expenses";
export type ExportFormat = "csv" | "xlsx" | "pdf";

export interface ImportField {
  source: string; // Column name from file
  target: string; // Field in our system
  required: boolean;
  type: "string" | "number" | "date" | "boolean";
}

export interface ImportMapping {
  entityType: ImportEntityType;
  fields: ImportField[];
}

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

export interface BulkCategoryUpdate {
  categoryId: string;
  categoryName: string;
}

export interface BulkStatusUpdate {
  isActive: boolean;
}

export interface BulkStockUpdate {
  type: "set" | "add" | "subtract";
  value: number;
}

export interface BulkUpdateResult {
  success: boolean;
  updated: number;
  failed: number;
  errors: { id: string; message: string }[];
}

// ============================================================================
// DATA CLEANUP TYPES
// ============================================================================

export interface DataCleanupOptions {
  deleteInactiveCustomers: boolean;
  deleteZeroStockItems: boolean;
  deleteOldTransactions: boolean;
  transactionAge?: number; // in months
  archiveBeforeDelete: boolean;
}

export interface DataCleanupResult {
  customersDeleted: number;
  itemsDeleted: number;
  transactionsDeleted: number;
  archiveCreated: boolean;
  archivePath?: string;
}
