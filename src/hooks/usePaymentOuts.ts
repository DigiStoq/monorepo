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
  cheque_number?: string | null;
  cheque_date?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  card_number?: string | null;
  created_at: string;
  updated_at: string;
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
    chequeNumber: row.cheque_number ?? undefined,
    chequeDate: row.cheque_date ?? undefined,
    bankName: row.bank_name ?? undefined,
    bankAccountNumber: row.bank_account_number ?? undefined,
    cardNumber: row.card_number ?? undefined,
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

/**
 * Fetch all payments linked to a specific purchase invoice.
 * Used to display payment history on the purchase invoice detail page.
 */
export function usePaymentOutsByInvoiceId(invoiceId: string | null): {
  payments: PaymentOut[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<PaymentOutRow>(
    invoiceId
      ? `SELECT * FROM payment_outs WHERE invoice_id = ? ORDER BY date DESC, created_at DESC`
      : `SELECT * FROM payment_outs WHERE 1 = 0`,
    invoiceId ? [invoiceId] : []
  );

  const payments = useMemo(() => data.map(mapRowToPaymentOut), [data]);

  return { payments, isLoading, error };
}

import { useAuthStore } from "@/stores/auth-store";

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
    // Payment Details
    chequeNumber?: string;
    chequeDate?: string;
    bankName?: string;
    bankAccountNumber?: string;
    cardNumber?: string;
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
      // Payment Details
      chequeNumber?: string;
      chequeDate?: string;
      bankName?: string;
      bankAccountNumber?: string;
      cardNumber?: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO payment_outs (
            id, payment_number, customer_id, customer_name, date, amount,
            payment_mode, reference_number, invoice_id, invoice_number, notes,
            cheque_number, cheque_date, bank_name, bank_account_number, card_number,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        if (data.invoiceId) {
          await tx.execute(
            `UPDATE purchase_invoices
             SET amount_paid = amount_paid + ?,
                 amount_due = amount_due - ?,
                 status = CASE
                   WHEN amount_due <= ? THEN 'paid'
                   WHEN amount_paid + ? > 0 THEN 'partial'
                   WHEN status = 'draft' THEN 'ordered'
                   ELSE status
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

        // Update supplier balance (reduce payable)
        await tx.execute(
          `UPDATE customers
           SET current_balance = current_balance + ?, updated_at = ?
           WHERE id = ?`,
          [data.amount, now, data.supplierId]
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
            "payment_out",
            "created",
            `Made payment ${data.paymentNumber}`,
            null,
            JSON.stringify({
              amount: data.amount,
              supplier: data.supplierName,
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
        const result = await tx.execute(
          `SELECT customer_id, invoice_id, amount, payment_number FROM payment_outs WHERE id = ?`,
          [id]
        );
        const payment = result.rows?.item(0);

        if (payment) {
          // Reverse supplier balance
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
                        WHEN amount_paid - ? <= 0 THEN 'received' 
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
              "payment_out",
              "deleted",
              `Deleted payment ${payment.payment_number}`,
              JSON.stringify(payment),
              null,
              user?.id ?? null,
              userName,
              now,
            ]
          );
        }

        await tx.execute(`DELETE FROM payment_outs WHERE id = ?`, [id]);
      });
    },
    [db]
  );

  return {
    createPayment,
    deletePayment,
  };
}
