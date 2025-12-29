import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
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
    status: row.status,
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
    return [statusFilter, customerFilter, dateFromFilter, dateToFilter, searchFilter];
  }, [filters?.status, filters?.customerId, filters?.dateFrom, filters?.dateTo, filters?.search]);

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
  const { data: estimateData, isLoading: estimateLoading } = useQuery<EstimateRow>(
    id ? `SELECT * FROM estimates WHERE id = ?` : `SELECT * FROM estimates WHERE 1 = 0`,
    id ? [id] : []
  );

  const { data: itemsData, isLoading: itemsLoading } = useQuery<EstimateItemRow>(
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
  updateEstimateStatus: (id: string, status: string) => Promise<void>;
  convertToInvoice: (id: string, invoiceId: string) => Promise<void>;
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

      const subtotal = items.reduce((sum: number, item) => sum + item.amount, 0);
      const taxAmount = items.reduce(
        (sum: number, item) => sum + (item.amount * (item.taxPercent ?? 0)) / 100,
        0
      );
      const total = subtotal + taxAmount - (data.discountAmount ?? 0);

      await db.execute(
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
        await db.execute(
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

      return id;
    },
    [db]
  );

  const updateEstimateStatus = useCallback(
    async (id: string, status: string): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(`UPDATE estimates SET status = ?, updated_at = ? WHERE id = ?`, [
        status,
        now,
        id,
      ]);
    },
    [db]
  );

  const convertToInvoice = useCallback(
    async (id: string, invoiceId: string): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE estimates SET status = 'converted', converted_to_invoice_id = ?, updated_at = ? WHERE id = ?`,
        [invoiceId, now, id]
      );
    },
    [db]
  );

  const deleteEstimate = useCallback(
    async (id: string): Promise<void> => {
      await db.execute(`DELETE FROM estimate_items WHERE estimate_id = ?`, [id]);
      await db.execute(`DELETE FROM estimates WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createEstimate,
    updateEstimateStatus,
    convertToInvoice,
    deleteEstimate,
  };
}
