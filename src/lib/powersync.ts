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

  // Create database with SharedWorker disabled to fix refresh issues
  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: "digistoq.sqlite",
    },
    // Disable SharedWorker to prevent stale worker state on page refresh

    flags: {
      useWebWorker: true,
      // Try to disable SharedWorker
      enableMultiTabs: false,
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

  // eslint-disable-next-line no-console
  console.log("[PowerSync] Connecting...");
  // eslint-disable-next-line no-console
  console.log("[PowerSync] URL:", import.meta.env.VITE_POWERSYNC_URL);

  try {
    // Check if already connected
    if (db.connected) {
      // eslint-disable-next-line no-console
      console.log("[PowerSync] Already connected, reusing connection.");
      return db;
    }

    // Use a timeout to prevent infinite hang
    const connectPromise = db.connect(connector);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        reject(new Error("PowerSync connection timeout after 15s"));
      }, 15000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    // eslint-disable-next-line no-console
    console.log("[PowerSync] Connected successfully.");
  } catch (err) {
    console.error("[PowerSync] Connection failed:", err);
    console.warn("[PowerSync] Continuing in offline mode...");
  }

  return db;
}

export async function disconnectPowerSync(): Promise<void> {
  if (powerSyncInstance) {
    try {
      await powerSyncInstance.close();
      // eslint-disable-next-line no-console
      console.log("[PowerSync] Closed successfully.");
    } catch (e) {
      console.warn("[PowerSync] Close error:", e);
    }
    powerSyncInstance = null;
  }
}

export { powerSyncInstance };
