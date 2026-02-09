import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { EstimateRecord, EstimateItemRecord } from "../lib/powersync";
import { useAuth } from "../contexts/AuthContext";

export type EstimateStatus = "draft" | "sent" | "accepted" | "declined" | "expired" | "converted";

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  validUntil: string;
  status: EstimateStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  convertedToInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
  items?: EstimateItem[];
}

export interface EstimateItem {
  id: string;
  estimateId: string;
  itemId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
}

function mapRowToEstimate(row: EstimateRecord): Estimate {
  return {
    id: row.id,
    estimateNumber: row.estimate_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: row.date,
    validUntil: row.valid_until,
    status: row.status as EstimateStatus,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    discountAmount: row.discount_amount,
    total: row.total,
    notes: row.notes || undefined,
    terms: row.terms || undefined,
    convertedToInvoiceId: row.converted_to_invoice_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToEstimateItem(row: EstimateItemRecord): EstimateItem {
  return {
    id: row.id,
    estimateId: row.estimate_id,
    itemId: row.item_id || undefined,
    itemName: row.item_name,
    description: row.description || undefined,
    quantity: row.quantity,
    unit: row.unit || undefined,
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
}): { estimates: Estimate[]; isLoading: boolean; error: Error | null } {
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
      conditions.push("(estimate_number LIKE ? OR customer_name LIKE ?)");
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM estimates ${whereClause} ORDER BY date DESC, created_at DESC`,
      params,
    };
  }, [
    filters?.status,
    filters?.customerId,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<EstimateRecord>(query, params);

  const estimates = useMemo(() => (data || []).map(mapRowToEstimate), [data]);

  return { estimates, isLoading, error: error };
}

export function useEstimateById(id: string | null): {
  estimate: Estimate | null;
  items: EstimateItem[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: estimateData, isLoading: estimateLoading, error: estimateError } = useQuery<EstimateRecord>(
    id ? `SELECT * FROM estimates WHERE id = ?` : `SELECT * FROM estimates WHERE 1 = 0`,
    id ? [id] : []
  );

  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useQuery<EstimateItemRecord>(
    id ? `SELECT * FROM estimate_items WHERE estimate_id = ?` : `SELECT * FROM estimate_items WHERE 1 = 0`,
    id ? [id] : []
  );

  const estimate = estimateData?.[0] ? mapRowToEstimate(estimateData[0]) : null;
  const items = useMemo(() => (itemsData || []).map(mapRowToEstimateItem), [itemsData]);

  return {
    estimate,
    items,
    isLoading: estimateLoading || itemsLoading,
    error: (estimateError || itemsError),
  };
}

export function useEstimateMutations() {
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
          "estimate",
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

  const createEstimate = useCallback(
    async (
      data: {
        estimateNumber: string;
        customerId: string;
        customerName: string;
        date: string;
        validUntil: string;
        status?: EstimateStatus;
        discountAmount?: number;
        notes?: string;
        terms?: string;
      },
      items: Omit<EstimateItem, "id" | "estimateId">[]
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
            data.status || "draft",
            subtotal,
            taxAmount,
            data.discountAmount || 0,
            total,
            data.notes || null,
            data.terms || null,
            now,
            now,
          ]
        );

        for (const item of items) {
          const itemId = Date.now().toString() + Math.random().toString(36).substring(7);
          await tx.execute(
            `INSERT INTO estimate_items (
              id, estimate_id, item_id, item_name, description, quantity, unit,
              unit_price, discount_percent, tax_percent, amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              id,
              item.itemId || null,
              item.itemName,
              item.description || null,
              item.quantity,
              item.unit || null,
              item.unitPrice,
              item.discountPercent || 0,
              item.taxPercent || 0,
              item.amount,
            ]
          );
        }

        await addHistoryEntry(
          {
            invoiceId: id,
            action: "created",
            description: `Estimate ${data.estimateNumber} created`,
          },
          tx
        );
      });

      return id;
    },
    [db, addHistoryEntry]
  );

  return { createEstimate };
}
