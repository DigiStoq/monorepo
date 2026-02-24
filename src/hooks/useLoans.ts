import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import { useAuthStore } from "@/stores/auth-store";
import type { Loan } from "@/features/cash-bank/types";

// Database row types (snake_case columns from SQLite)
interface LoanRow {
  id: string;
  name: string;
  type: "taken" | "given";
  customer_id: string | null;
  customer_name: string | null;
  lender_name: string | null;
  principal_amount: number;
  outstanding_amount: number;
  interest_rate: number;
  interest_type: "simple" | "compound";
  start_date: string;
  end_date: string | null;
  emi_amount: number | null;
  emi_day: number | null;
  total_emis: number | null;
  paid_emis: number;
  status: "active" | "closed" | "defaulted";
  notes: string | null;
  linked_bank_account_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToLoan(row: LoanRow): Loan {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    customerId: row.customer_id ?? undefined,
    customerName: row.customer_name ?? undefined,
    lenderName: row.lender_name ?? undefined,
    principalAmount: row.principal_amount,
    outstandingAmount: row.outstanding_amount,
    interestRate: row.interest_rate,
    interestType: row.interest_type,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    emiAmount: row.emi_amount ?? undefined,
    emiDay: row.emi_day ?? undefined,
    totalEmis: row.total_emis ?? undefined,
    paidEmis: row.paid_emis,
    status: row.status,
    notes: row.notes ?? undefined,
    linkedBankAccountId: row.linked_bank_account_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useLoans(filters?: {
  type?: "taken" | "given";
  status?: "active" | "closed" | "defaulted";
  customerId?: string;
}): { loans: Loan[]; isLoading: boolean; error: Error | undefined } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: string[] = [];

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

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM loans ${whereClause} ORDER BY start_date DESC`,
      params,
    };
  }, [filters?.type, filters?.status, filters?.customerId]);

  const { data, isLoading, error } = useQuery<LoanRow>(query, params);

  const loans = useMemo(() => data.map(mapRowToLoan), [data]);

  return { loans, isLoading, error };
}

interface LoanMutations {
  createLoan: (data: {
    name: string;
    type: "taken" | "given";
    customerId?: string;
    customerName?: string;
    lenderName?: string;
    principalAmount: number;
    interestRate?: number;
    interestType?: "simple" | "compound";
    startDate: string;
    endDate?: string;
    emiAmount?: number;
    emiDay?: number;
    totalEmis?: number;
    linkedBankAccountId?: string;
    notes?: string;
  }) => Promise<string>;
  recordPayment: (data: {
    loanId: string;
    date: string;
    principalAmount: number;
    interestAmount: number;
    paymentMethod?: string;
    referenceNumber?: string;
    notes?: string;
  }) => Promise<string>;
  updateLoanStatus: (
    id: string,
    status: "active" | "closed" | "defaulted"
  ) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
}

export function useLoanMutations(): LoanMutations {
  const db = getPowerSyncDatabase();

  const createLoan = useCallback(
    async (data: {
      name: string;
      type: "taken" | "given";
      customerId?: string;
      customerName?: string;
      lenderName?: string;
      principalAmount: number;
      interestRate?: number;
      interestType?: "simple" | "compound";
      startDate: string;
      endDate?: string;
      emiAmount?: number;
      emiDay?: number;
      totalEmis?: number;
      linkedBankAccountId?: string;
      notes?: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const user = useAuthStore.getState().user;

      await db.execute(
        `INSERT INTO loans (
          id, name, type, customer_id, customer_name, lender_name,
          principal_amount, outstanding_amount, interest_rate, interest_type,
          start_date, end_date, emi_amount, emi_day, total_emis, paid_emis,
          status, notes, linked_bank_account_id, created_at, updated_at, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.type,
          data.customerId ?? null,
          data.customerName ?? null,
          data.lenderName ?? null,
          data.principalAmount,
          data.principalAmount, // outstanding starts same as principal
          data.interestRate ?? 0,
          data.interestType ?? "simple",
          data.startDate,
          data.endDate ?? null,
          data.emiAmount ?? null,
          data.emiDay ?? null,
          data.totalEmis ?? null,
          0,
          "active",
          data.notes ?? null,
          data.linkedBankAccountId ?? null,
          now,
          now,
          user?.id ?? null,
        ]
      );

      return id;
    },
    [db]
  );

  const recordPayment = useCallback(
    async (data: {
      loanId: string;
      date: string;
      principalAmount: number;
      interestAmount: number;
      paymentMethod?: string;
      referenceNumber?: string;
      notes?: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const totalAmount = data.principalAmount + data.interestAmount;
      const user = useAuthStore.getState().user;

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO loan_payments (
            id, loan_id, date, principal_amount, interest_amount, total_amount,
            payment_method, reference_number, notes, created_at, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.loanId,
            data.date,
            data.principalAmount,
            data.interestAmount,
            totalAmount,
            data.paymentMethod ?? null,
            data.referenceNumber ?? null,
            data.notes ?? null,
            now,
            user?.id ?? null,
          ]
        );

        // Update loan outstanding amount and paid EMIs
        await tx.execute(
          `UPDATE loans
            SET outstanding_amount = outstanding_amount - ?,
                paid_emis = paid_emis + 1,
                status = CASE WHEN outstanding_amount - ? <= 0 THEN 'closed' ELSE status END,
                updated_at = ?
            WHERE id = ?`,
          [data.principalAmount, data.principalAmount, now, data.loanId]
        );
      });

      return id;
    },
    [db]
  );

  const updateLoanStatus = useCallback(
    async (
      id: string,
      status: "active" | "closed" | "defaulted"
    ): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE loans SET status = ?, updated_at = ? WHERE id = ?`,
        [status, now, id]
      );
    },
    [db]
  );

  const deleteLoan = useCallback(
    async (id: string): Promise<void> => {
      await db.writeTransaction(async (tx) => {
        await tx.execute(`DELETE FROM loan_payments WHERE loan_id = ?`, [id]);
        await tx.execute(`DELETE FROM loans WHERE id = ?`, [id]);
      });
    },
    [db]
  );

  return {
    createLoan,
    recordPayment,
    updateLoanStatus,
    deleteLoan,
  };
}
