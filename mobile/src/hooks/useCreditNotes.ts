import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { CreditNoteRecord, CreditNoteItemRecord } from "../lib/powersync";
import { useAuth } from "../contexts/AuthContext";

export type CreditNoteReason = "return" | "discount" | "correction" | "other";

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  invoiceId?: string;
  invoiceNumber?: string;
  reason: CreditNoteReason;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: CreditNoteItem[];
}

export interface CreditNoteItem {
  id: string;
  creditNoteId: string;
  itemId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxPercent: number;
  amount: number;
}

function mapRowToCreditNote(row: CreditNoteRecord): CreditNote {
  return {
    id: row.id,
    creditNoteNumber: row.credit_note_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    invoiceId: row.invoice_id || undefined,
    invoiceNumber: row.invoice_number || undefined,
    reason: row.reason as CreditNoteReason,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    total: row.total,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToCreditNoteItem(row: CreditNoteItemRecord): CreditNoteItem {
  return {
    id: row.id,
    creditNoteId: row.credit_note_id,
    itemId: row.item_id || undefined,
    itemName: row.item_name,
    description: row.description || undefined,
    quantity: row.quantity,
    unit: row.unit || undefined,
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
}): { creditNotes: CreditNote[]; isLoading: boolean; error: Error | null } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.customerId) {
      conditions.push("customer_id = ?");
      params.push(filters.customerId);
    }

    if (filters?.reason) {
      conditions.push("reason = ?");
      params.push(filters.reason);
    }

    if (filters?.dateFrom) {
      conditions.push("date >= ?");
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      conditions.push("date <= ?");
      params.push(filters.dateTo);
    }

    if (filters?.search) {
      conditions.push("(credit_note_number LIKE ? OR customer_name LIKE ?)");
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM credit_notes ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [
    filters?.customerId,
    filters?.reason,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<CreditNoteRecord>(query, params);

  const creditNotes = useMemo(() => (data || []).map(mapRowToCreditNote), [data]);

  return { creditNotes, isLoading, error: error };
}

export function useCreditNoteById(id: string | null): {
  creditNote: CreditNote | null;
  items: CreditNoteItem[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: noteData, isLoading: noteLoading, error: noteError } = useQuery<CreditNoteRecord>(
    id ? `SELECT * FROM credit_notes WHERE id = ?` : `SELECT * FROM credit_notes WHERE 1 = 0`,
    id ? [id] : []
  );

  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useQuery<CreditNoteItemRecord>(
    id ? `SELECT * FROM credit_note_items WHERE credit_note_id = ?` : `SELECT * FROM credit_note_items WHERE 1 = 0`,
    id ? [id] : []
  );

  const creditNote = noteData?.[0] ? mapRowToCreditNote(noteData[0]) : null;
  const items = useMemo(() => (itemsData || []).map(mapRowToCreditNoteItem), [itemsData]);

  return {
    creditNote,
    items,
    isLoading: noteLoading || itemsLoading,
    error: (noteError || itemsError),
  };
}

export function useCreditNoteMutations() {
  const db = getPowerSyncDatabase();
  const { user } = useAuth();

  const addHistoryEntry = useCallback(
    async (
      entry: {
        invoiceId: string;
        action: string;
        description: string;
        oldValues?: Record<string, unknown>;
        newValues?: Record<string, unknown>;
      },
      tx?: any
    ) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();
      const userId = user?.id ?? null;
      const userName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Unknown User";

      const executor = tx ?? db;
      await executor.execute(
        `INSERT INTO invoice_history (
          id, invoice_id, invoice_type, action, description,
          old_values, new_values, user_id, user_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          entry.invoiceId,
          "credit_note",
          entry.action,
          entry.description,
          entry.oldValues ? JSON.stringify(entry.oldValues) : null,
          entry.newValues ? JSON.stringify(entry.newValues) : null,
          userId,
          userName,
          now,
        ]
      );
    },
    [db, user]
  );

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
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount;

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO credit_notes (
            id, credit_note_number, customer_id, customer_name, date,
            invoice_id, invoice_number, reason, subtotal, tax_amount, total, notes,
            created_at, updated_at, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.creditNoteNumber,
            data.customerId,
            data.customerName,
            data.date,
            data.invoiceId || null,
            data.invoiceNumber || null,
            data.reason,
            subtotal,
            taxAmount,
            total,
            data.notes || null,
            now,
            now,
            user?.id || null,
          ]
        );

        for (const item of items) {
          const itemId = Date.now().toString() + Math.random().toString(36).substring(7);
          await tx.execute(
            `INSERT INTO credit_note_items (
              id, credit_note_id, item_id, item_name, description, quantity, unit,
              unit_price, tax_percent, amount, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              id,
              item.itemId || null,
              item.itemName,
              item.description || null,
              item.quantity,
              item.unit || null,
              item.unitPrice,
              item.taxPercent || 0,
              item.amount,
              user?.id || null,
            ]
          );
        }

        await tx.execute(
          `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
          [total, now, data.customerId]
        );

        await addHistoryEntry(
          {
            invoiceId: id,
            action: "created",
            description: `Credit Note ${data.creditNoteNumber} created`,
          },
          tx
        );
      });

      return id;
    },
    [db, addHistoryEntry]
  );

  return { createCreditNote };
}
