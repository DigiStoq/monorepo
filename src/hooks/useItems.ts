import { useQuery } from "@powersync/react";
import { useCallback } from "react";
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
  created_at: string;
  updated_at: string;
}

function mapRowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    type: row.type,
    description: row.description ?? undefined,
    category: row.category_id ?? undefined,
    unit: row.unit,
    salePrice: row.sale_price ?? 0,
    purchasePrice: row.purchase_price ?? 0,
    taxRate: row.tax_rate ?? undefined,
    stockQuantity: row.stock_quantity ?? 0,
    lowStockAlert: row.low_stock_alert ?? 0,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useItems(filters?: {
  categoryId?: string;
  type?: "product" | "service";
  isActive?: boolean;
  lowStock?: boolean;
  search?: string;
}): { items: Item[]; isLoading: boolean; error: Error | undefined } {
  const categoryFilter = filters?.categoryId ?? null;
  const typeFilter = filters?.type ?? null;
  const activeFilter = filters?.isActive !== undefined ? (filters.isActive ? 1 : 0) : null;
  const searchFilter = filters?.search ? `%${filters.search}%` : null;

  let query = `SELECT * FROM items
     WHERE ($1 IS NULL OR category_id = $1)
     AND ($2 IS NULL OR type = $2)
     AND ($3 IS NULL OR is_active = $3)
     AND ($4 IS NULL OR name LIKE $4 OR sku LIKE $4)`;

  if (filters?.lowStock) {
    query += ` AND stock_quantity <= low_stock_alert`;
  }

  query += ` ORDER BY name`;

  const { data, isLoading, error } = useQuery<ItemRow>(query, [
    categoryFilter,
    typeFilter,
    activeFilter,
    searchFilter,
  ]);

  const items = (data ?? []).map(mapRowToItem);

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

  const item = data?.[0] ? mapRowToItem(data[0]) : null;

  return { item, isLoading, error };
}

// Extended form data type with additional fields used in mutations
interface ItemMutationData extends ItemFormData {
  categoryId?: string;
  stockQuantity?: number;
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

  const createItem = useCallback(
    async (data: ItemMutationData): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO items (
          id, name, sku, type, description, category_id, unit,
          sale_price, purchase_price, tax_rate, stock_quantity, low_stock_alert,
          is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.sku ?? null,
          data.type ?? "product",
          data.description ?? null,
          data.categoryId ?? data.category ?? null,
          data.unit ?? "pcs",
          data.salePrice ?? 0,
          data.purchasePrice ?? 0,
          data.taxRate ?? 0,
          data.stockQuantity ?? data.openingStock ?? 0,
          data.lowStockAlert ?? 0,
          1, // is_active
          now,
          now,
        ]
      );

      return id;
    },
    [db]
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

      fields.push("updated_at = ?");
      values.push(now);
      values.push(id);

      if (fields.length > 1) {
        await db.execute(`UPDATE items SET ${fields.join(", ")} WHERE id = ?`, values);
      }
    },
    [db]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      await db.execute(`DELETE FROM items WHERE id = ?`, [id]);
    },
    [db]
  );

  const toggleItemActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(`UPDATE items SET is_active = ?, updated_at = ? WHERE id = ?`, [
        isActive ? 1 : 0,
        now,
        id,
      ]);
    },
    [db]
  );

  const adjustStock = useCallback(
    async (id: string, quantity: number): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
        [quantity, now, id]
      );
    },
    [db]
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
    totalItems: totalItems?.[0]?.count ?? 0,
    lowStockItems: lowStockItems?.[0]?.count ?? 0,
    outOfStock: outOfStock?.[0]?.count ?? 0,
    totalValue: totalValue?.[0]?.sum ?? 0,
  };
}
