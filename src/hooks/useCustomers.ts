import { useQuery } from "@powersync/react";
import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { Customer, CustomerFormData, CustomerType } from "@/features/customers/types";

// Database row type (snake_case columns from SQLite)
interface CustomerRow {
  id: string;
  name: string;
  type: CustomerType;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  opening_balance: number;
  current_balance: number;
  credit_limit: number | null;
  credit_days: number | null;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function mapRowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    taxId: row.tax_id ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    zipCode: row.zip_code ?? undefined,
    openingBalance: row.opening_balance,
    currentBalance: row.current_balance,
    creditLimit: row.credit_limit ?? undefined,
    creditDays: row.credit_days ?? undefined,
    notes: row.notes ?? undefined,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useCustomers(filters?: {
  type?: "customer" | "supplier" | "both";
  isActive?: boolean;
  search?: string;
}): { customers: Customer[]; isLoading: boolean; error: Error | undefined } {
  const typeFilter = filters?.type ?? null;
  const activeFilter = filters?.isActive !== undefined ? (filters.isActive ? 1 : 0) : null;
  const searchFilter = filters?.search ? `%${filters.search}%` : null;

  const { data, isLoading, error } = useQuery<CustomerRow>(
    `SELECT * FROM customers
     WHERE ($1 IS NULL OR type = $1)
     AND ($2 IS NULL OR is_active = $2)
     AND ($3 IS NULL OR name LIKE $3 OR phone LIKE $3 OR email LIKE $3)
     ORDER BY name`,
    [typeFilter, activeFilter, searchFilter]
  );

  const customers = data.map(mapRowToCustomer);

  return { customers, isLoading, error };
}

export function useCustomerById(id: string | null): {
  customer: Customer | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<CustomerRow>(
    id ? `SELECT * FROM customers WHERE id = ?` : `SELECT * FROM customers WHERE 1 = 0`,
    id ? [id] : []
  );

  const customer = data[0] ? mapRowToCustomer(data[0]) : null;

  return { customer, isLoading, error };
}

interface CustomerMutations {
  createCustomer: (data: CustomerFormData) => Promise<string>;
  updateCustomer: (id: string, data: Partial<CustomerFormData>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  toggleCustomerActive: (id: string, isActive: boolean) => Promise<void>;
  updateCustomerBalance: (id: string, amount: number) => Promise<void>;
}

export function useCustomerMutations(): CustomerMutations {
  const db = getPowerSyncDatabase();

  const createCustomer = useCallback(
    async (data: CustomerFormData): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO customers (
          id, name, type, phone, email, tax_id, address, city, state, zip_code,
          opening_balance, current_balance, credit_limit, credit_days, notes, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.type,
          data.phone ?? null,
          data.email ?? null,
          data.taxId ?? null,
          data.address ?? null,
          data.city ?? null,
          data.state ?? null,
          data.zipCode ?? null,
          data.openingBalance ?? 0,
          data.openingBalance ?? 0, // current_balance starts same as opening
          data.creditLimit ?? null,
          data.creditDays ?? null,
          data.notes ?? null,
          1, // is_active
          now,
          now,
        ]
      );

      return id;
    },
    [db]
  );

  const updateCustomer = useCallback(
    async (id: string, data: Partial<CustomerFormData>): Promise<void> => {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (data.name !== undefined) {
        fields.push("name = ?");
        values.push(data.name);
      }
      if (data.type !== undefined) {
        fields.push("type = ?");
        values.push(data.type);
      }
      if (data.phone !== undefined) {
        fields.push("phone = ?");
        values.push(data.phone ?? null);
      }
      if (data.email !== undefined) {
        fields.push("email = ?");
        values.push(data.email ?? null);
      }
      if (data.taxId !== undefined) {
        fields.push("tax_id = ?");
        values.push(data.taxId ?? null);
      }
      if (data.address !== undefined) {
        fields.push("address = ?");
        values.push(data.address ?? null);
      }
      if (data.city !== undefined) {
        fields.push("city = ?");
        values.push(data.city ?? null);
      }
      if (data.state !== undefined) {
        fields.push("state = ?");
        values.push(data.state ?? null);
      }
      if (data.zipCode !== undefined) {
        fields.push("zip_code = ?");
        values.push(data.zipCode ?? null);
      }
      if (data.creditLimit !== undefined) {
        fields.push("credit_limit = ?");
        values.push(data.creditLimit ?? null);
      }
      if (data.creditDays !== undefined) {
        fields.push("credit_days = ?");
        values.push(data.creditDays ?? null);
      }
      if (data.notes !== undefined) {
        fields.push("notes = ?");
        values.push(data.notes ?? null);
      }

      fields.push("updated_at = ?");
      values.push(now);
      values.push(id);

      if (fields.length > 1) {
        await db.execute(`UPDATE customers SET ${fields.join(", ")} WHERE id = ?`, values);
      }
    },
    [db]
  );

  const deleteCustomer = useCallback(
    async (id: string): Promise<void> => {
      await db.execute(`DELETE FROM customers WHERE id = ?`, [id]);
    },
    [db]
  );

  const toggleCustomerActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(`UPDATE customers SET is_active = ?, updated_at = ? WHERE id = ?`, [
        isActive ? 1 : 0,
        now,
        id,
      ]);
    },
    [db]
  );

  const updateCustomerBalance = useCallback(
    async (id: string, amount: number): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
        [amount, now, id]
      );
    },
    [db]
  );

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    toggleCustomerActive,
    updateCustomerBalance,
  };
}

interface CustomerStats {
  totalCustomers: number;
  totalSuppliers: number;
  totalReceivable: number;
  totalPayable: number;
}

export function useCustomerStats(): CustomerStats {
  const { data: totalCustomers } = useQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM customers WHERE type IN ('customer', 'both') AND is_active = 1`
  );

  const { data: totalSuppliers } = useQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM customers WHERE type IN ('supplier', 'both') AND is_active = 1`
  );

  const { data: totalReceivable } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(current_balance), 0) as sum FROM customers WHERE type IN ('customer', 'both') AND current_balance > 0`
  );

  const { data: totalPayable } = useQuery<{ sum: number }>(
    `SELECT COALESCE(ABS(SUM(current_balance)), 0) as sum FROM customers WHERE type IN ('supplier', 'both') AND current_balance < 0`
  );

  return {
    totalCustomers: totalCustomers[0]?.count ?? 0,
    totalSuppliers: totalSuppliers[0]?.count ?? 0,
    totalReceivable: totalReceivable[0]?.sum ?? 0,
    totalPayable: totalPayable[0]?.sum ?? 0,
  };
}
