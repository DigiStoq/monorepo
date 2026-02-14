import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { BankAccountRecord } from "../lib/powersync";

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

function mapRowToBankAccount(row: BankAccountRecord): BankAccount {
  return {
    id: row.id,
    name: row.name,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountType: row.account_type,
    openingBalance: row.opening_balance,
    currentBalance: row.current_balance,
    isActive: row.is_active === 1,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

export function useBankAccounts(filters?: {
  isActive?: boolean;
  accountType?: string;
}): { accounts: BankAccount[]; isLoading: boolean; error: Error | null } {
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
      query: `SELECT * FROM bank_accounts ${whereClause} ORDER BY name ASC`,
      params,
    };
  }, [filters?.isActive, filters?.accountType]);

  const { data, isLoading, error } = useQuery<BankAccountRecord>(query, params);

  const accounts = useMemo(() => (data || []).map(mapRowToBankAccount), [data]);

  return { accounts, isLoading, error: error };
}

export function useBankAccountById(id: string | null): {
  account: BankAccount | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery<BankAccountRecord>(
    id ? `SELECT * FROM bank_accounts WHERE id = ?` : `SELECT * FROM bank_accounts WHERE 1=0`,
    id ? [id] : []
  );

  const account = data?.[0] ? mapRowToBankAccount(data[0]) : null;

  return { account, isLoading, error: error };
}

interface BankAccountMutations {
  createAccount: (data: {
    name: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
    openingBalance: number;
    notes?: string;
  }) => Promise<string>;
  updateAccount: (
    id: string,
    data: Partial<{
      name: string;
      bankName: string;
      accountNumber: string;
      accountType: string;
      openingBalance: number;
      notes: string;
    }>
  ) => Promise<void>;
  toggleAccountActive: (id: string, isActive: boolean) => Promise<void>;
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
      openingBalance: number;
      notes?: string;
    }) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();
      
      await db.execute(
        `INSERT INTO bank_accounts (id, name, bank_name, account_number, account_type, opening_balance, current_balance, is_active, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.bankName,
          data.accountNumber,
          data.accountType || 'savings',
          data.openingBalance,
          data.openingBalance, // Initial current balance = opening balance
          1,
          data.notes || null,
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
        accountNumber: string;
        accountType: string;
        openingBalance: number;
        notes: string;
      }>
    ) => {
      const updates: string[] = [];
      const params: any[] = [];
      const now = new Date().toISOString();

      if (data.name !== undefined) {
        updates.push("name = ?");
        params.push(data.name);
      }
      if (data.bankName !== undefined) {
        updates.push("bank_name = ?");
        params.push(data.bankName);
      }
      if (data.accountNumber !== undefined) {
        updates.push("account_number = ?");
        params.push(data.accountNumber);
      }
      if (data.accountType !== undefined) {
        updates.push("account_type = ?");
        params.push(data.accountType);
      }
      if (data.notes !== undefined) {
        updates.push("notes = ?");
        params.push(data.notes);
      }
      // Note: updating openingBalance might imply recounting currentBalance
      // For simplicity here, we update it but leave currentBalance logic to separate transactions or recalculation features
      if (data.openingBalance !== undefined) {
         updates.push("opening_balance = ?");
         params.push(data.openingBalance);
      }
      
      updates.push("updated_at = ?");
      params.push(now);

      await db.execute(
        `UPDATE bank_accounts SET ${updates.join(", ")} WHERE id = ?`,
        [...params, id]
      );
    },
    [db]
  );

  const toggleAccountActive = useCallback(
    async (id: string, isActive: boolean) => {
      await db.execute(
        `UPDATE bank_accounts SET is_active = ?, updated_at = ? WHERE id = ?`,
        [isActive ? 1 : 0, new Date().toISOString(), id]
      );
    },
    [db]
  );

  const deleteAccount = useCallback(async (id: string) => {
      await db.execute(`DELETE FROM bank_accounts WHERE id = ?`, [id]);
  }, [db]);

  return { createAccount, updateAccount, toggleAccountActive, deleteAccount };
}
