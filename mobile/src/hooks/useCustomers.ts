import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { CustomerRecord } from "../lib/powersync";

export type CustomerType = "customer" | "supplier" | "both";

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone?: string;
  email?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  openingBalance: number;
  currentBalance: number;
  creditLimit?: number;
  creditDays?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  name: string;
  type: CustomerType;
  phone?: string;
  email?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  openingBalance?: number;
  creditLimit?: number;
  creditDays?: number;
  notes?: string;
}

function mapRowToCustomer(row: CustomerRecord): Customer {
  const customer: Customer = {
    id: row.id,
    name: row.name,
    type: row.type as CustomerType,
    openingBalance: row.opening_balance || 0,
    currentBalance: row.current_balance || 0,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

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
}): { query: string; params: (string | number | null)[] } => {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.type === "customer") {
    conditions.push("type IN ('customer', 'both')");
  } else if (filters?.type === "supplier") {
    conditions.push("type IN ('supplier', 'both')");
  } else if (filters?.type === "both") {
    conditions.push("type = 'both'");
  }

  if (filters?.isActive !== undefined) {
    conditions.push("is_active = ?");
    params.push(filters.isActive ? 1 : 0);
  }

  if (filters?.search) {
    conditions.push("(name LIKE ? OR phone LIKE ? OR email LIKE ?)");
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return {
    query: `SELECT * FROM customers ${whereClause} ORDER BY name`,
    params,
  };
};

export function useCustomers(filters?: {
  type?: "customer" | "supplier" | "both";
  isActive?: boolean;
  search?: string;
}): { customers: Customer[]; isLoading: boolean; error: Error | null } {
  const { query, params } = useMemo(
    () =>
      getCustomersQuery({
        type: filters?.type,
        isActive: filters?.isActive,
        search: filters?.search,
      }),
    [filters?.type, filters?.isActive, filters?.search]
  );
  
  // React Native version of useQuery returns { data, isLoading, error }
  const { data, isLoading, error } = useQuery<CustomerRecord>(query, params);

  const customers = useMemo(() => (data || []).map(mapRowToCustomer), [data]);

  return { customers, isLoading, error: error };
}

export function useCustomerById(id: string | null): {
  customer: Customer | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery<CustomerRecord>(
    id ? `SELECT * FROM customers WHERE id = ?` : `SELECT * FROM customers WHERE 1 = 0`,
    id ? [id] : []
  );

  const customer = data?.[0] ? mapRowToCustomer(data[0]) : null;

  return { customer, isLoading, error: error };
}

