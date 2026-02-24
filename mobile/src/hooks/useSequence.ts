import { useQuery } from "@powersync/react-native";
import { useCallback } from "react";
import { getPowerSyncDatabase } from "../lib/powersync";

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
      let fullNumber = "";

      await db.writeTransaction(async (tx) => {
        const result = await tx.execute(
          `SELECT prefix, next_number, padding FROM sequence_counters WHERE id = ?`,
          [type]
        );
        const rows = (result.rows?._array ?? []) as SequenceCounter[];
        let counter = rows[0];

        if (rows.length === 0) {
          const defaults: Record<
            SequenceType,
            { prefix: string; nextNumber: number }
          > = {
            sale_invoice: { prefix: "INV", nextNumber: 1001 },
            purchase_invoice: { prefix: "PUR", nextNumber: 1001 },
            estimate: { prefix: "EST", nextNumber: 1001 },
            credit_note: { prefix: "CN", nextNumber: 1001 },
            payment_in: { prefix: "REC", nextNumber: 1001 },
            payment_out: { prefix: "PAY", nextNumber: 1001 },
            expense: { prefix: "EXP", nextNumber: 1001 },
            cheque: { prefix: "CHQ", nextNumber: 1001 },
          };
          const def = defaults[type];
          await tx.execute(
            `INSERT INTO sequence_counters (id, prefix, next_number, padding, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [type, def.prefix, def.nextNumber, 4, now]
          );
          counter = {
            id: type,
            prefix: def.prefix,
            next_number: def.nextNumber,
            padding: 4,
          };
        }

        const { prefix, next_number, padding } = counter;
        const formattedNumber = String(next_number).padStart(padding, "0");
        fullNumber = `${prefix}-${formattedNumber}`;

        await tx.execute(
          `UPDATE sequence_counters SET next_number = next_number + 1, updated_at = ? WHERE id = ?`,
          [now, type]
        );
      });

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

      await db.writeTransaction(async (tx) => {
        const result = await tx.execute(
          `SELECT id FROM sequence_counters WHERE id = ?`,
          [type]
        );
        const exists = (result.rows?._array ?? []).length > 0;

        if (!exists) {
          await tx.execute(
            `INSERT INTO sequence_counters (id, prefix, next_number, padding, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [
              type,
              data.prefix ?? "INV",
              data.nextNumber ?? 1001,
              data.padding ?? 4,
              now,
            ]
          );
        } else {
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
            await tx.execute(
              `UPDATE sequence_counters SET ${fields.join(", ")} WHERE id = ?`,
              values
            );
          }
        }
      });
    },
    [db]
  );

  return {
    getNextNumber,
    updateSequenceSettings,
  };
}

export function useNextSequencePreview(type: SequenceType): {
  preview: string;
  isLoading: boolean;
} {
  const { prefix, nextNumber, padding, isLoading } = useSequenceCounter(type);

  const preview = `${prefix}-${String(nextNumber).padStart(padding, "0")}`;

  return { preview, isLoading };
}
