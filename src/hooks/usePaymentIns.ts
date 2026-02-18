import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import { useAuthStore } from "@/stores/auth-store";
import type { PaymentIn, PaymentMode } from "@/features/sales/types";

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
  cheque_number?: string | null;
  cheque_date?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  card_number?: string | null;
  created_at: string;
  updated_at: string;
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
    chequeNumber: row.cheque_number ?? undefined,
    chequeDate: row.cheque_date ?? undefined,
    bankName: row.bank_name ?? undefined,
    bankAccountNumber: row.bank_account_number ?? undefined,
    cardNumber: row.card_number ?? undefined,
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

  const { data, isLoading, error } = useQuery<PaymentInRow>(query, params);

  const payments = useMemo(() => data.map(mapRowToPaymentIn), [data]);

  return { payments, isLoading, error };
}

/**
 * Fetch all payments linked to a specific invoice.
 * Used to display payment history on the invoice detail page.
 */
export function usePaymentsByInvoiceId(invoiceId: string | null): {
  payments: PaymentIn[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<PaymentInRow>(
    invoiceId
      ? `SELECT * FROM payment_ins WHERE invoice_id = ? ORDER BY date DESC, created_at DESC`
      : `SELECT * FROM payment_ins WHERE 1 = 0`,
    invoiceId ? [invoiceId] : []
  );

  const payments = useMemo(() => data.map(mapRowToPaymentIn), [data]);

  return { payments, isLoading, error };
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
  // Payment Details
  chequeNumber?: string;
  chequeDate?: string;
  bankName?: string;
  bankAccountNumber?: string;
  cardNumber?: string;
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
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO payment_ins (
            id, receipt_number, customer_id, customer_name, date, amount,
            payment_mode, reference_number, invoice_id, invoice_number, notes,
            cheque_number, cheque_date, bank_name, bank_account_number, card_number,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            data.chequeNumber ?? null,
            data.chequeDate ?? null,
            data.bankName ?? null,
            data.bankAccountNumber ?? null,
            data.cardNumber ?? null,
            now,
            now,
          ]
        );

        // Update invoice if linked
        // Update invoice if linked
        if (data.invoiceId) {
          await tx.execute(
            `UPDATE sale_invoices
             SET amount_paid = amount_paid + ?,
                 amount_due = amount_due - ?,
                 status = CASE 
                    WHEN amount_due <= ? THEN 'paid' 
                    WHEN amount_paid + ? > 0 THEN 'partial'
                    ELSE 'unpaid' 
                 END,
                 updated_at = ?
             WHERE id = ?`,
            [
              data.amount,
              data.amount,
              data.amount,
              data.amount,
              now,
              data.invoiceId,
            ]
          );
        }

        // Update customer balance
        await tx.execute(
          `UPDATE customers
           SET current_balance = current_balance - ?, updated_at = ?
           WHERE id = ?`,
          [data.amount, now, data.customerId]
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
            "payment_in",
            "created",
            `Received payment ${data.receiptNumber}`,
            null,
            JSON.stringify({
              amount: data.amount,
              customer: data.customerName,
              invoice: data.invoiceNumber,
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

  const deletePayment = useCallback(
    async (id: string): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        // Get payment details first
        const result = await tx.execute(
          `SELECT customer_id, invoice_id, amount, receipt_number FROM payment_ins WHERE id = ?`,
          [id]
        );
        const payment = result.rows?.item(0);

        if (payment) {
          // Reverse customer balance
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
          const historyId = crypto.randomUUID();
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
              user?.id ?? null,
              userName,
              now,
            ]
          );
        }

        await tx.execute(`DELETE FROM payment_ins WHERE id = ?`, [id]);
      });
    },
    [db]
  );

  return {
    createPayment,
    deletePayment,
  };
}
