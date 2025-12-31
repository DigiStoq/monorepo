import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";

// ============================================================================
// USER PROFILE
// ============================================================================

interface UserProfileRow {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  language: string | null;
  notification_email: number;
  notification_push: number;
  notification_sms: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: "admin" | "manager" | "staff" | "accountant";
  language: string;
  notificationEmail: boolean;
  notificationPush: boolean;
  notificationSms: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role?: "admin" | "manager" | "staff" | "accountant";
  language?: string;
  notificationEmail?: boolean;
  notificationPush?: boolean;
  notificationSms?: boolean;
}

function mapRowToUserProfile(row: UserProfileRow): UserProfile {
  const profile: UserProfile = {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    role: (row.role as UserProfile["role"] | null) ?? "staff",
    language: row.language ?? "en",
    notificationEmail: row.notification_email === 1,
    notificationPush: row.notification_push === 1,
    notificationSms: row.notification_sms === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.phone) profile.phone = row.phone;
  if (row.avatar_url) profile.avatarUrl = row.avatar_url;

  return profile;
}

export function useUserProfile(userId: string | null): {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<UserProfileRow>(
    userId
      ? `SELECT * FROM user_profiles WHERE user_id = $1`
      : `SELECT * FROM user_profiles WHERE 1 = 0`,
    userId ? [userId] : []
  );

  const profile = data[0] ? mapRowToUserProfile(data[0]) : null;

  return { profile, isLoading, error };
}

