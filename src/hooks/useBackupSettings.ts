import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { BackupSettings, BackupRecord } from "@/features/settings/types";
import { useAuthStore } from "@/stores/auth-store";

interface BackupSettingsRow {
  user_id: string;
  auto_backup_enabled: number;
  backup_frequency: string;
  backup_time: string;
  retention_days: number;
  backup_destination: string;
  cloud_provider: string | null;
  last_backup: string | null;
  created_at: string;
  updated_at: string;
}

interface BackupHistoryRow {
  user_id: string;
  timestamp: string;
  type: string;
  destination: string;
  file_size: number;
  status: string;
  error_message: string | null;
  file_path: string | null;
}

function mapRowToBackupSettings(
  row: BackupSettingsRow,
  history: BackupRecord[]
): BackupSettings {
  return {
    autoBackupEnabled: row.auto_backup_enabled === 1,
    backupFrequency: row.backup_frequency as "daily" | "weekly" | "monthly",
    backupTime: row.backup_time,
    retentionDays: row.retention_days,
    backupDestination: row.backup_destination as "local" | "cloud" | "both",
    cloudProvider:
      (row.cloud_provider as "google-drive" | "dropbox" | "onedrive" | null) ??
      undefined,
    lastBackup: row.last_backup ?? undefined,
    backupHistory: history,
  };
}

function mapRowToBackupRecord(row: BackupHistoryRow): BackupRecord {
  return {
    id: row.timestamp, // composite id usually
    timestamp: row.timestamp,
    size: row.file_size,
    destination: row.destination,
    status: row.status as "success" | "failed" | "in-progress",
    errorMessage: row.error_message ?? undefined,
  };
}

export function useBackupSettings(): {
  settings: BackupSettings | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { user } = useAuthStore();
  const userId = user?.id;

  const {
    data: settingsData,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery<BackupSettingsRow>(
    `SELECT * FROM backup_settings WHERE user_id = ?`,
    [userId ?? ""]
  );

  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery<BackupHistoryRow>(
    `SELECT * FROM backup_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10`,
    [userId ?? ""]
  );

  const settings = useMemo(() => {
    const history = historyData.map(mapRowToBackupRecord);

    if (settingsData.length === 0) {
      // Return defaults if no settings exist yet
      return {
        autoBackupEnabled: false,
        backupFrequency: "daily" as const,
        backupTime: "00:00",
        retentionDays: 30,
        backupDestination: "local" as const,
        cloudProvider: undefined,
        lastBackup: undefined,
        backupHistory: history,
      };
    }

    return mapRowToBackupSettings(settingsData[0], history);
  }, [settingsData, historyData]);

  return {
    settings,
    isLoading: settingsLoading || historyLoading,
    error: settingsError ?? historyError,
  };
}

interface BackupSettingsMutations {
  updateBackupSettings: (data: Partial<BackupSettings>) => Promise<void>;
  createBackupRecord: (data: {
    type: "manual" | "automatic";
    destination: string;
    fileSize: number;
    status: "success" | "failed" | "in_progress";
    errorMessage?: string;
    filePath?: string;
  }) => Promise<void>;
}

export function useBackupSettingsMutations(): BackupSettingsMutations {
  const db = getPowerSyncDatabase();
  const { user } = useAuthStore();
  const userId = user?.id;

  const updateBackupSettings = useCallback(
    async (data: Partial<BackupSettings>): Promise<void> => {
      if (!userId) return;
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      const existing = await db.getAll<BackupSettingsRow>(
        `SELECT user_id FROM backup_settings WHERE user_id = ?`,
        [userId]
      );

      if (existing.length === 0) {
        // Init default settings
        await db.execute(
          `INSERT INTO backup_settings (
            user_id, auto_backup_enabled, backup_frequency, backup_time, 
            retention_days, backup_destination, cloud_provider, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            data.autoBackupEnabled ? 1 : 0,
            data.backupFrequency ?? "daily",
            data.backupTime ?? "00:00",
            data.retentionDays ?? 30,
            data.backupDestination ?? "local",
            data.cloudProvider ?? null,
            now,
            now,
          ]
        );
      } else {
        if (data.autoBackupEnabled !== undefined) {
          fields.push("auto_backup_enabled = ?");
          values.push(data.autoBackupEnabled ? 1 : 0);
        }
        if (data.backupFrequency !== undefined) {
          fields.push("backup_frequency = ?");
          values.push(data.backupFrequency);
        }
        if (data.backupTime !== undefined) {
          fields.push("backup_time = ?");
          values.push(data.backupTime);
        }
        if (data.retentionDays !== undefined) {
          fields.push("retention_days = ?");
          values.push(data.retentionDays);
        }
        if (data.backupDestination !== undefined) {
          fields.push("backup_destination = ?");
          values.push(data.backupDestination);
        }
        if (data.cloudProvider !== undefined) {
          fields.push("cloud_provider = ?");
          values.push(data.cloudProvider ?? null);
        }

        fields.push("updated_at = ?");
        values.push(now);
        values.push(userId);

        if (fields.length > 0) {
          await db.execute(
            `UPDATE backup_settings SET ${fields.join(", ")} WHERE user_id = ?`,
            values
          );
        }
      }
    },
    [db, userId]
  );

  const createBackupRecord = useCallback(
    async (data: {
      type: "manual" | "automatic";
      destination: string;
      fileSize: number;
      status: "success" | "failed" | "in_progress";
      errorMessage?: string;
      filePath?: string;
    }): Promise<void> => {
      if (!userId) return;
      const now = new Date().toISOString();
      await db.execute(
        `INSERT INTO backup_history (
              user_id, timestamp, type, destination, file_size, status, error_message, file_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          now,
          data.type,
          data.destination,
          data.fileSize,
          data.status,
          data.errorMessage ?? null,
          data.filePath ?? null,
        ]
      );
    },
    [db, userId]
  );

  return { updateBackupSettings, createBackupRecord };
}
