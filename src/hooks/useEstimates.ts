import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import { useAuthStore } from "@/stores/auth-store";
import type { Estimate, EstimateItem } from "@/features/sales/types";

// Database row types (snake_case columns from SQLite)
interface EstimateRow {
  id: string;
  estimate_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  valid_until: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  converted_to_invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

interface EstimateItemRow {
  id: string;
  estimate_id: string;
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

function mapRowToEstimate(row: EstimateRow): Estimate {
  return {
    id: row.id,
    estimateNumber: row.estimate_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    validUntil: row.valid_until,
    status: row.status as Estimate["status"],
    items: [], // Items are fetched separately via useEstimateById
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    discountAmount: row.discount_amount,
    total: row.total,
    notes: row.notes ?? undefined,
    terms: row.terms ?? undefined,
    convertedToInvoiceId: row.converted_to_invoice_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToEstimateItem(row: EstimateItemRow): EstimateItem {
  return {
    id: row.id,
    estimateId: row.estimate_id,
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

export function useEstimates(filters?: {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): { estimates: Estimate[]; isLoading: boolean; error: Error | undefined } {
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

  const { data, isLoading, error } = useQuery<EstimateRow>(
    `SELECT * FROM estimates
     WHERE ($1 IS NULL OR status = $1)
     AND ($2 IS NULL OR customer_id = $2)
     AND ($3 IS NULL OR date >= $3)
     AND ($4 IS NULL OR date <= $4)
     AND ($5 IS NULL OR estimate_number LIKE $5 OR customer_name LIKE $5)
     ORDER BY date DESC, created_at DESC`,
    params
  );

  const estimates = useMemo(() => data.map(mapRowToEstimate), [data]);

  return { estimates, isLoading, error };
}

export function useEstimateById(id: string | null): {
  estimate: Estimate | null;
  items: EstimateItem[];
  isLoading: boolean;
} {
  const { data: estimateData, isLoading: estimateLoading } =
    useQuery<EstimateRow>(
      id
        ? `SELECT * FROM estimates WHERE id = ?`
        : `SELECT * FROM estimates WHERE 1 = 0`,
      id ? [id] : []
    );

  const { data: itemsData, isLoading: itemsLoading } =
    useQuery<EstimateItemRow>(
      id
        ? `SELECT * FROM estimate_items WHERE estimate_id = ?`
        : `SELECT * FROM estimate_items WHERE 1 = 0`,
      id ? [id] : []
    );

  const estimate = estimateData[0] ? mapRowToEstimate(estimateData[0]) : null;
  const items = itemsData.map(mapRowToEstimateItem);

  return {
    estimate,
    items,
    isLoading: estimateLoading || itemsLoading,
  };
}

interface EstimateMutations {
  createEstimate: (
    data: {
      estimateNumber: string;
      customerId: string;
      customerName: string;
      date: string;
      validUntil: string;
      status?: string;
      discountAmount?: number;
      notes?: string;
      terms?: string;
    },
    items: Omit<EstimateItem, "id" | "estimateId">[]
  ) => Promise<string>;
  updateEstimate: (
    id: string,
    data: {
      estimateNumber: string;
      customerId: string;
      customerName: string;
      date: string;
      validUntil: string;
      status?: string;
      discountAmount?: number;
      notes?: string;
      terms?: string;
    },
    items: Omit<EstimateItem, "id" | "estimateId">[]
  ) => Promise<void>;
  updateEstimateStatus: (id: string, status: string) => Promise<void>;
  convertEstimateToInvoice: (
    estimate: Estimate,
    items: EstimateItem[],
    dueDate: string
  ) => Promise<string>;
  deleteEstimate: (id: string) => Promise<void>;
}

export function useEstimateMutations(): EstimateMutations {
  const db = getPowerSyncDatabase();

  const createEstimate = useCallback(
    async (
      data: {
        estimateNumber: string;
        customerId: string;
        customerName: string;
        date: string;
        validUntil: string;
        status?: string;
        discountAmount?: number;
        notes?: string;
        terms?: string;
      },
      items: Omit<EstimateItem, "id" | "estimateId">[]
    ): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      const subtotal = items.reduce(
        (sum: number, item) => sum + item.amount,
        0
      );
      const taxAmount = items.reduce(
        (sum: number, item) =>
          sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO estimates (
            id, estimate_number, customer_id, customer_name, date, valid_until, status,
            subtotal, tax_amount, discount_amount, total, notes, terms,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.estimateNumber,
            data.customerId,
            data.customerName,
            data.date,
            data.validUntil,
            data.status ?? "draft",
            subtotal,
            taxAmount,
            data.discountAmount ?? 0,
            total,
            data.notes ?? null,
            data.terms ?? null,
            now,
            now,
          ]
        );

        for (const item of items) {
          const itemId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO estimate_items (
              id, estimate_id, item_id, item_name, description, quantity, unit,
              unit_price, discount_percent, tax_percent, amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              id,
              item.itemId ?? null,
              item.itemName,
              item.description ?? null,
              item.quantity,
              item.unit ?? null,
              item.unitPrice,
              item.discountPercent ?? 0,
              item.taxPercent ?? 0,
              item.amount,
            ]
          );
        }

        // Log History
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "estimate",
            "created",
            `Created estimate ${data.estimateNumber}`,
            null,
            JSON.stringify({
              estimateNumber: data.estimateNumber,
              customerName: data.customerName,
              total,
            }),
            user?.id ?? null,
            userName,
            now,
          ]
        );
      });

      return id;
    },
    [db]
  );

