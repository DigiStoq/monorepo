import { PowerSyncDatabase } from "@powersync/web";
import { SupabaseConnector } from "./supabase-connector";
import { AppSchema } from "./schema";
import { supabase } from "./supabase-client";

export * from "./schema";

// ============================================================================
// DATABASE INSTANCE
// ============================================================================

let powerSyncInstance: PowerSyncDatabase | null = null;

export function getPowerSyncDatabase(): PowerSyncDatabase {
  if (powerSyncInstance) {
    return powerSyncInstance;
  }

  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: "digistoq.sqlite",
    },
  });

  return powerSyncInstance;
}

export async function initializePowerSync(): Promise<PowerSyncDatabase> {
  const db = getPowerSyncDatabase();

  // Initialize connector for sync with Supabase
  const connector = new SupabaseConnector(
    supabase,
    import.meta.env.VITE_POWERSYNC_URL
  );

  // Connect to PowerSync service
  await db.connect(connector);

  return db;
}

export async function disconnectPowerSync(): Promise<void> {
  if (powerSyncInstance) {
    await powerSyncInstance.disconnect();
    powerSyncInstance = null;
  }
}

export { powerSyncInstance };