export function useUserProfileMutations(): {
  upsertProfile: (userId: string, data: UserProfileFormData) => Promise<string>;
} {
  const db = getPowerSyncDatabase();

  const upsertProfile = useCallback(
    async (userId: string, data: UserProfileFormData): Promise<string> => {
      const now = new Date().toISOString();

      // Check if profile exists
      const existing = await db.getOptional<{ id: string }>(
        `SELECT id FROM user_profiles WHERE user_id = ?`,
        [userId]
      );

      if (existing) {
        // Update existing profile
        await db.execute(
          `UPDATE user_profiles SET
            first_name = ?, last_name = ?, phone = ?, avatar_url = ?,
            role = ?, language = ?, notification_email = ?, notification_push = ?,
            notification_sms = ?, updated_at = ?
          WHERE user_id = ?`,
          [
            data.firstName,
            data.lastName,
            data.phone ?? null,
            data.avatarUrl ?? null,
            data.role ?? "staff",
            data.language ?? "en",
            data.notificationEmail ? 1 : 0,
            data.notificationPush ? 1 : 0,
            data.notificationSms ? 1 : 0,
            now,
            userId,
          ]
        );
        return existing.id;
      } else {
        // Create new profile
        const id = crypto.randomUUID();
        await db.execute(
          `INSERT INTO user_profiles (
            id, user_id, first_name, last_name, phone, avatar_url,
            role, language, notification_email, notification_push,
            notification_sms, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            userId,
            data.firstName,
            data.lastName,
            data.phone ?? null,
            data.avatarUrl ?? null,
            data.role ?? "staff",
            data.language ?? "en",
            data.notificationEmail ? 1 : 0,
            data.notificationPush ? 1 : 0,
            data.notificationSms ? 1 : 0,
            now,
            now,
          ]
        );
        return id;
      }
    },
    [db]
  );

  return { upsertProfile };
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

interface UserPreferencesRow {
  id: string;
  user_id: string;
  theme: string | null;
  date_format: string | null;
  decimal_separator: string | null;
  thousands_separator: string | null;
  decimal_places: number | null;
  compact_mode: number;
  auto_save: number;
  dashboard_widgets: string | null;
  print_settings: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: "light" | "dark" | "system";
  dateFormat: string;
  decimalSeparator: string;
  thousandsSeparator: string;
  decimalPlaces: number;
  compactMode: boolean;
  autoSave: boolean;
  dashboardWidgets: string[];
  printSettings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferencesFormData {
  theme?: "light" | "dark" | "system";
  dateFormat?: string;
  decimalSeparator?: string;
  thousandsSeparator?: string;
  decimalPlaces?: number;
  compactMode?: boolean;
  autoSave?: boolean;
  dashboardWidgets?: string[];
  printSettings?: Record<string, unknown>;
}

function mapRowToUserPreferences(row: UserPreferencesRow): UserPreferences {
  let dashboardWidgets: string[] = [];
  let printSettings: Record<string, unknown> = {};

  try {
    if (row.dashboard_widgets) {
      dashboardWidgets = JSON.parse(row.dashboard_widgets);
    }
    if (row.print_settings) {
      printSettings = JSON.parse(row.print_settings);
    }
  } catch {
    // Ignore JSON parse errors
  }

  return {
    id: row.id,
    userId: row.user_id,
    theme: (row.theme as UserPreferences["theme"] | null) ?? "system",
    dateFormat: row.date_format ?? "DD/MM/YYYY",
    decimalSeparator: row.decimal_separator ?? ".",
    thousandsSeparator: row.thousands_separator ?? ",",
    decimalPlaces: row.decimal_places ?? 2,
    compactMode: row.compact_mode === 1,
    autoSave: row.auto_save === 1,
    dashboardWidgets,
    printSettings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useUserPreferences(userId: string | null): {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<UserPreferencesRow>(
    userId
      ? `SELECT * FROM user_preferences WHERE user_id = $1`
      : `SELECT * FROM user_preferences WHERE 1 = 0`,
    userId ? [userId] : []
  );

  const preferences = data[0] ? mapRowToUserPreferences(data[0]) : null;

  return { preferences, isLoading, error };
}

export function useUserPreferencesMutations(): {
  upsertPreferences: (
    userId: string,
    data: UserPreferencesFormData
  ) => Promise<string>;
} {
  const db = getPowerSyncDatabase();

  const upsertPreferences = useCallback(
    async (userId: string, data: UserPreferencesFormData): Promise<string> => {
      const now = new Date().toISOString();

      const existing = await db.getOptional<{ id: string }>(
        `SELECT id FROM user_preferences WHERE user_id = ?`,
        [userId]
      );

      const dashboardWidgetsJson = data.dashboardWidgets
        ? JSON.stringify(data.dashboardWidgets)
        : null;
      const printSettingsJson = data.printSettings
        ? JSON.stringify(data.printSettings)
        : null;

      if (existing) {
        await db.execute(
          `UPDATE user_preferences SET
            theme = ?, date_format = ?, decimal_separator = ?,
            thousands_separator = ?, decimal_places = ?, compact_mode = ?,
            auto_save = ?, dashboard_widgets = ?, print_settings = ?, updated_at = ?
          WHERE user_id = ?`,
          [
            data.theme ?? "system",
            data.dateFormat ?? "DD/MM/YYYY",
            data.decimalSeparator ?? ".",
            data.thousandsSeparator ?? ",",
            data.decimalPlaces ?? 2,
            data.compactMode ? 1 : 0,
            data.autoSave !== false ? 1 : 0,
            dashboardWidgetsJson,
            printSettingsJson,
            now,
            userId,
          ]
        );
        return existing.id;
      } else {
        const id = crypto.randomUUID();
        await db.execute(
          `INSERT INTO user_preferences (
            id, user_id, theme, date_format, decimal_separator,
            thousands_separator, decimal_places, compact_mode,
            auto_save, dashboard_widgets, print_settings, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            userId,
            data.theme ?? "system",
            data.dateFormat ?? "DD/MM/YYYY",
            data.decimalSeparator ?? ".",
            data.thousandsSeparator ?? ",",
            data.decimalPlaces ?? 2,
            data.compactMode ? 1 : 0,
            data.autoSave !== false ? 1 : 0,
            dashboardWidgetsJson,
            printSettingsJson,
            now,
            now,
          ]
        );
        return id;
      }
    },
    [db]
  );

  return { upsertPreferences };
}

// ============================================================================
// SECURITY SETTINGS
// ============================================================================

