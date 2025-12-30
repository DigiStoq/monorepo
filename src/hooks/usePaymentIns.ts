import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { PaymentIn, PaymentInFormData, PaymentMode } from "@/features/sales/types";

// Database row type (snake_case columns from SQLite)
interface PaymentInRow {
  id: string;
  receipt_number: string;
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

function mapRowToPaymentIn(row: PaymentInRow): PaymentIn {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    amount: row.amount,
    paymentMode: row.payment_mode as PaymentMode,
    referenceNumber: row.reference_number ?? undefined,
    invoiceId: row.invoice_id ?? undefined,
    invoiceNumber: row.invoice_number ?? undefined,
    notes: row.notes ?? undefined,
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
}): { payments: PaymentIn[]; isLoading: boolean; error: Error | undefined } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: string[] = [];

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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM payment_ins ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [filters?.customerId, filters?.paymentMode, filters?.dateFrom, filters?.dateTo, filters?.search]);

  const { data, isLoading, error } = useQuery<PaymentInRow>(query, params);

  const payments = useMemo(() => data.map(mapRowToPaymentIn), [data]);

  return { payments, isLoading, error };
}

export function usePaymentInById(id: string | null): {
  payment: PaymentIn | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<PaymentInRow>(
    id ? `SELECT * FROM payment_ins WHERE id = ?` : `SELECT * FROM payment_ins WHERE 1 = 0`,
    id ? [id] : []
  );

  const payment = data[0] ? mapRowToPaymentIn(data[0]) : null;

  return { payment, isLoading, error };
}

// Internal type for creating a payment (includes receiptNumber, customerName, invoiceNumber)
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

interface PaymentInMutations {
  createPayment: (data: CreatePaymentData) => Promise<string>;
  deletePayment: (id: string) => Promise<void>;
}

export function usePaymentInMutations(): PaymentInMutations {
  const db = getPowerSyncDatabase();

  const createPayment = useCallback(
    async (data: CreatePaymentData): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO payment_ins (
          id, receipt_number, customer_id, customer_name, date, amount,
          payment_mode, reference_number, invoice_id, invoice_number, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.receiptNumber,
          data.customerId,
          data.customerName,
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
          `UPDATE sale_invoices
           SET amount_paid = amount_paid + ?,
               amount_due = amount_due - ?,
               status = CASE WHEN amount_due <= ? THEN 'paid' ELSE 'partial' END,
               updated_at = ?
           WHERE id = ?`,
          [data.amount, data.amount, data.amount, now, data.invoiceId]
        );
      }

      // Update customer balance
      await db.execute(
        `UPDATE customers
         SET current_balance = current_balance - ?, updated_at = ?
         WHERE id = ?`,
        [data.amount, now, data.customerId]
      );

      return id;
    },
    [db]
  );

  const deletePayment = useCallback(
    async (id: string): Promise<void> => {
      // Get payment details first
      const result = await db.execute(
        `SELECT customer_id, invoice_id, amount FROM payment_ins WHERE id = ?`,
        [id]
      );
      const rows = (result.rows?._array ?? []) as PaymentQueryRow[];
      const payment = rows[0];

      if (payment) {
        const now = new Date().toISOString();

        // Reverse customer balance
        await db.execute(
          `UPDATE customers
           SET current_balance = current_balance + ?, updated_at = ?
           WHERE id = ?`,
          [payment.amount, now, payment.customer_id]
        );

        // Reverse invoice payment if linked
        if (payment.invoice_id) {
          await db.execute(
            `UPDATE sale_invoices
             SET amount_paid = amount_paid - ?,
                 amount_due = amount_due + ?,
                 status = CASE WHEN amount_paid - ? <= 0 THEN 'sent' ELSE 'partial' END,
                 updated_at = ?
             WHERE id = ?`,
            [payment.amount, payment.amount, payment.amount, now, payment.invoice_id]
          );
        }
      }

      await db.execute(`DELETE FROM payment_ins WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createPayment,
    deletePayment,
  };
}

interface PaymentInStats {
  totalReceived: number;
  thisMonthReceived: number;
  todayReceived: number;
}

export function usePaymentInStats(): PaymentInStats {
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
