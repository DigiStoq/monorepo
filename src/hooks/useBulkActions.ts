import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type {
  BulkUpdateType,
  BulkUpdateResult,
} from "@/features/utilities/types";
import { useAuthStore } from "@/stores/auth-store";
import type { ItemRecord } from "@/lib/schema";

export function useBulkActions(): {
  bulkUpdate: (
    type: BulkUpdateType,
    selectedIds: string[],
    config: unknown
  ) => Promise<BulkUpdateResult>;
} {
  const db = getPowerSyncDatabase();
  const { user } = useAuthStore();

  const bulkUpdate = useCallback(
    async (
      type: BulkUpdateType,
      selectedIds: string[],
      config: unknown
    ): Promise<BulkUpdateResult> => {
      if (!user?.id) throw new Error("User not authenticated");
      if (selectedIds.length === 0) {
        return { success: true, updated: 0, failed: 0, errors: [] };
      }

      let updatedCount = 0;
      let failedCount = 0;
      const errors: { id: string; message: string }[] = [];

      try {
        await db.writeTransaction(async (tx) => {
          // In a real heavy app, we might construct a single giant SQL query
          for (const id of selectedIds) {
            try {
              if (type === "price") {
                const priceConfig = config as {
                  type: "fixed" | "percentage";
                  value: number;
                  applyTo: "sale" | "purchase" | "both";
                };
                const { value, applyTo, type: adjustType } = priceConfig;

                const itemResult = await tx.get<ItemRecord>(
                  `SELECT * FROM items WHERE id = ?`,
                  [id]
                );
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (!itemResult) continue;

                let newSalePrice = itemResult.sale_price ?? 0;
                let newPurchasePrice = itemResult.purchase_price ?? 0;

                if (applyTo === "sale" || applyTo === "both") {
                  if (adjustType === "fixed") newSalePrice = value;
                  else newSalePrice = newSalePrice * (1 + value / 100);
                }
                if (applyTo === "purchase" || applyTo === "both") {
                  if (adjustType === "fixed") newPurchasePrice = value;
                  else newPurchasePrice = newPurchasePrice * (1 + value / 100);
                }

                await tx.execute(
                  `UPDATE items SET sale_price = ?, purchase_price = ?, updated_at = ? WHERE id = ?`,
                  [newSalePrice, newPurchasePrice, new Date().toISOString(), id]
                );
                updatedCount++;
              } else if (type === "category") {
                const categoryConfig = config as { categoryId: string };
                await tx.execute(
                  `UPDATE items SET category_id = ?, updated_at = ? WHERE id = ?`,
                  [categoryConfig.categoryId, new Date().toISOString(), id]
                );
                updatedCount++;
              } else if (type === "status") {
                const statusConfig = config as { isActive: boolean };
                await tx.execute(
                  `UPDATE items SET is_active = ?, updated_at = ? WHERE id = ?`,
                  [statusConfig.isActive ? 1 : 0, new Date().toISOString(), id]
                );
                updatedCount++;
              }
            } catch (err: unknown) {
              failedCount++;
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              errors.push({ id, message: errorMessage });
            }
          }
        });
      } catch (err: unknown) {
        console.error("Bulk update failed", err);
        return {
          success: false,
          updated: updatedCount,
          failed:
            failedCount + (selectedIds.length - updatedCount - failedCount),
          errors,
        };
      }

      return {
        success: true,
        updated: updatedCount,
        failed: failedCount,
        errors,
      };
    },
    [db, user]
  );

  return { bulkUpdate };
}
