import type { AbstractPowerSyncDatabase } from "@powersync/web";

export class DatabaseBackupService {
  constructor(private db: AbstractPowerSyncDatabase) {}

  private get tables(): string[] {
    return [
      // Core
      "customers",
      "categories",
      "items",
      "item_history",
      // Sales
      "sale_invoices",
      "sale_invoice_items",
      "payment_ins",
      "estimates",
      "estimate_items",
      "credit_notes",
      "credit_note_items",
      "invoice_history",
      // Purchases
      "purchase_invoices",
      "purchase_invoice_items",
      "payment_outs",
      "expenses",
      // Cash & Bank
      "bank_accounts",
      "bank_transactions",
      "cash_transactions",
      "cheques",
      "loans",
      "loan_payments",
      // Settings
      "company_settings",
      "tax_rates",
      "invoice_settings",
      "sequence_counters",
      "user_profiles",
      "user_preferences",
      "security_settings",
      "backup_settings",
      "backup_history",
    ];
  }

  async createBackup(): Promise<string> {
    const backupData: Record<string, unknown> = {
      _meta: {
        version: "1.0",
        timestamp: new Date().toISOString(),
        tables: this.tables,
      },
    };

    // Process tables sequentially to avoid overwhelming the connection
    for (const table of this.tables) {
      try {
        const result = await this.db.getAll(`SELECT * FROM ${table}`);
        backupData[table] = result;
      } catch (e) {
        console.warn(`[Backup] Failed to fetching table ${table}:`, e);
        backupData[table] = []; // Ensure key exists even if empty/failed
      }
    }

    return JSON.stringify(backupData, null, 2);
  }

  async restoreBackup(
    jsonContent: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonContent);
      if (!data._meta) {
        return {
          success: false,
          message: "Invalid backup file: Missing metadata",
        };
      }

      await this.db.writeTransaction(async (tx) => {
        for (const table of this.tables) {
          if (data[table] && Array.isArray(data[table])) {
            const rows = data[table];
            if (rows.length === 0) continue;

            // 1. Clear existing data (Be careful here! Maybe we want upsert?)
            // For strict restore, clearing is cleaner but destructive.
            // Let's assume strict restore for now.
            await tx.execute(`DELETE FROM ${table}`);

            // 2. Insert rows
            for (const row of rows) {
              const columns = Object.keys(row);
              if (columns.length === 0) continue;

              const placeholders = columns.map(() => "?").join(", ");
              const values = columns.map((col) => row[col]);
              const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

              await tx.execute(sql, values);
            }
          }
        }
      });

      return { success: true, message: "Restore completed successfully" };
    } catch (e: unknown) {
      console.error("[Restore] Failed:", e);
      const msg =
        e instanceof Error ? e.message : "Unknown error during restore";
      return { success: false, message: msg };
    }
  }
}
