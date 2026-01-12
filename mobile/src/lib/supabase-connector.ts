import type {
  PowerSyncBackendConnector,
  CrudEntry,
} from "@powersync/react-native";
import { UpdateType } from "@powersync/react-native";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseConnector implements PowerSyncBackendConnector {
  constructor(
    private client: SupabaseClient,
    private powersyncUrl: string
  ) {}

  // Cache the session to avoid hitting Supabase Auth rate limits
  private currentSession: { access_token: string; expires_at?: number } | null = null;
  
  // Buffer time in seconds to refresh token before it strictly expires
  private readonly TOKEN_EXPIRY_BUFFER = 60; // 1 minute

  async fetchCredentials() {
    // Check if we have a valid cached session
    if (this.currentSession?.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        // If token expires in more than BUFFER seconds, reuse it
        if (this.currentSession.expires_at > now + this.TOKEN_EXPIRY_BUFFER) {
             // console.log("[SupabaseConnector] Using cached credentials.");
             const endpoint = this.powersyncUrl.replace(/\/$/, "");
             return {
                 endpoint,
                 token: this.currentSession.access_token
             };
        }
    }

    console.log("[SupabaseConnector] Fetching credentials...");
    const {
      data: { session },
    } = await this.client.auth.getSession();

    if (!session) {
      console.warn("[SupabaseConnector] No active session found.");
      return null;
    }

    // Cache the new session
    this.currentSession = {
        access_token: session.access_token,
        expires_at: session.expires_at
    };

    console.log(`[SupabaseConnector] Session found. Token length: ${session.access_token?.length}`);
    const endpoint = this.powersyncUrl.replace(/\/$/, "");
    console.log(`[SupabaseConnector] Using PowerSync URL: ${endpoint}`);

    return {
      endpoint,
      token: session.access_token,
    };
  }

  async uploadData(database: any): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    const {
      data: { session },
    } = await this.client.auth.getSession();
    const userId = session?.user?.id;

    try {
      for (const operation of transaction.crud) {
        await this.applyOperation(operation, userId);
      }
      await transaction.complete();
    } catch (error) {
      console.error("Upload error:", error);
    }
  }

  private async applyOperation(
    operation: CrudEntry,
    userId?: string
  ): Promise<void> {
    const { op, table, opData, id } = operation;
    const transformedData = this.transformData(opData, userId);

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

  private transformData(
    data: Record<string, unknown> | undefined,
    userId?: string
  ): Record<string, unknown> | undefined {
    if (!data) return data;

    const transformed: Record<string, unknown> = { ...data };

    if (userId) {
      transformed.user_id = userId;
    }

    // Sanitize empty strings to null for Postgres constraints
    Object.keys(transformed).forEach((key) => {
      if (transformed[key] === "") {
        transformed[key] = null;
      }
    });

    return transformed;
  }
}
