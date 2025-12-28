import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { User, Bell, Lock, Save, Upload, Camera } from "lucide-react";
import { SettingsLayout } from "../components/settings-layout";
import { SettingsCard, SettingsRow, SettingsGroup } from "../components/settings-card";
import type { UserProfile, NotificationPreferences } from "../types";

// Mock data
const mockUserProfile: UserProfile = {
  id: "1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@acmecorp.com",
  phone: "+91 98765 43210",
  role: "admin",
  language: "en",
  notifications: {
    email: true,
    push: true,
    sms: false,
    invoiceReminders: true,
    paymentAlerts: true,
    lowStockAlerts: true,
    weeklyReports: false,
  },
  createdAt: "2024-01-15T10:00:00Z",
  lastLogin: "2024-01-20T14:30:00Z",
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => { onChange(!checked); }}
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

export function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const updateField = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updateNotification = (field: keyof NotificationPreferences, value: boolean) => {
    setProfile((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  const roleLabels: Record<UserProfile["role"], string> = {
    owner: "Owner",
    admin: "Administrator",
    manager: "Manager",
    staff: "Staff",
    accountant: "Accountant",
  };

  return (
    <SettingsLayout
      title="User Profile"
      description="Manage your personal account settings"
      actions={
        <Button onClick={() => { void handleSave(); }} disabled={isSaving} className="gap-2">
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
                      {profile.firstName[0]}
                      {profile.lastName[0]}
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
                <p className="text-sm text-slate-500">{roleLabels[profile.role]}</p>
                <Button variant="ghost" size="sm" className="mt-1 gap-2 text-xs">
                  <Upload className="h-3 w-3" />
                  Change Photo
                </Button>
              </div>
            </div>

            <SettingsGroup>
              <SettingsRow label="First Name">
                <Input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => { updateField("firstName", e.target.value); }}
                  className="w-48"
                />
              </SettingsRow>
              <SettingsRow label="Last Name">
                <Input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => { updateField("lastName", e.target.value); }}
                  className="w-48"
                />
              </SettingsRow>
              <SettingsRow label="Email Address" description="Used for login and notifications">
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => { updateField("email", e.target.value); }}
                  className="w-64"
                />
              </SettingsRow>
              <SettingsRow label="Phone Number">
                <Input
                  type="tel"
                  value={profile.phone ?? ""}
                  onChange={(e) => { updateField("phone", e.target.value); }}
                  className="w-48"
                />
              </SettingsRow>
              <SettingsRow label="Language">
                <select
                  value={profile.language}
                  onChange={(e) => { updateField("language", e.target.value); }}
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
                onClick={() => { setShowPasswordForm(true); }}
              >
                Change Password
              </Button>
            )
          }
        >
          {showPasswordForm ? (
            <div className="space-y-4">
              <SettingsRow label="Current Password">
                <Input type="password" className="w-64" placeholder="Enter current password" />
              </SettingsRow>
              <SettingsRow label="New Password">
                <Input type="password" className="w-64" placeholder="Enter new password" />
              </SettingsRow>
              <SettingsRow label="Confirm Password">
                <Input type="password" className="w-64" placeholder="Confirm new password" />
              </SettingsRow>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button variant="ghost" onClick={() => { setShowPasswordForm(false); }}>
                  Cancel
                </Button>
                <Button>Update Password</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Last changed 30 days ago. It&apos;s recommended to change your password periodically.
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
            <SettingsRow label="Email Notifications" description="Receive updates via email">
              <Toggle
                checked={profile.notifications.email}
                onChange={(v) => { updateNotification("email", v); }}
              />
            </SettingsRow>
            <SettingsRow label="Push Notifications" description="Browser and desktop notifications">
              <Toggle
                checked={profile.notifications.push}
                onChange={(v) => { updateNotification("push", v); }}
              />
            </SettingsRow>
            <SettingsRow label="SMS Notifications" description="Text message alerts">
              <Toggle
                checked={profile.notifications.sms}
                onChange={(v) => { updateNotification("sms", v); }}
              />
            </SettingsRow>
          </SettingsGroup>

          <div className="my-6 border-t border-slate-100" />

          <SettingsGroup title="Alert Types">
            <SettingsRow label="Invoice Reminders" description="Due date and overdue alerts">
              <Toggle
                checked={profile.notifications.invoiceReminders}
                onChange={(v) => { updateNotification("invoiceReminders", v); }}
              />
            </SettingsRow>
            <SettingsRow label="Payment Alerts" description="Incoming and outgoing payments">
              <Toggle
                checked={profile.notifications.paymentAlerts}
                onChange={(v) => { updateNotification("paymentAlerts", v); }}
              />
            </SettingsRow>
            <SettingsRow label="Low Stock Alerts" description="When items fall below reorder level">
              <Toggle
                checked={profile.notifications.lowStockAlerts}
                onChange={(v) => { updateNotification("lowStockAlerts", v); }}
              />
            </SettingsRow>
            <SettingsRow label="Weekly Reports" description="Summary reports every week">
              <Toggle
                checked={profile.notifications.weeklyReports}
                onChange={(v) => { updateNotification("weeklyReports", v); }}
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* Account Info */}
        <SettingsCard title="Account Information" icon={User}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Role</p>
              <p className="font-medium text-slate-900">{roleLabels[profile.role]}</p>
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
