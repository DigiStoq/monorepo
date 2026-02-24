import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { LoanRecord } from "../lib/powersync";
import { useAuth } from "../contexts/AuthContext";

export interface Loan {
  id: string;
  type: "given" | "taken"; // asset vs liability
  customerId?: string;
  customerName?: string; // Cache
  lenderName?: string; // For taken loans (e.g., Bank, Friend)
  principalAmount: number;
  interestRate: number;
  interestType: "simple" | "compound";
  startDate: string;
  totalEmis?: number;
  emiAmount?: number;
  paidEmis: number;
  outstandingAmount: number;
  linkedBankAccountId?: string;
  status: "active" | "closed" | "defaulted";
  notes?: string;
  createdAt: string;
}

function mapRowToLoan(row: LoanRecord): Loan {
  return {
    id: row.id,
    type: row.type as "given" | "taken",
    customerId: row.customer_id || undefined,
    customerName: row.customer_name || undefined,
    lenderName: row.lender_name || undefined,
    principalAmount: row.principal_amount,
    interestRate: row.interest_rate,
    interestType: (row.interest_type as "simple" | "compound") || "simple",
    startDate: row.start_date,
    totalEmis: row.total_emis || undefined,
    emiAmount: row.emi_amount || undefined,
    paidEmis: row.paid_emis || 0,
    outstandingAmount: row.outstanding_amount,
    linkedBankAccountId: row.linked_bank_account_id || undefined,
    status: row.status as "active" | "closed" | "defaulted",
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

export function useLoans(filters?: {
  type?: "given" | "taken";
  status?: "active" | "closed" | "defaulted";
  customerId?: string;
}): { loans: Loan[]; isLoading: boolean; error: Error | null } {
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

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM loans ${whereClause} ORDER BY start_date DESC, created_at DESC`,
      params,
    };
  }, [filters?.type, filters?.status, filters?.customerId]);

  const { data, isLoading, error } = useQuery<LoanRecord>(query, params);

  const loans = useMemo(() => (data || []).map(mapRowToLoan), [data]);

  return { loans, isLoading, error: error };
}

export function useLoanById(id: string | null): {
  loan: Loan | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery<LoanRecord>(
    id ? `SELECT * FROM loans WHERE id = ?` : `SELECT * FROM loans WHERE 1 = 0`,
    id ? [id] : []
  );

  const loan = data?.[0] ? mapRowToLoan(data[0]) : null;

  return { loan, isLoading, error: error };
}

interface LoanMutations {
  createLoan: (data: {
    type: "given" | "taken";
    customerId?: string;
    partyName: string; // customerName or lenderName
    principalAmount: number;
    interestRate: number;
    interestType: "simple" | "compound";
    startDate: string;
    totalEmis?: number;
    emiAmount?: number;
    linkedBankAccountId?: string;
    notes?: string;
  }) => Promise<string>;
  updateLoan: (
    id: string,
    data: {
        type: "given" | "taken";
        customerId?: string;
        partyName: string;
        principalAmount: number; // NOTE: changing principal invalidates outstanding/calculations!
        interestRate: number;
        interestType: "simple" | "compound";
        startDate: string;
        totalEmis?: number;
        emiAmount?: number;
        linkedBankAccountId?: string;
        notes?: string;
        status?: "active" | "closed" | "defaulted";
    }
  ) => Promise<void>;
  updateLoanStatus: (
    id: string,
    status: "active" | "closed" | "defaulted"
  ) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
}

export function useLoanMutations(): LoanMutations {
  const db = getPowerSyncDatabase();
  const { user } = useAuth();

  const createLoan = useCallback(
    async (data: {
      type: "given" | "taken";
      customerId?: string;
      partyName: string;
      principalAmount: number;
      interestRate: number;
      interestType: "simple" | "compound";
      startDate: string;
      totalEmis?: number;
      emiAmount?: number;
      linkedBankAccountId?: string;
      notes?: string;
    }) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO loans (
            id, type, customer_id, customer_name, lender_name,
            principal_amount, interest_rate, interest_type,
            start_date, total_emis, emi_amount, paid_emis,
            outstanding_amount, linked_bank_account_id,
            status, notes, created_at, updated_at, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.type,
          data.customerId || null,
          data.type === "given" ? data.partyName : null,
          data.type === "taken" ? data.partyName : null,
          data.principalAmount,
          data.interestRate,
          data.interestType,
          data.startDate,
          data.totalEmis || null,
          data.emiAmount || null,
          0, // paid_emis
          data.principalAmount, // outstanding_amount initially equals principal
          data.linkedBankAccountId || null,
          "active",
          data.notes || null,
          now,
          now,
          user?.id || null,
        ]
      );
      return id;
    },
    [db]
  );
  
  const updateLoan = useCallback(
    async (
      id: string,
      data: {
        type: "given" | "taken";
        customerId?: string;
        partyName: string;
        principalAmount: number;
        interestRate: number;
        interestType: "simple" | "compound";
        startDate: string;
        totalEmis?: number;
        emiAmount?: number;
        linkedBankAccountId?: string;
        notes?: string;
        status?: "active" | "closed" | "defaulted";
      }
    ) => {
        const now = new Date().toISOString();
        // WARNING: Updating principalAmount or interest details here does NOT automatically recalculate outstanding/EMIs paid history.
        // This is a simplified update. Real-world apps would need complex recalculation logic.
        // For now, we update the fields provided.

        await db.execute(
            `UPDATE loans SET
                type = ?, customer_id = ?, customer_name = ?, lender_name = ?,
                principal_amount = ?, interest_rate = ?, interest_type = ?,
                start_date = ?, total_emis = ?, emi_amount = ?,
                linked_bank_account_id = ?, status = ?, notes = ?, updated_at = ?
            WHERE id = ?`,
            [
                data.type,
                data.customerId || null,
                data.type === 'given' ? data.partyName : null,
                data.type === 'taken' ? data.partyName : null,
                data.principalAmount,
                data.interestRate,
                data.interestType,
                data.startDate,
                data.totalEmis || null,
                data.emiAmount || null,
                data.linkedBankAccountId || null,
                data.status || 'active',
                data.notes || null,
                now,
                id
            ]
        );
    },
    [db]
  );

  const updateLoanStatus = useCallback(
    async (id: string, status: "active" | "closed" | "defaulted") => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE loans SET status = ?, updated_at = ? WHERE id = ?`,
        [status, now, id]
      );
    },
    [db]
  );

  const deleteLoan = useCallback(async (id: string) => {
    await db.execute(`DELETE FROM loans WHERE id = ?`, [id]);
  }, [db]);

  return { createLoan, updateLoan, updateLoanStatus, deleteLoan };
}
