import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { ExportOptions, ExportResult } from "@/features/utilities/types";
import { useAuthStore } from "@/stores/auth-store";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { isTauri } from "@tauri-apps/api/core";

export function useDataExport(): {
  exportData: (options: ExportOptions) => Promise<ExportResult>;
} {
  const db = getPowerSyncDatabase();
  const { user } = useAuthStore();

  const exportData = useCallback(
    async (options: ExportOptions): Promise<ExportResult> => {
      if (!user?.id) throw new Error("User not authenticated");

      let query = "";
      const params: unknown[] = [user.id];
      let filename = `digistoq-${options.entityType}-${new Date()
        .toISOString()
        .slice(0, 10)}`;

      // 1. Build Query based on Entity Type
      switch (options.entityType) {
        case "customers":
          query = "SELECT * FROM customers WHERE user_id = ?";
          break;
        case "items":
          query = "SELECT * FROM items WHERE user_id = ?";
          break;
        case "sale-invoices":
          query = "SELECT * FROM sale_invoices WHERE user_id = ?";
          break;
        case "purchase-invoices":
          query = "SELECT * FROM purchase_invoices WHERE user_id = ?";
          break;
        case "payments":
          query = "SELECT * FROM payment_ins WHERE user_id = ?";
          break;
        case "expenses":
          query = "SELECT * FROM expenses WHERE user_id = ?";
          break;
        default:
          throw new Error(
            `Unsupported entity type: ${options.entityType as string}`
          );
      }

      // 2. Fetch Data
      const result = await db.getAll<Record<string, unknown>>(query, params);

      // 3. Convert to Format
      let content = "";
      let mimeType = "";
      let extension = "";

      if (options.format === "csv") {
        mimeType = "text/csv;charset=utf-8;";
        extension = "csv";
        filename += ".csv";
        if (result.length > 0) {
          const headers = Object.keys(result[0] as object).join(",");
          const rows = result.map((row) =>
            Object.values(row as object)
              .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
              .join(",")
          );
          content = [headers, ...rows].join("\n");
        }
      } else {
        // xlsx or pdf handled as json for now in this mock implementation
        mimeType = "application/json";
        extension = "json";
        filename += ".json";
        content = JSON.stringify(result, null, 2);
      }

      // 4. Trigger Download / Save
      if (isTauri()) {
        try {
          const savePath = await save({
            defaultPath: filename,
            filters: [
              {
                name: options.format.toUpperCase(),
                extensions: [extension],
              },
            ],
          });

          if (savePath) {
            await writeTextFile(savePath, content);
          } else {
            // User cancelled
            return {
              success: false,
              filename: "",
              recordCount: 0,
              fileSize: 0,
            };
          }
        } catch (err) {
          console.error("Tauri save failed, falling back to web download", err);
          // Fallback logic below if needed, or just throw
          throw err;
        }
      } else {
        // Web fallback
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      return {
        success: true,
        filename,
        recordCount: result.length,
        fileSize: content.length,
      };
    },
    [db, user]
  );

  return { exportData };
}
