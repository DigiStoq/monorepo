import { UpdateType } from "@powersync/web";
import type {
  CrudEntry,
  PowerSyncBackendConnector,
  AbstractPowerSyncDatabase,
} from "@powersync/web";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of records to batch in a single request */
const MERGE_BATCH_LIMIT = 100;

// ============================================================================
// TYPES
// ============================================================================

interface BatchedOperation {
  table: string;
  op: UpdateType;
  records: { id: string; data: Record<string, unknown> }[];
}

// ============================================================================
// SUPABASE CONNECTOR
// ============================================================================

export class SupabaseConnector implements PowerSyncBackendConnector {
  // Cache the session to avoid hitting Supabase Auth rate limits
  private currentSession: { access_token: string; expires_at?: number } | null =
    null;

  // Buffer time in seconds to refresh token before it strictly expires
  private readonly TOKEN_EXPIRY_BUFFER = 60; // 1 minute

  constructor(
    private client: SupabaseClient,
    private powersyncUrl: string
  ) {}

  // ============================================================================
  // CREDENTIALS (unchanged logic, cleaned up)
  // ============================================================================

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

  // ============================================================================
  // UPLOAD DATA - BATCHED IMPLEMENTATION
  // ============================================================================

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
      // Batch operations for efficiency
      const batches = this.batchOperations(transaction.crud, userId);
      // eslint-disable-next-line no-console
      console.log("[SupabaseConnector] Executing", batches.length, "batches");

      // Execute each batch
      for (const batch of batches) {
        await this.executeBatch(batch);
      }

      // Complete transaction (Custom Write Checkpoints require Team plan $599+)
      await transaction.complete();
    } catch (error) {
      console.error("[SupabaseConnector] Upload error:", error);
      throw error;
    }
  }

  // ============================================================================
  // BATCHING LOGIC
  // ============================================================================

  private batchOperations(
    operations: CrudEntry[],
    userId?: string
  ): BatchedOperation[] {
    const batches: BatchedOperation[] = [];
    let currentBatch: BatchedOperation | null = null;

    // eslint-disable-next-line no-console
    console.log(
      `[SupabaseConnector] Processing ${operations.length} CRUD operations:`
    );
    for (const op of operations) {
      // eslint-disable-next-line no-console
      console.log(
        `[SupabaseConnector] - ${op.op} on ${op.table} (id: ${op.id})`
      );
    }

    for (const op of operations) {
      const transformedData =
        this.transformData(op.table, op.opData, userId) ?? {};

      // PATCH operations are always individual (partial updates)
      if (op.op === UpdateType.PATCH) {
        if (currentBatch) {
          batches.push(currentBatch);
          currentBatch = null;
        }
        batches.push({
          table: op.table,
          op: op.op,
          records: [{ id: op.id, data: transformedData }],
        });
        continue;
      }

      // Check if we can add to current batch
      const canBatch =
        currentBatch &&
        currentBatch.table === op.table &&
        currentBatch.op === op.op &&
        currentBatch.records.length < MERGE_BATCH_LIMIT;

      if (currentBatch && canBatch) {
        currentBatch.records.push({ id: op.id, data: transformedData });
      } else {
        // Start new batch
        if (currentBatch) batches.push(currentBatch);
        currentBatch = {
          table: op.table,
          op: op.op,
          records: [{ id: op.id, data: transformedData }],
        };
      }
    }

    // Push final batch
    if (currentBatch) batches.push(currentBatch);

    return batches;
  }

  // ============================================================================
  // BATCH EXECUTION
  // ============================================================================

  private async executeBatch(batch: BatchedOperation): Promise<void> {
    const { table, op, records } = batch;

    switch (op) {
      case UpdateType.PUT: {
        const payload = records.map((r) => ({ id: r.id, ...r.data }));
        // Options to reduce egress bandwidth
        const options: {
          onConflict?: string;
          returning?: "minimal";
          count?: "exact";
        } = {
          returning: "minimal",
          count: "exact", // Returns only count, not rows - reduces egress
        };

        // Handle special conflict resolution for per-user settings tables
        const userIdConflictTables = [
          "user_profiles",
          "user_preferences",
          "company_settings",
          "invoice_settings",
        ];
        if (userIdConflictTables.includes(table)) {
          options.onConflict = "user_id";
        }

        const { error } = await this.client
          .from(table)
          .upsert(payload, options);

        if (error) {
          console.error(`[SupabaseConnector] Error upserting ${table}:`, error);
          throw error;
        }
        break;
      }

      case UpdateType.DELETE: {
        const ids = records.map((r) => r.id);
        const { error } = await this.client
          .from(table)
          .delete({ count: "exact" })
          .in("id", ids);

        if (error) {
          console.error(`[SupabaseConnector] Error deleting ${table}:`, error);
          throw error;
        }
        break;
      }

      case UpdateType.PATCH: {
        // PATCH is always single record - partial update
        const { id, data } = records[0];
        const { error } = await this.client
          .from(table)
          .update(data, { count: "exact" })
          .eq("id", id);

        if (error) {
          console.error(`[SupabaseConnector] Error updating ${table}:`, error);
          throw error;
        }
        break;
      }
    }
  }

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

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

    // Sanitize empty strings to null to comply with Postgres check constraints
    Object.keys(transformed).forEach((key) => {
      if (transformed[key] === "") {
        transformed[key] = null;
      }
    });

    return transformed;
  }
}