interface SecuritySettingsRow {
  id: string;
  user_id: string;
  two_factor_enabled: number;
  two_factor_method: string | null;
  session_timeout: number | null;
  require_password_change: number;
  password_change_days: number | null;
  allowed_ips: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecuritySettings {
  id: string;
  userId: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: "app" | "sms" | "email";
  sessionTimeout: number;
  requirePasswordChange: boolean;
  passwordChangeDays?: number;
  allowedIps: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SecuritySettingsFormData {
  twoFactorEnabled?: boolean;
  twoFactorMethod?: "app" | "sms" | "email";
  sessionTimeout?: number;
  requirePasswordChange?: boolean;
  passwordChangeDays?: number;
  allowedIps?: string[];
}

function mapRowToSecuritySettings(row: SecuritySettingsRow): SecuritySettings {
  let allowedIps: string[] = [];
  try {
    if (row.allowed_ips) {
      allowedIps = JSON.parse(row.allowed_ips);
    }
  } catch {
    // Ignore JSON parse errors
  }

  const settings: SecuritySettings = {
    id: row.id,
    userId: row.user_id,
    twoFactorEnabled: row.two_factor_enabled === 1,
    sessionTimeout: row.session_timeout ?? 30,
    requirePasswordChange: row.require_password_change === 1,
    allowedIps,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.two_factor_method) {
    settings.twoFactorMethod = row.two_factor_method as "app" | "sms" | "email";
  }
  if (row.password_change_days !== null) {
    settings.passwordChangeDays = row.password_change_days;
  }

  return settings;
}

export function useSecuritySettings(userId: string | null): {
  settings: SecuritySettings | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<SecuritySettingsRow>(
    userId
      ? `SELECT * FROM security_settings WHERE user_id = $1`
      : `SELECT * FROM security_settings WHERE 1 = 0`,
    userId ? [userId] : []
  );

  const settings = data[0] ? mapRowToSecuritySettings(data[0]) : null;

  return { settings, isLoading, error };
}

export function useSecuritySettingsMutations(): {
  upsertSecuritySettings: (
    userId: string,
    data: SecuritySettingsFormData
  ) => Promise<string>;
} {
  const db = getPowerSyncDatabase();

  const upsertSecuritySettings = useCallback(
    async (userId: string, data: SecuritySettingsFormData): Promise<string> => {
      const now = new Date().toISOString();

      const existing = await db.getOptional<{ id: string }>(
        `SELECT id FROM security_settings WHERE user_id = ?`,
        [userId]
      );

      const allowedIpsJson = data.allowedIps
        ? JSON.stringify(data.allowedIps)
        : null;

      if (existing) {
        await db.execute(
          `UPDATE security_settings SET
            two_factor_enabled = ?, two_factor_method = ?, session_timeout = ?,
            require_password_change = ?, password_change_days = ?,
            allowed_ips = ?, updated_at = ?
          WHERE user_id = ?`,
          [
            data.twoFactorEnabled ? 1 : 0,
            data.twoFactorMethod ?? null,
            data.sessionTimeout ?? 30,
            data.requirePasswordChange ? 1 : 0,
            data.passwordChangeDays ?? null,
            allowedIpsJson,
            now,
            userId,
          ]
        );
        return existing.id;
      } else {
        const id = crypto.randomUUID();
        await db.execute(
          `INSERT INTO security_settings (
            id, user_id, two_factor_enabled, two_factor_method, session_timeout,
            require_password_change, password_change_days, allowed_ips,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            userId,
            data.twoFactorEnabled ? 1 : 0,
            data.twoFactorMethod ?? null,
            data.sessionTimeout ?? 30,
            data.requirePasswordChange ? 1 : 0,
            data.passwordChangeDays ?? null,
            allowedIpsJson,
            now,
            now,
          ]
        );
        return id;
      }
    },
    [db]
  );

  return { upsertSecuritySettings };
}

// ============================================================================
// LOGIN HISTORY
// ============================================================================

interface LoginHistoryRow {
  id: string;
  user_id: string;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  location: string | null;
  success: number;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  success: boolean;
}

function mapRowToLoginHistory(row: LoginHistoryRow): LoginHistoryEntry {
  const entry: LoginHistoryEntry = {
    id: row.id,
    userId: row.user_id,
    timestamp: row.timestamp,
    success: row.success === 1,
  };

  if (row.ip_address) entry.ipAddress = row.ip_address;
  if (row.user_agent) entry.userAgent = row.user_agent;
  if (row.location) entry.location = row.location;

  return entry;
}

export function useLoginHistory(
  userId: string | null,
  limit = 10
): {
  history: LoginHistoryEntry[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<LoginHistoryRow>(
    userId
      ? `SELECT * FROM login_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2`
      : `SELECT * FROM login_history WHERE 1 = 0`,
    userId ? [userId, limit] : []
  );

  const history = useMemo(() => data.map(mapRowToLoginHistory), [data]);

  return { history, isLoading, error };
}

// ============================================================================
// BACKUP SETTINGS
// ============================================================================

interface BackupSettingsRow {
  id: string;
  user_id: string;
  auto_backup_enabled: number;
  backup_frequency: string | null;
  backup_time: string | null;
  retention_days: number | null;
  backup_destination: string | null;
  cloud_provider: string | null;
  last_backup: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackupSettings {
  id: string;
  userId: string;
  autoBackupEnabled: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  backupTime: string;
  retentionDays: number;
  backupDestination: "local" | "cloud";
  cloudProvider?: "google_drive" | "dropbox" | "onedrive";
  lastBackup?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupSettingsFormData {
  autoBackupEnabled?: boolean;
  backupFrequency?: "daily" | "weekly" | "monthly";
  backupTime?: string;
  retentionDays?: number;
  backupDestination?: "local" | "cloud";
  cloudProvider?: "google_drive" | "dropbox" | "onedrive";
}

function mapRowToBackupSettings(row: BackupSettingsRow): BackupSettings {
  const settings: BackupSettings = {
    id: row.id,
    userId: row.user_id,
    autoBackupEnabled: row.auto_backup_enabled === 1,
    backupFrequency:
      (row.backup_frequency as BackupSettings["backupFrequency"] | null) ??
      "weekly",
    backupTime: row.backup_time ?? "02:00",
    retentionDays: row.retention_days ?? 30,
    backupDestination:
      (row.backup_destination as BackupSettings["backupDestination"] | null) ??
      "local",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.cloud_provider) {
    settings.cloudProvider = row.cloud_provider as
      | "google_drive"
      | "dropbox"
      | "onedrive";
  }
  if (row.last_backup) {
    settings.lastBackup = row.last_backup;
  }

  return settings;
}

export function useBackupSettings(userId: string | null): {
  settings: BackupSettings | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<BackupSettingsRow>(
    userId
      ? `SELECT * FROM backup_settings WHERE user_id = $1`
      : `SELECT * FROM backup_settings WHERE 1 = 0`,
    userId ? [userId] : []
  );

  const settings = data[0] ? mapRowToBackupSettings(data[0]) : null;

  return { settings, isLoading, error };
}

export function useBackupSettingsMutations(): {
  upsertBackupSettings: (
    userId: string,
    data: BackupSettingsFormData
  ) => Promise<string>;
  updateLastBackup: (userId: string) => Promise<void>;
} {
  const db = getPowerSyncDatabase();

  const upsertBackupSettings = useCallback(
    async (userId: string, data: BackupSettingsFormData): Promise<string> => {
      const now = new Date().toISOString();

      const existing = await db.getOptional<{ id: string }>(
        `SELECT id FROM backup_settings WHERE user_id = ?`,
        [userId]
      );

      if (existing) {
        await db.execute(
          `UPDATE backup_settings SET
            auto_backup_enabled = ?, backup_frequency = ?, backup_time = ?,
            retention_days = ?, backup_destination = ?, cloud_provider = ?,
            updated_at = ?
          WHERE user_id = ?`,
          [
            data.autoBackupEnabled ? 1 : 0,
            data.backupFrequency ?? "weekly",
            data.backupTime ?? "02:00",
            data.retentionDays ?? 30,
            data.backupDestination ?? "local",
            data.cloudProvider ?? null,
            now,
            userId,
          ]
        );
        return existing.id;
      } else {
        const id = crypto.randomUUID();
        await db.execute(
          `INSERT INTO backup_settings (
            id, user_id, auto_backup_enabled, backup_frequency, backup_time,
            retention_days, backup_destination, cloud_provider,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            userId,
            data.autoBackupEnabled ? 1 : 0,
            data.backupFrequency ?? "weekly",
            data.backupTime ?? "02:00",
            data.retentionDays ?? 30,
            data.backupDestination ?? "local",
            data.cloudProvider ?? null,
            now,
            now,
          ]
        );
        return id;
      }
    },
    [db]
  );

  const updateLastBackup = useCallback(
    async (userId: string): Promise<void> => {
      const now = new Date().toISOString();
      await db.execute(
        `UPDATE backup_settings SET last_backup = ?, updated_at = ? WHERE user_id = ?`,
        [now, now, userId]
      );
    },
    [db]
  );

  return { upsertBackupSettings, updateLastBackup };
}

// ============================================================================
// BACKUP HISTORY
// ============================================================================

interface BackupHistoryRow {
  id: string;
  user_id: string;
  timestamp: string;
  type: string;
  destination: string;
  file_size: number | null;
  status: string;
  error_message: string | null;
  file_path: string | null;
}

export interface BackupHistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  type: "manual" | "automatic";
  destination: string;
  fileSize?: number;
  status: "success" | "failed" | "in_progress";
  errorMessage?: string;
  filePath?: string;
}

function mapRowToBackupHistory(row: BackupHistoryRow): BackupHistoryEntry {
  const entry: BackupHistoryEntry = {
    id: row.id,
    userId: row.user_id,
    timestamp: row.timestamp,
    type: row.type as BackupHistoryEntry["type"],
    destination: row.destination,
    status: row.status as BackupHistoryEntry["status"],
  };

  if (row.file_size !== null) entry.fileSize = row.file_size;
  if (row.error_message) entry.errorMessage = row.error_message;
  if (row.file_path) entry.filePath = row.file_path;

  return entry;
}

export function useBackupHistory(
  userId: string | null,
  limit = 10
): {
  history: BackupHistoryEntry[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<BackupHistoryRow>(
    userId
      ? `SELECT * FROM backup_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2`
      : `SELECT * FROM backup_history WHERE 1 = 0`,
    userId ? [userId, limit] : []
  );

  const history = useMemo(() => data.map(mapRowToBackupHistory), [data]);

  return { history, isLoading, error };
}

export function useBackupHistoryMutations(): {
  addBackupEntry: (
    userId: string,
    data: {
      type: "manual" | "automatic";
      destination: string;
      fileSize?: number;
      status: "success" | "failed" | "in_progress";
      errorMessage?: string;
      filePath?: string;
    }
  ) => Promise<string>;
  updateBackupStatus: (
    id: string,
    status: "success" | "failed" | "in_progress",
    errorMessage?: string
  ) => Promise<void>;
} {
  const db = getPowerSyncDatabase();

  const addBackupEntry = useCallback(
    async (
      userId: string,
      data: {
        type: "manual" | "automatic";
        destination: string;
        fileSize?: number;
        status: "success" | "failed" | "in_progress";
        errorMessage?: string;
        filePath?: string;
      }
    ): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO backup_history (
          id, user_id, timestamp, type, destination, file_size,
          status, error_message, file_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          now,
          data.type,
          data.destination,
          data.fileSize ?? null,
          data.status,
          data.errorMessage ?? null,
          data.filePath ?? null,
        ]
      );

      return id;
    },
    [db]
  );

  const updateBackupStatus = useCallback(
    async (
      id: string,
      status: "success" | "failed" | "in_progress",
      errorMessage?: string
    ): Promise<void> => {
      await db.execute(
        `UPDATE backup_history SET status = ?, error_message = ? WHERE id = ?`,
        [status, errorMessage ?? null, id]
      );
    },
    [db]
  );

  return { addBackupEntry, updateBackupStatus };
}
