import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { PaymentOutRecord } from "../lib/powersync";
import { useAuth } from "../contexts/AuthContext";

export type PaymentOutMode = "cash" | "bank" | "cheque" | "other";

export interface PaymentOut {
  id: string;
  paymentNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMode: PaymentOutMode;
  referenceNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function mapRowToPaymentOut(row: PaymentOutRecord): PaymentOut {
  return {
    id: row.id,
    paymentNumber: row.payment_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    amount: row.amount,
    paymentMode: row.payment_mode as PaymentOutMode,
    referenceNumber: row.reference_number || undefined,
    invoiceId: row.invoice_id || undefined,
    invoiceNumber: row.invoice_number || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function usePaymentOuts(filters?: {
  supplierId?: string;
  paymentMode?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): { payments: PaymentOut[]; isLoading: boolean; error: Error | null } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.supplierId) {
      conditions.push("customer_id = ?");
      params.push(filters.supplierId);
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
      conditions.push("(payment_number LIKE ? OR customer_name LIKE ?)");
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM payment_outs ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [
    filters?.supplierId,
    filters?.paymentMode,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<PaymentOutRecord>(query, params);

  const payments = useMemo(() => (data || []).map(mapRowToPaymentOut), [data]);

  return { payments, isLoading, error: error };
}

export function usePaymentOutMutations() {
  const db = getPowerSyncDatabase();
  const { user } = useAuth();

  const createPayment = useCallback(
    async (data: {
      paymentNumber: string;
      supplierId: string;
      supplierName: string;
      date: string;
      amount: number;
      paymentMode: string;
      referenceNumber?: string;
      invoiceId?: string;
      invoiceNumber?: string;
      notes?: string;
    }): Promise<string> => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();
      const userId = user?.id ?? null;
      const userName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO payment_outs (
            id, payment_number, customer_id, customer_name, date, amount,
            payment_mode, reference_number, invoice_id, invoice_number, notes,
            created_at, updated_at, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.paymentNumber,
            data.supplierId,
            data.supplierName,
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

        if (data.invoiceId) {
          await tx.execute(
            `UPDATE purchase_invoices
             SET amount_paid = amount_paid + ?,
                 amount_due = amount_due - ?,
                 status = CASE
                   WHEN amount_due <= ? THEN 'paid'
                   ELSE status
                 END,
                 updated_at = ?
             WHERE id = ?`,
            [data.amount, data.amount, data.amount, now, data.invoiceId]
          );
        }

        await tx.execute(
          `UPDATE customers
           SET current_balance = current_balance + ?, updated_at = ?
           WHERE id = ?`,
          [data.amount, now, data.supplierId]
        );

        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            Date.now().toString() + Math.random().toString(36).substring(7),
            id,
            "payment_out",
            "created",
            `Made payment ${data.paymentNumber}`,
            null,
            JSON.stringify({
              amount: data.amount,
              supplier: data.supplierName,
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
        // Get payment details
        const result = await tx.execute(
          `SELECT customer_id, invoice_id, amount, payment_number FROM payment_outs WHERE id = ?`,
          [id]
        );
        const payment = result.rows?.item(0);

        if (payment) {
          // Reverse customer (supplier) balance
          // Payment Out added to calculate balance (reducing debt), so deleting it subtracts (increases debt)
          await tx.execute(
            `UPDATE customers
             SET current_balance = current_balance - ?, updated_at = ?
             WHERE id = ?`,
            [payment.amount, now, payment.customer_id]
          );

          // Reverse invoice payment if linked
          if (payment.invoice_id) {
            await tx.execute(
              `UPDATE purchase_invoices
               SET amount_paid = amount_paid - ?,
                   amount_due = amount_due + ?,
                   status = CASE 
                     WHEN amount_paid - ? <= 0 AND status != 'cancelled' THEN 'received' -- Revert to received/ordered? Maybe just check due
                     ELSE 'partial'
                   END,
                   updated_at = ?
               WHERE id = ?`,
              [
                payment.amount,
                payment.amount,
                payment.amount,
                now,
                payment.invoice_id,
              ]
            );
            // Fix status logic: If Due > 0, it's not 'paid'. If it was 'paid', it might become 'partial' or 'received'.
            // Simple approach: reset calculated status based on amounts if possible, but SQL CASE is limited.
            // Better: If amount_due > 0, status is 'partial' (or 'received' if paid == 0).
            // Let's refine status update:
            // IF (amount_paid - payment.amount) <= 0 THEN 'received' (assuming it was received before paying)
            // ELSE 'partial'.
             await tx.execute(
                `UPDATE purchase_invoices
                 SET status = CASE
                    WHEN (amount_paid - ?) <= 0.01 THEN 'received' -- Floating point tol
                    WHEN (amount_due + ?) > 0 THEN 'partial'
                    ELSE status
                 END
                 WHERE id = ? AND status = 'paid'`,
                 [payment.amount, payment.amount, payment.invoice_id]
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
              "payment_out",
              "deleted",
              `Deleted payment ${payment.payment_number}`,
              JSON.stringify(payment),
              null,
              userId,
              userName,
              now,
            ]
          );
        }

        await tx.execute(`DELETE FROM payment_outs WHERE id = ?`, [id]);
      });
    },
    [db, user]
  );

  return { createPayment, deletePayment };
}
