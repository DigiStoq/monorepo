import { useQuery } from "@powersync/react";
import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";

export type SequenceType =
  | "sale_invoice"
  | "purchase_invoice"
  | "estimate"
  | "credit_note"
  | "payment_in"
  | "payment_out"
  | "expense"
  | "cheque";

interface SequenceCounter {
  id: string;
  prefix: string;
  next_number: number;
  padding: number;
}

interface SequenceCounterResult {
  prefix: string;
  nextNumber: number;
  padding: number;
  isLoading: boolean;
  error: Error | undefined;
}

export function useSequenceCounter(type: SequenceType): SequenceCounterResult {
  const { data, isLoading, error } = useQuery<SequenceCounter>(
    `SELECT * FROM sequence_counters WHERE id = ?`,
    [type]
  );

  const counter = data.length > 0 ? data[0] : undefined;

  return {
    prefix: counter?.prefix ?? "",
    nextNumber: counter?.next_number ?? 1,
    padding: counter?.padding ?? 4,
    isLoading,
    error,
  };
}

interface SequenceMutations {
  getNextNumber: (type: SequenceType) => Promise<string>;
  updateSequenceSettings: (
    type: SequenceType,
    data: { prefix?: string; nextNumber?: number; padding?: number }
  ) => Promise<void>;
}

export function useSequenceMutations(): SequenceMutations {
  const db = getPowerSyncDatabase();

  const getNextNumber = useCallback(
    async (type: SequenceType): Promise<string> => {
      const now = new Date().toISOString();

      // Get current counter
      const result = await db.execute(
        `SELECT prefix, next_number, padding FROM sequence_counters WHERE id = ?`,
        [type]
      );
      const rows = (result.rows?._array ?? []) as SequenceCounter[];
      const counter = rows[0];

      if (rows.length === 0) {
        throw new Error(`Sequence counter not found for type: ${type}`);
      }

      const { prefix, next_number, padding } = counter;

      // Format the number with padding
      const formattedNumber = String(next_number).padStart(padding, "0");
      const fullNumber = `${prefix}-${formattedNumber}`;

      // Increment the counter
      await db.execute(
        `UPDATE sequence_counters SET next_number = next_number + 1, updated_at = ? WHERE id = ?`,
        [now, type]
      );

      return fullNumber;
    },
    [db]
  );

  const updateSequenceSettings = useCallback(
    async (
      type: SequenceType,
      data: { prefix?: string; nextNumber?: number; padding?: number }
    ): Promise<void> => {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number)[] = [];

      if (data.prefix !== undefined) {
        fields.push("prefix = ?");
        values.push(data.prefix);
      }
      if (data.nextNumber !== undefined) {
        fields.push("next_number = ?");
        values.push(data.nextNumber);
      }
      if (data.padding !== undefined) {
        fields.push("padding = ?");
        values.push(data.padding);
      }

      fields.push("updated_at = ?");
      values.push(now);
      values.push(type);

      if (fields.length > 1) {
        await db.execute(
          `UPDATE sequence_counters SET ${fields.join(", ")} WHERE id = ?`,
          values
        );
      }
    },
    [db]
  );

  return {
    getNextNumber,
    updateSequenceSettings,
  };
}

// Helper hook to preview the next number without incrementing
export function useNextSequencePreview(type: SequenceType): {
  preview: string;
  isLoading: boolean;
} {
  const { prefix, nextNumber, padding, isLoading } = useSequenceCounter(type);

  const preview = `${prefix}-${String(nextNumber).padStart(padding, "0")}`;

  return { preview, isLoading };
}
