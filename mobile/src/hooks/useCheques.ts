import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { ChequeRecord } from "../lib/powersync";

export interface Cheque {
  id: string;
  type: "received" | "issued";
  customerId?: string;
  customerName?: string; // Cache
  bankName: string;
  chequeNumber: string;
  amount: number;
  date: string; // Issue Date
  dueDate?: string; // Clearance/Cheque Date
  status: "pending" | "cleared" | "bounced" | "cancelled";
  notes?: string;
  createdAt: string;
}

function mapRowToCheque(row: ChequeRecord): Cheque {
  return {
    id: row.id,
    type: row.type as "received" | "issued",
    customerId: row.customer_id || undefined,
    customerName: row.customer_name || undefined,
    bankName: row.bank_name,
    chequeNumber: row.cheque_number,
    amount: row.amount,
    date: row.date,
    dueDate: row.due_date || undefined,
    status: row.status as "pending" | "cleared" | "bounced" | "cancelled",
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

export function useCheques(filters?: {
  type?: "received" | "issued";
  status?: "pending" | "cleared" | "bounced" | "cancelled";
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}): { cheques: Cheque[]; isLoading: boolean; error: Error | null } {
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
      conditions.push("date >= ?");
      params.push(filters.dateFrom);
    }
    if (filters?.dateTo) {
      conditions.push("date <= ?");
      params.push(filters.dateTo);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM cheques ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [
    filters?.type,
    filters?.status,
    filters?.customerId,
    filters?.dateFrom,
    filters?.dateTo,
  ]);

  const { data, isLoading, error } = useQuery<ChequeRecord>(query, params);

  const cheques = useMemo(() => (data || []).map(mapRowToCheque), [data]);

  return { cheques, isLoading, error: error };
}

export function useChequeById(id: string | null): {
  cheque: Cheque | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery<ChequeRecord>(
    id ? `SELECT * FROM cheques WHERE id = ?` : `SELECT * FROM cheques WHERE 1 = 0`,
    id ? [id] : []
  );

  const cheque = data?.[0] ? mapRowToCheque(data[0]) : null;

  return { cheque, isLoading, error: error };
}

interface ChequeMutations {
  createCheque: (data: {
    type: "received" | "issued";
    customerId?: string;
    customerName?: string;
    bankName: string;
    chequeNumber: string;
    amount: number;
    date: string;
    dueDate?: string;
    notes?: string;
    status?: "pending" | "cleared" | "bounced" | "cancelled";
  }) => Promise<string>;
  updateCheque: (
    id: string,
    data: {
      type: "received" | "issued";
      customerId?: string;
      customerName?: string;
      bankName: string;
      chequeNumber: string;
      amount: number;
      date: string;
      dueDate?: string;
      notes?: string;
      status?: "pending" | "cleared" | "bounced" | "cancelled";
    }
  ) => Promise<void>;
  updateChequeStatus: (
    id: string,
    status: "pending" | "cleared" | "bounced" | "cancelled"
  ) => Promise<void>;
  deleteCheque: (id: string) => Promise<void>;
}

export function useChequeMutations(): ChequeMutations {
  const db = getPowerSyncDatabase();

  const createCheque = useCallback(
    async (data: {
      type: "received" | "issued";
      customerId?: string;
      customerName?: string;
      bankName: string;
      chequeNumber: string;
      amount: number;
      date: string;
      dueDate?: string;
      notes?: string;
      status?: "pending" | "cleared" | "bounced" | "cancelled";
    }) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO cheques (
            id, type, customer_id, customer_name, bank_name, cheque_number, 
            amount, date, due_date, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.type,
          data.customerId || null,
          data.customerName || null,
          data.bankName,
          data.chequeNumber,
          data.amount,
          data.date,
          data.dueDate || null,
          data.status || "pending",
          data.notes || null,
          now,
          now,
        ]
      );
      return id;
    },
    [db]
  );

  const updateCheque = useCallback(
    async (
      id: string,
      data: {
        type: "received" | "issued";
        customerId?: string;
        customerName?: string;
        bankName: string;
        chequeNumber: string;
        amount: number;
        date: string;
        dueDate?: string;
        notes?: string;
        status?: "pending" | "cleared" | "bounced" | "cancelled";
      }
    ) => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE cheques SET
            type = ?, customer_id = ?, customer_name = ?, bank_name = ?, cheque_number = ?,
            amount = ?, date = ?, due_date = ?, status = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
        [
          data.type,
          data.customerId || null,
          data.customerName || null,
          data.bankName,
          data.chequeNumber,
          data.amount,
          data.date,
          data.dueDate || null,
          data.status || "pending",
          data.notes || null,
          now,
          id,
        ]
      );
    },
    [db]
  );

  const updateChequeStatus = useCallback(
    async (
      id: string,
      status: "pending" | "cleared" | "bounced" | "cancelled"
    ) => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE cheques SET status = ?, updated_at = ? WHERE id = ?`,
        [status, now, id]
      );
    },
    [db]
  );

  const deleteCheque = useCallback(async (id: string) => {
    await db.execute(`DELETE FROM cheques WHERE id = ?`, [id]);
  }, [db]);

  return { createCheque, updateCheque, updateChequeStatus, deleteCheque };
}
