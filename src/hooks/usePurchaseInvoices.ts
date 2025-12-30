import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { PurchaseInvoice, PurchaseInvoiceItem } from "@/features/purchases/types";

// Database row types (snake_case columns from SQLite)
interface PurchaseInvoiceRow {
  id: string;
  invoice_number: string;
  supplier_invoice_number: string | null;
  customer_id: string;
  customer_name: string;
  date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PurchaseInvoiceItemRow {
  id: string;
  invoice_id: string;
  item_id: string | null;
  item_name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  amount: number;
}

function mapRowToPurchaseInvoice(row: PurchaseInvoiceRow): PurchaseInvoice {
  const invoice: PurchaseInvoice = {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    dueDate: row.due_date,
    status: row.status as PurchaseInvoice["status"],
    items: [], // Will be populated by usePurchaseInvoiceById
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    discountAmount: row.discount_amount,
    total: row.total,
    amountPaid: row.amount_paid,
    amountDue: row.amount_due,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.supplier_invoice_number) invoice.supplierInvoiceNumber = row.supplier_invoice_number;
  if (row.notes) invoice.notes = row.notes;

  return invoice;
}

function mapRowToPurchaseInvoiceItem(row: PurchaseInvoiceItemRow): PurchaseInvoiceItem {
  const item: PurchaseInvoiceItem = {
    id: row.id,
    itemId: row.item_id ?? "",
    itemName: row.item_name,
    quantity: row.quantity,
    unit: row.unit ?? "pcs",
    unitPrice: row.unit_price,
    amount: row.amount,
  };

  if (row.description) item.description = row.description;
  if (row.discount_percent) item.discountPercent = row.discount_percent;
  if (row.tax_percent) item.taxPercent = row.tax_percent;

  return item;
}

export function usePurchaseInvoices(filters?: {
  status?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): { invoices: PurchaseInvoice[]; isLoading: boolean; error: Error | undefined } {
  const params = useMemo(() => {
    const statusFilter = filters?.status ?? null;
    const supplierFilter = filters?.supplierId ?? null;
    const dateFromFilter = filters?.dateFrom ?? null;
    const dateToFilter = filters?.dateTo ?? null;
    const searchFilter = filters?.search ? `%${filters.search}%` : null;
    return [statusFilter, supplierFilter, dateFromFilter, dateToFilter, searchFilter];
  }, [filters?.status, filters?.supplierId, filters?.dateFrom, filters?.dateTo, filters?.search]);

  const { data, isLoading, error } = useQuery<PurchaseInvoiceRow>(
    `SELECT * FROM purchase_invoices
     WHERE ($1 IS NULL OR status = $1)
     AND ($2 IS NULL OR customer_id = $2)
     AND ($3 IS NULL OR date >= $3)
     AND ($4 IS NULL OR date <= $4)
     AND ($5 IS NULL OR invoice_number LIKE $5 OR customer_name LIKE $5)
     ORDER BY date DESC, created_at DESC`,
    params
  );

  const invoices = useMemo(() => data.map(mapRowToPurchaseInvoice), [data]);

  return { invoices, isLoading, error };
}

export function usePurchaseInvoiceById(id: string | null): {
  invoice: PurchaseInvoice | null;
  items: PurchaseInvoiceItem[];
  isLoading: boolean;
} {
  const { data: invoiceData, isLoading: invoiceLoading } = useQuery<PurchaseInvoiceRow>(
    id
      ? `SELECT * FROM purchase_invoices WHERE id = ?`
      : `SELECT * FROM purchase_invoices WHERE 1 = 0`,
    id ? [id] : []
  );

  const { data: itemsData, isLoading: itemsLoading } = useQuery<PurchaseInvoiceItemRow>(
    id
      ? `SELECT * FROM purchase_invoice_items WHERE invoice_id = ?`
      : `SELECT * FROM purchase_invoice_items WHERE 1 = 0`,
    id ? [id] : []
  );

  const invoice = invoiceData[0] ? mapRowToPurchaseInvoice(invoiceData[0]) : null;
  const items = itemsData.map(mapRowToPurchaseInvoiceItem);

  return {
    invoice,
    items,
    isLoading: invoiceLoading || itemsLoading,
  };
}

interface PurchaseInvoiceMutations {
  createInvoice: (
    data: {
      invoiceNumber: string;
      supplierInvoiceNumber?: string;
      supplierId: string;
      supplierName: string;
      date: string;
      dueDate: string;
      status?: string;
      discountAmount?: number;
      notes?: string;
    },
    items: Omit<PurchaseInvoiceItem, "id" | "invoiceId">[]
  ) => Promise<string>;
  updateInvoiceStatus: (id: string, status: string) => Promise<void>;
  recordPayment: (id: string, amount: number) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

export function usePurchaseInvoiceMutations(): PurchaseInvoiceMutations {
  const db = getPowerSyncDatabase();

  const createInvoice = useCallback(
    async (
      data: {
        invoiceNumber: string;
        supplierInvoiceNumber?: string;
        supplierId: string;
        supplierName: string;
        date: string;
        dueDate: string;
        status?: string;
        discountAmount?: number;
        notes?: string;
      },
      items: Omit<PurchaseInvoiceItem, "id" | "invoiceId">[]
    ): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      await db.execute(
        `INSERT INTO purchase_invoices (
          id, invoice_number, supplier_invoice_number, customer_id, customer_name,
          date, due_date, status, subtotal, tax_amount, discount_amount, total,
          amount_paid, amount_due, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.invoiceNumber,
          data.supplierInvoiceNumber ?? null,
          data.supplierId,
          data.supplierName,
          data.date,
          data.dueDate,
          data.status ?? "draft",
          subtotal,
          taxAmount,
          data.discountAmount ?? 0,
          total,
          0,
          total,
          data.notes ?? null,
          now,
          now,
        ]
      );

      for (const item of items) {
        const itemId = crypto.randomUUID();
        await db.execute(
          `INSERT INTO purchase_invoice_items (
            id, invoice_id, item_id, item_name, description, quantity, unit,
            unit_price, discount_percent, tax_percent, amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            id,
            item.itemId,
            item.itemName,
            item.description ?? null,
            item.quantity,
            item.unit,
            item.unitPrice,
            item.discountPercent ?? 0,
            item.taxPercent ?? 0,
            item.amount,
          ]
        );

        // Update stock for each item
        if (item.itemId) {
          await db.execute(
            `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
            [item.quantity, now, item.itemId]
          );
        }
      }

      // Update supplier balance (increase payable)
      await db.execute(
        `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
        [total, now, data.supplierId]
      );

      return id;
    },
    [db]
  );

  const updateInvoiceStatus = useCallback(
    async (id: string, status: string): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(`UPDATE purchase_invoices SET status = ?, updated_at = ? WHERE id = ?`, [
        status,
        now,
        id,
      ]);
    },
    [db]
  );

  const recordPayment = useCallback(
    async (id: string, amount: number): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE purchase_invoices
         SET amount_paid = amount_paid + ?,
             amount_due = amount_due - ?,
             status = CASE WHEN amount_due - ? <= 0 THEN 'paid' ELSE status END,
             updated_at = ?
         WHERE id = ?`,
        [amount, amount, amount, now, id]
      );
    },
    [db]
  );

  const deleteInvoice = useCallback(
    async (id: string): Promise<void> => {
      const now = new Date().toISOString();

      // Get invoice details to reverse balance
      const invoiceResult = await db.execute(
        `SELECT customer_id, total FROM purchase_invoices WHERE id = ?`,
        [id]
      );
      const invoice = invoiceResult.rows?._array?.[0] as { customer_id: string; total: number } | undefined;

      // Get items to reverse stock
      const itemsResult = await db.execute(
        `SELECT item_id, quantity FROM purchase_invoice_items WHERE invoice_id = ?`,
        [id]
      );
      const items = (itemsResult.rows?._array ?? []) as { item_id: string; quantity: number }[];

      // Get linked payments to delete and reverse
      const paymentsResult = await db.execute(
        `SELECT id, amount FROM payment_outs WHERE invoice_id = ?`,
        [id]
      );
      const payments = (paymentsResult.rows?._array ?? []) as { id: string; amount: number }[];

      // Reverse supplier balance for each payment (payments increased balance, so decrease it back)
      for (const payment of payments) {
        if (invoice) {
          await db.execute(
            `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
            [payment.amount, now, invoice.customer_id]
          );
        }
      }

