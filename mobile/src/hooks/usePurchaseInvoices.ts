import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { PurchaseInvoiceRecord, PurchaseInvoiceItemRecord } from "../lib/powersync";
import { useAuth } from "../contexts/AuthContext";

export type PurchaseInvoiceStatus = "draft" | "ordered" | "received" | "paid" | "partial" | "cancelled" | "overdue";

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string;
  customerId: string; // Used for supplier ID
  customerName: string; // Used for supplier name
  date: string;
  dueDate: string;
  status: PurchaseInvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseInvoiceItem[];
}

export interface PurchaseInvoiceItem {
  id: string;
  invoiceId: string;
  itemId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
}

function mapRowToPurchaseInvoice(row: PurchaseInvoiceRecord): PurchaseInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    supplierInvoiceNumber: row.supplier_invoice_number || undefined,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    dueDate: row.due_date,
    status: row.status as PurchaseInvoiceStatus,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    discountAmount: row.discount_amount,
    total: row.total,
    amountPaid: row.amount_paid,
    amountDue: row.amount_due,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToPurchaseInvoiceItem(row: PurchaseInvoiceItemRecord): PurchaseInvoiceItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    itemId: row.item_id || undefined,
    itemName: row.item_name,
    description: row.description || undefined,
    quantity: row.quantity,
    unit: row.unit || "pcs",
    unitPrice: row.unit_price,
    discountPercent: row.discount_percent,
    taxPercent: row.tax_percent,
    amount: row.amount,
  };
}

export function usePurchaseInvoices(filters?: {
  status?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): { invoices: PurchaseInvoice[]; isLoading: boolean; error: Error | null } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.status) {
      conditions.push("status = ?");
      params.push(filters.status);
    }

    if (filters?.supplierId) {
      conditions.push("customer_id = ?");
      params.push(filters.supplierId);
    }

    if (filters?.dateFrom) {
      conditions.push("date >= ?");
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      conditions.push("date <= ?");
      params.push(filters.dateTo);
    }

    if (filters?.search) {
      conditions.push("(invoice_number LIKE ? OR customer_name LIKE ?)");
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM purchase_invoices ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [
    filters?.status,
    filters?.supplierId,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<PurchaseInvoiceRecord>(query, params);

  const invoices = useMemo(() => (data || []).map(mapRowToPurchaseInvoice), [data]);

  return { invoices, isLoading, error: error };
}

export function usePurchaseInvoiceById(id: string | null): {
  invoice: PurchaseInvoice | null;
  items: PurchaseInvoiceItem[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: invoiceData, isLoading: invoiceLoading, error: invoiceError } = useQuery<PurchaseInvoiceRecord>(
    id ? `SELECT * FROM purchase_invoices WHERE id = ?` : `SELECT * FROM purchase_invoices WHERE 1 = 0`,
    id ? [id] : []
  );

  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useQuery<PurchaseInvoiceItemRecord>(
    id ? `SELECT * FROM purchase_invoice_items WHERE invoice_id = ?` : `SELECT * FROM purchase_invoice_items WHERE 1 = 0`,
    id ? [id] : []
  );

  const invoice = invoiceData?.[0] ? mapRowToPurchaseInvoice(invoiceData[0]) : null;
  const items = useMemo(() => (itemsData || []).map(mapRowToPurchaseInvoiceItem), [itemsData]);

  return {
    invoice,
    items,
    isLoading: invoiceLoading || itemsLoading,
    error: (invoiceError || itemsError),
  };
}

export function usePurchaseInvoiceMutations() {
  const db = getPowerSyncDatabase();
  const { user } = useAuth();

  const addHistoryEntry = useCallback(
    async (
      entry: {
        invoiceId: string;
        action: string;
        description: string;
        oldValues?: Record<string, unknown>;
        newValues?: Record<string, unknown>;
      },
      tx?: any
    ) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();
      const userId = user?.id ?? null;
      const userName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Unknown User";

      const executor = tx ?? db;
      await executor.execute(
        `INSERT INTO invoice_history (
          id, invoice_id, invoice_type, action, description,
          old_values, new_values, user_id, user_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          entry.invoiceId,
          "purchase",
          entry.action,
          entry.description,
          entry.oldValues ? JSON.stringify(entry.oldValues) : null,
          entry.newValues ? JSON.stringify(entry.newValues) : null,
          userId,
          userName,
          now,
        ]
      );
    },
    [db, user]
  );

  const createInvoice = useCallback(
    async (
      data: {
        invoiceNumber: string;
        supplierInvoiceNumber?: string;
        supplierId: string;
        supplierName: string;
        date: string;
        dueDate: string;
        status?: PurchaseInvoiceStatus;
        discountAmount?: number;
        notes?: string;
        initialAmountPaid?: number;
      },
      items: Omit<PurchaseInvoiceItem, "id" | "invoiceId">[]
    ): Promise<string> => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount || 0);

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO purchase_invoices (
            id, invoice_number, supplier_invoice_number, customer_id, customer_name,
            date, due_date, status, subtotal, tax_amount, discount_amount, total,
            amount_paid, amount_due, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.invoiceNumber,
            data.supplierInvoiceNumber || null,
            data.supplierId,
            data.supplierName,
            data.date,
            data.dueDate,
            data.status || "draft",
            subtotal,
            taxAmount,
            data.discountAmount || 0,
            total,
            data.initialAmountPaid || 0,
            total - (data.initialAmountPaid || 0),
            data.notes || null,
            now,
            now,
          ]
        );

        const shouldUpdateStockAndBalance = data.status === "received" || data.status === "paid";

        for (const item of items) {
          const itemId = Date.now().toString() + Math.random().toString(36).substring(7);
          await tx.execute(
            `INSERT INTO purchase_invoice_items (
              id, invoice_id, item_id, item_name, description, quantity, unit,
              unit_price, discount_percent, tax_percent, amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              id,
              item.itemId || null,
              item.itemName,
              item.description || null,
              item.quantity,
              item.unit || "pcs",
              item.unitPrice,
              item.discountPercent || 0,
              item.taxPercent || 0,
              item.amount,
            ]
          );

          if (item.itemId && shouldUpdateStockAndBalance) {
            await tx.execute(
              `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
              [item.quantity, now, item.itemId]
            );
          }
        }

        if (shouldUpdateStockAndBalance) {
          await tx.execute(
            `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
            [total, now, data.supplierId]
          );
        }

        await addHistoryEntry(
          {
            invoiceId: id,
            action: "created",
            description: `Purchase invoice ${data.invoiceNumber} created`,
          },
          tx
        );
      });

      return id;
    },
    [db, addHistoryEntry]
  );

  return { createInvoice };
}
