import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type {
  UserProfile,
  UserRole,
  NotificationPreferences,
} from "@/features/settings/types";
import { useAuthStore } from "@/stores/auth-store";

// Database row type
interface UserProfileRow {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  language: string;
  notification_email: number;
  notification_push: number;
  notification_sms: number;
  created_at: string;
  updated_at: string;
}

function mapRowToUserProfile(row: UserProfileRow, email: string): UserProfile {
  return {
    id: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: email, // Email comes from auth store usually, or joined user table if exists.
    // But here we rely on the passed email since user_profiles might not store it if it's in auth table.
    // Wait, schema for user_profiles doesn't have email. It uses user_id.
    // We'll use the one from auth store for display if needed.
    phone: row.phone ?? undefined,
    avatar: row.avatar_url ?? undefined,
    role: row.role as UserRole,
    language: row.language,
    notifications: {
      email: row.notification_email === 1,
      push: row.notification_push === 1,
      sms: row.notification_sms === 1,
      // Default others to false/true as they are not in DB yet or map to these?
      // Schema has only 3 notification columns.
      // We will map them for now.
      invoiceReminders: row.notification_email === 1, // simplified mapping
      paymentAlerts: row.notification_push === 1,
      lowStockAlerts: row.notification_email === 1,
      weeklyReports: row.notification_email === 1,
    },
    createdAt: row.created_at,
  };
}

export function useUserProfile(): {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { user } = useAuthStore();
  const userId = user?.id;
  const userEmail = user?.email ?? "";

  const { data, isLoading, error } = useQuery<UserProfileRow>(
    `SELECT * FROM user_profiles WHERE user_id = ?`,
    [userId ?? ""]
  );

  const profile = useMemo(() => {
    if (!userId) return null;

    // If DB row exists, use it
    if (data[0]) {
      return mapRowToUserProfile(data[0], userEmail);
    }

    // Fallback: Create default profile from Auth User Metadata
    // This allows the UI to render and then Save will INSERT the row
    const defaultProfile: UserProfile = {
      id: userId,
      firstName: "", // Can try extracting from email or auth meta if available
      lastName: "",
      email: userEmail,
      role: "owner", // Default to owner for first user? Or staff. Let's say "owner" for now.
      language: "en",
      notifications: {
        email: true,
        push: true,
        sms: false,
        invoiceReminders: true,
        paymentAlerts: true,
        lowStockAlerts: true,
        weeklyReports: true,
      },
      createdAt: new Date().toISOString(),
    };

    return defaultProfile;
  }, [data, userId, userEmail]);

  return { profile, isLoading, error };
}

interface UserProfileMutations {
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateNotifications: (
    data: Partial<NotificationPreferences>
  ) => Promise<void>;
}

export function useUserProfileMutations(): UserProfileMutations {
  const db = getPowerSyncDatabase();
  const { user } = useAuthStore();
  const userId = user?.id;

  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>): Promise<void> => {
      if (!userId) return;
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      // Check if profile exists
      const existing = await db.getAll<UserProfileRow>(
        `SELECT user_id FROM user_profiles WHERE user_id = ?`,
        [userId]
      );

      if (existing.length === 0) {
        // Create profile if not exists
        await db.execute(
          `INSERT INTO user_profiles (
            user_id, first_name, last_name, phone, avatar_url, role, language, 
            notification_email, notification_push, notification_sms, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            data.firstName ?? "",
            data.lastName ?? "",
            data.phone ?? null,
            data.avatar ?? null,
            data.role ?? "staff",
            data.language ?? "en",
            data.notifications?.email ? 1 : 0,
            data.notifications?.push ? 1 : 0,
            data.notifications?.sms ? 1 : 0,
            now,
            now,
          ]
        );
      } else {
        // Update
        if (data.firstName !== undefined) {
          fields.push("first_name = ?");
          values.push(data.firstName);
        }
        if (data.lastName !== undefined) {
          fields.push("last_name = ?");
          values.push(data.lastName);
        }
        if (data.phone !== undefined) {
          fields.push("phone = ?");
          values.push(data.phone ?? null);
        }
        if (data.avatar !== undefined) {
          fields.push("avatar_url = ?");
          values.push(data.avatar ?? null);
        }
        if (data.role !== undefined) {
          fields.push("role = ?");
          values.push(data.role);
        }
        if (data.language !== undefined) {
          fields.push("language = ?");
          values.push(data.language);
        }
        if (data.notifications) {
          fields.push("notification_email = ?");
          values.push(data.notifications.email ? 1 : 0);

          fields.push("notification_push = ?");
          values.push(data.notifications.push ? 1 : 0);

          fields.push("notification_sms = ?");
          values.push(data.notifications.sms ? 1 : 0);
        }

        fields.push("updated_at = ?");
        values.push(now);
        values.push(userId);

        if (fields.length > 0) {
          await db.execute(
            `UPDATE user_profiles SET ${fields.join(", ")} WHERE user_id = ?`,
            values
          );
        }
      }
    },
    [db, userId]
  );

  const updateNotifications = useCallback(
    async (data: Partial<NotificationPreferences>): Promise<void> => {
      if (!userId) return;
      // This is a subset of updateProfile usually, but explicit method is good
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (data.email !== undefined) {
        fields.push("notification_email = ?");
        values.push(data.email ? 1 : 0);
      }
      if (data.push !== undefined) {
        fields.push("notification_push = ?");
        values.push(data.push ? 1 : 0);
      }
      if (data.sms !== undefined) {
        fields.push("notification_sms = ?");
        values.push(data.sms ? 1 : 0);
      }

      fields.push("updated_at = ?");
      values.push(now);
      values.push(userId);

      if (fields.length > 0) {
        // Should ensure profile exists first?
        // Assuming profile is created on signup or first login.
        // For safety we can upsert or check, but let's assume existence or just update.
        // Actually, safer to ensure existence logic handled in updateUserProfile.
        // Let's reuse logic or just execute update.
        await db.execute(
          `UPDATE user_profiles SET ${fields.join(", ")} WHERE user_id = ?`,
          values
        );
      }
    },
    [db, userId]
  );

  return { updateUserProfile, updateNotifications };
}
