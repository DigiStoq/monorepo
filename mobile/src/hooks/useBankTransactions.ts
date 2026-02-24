import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";

interface BankTransactionRow {
  id: string;
  account_id: string;
  date: string;
  type: string;
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

export interface BankTransaction {
  id: string;
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
  balance: number;
  createdAt: string;
}

function mapRowToTransaction(row: BankTransactionRow): BankTransaction {
  return {
    id: row.id,
    accountId: row.account_id,
    date: row.date,
    type: row.type as "deposit" | "withdrawal" | "transfer",
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
}): {
  transactions: BankTransaction[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const queryParams: (string | number)[] = [];

    if (filters?.accountId) {
      conditions.push("account_id = ?");
      queryParams.push(filters.accountId);
    }

    if (filters?.type) {
      conditions.push("type = ?");
      queryParams.push(filters.type);
    }

    if (filters?.dateFrom) {
      conditions.push("date >= ?");
      queryParams.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      conditions.push("date <= ?");
      queryParams.push(filters.dateTo);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM bank_transactions ${whereClause} ORDER BY date DESC, created_at DESC`,
      params: queryParams,
    };
  }, [filters?.accountId, filters?.type, filters?.dateFrom, filters?.dateTo]);

  const { data, isLoading, error } = useQuery<BankTransactionRow>(
    query,
    params
  );

  const transactions = useMemo(() => data.map(mapRowToTransaction), [data]);

  return { transactions, isLoading, error };
}

interface BalanceQueryRow {
  current_balance: number;
}

interface TransactionQueryRow {
  account_id: string;
  type: string;
  amount: number;
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

      await db.writeTransaction(async (tx) => {
        const result = await tx.execute(
          `SELECT current_balance FROM bank_accounts WHERE id = ?`,
          [data.accountId]
        );
        const rows = (result.rows?._array ?? []) as BalanceQueryRow[];
        const currentBalance = rows[0]?.current_balance ?? 0;

        const balanceChange =
          data.type === "deposit" ? data.amount : -data.amount;
        const newBalance = currentBalance + balanceChange;

        await tx.execute(
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

        await tx.execute(
          `UPDATE bank_accounts SET current_balance = ?, updated_at = ? WHERE id = ?`,
          [newBalance, now, data.accountId]
        );
      });

      return id;
    },
    [db]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      await db.writeTransaction(async (tx) => {
        const result = await tx.execute(
          `SELECT account_id, type, amount FROM bank_transactions WHERE id = ?`,
          [id]
        );
        const rows = (result.rows?._array ?? []) as TransactionQueryRow[];

        if (rows.length > 0) {
          const txData = rows[0];
          const now = new Date().toISOString();
          const reverseAmount =
            txData.type === "deposit" ? -txData.amount : txData.amount;
          await tx.execute(
            `UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
            [reverseAmount, now, txData.account_id]
          );
        }

        await tx.execute(`DELETE FROM bank_transactions WHERE id = ?`, [id]);
      });
    },
    [db]
  );

  return {
    createTransaction,
    deleteTransaction,
  };
}
