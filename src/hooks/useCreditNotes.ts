import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { CreditNote, CreditNoteItem } from "@/features/sales/types";

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

interface CreditNoteItemRow {
  id: string;
  credit_note_id: string;
  item_id: string | null;
  item_name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  tax_percent: number;
  amount: number;
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
    reason: row.reason,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    total: row.total,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToCreditNoteItem(row: CreditNoteItemRow): CreditNoteItem {
  return {
    id: row.id,
    creditNoteId: row.credit_note_id,
    itemId: row.item_id ?? undefined,
    itemName: row.item_name,
    description: row.description ?? undefined,
    quantity: row.quantity,
    unit: row.unit ?? undefined,
    unitPrice: row.unit_price,
    taxPercent: row.tax_percent,
    amount: row.amount,
  };
}

export function useCreditNotes(filters?: {
  customerId?: string;
  reason?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): { creditNotes: CreditNote[]; isLoading: boolean; error: Error | undefined } {
  const params = useMemo(() => {
    const customerFilter = filters?.customerId ?? null;
    const reasonFilter = filters?.reason ?? null;
    const dateFromFilter = filters?.dateFrom ?? null;
    const dateToFilter = filters?.dateTo ?? null;
    const searchFilter = filters?.search ? `%${filters.search}%` : null;
    return [customerFilter, reasonFilter, dateFromFilter, dateToFilter, searchFilter];
  }, [filters?.customerId, filters?.reason, filters?.dateFrom, filters?.dateTo, filters?.search]);

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

export function useCreditNoteById(id: string | null): {
  creditNote: CreditNote | null;
  items: CreditNoteItem[];
  isLoading: boolean;
} {
  const { data: noteData, isLoading: noteLoading } = useQuery<CreditNoteRow>(
    id ? `SELECT * FROM credit_notes WHERE id = ?` : `SELECT * FROM credit_notes WHERE 1 = 0`,
    id ? [id] : []
  );

  const { data: itemsData, isLoading: itemsLoading } = useQuery<CreditNoteItemRow>(
    id
      ? `SELECT * FROM credit_note_items WHERE credit_note_id = ?`
      : `SELECT * FROM credit_note_items WHERE 1 = 0`,
    id ? [id] : []
  );

  const creditNote = noteData[0] ? mapRowToCreditNote(noteData[0]) : null;
  const items = itemsData.map(mapRowToCreditNoteItem);

  return {
    creditNote,
    items,
    isLoading: noteLoading || itemsLoading,
  };
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
  deleteCreditNote: (id: string) => Promise<void>;
}

interface CreditNoteQueryRow {
  customer_id: string;
  total: number;
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

      const subtotal = items.reduce((sum: number, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum: number, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount;

      await db.execute(
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
        await db.execute(
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
      await db.execute(
        `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
        [total, now, data.customerId]
      );

      return id;
    },
    [db]
  );

  const deleteCreditNote = useCallback(
    async (id: string): Promise<void> => {
      const result = await db.execute(
        `SELECT customer_id, total FROM credit_notes WHERE id = ?`,
        [id]
      );
      const rows = result.rows._array as CreditNoteQueryRow[];
      const note = rows[0];

      if (note) {
        const now = new Date().toISOString();
        await db.execute(
          `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
          [note.total, now, note.customer_id]
        );
      }

      await db.execute(`DELETE FROM credit_note_items WHERE credit_note_id = ?`, [id]);
      await db.execute(`DELETE FROM credit_notes WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createCreditNote,
    deleteCreditNote,
  };
}