export function useCustomerMutations() {
  const db = getPowerSyncDatabase();

  const createCustomer = useCallback(
    async (data: CustomerFormData): Promise<string> => {
      const id = Date.now().toString(); // Basic ID generation for POC, or use uuid
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
          data.phone || null,
          data.email || null,
          data.taxId || null,
          data.address || null,
          data.city || null,
          data.state || null,
          data.zipCode || null,
          data.openingBalance || 0,
          data.openingBalance || 0,
          data.creditLimit || null,
          data.creditDays || null,
          data.notes || null,
          1,
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
        values.push(data.phone || null);
      }
      if (data.email !== undefined) {
        fields.push("email = ?");
        values.push(data.email || null);
      }
      if (data.taxId !== undefined) {
        fields.push("tax_id = ?");
        values.push(data.taxId || null);
      }
      if (data.address !== undefined) {
        fields.push("address = ?");
        values.push(data.address || null);
      }
      if (data.city !== undefined) {
        fields.push("city = ?");
        values.push(data.city || null);
      }
      if (data.state !== undefined) {
        fields.push("state = ?");
        values.push(data.state || null);
      }
      if (data.zipCode !== undefined) {
        fields.push("zip_code = ?");
        values.push(data.zipCode || null);
      }
      if (data.creditLimit !== undefined) {
        fields.push("credit_limit = ?");
        values.push(data.creditLimit || null);
      }
      if (data.creditDays !== undefined) {
        fields.push("credit_days = ?");
        values.push(data.creditDays || null);
      }
      if (data.notes !== undefined) {
        fields.push("notes = ?");
        values.push(data.notes || null);
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
    async (
      id: string,
      cascade?: boolean,
      restoreStock?: boolean
    ): Promise<void> => {
      const now = new Date().toISOString();
      const shouldCascade = cascade ?? false;
      const shouldRestoreStock = restoreStock ?? false;
      await db.writeTransaction(async (tx) => {
        if (shouldCascade) {
          if (shouldRestoreStock) {
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
          const saleInvoicesRes = await tx.execute(`SELECT id FROM sale_invoices WHERE customer_id = ?`, [id]);
          if (saleInvoicesRes.rows?.length) {
              for(let i=0; i<saleInvoicesRes.rows.length; i++) {
                  const invId = saleInvoicesRes.rows.item(i).id;
                  await tx.execute(`DELETE FROM sale_invoice_items WHERE invoice_id = ?`, [invId]);
                  await tx.execute(`DELETE FROM invoice_history WHERE invoice_id = ?`, [invId]);
              }
          }
          await tx.execute(`DELETE FROM sale_invoices WHERE customer_id = ?`, [id]);
          await tx.execute(`DELETE FROM payment_ins WHERE customer_id = ?`, [id]);
          
          // ... (Estimates & Credit Notes) ...
          await tx.execute(`DELETE FROM estimate_items WHERE estimate_id IN (SELECT id FROM estimates WHERE customer_id = ?)`, [id]);
          await tx.execute(`DELETE FROM estimates WHERE customer_id = ?`, [id]);
          
          // Note: In Web, credit notes also have item/history cleanup. Simplified here for brevity but should be added.
          await tx.execute(`DELETE FROM credit_note_items WHERE credit_note_id IN (SELECT id FROM credit_notes WHERE customer_id = ?)`, [id]);
          await tx.execute(`DELETE FROM credit_notes WHERE customer_id = ?`, [id]);

          // Purchases
          const purchaseInvoicesRes = await tx.execute(`SELECT id FROM purchase_invoices WHERE customer_id = ?`, [id]);
          if (purchaseInvoicesRes.rows?.length) {
              for(let i=0; i<purchaseInvoicesRes.rows.length; i++) {
                  const invId = purchaseInvoicesRes.rows.item(i).id;
                  await tx.execute(`DELETE FROM purchase_invoice_items WHERE invoice_id = ?`, [invId]);
                  await tx.execute(`DELETE FROM invoice_history WHERE invoice_id = ?`, [invId]);
              }
          }
          await tx.execute(`DELETE FROM purchase_invoices WHERE customer_id = ?`, [id]);
          await tx.execute(`DELETE FROM payment_outs WHERE customer_id = ?`, [id]);

        } else {
            // Check if SAFE to delete (no related records)
            // Implementation detail: If not cascading, maybe throw error if related records exist?
            // "Cannot delete customer with associated records."
             const salesCount = (await tx.execute(`SELECT COUNT(*) as c FROM sale_invoices WHERE customer_id = ?`, [id])).rows?.item(0).c;
             if (salesCount > 0) throw new Error("Cannot delete customer with existing sales. Use cascade delete.");
             
             // ... checks for other tables ...
        }

        // Delete customer
        await tx.execute("DELETE FROM customers WHERE id = ?", [id]);
      });
    },
    [db]
  );

  return { createCustomer, updateCustomer, deleteCustomer };
}

export function useCustomerStats() {
  const { data: totalCustomers } = useQuery<{ count: number }>(
    "SELECT COUNT(*) as count FROM customers WHERE type IN ('customer', 'both') AND is_active = 1"
  );

  const { data: totalSuppliers } = useQuery<{ count: number }>(
    "SELECT COUNT(*) as count FROM customers WHERE type IN ('supplier', 'both') AND is_active = 1"
  );

  const { data: totalReceivable } = useQuery<{ sum: number }>(
    "SELECT COALESCE(SUM(current_balance), 0) as sum FROM customers WHERE type IN ('customer', 'both') AND current_balance > 0"
  );

  const { data: totalPayable } = useQuery<{ sum: number }>(
    "SELECT COALESCE(ABS(SUM(current_balance)), 0) as sum FROM customers WHERE type IN ('supplier', 'both') AND current_balance < 0"
  );

  return {
    totalCustomers: totalCustomers?.[0]?.count ?? 0,
    totalSuppliers: totalSuppliers?.[0]?.count ?? 0,
    totalReceivable: totalReceivable?.[0]?.sum ?? 0,
    totalPayable: totalPayable?.[0]?.sum ?? 0,
  };
}
