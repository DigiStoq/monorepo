import type {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
} from "@powersync/web";
import { UpdateType } from "@powersync/web";
import { createClient } from "@supabase/supabase-js";

// Environment variables for Supabase connection
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISABLE_KEY;
const POWERSYNC_URL = import.meta.env.VITE_POWERSYNC_URL;

export class SupabaseConnector implements PowerSyncBackendConnector {
  private supabase;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }

  async fetchCredentials(): Promise<{
    endpoint: string;
    token: string;
    expiresAt?: Date;
  }> {
    // Get the current session
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session. User must be authenticated.");
    }

    return {
      endpoint: POWERSYNC_URL,
      token: session.access_token,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    try {
      for (const operation of transaction.crud) {
        await this.applyOperation(operation);
      }
      await transaction.complete();
    } catch (error) {
      console.error("Error uploading data:", error);
      throw error;
    }
  }

  private async applyOperation(operation: CrudEntry): Promise<void> {
    const { op, table, opData, id } = operation;

    switch (op) {
      case UpdateType.PUT: {
        // Insert or update
        const { error } = await this.supabase
          .from(table)
          .upsert({ id, ...opData });

        if (error) {
          throw error;
        }
        break;
      }

      case UpdateType.PATCH: {
        // Update existing record
        const { error } = await this.supabase
          .from(table)
          .update(opData ?? {})
          .eq("id", id);

        if (error) {
          throw error;
        }
        break;
      }

      case UpdateType.DELETE: {
        // Delete record
        const { error } = await this.supabase.from(table).delete().eq("id", id);

        if (error) {
          throw error;
        }
        break;
      }

      default:
        throw new Error(`Unknown operation type: ${op as string}`);
    }
  }

  // Get the Supabase client for direct queries if needed
  getSupabaseClient(): ReturnType<typeof createClient> {
    return this.supabase;
  }
}
