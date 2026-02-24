import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import { useAuthStore } from "@/stores/auth-store";
import type {
  Cheque,
  ChequeType,
  ChequeStatus,
} from "@/features/cash-bank/types";

// Database row type (snake_case columns from SQLite)
interface ChequeRow {
  id: string;
  cheque_number: string;
  type: ChequeType;
  customer_id: string;
  customer_name: string;
  bank_name: string;
  date: string;
  due_date: string;
  amount: number;
  status: ChequeStatus;
  related_invoice_id: string | null;
  related_invoice_number: string | null;
  notes: string | null;
  cleared_date: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToCheque(row: ChequeRow): Cheque {
  return {
    id: row.id,
    chequeNumber: row.cheque_number,
    type: row.type,
    customerId: row.customer_id,
    customerName: row.customer_name,
    bankName: row.bank_name,
    date: row.date,
    dueDate: row.due_date,
    amount: row.amount,
    status: row.status,
    relatedInvoiceId: row.related_invoice_id ?? undefined,
    relatedInvoiceNumber: row.related_invoice_number ?? undefined,
    notes: row.notes ?? undefined,
    clearedDate: row.cleared_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useCheques(filters?: {
  type?: "received" | "issued";
  status?: "pending" | "cleared" | "bounced" | "cancelled";
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}): { cheques: Cheque[]; isLoading: boolean; error: Error | undefined } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.type) {
      conditions.push("type = ?");
      params.push(filters.type);
    }

    if (filters?.status) {
      conditions.push("status = ?");
      params.push(filters.status);
    }

    if (filters?.customerId) {
      conditions.push("customer_id = ?");
      params.push(filters.customerId);
    }

    if (filters?.dateFrom) {
      conditions.push("due_date >= ?");
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      conditions.push("due_date <= ?");
      params.push(filters.dateTo);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM cheques ${whereClause} ORDER BY due_date ASC`,
      params,
    };
  }, [
    filters?.type,
    filters?.status,
    filters?.customerId,
    filters?.dateFrom,
    filters?.dateTo,
  ]);

  const { data, isLoading, error } = useQuery<ChequeRow>(query, params);

  const cheques = useMemo(() => data.map(mapRowToCheque), [data]);

  return { cheques, isLoading, error };
}

interface ChequeMutations {
  createCheque: (data: {
    chequeNumber: string;
    type: "received" | "issued";
    customerId: string;
    customerName: string;
    bankName?: string;
    date: string;
    dueDate: string;
    amount: number;
    relatedInvoiceId?: string;
    relatedInvoiceNumber?: string;
    notes?: string;
  }) => Promise<string>;
  updateChequeStatus: (
    id: string,
    status: "pending" | "cleared" | "bounced" | "cancelled",
    clearedDate?: string
  ) => Promise<void>;
  deleteCheque: (id: string) => Promise<void>;
}

export function useChequeMutations(): ChequeMutations {
  const db = getPowerSyncDatabase();

  const createCheque = useCallback(
    async (data: {
      chequeNumber: string;
      type: "received" | "issued";
      customerId: string;
      customerName: string;
      bankName?: string;
      date: string;
      dueDate: string;
      amount: number;
      relatedInvoiceId?: string;
      relatedInvoiceNumber?: string;
      notes?: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const user = useAuthStore.getState().user;

      await db.execute(
        `INSERT INTO cheques (
          id, cheque_number, type, customer_id, customer_name, bank_name,
          date, due_date, amount, status, related_invoice_id, related_invoice_number,
          notes, created_at, updated_at, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.chequeNumber,
          data.type,
          data.customerId,
          data.customerName,
          data.bankName ?? null,
          data.date,
          data.dueDate,
          data.amount,
          "pending",
          data.relatedInvoiceId ?? null,
          data.relatedInvoiceNumber ?? null,
          data.notes ?? null,
          now,
          now,
          user?.id ?? null,
        ]
      );

      return id;
    },
    [db]
  );

  const updateChequeStatus = useCallback(
    async (
      id: string,
      status: "pending" | "cleared" | "bounced" | "cancelled",
      clearedDate?: string
    ): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE cheques SET status = ?, cleared_date = ?, updated_at = ? WHERE id = ?`,
        [status, clearedDate ?? null, now, id]
      );
    },
    [db]
  );

  const deleteCheque = useCallback(
    async (id: string): Promise<void> => {
      await db.execute(`DELETE FROM cheques WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createCheque,
    updateChequeStatus,
    deleteCheque,
  };
}
