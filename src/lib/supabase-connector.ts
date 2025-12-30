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

    // Transform data to handle null values for required fields
    const transformedData = this.transformData(table, opData);

    switch (op) {
      case UpdateType.PUT: {
        // Insert or update
        const { error } = await this.supabase
          .from(table)
          .upsert({ id, ...transformedData });

        if (error) {
          throw error;
        }
        break;
      }

      case UpdateType.PATCH: {
        // Update existing record
        const { error } = await this.supabase
          .from(table)
          .update(transformedData ?? {})
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

  // Transform data to provide default values for required fields that might be null/undefined/empty
  private transformData(table: string, data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (!data) return data;

    const transformed = { ...data };

    // Helper to check if a value is missing (null, undefined, or empty string)
    const isMissing = (value: unknown): boolean =>
      value === null || value === undefined || value === "";

    // Helper to convert empty strings to null for UUID fields
    const emptyToNull = (value: unknown): unknown =>
      value === "" ? null : value;

    // Handle sale_invoices table - due_date is required
    if (table === "sale_invoices") {
      if (isMissing(transformed.due_date)) {
        // Default to 30 days from the invoice date, or current date if no date
        const invoiceDate = transformed.date as string | null;
        const baseDate = invoiceDate ? new Date(invoiceDate) : new Date();
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + 30);
        transformed.due_date = dueDate.toISOString().slice(0, 10);
      }
    }

    // Handle purchase_invoices table - due_date is required
    if (table === "purchase_invoices") {
      if (isMissing(transformed.due_date)) {
        const invoiceDate = transformed.date as string | null;
        const baseDate = invoiceDate ? new Date(invoiceDate) : new Date();
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + 30);
        transformed.due_date = dueDate.toISOString().slice(0, 10);
      }
    }

    // Handle bank_transactions - UUID fields should be null not empty string
    if (table === "bank_transactions") {
      transformed.related_customer_id = emptyToNull(transformed.related_customer_id);
      transformed.related_invoice_id = emptyToNull(transformed.related_invoice_id);
    }

    // Handle cash_transactions - UUID fields should be null not empty string
    if (table === "cash_transactions") {
      transformed.related_customer_id = emptyToNull(transformed.related_customer_id);
      transformed.related_invoice_id = emptyToNull(transformed.related_invoice_id);
    }

    // Handle cheques - UUID fields should be null not empty string
    if (table === "cheques") {
      transformed.related_invoice_id = emptyToNull(transformed.related_invoice_id);
    }

    // Handle payment_ins - UUID fields should be null not empty string
    if (table === "payment_ins") {
      transformed.invoice_id = emptyToNull(transformed.invoice_id);
    }

    // Handle payment_outs - UUID fields should be null not empty string
    if (table === "payment_outs") {
      transformed.invoice_id = emptyToNull(transformed.invoice_id);
    }

    // Handle expenses - UUID fields should be null not empty string
    if (table === "expenses") {
      transformed.customer_id = emptyToNull(transformed.customer_id);
    }

    // Handle items - category_id is optional UUID
    if (table === "items") {
      transformed.category_id = emptyToNull(transformed.category_id);
    }

    // Handle estimates - customer_id and converted_to fields
    if (table === "estimates") {
      transformed.customer_id = emptyToNull(transformed.customer_id);
      transformed.converted_to_invoice_id = emptyToNull(transformed.converted_to_invoice_id);
    }

    // Handle estimate_items - optional UUIDs
    if (table === "estimate_items") {
      transformed.item_id = emptyToNull(transformed.item_id);
    }

    // Handle sale_invoice_items - optional UUIDs
    if (table === "sale_invoice_items") {
      transformed.item_id = emptyToNull(transformed.item_id);
    }

    // Handle purchase_invoice_items - optional UUIDs
    if (table === "purchase_invoice_items") {
      transformed.item_id = emptyToNull(transformed.item_id);
    }

    // Handle credit_notes - optional UUIDs
    if (table === "credit_notes") {
      transformed.customer_id = emptyToNull(transformed.customer_id);
      transformed.invoice_id = emptyToNull(transformed.invoice_id);
    }

    // Handle credit_note_items - optional UUIDs
    if (table === "credit_note_items") {
      transformed.item_id = emptyToNull(transformed.item_id);
    }

    // Handle loans - optional UUIDs
    if (table === "loans") {
      transformed.customer_id = emptyToNull(transformed.customer_id);
      transformed.linked_bank_account_id = emptyToNull(transformed.linked_bank_account_id);
    }

    // Handle cheques - customer_id is also optional
    if (table === "cheques") {
      transformed.customer_id = emptyToNull(transformed.customer_id);
      transformed.related_invoice_id = emptyToNull(transformed.related_invoice_id);
    }

    return transformed;
  }
}
