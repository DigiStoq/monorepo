import { useQuery } from "@powersync/react";
import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { Category } from "@/features/inventory/types";

// Database row type (snake_case columns from SQLite)
interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  item_count: number;
  created_at: string;
}

function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    itemCount: row.item_count,
  };
}

export function useCategories(): {
  categories: Category[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<CategoryRow>(
    `SELECT c.*, COALESCE(item_counts.count, 0) as item_count
     FROM categories c
     LEFT JOIN (
       SELECT category_id, COUNT(*) as count
       FROM items
       WHERE is_active = 1
       GROUP BY category_id
     ) item_counts ON c.id = item_counts.category_id
     ORDER BY c.name`
  );

  const categories = data.map(mapRowToCategory);

  return { categories, isLoading, error };
}

interface CategoryMutations {
  createCategory: (data: {
    name: string;
    description?: string;
  }) => Promise<string>;
  updateCategory: (
    id: string,
    data: { name?: string; description?: string }
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useCategoryMutations(): CategoryMutations {
  const db = getPowerSyncDatabase();

  const createCategory = useCallback(
    async (data: { name: string; description?: string }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO categories (id, name, description, item_count, created_at)
            VALUES (?, ?, ?, ?, ?)`,
          [id, data.name, data.description ?? null, 0, now]
        );
      });

      return id;
    },
    [db]
  );

  const updateCategory = useCallback(
    async (
      id: string,
      data: { name?: string; description?: string }
    ): Promise<void> => {
      await db.writeTransaction(async (tx) => {
        const fields: string[] = [];
        const values: (string | number)[] = [];

        if (data.name !== undefined) {
          fields.push("name = ?");
          values.push(data.name);
        }
        if (data.description !== undefined) {
          fields.push("description = ?");
          values.push(data.description);
        }

        values.push(id);

        if (fields.length > 0) {
          await tx.execute(
            `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
            values
          );
        }
      });
    },
    [db]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      await db.writeTransaction(async (tx) => {
        // First, unlink items from this category
        await tx.execute(
          `UPDATE items SET category_id = NULL WHERE category_id = ?`,
          [id]
        );
        // Then delete the category
        await tx.execute(`DELETE FROM categories WHERE id = ?`, [id]);
      });
    },
    [db]
  );

  return {
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
