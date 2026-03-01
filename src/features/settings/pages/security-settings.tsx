import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Card, CardBody } from "@/components/ui";
import {
  Shield,
  Smartphone,
  Clock,
  Key,
  Monitor,
  AlertTriangle,
  Check,
  X,
  MapPin,
  Save,
} from "lucide-react";
import { SettingsLayout } from "../components/settings-layout";
import {
  SettingsCard,
  SettingsRow,
  SettingsGroup,
} from "../components/settings-card";
import { cn } from "@/lib/cn";
import type { SecuritySettings } from "../types";
import {
  useSecuritySettings,
  useSecuritySettingsMutations,
} from "@/hooks/useSecuritySettings";
import { toast } from "sonner";
import { Spinner } from "@/components/common";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}): React.ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked ? "bg-teal-600" : "bg-slate-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function SecuritySettingsPage(): React.ReactNode {
  const { settings: data, isLoading } = useSecuritySettings();
  const { updateSecuritySettings } = useSecuritySettingsMutations();

  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleSave = async (): Promise<void> => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await updateSecuritySettings(settings);
      toast.success("Security settings updated successfully");
    } catch (err) {
      console.error("Error saving security settings:", err);
      toast.error("Failed to save security settings");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDeviceIcon = (userAgent: string): typeof Monitor => {
    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("iphone") ||
      ua.includes("android")
    ) {
      return Smartphone;
    }
    return Monitor;
  };

  if (isLoading && !settings) {
    return (
      <SettingsLayout
        title="Security Settings"
        description="Manage your account security and access"
      >
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </SettingsLayout>
    );
  }

  if (!settings) {
    return (
      <SettingsLayout
        title="Security Settings"
        description="Manage your account security and access"
      >
        <div className="text-center py-12">
          <p>Security settings not found.</p>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="Security Settings"
      description="Manage your account security and access"
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
        {/* Two-Factor Authentication */}
        <SettingsCard
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
          icon={Smartphone}
        >
          <div className="space-y-4">
            <SettingsRow
              label="Enable 2FA"
              description="Require a verification code when signing in"
            >
              <Toggle
                checked={settings.twoFactorEnabled}
                onChange={(v) => {
                  setSettings((prev) =>
                    prev ? { ...prev, twoFactorEnabled: v } : null
                  );
                }}
              />
            </SettingsRow>

            {settings.twoFactorEnabled && (
              <>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    Verification Method
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        value: "app",
                        label: "Authenticator App",
                        desc: "Google Authenticator, Authy",
                      },
                      {
                        value: "sms",
                        label: "SMS",
                        desc: "Text message to phone",
                      },
                      {
                        value: "email",
                        label: "Email",
                        desc: "Code sent to email",
                      },
                    ].map((method) => (
                      <button
                        key={method.value}
                        onClick={() => {
                          setSettings((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  twoFactorMethod: method.value as
                                    | "app"
                                    | "sms"
                                    | "email",
                                }
                              : null
                          );
                        }}
                        className={cn(
                          "p-4 rounded-lg border text-left transition-all",
                          settings.twoFactorMethod === method.value
                            ? "bg-teal-50 border-teal-300"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <p className="font-medium text-slate-900">
                          {method.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {method.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {!settings.twoFactorMethod && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardBody className="py-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <p className="text-sm text-amber-700">
                          Please select a verification method to complete 2FA
                          setup.
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </>
            )}
          </div>
        </SettingsCard>

        {/* Session Settings */}
        <SettingsCard
          title="Session Settings"
          description="Control how long sessions stay active"
          icon={Clock}
        >
          <SettingsGroup>
            <SettingsRow
              label="Session Timeout"
              description="Automatically log out after inactivity"
            >
              <select
                value={settings.sessionTimeout}
                onChange={(e) => {
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          sessionTimeout: parseInt(e.target.value),
                        }
                      : null
                  );
                }}
                className="w-40 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
                <option value={1440}>24 hours</option>
                <option value={0}>Never</option>
              </select>
            </SettingsRow>
          </SettingsGroup>

          <div className="my-4 border-t border-slate-100" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Active Sessions</p>
              <p className="text-sm text-slate-500">
                You&apos;re currently signed in
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="text-error hover:text-error"
            >
              Sign Out All Devices
            </Button>
          </div>
        </SettingsCard>

        {/* Password Policy */}
        <SettingsCard
          title="Password Policy"
          description="Configure password requirements"
          icon={Key}
        >
          <SettingsGroup>
            <SettingsRow
              label="Require Password Change"
              description="Force periodic password updates"
            >
              <Toggle
                checked={settings.requirePasswordChange}
                onChange={(v) => {
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          requirePasswordChange: v,
                        }
                      : null
                  );
                }}
              />
            </SettingsRow>
            {settings.requirePasswordChange && (
              <SettingsRow
                label="Change Every"
                description="Days between password changes"
              >
                <select
                  value={settings.passwordChangeDays ?? 90}
                  onChange={(e) => {
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            passwordChangeDays: parseInt(e.target.value),
                          }
                        : null
                    );
                  }}
                  className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                  <option value={365}>1 year</option>
                </select>
              </SettingsRow>
            )}
          </SettingsGroup>
        </SettingsCard>

        {/* IP Restrictions */}
        <SettingsCard
          title="IP Restrictions"
          description="Limit access to specific IP addresses"
          icon={Shield}
        >
          <div className="space-y-4">
            <SettingsRow
              label="Restrict by IP"
              description="Only allow access from specified IPs"
            >
              <Toggle
                checked={(settings.allowedIPs?.length ?? 0) > 0}
                onChange={(v) => {
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          allowedIPs: v ? [""] : [],
                        }
                      : null
                  );
                }}
              />
            </SettingsRow>

            {(settings.allowedIPs?.length ?? 0) > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500 mb-3">
                  Enter IP addresses that are allowed to access the account (one
                  per line)
                </p>
                <textarea
                  value={settings.allowedIPs?.join("\n") ?? ""}
                  onChange={(e) => {
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            allowedIPs: e.target.value
                              .split("\n")
                              .filter(Boolean),
                          }
                        : null
                    );
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  placeholder="192.168.1.1&#10;10.0.0.0/24&#10;203.0.113.0"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Supports individual IPs and CIDR notation
                </p>
              </div>
            )}
          </div>
        </SettingsCard>

        {/* Login History */}
        <SettingsCard
          title="Login History"
          description="Recent account access activity"
          icon={Clock}
        >
          <div className="space-y-3">
            {settings.loginHistory.length === 0 ? (
              <p className="text-sm text-slate-500">
                No login history recorded.
              </p>
            ) : (
              settings.loginHistory.map((record) => {
                const DeviceIcon = getDeviceIcon(record.userAgent);
                return (
                  <div
                    key={record.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border",
                      record.success
                        ? "border-slate-200"
                        : "border-red-200 bg-red-50"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        record.success ? "bg-slate-100" : "bg-red-100"
                      )}
                    >
                      <DeviceIcon
                        className={cn(
                          "h-5 w-5",
                          record.success ? "text-slate-600" : "text-red-600"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {record.userAgent.split(" on ")[0] ||
                            "Unknown Device"}
                        </span>
                        {record.success ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <X className="h-4 w-4 text-error" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>{formatDate(record.timestamp)}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {record.location ?? "Unknown"}
                        </span>
                        <span className="font-mono">{record.ipAddress}</span>
                      </div>
                    </div>
                    {!record.success && (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        Failed
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <Button variant="ghost" size="sm">
              View Full History
            </Button>
          </div>
        </SettingsCard>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Danger Zone</h3>
                <p className="text-sm text-slate-500 mt-1">
                  These actions are irreversible. Please proceed with caution.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button variant="secondary" size="sm">
                    Revoke All API Keys
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-error border-red-200 hover:bg-red-50"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </SettingsLayout>
  );
}
