import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { SaleInvoiceRecord, SaleInvoiceItemRecord } from "../lib/powersync";
import { useAuth } from "../contexts/AuthContext";

export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled" | "partial";

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  invoiceName?: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate?: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  terms?: string;
  transportName?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
  createdAt: string;
  updatedAt: string;
  items?: SaleInvoiceItem[];
}

export interface SaleInvoiceItem {
  id: string;
  invoiceId: string;
  itemId: string;
  itemName: string;
  description?: string;
  batchNumber?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  mrp?: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  invoiceName?: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate?: string;
  status?: InvoiceStatus;
  discountAmount?: number;
  notes?: string;
  terms?: string;
  transportName?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
  initialAmountPaid?: number;
  initialPaymentStatus?: string;
  initialPaymentMode?: string;
  initialBankAccountId?: string;
  initialChequeNumber?: string;
  initialChequeBankName?: string;
  initialChequeDueDate?: string;
}

function mapRowToSaleInvoice(row: SaleInvoiceRecord): SaleInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    dueDate: row.due_date || undefined,
    status: row.status as InvoiceStatus,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    discountAmount: row.discount_amount,
    total: row.total,
    amountPaid: row.amount_paid,
    amountDue: row.amount_due,
    notes: row.notes || undefined,
    terms: row.terms || undefined,
    transportName: row.transport_name || undefined,
    deliveryDate: row.delivery_date || undefined,
    deliveryLocation: row.delivery_location || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToSaleInvoiceItem(row: SaleInvoiceItemRecord): SaleInvoiceItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    itemId: row.item_id || "",
    itemName: row.item_name,
    description: row.description || undefined,
    batchNumber: row.batch_number || undefined,
    quantity: row.quantity,
    unit: row.unit || "unit",
    unitPrice: row.unit_price,
    mrp: row.mrp || undefined,
    discountPercent: row.discount_percent,
    taxPercent: row.tax_percent,
    amount: row.amount,
  };
}

export function useSaleInvoices(filters?: {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): { invoices: SaleInvoice[]; isLoading: boolean; error: Error | null } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.status) {
      conditions.push("status = ?");
      params.push(filters.status);
    }

    if (filters?.customerId) {
      conditions.push("customer_id = ?");
      params.push(filters.customerId);
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
      query: `SELECT * FROM sale_invoices ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [
    filters?.status,
    filters?.customerId,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<SaleInvoiceRecord>(query, params);

  const invoices = useMemo(() => (data || []).map(mapRowToSaleInvoice), [data]);

  return { invoices, isLoading, error: error };
}

export function useSaleInvoiceById(id: string | null): {
  invoice: SaleInvoice | null;
  items: SaleInvoiceItem[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: invoiceData, isLoading: invoiceLoading, error: invoiceError } = useQuery<SaleInvoiceRecord>(
    id ? `SELECT * FROM sale_invoices WHERE id = ?` : `SELECT * FROM sale_invoices WHERE 1 = 0`,
    id ? [id] : []
  );

  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useQuery<SaleInvoiceItemRecord>(
    id ? `SELECT * FROM sale_invoice_items WHERE invoice_id = ?` : `SELECT * FROM sale_invoice_items WHERE 1 = 0`,
    id ? [id] : []
  );

  const invoice = invoiceData?.[0] ? mapRowToSaleInvoice(invoiceData[0]) : null;
  const items = useMemo(() => (itemsData || []).map(mapRowToSaleInvoiceItem), [itemsData]);

  return {
    invoice,
    items,
    isLoading: invoiceLoading || itemsLoading,
    error: (invoiceError || itemsError),
  };
}

export function useSaleInvoiceMutations() {
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
          "sale",
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
      data: InvoiceFormData,
      items: Omit<SaleInvoiceItem, "id" | "invoiceId">[]
    ): Promise<string> => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      const now = new Date().toISOString();

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      await db.writeTransaction(async (tx) => {
        // 1. Insert Invoice Header
        await tx.execute(
          `INSERT INTO sale_invoices (
            id, invoice_number, customer_id, customer_name, date, due_date, status,
            subtotal, tax_amount, discount_amount, total, amount_paid, amount_due,
            notes, terms, transport_name, delivery_date, delivery_location, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.invoiceNumber,
            data.customerId,
            data.customerName,
            data.date,
            data.dueDate || data.date,
            data.status || "draft",
            subtotal,
            taxAmount,
            data.discountAmount || 0,
            total,
            data.initialAmountPaid || 0,
            total - (data.initialAmountPaid || 0),
            data.notes || null,
            data.terms || null,
            data.transportName || null,
            data.deliveryDate || null,
            data.deliveryLocation || null,
            now,
            now,
          ]
        );

        // 2. Insert line items and update stock
        for (const item of items) {
          const itemId = Date.now().toString() + Math.random().toString(36).substring(7);
          await tx.execute(
            `INSERT INTO sale_invoice_items (
                id, invoice_id, item_id, item_name, description, batch_number, quantity, unit,
                unit_price, mrp, discount_percent, tax_percent, amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              id,
              item.itemId,
              item.itemName,
              item.description || null,
              item.batchNumber || null,
              item.quantity,
              item.unit,
              item.unitPrice,
              item.mrp || null,
              item.discountPercent || 0,
              item.taxPercent || 0,
              item.amount,
            ]
          );

          if (item.itemId) {
            await tx.execute(
              `UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?`,
              [item.quantity, now, item.itemId]
            );
          }
        }

        // 3. Update customer balance
        await tx.execute(
          `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
          [total, now, data.customerId]
        );

        // 4. Log history
        await addHistoryEntry(
          {
            invoiceId: id,
            action: "created",
            description: `Invoice ${data.invoiceNumber} created`,
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
