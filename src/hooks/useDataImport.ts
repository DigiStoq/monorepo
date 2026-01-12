import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type {
  ImportEntityType,
  ImportResult,
} from "@/features/utilities/types";
import { useAuthStore } from "@/stores/auth-store";

export function useDataImport(): {
  importData: (
    entityType: ImportEntityType,
    data: Record<string, unknown>[]
  ) => Promise<ImportResult>;
} {
  const db = getPowerSyncDatabase();
  const { user } = useAuthStore();

  const importData = useCallback(
    async (
      entityType: ImportEntityType,
      data: Record<string, unknown>[]
    ): Promise<ImportResult> => {
      if (!user?.id) throw new Error("User not authenticated");

      let importedCount = 0;
      let skippedCount = 0;
      const errors: ImportResult["errors"] = [];

      try {
        await db.writeTransaction(async (tx) => {
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowIndex = i + 1;

            try {
              if (entityType === "customers") {
                // Basic validation
                if (!row.name) {
                  skippedCount++;
                  continue;
                }

                // Check for duplicates (Name)
                const existing = await tx.getAll(
                  `SELECT id FROM customers WHERE user_id = ? AND name = ?`,
                  [user.id, row.name]
                );

                if (existing.length > 0) {
                  errors.push({
                    row: rowIndex,
                    field: "name",
                    message: "Skipped: Customer with this name already exists",
                    value: row.name,
                  });
                  skippedCount++;
                  continue;
                }

                await tx.execute(
                  `INSERT INTO customers (
                    user_id, id, name, phone, email, type, address, city, state, zip_code, created_at, updated_at
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    user.id,
                    crypto.randomUUID(),
                    row.name,
                    (row.phone as string) || null,
                    (row.email as string) || null,
                    (() => {
                      const t = (typeof row.type === "string" ? row.type : "")
                        .toLowerCase()
                        .trim();
                      if (
                        t.includes("both") ||
                        (t.includes("customer") && t.includes("supplier"))
                      )
                        return "both";
                      if (t.includes("supplier")) return "supplier";
                      return "customer";
                    })(),
                    (row.address as string) || null,
                    (row.city as string) || null,
                    (row.state as string) || null,
                    (row.zipCode as string) || null,
                    new Date().toISOString(),
                    new Date().toISOString(),
                  ]
                );
                importedCount++;
              } else if (entityType === "items") {
                // Basic validation
                if (!row.name) {
                  skippedCount++;
                  continue;
                }

                // Check for duplicates (Name or SKU)
                let existing;
                if (row.sku) {
                  existing = await tx.getAll(
                    `SELECT id FROM items WHERE user_id = ? AND (name = ? OR sku = ?)`,
                    [user.id, row.name, row.sku]
                  );
                } else {
                  existing = await tx.getAll(
                    `SELECT id FROM items WHERE user_id = ? AND name = ?`,
                    [user.id, row.name]
                  );
                }

                if (existing.length > 0) {
                  errors.push({
                    row: rowIndex,
                    field: "Name/SKU",
                    message:
                      "Skipped: Item with this Name or SKU already exists",
                    value: `${String(row.name as string | null)} / ${(row.sku as string | null) ?? ""}`,
                  });
                  skippedCount++;
                  continue;
                }

                await tx.execute(
                  `INSERT INTO items (
                    user_id, id, name, sku, description, sale_price, purchase_price, stock_quantity, unit, type, is_active, created_at, updated_at
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    user.id,
                    crypto.randomUUID(),
                    row.name,
                    (row.sku as string) || null,
                    (row.description as string) || null,
                    parseFloat((row.salePrice as string) || "0"),
                    parseFloat((row.purchasePrice as string) || "0"),
                    parseFloat((row.openingStock as string) || "0"),
                    (row.unit as string) || "pc",
                    "product",
                    1,
                    new Date().toISOString(),
                    new Date().toISOString(),
                  ]
                );
                importedCount++;
              }
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              errors.push({
                row: rowIndex,
                field: "unknown",
                message: errorMessage || "Insert failed",
                value: row,
              });
              skippedCount++;
            }
          }
        });
      } catch (err: unknown) {
        console.error("Import transaction failed", err);
        throw err;
      }

      return {
        success: true,
        imported: importedCount,
        skipped: skippedCount,
        errors,
      };
    },
    [db, user]
  );

  return { importData };
}
