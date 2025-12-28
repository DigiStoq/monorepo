import { useQuery } from "@powersync/react";
import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { SaleInvoice, SaleInvoiceItem, InvoiceFormData } from "@/features/sales/types";

// Database row types (snake_case columns from SQLite)
interface SaleInvoiceRow {
  id: string;
  invoice_number: string;
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
  terms: string | null;
  created_at: string;
  updated_at: string;
}

interface SaleInvoiceItemRow {
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

function mapRowToSaleInvoice(row: SaleInvoiceRow): SaleInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
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
    terms: row.terms ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToSaleInvoiceItem(row: SaleInvoiceItemRow): SaleInvoiceItem {
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

export function useSaleInvoices(filters?: {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): { invoices: SaleInvoice[]; isLoading: boolean; error: Error | undefined } {
  const statusFilter = filters?.status ?? null;
  const customerFilter = filters?.customerId ?? null;
  const dateFromFilter = filters?.dateFrom ?? null;
  const dateToFilter = filters?.dateTo ?? null;
  const searchFilter = filters?.search ? `%${filters.search}%` : null;

  const { data, isLoading, error } = useQuery<SaleInvoiceRow>(
    `SELECT * FROM sale_invoices
     WHERE ($1 IS NULL OR status = $1)
     AND ($2 IS NULL OR customer_id = $2)
     AND ($3 IS NULL OR date >= $3)
     AND ($4 IS NULL OR date <= $4)
     AND ($5 IS NULL OR invoice_number LIKE $5 OR customer_name LIKE $5)
     ORDER BY date DESC, created_at DESC`,
    [statusFilter, customerFilter, dateFromFilter, dateToFilter, searchFilter]
  );

  const invoices = data.map(mapRowToSaleInvoice);

  return { invoices, isLoading, error };
}

export function useSaleInvoiceById(id: string | null): {
  invoice: SaleInvoice | null;
  items: SaleInvoiceItem[];
  isLoading: boolean;
} {
  const { data: invoiceData, isLoading: invoiceLoading } = useQuery<SaleInvoiceRow>(
    id ? `SELECT * FROM sale_invoices WHERE id = ?` : `SELECT * FROM sale_invoices WHERE 1 = 0`,
    id ? [id] : []
  );

  const { data: itemsData, isLoading: itemsLoading } = useQuery<SaleInvoiceItemRow>(
    id
      ? `SELECT * FROM sale_invoice_items WHERE invoice_id = ?`
      : `SELECT * FROM sale_invoice_items WHERE 1 = 0`,
    id ? [id] : []
  );

  const invoice = invoiceData[0] ? mapRowToSaleInvoice(invoiceData[0]) : null;
  const items = itemsData.map(mapRowToSaleInvoiceItem);

  return {
    invoice,
    items,
    isLoading: invoiceLoading || itemsLoading,
  };
}

interface SaleInvoiceMutations {
  createInvoice: (
    data: InvoiceFormData,
    items: Omit<SaleInvoiceItem, "id" | "invoiceId">[]
  ) => Promise<string>;
  updateInvoiceStatus: (id: string, status: string) => Promise<void>;
  recordPayment: (id: string, amount: number) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

export function useSaleInvoiceMutations(): SaleInvoiceMutations {
  const db = getPowerSyncDatabase();

  const createInvoice = useCallback(
    async (
      data: InvoiceFormData,
      items: Omit<SaleInvoiceItem, "id" | "invoiceId">[]
    ): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      await db.execute(
        `INSERT INTO sale_invoices (
          id, invoice_number, customer_id, customer_name, date, due_date, status,
          subtotal, tax_amount, discount_amount, total, amount_paid, amount_due,
          notes, terms, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.invoiceNumber,
          data.customerId,
          data.customerName,
          data.date,
          data.dueDate,
          data.status ?? "draft",
          subtotal,
          taxAmount,
          data.discountAmount ?? 0,
          total,
          0, // amount_paid
          total, // amount_due
          data.notes ?? null,
          data.terms ?? null,
          now,
          now,
        ]
      );

      // Insert line items
      for (const item of items) {
        const itemId = crypto.randomUUID();
        await db.execute(
          `INSERT INTO sale_invoice_items (
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
      }

      return id;
    },
    [db]
  );

  const updateInvoiceStatus = useCallback(
    async (id: string, status: string): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(`UPDATE sale_invoices SET status = ?, updated_at = ? WHERE id = ?`, [
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
        `UPDATE sale_invoices
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
      await db.execute(`DELETE FROM sale_invoice_items WHERE invoice_id = ?`, [id]);
      await db.execute(`DELETE FROM sale_invoices WHERE id = ?`, [id]);
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

interface SaleInvoiceStats {
  totalSales: number;
  totalReceivable: number;
  overdueCount: number;
  thisMonthSales: number;
}

export function useSaleInvoiceStats(): SaleInvoiceStats {
  const { data: totalSales } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum FROM sale_invoices WHERE status != 'cancelled'`
  );

  const { data: totalReceivable } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount_due), 0) as sum FROM sale_invoices WHERE status IN ('sent', 'partial', 'overdue')`
  );

  const { data: overdueCount } = useQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM sale_invoices WHERE status = 'overdue'`
  );

  const { data: thisMonthSales } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum FROM sale_invoices
     WHERE status != 'cancelled'
     AND date >= date('now', 'start of month')`
  );

  return {
    totalSales: totalSales[0]?.sum ?? 0,
    totalReceivable: totalReceivable[0]?.sum ?? 0,
    overdueCount: overdueCount[0]?.count ?? 0,
    thisMonthSales: thisMonthSales[0]?.sum ?? 0,
  };
}
