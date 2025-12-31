import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import { useAuthStore } from "@/stores/auth-store";
import type {
  SaleInvoice,
  SaleInvoiceItem,
  InvoiceFormData,
} from "@/features/sales/types";

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
  const invoice: SaleInvoice = {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    dueDate: row.due_date,
    status: row.status as SaleInvoice["status"],
    items: [], // Will be populated by useSaleInvoiceById
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    discountAmount: row.discount_amount,
    total: row.total,
    amountPaid: row.amount_paid,
    amountDue: row.amount_due,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Add optional fields only if they have values
  if (row.notes) invoice.notes = row.notes;
  if (row.terms) invoice.terms = row.terms;

  return invoice;
}

function mapRowToSaleInvoiceItem(row: SaleInvoiceItemRow): SaleInvoiceItem {
  const item: SaleInvoiceItem = {
    id: row.id,
    itemId: row.item_id ?? "",
    itemName: row.item_name,
    quantity: row.quantity,
    unit: row.unit ?? "pcs",
    unitPrice: row.unit_price,
    discountPercent: row.discount_percent,
    taxPercent: row.tax_percent,
    amount: row.amount,
  };

  // Add optional fields only if they have values
  if (row.description) item.description = row.description;

  return item;
}

export function useSaleInvoices(filters?: {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): { invoices: SaleInvoice[]; isLoading: boolean; error: Error | undefined } {
  const params = useMemo(() => {
    const statusFilter = filters?.status ?? null;
    const customerFilter = filters?.customerId ?? null;
    const dateFromFilter = filters?.dateFrom ?? null;
    const dateToFilter = filters?.dateTo ?? null;
    const searchFilter = filters?.search ? `%${filters.search}%` : null;
    return [
      statusFilter,
      customerFilter,
      dateFromFilter,
      dateToFilter,
      searchFilter,
    ];
  }, [
    filters?.status,
    filters?.customerId,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<SaleInvoiceRow>(
    `SELECT * FROM sale_invoices
     WHERE ($1 IS NULL OR status = $1)
     AND ($2 IS NULL OR customer_id = $2)
     AND ($3 IS NULL OR date >= $3)
     AND ($4 IS NULL OR date <= $4)
     AND ($5 IS NULL OR invoice_number LIKE $5 OR customer_name LIKE $5)
     ORDER BY date DESC, created_at DESC`,
    params
  );

  const invoices = useMemo(() => data.map(mapRowToSaleInvoice), [data]);

  return { invoices, isLoading, error };
}

export function useSaleInvoiceById(id: string | null): {
  invoice: SaleInvoice | null;
  items: SaleInvoiceItem[];
  isLoading: boolean;
} {
  const { data: invoiceData, isLoading: invoiceLoading } =
    useQuery<SaleInvoiceRow>(
      id
        ? `SELECT * FROM sale_invoices WHERE id = ?`
        : `SELECT * FROM sale_invoices WHERE 1 = 0`,
      id ? [id] : []
    );

  const { data: itemsData, isLoading: itemsLoading } =
    useQuery<SaleInvoiceItemRow>(
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
  updateInvoice: (
    id: string,
    data: InvoiceFormData,
    items: Omit<SaleInvoiceItem, "id" | "invoiceId">[],
    oldInvoice?: SaleInvoice
  ) => Promise<void>;
  updateInvoiceStatus: (
    id: string,
    status: string,
    oldStatus?: string,
    reason?: string
  ) => Promise<void>;
  recordPayment: (
    id: string,
    amount: number,
    paymentMode?: string
  ) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

export function useSaleInvoiceMutations(): SaleInvoiceMutations {
  const db = getPowerSyncDatabase();

  // Helper to add history entry
  const addHistoryEntry = useCallback(
    async (entry: {
      invoiceId: string;
      action: string;
      description: string;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
    }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // Get current user from auth store
      const { user } = useAuthStore.getState();
      const userId = user?.id ?? null;
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.execute(
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
    [db]
  );

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

      // Insert line items and update stock
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

        // Update stock for each item (decrease)
        if (item.itemId) {
          await db.execute(
            `UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?`,
            [item.quantity, now, item.itemId]
          );
        }
      }

      // Update customer balance (increase receivable)
      await db.execute(
        `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
        [total, now, data.customerId]
      );

      // Log history
      await addHistoryEntry({
        invoiceId: id,
        action: "created",
        description: `Invoice ${data.invoiceNumber} created for ${data.customerName}`,
        newValues: {
          total,
          status: data.status ?? "draft",
          itemCount: items.length,
        },
      });

      return id;
    },
    [db, addHistoryEntry]
  );

  const updateInvoice = useCallback(
    async (
      id: string,
      data: InvoiceFormData,
      items: Omit<SaleInvoiceItem, "id" | "invoiceId">[],
      oldInvoice?: SaleInvoice
    ): Promise<void> => {
      const now = new Date().toISOString();

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      // Update the invoice
      await db.execute(
        `UPDATE sale_invoices SET
          customer_id = ?, customer_name = ?, date = ?, due_date = ?,
          subtotal = ?, tax_amount = ?, discount_amount = ?, total = ?,
          amount_due = ?, notes = ?, terms = ?, updated_at = ?
        WHERE id = ?`,
        [
          data.customerId,
          data.customerName,
          data.date,
          data.dueDate,
          subtotal,
          taxAmount,
          data.discountAmount ?? 0,
          total,
          total - (oldInvoice?.amountPaid ?? 0),
          data.notes ?? null,
          data.terms ?? null,
          now,
          id,
        ]
      );

      // Delete old items and insert new ones
      await db.execute(`DELETE FROM sale_invoice_items WHERE invoice_id = ?`, [
        id,
      ]);

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

      // Log history with detailed changes
      const changes: string[] = [];
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};

      if (oldInvoice) {
        // Track customer change
        if (oldInvoice.customerName !== data.customerName) {
          changes.push("customer");
          oldValues.customer = oldInvoice.customerName;
          newValues.customer = data.customerName;
        }

        // Track date change
        if (oldInvoice.date !== data.date) {
          changes.push("date");
          oldValues.date = oldInvoice.date;
          newValues.date = data.date;
        }

        // Track due date change
        if (oldInvoice.dueDate !== data.dueDate) {
          changes.push("due date");
          oldValues.dueDate = oldInvoice.dueDate;
          newValues.dueDate = data.dueDate;
        }

        // Track discount change
        const oldDiscount = oldInvoice.discountAmount;
        const newDiscount = data.discountAmount ?? 0;
        if (oldDiscount !== newDiscount) {
          changes.push("discount");
          oldValues.discountAmount = oldDiscount;
          newValues.discountAmount = newDiscount;
        }

        // Track total change
        if (oldInvoice.total !== total) {
          changes.push("total");
          oldValues.total = oldInvoice.total;
          newValues.total = total;
        }

        // Track item changes
        const oldItems = oldInvoice.items;
        if (oldItems.length !== items.length) {
          changes.push(`items (${oldItems.length} → ${items.length})`);
          oldValues.itemCount = oldItems.length;
          newValues.itemCount = items.length;
        } else {
          // Check for quantity/price changes in existing items
          const itemChanges: string[] = [];
          for (const newItem of items) {
            const oldItem = oldItems.find((o) => o.itemId === newItem.itemId);
            if (oldItem) {
              if (oldItem.quantity !== newItem.quantity) {
                itemChanges.push(
                  `${newItem.itemName}: qty ${oldItem.quantity} → ${newItem.quantity}`
                );
              }
              if (oldItem.unitPrice !== newItem.unitPrice) {
                itemChanges.push(
                  `${newItem.itemName}: price ${oldItem.unitPrice} → ${newItem.unitPrice}`
                );
              }
            }
          }
          if (itemChanges.length > 0) {
            changes.push("item details");
            newValues.itemChanges = itemChanges;
          }
        }

        // Track notes change
        if ((oldInvoice.notes ?? "") !== (data.notes ?? "")) {
          changes.push("notes");
        }

        // Track terms change
        if ((oldInvoice.terms ?? "") !== (data.terms ?? "")) {
          changes.push("terms");
        }
      }

      await addHistoryEntry({
        invoiceId: id,
        action: "updated",
        description:
          changes.length > 0
            ? `Updated ${changes.join(", ")}`
            : "Invoice updated",
        ...(Object.keys(oldValues).length > 0 && { oldValues }),
        ...(Object.keys(newValues).length > 0 && { newValues }),
      });
    },
    [db, addHistoryEntry]
  );

  const updateInvoiceStatus = useCallback(
    async (
      id: string,
      status: string,
      oldStatus?: string,
      reason?: string
    ): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE sale_invoices SET status = ?, updated_at = ? WHERE id = ?`,
        [status, now, id]
      );

      // Build description with optional reason
      let description = `Status changed from ${oldStatus ?? "unknown"} to ${status}`;
      if (reason) {
        description += `. Reason: ${reason}`;
      }

      // Log history
      await addHistoryEntry({
        invoiceId: id,
        action: "status_changed",
        description,
        ...(oldStatus && { oldValues: { status: oldStatus } }),
        newValues: { status, ...(reason && { reason }) },
      });
    },
    [db, addHistoryEntry]
  );

  const recordPayment = useCallback(
    async (id: string, amount: number, paymentMode?: string): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE sale_invoices
         SET amount_paid = amount_paid + ?,
             amount_due = amount_due - ?,
             status = CASE WHEN amount_due - ? <= 0 THEN 'paid' ELSE status END,
             updated_at = ?
         WHERE id = ?`,
        [amount, amount, amount, now, id]
      );

      // Log history
      await addHistoryEntry({
        invoiceId: id,
        action: "payment_recorded",
        description: `Payment of $${amount.toFixed(2)} recorded${paymentMode ? ` via ${paymentMode}` : ""}`,
        newValues: { amount, paymentMode },
      });
    },
    [db, addHistoryEntry]
  );

  const deleteInvoice = useCallback(
    async (id: string): Promise<void> => {
      const now = new Date().toISOString();

      // Get invoice details to reverse balance
      const invoiceResult = await db.execute(
        `SELECT customer_id, total FROM sale_invoices WHERE id = ?`,
        [id]
      );
      const invoice =
        invoiceResult.rows?._array && invoiceResult.rows._array.length > 0
          ? (invoiceResult.rows._array[0] as {
              customer_id: string;
              total: number;
            })
          : undefined;

      // Get items to reverse stock
      const itemsResult = await db.execute(
        `SELECT item_id, quantity FROM sale_invoice_items WHERE invoice_id = ?`,
        [id]
      );
      const items = (itemsResult.rows?._array ?? []) as {
        item_id: string;
        quantity: number;
      }[];

      // Get linked payments to delete and reverse
      const paymentsResult = await db.execute(
        `SELECT id, amount FROM payment_ins WHERE invoice_id = ?`,
        [id]
      );
      const payments = (paymentsResult.rows?._array ?? []) as {
        id: string;
        amount: number;
      }[];

      // Reverse customer balance for each payment (payments decreased balance, so increase it back)
      for (const payment of payments) {
        if (invoice) {
          await db.execute(
            `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
            [payment.amount, now, invoice.customer_id]
          );
        }
      }

      // Delete linked payments
      await db.execute(`DELETE FROM payment_ins WHERE invoice_id = ?`, [id]);

      // Reverse stock for each item
      for (const item of items) {
        if (item.item_id) {
          await db.execute(
            `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
            [item.quantity, now, item.item_id]
          );
        }
      }

      // Reverse customer balance
      if (invoice) {
        await db.execute(
          `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
          [invoice.total, now, invoice.customer_id]
        );
      }

      await db.execute(`DELETE FROM sale_invoice_items WHERE invoice_id = ?`, [
        id,
      ]);
      await db.execute(`DELETE FROM sale_invoices WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    recordPayment,
    deleteInvoice,
  };
}

interface SaleInvoiceStats {
  totalSales: number;
  totalReceivable: number;
  unpaidCount: number;
  thisMonthSales: number;
}

export function useSaleInvoiceStats(): SaleInvoiceStats {
  const { data: totalSales } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum FROM sale_invoices WHERE status != 'returned'`
  );

  const { data: totalReceivable } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(amount_due), 0) as sum FROM sale_invoices WHERE status = 'unpaid'`
  );

  const { data: unpaidCount } = useQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM sale_invoices WHERE status = 'unpaid'`
  );

  const { data: thisMonthSales } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(total), 0) as sum FROM sale_invoices
     WHERE status != 'returned'
     AND date >= date('now', 'start of month')`
  );

  return {
    totalSales: totalSales[0]?.sum ?? 0,
    totalReceivable: totalReceivable[0]?.sum ?? 0,
    unpaidCount: unpaidCount[0]?.count ?? 0,
    thisMonthSales: thisMonthSales[0]?.sum ?? 0,
  };
}

export interface SaleInvoiceLinkedItems {
  itemsCount: number;
  paymentsCount: number;
}

export function useSaleInvoiceLinkedItems(
  invoiceId: string | null
): SaleInvoiceLinkedItems {
  const { data: itemsCount } = useQuery<{ count: number }>(
    invoiceId
      ? `SELECT COUNT(*) as count FROM sale_invoice_items WHERE invoice_id = ?`
      : `SELECT 0 as count`,
    invoiceId ? [invoiceId] : []
  );

  const { data: paymentsCount } = useQuery<{ count: number }>(
    invoiceId
      ? `SELECT COUNT(*) as count FROM payment_ins WHERE invoice_id = ?`
      : `SELECT 0 as count`,
    invoiceId ? [invoiceId] : []
  );

  return {
    itemsCount: itemsCount[0]?.count ?? 0,
    paymentsCount: paymentsCount[0]?.count ?? 0,
  };
}
