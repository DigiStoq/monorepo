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
  invoice_name: string | null;
  customer_id: string;
  customer_name: string;
  date: string;
  due_date: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  notes: string | null;
  terms: string | null;
  transport_name: string | null;
  delivery_date: string | null;
  delivery_location: string | null;
  created_at: string;
  updated_at: string;
}

interface SaleInvoiceItemRow {
  id: string;
  invoice_id: string;
  item_id: string | null;
  item_name: string;
  description: string | null;
  batch_number: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  mrp: number | null;
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
    dueDate: row.due_date ?? undefined,
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
  if (row.invoice_name) invoice.invoiceName = row.invoice_name;
  if (row.notes) invoice.notes = row.notes;
  if (row.terms) invoice.terms = row.terms;
  if (row.transport_name) invoice.transportName = row.transport_name;
  if (row.delivery_date) invoice.deliveryDate = row.delivery_date;
  if (row.delivery_location) invoice.deliveryLocation = row.delivery_location;

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
  if (row.batch_number) item.batchNumber = row.batch_number;
  if (row.mrp !== null) item.mrp = row.mrp;

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
     AND ($5 IS NULL OR invoice_number LIKE $5 OR customer_name LIKE $5
          OR EXISTS (
            SELECT 1 FROM sale_invoice_items 
            WHERE sale_invoice_items.invoice_id = sale_invoices.id 
            AND sale_invoice_items.item_name LIKE $5
          ))
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
    items: Omit<SaleInvoiceItem, "id" | "invoiceId">[]
  ) => Promise<void>;
  updateInvoiceDetails: (
    id: string,
    updates: { invoiceName?: string; date?: string },
    oldValues?: { invoiceName?: string; date?: string }
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
    async (
      entry: {
        invoiceId: string;
        action: string;
        description: string;
        oldValues?: Record<string, unknown>;
        newValues?: Record<string, unknown>;
      },
      // Optional transaction context - use when called inside writeTransaction
      tx?: { execute: typeof db.execute }
    ) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // Get current user from auth store
      const { user } = useAuthStore.getState();
      const userId = user?.id ?? null;
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      // Use transaction context if provided, otherwise use db directly
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
    [db]
  );

  const createInvoice = useCallback(
    async (
      data: InvoiceFormData,
      items: Omit<SaleInvoiceItem, "id" | "invoiceId">[]
    ): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const today = now.split("T")[0]; // YYYY-MM-DD for comparison

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      await db.writeTransaction(async (tx) => {
        // 1. Validate Stock and Expiry for all items first
        for (const item of items) {
          if (!item.itemId) continue;

          const result = await tx.execute(
            `SELECT name, type, stock_quantity, expiry_date FROM items WHERE id = ?`,
            [item.itemId]
          );

          const dbItem = result.rows?.length ? result.rows.item(0) : null;
          if (!dbItem) continue; // Should probably throw, but let's skip validation if item somehow doesn't exist

          // Check Expiry
          if (dbItem.expiry_date && dbItem.expiry_date < today) {
            throw new Error(
              `Item "${dbItem.name}" has expired (Expiry: ${dbItem.expiry_date}). Cannot sell expired items.`
            );
          }

          // Check Stock (Only for products)
          if (
            dbItem.type === "product" &&
            dbItem.stock_quantity < item.quantity
          ) {
            throw new Error(
              `Insufficient stock for "${dbItem.name}". Available: ${dbItem.stock_quantity}, Requested: ${item.quantity}`
            );
          }
        }

        // 2. Insert Invoice Header
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
            data.dueDate ?? data.date, // Default to invoice date if not provided
            data.status ?? "draft",
            subtotal,
            taxAmount,
            data.discountAmount ?? 0,
            total,
            data.initialAmountPaid ?? 0, // amount_paid
            total - (data.initialAmountPaid ?? 0), // amount_due
            data.notes ?? null,
            data.terms ?? null,
            data.transportName ?? null,
            data.deliveryDate ?? null,
            data.deliveryLocation ?? null,
            now,
            now,
          ]
        );

        // 3. Insert line items and update stock
        for (const item of items) {
          const itemId = crypto.randomUUID();
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
              item.description ?? null,
              item.batchNumber ?? null,
              item.quantity,
              item.unit,
              item.unitPrice,
              item.mrp ?? null,
              item.discountPercent ?? 0,
              item.taxPercent ?? 0,
              item.amount,
            ]
          );

          // Update stock for each item (decrease)
          if (item.itemId) {
            await tx.execute(
              `UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?`,
              [item.quantity, now, item.itemId]
            );
          }
        }

        // 4. Update customer balance (increase receivable)
        await tx.execute(
          `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
          [total, now, data.customerId]
        );

        // 5. Log history
        await addHistoryEntry(
          {
            invoiceId: id,
            action: "created",
            description: `Invoice ${data.invoiceNumber} created for ${data.customerName}`,
            newValues: {
              total,
              status: data.status ?? "draft",
              itemCount: items.length,
            },
          },
          tx
        );

        // 6. Handle Initial Payment (if provided)
        if (
          data.initialPaymentStatus &&
          data.initialPaymentStatus !== "unpaid" &&
          data.initialAmountPaid &&
          data.initialAmountPaid > 0
        ) {
          const receiptNumber = `REC-${Date.now()}`;
          const paymentMode = data.initialPaymentMode ?? "cash";

          // Create Payment In Record
          await tx.execute(
            `INSERT INTO payment_ins (
              id, receipt_number, customer_id, customer_name, date, amount,
              payment_mode, invoice_id, invoice_number, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              crypto.randomUUID(),
              receiptNumber,
              data.customerId,
              data.customerName,
              data.date,
              data.initialAmountPaid,
              paymentMode,
              id,
              data.invoiceNumber,
              now,
              now,
            ]
          );

          // Log History for Payment
          await addHistoryEntry(
            {
              invoiceId: id,
              action: "payment_recorded",
              description: `Initial payment of ${data.initialAmountPaid} recorded via ${paymentMode}`,
              newValues: {
                amount: data.initialAmountPaid,
                mode: paymentMode,
              },
            },
            tx
          );

          // Update Customer Balance (Decrease Receivable)
          await tx.execute(
            `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
            [data.initialAmountPaid, now, data.customerId]
          );

          // Create Transaction
          if (paymentMode === "cash") {
            await tx.execute(
              `INSERT INTO cash_transactions (
                id, date, type, amount, description, category,
                related_customer_id, related_customer_name,
                related_invoice_id, related_invoice_number,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                crypto.randomUUID(),
                data.date,
                "in",
                data.initialAmountPaid,
                `Payment received for ${data.invoiceNumber}`,
                "Invoice Payment",
                data.customerId,
                data.customerName,
                id,
                data.invoiceNumber,
                now,
                now,
              ]
            );
          }

          if (paymentMode === "bank" && data.initialBankAccountId) {
            await tx.execute(
              `INSERT INTO bank_transactions (
                id, account_id, date, type, amount, description,
                related_customer_id, related_customer_name,
                related_invoice_id, related_invoice_number,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                crypto.randomUUID(),
                data.initialBankAccountId,
                data.date,
                "deposit",
                data.initialAmountPaid,
                `Payment received for ${data.invoiceNumber}`,
                data.customerId,
                data.customerName,
                id,
                data.invoiceNumber,
                now,
                now,
              ]
            );

            // Also update Bank Account Balance
            await tx.execute(
              `UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
              [data.initialAmountPaid, now, data.initialBankAccountId]
            );
          }

          if (paymentMode === "cheque" && data.initialChequeNumber) {
            await tx.execute(
              `INSERT INTO cheques (
                    id, cheque_number, type, customer_id, customer_name,
                    bank_name, date, due_date, status, amount,
                    related_invoice_id, related_invoice_number,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                crypto.randomUUID(),
                data.initialChequeNumber,
                "received",
                data.customerId,
                data.customerName,
                data.initialChequeBankName ?? "Unknown Bank",
                data.date,
                data.initialChequeDueDate ?? data.date,
                "pending",
                data.initialAmountPaid,
                id,
                data.invoiceNumber,
                now,
                now,
              ]
            );
          }
        }
      });

      return id;
    },
    [db, addHistoryEntry]
  );

  const updateInvoice = useCallback(
    async (
      id: string,
      data: InvoiceFormData,
      items: Omit<SaleInvoiceItem, "id" | "invoiceId">[]
    ): Promise<void> => {
      const now = new Date().toISOString();

      // Calculate totals client-side (Client-Authoritative)
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      // ATOMIC WRITE TRANSACTION
      await db.writeTransaction(async (tx) => {
        const today = now.split("T")[0];

        // 1. Fetch FULL old invoice state for diffing and logic
        const oldInvoiceResult = await tx.execute(
          `SELECT * FROM sale_invoices WHERE id = ?`,
          [id]
        );
        const oldRow = oldInvoiceResult.rows?.item(0) as
          | SaleInvoiceRow
          | undefined;
        if (!oldRow) throw new Error("Invoice not found");

        const oldInvoice = mapRowToSaleInvoice(oldRow);
        const amountDue = total - oldInvoice.amountPaid;

        // Fetch old items for restoration AND diffing
        const oldItemsResult = await tx.execute(
          `SELECT * FROM sale_invoice_items WHERE invoice_id = ?`,
          [id]
        );
        const oldItems: SaleInvoiceItem[] = [];
        if (oldItemsResult.rows?.length) {
          for (let i = 0; i < oldItemsResult.rows.length; i++) {
            oldItems.push(mapRowToSaleInvoiceItem(oldItemsResult.rows.item(i)));
          }
        }

        // 2. Prepare History Diff
        const changes: string[] = [];
        const oldValues: Record<string, unknown> = {};
        const newValues: Record<string, unknown> = {};

        // Helper to normalize values (treat empty string as null)
        // Helper to normalize values (treat empty string as null)
        const normalize = (
          val: string | number | boolean | null | undefined
        ): string | number | null => {
          if (val === "" || val === undefined || val === null) return null;
          if (typeof val === "boolean") return val ? 1 : 0;
          return val;
        };

        const checkField = (
          field: string,
          oldVal: string | number | boolean | null | undefined,
          newVal: string | number | boolean | null | undefined,
          label: string
        ): void => {
          const normOld = normalize(oldVal);
          const normNew = normalize(newVal);
          if (normOld !== normNew) {
            changes.push(
              `${label}: ${String(normOld ?? "none")} -> ${String(normNew ?? "none")}`
            );
            oldValues[field] = normOld;
            newValues[field] = normNew;
          }
        };

        checkField(
          "customerName",
          oldInvoice.customerName,
          data.customerName,
          "Customer"
        );
        checkField("date", oldInvoice.date, data.date, "Date");
        checkField("dueDate", oldInvoice.dueDate, data.dueDate, "Due Date");
        // Handle numbers strictly
        if (oldInvoice.discountAmount !== (data.discountAmount ?? 0)) {
          changes.push(
            `Discount: ${oldInvoice.discountAmount} -> ${data.discountAmount ?? 0}`
          );
          oldValues.discountAmount = oldInvoice.discountAmount;
          newValues.discountAmount = data.discountAmount;
        }
        if (oldInvoice.total !== total) {
          changes.push(`Total: ${oldInvoice.total} -> ${total}`);
          oldValues.total = oldInvoice.total;
          newValues.total = total;
        }
        checkField("notes", oldInvoice.notes, data.notes, "Notes");
        checkField("terms", oldInvoice.terms, data.terms, "Terms");
        checkField(
          "transportName",
          oldInvoice.transportName,
          data.transportName,
          "Transport"
        );
        checkField(
          "deliveryDate",
          oldInvoice.deliveryDate,
          data.deliveryDate,
          "Delivery Date"
        );
        checkField(
          "deliveryLocation",
          oldInvoice.deliveryLocation,
          data.deliveryLocation,
          "Delivery Loc"
        );

        // Simple Item Count/Value Diff
        if (oldItems.length !== items.length) {
          changes.push(`Items: ${oldItems.length} -> ${items.length}`);
        }

        // 3. RESTORE OLD STOCK
        for (const oldItem of oldItems) {
          if (oldItem.itemId) {
            await tx.execute(
              `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
              [oldItem.quantity, now, oldItem.itemId]
            );
          }
        }

        // 4. VALIDATE NEW ITEMS (Expiry & Stock)
        for (const item of items) {
          if (!item.itemId) continue;

          const result = await tx.execute(
            `SELECT name, type, stock_quantity, expiry_date FROM items WHERE id = ?`,
            [item.itemId]
          );

          const dbItem = result.rows?.length ? result.rows.item(0) : null;
          if (!dbItem) continue;

          // Check Expiry
          if (dbItem.expiry_date && dbItem.expiry_date < today) {
            throw new Error(
              `Item "${dbItem.name}" has expired (Expiry: ${dbItem.expiry_date}). Cannot sell expired items.`
            );
          }

          // Check Stock
          if (
            dbItem.type === "product" &&
            dbItem.stock_quantity < item.quantity
          ) {
            throw new Error(
              `Insufficient stock for "${dbItem.name}". Available: ${dbItem.stock_quantity}, Requested: ${item.quantity}`
            );
          }
        }

        // 5. UPDATE sale_invoices header
        await tx.execute(
          `UPDATE sale_invoices SET
            customer_id = ?, customer_name = ?, date = ?, due_date = ?,
            subtotal = ?, tax_amount = ?, discount_amount = ?, total = ?,
            amount_due = ?, notes = ?, terms = ?,
            transport_name = ?, delivery_date = ?, delivery_location = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            data.customerId,
            data.customerName,
            data.date,
            data.dueDate ?? null,
            subtotal,
            taxAmount,
            data.discountAmount ?? 0,
            total,
            amountDue,
            data.notes ?? null,
            data.terms ?? null,
            data.transportName ?? null,
            data.deliveryDate ?? null,
            data.deliveryLocation ?? null,
            now,
            id,
          ]
        );

        // 6. DELETE old items
        await tx.execute(
          `DELETE FROM sale_invoice_items WHERE invoice_id = ?`,
          [id]
        );

        // 7. INSERT new items and DEDUCT STOCK
        for (const item of items) {
          const itemId = crypto.randomUUID();
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
              item.description ?? null,
              item.batchNumber ?? null,
              item.quantity,
              item.unit,
              item.unitPrice,
              item.mrp ?? null,
              item.discountPercent ?? 0,
              item.taxPercent ?? 0,
              item.amount,
            ]
          );

          // Deduct stock for each item
          if (item.itemId) {
            await tx.execute(
              `UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?`,
              [item.quantity, now, item.itemId]
            );
          }
        }

        // 8. LOG HISTORY
        if (changes.length > 0) {
          const historyId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO invoice_history (
                  id, invoice_id, invoice_type, action, description,
                  old_values, new_values, user_id, user_name, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              historyId,
              id,
              "sale",
              "updated",
              `Updated: ${changes.join(", ")}`,
              JSON.stringify(oldValues),
              JSON.stringify(newValues),
              user?.id ?? null,
              userName,
              now,
            ]
          );
        }
      });
    },
    [db]
  );

  const updateInvoiceDetails = useCallback(
    async (
      id: string,
      updates: { invoiceName?: string; date?: string },
      oldValues?: { invoiceName?: string; date?: string }
    ): Promise<void> => {
      const now = new Date().toISOString();
      const setClauses: string[] = [];
      const params: (string | null)[] = [];
      const changes: string[] = [];
      const trackedOldValues: Record<string, unknown> = {};
      const trackedNewValues: Record<string, unknown> = {};

      if (updates.invoiceName !== undefined) {
        setClauses.push("invoice_name = ?");
        params.push(updates.invoiceName || null);
        if (oldValues?.invoiceName !== updates.invoiceName) {
          changes.push("name");
          trackedOldValues.invoiceName = oldValues?.invoiceName ?? "";
          trackedNewValues.invoiceName = updates.invoiceName;
        }
      }

      if (updates.date !== undefined) {
        setClauses.push("date = ?");
        params.push(updates.date);
        if (oldValues?.date !== updates.date) {
          changes.push("date");
          trackedOldValues.date = oldValues?.date ?? "";
          trackedNewValues.date = updates.date;
        }
      }

      if (setClauses.length === 0) return;

      setClauses.push("updated_at = ?");
      params.push(now);
      params.push(id);

      await db.execute(
        `UPDATE sale_invoices SET ${setClauses.join(", ")} WHERE id = ?`,
        params
      );

      // Log history if there were actual changes
      if (changes.length > 0) {
        await addHistoryEntry({
          invoiceId: id,
          action: "updated",
          description: `Updated invoice ${changes.join(" and ")}`,
          ...(Object.keys(trackedOldValues).length > 0 && {
            oldValues: trackedOldValues,
          }),
          ...(Object.keys(trackedNewValues).length > 0 && {
            newValues: trackedNewValues,
          }),
        });
      }
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
      await db.writeTransaction(async (tx) => {
        const invoiceResult = await tx.execute(
          `SELECT total, customer_id, status FROM sale_invoices WHERE id = ?`,
          [id]
        );
        const invoice = invoiceResult.rows?.item(0);

        // 1. Update Status
        await tx.execute(
          `UPDATE sale_invoices SET status = ?, updated_at = ? WHERE id = ?`,
          [status, now, id]
        );

        // 2. Handle specific status effects
        if (status === "returned" && invoice && invoice.status !== "returned") {
          // Reverse the Customer Balance impact (Credit Note effect)
          // Decrease the "Receivable" amount from the customer
          await tx.execute(
            `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
            [invoice.total, now, invoice.customer_id]
          );
        }

        // Build description with optional reason
        let description = `Status changed from ${oldStatus ?? "unknown"} to ${status}`;
        if (reason) {
          description += `. Reason: ${reason}`;
        }

        // Log history
        await addHistoryEntry(
          {
            invoiceId: id,
            action: "status_changed",
            description,
            ...(oldStatus && { oldValues: { status: oldStatus } }),
            newValues: { status, ...(reason && { reason }) },
          },
          tx
        );
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
    updateInvoiceDetails,
    updateInvoiceStatus,
    recordPayment,
    deleteInvoice,
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
