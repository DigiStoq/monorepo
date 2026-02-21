import type { PowerSyncDatabase } from "@powersync/web";
import { useQuery } from "@powersync/react";
import {
  queryOptions,
  type UndefinedInitialDataOptions,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type {
  Customer,
  CustomerFormData,
  CustomerType,
  CustomerTransaction,
} from "@/features/customers/types";

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
  const customer: Customer = {
    id: row.id,
    name: row.name,
    type: row.type,
    openingBalance: row.opening_balance,
    currentBalance: row.current_balance,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Only set optional properties if they have values
  if (row.phone) customer.phone = row.phone;
  if (row.email) customer.email = row.email;
  if (row.tax_id) customer.taxId = row.tax_id;
  if (row.address) customer.address = row.address;
  if (row.city) customer.city = row.city;
  if (row.state) customer.state = row.state;
  if (row.zip_code) customer.zipCode = row.zip_code;
  if (row.credit_limit !== null) customer.creditLimit = row.credit_limit;
  if (row.credit_days !== null) customer.creditDays = row.credit_days;
  if (row.notes) customer.notes = row.notes;

  return customer;
}

const getCustomersQuery = (filters?: {
  type?: "customer" | "supplier" | "both";
  isActive?: boolean;
  search?: string;
}): { query: string; params: (string | number)[] } => {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters?.type === "customer")
    conditions.push("type IN ('customer', 'both')");
  else if (filters?.type === "supplier")
    conditions.push("type IN ('supplier', 'both')");
  else if (filters?.type === "both") conditions.push("type = 'both'");

  if (filters?.isActive !== undefined) {
    conditions.push("is_active = ?");
    params.push(filters.isActive ? 1 : 0);
  }

  if (filters?.search) {
    conditions.push("(name LIKE ? OR phone LIKE ? OR email LIKE ?)");
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return {
    query: `SELECT * FROM customers ${whereClause} ORDER BY name`,
    params,
  };
};

export const customersQueryOptions = (
  db: PowerSyncDatabase,
  filters?: {
    type?: "customer" | "supplier" | "both";
    isActive?: boolean;
    search?: string;
  }
): UndefinedInitialDataOptions<
  CustomerRow[],
  Error,
  CustomerRow[],
  (string | (string | number)[])[]
> => {
  const { query, params } = getCustomersQuery(filters);
  return queryOptions({
    queryKey: [query, params],
    queryFn: async () => {
      return await db.getAll<CustomerRow>(query, params);
    },
  });
};

export function useCustomers(filters?: {
  type?: "customer" | "supplier" | "both";
  isActive?: boolean;
  search?: string;
}): { customers: Customer[]; isLoading: boolean; error: Error | undefined } {
  const { query, params } = useMemo(
    () =>
      getCustomersQuery({
        type: filters?.type,
        isActive: filters?.isActive,
        search: filters?.search,
      }),
    [filters?.type, filters?.isActive, filters?.search]
  );
  const { data, isLoading, error } = useQuery<CustomerRow>(query, params);

  const customers = useMemo(() => data.map(mapRowToCustomer), [data]);

  return { customers, isLoading, error };
}

interface CustomerMutations {
  createCustomer: (data: CustomerFormData) => Promise<string>;
  updateCustomer: (
    id: string,
    data: Partial<CustomerFormData>
  ) => Promise<void>;
  deleteCustomer: (
    id: string,
    cascade?: boolean,
    restoreStock?: boolean
  ) => Promise<void>;
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
        await db.execute(
          `UPDATE customers SET ${fields.join(", ")} WHERE id = ?`,
          values
        );
      }
    },
    [db]
  );

  const deleteCustomer = useCallback(
    async (id: string, cascade, restoreStock): Promise<void> => {
      if (cascade) {
        const now = new Date().toISOString();
        await db.writeTransaction(async (tx) => {
          if (restoreStock) {
            // 1. Restore Stock from Sales Invoices (Sales always deduct stock, so we always restore)
            const saleItemsResult = await tx.execute(
              `SELECT sii.item_id, sii.quantity 
             FROM sale_invoice_items sii
             INNER JOIN sale_invoices si ON sii.invoice_id = si.id
             WHERE si.customer_id = ?`,
              [id]
            );

            if (saleItemsResult.rows?.length) {
              for (let i = 0; i < saleItemsResult.rows.length; i++) {
                const item = saleItemsResult.rows.item(i);
                if (item.item_id) {
                  await tx.execute(
                    `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
                    [item.quantity, now, item.item_id]
                  );
                }
              }
            }

            // 2. Remove Stock from Purchase Invoices (Only if received/paid)
            const purchaseItemsResult = await tx.execute(
              `SELECT pii.item_id, pii.quantity 
             FROM purchase_invoice_items pii
             INNER JOIN purchase_invoices pi ON pii.invoice_id = pi.id
             WHERE pi.customer_id = ? AND (pi.status = 'received' OR pi.status = 'paid')`,
              [id]
            );

            if (purchaseItemsResult.rows?.length) {
              for (let i = 0; i < purchaseItemsResult.rows.length; i++) {
                const item = purchaseItemsResult.rows.item(i);
                if (item.item_id) {
                  await tx.execute(
                    `UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?`,
                    [item.quantity, now, item.item_id]
                  );
                }
              }
            }
          }

          // Delete related records first
          // Sales
          await tx.execute(
            `DELETE FROM sale_invoice_items WHERE invoice_id IN (SELECT id FROM sale_invoices WHERE customer_id = ?)`,
            [id]
          );
          await tx.execute(`DELETE FROM sale_invoices WHERE customer_id = ?`, [
            id,
          ]);
          await tx.execute(`DELETE FROM payment_ins WHERE customer_id = ?`, [
            id,
          ]);
          await tx.execute(
            `DELETE FROM estimate_items WHERE estimate_id IN (SELECT id FROM estimates WHERE customer_id = ?)`,
            [id]
          );
          await tx.execute(`DELETE FROM estimates WHERE customer_id = ?`, [id]);
          await tx.execute(
            `DELETE FROM credit_note_items WHERE credit_note_id IN (SELECT id FROM credit_notes WHERE customer_id = ?)`,
            [id]
          );
          await tx.execute(`DELETE FROM credit_notes WHERE customer_id = ?`, [
            id,
          ]);

          // Purchases
          await tx.execute(
            `DELETE FROM purchase_invoice_items WHERE invoice_id IN (SELECT id FROM purchase_invoices WHERE customer_id = ?)`,
            [id]
          );
          await tx.execute(
            `DELETE FROM purchase_invoices WHERE customer_id = ?`,
            [id]
          );
          await tx.execute(`DELETE FROM payment_outs WHERE customer_id = ?`, [
            id,
          ]);

          // Finally delete customer
          await tx.execute(`DELETE FROM customers WHERE id = ?`, [id]);
        });
      } else {
        await db.execute(`DELETE FROM customers WHERE id = ?`, [id]);
      }
    },
    [db]
  );

  const toggleCustomerActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE customers SET is_active = ?, updated_at = ? WHERE id = ?`,
        [isActive ? 1 : 0, now, id]
      );
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

// Transaction row type from combined query
interface TransactionRow {
  id: string;
  customer_id: string;
  type: string;
  invoice_number: string | null;
  date: string;
  amount: number;
  description: string | null;
}

export function useCustomerTransactions(customerId: string | null): {
  transactions: CustomerTransaction[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<TransactionRow>(
    customerId
      ? `SELECT id, customer_id, 'sale' as type, invoice_number, date, total as amount, notes as description
         FROM sale_invoices WHERE customer_id = $1
         UNION ALL
         SELECT id, customer_id, 'payment-in' as type, reference_number as invoice_number, date, amount, notes as description
         FROM payment_ins WHERE customer_id = $1
         UNION ALL
         SELECT id, customer_id, 'credit-note' as type, credit_note_number as invoice_number, date, total as amount, notes as description
         FROM credit_notes WHERE customer_id = $1
         ORDER BY date DESC`
      : `SELECT '' as id, '' as customer_id, '' as type, '' as invoice_number, '' as date, 0 as amount, '' as description WHERE 1 = 0`,
    customerId ? [customerId] : []
  );

  const transactions = useMemo(() => {
    let runningBalance = 0;
    // Sort by date ascending to calculate running balance, then reverse for display
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const mapped = sortedData.map((row): CustomerTransaction => {
      // Sales increase balance (customer owes), payments decrease it
      if (row.type === "sale") {
        runningBalance += row.amount;
      } else if (row.type === "payment-in" || row.type === "credit-note") {
        runningBalance -= row.amount;
      }

      const transaction: CustomerTransaction = {
        id: row.id,
        customerId: row.customer_id,
        type: row.type as CustomerTransaction["type"],
        date: row.date,
        amount: row.amount,
        balance: runningBalance,
      };

      // Only set optional properties if they have values
      if (row.invoice_number) transaction.invoiceNumber = row.invoice_number;
      if (row.description) transaction.description = row.description;

      return transaction;
    });

    // Return in reverse chronological order for display
    return mapped.reverse();
  }, [data]);

  return { transactions, isLoading, error };
}
