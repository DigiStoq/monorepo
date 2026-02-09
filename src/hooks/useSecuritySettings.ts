import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { SecuritySettings, LoginRecord } from "@/features/settings/types";
import { useAuthStore } from "@/stores/auth-store";

interface SecuritySettingsRow {
  user_id: string;
  two_factor_enabled: number;
  two_factor_method: string | null;
  session_timeout: number;
  require_password_change: number;
  password_change_days: number;
  allowed_ips: string | null;
  created_at: string;
  updated_at: string;
}

interface LoginHistoryRow {
  user_id: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  location: string | null;
  success: number;
}

function mapRowToSecuritySettings(
  row: SecuritySettingsRow,
  history: LoginRecord[]
): SecuritySettings {
  return {
    twoFactorEnabled: row.two_factor_enabled === 1,
    twoFactorMethod:
      (row.two_factor_method as "app" | "sms" | "email" | null) ?? undefined,
    sessionTimeout: row.session_timeout,
    requirePasswordChange: row.require_password_change === 1,
    passwordChangeDays: row.password_change_days,
    allowedIPs: row.allowed_ips ? JSON.parse(row.allowed_ips) : [],
    loginHistory: history,
  };
}

function mapRowToLoginRecord(row: LoginHistoryRow): LoginRecord {
  return {
    id: row.timestamp, // treating timestamp as id for now or composite
    timestamp: row.timestamp,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    location: row.location ?? undefined,
    success: row.success === 1,
  };
}

export function useSecuritySettings(): {
  settings: SecuritySettings | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { user } = useAuthStore();
  const userId = user?.id;

  const {
    data: settingsData,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery<SecuritySettingsRow>(
    `SELECT * FROM security_settings WHERE user_id = ?`,
    [userId ?? ""]
  );

  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery<LoginHistoryRow>(
    `SELECT * FROM login_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10`,
    [userId ?? ""]
  );

  const settings = useMemo(() => {
    if (!settingsData[0]) return null;
    const history = historyData.map(mapRowToLoginRecord);
    return mapRowToSecuritySettings(settingsData[0], history);
  }, [settingsData, historyData]);

  return {
    settings,
    isLoading: settingsLoading || historyLoading,
    error: settingsError ?? historyError,
  };
}

interface SecuritySettingsMutations {
  updateSecuritySettings: (data: Partial<SecuritySettings>) => Promise<void>;
}

export function useSecuritySettingsMutations(): SecuritySettingsMutations {
  const db = getPowerSyncDatabase();
  const { user } = useAuthStore();
  const userId = user?.id;

  const updateSecuritySettings = useCallback(
    async (data: Partial<SecuritySettings>): Promise<void> => {
      if (!userId) return;
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      const existing = await db.getAll<SecuritySettingsRow>(
        `SELECT user_id FROM security_settings WHERE user_id = ?`,
        [userId]
      );

      if (existing.length === 0) {
        // Init default settings if not exists
        await db.execute(
          `INSERT INTO security_settings (
            user_id, two_factor_enabled, two_factor_method, session_timeout, 
            require_password_change, password_change_days, allowed_ips, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            data.twoFactorEnabled ? 1 : 0,
            data.twoFactorMethod ?? null,
            data.sessionTimeout ?? 30,
            data.requirePasswordChange ? 1 : 0,
            data.passwordChangeDays ?? 90,
            data.allowedIPs ? JSON.stringify(data.allowedIPs) : "[]",
            now,
            now,
          ]
        );
      } else {
        if (data.twoFactorEnabled !== undefined) {
          fields.push("two_factor_enabled = ?");
          values.push(data.twoFactorEnabled ? 1 : 0);
        }
        if (data.twoFactorMethod !== undefined) {
          fields.push("two_factor_method = ?");
          values.push(data.twoFactorMethod ?? null);
        }
        if (data.sessionTimeout !== undefined) {
          fields.push("session_timeout = ?");
          values.push(data.sessionTimeout);
        }
        if (data.requirePasswordChange !== undefined) {
          fields.push("require_password_change = ?");
          values.push(data.requirePasswordChange ? 1 : 0);
        }
        if (data.passwordChangeDays !== undefined) {
          fields.push("password_change_days = ?");
          values.push(data.passwordChangeDays);
        }
        if (data.allowedIPs !== undefined) {
          fields.push("allowed_ips = ?");
          values.push(JSON.stringify(data.allowedIPs));
        }

        fields.push("updated_at = ?");
        values.push(now);
        values.push(userId);

        if (fields.length > 0) {
          await db.execute(
            `UPDATE security_settings SET ${fields.join(", ")} WHERE user_id = ?`,
            values
          );
        }
      }
    },
    [db, userId]
  );

  return { updateSecuritySettings };
}
