import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { PaymentInRecord } from "../lib/powersync";
import { useAuth } from "../contexts/AuthContext";

export type PaymentMode = "cash" | "bank" | "card" | "cheque" | "other";

export interface PaymentIn {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function mapRowToPaymentIn(row: PaymentInRecord): PaymentIn {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    amount: row.amount,
    paymentMode: row.payment_mode as PaymentMode,
    referenceNumber: row.reference_number || undefined,
    invoiceId: row.invoice_id || undefined,
    invoiceNumber: row.invoice_number || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function usePaymentIns(filters?: {
  customerId?: string;
  paymentMode?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): { payments: PaymentIn[]; isLoading: boolean; error: Error | null } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.customerId) {
      conditions.push("customer_id = ?");
      params.push(filters.customerId);
    }

    if (filters?.paymentMode) {
      conditions.push("payment_mode = ?");
      params.push(filters.paymentMode);
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
      conditions.push("(receipt_number LIKE ? OR customer_name LIKE ?)");
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM payment_ins ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [
    filters?.customerId,
    filters?.paymentMode,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<PaymentInRecord>(query, params);

  const payments = useMemo(() => (data || []).map(mapRowToPaymentIn), [data]);

  return { payments, isLoading, error: error };
}

export function usePaymentsByInvoiceId(invoiceId: string | null): {
  payments: PaymentIn[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery<PaymentInRecord>(
    invoiceId
      ? `SELECT * FROM payment_ins WHERE invoice_id = ? ORDER BY date DESC, created_at DESC`
      : `SELECT * FROM payment_ins WHERE 1 = 0`,
    invoiceId ? [invoiceId] : []
  );

  const payments = useMemo(() => (data || []).map(mapRowToPaymentIn), [data]);

  return { payments, isLoading, error: error };
}

export function usePaymentInById(id: string | null): {
  payment: PaymentIn | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery<PaymentInRecord>(
    id
      ? `SELECT * FROM payment_ins WHERE id = ?`
      : `SELECT * FROM payment_ins WHERE 1 = 0`,
    id ? [id] : []
  );

  const payment = data?.[0] ? mapRowToPaymentIn(data[0]) : null;

  return { payment, isLoading, error: error };
}

interface CreatePaymentData {
  receiptNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMode: string;
  referenceNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
}

export function usePaymentInMutations() {
  const db = getPowerSyncDatabase();
  const { user } = useAuth();

  const createPayment = useCallback(
    async (data: CreatePaymentData): Promise<string> => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();
      const userId = user?.id ?? null;
      const userName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO payment_ins (
            id, receipt_number, customer_id, customer_name, date, amount,
            payment_mode, reference_number, invoice_id, invoice_number, notes,
            created_at, updated_at, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.receiptNumber,
            data.customerId,
            data.customerName,
            data.date,
            data.amount,
            data.paymentMode,
            data.referenceNumber || null,
            data.invoiceId || null,
            data.invoiceNumber || null,
            data.notes || null,
            now,
            now,
            user?.id || null,
          ]
        );

        // Update invoice if linked
        if (data.invoiceId) {
          await tx.execute(
            `UPDATE sale_invoices
             SET amount_paid = amount_paid + ?,
                 amount_due = amount_due - ?,
                 status = CASE 
                    WHEN amount_due <= ? THEN 'paid' 
                    ELSE 'partial' 
                 END,
                 updated_at = ?
             WHERE id = ?`,
            [data.amount, data.amount, data.amount, now, data.invoiceId]
          );
        }

        // Update customer balance (deduct from balance because they paid)
        await tx.execute(
          `UPDATE customers
           SET current_balance = current_balance - ?, updated_at = ?
           WHERE id = ?`,
          [data.amount, now, data.customerId]
        );

        // Log History
        const historyId = Date.now().toString() + Math.random().toString(36).substring(7);
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "payment_in",
            "created",
            `Received payment ${data.receiptNumber}`,
            null,
            JSON.stringify({
              amount: data.amount,
              customer: data.customerName,
              invoice: data.invoiceNumber,
            }),
            userId,
            userName,
            now,
          ]
        );
      });

      return id;
    },
    [db, user]
  );

  const deletePayment = useCallback(
    async (id: string): Promise<void> => {
      const now = new Date().toISOString();
      const userId = user?.id ?? null;
      const userName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        // Get payment details first
        const result = await tx.execute(
          `SELECT customer_id, invoice_id, amount, receipt_number FROM payment_ins WHERE id = ?`,
          [id]
        );
        const payment = result.rows?.item(0);

        if (payment) {
          // Reverse customer balance (add back to balance)
          await tx.execute(
            `UPDATE customers
            SET current_balance = current_balance + ?, updated_at = ?
            WHERE id = ?`,
            [payment.amount, now, payment.customer_id]
          );

          // Reverse invoice payment if linked
          if (payment.invoice_id) {
            await tx.execute(
              `UPDATE sale_invoices
                SET amount_paid = amount_paid - ?,
                    amount_due = amount_due + ?,
                    status = CASE 
                      WHEN amount_paid - ? <= 0 AND status = 'draft' THEN 'draft' 
                      WHEN amount_paid - ? <= 0 THEN 'unpaid'
                      ELSE 'partial' 
                    END,
                    updated_at = ?
                WHERE id = ?`,
              [
                payment.amount,
                payment.amount,
                payment.amount,
                payment.amount,
                now,
                payment.invoice_id,
              ]
            );
          }

          // Log History
          const historyId = Date.now().toString() + Math.random().toString(36).substring(7);
          await tx.execute(
            `INSERT INTO invoice_history (
                id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              historyId,
              id,
              "payment_in",
              "deleted",
              `Deleted payment ${payment.receipt_number}`,
              JSON.stringify(payment),
              null,
              userId,
              userName,
              now,
            ]
          );
        }

        await tx.execute(`DELETE FROM payment_ins WHERE id = ?`, [id]);
      });
    },
    [db, user]
  );

  return { createPayment, deletePayment };
}

export function usePaymentInStats() {
  const { data: totalReceived } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount), 0) as sum FROM payment_ins`
  );

  const { data: thisMonthReceived } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount), 0) as sum FROM payment_ins
     WHERE date >= date('now', 'start of month')`
  );

  const { data: todayReceived } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount), 0) as sum FROM payment_ins
     WHERE date = date('now')`
  );

  return {
    totalReceived: totalReceived[0]?.sum ?? 0,
    thisMonthReceived: thisMonthReceived[0]?.sum ?? 0,
    todayReceived: todayReceived[0]?.sum ?? 0,
  };
}
