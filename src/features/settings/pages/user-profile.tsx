import { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { User, Bell, Lock, Save, Upload, Camera } from "lucide-react";
import { SettingsLayout } from "../components/settings-layout";
import {
  SettingsCard,
  SettingsRow,
  SettingsGroup,
} from "../components/settings-card";
import type { UserProfile, NotificationPreferences } from "../types";
import {
  useUserProfile,
  useUserProfileMutations,
} from "@/hooks/useUserSettings";
import { Spinner } from "@/components/common";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}): React.ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-teal-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function UserProfilePage(): React.ReactNode {
  const { profile: data, isLoading } = useUserProfile();
  const { updateUserProfile } = useUserProfileMutations();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Sync data to local state
  useEffect(() => {
    if (data) {
      setProfile(data);
    }
  }, [data]);

  const handleSave = async (): Promise<void> => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await updateUserProfile(profile);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof UserProfile>(
    field: K,
    value: UserProfile[K]
  ): void => {
    if (!profile) return;
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const updateNotification = (
    field: keyof NotificationPreferences,
    value: boolean
  ): void => {
    if (!profile) return;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            notifications: { ...prev.notifications, [field]: value },
          }
        : null
    );
  };

  const roleLabels: Record<string, string> = {
    owner: "Owner",
    admin: "Administrator",
    manager: "Manager",
    staff: "Staff",
    accountant: "Accountant",
  };

  if (isLoading && !profile) {
    return (
      <SettingsLayout
        title="User Profile"
        description="Manage your personal account settings"
      >
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </SettingsLayout>
    );
  }

  // Fallback if no profile and not loading (should be handled by creating default in hook, but safeguard)
  if (!profile) {
    return (
      <SettingsLayout
        title="User Profile"
        description="Manage your personal account settings"
      >
        <div className="text-center py-12">
          <p>Profile not found.</p>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="User Profile"
      description="Manage your personal account settings"
      actions={
        <Button
          onClick={() => {
            void handleSave();
          }}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Profile Picture & Basic Info */}
        <SettingsCard
          title="Personal Information"
          description="Your account details"
          icon={User}
        >
          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {profile.firstName[0] || "U"}
                      {profile.lastName[0] || ""}
                    </span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-slate-200 hover:bg-slate-50">
                  <Camera className="h-4 w-4 text-slate-600" />
                </button>
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="text-sm text-slate-500">
                  {roleLabels[profile.role] || profile.role}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 gap-2 text-xs"
                >
                  <Upload className="h-3 w-3" />
                  Change Photo
                </Button>
              </div>
            </div>

            <SettingsGroup>
              <SettingsRow label="First Name" required>
                <Input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => {
                    updateField("firstName", e.target.value);
                  }}
                  className="w-48"
                />
              </SettingsRow>
              <SettingsRow label="Last Name" required>
                <Input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => {
                    updateField("lastName", e.target.value);
                  }}
                  className="w-48"
                />
              </SettingsRow>
              <SettingsRow
                label="Email Address"
                description="Used for login and notifications"
              >
                <Input
                  type="email"
                  value={profile.email}
                  disabled // Email usually can't be changed directly here
                  className="w-64 bg-slate-50"
                />
              </SettingsRow>
              <SettingsRow label="Phone Number" showOptionalLabel>
                <Input
                  type="tel"
                  value={profile.phone ?? ""}
                  onChange={(e) => {
                    updateField("phone", e.target.value);
                  }}
                  className="w-48"
                />
              </SettingsRow>
              <SettingsRow label="Language">
                <select
                  value={profile.language}
                  onChange={(e) => {
                    updateField("language", e.target.value);
                  }}
                  className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                  <option value="gu">Gujarati</option>
                  <option value="ta">Tamil</option>
                </select>
              </SettingsRow>
            </SettingsGroup>
          </div>
        </SettingsCard>

        {/* Password */}
        <SettingsCard
          title="Password"
          description="Update your account password"
          icon={Lock}
          actions={
            !showPasswordForm && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowPasswordForm(true);
                }}
              >
                Change Password
              </Button>
            )
          }
        >
          {showPasswordForm ? (
            <div className="space-y-4">
              <SettingsRow label="Current Password">
                <Input
                  type="password"
                  className="w-64"
                  placeholder="Enter current password"
                />
              </SettingsRow>
              <SettingsRow label="New Password">
                <Input
                  type="password"
                  className="w-64"
                  placeholder="Enter new password"
                />
              </SettingsRow>
              <SettingsRow label="Confirm Password">
                <Input
                  type="password"
                  className="w-64"
                  placeholder="Confirm new password"
                />
              </SettingsRow>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPasswordForm(false);
                  }}
                >
                  Cancel
                </Button>
                <Button>Update Password</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Last changed 30 days ago. It&apos;s recommended to change your
              password periodically.
            </p>
          )}
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard
          title="Notification Preferences"
          description="Choose how you want to be notified"
          icon={Bell}
        >
          <SettingsGroup title="Channels">
            <SettingsRow
              label="Email Notifications"
              description="Receive updates via email"
            >
              <Toggle
                checked={profile.notifications.email}
                onChange={(v) => {
                  updateNotification("email", v);
                }}
              />
            </SettingsRow>
            <SettingsRow
              label="Push Notifications"
              description="Browser and desktop notifications"
            >
              <Toggle
                checked={profile.notifications.push}
                onChange={(v) => {
                  updateNotification("push", v);
                }}
              />
            </SettingsRow>
            <SettingsRow
              label="SMS Notifications"
              description="Text message alerts"
            >
              <Toggle
                checked={profile.notifications.sms}
                onChange={(v) => {
                  updateNotification("sms", v);
                }}
              />
            </SettingsRow>
          </SettingsGroup>

          <div className="my-6 border-t border-slate-100" />

          <SettingsGroup title="Alert Types">
            <SettingsRow
              label="Invoice Reminders"
              description="Due date and overdue alerts"
            >
              <Toggle
                checked={profile.notifications.invoiceReminders}
                onChange={(v) => {
                  updateNotification("invoiceReminders", v);
                }}
              />
            </SettingsRow>
            <SettingsRow
              label="Payment Alerts"
              description="Incoming and outgoing payments"
            >
              <Toggle
                checked={profile.notifications.paymentAlerts}
                onChange={(v) => {
                  updateNotification("paymentAlerts", v);
                }}
              />
            </SettingsRow>
            <SettingsRow
              label="Low Stock Alerts"
              description="When items fall below reorder level"
            >
              <Toggle
                checked={profile.notifications.lowStockAlerts}
                onChange={(v) => {
                  updateNotification("lowStockAlerts", v);
                }}
              />
            </SettingsRow>
            <SettingsRow
              label="Weekly Reports"
              description="Summary reports every week"
            >
              <Toggle
                checked={profile.notifications.weeklyReports}
                onChange={(v) => {
                  updateNotification("weeklyReports", v);
                }}
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* Account Info */}
        <SettingsCard title="Account Information" icon={User}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Role</p>
              <p className="font-medium text-slate-900">
                {roleLabels[profile.role] || profile.role}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Account Created</p>
              <p className="font-medium text-slate-900">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Last Login</p>
              <p className="font-medium text-slate-900">
                {profile.lastLogin
                  ? new Date(profile.lastLogin).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </div>
        </SettingsCard>
      </div>
    </SettingsLayout>
  );
}
