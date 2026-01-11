import type {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from "@powersync/web";
import { UpdateType } from "@powersync/web";
import { createClient } from "@supabase/supabase-js";

// Environment variables for Supabase connection
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISABLE_KEY;
const POWERSYNC_URL = import.meta.env.VITE_POWERSYNC_URL;

// Shared Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export class SupabaseConnector implements PowerSyncBackendConnector {
  private supabase = supabase;

  async fetchCredentials(): Promise<PowerSyncCredentials> {
    // Get the current session
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    // If no session, return null credentials - sync won't work but local db will
    if (!session) {
      console.warn("No auth session - PowerSync sync disabled. Data stored locally only.");
      // Return empty credentials - PowerSync will work offline-only
      return {
        endpoint: POWERSYNC_URL,
        token: "", // Empty token means no sync
      };
    }

    const credentials: PowerSyncCredentials = {
      endpoint: POWERSYNC_URL,
      token: session.access_token,
    };

    if (session.expires_at) {
      credentials.expiresAt = new Date(session.expires_at * 1000);
    }

    return credentials;
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
  getSupabaseClient(): typeof this.supabase {
    return this.supabase;
  }
}
