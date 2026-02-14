import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { BankAccount, BankAccountType } from "@/features/cash-bank/types";

// Database row type (snake_case columns from SQLite)
interface BankAccountRow {
  id: string;
  name: string;
  bank_name: string;
  account_number: string;
  account_type: BankAccountType;
  opening_balance: number;
  current_balance: number;
  is_active: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToAccount(row: BankAccountRow): BankAccount {
  return {
    id: row.id,
    name: row.name,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountType: row.account_type,
    openingBalance: row.opening_balance,
    currentBalance: row.current_balance,
    isActive: row.is_active === 1,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useBankAccounts(filters?: {
  isActive?: boolean;
  accountType?: string;
}): { accounts: BankAccount[]; isLoading: boolean; error: Error | undefined } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.isActive !== undefined) {
      conditions.push("is_active = ?");
      params.push(filters.isActive ? 1 : 0);
    }

    if (filters?.accountType) {
      conditions.push("account_type = ?");
      params.push(filters.accountType);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM bank_accounts ${whereClause} ORDER BY name`,
      params,
    };
  }, [filters?.isActive, filters?.accountType]);

  const { data, isLoading, error } = useQuery<BankAccountRow>(query, params);

  const accounts = useMemo(() => data.map(mapRowToAccount), [data]);

  return { accounts, isLoading, error };
}

interface BankAccountMutations {
  createAccount: (data: {
    name: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
    openingBalance?: number;
    notes?: string;
  }) => Promise<string>;
  updateAccount: (
    id: string,
    data: Partial<{
      name: string;
      bankName: string;
      accountType: string;
      notes: string;
    }>
  ) => Promise<void>;
  toggleAccountActive: (id: string, isActive: boolean) => Promise<void>;
  updateBalance: (id: string, amount: number) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export function useBankAccountMutations(): BankAccountMutations {
  const db = getPowerSyncDatabase();

  const createAccount = useCallback(
    async (data: {
      name: string;
      bankName: string;
      accountNumber: string;
      accountType: string;
      openingBalance?: number;
      notes?: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO bank_accounts (
          id, name, bank_name, account_number, account_type,
          opening_balance, current_balance, is_active, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.bankName,
          data.accountNumber,
          data.accountType,
          data.openingBalance ?? 0,
          data.openingBalance ?? 0,
          1,
          data.notes ?? null,
          now,
          now,
        ]
      );

      return id;
    },
    [db]
  );

  const updateAccount = useCallback(
    async (
      id: string,
      data: Partial<{
        name: string;
        bankName: string;
        accountType: string;
        notes: string;
      }>
    ): Promise<void> => {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number)[] = [];

      if (data.name !== undefined) {
        fields.push("name = ?");
        values.push(data.name);
      }
      if (data.bankName !== undefined) {
        fields.push("bank_name = ?");
        values.push(data.bankName);
      }
      if (data.accountType !== undefined) {
        fields.push("account_type = ?");
        values.push(data.accountType);
      }
      if (data.notes !== undefined) {
        fields.push("notes = ?");
        values.push(data.notes);
      }

      fields.push("updated_at = ?");
      values.push(now);
      values.push(id);

      if (fields.length > 1) {
        await db.execute(
          `UPDATE bank_accounts SET ${fields.join(", ")} WHERE id = ?`,
          values
        );
      }
    },
    [db]
  );

  const toggleAccountActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE bank_accounts SET is_active = ?, updated_at = ? WHERE id = ?`,
        [isActive ? 1 : 0, now, id]
      );
    },
    [db]
  );

  const updateBalance = useCallback(
    async (id: string, amount: number): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
        [amount, now, id]
      );
    },
    [db]
  );

  const deleteAccount = useCallback(
    async (id: string): Promise<void> => {
      await db.writeTransaction(async (tx) => {
        await tx.execute(`DELETE FROM bank_transactions WHERE account_id = ?`, [
          id,
        ]);
        await tx.execute(`DELETE FROM bank_accounts WHERE id = ?`, [id]);
      });
    },
    [db]
  );

  return {
    createAccount,
    updateAccount,
    toggleAccountActive,
    updateBalance,
    deleteAccount,
  };
}
