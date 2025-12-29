import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { BankTransaction } from "@/features/cash-bank/types";

// Database row type (snake_case columns from SQLite)
interface BankTransactionRow {
  id: string;
  account_id: string;
  date: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  description: string;
  reference_number: string | null;
  related_customer_id: string | null;
  related_customer_name: string | null;
  related_invoice_id: string | null;
  related_invoice_number: string | null;
  balance: number;
  created_at: string;
}

function mapRowToTransaction(row: BankTransactionRow): BankTransaction {
  return {
    id: row.id,
    accountId: row.account_id,
    date: row.date,
    type: row.type,
    amount: row.amount,
    description: row.description,
    referenceNumber: row.reference_number ?? undefined,
    relatedCustomerId: row.related_customer_id ?? undefined,
    relatedCustomerName: row.related_customer_name ?? undefined,
    relatedInvoiceId: row.related_invoice_id ?? undefined,
    relatedInvoiceNumber: row.related_invoice_number ?? undefined,
    balance: row.balance,
    createdAt: row.created_at,
  };
}

export function useBankTransactions(filters?: {
  accountId?: string;
  type?: "deposit" | "withdrawal" | "transfer";
  dateFrom?: string;
  dateTo?: string;
}): { transactions: BankTransaction[]; isLoading: boolean; error: Error | undefined } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.accountId) {
      conditions.push("account_id = ?");
      params.push(filters.accountId);
    }

    if (filters?.type) {
      conditions.push("type = ?");
      params.push(filters.type);
    }

    if (filters?.dateFrom) {
      conditions.push("date >= ?");
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      conditions.push("date <= ?");
      params.push(filters.dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM bank_transactions ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [filters?.accountId, filters?.type, filters?.dateFrom, filters?.dateTo]);

  const { data, isLoading, error } = useQuery<BankTransactionRow>(query, params);

  const transactions = useMemo(() => data.map(mapRowToTransaction), [data]);

  return { transactions, isLoading, error };
}

interface BankTransactionMutations {
  createTransaction: (data: {
    accountId: string;
    date: string;
    type: "deposit" | "withdrawal" | "transfer";
    amount: number;
    description: string;
    referenceNumber?: string;
    relatedCustomerId?: string;
    relatedCustomerName?: string;
    relatedInvoiceId?: string;
    relatedInvoiceNumber?: string;
  }) => Promise<string>;
  deleteTransaction: (id: string) => Promise<void>;
}

interface BalanceQueryRow {
  current_balance: number;
}

interface TransactionQueryRow {
  account_id: string;
  type: string;
  amount: number;
}

export function useBankTransactionMutations(): BankTransactionMutations {
  const db = getPowerSyncDatabase();

  const createTransaction = useCallback(
    async (data: {
      accountId: string;
      date: string;
      type: "deposit" | "withdrawal" | "transfer";
      amount: number;
      description: string;
      referenceNumber?: string;
      relatedCustomerId?: string;
      relatedCustomerName?: string;
      relatedInvoiceId?: string;
      relatedInvoiceNumber?: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // Get current balance
      const result = await db.execute(
        `SELECT current_balance FROM bank_accounts WHERE id = ?`,
        [data.accountId]
      );
      const rows = result.rows._array as BalanceQueryRow[];
      const currentBalance = rows[0]?.current_balance ?? 0;

      // Calculate new balance
      const balanceChange = data.type === "deposit" ? data.amount : -data.amount;
      const newBalance = currentBalance + balanceChange;

      await db.execute(
        `INSERT INTO bank_transactions (
          id, account_id, date, type, amount, description, reference_number,
          related_customer_id, related_customer_name, related_invoice_id,
          related_invoice_number, balance, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.accountId,
          data.date,
          data.type,
          data.amount,
          data.description,
          data.referenceNumber ?? null,
          data.relatedCustomerId ?? null,
          data.relatedCustomerName ?? null,
          data.relatedInvoiceId ?? null,
          data.relatedInvoiceNumber ?? null,
          newBalance,
          now,
        ]
      );

      // Update account balance
      await db.execute(
        `UPDATE bank_accounts SET current_balance = ?, updated_at = ? WHERE id = ?`,
        [newBalance, now, data.accountId]
      );

      return id;
    },
    [db]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      // Get transaction details
      const result = await db.execute(
        `SELECT account_id, type, amount FROM bank_transactions WHERE id = ?`,
        [id]
      );
      const tx = (result.rows._array as TransactionQueryRow[])[0];

      if (tx) {
        const now = new Date().toISOString();
        // Reverse the balance change
        const reverseAmount = tx.type === "deposit" ? -tx.amount : tx.amount;
        await db.execute(
          `UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
          [reverseAmount, now, tx.account_id]
        );
      }

      await db.execute(`DELETE FROM bank_transactions WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createTransaction,
    deleteTransaction,
  };
}
