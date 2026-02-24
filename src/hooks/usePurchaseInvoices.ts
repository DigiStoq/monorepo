import { useAuthStore } from "@/stores/auth-store";
import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type {
  PurchaseInvoice,
  PurchaseInvoiceItem,
} from "@/features/purchases/types";

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
  expected_delivery_date: string | null;
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

  if (row.supplier_invoice_number)
    invoice.supplierInvoiceNumber = row.supplier_invoice_number;
  if (row.notes) invoice.notes = row.notes;
  if (row.expected_delivery_date)
    invoice.expectedDeliveryDate = row.expected_delivery_date;

  return invoice;
}

function mapRowToPurchaseInvoiceItem(
  row: PurchaseInvoiceItemRow
): PurchaseInvoiceItem {
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
}): {
  invoices: PurchaseInvoice[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const params = useMemo(() => {
    const statusFilter = filters?.status ?? null;
    const supplierFilter = filters?.supplierId ?? null;
    const dateFromFilter = filters?.dateFrom ?? null;
    const dateToFilter = filters?.dateTo ?? null;
    const searchFilter = filters?.search ? `%${filters.search}%` : null;
    return [
      statusFilter,
      supplierFilter,
      dateFromFilter,
      dateToFilter,
      searchFilter,
    ];
  }, [
    filters?.status,
    filters?.supplierId,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

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

export function usePurchaseInvoiceItems(invoiceId?: string): {
  items: PurchaseInvoiceItem[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery<PurchaseInvoiceItemRow>(
    `SELECT * FROM purchase_invoice_items WHERE invoice_id = ?`,
    invoiceId ? [invoiceId] : []
  );

  const items = useMemo(() => data.map(mapRowToPurchaseInvoiceItem), [data]);

  return { items, isLoading };
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
      expectedDeliveryDate?: string;
      notes?: string;
      initialAmountPaid?: number;
      initialPaymentStatus?: string;
      initialPaymentMode?: string;
      initialBankAccountId?: string;
      initialChequeNumber?: string;
      initialChequeBankName?: string;
      initialChequeDueDate?: string;
    },
    items: Omit<PurchaseInvoiceItem, "id" | "invoiceId">[]
  ) => Promise<string>;
  updateInvoice: (
    id: string,
    data: {
      invoiceNumber: string;
      supplierInvoiceNumber?: string;
      supplierId: string;
      supplierName: string;
      date: string;
      dueDate: string;
      status?: string;
      discountAmount?: number;
      expectedDeliveryDate?: string;
      notes?: string;
    },
    items: Omit<PurchaseInvoiceItem, "id" | "invoiceId">[]
  ) => Promise<void>;
  updateInvoiceStatus: (
    id: string,
    status: string,
    data?: { expectedDeliveryDate?: string }
  ) => Promise<void>;
  recordPayment: (id: string, amount: number) => Promise<void>;
  deleteInvoice: (id: string, restoreStock?: boolean) => Promise<void>;
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
        expectedDeliveryDate?: string;
        notes?: string;
        initialAmountPaid?: number;
        initialPaymentStatus?: string;
        initialPaymentMode?: string;
        initialBankAccountId?: string;
        initialChequeNumber?: string;
        initialChequeBankName?: string;
        initialChequeDueDate?: string;
      },
      items: Omit<PurchaseInvoiceItem, "id" | "invoiceId">[]
    ): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      await db.writeTransaction(async (tx) => {
        // 1. Insert Invoice Header
        await tx.execute(
          `INSERT INTO purchase_invoices (
            id, invoice_number, supplier_invoice_number, customer_id, customer_name,
            date, due_date, status, subtotal, tax_amount, discount_amount, total,
            amount_paid, amount_due, expected_delivery_date, notes, created_at, updated_at, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            data.initialAmountPaid ?? 0, // amount_paid
            total - (data.initialAmountPaid ?? 0), // amount_due
            data.expectedDeliveryDate ?? null,
            data.notes ?? null,
            now,
            now,
            user?.id ?? null,
          ]
        );

        // 2. Insert Items & Update Stock (Only if status is 'received' or 'paid')
        const shouldUpdateStockAndBalance =
          data.status === "received" || data.status === "paid";

        for (const item of items) {
          const itemId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO purchase_invoice_items (
              id, invoice_id, item_id, item_name, description, quantity, unit,
              unit_price, discount_percent, tax_percent, amount, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
              user?.id ?? null,
            ]
          );

          if (item.itemId && shouldUpdateStockAndBalance) {
            await tx.execute(
              `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
              [item.quantity, now, item.itemId]
            );
          }
        }

        // 3. Update Supplier Balance (Increase Payable -> Decrease Balance)
        // Only if status is 'received' or 'paid'
        // NOTE: If status="Paid", result should be ZERO change to balance roughly (Invoice + Payment).
        // If we decrease balance here by Total...
        if (shouldUpdateStockAndBalance) {
          await tx.execute(
            `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
            [total, now, data.supplierId]
          );
        }

        // 4. Log History
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "purchase",
            "created",
            `Created purchase invoice ${data.invoiceNumber}`,
            null,
            JSON.stringify({
              invoiceNumber: data.invoiceNumber,
              supplierName: data.supplierName,
              total,
            }),
            user?.id ?? null,
            userName,
            now,
          ]
        );

        // 5. Handle Initial Payment (if provided)
        if (
          data.initialPaymentStatus &&
          data.initialPaymentStatus !== "unpaid" &&
          data.initialAmountPaid &&
          data.initialAmountPaid > 0
        ) {
          const paymentNumber = `PAY-${Date.now()}`;
          const paymentMode = data.initialPaymentMode ?? "cash";

          // Create Payment Out Record
          await tx.execute(
            `INSERT INTO payment_outs (
              id, payment_number, customer_id, customer_name, date, amount,
              payment_mode, invoice_id, invoice_number,
              cheque_number, cheque_date, bank_name,
              created_at, updated_at, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              crypto.randomUUID(),
              paymentNumber,
              data.supplierId,
              data.supplierName,
              data.date,
              data.initialAmountPaid,
              paymentMode,
              id,
              data.invoiceNumber,
              // Map cheque details if applicable
              paymentMode === "cheque" ? data.initialChequeNumber : null,
              paymentMode === "cheque" ? data.initialChequeDueDate : null,
              paymentMode === "cheque" ? data.initialChequeBankName : null,
              now,
              now,
              user?.id ?? null,
            ]
          );

          // Correct Balance for Payment
          // We always INCREASE balance for Payment Out (Reducing negative debt)
          await tx.execute(
            `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
            [data.initialAmountPaid, now, data.supplierId]
          );

          // Log History for Payment
          const paymentHistoryId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO invoice_history (
              id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              paymentHistoryId,
              id,
              "purchase",
              "payment_recorded",
              `Initial payment of ${data.initialAmountPaid} recorded via ${paymentMode}`,
              null,
              JSON.stringify({
                amount: data.initialAmountPaid,
                mode: paymentMode,
              }),
              user?.id ?? null,
              userName,
              now,
            ]
          );

          // Create Transaction (Expense / Cash Out)
          if (paymentMode === "cash") {
            await tx.execute(
              `INSERT INTO cash_transactions (
                id, date, type, amount, description, category,
                related_customer_id, related_customer_name,
                related_invoice_id, related_invoice_number,
                created_at, updated_at, user_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                crypto.randomUUID(),
                data.date,
                "out",
                data.initialAmountPaid,
                `Payment paid for ${data.invoiceNumber}`,
                "Invoice Payment",
                data.supplierId,
                data.supplierName,
                id,
                data.invoiceNumber,
                now,
                now,
                user?.id ?? null,
              ]
            );
          } else if (paymentMode === "bank" && data.initialBankAccountId) {
            await tx.execute(
              `INSERT INTO bank_transactions (
                id, account_id, date, type, amount, description,
                related_customer_id, related_customer_name,
                related_invoice_id, related_invoice_number,
                created_at, updated_at, user_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                crypto.randomUUID(),
                data.initialBankAccountId,
                data.date,
                "withdrawal",
                data.initialAmountPaid,
                `Payment paid for ${data.invoiceNumber}`,
                data.supplierId,
                data.supplierName,
                id,
                data.invoiceNumber,
                now,
                now,
                user?.id ?? null,
              ]
            );

            // Also update Bank Account Balance (Withdrawal = decrease)
            await tx.execute(
              `UPDATE bank_accounts SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
              [data.initialAmountPaid, now, data.initialBankAccountId]
            );
          } else if (paymentMode === "cheque" && data.initialChequeNumber) {
            await tx.execute(
              `INSERT INTO cheques (
                    id, cheque_number, type, customer_id, customer_name,
                    bank_name, date, due_date, status, amount,
                    related_invoice_id, related_invoice_number,
                    created_at, updated_at, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                crypto.randomUUID(),
                data.initialChequeNumber,
                "issued",
                data.supplierId,
                data.supplierName,
                data.initialChequeBankName ?? "Unknown Bank",
                data.date,
                data.initialChequeDueDate ?? data.date,
                "pending",
                data.initialAmountPaid,
                id,
                data.invoiceNumber,
                now,
                now,
                user?.id ?? null,
              ]
            );
          }
        }
      });

      return id;
    },
    [db]
  );

  const updateInvoice = useCallback(
    async (
      id: string,
      data: {
        invoiceNumber: string;
        supplierInvoiceNumber?: string;
        supplierId: string;
        supplierName: string;
        date: string;
        dueDate: string;
        status?: string;
        discountAmount?: number;
        expectedDeliveryDate?: string;
        notes?: string;
      },
      items: Omit<PurchaseInvoiceItem, "id" | "invoiceId">[]
    ): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      // Calculate new totals
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      await db.writeTransaction(async (tx) => {
        // 1. Get Old Data (Full Invoice + Items)
        const oldInvoiceResult = await tx.execute(
          `SELECT * FROM purchase_invoices WHERE id = ?`,
          [id]
        );
        const oldRow = oldInvoiceResult.rows?.item(0) as
          | PurchaseInvoiceRow
          | undefined;
        if (!oldRow) throw new Error("Invoice not found");

        const oldInvoice = mapRowToPurchaseInvoice(oldRow);

        // Fetch old items
        const oldItemsResult = await tx.execute(
          `SELECT * FROM purchase_invoice_items WHERE invoice_id = ?`,
          [id]
        );
        const oldItems: PurchaseInvoiceItem[] = [];
        if (oldItemsResult.rows?.length) {
          for (let i = 0; i < oldItemsResult.rows.length; i++) {
            oldItems.push(
              mapRowToPurchaseInvoiceItem(oldItemsResult.rows.item(i))
            );
          }
        }

        // 2. Prepare History Diff
        const changes: string[] = [];
        const oldValues: Record<string, unknown> = {};
        const newValues: Record<string, unknown> = {};

        // Normalization helper
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
          "invoiceNumber",
          oldInvoice.invoiceNumber,
          data.invoiceNumber,
          "Inv #"
        );
        checkField(
          "supplierInvoiceNumber",
          oldInvoice.supplierInvoiceNumber,
          data.supplierInvoiceNumber,
          "Sup Ref"
        );
        checkField(
          "customerName",
          oldInvoice.customerName,
          data.supplierName,
          "Supplier"
        );
        checkField("date", oldInvoice.date, data.date, "Date");
        checkField("dueDate", oldInvoice.dueDate, data.dueDate, "Due Date");
        checkField("status", oldInvoice.status, data.status, "Status");
        checkField(
          "expectedDeliveryDate",
          oldInvoice.expectedDeliveryDate,
          data.expectedDeliveryDate,
          "Exp Delivery"
        );

        if (oldInvoice.total !== total) {
          changes.push(`Total: ${oldInvoice.total} -> ${total}`);
          oldValues.total = oldInvoice.total;
          newValues.total = total;
        }

        checkField("notes", oldInvoice.notes, data.notes, "Notes");

        if (oldItems.length !== items.length) {
          changes.push(`Items: ${oldItems.length} -> ${items.length}`);
        }

        // 3. Revert Old Stock & Balance (If old status was 'received' or 'paid')
        const oldWasActive =
          oldInvoice.status === "received" || oldInvoice.status === "paid";
        const newIsActive =
          (data.status ?? oldInvoice.status) === "received" ||
          (data.status ?? oldInvoice.status) === "paid";

        if (oldWasActive) {
          // Revert Stock (Decrease)
          for (const item of oldItems) {
            if (item.itemId) {
              await tx.execute(
                `UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?`,
                [item.quantity, now, item.itemId]
              );
            }
          }
          // Revert Balance (Increase - undoing debt)
          if (oldInvoice.customerId) {
            await tx.execute(
              `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
              [oldInvoice.total, now, oldInvoice.customerId]
            );
          }
        }

        // 4. Update Invoice Header
        // Recalculate amount_due based on new total and OLD amount_paid
        const amountDue = total - oldInvoice.amountPaid;

        await tx.execute(
          `UPDATE purchase_invoices SET
            invoice_number = ?, supplier_invoice_number = ?, customer_id = ?, customer_name = ?,
            date = ?, due_date = ?, status = ?,
            subtotal = ?, tax_amount = ?, discount_amount = ?, total = ?,
            amount_due = ?, expected_delivery_date = ?, notes = ?, updated_at = ?
          WHERE id = ?`,
          [
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
            amountDue,
            data.expectedDeliveryDate ?? null,
            data.notes ?? null,
            now,
            id,
          ]
        );

        // 5. Delete Old Items
        await tx.execute(
          `DELETE FROM purchase_invoice_items WHERE invoice_id = ?`,
          [id]
        );

        // 6. Insert New Items & Update Stock (If new status is 'received' or 'paid')
        for (const item of items) {
          const itemId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO purchase_invoice_items (
              id, invoice_id, item_id, item_name, description, quantity, unit,
              unit_price, discount_percent, tax_percent, amount, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
              user?.id ?? null,
            ]
          );

          if (item.itemId && newIsActive) {
            await tx.execute(
              `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
              [item.quantity, now, item.itemId]
            );
          }
        }

        // 7. Update Supplier Balance (New Debt) (If new status is 'received' or 'paid')
        if (newIsActive) {
          await tx.execute(
            `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
            [total, now, data.supplierId]
          );
        }

        // 8. Log History
        if (changes.length > 0) {
          const historyId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO invoice_history (
                id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              historyId,
              id,
              "purchase",
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

  const updateInvoiceStatus = useCallback(
    async (
      id: string,
      status: string,
      data?: { expectedDeliveryDate?: string }
    ): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        // 1. Fetch current status and details
        const invoiceResult = await tx.execute(
          `SELECT status, total, customer_id FROM purchase_invoices WHERE id = ?`,
          [id]
        );
        const invoice = invoiceResult.rows?.item(0);
        if (!invoice) throw new Error("Invoice not found");

        const oldStatus = invoice.status;
        const oldWasActive = oldStatus === "received" || oldStatus === "paid";
        const newIsActive = status === "received" || status === "paid";

        // 2. Handle Stock & Balance transitions
        if (!oldWasActive && newIsActive) {
          // Transition to Active: Increase Stock, Increase Balance Debt
          // Fetch items
          const itemsResult = await tx.execute(
            `SELECT item_id, quantity FROM purchase_invoice_items WHERE invoice_id = ?`,
            [id]
          );
          if (itemsResult.rows?.length) {
            for (let i = 0; i < itemsResult.rows.length; i++) {
              const item = itemsResult.rows.item(i);
              if (item.item_id) {
                await tx.execute(
                  `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
                  [item.quantity, now, item.item_id]
                );
              }
            }
          }
          // Increase Debt (Decrease Balance)
          await tx.execute(
            `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
            [invoice.total, now, invoice.customer_id]
          );
        } else if (oldWasActive && !newIsActive) {
          // Transition to Inactive: Revert Stock, Revert Balance Debt
          // Fetch items
          const itemsResult = await tx.execute(
            `SELECT item_id, quantity FROM purchase_invoice_items WHERE invoice_id = ?`,
            [id]
          );
          if (itemsResult.rows?.length) {
            for (let i = 0; i < itemsResult.rows.length; i++) {
              const item = itemsResult.rows.item(i);
              if (item.item_id) {
                await tx.execute(
                  `UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?`,
                  [item.quantity, now, item.item_id]
                );
              }
            }
          }
          // Decrease Debt (Increase Balance)
          await tx.execute(
            `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
            [invoice.total, now, invoice.customer_id]
          );
        }

        // 3. Update Status
        let query = `UPDATE purchase_invoices SET status = ?, updated_at = ?`;
        const params: (string | number | null)[] = [status, now];

        if (data?.expectedDeliveryDate !== undefined) {
          query += `, expected_delivery_date = ?`;
          params.push(data.expectedDeliveryDate);
        }

        query += ` WHERE id = ?`;
        params.push(id);

        await tx.execute(query, params);

        // Log history
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "purchase",
            "status_changed",
            `Status changed to ${status}`,
            JSON.stringify({ status: oldStatus }),
            JSON.stringify({ status, ...data }),
            user?.id ?? null,
            userName,
            now,
          ]
        );
      });
    },
    [db]
  );

  const recordPayment = useCallback(
    async (id: string, amount: number): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `UPDATE purchase_invoices
           SET amount_paid = amount_paid + ?,
               amount_due = amount_due - ?,
               status = CASE WHEN amount_due - ? <= 0 THEN 'paid' ELSE status END,
               updated_at = ?
           WHERE id = ?`,
          [amount, amount, amount, now, id]
        );

        // Log history
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "purchase",
            "payment_recorded",
            `Payment recorded: ${amount}`,
            null,
            JSON.stringify({ amount }),
            user?.id ?? null,
            userName,
            now,
          ]
        );
      });
    },
    [db]
  );

  const deleteInvoice = useCallback(
    async (id: string, restoreStock): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        // 1. Get info to reverse
        const invoiceResult = await tx.execute(
          `SELECT customer_id, total, invoice_number, status FROM purchase_invoices WHERE id = ?`,
          [id]
        );
        const invoice = invoiceResult.rows?.item(0);

        const itemsResult = await tx.execute(
          `SELECT item_id, quantity FROM purchase_invoice_items WHERE invoice_id = ?`,
          [id]
        );
        const items = [];
        if (itemsResult.rows?.length) {
          for (let i = 0; i < itemsResult.rows.length; i++) {
            items.push(itemsResult.rows.item(i));
          }
        }

        const paymentsResult = await tx.execute(
          `SELECT id, amount FROM payment_outs WHERE invoice_id = ?`,
          [id]
        );
        const payments = [];
        if (paymentsResult.rows?.length) {
          for (let i = 0; i < paymentsResult.rows.length; i++) {
            payments.push(paymentsResult.rows.item(i));
          }
        }

        // 2. Reverse Payments Balance Effect
        // Payments reduced debt (increased balance toward zero/positive).
        // Deleting payment means debt remains (decrease balance).
        for (const payment of payments) {
          if (invoice) {
            await tx.execute(
              `UPDATE customers SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?`,
              [payment.amount, now, invoice.customer_id]
            );
          }
        }

        // 3. Delete Payments
        await tx.execute(`DELETE FROM payment_outs WHERE invoice_id = ?`, [id]);

        // Check if invoice was active (affected stock/balance)
        const wasActive =
          invoice &&
          (invoice.status === "received" || invoice.status === "paid");

        if (wasActive && restoreStock) {
          // 4. Reverse Stock (Decrease)
          for (const item of items) {
            if (item.item_id) {
              await tx.execute(
                `UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?`,
                [item.quantity, now, item.item_id]
              );
            }
          }
        }

        if (wasActive) {
          // 5. Reverse Invoice Balance Effect (Increase - undo debt)
          // Invoice creation decreased balance (created debt). Reversing it increases balance.
          if (invoice) {
            await tx.execute(
              `UPDATE customers SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
              [invoice.total, now, invoice.customer_id]
            );
          }
        }

        // 6. Delete Items & Invoice
        await tx.execute(
          `DELETE FROM purchase_invoice_items WHERE invoice_id = ?`,
          [id]
        );
        await tx.execute(`DELETE FROM purchase_invoices WHERE id = ?`, [id]);

        // 7. Log History (Audit: Deleted)
        // Note: The invoice is gone, but we might want to keep history?
        // Or insert into a audit log.
        // For now, PowerSync history table has foreign key to invoice?
        // If so, deleting invoice deletes history?
        // Checking schema: invoice_history table lines 203+ don't show FK constraint in schema.ts definition.
        // But if there is one, this might fail.
        // Assuming loose coupling for history or history is kept.
        // However, if we delete the invoice, fetching history for it is impossible via standard UI.
        // But we'll log it just in case.
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "purchase",
            "deleted",
            `Deleted purchase invoice ${invoice?.invoice_number ?? "Unknown"}`,
            JSON.stringify(invoice),
            null,
            user?.id ?? null,
            userName,
            now,
          ]
        );
      });
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

export interface PurchaseInvoiceLinkedItems {
  itemsCount: number;
  paymentsCount: number;
}

export function usePurchaseInvoiceLinkedItems(
  invoiceId: string | null
): PurchaseInvoiceLinkedItems {
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
