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

  const items = useMemo((): Item[] => data.map(mapRowToItem), [data]);

  return { items, isLoading, error };
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

import { useAuthStore } from "@/stores/auth-store";

// ... existing imports ...

export function useItemMutations(): ItemMutations {
  const db = getPowerSyncDatabase();

  const createItem = useCallback(
    async (data: ItemMutationData): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO items (
            id, name, sku, type, description, category_id, unit,
            sale_price, purchase_price, tax_rate, stock_quantity, low_stock_alert,
            batch_number, expiry_date, manufacture_date, barcode, hsn_code,
            warranty_days, brand, model_number, location,
            is_active, created_at, updated_at, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            user?.id ?? null,
          ]
        );

        // Log history
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO item_history (
            id, item_id, action, description,
            old_values, new_values, user_id, user_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "created",
            `Item "${data.name}" created`,
            null,
            JSON.stringify({
              name: data.name,
              sku: data.sku,
              type: data.type,
              salePrice: data.salePrice,
              purchasePrice: data.purchasePrice,
              stockQuantity: data.stockQuantity ?? data.openingStock ?? 0,
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

  const updateItem = useCallback(
    async (id: string, data: Partial<ItemMutationData>): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        // 1. Fetch existing item for history diffing
        const existingResult = await tx.getAll<ItemRow>(
          `SELECT * FROM items WHERE id = ?`,
          [id]
        );

        if (existingResult.length === 0) {
          // Item not found, just return (or could throw error)
          return;
        }
        const oldItem = existingResult[0];

        const fields: string[] = [];
        const values: (string | number | null)[] = [];

        // Track changes for history
        const changes: string[] = [];
        const oldValuesObj: Partial<ItemMutationData> = {};
        const newValuesObj: Partial<ItemMutationData> = {};

        // Helper to normalize values for comparison (treat "" as null)
        const normalize = (
          val: string | number | boolean | null | undefined
        ): string | number | null => {
          if (val === "" || val === undefined || val === null) return null;
          if (typeof val === "boolean") return val ? 1 : 0;
          return val;
        };

        if (data.name !== undefined) {
          if (data.name !== oldItem.name) {
            fields.push("name = ?");
            values.push(data.name);
            changes.push(`Name: '${oldItem.name}' -> '${data.name}'`);
            oldValuesObj.name = oldItem.name;
            newValuesObj.name = data.name;
          }
        }
        if (data.sku !== undefined) {
          const oldSku = normalize(oldItem.sku);
          const newSku = normalize(data.sku);
          if (newSku !== oldSku) {
            fields.push("sku = ?");
            values.push(newSku); // Store normalized (cleaner)
            changes.push(
              `SKU: ${String(oldSku ?? "none")} -> ${String(newSku ?? "none")}`
            );
            oldValuesObj.sku = oldSku as string;
            newValuesObj.sku = newSku as string;
          }
        }
        if (data.type !== undefined && data.type !== oldItem.type) {
          fields.push("type = ?");
          values.push(data.type);
          changes.push(`Type: ${oldItem.type} -> ${data.type}`);
          oldValuesObj.type = oldItem.type;
          newValuesObj.type = data.type;
        }
        if (data.description !== undefined) {
          const oldDesc = normalize(oldItem.description);
          const newDesc = normalize(data.description);
          if (newDesc !== oldDesc) {
            fields.push("description = ?");
            values.push(newDesc);
            changes.push(`Description updated`);
            oldValuesObj.description = oldDesc as string;
            newValuesObj.description = newDesc as string;
          }
        }
        if (data.categoryId !== undefined) {
          const oldCat = normalize(oldItem.category_id);
          const newCat = normalize(data.categoryId);
          if (newCat !== oldCat) {
            fields.push("category_id = ?");
            values.push(newCat);
            changes.push(`Category updated`);
            oldValuesObj.categoryId = oldCat as string;
            newValuesObj.categoryId = newCat as string;
          }
        }
        if (data.unit !== undefined && data.unit !== oldItem.unit) {
          fields.push("unit = ?");
          values.push(data.unit);
          changes.push(`Unit: ${oldItem.unit} -> ${data.unit}`);
          oldValuesObj.unit = oldItem.unit;
          newValuesObj.unit = data.unit;
        }
        if (
          data.salePrice !== undefined &&
          data.salePrice !== oldItem.sale_price
        ) {
          fields.push("sale_price = ?");
          values.push(data.salePrice);
          changes.push(
            `Sale Price: ${oldItem.sale_price} -> ${data.salePrice}`
          );
          oldValuesObj.salePrice = oldItem.sale_price;
          newValuesObj.salePrice = data.salePrice;
        }
        if (data.purchasePrice !== undefined) {
          const oldPP = oldItem.purchase_price;
          const newPP = data.purchasePrice ?? 0;
          if (newPP !== oldPP) {
            fields.push("purchase_price = ?");
            values.push(newPP);
            changes.push(`Purchase Price: ${oldPP} -> ${newPP}`);
            oldValuesObj.purchasePrice = oldPP;
            newValuesObj.purchasePrice = newPP;
          }
        }
        if (
          data.stockQuantity !== undefined &&
          data.stockQuantity !== oldItem.stock_quantity
        ) {
          fields.push("stock_quantity = ?");
          values.push(data.stockQuantity);
          changes.push(
            `Stock: ${oldItem.stock_quantity} -> ${data.stockQuantity}`
          );
          oldValuesObj.stockQuantity = oldItem.stock_quantity;
          newValuesObj.stockQuantity = data.stockQuantity;
        }
        if (
          data.lowStockAlert !== undefined &&
          data.lowStockAlert !== oldItem.low_stock_alert
        ) {
          fields.push("low_stock_alert = ?");
          values.push(data.lowStockAlert);
          changes.push(
            `Low Stock Alert: ${oldItem.low_stock_alert} -> ${data.lowStockAlert}`
          );
          oldValuesObj.lowStockAlert = oldItem.low_stock_alert;
          newValuesObj.lowStockAlert = data.lowStockAlert;
        }
        if (data.taxRate !== undefined) {
          const oldTax = oldItem.tax_rate;
          const newTax = data.taxRate ?? null;
          // Ensure strict equality for numbers, assuming they are actually numbers or null
          const normalizedOldTax = oldTax ?? 0;
          const normalizedNewTax = newTax;

          if (normalizedNewTax !== normalizedOldTax) {
            fields.push("tax_rate = ?");
            values.push(newTax);
            changes.push(
              `Tax Rate: ${normalizedOldTax}% -> ${normalizedNewTax}%`
            );
            oldValuesObj.taxRate = oldTax ?? undefined;
            newValuesObj.taxRate = newTax;
          }
        }

        // Optional additional fields checks
        const checkOptional = (
          key: keyof ItemMutationData,
          dbCol: string,
          label: string
        ): void => {
          if (data[key] !== undefined) {
            const oldVal = normalize(
              oldItem[dbCol as keyof ItemRow] as
                | string
                | number
                | boolean
                | null
                | undefined
            );
            const newVal = normalize(
              data[key] as string | number | boolean | null | undefined
            );

            if (newVal !== oldVal) {
              fields.push(`${dbCol} = ?`);
              values.push(newVal);
              changes.push(
                `${label}: ${String(oldVal ?? "none")} -> ${String(newVal ?? "none")}`
              );
              (oldValuesObj as Record<string, unknown>)[key as string] = oldVal;
              (newValuesObj as Record<string, unknown>)[key as string] = newVal;
            }
          }
        };

        checkOptional("batchNumber", "batch_number", "Batch No");
        checkOptional("expiryDate", "expiry_date", "Expiry");
        checkOptional("manufactureDate", "manufacture_date", "Mfg Date");
        checkOptional("barcode", "barcode", "Barcode");
        checkOptional("hsnCode", "hsn_code", "HSN");
        checkOptional("warrantyDays", "warranty_days", "Warranty");
        checkOptional("brand", "brand", "Brand");
        checkOptional("modelNumber", "model_number", "Model");
        checkOptional("location", "location", "Location");

        fields.push("updated_at = ?");
        values.push(now);
        values.push(id);

        if (fields.length > 1) {
          // > 1 because updated_at is always added
          await tx.execute(
            `UPDATE items SET ${fields.join(", ")} WHERE id = ?`,
            values
          );

          // Create description string
          const description =
            changes.length > 0
              ? changes.join(", ")
              : "Item updated (no changes detected)";

          // Log history for update
          const historyId = crypto.randomUUID();
          await tx.execute(
            `INSERT INTO item_history (
                id, item_id, action, description,
                old_values, new_values, user_id, user_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              historyId,
              id,
              "updated",
              description,
              JSON.stringify(oldValuesObj),
              JSON.stringify(newValuesObj),
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

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        // Log history before delete (technically "deleted" action usually preserves the history record even if item is gone, or we might want to keep the item soft deleted? PowerSync usually syncs deletes. History table remains.)
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO item_history (
            id, item_id, action, description,
            old_values, new_values, user_id, user_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "deleted",
            `Item deleted`,
            null,
            null,
            user?.id ?? null,
            userName,
            now,
          ]
        );

        await tx.execute(`DELETE FROM items WHERE id = ?`, [id]);
      });
    },
    [db]
  );

  const toggleItemActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `UPDATE items SET is_active = ?, updated_at = ? WHERE id = ?`,
          [isActive ? 1 : 0, now, id]
        );

        // Log history
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO item_history (
            id, item_id, action, description,
            old_values, new_values, user_id, user_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            isActive ? "activated" : "deactivated",
            `Item ${isActive ? "activated" : "deactivated"}`,
            null,
            JSON.stringify({ isActive }),
            user?.id ?? null,
            userName,
            now,
          ]
        );
      });
    },
    [db]
  );

  const adjustStock = useCallback(
    async (id: string, quantity: number): Promise<void> => {
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      const userName =
        user?.user_metadata.full_name ?? user?.email ?? "Unknown User";

      await db.writeTransaction(async (tx) => {
        // Get current stock before update
        const result = await tx.execute(
          `SELECT stock_quantity, name FROM items WHERE id = ?`,
          [id]
        );
        const row = result.rows?.item(0) as
          | { stock_quantity: number; name: string }
          | undefined;
        const oldStock = row?.stock_quantity ?? 0;
        const itemName = row?.name ?? "Unknown";
        const newStock = oldStock + quantity;

        await tx.execute(
          `UPDATE items SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?`,
          [quantity, now, id]
        );

        // Log history
        const historyId = crypto.randomUUID();
        await tx.execute(
          `INSERT INTO item_history (
            id, item_id, action, description,
            old_values, new_values, user_id, user_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            id,
            "stock_adjusted",
            `Stock adjusted for "${itemName}": ${oldStock} → ${newStock} (${quantity > 0 ? "+" : ""}${quantity})`,
            JSON.stringify({ stockQuantity: oldStock }),
            JSON.stringify({ stockQuantity: newStock, adjustment: quantity }),
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
    createItem,
    updateItem,
    deleteItem,
    toggleItemActive,
    adjustStock,
  };
}
