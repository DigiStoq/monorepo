/* eslint-disable @typescript-eslint/no-unnecessary-condition -- defensive coding for runtime safety */
import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type {
  AppPreferences,
  DateFormat,
  DashboardWidget,
  PrintSettings,
} from "@/features/settings/types";

// DB Row Interface
interface UserPreferencesRow {
  user_id: string; // We'll use a fixed ID or handle auth later
  theme: string;
  date_format: string;
  decimal_separator: string;
  thousands_separator: string;
  decimal_places: number;
  compact_mode: number; // 0 or 1
  auto_save: number; // 0 or 1
  dashboard_widgets: string; // JSON string
  print_settings: string; // JSON string
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: "system",
  dateFormat: "DD/MM/YYYY",
  numberFormat: {
    decimalSeparator: ".",
    thousandsSeparator: ",",
    decimalPlaces: 2,
  },
  defaultInvoiceTerms: 30, // Not in DB schema based on review, using default
  defaultPaymentTerms: "Net 30", // Not in DB schema based on review, using default
  showDashboardWidgets: [
    "sales-chart",
    "receivables",
    "payables",
    "recent-transactions",
    "quick-actions",
  ],
  compactMode: false,
  autoSave: true,
  printSettings: {
    paperSize: "A4",
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    showLogo: true,
    showSignature: true,
    showTerms: true,
  },
};

function mapRowToPreferences(row: UserPreferencesRow): AppPreferences {
  // Parse JSON fields safely
  let widgets: DashboardWidget[] = [];
  try {
    widgets = JSON.parse(row.dashboard_widgets || "[]");
  } catch (e) {
    console.warn("Failed to parse dashboard_widgets", e);
    widgets = DEFAULT_PREFERENCES.showDashboardWidgets;
  }

  let printSettings: PrintSettings = DEFAULT_PREFERENCES.printSettings;
  try {
    const parsedPrint = JSON.parse(row.print_settings || "{}");
    printSettings = { ...DEFAULT_PREFERENCES.printSettings, ...parsedPrint };
  } catch (e) {
    console.warn("Failed to parse print_settings", e);
  }

  return {
    ...DEFAULT_PREFERENCES, // Fallback for missing fields (like default terms if not in DB)
    theme: (row.theme as "light" | "dark" | "system") || "system",
    dateFormat: (row.date_format as DateFormat) || "DD/MM/YYYY",
    numberFormat: {
      decimalSeparator: (row.decimal_separator as "." | ",") || ".",
      thousandsSeparator: (row.thousands_separator as "," | "." | " ") || ",",
      decimalPlaces: row.decimal_places ?? 2,
    },
    compactMode: row.compact_mode === 1,
    autoSave: row.auto_save === 1,
    showDashboardWidgets: widgets,
    printSettings: printSettings,
  };
}

export function useUserPreferences(): {
  preferences: AppPreferences;
  isLoading: boolean;
  error: Error | undefined;
} {
  // For now, we assume a single user context or just fetch the first row.
  // In a real auth scenario, we'd filter by user_id.
  const { data, isLoading, error } = useQuery<UserPreferencesRow>(
    `SELECT * FROM user_preferences LIMIT 1`
  );

  const preferences = useMemo(() => {
    if (!data || data.length === 0) return DEFAULT_PREFERENCES;
    return mapRowToPreferences(data[0]);
  }, [data]);

  return { preferences, isLoading, error };
}

export function useUserPreferencesMutations(): {
  updateUserPreferences: (newPrefs: Partial<AppPreferences>) => Promise<void>;
} {
  const db = getPowerSyncDatabase();

  const updateUserPreferences = useCallback(
    async (newPrefs: Partial<AppPreferences>) => {
      const now = new Date().toISOString();
      const existing = await db.getAll<UserPreferencesRow>(
        `SELECT user_id FROM user_preferences LIMIT 1`
      );

      const isInsert = existing.length === 0;
      const userId = existing[0]?.user_id || "default-user"; // Fallback ID

      // Helper to get current DB values if we are doing a partial update on the JS object side,
      // but here we are receiving the partial AppPreferences object.
      // Ideally, we should merge with current state, but the caller usually passes the full new state or changed fields.
      // We will construct the update/insert query dynamically.

      // However, for complex nested objects like printSettings, we need to be careful.
      // The strategy:
      // 1. Fetch current row to merge JSON fields if they are partially updated?
      //    Or assume the caller passes the complete nested object if they want to update it.
      //    The `updateField` in UI passes specific fields.
      //    If the UI passes `printSettings`, it passes the WHOLE object usually.

      // Simpler approach: Dynamic SQL generation.

      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (newPrefs.theme !== undefined) {
        fields.push("theme");
        values.push(newPrefs.theme);
      }
      if (newPrefs.dateFormat !== undefined) {
        fields.push("date_format");
        values.push(newPrefs.dateFormat);
      }
      if (newPrefs.numberFormat !== undefined) {
        if (newPrefs.numberFormat.decimalSeparator !== undefined) {
          fields.push("decimal_separator");
          values.push(newPrefs.numberFormat.decimalSeparator);
        }
        if (newPrefs.numberFormat.thousandsSeparator !== undefined) {
          fields.push("thousands_separator");
          values.push(newPrefs.numberFormat.thousandsSeparator);
        }
        if (newPrefs.numberFormat.decimalPlaces !== undefined) {
          fields.push("decimal_places");
          values.push(newPrefs.numberFormat.decimalPlaces);
        }
      }
      if (newPrefs.compactMode !== undefined) {
        fields.push("compact_mode");
        values.push(newPrefs.compactMode ? 1 : 0);
      }
      if (newPrefs.autoSave !== undefined) {
        fields.push("auto_save");
        values.push(newPrefs.autoSave ? 1 : 0);
      }
      if (newPrefs.showDashboardWidgets !== undefined) {
        fields.push("dashboard_widgets");
        values.push(JSON.stringify(newPrefs.showDashboardWidgets));
      }
      if (newPrefs.printSettings !== undefined) {
        // We probably shouldn't merge here without reading first,
        // but typically the UI overrides the whole settings object.
        // Let's assume the mutation receives the full printSettings object if it's being updated.
        fields.push("print_settings");
        values.push(JSON.stringify(newPrefs.printSettings));
      }

      if (fields.length === 0) return; // Nothing to update

      if (isInsert) {
        // Prepare INSERT - PowerSync requires an 'id' column
        const id = crypto.randomUUID();
        const insertFields = [
          "id",
          "user_id",
          "created_at",
          "updated_at",
          ...fields,
        ];
        const placeholders = ["?", "?", "?", "?", ...fields.map(() => "?")];
        const insertValues = [id, userId, now, now, ...values];

        // Insert new preferences row
        await db.execute(
          `INSERT INTO user_preferences (${insertFields.join(", ")}) VALUES (${placeholders.join(", ")})`,
          insertValues
        );
      } else {
        // Prepare UPDATE
        const setClause = fields.map((f) => `${f} = ?`).join(", ");
        const updateValues = [...values, now, userId]; // userId for WHERE clause

        await db.execute(
          `UPDATE user_preferences SET ${setClause}, updated_at = ? WHERE user_id = ?`,
          updateValues
        );
      }
    },
    [db]
  );

  return { updateUserPreferences };
}