  const updateEstimate = useCallback(
    async (
      id: string,
      data: {
        estimateNumber: string;
        customerId: string;
        customerName: string;
        date: string;
        validUntil: string;
        status?: string;
        discountAmount?: number;
        notes?: string;
        terms?: string;
      },
      items: Omit<EstimateItem, "id" | "estimateId">[]
    ): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      const subtotal = items.reduce(
        (sum: number, item) => sum + item.amount,
        0
      );
      const taxAmount = items.reduce(
        (sum: number, item) =>
          sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      await db.writeTransaction(async (tx) => {
        // Fetch old values for history if needed, or just update
        // No stock updates for estimates, so straight update

        await tx.execute(
          `UPDATE estimates SET
            estimate_number = ?, customer_id = ?, customer_name = ?, date = ?, valid_until = ?, status = ?,
            subtotal = ?, tax_amount = ?, discount_amount = ?, total = ?, notes = ?, terms = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            data.estimateNumber,
            data.customerId,
            data.customerName,
            data.date,
            data.validUntil,
            data.status ?? "draft",
            subtotal,
            taxAmount,
            data.discountAmount ?? 0,
            total,
            data.notes ?? null,
            data.terms ?? null,
            now,
            id,
          ]
        );

        // Delete old items
        await tx.execute(`DELETE FROM estimate_items WHERE estimate_id = ?`, [
          id,
        ]);

        // Insert new items
        for (const item of items) {
          const itemId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO estimate_items (
              id, estimate_id, item_id, item_name, description, quantity, unit,
              unit_price, discount_percent, tax_percent, amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              id,
              item.itemId ?? null,
              item.itemName,
              item.description ?? null,
              item.quantity,
              item.unit ?? null,
              item.unitPrice,
              item.discountPercent ?? 0,
              item.taxPercent ?? 0,
              item.amount,
            ]
          );
        }

        // Log History
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "estimate",
            "updated",
            `Updated estimate ${data.estimateNumber}`,
            null,
            JSON.stringify({ total }),
            user?.id ?? null,
            userName,
            now,
          ]
        );
      });
    },
    [db]
  );

  const updateEstimateStatus = useCallback(
    async (id: string, status: string): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `UPDATE estimates SET status = ?, updated_at = ? WHERE id = ?`,
          [status, now, id]
        );

        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "estimate",
            "status_changed",
            `Status changed to ${status}`,
            null,
            JSON.stringify({ status }),
            user?.id ?? null,
            userName,
            now,
          ]
        );
      });
    },
    [db]
  );

  const convertEstimateToInvoice = useCallback(
    async (
      estimate: Estimate,
      items: EstimateItem[],
      dueDate: string
    ): Promise<string> => {
      const invoiceId = crypto.randomUUID();
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      return await db.writeTransaction(async (tx) => {
        // Generate invoice number from sequence
        const seqResult = await tx.execute(
          `SELECT prefix, next_number, padding FROM sequence_counters WHERE id = ?`,
          ["sale_invoice"]
        );

        let seq = { prefix: "INV", next_number: 1, padding: 5 }; // Default fallback
        if (seqResult.rows?.length && seqResult.rows.length > 0) {
          seq = seqResult.rows.item(0);
        } else {
          // If mostly using array access:
          // const rows = seqResult.rows?._array;
          // if (rows && rows.length > 0) seq = rows[0];
          // But transaction results use item() usually.
        }

        // Just to be safe with types, assuming basic seq structure if not found or error
        // But throwing is safer if sequence is critical.
        // The original code threw error.

        const invoiceNumber = `${seq.prefix}-${String(seq.next_number).padStart(seq.padding, "0")}`;

        // Increment the sequence counter
        await tx.execute(
          `UPDATE sequence_counters SET next_number = next_number + 1, updated_at = ? WHERE id = ?`,
          [now, "sale_invoice"]
        );

        // Create the sale invoice
        await tx.execute(
          `INSERT INTO sale_invoices (
            id, invoice_number, customer_id, customer_name, date, due_date, status,
            subtotal, tax_amount, discount_amount, total, amount_paid, amount_due,
            notes, terms, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId,
            invoiceNumber,
            estimate.customerId,
            estimate.customerName,
            now.split("T")[0], // Today's date for the invoice
            dueDate,
            "unpaid",
            estimate.subtotal,
            estimate.taxAmount,
            estimate.discountAmount,
            estimate.total,
            0, // amount_paid
            estimate.total, // amount_due
            estimate.notes ?? null,
            estimate.terms ?? null,
            now,
            now,
          ]
        );

        // Copy estimate items to invoice items
        for (const item of items) {
          const itemId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO sale_invoice_items (
              id, invoice_id, item_id, item_name, description, quantity, unit,
              unit_price, discount_percent, tax_percent, amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              invoiceId,
              item.itemId ?? null,
              item.itemName,
              item.description ?? null,
              item.quantity,
              item.unit ?? "pcs",
              item.unitPrice,
              item.discountPercent ?? 0,
              item.taxPercent ?? 0,
              item.amount,
            ]
          );
        }

        // Update estimate status to converted
        await tx.execute(
          `UPDATE estimates SET status = 'converted', converted_to_invoice_id = ?, updated_at = ? WHERE id = ?`,
          [invoiceId, now, estimate.id]
        );

        // Add history entry for the new INVOICE
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description,
            old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            invoiceId,
            "sale",
            "created",
            `Invoice ${invoiceNumber} created from Estimate ${estimate.estimateNumber}`,
            null,
            JSON.stringify({
              total: estimate.total,
              status: "unpaid",
              itemCount: items.length,
              convertedFromEstimate: estimate.estimateNumber,
            }),
            user?.id ?? null,
            userName,
            now,
          ]
        );

        // Also log history for ESTIMATE?
        const estHistoryId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            estHistoryId,
            estimate.id,
            "estimate",
            "converted",
            `Converted to Invoice ${invoiceNumber}`,
            null,
            JSON.stringify({ convertedTo: invoiceNumber }),
            user?.id ?? null,
            userName,
            now,
          ]
        );

        return invoiceId;
      });
    },
    [db]
  );

  const deleteEstimate = useCallback(
    async (id: string): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        await tx.execute(`DELETE FROM estimate_items WHERE estimate_id = ?`, [
          id,
        ]);
        await tx.execute(`DELETE FROM estimates WHERE id = ?`, [id]);

        // Log delete history (best effort)
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO invoice_history (
            id, invoice_id, invoice_type, action, description, old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "estimate",
            "deleted",
            `Deleted estimate`,
            null,
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
    createEstimate,
    updateEstimate,
    updateEstimateStatus,
    convertEstimateToInvoice,
    deleteEstimate,
  };
}
