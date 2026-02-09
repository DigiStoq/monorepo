/* eslint-disable @typescript-eslint/no-unnecessary-condition -- runtime safety */
import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { Item, ItemFormData, ItemType } from "@/features/inventory/types";

// Database row type (snake_case columns from SQLite)
interface ItemRow {
  id: string;
  name: string;
  sku: string;
  type: ItemType;
  description: string | null;
  category_id: string | null;
  unit: string;
  sale_price: number;
  purchase_price: number;
  tax_rate: number | null;
  stock_quantity: number;
  low_stock_alert: number;
  is_active: number;
  // Optional additional fields
  batch_number: string | null;
  expiry_date: string | null;
  manufacture_date: string | null;
  barcode: string | null;
  hsn_code: string | null;
  warranty_days: number | null;
  brand: string | null;
  model_number: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToItem(row: ItemRow): Item {
  const item: Item = {
    id: row.id,
    name: row.name,
    sku: row.sku,
    type: row.type,
    unit: row.unit,
    salePrice: row.sale_price,
    purchasePrice: row.purchase_price,
    stockQuantity: row.stock_quantity,
    lowStockAlert: row.low_stock_alert,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Add optional fields only if they have values
  if (row.description) item.description = row.description;
  if (row.category_id) item.category = row.category_id;
  if (row.tax_rate !== null) item.taxRate = row.tax_rate;
  if (row.batch_number) item.batchNumber = row.batch_number;
  if (row.expiry_date) item.expiryDate = row.expiry_date;
  if (row.manufacture_date) item.manufactureDate = row.manufacture_date;
  if (row.barcode) item.barcode = row.barcode;
  if (row.hsn_code) item.hsnCode = row.hsn_code;
  if (row.warranty_days !== null) item.warrantyDays = row.warranty_days;
  if (row.brand) item.brand = row.brand;
  if (row.model_number) item.modelNumber = row.model_number;
  if (row.location) item.location = row.location;

  return item;
}

export function useItems(filters?: {
  categoryId?: string;
  type?: "product" | "service";
  isActive?: boolean;
  lowStock?: boolean;
  search?: string;
}): { items: Item[]; isLoading: boolean; error: Error | undefined } {
  // Memoize query and params to ensure stable references for PowerSync reactivity
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Category filter
    if (filters?.categoryId) {
      conditions.push("category_id = ?");
      params.push(filters.categoryId);
    }

    // Type filter
    if (filters?.type) {
      conditions.push("type = ?");
      params.push(filters.type);
    }

    // Active filter
    if (filters?.isActive !== undefined) {
      conditions.push("is_active = ?");
      params.push(filters.isActive ? 1 : 0);
    }

    // Low stock filter
    if (filters?.lowStock) {
      conditions.push("stock_quantity <= low_stock_alert");
    }

    // Search filter
    if (filters?.search) {
      conditions.push("(name LIKE ? OR sku LIKE ?)");
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return {
      query: `SELECT * FROM items ${whereClause} ORDER BY name`,
      params,
    };
  }, [
    filters?.categoryId,
    filters?.type,
    filters?.isActive,
    filters?.lowStock,
    filters?.search,
  ]);

  const { data, isLoading, error } = useQuery<ItemRow>(query, params);

  const items = useMemo(() => data.map(mapRowToItem), [data]);

  return { items, isLoading, error };
}

export function useItemById(id: string | null): {
  item: Item | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<ItemRow>(
    id ? `SELECT * FROM items WHERE id = ?` : `SELECT * FROM items WHERE 1 = 0`,
    id ? [id] : []
  );

  const item = data[0] ? mapRowToItem(data[0]) : null;

  return { item, isLoading, error };
}

// Extended form data type with additional fields used in mutations
interface ItemMutationData extends ItemFormData {
  categoryId?: string;
  stockQuantity?: number;
  // Optional additional fields are inherited from ItemFormData
}

interface ItemMutations {
  createItem: (data: ItemMutationData) => Promise<string>;
  updateItem: (id: string, data: Partial<ItemMutationData>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemActive: (id: string, isActive: boolean) => Promise<void>;
  adjustStock: (id: string, quantity: number) => Promise<void>;
}

export function useItemMutations(): ItemMutations {
  const db = getPowerSyncDatabase();

  // Helper to add history entry
  const addItemHistoryEntry = useCallback(
    async (entry: {
      itemId: string;
      action: string;
      description: string;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
    }) => {
      try {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        // Get user info - use dynamic import to avoid circular dependencies
        const { useAuthStore } = await import("@/stores/auth-store");
        const { user } = useAuthStore.getState();
        const userId = user?.id ?? null;
        const userName =
          user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

        await db.execute(
          `INSERT INTO item_history (
            id, item_id, action, description,
            old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            entry.itemId,
            entry.action,
            entry.description,
            entry.oldValues ? JSON.stringify(entry.oldValues) : null,
            entry.newValues ? JSON.stringify(entry.newValues) : null,
            userId,
            userName,
            now,
          ]
        );
      } catch (error) {
        console.error("[Item History] Failed to add history entry:", error);
      }
    },
    [db]
  );

  const createItem = useCallback(
    async (data: ItemMutationData): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO items (
          id, name, sku, type, description, category_id, unit,
          sale_price, purchase_price, tax_rate, stock_quantity, low_stock_alert,
          batch_number, expiry_date, manufacture_date, barcode, hsn_code,
          warranty_days, brand, model_number, location,
          is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.sku ?? null,
          data.type,
          data.description ?? null,
          data.categoryId ?? data.category ?? null,
          data.unit,
          data.salePrice,
          data.purchasePrice ?? 0,
          data.taxRate ?? 0,
          data.stockQuantity ?? data.openingStock ?? 0,
          data.lowStockAlert ?? 0,
          // Optional additional fields
          data.batchNumber ?? null,
          data.expiryDate ?? null,
          data.manufactureDate ?? null,
          data.barcode ?? null,
          data.hsnCode ?? null,
          data.warrantyDays ?? null,
          data.brand ?? null,
          data.modelNumber ?? null,
          data.location ?? null,
          1, // is_active
          now,
          now,
        ]
      );

      // Log history
      await addItemHistoryEntry({
        itemId: id,
        action: "created",
        description: `Item "${data.name}" created`,
        newValues: {
          name: data.name,
          sku: data.sku,
          type: data.type,
          salePrice: data.salePrice,
          purchasePrice: data.purchasePrice,
          stockQuantity: data.stockQuantity ?? data.openingStock ?? 0,
        },
      });

      return id;
    },
    [db, addItemHistoryEntry]
  );

  const updateItem = useCallback(
    async (id: string, data: Partial<ItemMutationData>): Promise<void> => {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (data.name !== undefined) {
        fields.push("name = ?");
        values.push(data.name);
      }
      if (data.sku !== undefined) {
        fields.push("sku = ?");
        values.push(data.sku ?? null);
      }
      if (data.type !== undefined) {
        fields.push("type = ?");
        values.push(data.type);
      }
      if (data.description !== undefined) {
        fields.push("description = ?");
        values.push(data.description ?? null);
      }
      if (data.categoryId !== undefined) {
        fields.push("category_id = ?");
        values.push(data.categoryId ?? null);
      }
      if (data.unit !== undefined) {
        fields.push("unit = ?");
        values.push(data.unit);
      }
      if (data.salePrice !== undefined) {
        fields.push("sale_price = ?");
        values.push(data.salePrice);
      }
      if (data.purchasePrice !== undefined) {
        fields.push("purchase_price = ?");
        values.push(data.purchasePrice ?? null);
      }
      if (data.taxRate !== undefined) {
        fields.push("tax_rate = ?");
        values.push(data.taxRate ?? null);
      }
      if (data.lowStockAlert !== undefined) {
        fields.push("low_stock_alert = ?");
        values.push(data.lowStockAlert ?? null);
      }
      // Optional additional fields
      if (data.batchNumber !== undefined) {
        fields.push("batch_number = ?");
        values.push(data.batchNumber ?? null);
      }
      if (data.expiryDate !== undefined) {
        fields.push("expiry_date = ?");
        values.push(data.expiryDate ?? null);
      }
      if (data.manufactureDate !== undefined) {
        fields.push("manufacture_date = ?");
        values.push(data.manufactureDate ?? null);
      }
      if (data.barcode !== undefined) {
        fields.push("barcode = ?");
        values.push(data.barcode ?? null);
      }
      if (data.hsnCode !== undefined) {
        fields.push("hsn_code = ?");
        values.push(data.hsnCode ?? null);
      }
      if (data.warrantyDays !== undefined) {
        fields.push("warranty_days = ?");
        values.push(data.warrantyDays ?? null);
      }
      if (data.brand !== undefined) {
        fields.push("brand = ?");
        values.push(data.brand ?? null);
      }
      if (data.modelNumber !== undefined) {
        fields.push("model_number = ?");
        values.push(data.modelNumber ?? null);
      }
      if (data.location !== undefined) {
        fields.push("location = ?");
        values.push(data.location ?? null);
      }

      fields.push("updated_at = ?");
      values.push(now);
      values.push(id);

      if (fields.length > 1) {
        await db.execute(
          `UPDATE items SET ${fields.join(", ")} WHERE id = ?`,
          values
        );

        // Log history for update
        await addItemHistoryEntry({
          itemId: id,
          action: "updated",
          description: `Item updated`,
          newValues: data as Record<string, unknown>,
        });
      }
    },
    [db, addItemHistoryEntry]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      // Log history before delete
      await addItemHistoryEntry({
        itemId: id,
        action: "deleted",
        description: `Item deleted`,
      });

      await db.execute(`DELETE FROM items WHERE id = ?`, [id]);
    },
    [db, addItemHistoryEntry]
  );

  const toggleItemActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE items SET is_active = ?, updated_at = ? WHERE id = ?`,
        [isActive ? 1 : 0, now, id]
      );

      // Log history
      await addItemHistoryEntry({
        itemId: id,
        action: isActive ? "activated" : "deactivated",
        description: `Item ${isActive ? "activated" : "deactivated"}`,
        newValues: { isActive },
      });
    },
    [db, addItemHistoryEntry]
  );

  const adjustStock = useCallback(
    async (id: string, quantity: number): Promise<void> => {
      const now = new Date().toISOString();

      // Get current stock before update
      const result = await db.execute(
        `SELECT stock_quantity, name FROM items WHERE id = ?`,
        [id]
      );
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const oldStock =
        (
          result.rows?._array?.[0] as
            | { stock_quantity: number; name: string }
            | undefined
        )?.stock_quantity ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const itemName =
        (result.rows?._array?.[0] as { name: string } | undefined)?.name ??
        "Unknown";
      const newStock = oldStock + quantity;

      await db.execute(
        `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
        [quantity, now, id]
      );

      // Log history
      await addItemHistoryEntry({
        itemId: id,
        action: "stock_adjusted",
        description: `Stock adjusted for "${itemName}": ${oldStock} → ${newStock} (${quantity > 0 ? "+" : ""}${quantity})`,
        oldValues: { stockQuantity: oldStock },
        newValues: { stockQuantity: newStock, adjustment: quantity },
      });
    },
    [db, addItemHistoryEntry]
  );

  return {
    createItem,
    updateItem,
    deleteItem,
    toggleItemActive,
    adjustStock,
  };
}

interface ItemStats {
  totalItems: number;
  lowStockItems: number;
  outOfStock: number;
  totalValue: number;
}

export function useItemStats(): ItemStats {
  const { data: totalItems } = useQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM items WHERE is_active = 1`
  );

  const { data: lowStockItems } = useQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM items WHERE is_active = 1 AND stock_quantity <= low_stock_alert`
  );

  const { data: outOfStock } = useQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM items WHERE is_active = 1 AND stock_quantity <= 0`
  );

  const { data: totalValue } = useQuery<{ sum: number }>(
    `SELECT COALESCE(SUM(stock_quantity * purchase_price), 0) as sum FROM items WHERE is_active = 1`
  );

  return {
    totalItems: totalItems[0]?.count ?? 0,
    lowStockItems: lowStockItems[0]?.count ?? 0,
    outOfStock: outOfStock[0]?.count ?? 0,
    totalValue: totalValue[0]?.sum ?? 0,
  };
}
