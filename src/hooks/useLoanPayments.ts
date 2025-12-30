import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { LoanPayment } from "@/features/cash-bank/types";

// Database row type (snake_case columns from SQLite)
interface LoanPaymentRow {
  id: string;
  loan_id: string;
  date: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

interface LoanQueryRow {
  outstanding_amount: number;
}

interface PaymentQueryRow {
  loan_id: string;
  principal_amount: number;
}

function mapRowToLoanPayment(row: LoanPaymentRow): LoanPayment {
  return {
    id: row.id,
    loanId: row.loan_id,
    date: row.date,
    principalAmount: row.principal_amount,
    interestAmount: row.interest_amount,
    totalAmount: row.total_amount,
    paymentMethod: (row.payment_method ?? "cash") as "cash" | "bank" | "cheque",
    referenceNumber: row.reference_number ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export function useLoanPayments(filters?: { loanId?: string }): {
  payments: LoanPayment[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: string[] = [];

    if (filters?.loanId) {
      conditions.push("loan_id = ?");
      params.push(filters.loanId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM loan_payments ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [filters?.loanId]);

  const { data, isLoading, error } = useQuery<LoanPaymentRow>(query, params);

  const payments = useMemo(() => data.map(mapRowToLoanPayment), [data]);

  return { payments, isLoading, error };
}

interface LoanPaymentMutations {
  createPayment: (data: {
    loanId: string;
    date: string;
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
    paymentMethod?: string;
    referenceNumber?: string;
    notes?: string;
  }) => Promise<string>;
  deletePayment: (id: string) => Promise<void>;
}

export function useLoanPaymentMutations(): LoanPaymentMutations {
  const db = getPowerSyncDatabase();

  const createPayment = useCallback(
    async (data: {
      loanId: string;
      date: string;
      principalAmount: number;
      interestAmount: number;
      totalAmount: number;
      paymentMethod?: string;
      referenceNumber?: string;
      notes?: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO loan_payments (
          id, loan_id, date, principal_amount, interest_amount, total_amount,
          payment_method, reference_number, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.loanId,
          data.date,
          data.principalAmount,
          data.interestAmount,
          data.totalAmount,
          data.paymentMethod ?? null,
          data.referenceNumber ?? null,
          data.notes ?? null,
          now,
        ]
      );

      // Update loan outstanding amount and paid EMIs
      await db.execute(
        `UPDATE loans SET
          outstanding_amount = outstanding_amount - ?,
          paid_emis = paid_emis + 1,
          updated_at = ?
         WHERE id = ?`,
        [data.principalAmount, now, data.loanId]
      );

      // Check if loan is fully paid and update status
      const result = await db.execute(
        `SELECT outstanding_amount FROM loans WHERE id = ?`,
        [data.loanId]
      );
      const rows = (result.rows?._array ?? []) as LoanQueryRow[];
      const loan = rows[0];
      if (loan && loan.outstanding_amount <= 0) {
        await db.execute(
          `UPDATE loans SET status = 'closed', updated_at = ? WHERE id = ?`,
          [now, data.loanId]
        );
      }

      return id;
    },
    [db]
  );

  const deletePayment = useCallback(
    async (id: string): Promise<void> => {
      // Get payment details to reverse the loan update
      const result = await db.execute(
        `SELECT loan_id, principal_amount FROM loan_payments WHERE id = ?`,
        [id]
      );
      const rows = (result.rows?._array ?? []) as PaymentQueryRow[];
      const payment = rows[0];

      if (payment) {
        const now = new Date().toISOString();
        // Reverse the loan outstanding amount
        await db.execute(
          `UPDATE loans SET
            outstanding_amount = outstanding_amount + ?,
            paid_emis = MAX(0, paid_emis - 1),
            status = 'active',
            updated_at = ?
           WHERE id = ?`,
          [payment.principal_amount, now, payment.loan_id]
        );
      }

      await db.execute(`DELETE FROM loan_payments WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createPayment,
    deletePayment,
  };
}