      // Delete linked payments
      await db.execute(`DELETE FROM payment_outs WHERE invoice_id = ?`, [id]);

      // Reverse stock for each item (decrease - we're undoing the purchase)
      for (const item of items) {
        if (item.item_id) {
          await db.execute(
            `UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?`,
            [item.quantity, now, item.item_id]
          );
        }
      }

      // Reverse supplier balance (increase - we're undoing the payable)
      if (invoice) {
        await db.execute(
          `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
          [invoice.total, now, invoice.customer_id]
        );
      }

      await db.execute(`DELETE FROM purchase_invoice_items WHERE invoice_id = ?`, [id]);
      await db.execute(`DELETE FROM purchase_invoices WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createInvoice,
    updateInvoiceStatus,
    recordPayment,
    deleteInvoice,
  };
}

interface PurchaseInvoiceStats {
  totalPurchases: number;
  totalPayable: number;
  returnedCount: number;
  thisMonthPurchases: number;
}

export function usePurchaseInvoiceStats(): PurchaseInvoiceStats {
  const { data: totalPurchases } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum FROM purchase_invoices WHERE status != 'returned'`
  );

  const { data: totalPayable } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount_due), 0) as sum FROM purchase_invoices WHERE status IN ('draft', 'ordered', 'received') AND amount_due > 0`
  );

  const { data: returnedCount } = useQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM purchase_invoices WHERE status = 'returned'`
  );

  const { data: thisMonthPurchases } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum FROM purchase_invoices
     WHERE status != 'returned'
     AND date >= date('now', 'start of month')`
  );

  return {
    totalPurchases: totalPurchases[0]?.sum ?? 0,
    totalPayable: totalPayable[0]?.sum ?? 0,
    returnedCount: returnedCount[0]?.count ?? 0,
    thisMonthPurchases: thisMonthPurchases[0]?.sum ?? 0,
  };
}

export interface PurchaseInvoiceLinkedItems {
  itemsCount: number;
  paymentsCount: number;
}

export function usePurchaseInvoiceLinkedItems(invoiceId: string | null): PurchaseInvoiceLinkedItems {
  const { data: itemsCount } = useQuery<{ count: number }>(
    invoiceId
      ? `SELECT COUNT(*) as count FROM purchase_invoice_items WHERE invoice_id = ?`
      : `SELECT 0 as count`,
    invoiceId ? [invoiceId] : []
  );

  const { data: paymentsCount } = useQuery<{ count: number }>(
    invoiceId
      ? `SELECT COUNT(*) as count FROM payment_outs WHERE invoice_id = ?`
      : `SELECT 0 as count`,
    invoiceId ? [invoiceId] : []
  );

  return {
    itemsCount: itemsCount[0]?.count ?? 0,
    paymentsCount: paymentsCount[0]?.count ?? 0,
  };
}
