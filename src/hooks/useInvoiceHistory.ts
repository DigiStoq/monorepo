import { useQuery } from "@powersync/react";
import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import { useAuthStore } from "@/stores/auth-store";

// ============================================================================
// TYPES
// ============================================================================

export type InvoiceHistoryAction =
  | "created"
  | "updated"
  | "status_changed"
  | "payment_recorded"
  | "deleted";

export type InvoiceType = "sale" | "purchase";

export interface InvoiceHistory {
  id: string;
  invoiceId: string;
  invoiceType: InvoiceType;
  action: InvoiceHistoryAction;
  description: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  userId?: string;
  userName?: string;
  createdAt: string;
}

interface InvoiceHistoryRow {
  id: string;
  invoice_id: string;
  invoice_type: string;
  action: string;
  description: string;
  old_values: string | null;
  new_values: string | null;
  user_id: string | null;
  user_name: string | null;
  created_at: string;
}

// ============================================================================
// HELPER
// ============================================================================

// Helper to safely parse JSON values that might be strings, objects, or double-encoded
function parseJsonValue(
  value: string | object | null
): Record<string, unknown> | null {
  if (!value) return null;

  // If it's already an object, return it
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  // If it's a string, try to parse it
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      // Handle double-encoded JSON (string within string)
      if (typeof parsed === "string") {
        return JSON.parse(parsed) as Record<string, unknown>;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return null;
}

function mapRowToHistory(row: InvoiceHistoryRow): InvoiceHistory {
  const history: InvoiceHistory = {
    id: row.id,
    invoiceId: row.invoice_id,
    invoiceType: row.invoice_type as InvoiceType,
    action: row.action as InvoiceHistoryAction,
    description: row.description,
    createdAt: row.created_at,
  };

  // Add optional fields only if they have values
  const oldVals = parseJsonValue(row.old_values as string | object | null);
  const newVals = parseJsonValue(row.new_values as string | object | null);

  if (oldVals && Object.keys(oldVals).length > 0) history.oldValues = oldVals;
  if (newVals && Object.keys(newVals).length > 0) history.newValues = newVals;
  if (row.user_id) history.userId = row.user_id;
  if (row.user_name) history.userName = row.user_name;

  return history;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useInvoiceHistory(
  invoiceId: string | null,
  invoiceType: InvoiceType = "sale"
): {
  history: InvoiceHistory[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<InvoiceHistoryRow>(
    invoiceId
      ? `SELECT * FROM invoice_history WHERE invoice_id = ? AND invoice_type = ? ORDER BY created_at DESC`
      : `SELECT * FROM invoice_history WHERE 1 = 0`,
    invoiceId ? [invoiceId, invoiceType] : []
  );

  const history = data.map(mapRowToHistory);

  return { history, isLoading, error };
}

export interface InvoiceHistoryMutations {
  addHistoryEntry: (entry: {
    invoiceId: string;
    invoiceType: InvoiceType;
    action: InvoiceHistoryAction;
    description: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    userName?: string;
  }) => Promise<string>;
}

export function useInvoiceHistoryMutations(): InvoiceHistoryMutations {
  const db = getPowerSyncDatabase();

  const addHistoryEntry = useCallback(
    async (entry: {
      invoiceId: string;
      invoiceType: InvoiceType;
      action: InvoiceHistoryAction;
      description: string;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
      userName?: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const { user } = useAuthStore.getState();
      const userId = user?.id ?? null;
      const userName =
        user?.user_metadata.full_name ??
        user?.email ??
        entry.userName ??
        "User";

      await db.execute(
        `INSERT INTO invoice_history (
          id, invoice_id, invoice_type, action, description,
          old_values, new_values, user_id, user_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          entry.invoiceId,
          entry.invoiceType,
          entry.action,
          entry.description,
          entry.oldValues ? JSON.stringify(entry.oldValues) : null,
          entry.newValues ? JSON.stringify(entry.newValues) : null,
          userId,
          userName,
          now,
        ]
      );

      return id;
    },
    [db]
  );

  return { addHistoryEntry };
}
