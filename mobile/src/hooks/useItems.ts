import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";
import type { ItemRecord } from "../lib/powersync";

export type ItemType = "product" | "service";

export interface Item {
  id: string;
  name: string;
  sku: string;
  type: ItemType;
  description?: string;
  category?: string;
  unit: string;
  salePrice: number;
  purchasePrice: number;
  taxRate?: number;
  stockQuantity: number;
  lowStockAlert: number;
  isActive: boolean;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  barcode?: string;
  hsnCode?: string;
  warrantyDays?: number;
  brand?: string;
  modelNumber?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemFormData {
  name: string;
  sku?: string;
  type: ItemType;
  description?: string;
  category?: string;
  unit: string;
  salePrice: number;
  purchasePrice?: number;
  taxRate?: number;
  stockQuantity?: number;
  lowStockAlert?: number;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  barcode?: string;
  hsnCode?: string;
  warrantyDays?: number;
  brand?: string;
  modelNumber?: string;
  location?: string;
}

type ItemRow = ItemRecord;

function mapRowToItem(row: ItemRow): Item {
  const item: Item = {
    id: row.id,
    name: row.name,
    sku: row.sku || "",
    type: row.type as ItemType,
    unit: row.unit || "unit",
    salePrice: row.sale_price || 0,
    purchasePrice: row.purchase_price || 0,
    stockQuantity: row.stock_quantity || 0,
    lowStockAlert: row.low_stock_alert || 0,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

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
}): { items: Item[]; isLoading: boolean; error: Error | null } {
  const { query, params } = useMemo(() => {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.categoryId) {
      conditions.push("category_id = ?");
      params.push(filters.categoryId);
    }

    if (filters?.type) {
      conditions.push("type = ?");
      params.push(filters.type);
    }

    if (filters?.isActive !== undefined) {
      conditions.push("is_active = ?");
      params.push(filters.isActive ? 1 : 0);
    }

    if (filters?.lowStock) {
      conditions.push("stock_quantity <= low_stock_alert");
    }

    if (filters?.search) {
      conditions.push("(name LIKE ? OR sku LIKE ?)");
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
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

  const items = useMemo(() => (data || []).map(mapRowToItem), [data]);

  return { items, isLoading, error: error };
}

export function useItemById(id: string | null): {
  item: Item | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery<ItemRow>(
    id ? `SELECT * FROM items WHERE id = ?` : `SELECT * FROM items WHERE 1 = 0`,
    id ? [id] : []
  );

  const item = data?.[0] ? mapRowToItem(data[0]) : null;

  return { item, isLoading, error: error };
}

export function useItemMutations() {
  const db = getPowerSyncDatabase();

  const createItem = useCallback(
    async (data: ItemFormData): Promise<string> => {
      const id = Date.now().toString();
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
          data.sku || null,
          data.type,
          data.description || null,
          data.category || null,
          data.unit,
          data.salePrice,
          data.purchasePrice || 0,
          data.taxRate || 0,
          data.stockQuantity || 0,
          data.lowStockAlert || 0,
          data.batchNumber || null,
          data.expiryDate || null,
          data.manufactureDate || null,
          data.barcode || null,
          data.hsnCode || null,
          data.warrantyDays || null,
          data.brand || null,
          data.modelNumber || null,
          data.location || null,
          1,
          now,
          now,
        ]
      );

      return id;
    },
    [db]
  );

  const updateItem = useCallback(
    async (id: string, data: Partial<ItemFormData>): Promise<void> => {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      const fieldMap: Record<string, string> = {
        name: "name",
        sku: "sku",
        type: "type",
        description: "description",
        category: "category_id",
        unit: "unit",
        salePrice: "sale_price",
        purchasePrice: "purchase_price",
        taxRate: "tax_rate",
        stockQuantity: "stock_quantity",
        lowStockAlert: "low_stock_alert",
        batchNumber: "batch_number",
        expiryDate: "expiry_date",
        manufactureDate: "manufacture_date",
        barcode: "barcode",
        hsnCode: "hsn_code",
        warrantyDays: "warranty_days",
        brand: "brand",
        modelNumber: "model_number",
        location: "location",
      };

      Object.entries(data).forEach(([key, value]) => {
        const dbField = fieldMap[key];
        if (dbField) {
          fields.push(`${dbField} = ?`);
          values.push(value === undefined ? null : value);
        }
      });

      fields.push("updated_at = ?");
      values.push(now);
      values.push(id);

      if (fields.length > 1) {
        await db.execute(`UPDATE items SET ${fields.join(", ")} WHERE id = ?`, values);
      }
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

  return { createItem, updateItem, adjustStock };
}

export function useItemStats() {
  const { data: totalItems } = useQuery<{ count: number }>(
    "SELECT COUNT(*) as count FROM items WHERE is_active = 1"
  );

  const { data: lowStockItems } = useQuery<{ count: number }>(
    "SELECT COUNT(*) as count FROM items WHERE is_active = 1 AND stock_quantity <= low_stock_alert"
  );

  const { data: outOfStock } = useQuery<{ count: number }>(
    "SELECT COUNT(*) as count FROM items WHERE is_active = 1 AND stock_quantity <= 0"
  );

  const { data: totalValue } = useQuery<{ sum: number }>(
    "SELECT COALESCE(SUM(stock_quantity * purchase_price), 0) as sum FROM items WHERE is_active = 1"
  );

  return {
    totalItems: totalItems?.[0]?.count ?? 0,
    lowStockItems: lowStockItems?.[0]?.count ?? 0,
    outOfStock: outOfStock?.[0]?.count ?? 0,
    totalValue: totalValue?.[0]?.sum ?? 0,
  };
}
