import { useQuery } from "@powersync/react";
import { useCallback } from "react";
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
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    supplierInvoiceNumber: row.supplier_invoice_number ?? undefined,
    supplierId: row.customer_id,
    supplierName: row.customer_name,
    date: row.date,
    dueDate: row.due_date,
    status: row.status,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    discountAmount: row.discount_amount,
    total: row.total,
    amountPaid: row.amount_paid,
    amountDue: row.amount_due,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToPurchaseInvoiceItem(row: PurchaseInvoiceItemRow): PurchaseInvoiceItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    itemId: row.item_id ?? undefined,
    itemName: row.item_name,
    description: row.description ?? undefined,
    quantity: row.quantity,
    unit: row.unit ?? undefined,
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
}): { invoices: PurchaseInvoice[]; isLoading: boolean; error: Error | undefined } {
  const statusFilter = filters?.status ?? null;
  const supplierFilter = filters?.supplierId ?? null;
  const dateFromFilter = filters?.dateFrom ?? null;
  const dateToFilter = filters?.dateTo ?? null;
  const searchFilter = filters?.search ? `%${filters.search}%` : null;

  const { data, isLoading, error } = useQuery<PurchaseInvoiceRow>(
    `SELECT * FROM purchase_invoices
     WHERE ($1 IS NULL OR status = $1)
     AND ($2 IS NULL OR customer_id = $2)
     AND ($3 IS NULL OR date >= $3)
     AND ($4 IS NULL OR date <= $4)
     AND ($5 IS NULL OR invoice_number LIKE $5 OR customer_name LIKE $5)
     ORDER BY date DESC, created_at DESC`,
    [statusFilter, supplierFilter, dateFromFilter, dateToFilter, searchFilter]
  );

  const invoices = data.map(mapRowToPurchaseInvoice);

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
             status = CASE WHEN amount_due - ? <= 0 THEN 'paid' ELSE 'partial' END,
             updated_at = ?
         WHERE id = ?`,
        [amount, amount, amount, now, id]
      );
    },
    [db]
  );

  const deleteInvoice = useCallback(
    async (id: string): Promise<void> => {
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
  overdueCount: number;
  thisMonthPurchases: number;
}

export function usePurchaseInvoiceStats(): PurchaseInvoiceStats {
  const { data: totalPurchases } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum FROM purchase_invoices WHERE status != 'cancelled'`
  );

  const { data: totalPayable } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount_due), 0) as sum FROM purchase_invoices WHERE status IN ('received', 'partial', 'overdue')`
  );

  const { data: overdueCount } = useQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM purchase_invoices WHERE status = 'overdue'`
  );

  const { data: thisMonthPurchases } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum FROM purchase_invoices
     WHERE status != 'cancelled'
     AND date >= date('now', 'start of month')`
  );

  return {
    totalPurchases: totalPurchases[0]?.sum ?? 0,
    totalPayable: totalPayable[0]?.sum ?? 0,
    overdueCount: overdueCount[0]?.count ?? 0,
    thisMonthPurchases: thisMonthPurchases[0]?.sum ?? 0,
  };
}
