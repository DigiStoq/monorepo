import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import { useAuthStore } from "@/stores/auth-store";
import type {
  CreditNote,
  CreditNoteItem,
  CreditNoteReason,
} from "@/features/sales/types";

// Database row types (snake_case columns from SQLite)
interface CreditNoteRow {
  id: string;
  credit_note_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  invoice_id: string | null;
  invoice_number: string | null;
  reason: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToCreditNote(row: CreditNoteRow): CreditNote {
  return {
    id: row.id,
    creditNoteNumber: row.credit_note_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    invoiceId: row.invoice_id ?? undefined,
    invoiceNumber: row.invoice_number ?? undefined,
    reason: row.reason as CreditNoteReason,
    items: [], // Items are fetched separately
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    total: row.total,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useCreditNotes(filters?: {
  customerId?: string;
  reason?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): {
  creditNotes: CreditNote[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const params = useMemo(() => {
    const customerFilter = filters?.customerId ?? null;
    const reasonFilter = filters?.reason ?? null;
    const dateFromFilter = filters?.dateFrom ?? null;
    const dateToFilter = filters?.dateTo ?? null;
    const searchFilter = filters?.search ? `%${filters.search}%` : null;
    return [
      customerFilter,
      reasonFilter,
      dateFromFilter,
      dateToFilter,
      searchFilter,
    ];
  }, [
    filters?.customerId,
    filters?.reason,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<CreditNoteRow>(
    `SELECT * FROM credit_notes
     WHERE ($1 IS NULL OR customer_id = $1)
     AND ($2 IS NULL OR reason = $2)
     AND ($3 IS NULL OR date >= $3)
     AND ($4 IS NULL OR date <= $4)
     AND ($5 IS NULL OR credit_note_number LIKE $5 OR customer_name LIKE $5)
     ORDER BY date DESC, created_at DESC`,
    params
  );

  const creditNotes = useMemo(() => data.map(mapRowToCreditNote), [data]);

  return { creditNotes, isLoading, error };
}

interface CreditNoteMutations {
  createCreditNote: (
    data: {
      creditNoteNumber: string;
      customerId: string;
      customerName: string;
      date: string;
      invoiceId?: string;
      invoiceNumber?: string;
      reason: string;
      notes?: string;
    },
    items: Omit<CreditNoteItem, "id" | "creditNoteId">[]
  ) => Promise<string>;
  updateCreditNote: (
    id: string,
    data: {
      creditNoteNumber: string;
      customerId: string;
      customerName: string;
      date: string;
      invoiceId?: string;
      invoiceNumber?: string;
      reason: string;
      notes?: string;
    },
    items: Omit<CreditNoteItem, "id" | "creditNoteId">[]
  ) => Promise<void>;
  deleteCreditNote: (id: string) => Promise<void>;
}

export function useCreditNoteMutations(): CreditNoteMutations {
  const db = getPowerSyncDatabase();

  const createCreditNote = useCallback(
    async (
      data: {
        creditNoteNumber: string;
        customerId: string;
        customerName: string;
        date: string;
        invoiceId?: string;
        invoiceNumber?: string;
        reason: string;
        notes?: string;
      },
      items: Omit<CreditNoteItem, "id" | "creditNoteId">[]
    ): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      const subtotal = items.reduce(
        (sum: number, item) => sum + item.amount,
        0
      );
      const taxAmount = items.reduce(
        (sum: number, item) =>
          sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount;

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO credit_notes (
            id, credit_note_number, customer_id, customer_name, date,
            invoice_id, invoice_number, reason, subtotal, tax_amount, total, notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.creditNoteNumber,
            data.customerId,
            data.customerName,
            data.date,
            data.invoiceId ?? null,
            data.invoiceNumber ?? null,
            data.reason,
            subtotal,
            taxAmount,
            total,
            data.notes ?? null,
            now,
            now,
          ]
        );

        for (const item of items) {
          const itemId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO credit_note_items (
              id, credit_note_id, item_id, item_name, description, quantity, unit,
              unit_price, tax_percent, amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              id,
              item.itemId ?? null,
              item.itemName,
              item.description ?? null,
              item.quantity,
              item.unit ?? null,
              item.unitPrice,
              item.taxPercent ?? 0,
              item.amount,
            ]
          );
        }

        // Update customer balance (reduce receivable)
        await tx.execute(
          `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
          [total, now, data.customerId]
        );

        // Log History
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "credit_note",
            "created",
            `Created credit note ${data.creditNoteNumber}`,
            null,
            JSON.stringify({
              creditNoteNumber: data.creditNoteNumber,
              customerName: data.customerName,
              total,
            }),
            user?.id ?? null,
            userName,
            now,
          ]
        );
      });

      return id;
    },
    [db]
  );

  const updateCreditNote = useCallback(
    async (
      id: string,
      data: {
        creditNoteNumber: string;
        customerId: string;
        customerName: string;
        date: string;
        invoiceId?: string;
        invoiceNumber?: string;
        reason: string;
        notes?: string;
      },
      items: Omit<CreditNoteItem, "id" | "creditNoteId">[]
    ): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      const subtotal = items.reduce(
        (sum: number, item) => sum + item.amount,
        0
      );
      const taxAmount = items.reduce(
        (sum: number, item) =>
          sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount;

      await db.writeTransaction(async (tx) => {
        // 1. Get Old Data
        const oldResult = await tx.execute(
          `SELECT customer_id, total FROM credit_notes WHERE id = ?`,
          [id]
        );
        const oldNote = oldResult.rows?.item(0);
        if (!oldNote) throw new Error("Credit note not found");

        // 2. Reverse OLD Balance (Increase receivable - undo decrease)
        await tx.execute(
          `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
          [oldNote.total, now, oldNote.customer_id]
        );

        // 3. Update Header
        await tx.execute(
          `UPDATE credit_notes SET
            credit_note_number = ?, customer_id = ?, customer_name = ?, date = ?,
            invoice_id = ?, invoice_number = ?, reason = ?, subtotal = ?, tax_amount = ?, total = ?, notes = ?,
            updated_at = ?
            WHERE id = ?`,
          [
            data.creditNoteNumber,
            data.customerId,
            data.customerName,
            data.date,
            data.invoiceId ?? null,
            data.invoiceNumber ?? null,
            data.reason,
            subtotal,
            taxAmount,
            total,
            data.notes ?? null,
            now,
            id,
          ]
        );

        // 4. Delete Old Items
        await tx.execute(
          `DELETE FROM credit_note_items WHERE credit_note_id = ?`,
          [id]
        );

        // 5. Insert New Items
        for (const item of items) {
          const itemId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO credit_note_items (
              id, credit_note_id, item_id, item_name, description, quantity, unit,
              unit_price, tax_percent, amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              id,
              item.itemId ?? null,
              item.itemName,
              item.description ?? null,
              item.quantity,
              item.unit ?? null,
              item.unitPrice,
              item.taxPercent ?? 0,
              item.amount,
            ]
          );
        }

        // 6. Apply NEW Balance (Reduce receivable)
        await tx.execute(
          `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
          [total, now, data.customerId]
        );

        // 7. Log History
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "credit_note",
            "updated",
            `Updated credit note ${data.creditNoteNumber}`,
            JSON.stringify({ total: oldNote.total }),
            JSON.stringify({ total }),
            user?.id ?? null,
            userName,
            now,
          ]
        );
      });
    },
    [db]
  );

  const deleteCreditNote = useCallback(
    async (id: string): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        const result = await tx.execute(
          `SELECT customer_id, total, credit_note_number FROM credit_notes WHERE id = ?`,
          [id]
        );
        const note = result.rows?.item(0);

        if (note) {
          // Reverse Balance (Increase receivable)
          await tx.execute(
            `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
            [note.total, now, note.customer_id]
          );
        }

        await tx.execute(
          `DELETE FROM credit_note_items WHERE credit_note_id = ?`,
          [id]
        );
        await tx.execute(`DELETE FROM credit_notes WHERE id = ?`, [id]);

        // Log History
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "credit_note",
            "deleted",
            `Deleted credit note ${note?.credit_note_number ?? "Unknown"}`,
            JSON.stringify(note),
            null,
            user?.id ?? null,
            userName,
            now,
          ]
        );
      });
    },
    [db]
  );

  return {
    createCreditNote,
    updateCreditNote,
    deleteCreditNote,
  };
}
