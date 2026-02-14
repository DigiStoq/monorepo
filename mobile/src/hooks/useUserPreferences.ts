import { useQuery } from "@powersync/react-native";
import { useCallback, useMemo } from "react";
import { db } from "../lib/powersync";

// Types
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "DD-MMM-YYYY";

export interface NumberFormat {
    decimalSeparator: "." | ",";
    thousandsSeparator: "," | "." | " ";
    decimalPlaces: number;
}

export interface AppPreferences {
    theme?: "light" | "dark" | "system";
    dateFormat: DateFormat;
    numberFormat: NumberFormat;
    defaultInvoiceTerms: number;
    defaultPaymentTerms?: string;
    autoSave: boolean;
    compactMode?: boolean;
    showDashboardWidgets?: string[];
}

// DB Row Interface
interface UserPreferencesRow {
    id: string;
    user_id: string;
    theme: string;
    date_format: string;
    decimal_separator: string;
    thousands_separator: string;
    decimal_places: number;
    compact_mode: number;
    auto_save: number;
    default_invoice_terms: number;
    dashboard_widgets: string;
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
    defaultInvoiceTerms: 30,
    defaultPaymentTerms: "Net 30",
    autoSave: true,
    compactMode: false,
    showDashboardWidgets: [],
};

function mapRowToPreferences(row: UserPreferencesRow): AppPreferences {
    let widgets: string[] = [];
    try {
        widgets = JSON.parse(row.dashboard_widgets || "[]");
    } catch {
        widgets = [];
    }

    return {
        ...DEFAULT_PREFERENCES,
        theme: (row.theme as "light" | "dark" | "system") || "system",
        dateFormat: (row.date_format as DateFormat) || "DD/MM/YYYY",
        numberFormat: {
            decimalSeparator: (row.decimal_separator as "." | ",") || ".",
            thousandsSeparator: (row.thousands_separator as "," | "." | " ") || ",",
            decimalPlaces: row.decimal_places ?? 2,
        },
        defaultInvoiceTerms: row.default_invoice_terms || 30,
        compactMode: row.compact_mode === 1,
        autoSave: row.auto_save === 1,
        showDashboardWidgets: widgets,
    };
}

export function useUserPreferences(): {
    preferences: AppPreferences | null;
    isLoading: boolean;
    updatePreferences: (newPrefs: Partial<AppPreferences>) => Promise<void>;
} {
    const { data, isLoading } = useQuery<UserPreferencesRow>(
        `SELECT * FROM user_preferences LIMIT 1`
    );

    const preferences = useMemo(() => {
        if (!data || data.length === 0) return DEFAULT_PREFERENCES;
        return mapRowToPreferences(data[0]);
    }, [data]);

    const updatePreferences = useCallback(
        async (newPrefs: Partial<AppPreferences>) => {
            const now = new Date().toISOString();
            
            // Check if record exists
            const existing = await db.getAll<UserPreferencesRow>(
                `SELECT id, user_id FROM user_preferences LIMIT 1`
            );

            const isInsert = existing.length === 0;
            const userId = existing[0]?.user_id || "default-user";
            const recordId = existing[0]?.id || crypto.randomUUID();

            // Build fields to update
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
            if (newPrefs.defaultInvoiceTerms !== undefined) {
                fields.push("default_invoice_terms");
                values.push(newPrefs.defaultInvoiceTerms);
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

            if (fields.length === 0) return;

            if (isInsert) {
                const insertFields = ["id", "user_id", "created_at", "updated_at", ...fields];
                const placeholders = insertFields.map(() => "?").join(", ");
                const insertValues = [recordId, userId, now, now, ...values];

                await db.execute(
                    `INSERT INTO user_preferences (${insertFields.join(", ")}) VALUES (${placeholders})`,
                    insertValues
                );
            } else {
                const setClause = fields.map((f) => `${f} = ?`).join(", ");
                const updateValues = [...values, now, recordId];

                await db.execute(
                    `UPDATE user_preferences SET ${setClause}, updated_at = ? WHERE id = ?`,
                    updateValues
                );
            }
        },
        []
    );

    return { preferences, isLoading, updatePreferences };
}
