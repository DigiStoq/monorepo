import { UpdateType } from "@powersync/web";
import type {
  CrudEntry,
  PowerSyncBackendConnector,
  AbstractPowerSyncDatabase,
} from "@powersync/web";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseConnector implements PowerSyncBackendConnector {
  constructor(
    private client: SupabaseClient,
    private powersyncUrl: string
  ) {}

  // Cache the session to avoid hitting Supabase Auth rate limits
  private currentSession: { access_token: string; expires_at?: number } | null =
    null;

  // Buffer time in seconds to refresh token before it strictly expires
  private readonly TOKEN_EXPIRY_BUFFER = 60; // 1 minute

  async fetchCredentials(): Promise<{
    endpoint: string;
    token: string;
  } | null> {
    // Basic online check to avoid hammering when offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return null;
    }

    // Check if we have a valid cached session
    if (this.currentSession?.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      // If token expires in more than BUFFER seconds, reuse it
      if (this.currentSession.expires_at > now + this.TOKEN_EXPIRY_BUFFER) {
        const endpoint = this.powersyncUrl.replace(/\/$/, "");
        return {
          endpoint,
          token: this.currentSession.access_token,
        };
      }
    }

    const {
      data: { session },
    } = await this.client.auth.getSession();

    if (!session) {
      return null;
    }

    // Cache the new session
    this.currentSession = {
      access_token: session.access_token,
      expires_at: session.expires_at,
    };

    const credentials = {
      endpoint: this.powersyncUrl.replace(/\/$/, ""),
      token: session.access_token,
    };

    return credentials;
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    // Get current user ID for this batch
    const {
      data: { session },
    } = await this.client.auth.getSession();
    const userId = session?.user.id;

    try {
      for (const operation of transaction.crud) {
        await this.applyOperation(operation, userId);
      }
      await transaction.complete();
    } catch (error) {
      console.error(error);
    }
  }

  private async applyOperation(
    operation: CrudEntry,
    userId?: string
  ): Promise<void> {
    const { op, table, opData, id } = operation;

    // Transform data to handle null values for required fields and inject user_id
    const transformedData = this.transformData(table, opData, userId);

    switch (op) {
      case UpdateType.PUT: {
        const { error } = await this.client
          .from(table)
          .upsert({ id, ...transformedData });

        if (error) {
          console.error(`Error upserting ${table}:`, error);
          throw error;
        }
        break;
      }
      case UpdateType.PATCH: {
        const { error } = await this.client
          .from(table)
          .update(transformedData)
          .eq("id", id);

        if (error) {
          console.error(`Error updating ${table}:`, error);
          throw error;
        }
        break;
      }
      case UpdateType.DELETE: {
        const { error } = await this.client.from(table).delete().eq("id", id);

        if (error) {
          console.error(`Error deleting ${table}:`, error);
          throw error;
        }
        break;
      }
    }
  }

  // Transform data to provide default values for required fields that might be null/undefined/empty
  private transformData(
    table: string,
    data: Record<string, unknown> | undefined,
    userId?: string
  ): Record<string, unknown> | undefined {
    if (!data) return data;

    const transformed: Record<string, unknown> = { ...data };

    if (userId) {
      transformed.user_id = userId;
    }

    // Sanitize empty strings to null to comply with Postgres check constraints (e.g. status enums)
    Object.keys(transformed).forEach((key) => {
      if (transformed[key] === "") {
        transformed[key] = null;
      }
    });

    return transformed;
  }
}
