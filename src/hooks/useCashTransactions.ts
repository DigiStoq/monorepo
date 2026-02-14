import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { CashTransaction } from "@/features/cash-bank/types";

// Database row type (snake_case columns from SQLite)
interface CashTransactionRow {
  id: string;
  date: string;
  type: "in" | "out" | "adjustment";
  amount: number;
  description: string;
  category: string | null;
  related_customer_id: string | null;
  related_customer_name: string | null;
  related_invoice_id: string | null;
  related_invoice_number: string | null;
  balance: number;
  created_at: string;
}

function mapRowToTransaction(row: CashTransactionRow): CashTransaction {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    amount: row.amount,
    description: row.description,
    category: row.category ?? undefined,
    relatedCustomerId: row.related_customer_id ?? undefined,
    relatedCustomerName: row.related_customer_name ?? undefined,
    relatedInvoiceId: row.related_invoice_id ?? undefined,
    relatedInvoiceNumber: row.related_invoice_number ?? undefined,
    balance: row.balance,
    createdAt: row.created_at,
  };
}

export function useCashTransactions(filters?: {
  type?: "in" | "out" | "adjustment";
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}): {
  transactions: CashTransaction[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.type) {
      conditions.push("type = ?");
      params.push(filters.type);
    }

    if (filters?.category) {
      conditions.push("category = ?");
      params.push(filters.category);
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
      query: `SELECT * FROM cash_transactions ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [filters?.type, filters?.category, filters?.dateFrom, filters?.dateTo]);

  const { data, isLoading, error } = useQuery<CashTransactionRow>(
    query,
    params
  );

  const transactions = useMemo(() => data.map(mapRowToTransaction), [data]);

  return { transactions, isLoading, error };
}

export function useCashBalance(): { balance: number; isLoading: boolean } {
  const { data, isLoading } = useQuery<{ balance: number }>(
    `SELECT COALESCE((SELECT balance FROM cash_transactions ORDER BY created_at DESC LIMIT 1), 0) as balance`
  );

  return { balance: data[0]?.balance ?? 0, isLoading };
}

interface CashTransactionMutations {
  createTransaction: (data: {
    date: string;
    type: "in" | "out" | "adjustment";
    amount: number;
    description: string;
    category?: string;
    relatedCustomerId?: string;
    relatedCustomerName?: string;
    relatedInvoiceId?: string;
    relatedInvoiceNumber?: string;
  }) => Promise<string>;
  deleteTransaction: (id: string) => Promise<void>;
}

export function useCashTransactionMutations(): CashTransactionMutations {
  const db = getPowerSyncDatabase();

  const createTransaction = useCallback(
    async (data: {
      date: string;
      type: "in" | "out" | "adjustment";
      amount: number;
      description: string;
      category?: string;
      relatedCustomerId?: string;
      relatedCustomerName?: string;
      relatedInvoiceId?: string;
      relatedInvoiceNumber?: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.writeTransaction(async (tx) => {
        // Get current balance
        const result = await tx.execute(
          `SELECT balance FROM cash_transactions ORDER BY created_at DESC LIMIT 1`
        );
        const rows = (result.rows?._array ?? []) as { balance: number }[];
        const currentBalance: number = rows[0]?.balance ?? 0;

        // Calculate new balance
        let balanceChange: number;
        if (data.type === "in") {
          balanceChange = data.amount;
        } else if (data.type === "out") {
          balanceChange = -data.amount;
        } else {
          // adjustment - amount is the absolute value to set
          balanceChange = data.amount - currentBalance;
        }
        const newBalance = currentBalance + balanceChange;

        await tx.execute(
          `INSERT INTO cash_transactions (
            id, date, type, amount, description, category,
            related_customer_id, related_customer_name,
            related_invoice_id, related_invoice_number, balance, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.date,
            data.type,
            data.amount,
            data.description,
            data.category ?? null,
            data.relatedCustomerId ?? null,
            data.relatedCustomerName ?? null,
            data.relatedInvoiceId ?? null,
            data.relatedInvoiceNumber ?? null,
            newBalance,
            now,
          ]
        );
      });

      return id;
    },
    [db]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      await db.execute(`DELETE FROM cash_transactions WHERE id = ?`, [id]);
      // Note: In production, you'd recalculate subsequent balances
    },
    [db]
  );

  return {
    createTransaction,
    deleteTransaction,
  };
}
