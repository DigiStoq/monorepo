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

  async fetchCredentials() {
    const {
      data: { session },
    } = await this.client.auth.getSession();

    if (!session) {
      return null;
    }

    return {
      endpoint: this.powersyncUrl,
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
