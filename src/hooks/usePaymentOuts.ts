import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { PaymentOut, PaymentOutMode } from "@/features/purchases/types";

// Database row type (snake_case columns from SQLite)
interface PaymentOutRow {
  id: string;
  payment_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  amount: number;
  payment_mode: string;
  reference_number: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentQueryRow {
  customer_id: string;
  invoice_id: string | null;
  amount: number;
}

function mapRowToPaymentOut(row: PaymentOutRow): PaymentOut {
  return {
    id: row.id,
    paymentNumber: row.payment_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    amount: row.amount,
    paymentMode: row.payment_mode as PaymentOutMode,
    referenceNumber: row.reference_number ?? undefined,
    invoiceId: row.invoice_id ?? undefined,
    invoiceNumber: row.invoice_number ?? undefined,
    notes: row.notes ?? undefined,
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
}): { payments: PaymentOut[]; isLoading: boolean; error: Error | undefined } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: string[] = [];

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

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
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

  const { data, isLoading, error } = useQuery<PaymentOutRow>(query, params);

  const payments = useMemo(() => data.map(mapRowToPaymentOut), [data]);

  return { payments, isLoading, error };
}

export function usePaymentOutById(id: string | null): {
  payment: PaymentOut | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<PaymentOutRow>(
    id
      ? `SELECT * FROM payment_outs WHERE id = ?`
      : `SELECT * FROM payment_outs WHERE 1 = 0`,
    id ? [id] : []
  );

  const payment = data[0] ? mapRowToPaymentOut(data[0]) : null;

  return { payment, isLoading, error };
}

interface PaymentOutMutations {
  createPayment: (data: {
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
  }) => Promise<string>;
  deletePayment: (id: string) => Promise<void>;
}

export function usePaymentOutMutations(): PaymentOutMutations {
  const db = getPowerSyncDatabase();

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
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO payment_outs (
          id, payment_number, customer_id, customer_name, date, amount,
          payment_mode, reference_number, invoice_id, invoice_number, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.paymentNumber,
          data.supplierId,
          data.supplierName,
          data.date,
          data.amount,
          data.paymentMode,
          data.referenceNumber ?? null,
          data.invoiceId ?? null,
          data.invoiceNumber ?? null,
          data.notes ?? null,
          now,
          now,
        ]
      );

      // Update invoice if linked
      if (data.invoiceId) {
        await db.execute(
          `UPDATE purchase_invoices
           SET amount_paid = amount_paid + ?,
               amount_due = amount_due - ?,
               status = CASE WHEN amount_due <= ? THEN 'paid' ELSE status END,
               updated_at = ?
           WHERE id = ?`,
          [data.amount, data.amount, data.amount, now, data.invoiceId]
        );
      }

      // Update supplier balance (reduce payable)
      await db.execute(
        `UPDATE customers
         SET current_balance = current_balance + ?, updated_at = ?
         WHERE id = ?`,
        [data.amount, now, data.supplierId]
      );

      return id;
    },
    [db]
  );

  const deletePayment = useCallback(
    async (id: string): Promise<void> => {
      const result = await db.execute(
        `SELECT customer_id, invoice_id, amount FROM payment_outs WHERE id = ?`,
        [id]
      );
      const rows = (result.rows?._array ?? []) as PaymentQueryRow[];

      if (rows.length > 0) {
        const payment = rows[0];
        const now = new Date().toISOString();

        // Reverse supplier balance
        await db.execute(
          `UPDATE customers
           SET current_balance = current_balance - ?, updated_at = ?
           WHERE id = ?`,
          [payment.amount, now, payment.customer_id]
        );

        // Reverse invoice payment if linked
        if (payment.invoice_id) {
          await db.execute(
            `UPDATE purchase_invoices
             SET amount_paid = amount_paid - ?,
                 amount_due = amount_due + ?,
                 status = CASE WHEN amount_paid - ? <= 0 THEN 'received' ELSE status END,
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
        }
      }

      await db.execute(`DELETE FROM payment_outs WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createPayment,
    deletePayment,
  };
}

interface PaymentOutStats {
  totalPaid: number;
  thisMonthPaid: number;
  todayPaid: number;
}

export function usePaymentOutStats(): PaymentOutStats {
  const { data: totalPaid } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount), 0) as sum FROM payment_outs`
  );

  const { data: thisMonthPaid } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount), 0) as sum FROM payment_outs
     WHERE date >= date('now', 'start of month')`
  );

  const { data: todayPaid } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount), 0) as sum FROM payment_outs
     WHERE date = date('now')`
  );

  return {
    totalPaid: totalPaid[0]?.sum ?? 0,
    thisMonthPaid: thisMonthPaid[0]?.sum ?? 0,
    todayPaid: todayPaid[0]?.sum ?? 0,
  };
}
