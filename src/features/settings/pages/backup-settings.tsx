import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { toast } from "sonner";
import { Card, CardBody } from "@/components/ui";
import {
  Database,
  Cloud,
  HardDrive,
  Download,
  Upload,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Save,
} from "lucide-react";
import { SettingsLayout } from "../components/settings-layout";
import {
  SettingsCard,
  SettingsRow,
  SettingsGroup,
} from "../components/settings-card";
import { cn } from "@/lib/cn";
import type { BackupSettings, BackupRecord } from "../types";
import {
  useBackupSettings,
  useBackupSettingsMutations,
} from "@/hooks/useBackupSettings";
import { Spinner } from "@/components/common";
import { getPowerSyncDatabase } from "@/lib/powersync";
import { DatabaseBackupService } from "@/lib/backup-service";
import { supabase } from "@/lib/supabase-client";

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
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked ? "bg-teal-600" : "bg-slate-200"
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

export function BackupSettingsPage(): React.ReactNode {
  const { settings: data, isLoading } = useBackupSettings();
  const { updateBackupSettings, createBackupRecord } =
    useBackupSettingsMutations();

  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleConnectDrive = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/drive.file",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      console.error("Failed to connect Google Drive:", err);
      // Fallback: If linkIdentity fails (e.g. not supported or user conflict), try re-auth which merges if email matches
      if (err instanceof Error && err.message.includes("identities")) {
        toast.error("This Google account is already linked to another user.");
      } else {
        toast.error(
          "Could not initiate Google Drive connection: " +
            (err instanceof Error ? err.message : String(err))
        );
      }
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await updateBackupSettings(settings);
    } catch (err) {
      console.error("Error saving backup settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupNow = async (): Promise<void> => {
    setIsBackingUp(true);
    try {
      const db = getPowerSyncDatabase();
      const backupService = new DatabaseBackupService(db);

      const jsonContent = await backupService.createBackup();
      const blob = new Blob([jsonContent], { type: "application/json" });
      const size = blob.size;
      const destination = settings?.backupDestination ?? "local";
      let filePath = "";

      if (destination === "local" || destination === "both") {
        if (typeof window !== "undefined" && "__TAURI__" in window) {
          // Tauri Save Dialog
          const { save } = await import("@tauri-apps/plugin-dialog");
          const { writeTextFile } = await import("@tauri-apps/plugin-fs");

          const path = await save({
            filters: [
              {
                name: "JSON Backup",
                extensions: ["json"],
              },
            ],
            defaultPath: `backup-${new Date().toISOString().split("T")[0]}.json`,
          });

          if (path) {
            await writeTextFile(path, jsonContent);
            filePath = path;
          } else {
            throw new Error("Backup cancelled by user");
          }
        } else {
          // Web Download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          filePath = "Downloads";
        }
      }

      await createBackupRecord({
        type: "manual",
        destination: destination,
        fileSize: size,
        status: "success",
        filePath: filePath || "cloud-only",
      });
    } catch (err: unknown) {
      console.error("Backup failed", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage !== "Backup cancelled by user") {
        await createBackupRecord({
          type: "manual",
          destination: settings?.backupDestination ?? "local",
          fileSize: 0,
          status: "failed",
          errorMessage: errorMessage || "Unknown error",
        });
      }
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (): Promise<void> => {
    setIsRestoring(true);
    try {
      let fileContent = "";

      if (typeof window !== "undefined" && "__TAURI__" in window) {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const { readTextFile } = await import("@tauri-apps/plugin-fs");

        const selected = await open({
          filters: [
            {
              name: "JSON Backup",
              extensions: ["json"],
            },
          ],
        });

        if (selected && typeof selected === "string") {
          fileContent = await readTextFile(selected);
        } else if (selected) {
          const path = Array.isArray(selected) ? selected[0] : selected;
          if (path) fileContent = await readTextFile(path);
        }
      } else {
        // Web Input
        await new Promise<void>((resolve, reject) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/json";
          input.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
              resolve();
              return;
            }
            const reader = new FileReader();
            reader.onload = (re) => {
              fileContent = re.target?.result as string;
              resolve();
            };
            reader.onerror = reject;
            reader.readAsText(file);
          };
          input.click();
        });
      }

      if (!fileContent) return;

      const db = getPowerSyncDatabase();
      const backupService = new DatabaseBackupService(db);
      const result = await backupService.restoreBackup(fileContent);

      if (result.success) {
        toast.success("Restore successful! The application will reload.");
        window.location.reload();
      } else {
        toast.error(`Restore failed: ${result.message}`);
      }
    } catch (err) {
      console.error("Restore failed:", err);
      toast.error("An unexpected error occurred during restore.");
    } finally {
      setIsRestoring(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "—";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
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

  const getTimeSince = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );
    if (hours < 1) return "Less than an hour ago";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const StatusIcon = ({
    status,
  }: {
    status: BackupRecord["status"];
  }): React.ReactNode => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-error" />;
      case "in-progress":
        return <RefreshCw className="h-5 w-5 text-teal-600 animate-spin" />;
      default:
        return null;
    }
  };

  if (isLoading && !settings) {
    return (
      <SettingsLayout
        title="Backup & Data"
        description="Manage your data backups and storage"
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
        title="Backup & Data"
        description="Manage your data backups and storage"
      >
        <div className="text-center py-12">
          <p>Backup settings not found.</p>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="Backup & Data"
      description="Manage your data backups and storage"
      actions={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              void handleBackupNow();
            }}
            disabled={isBackingUp || isRestoring}
            className="gap-2"
          >
            {isBackingUp ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isBackingUp ? "Backing up..." : "Backup Now"}
          </Button>
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
        </div>
      }
    >
      <div className="space-y-6">
        {/* Backup Status */}
        <Card className="bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Database className="h-8 w-8 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-teal-600">Last Backup</p>
                  <p className="text-xl font-bold text-slate-900">
                    {settings.lastBackup
                      ? getTimeSince(settings.lastBackup)
                      : "Never"}
                  </p>
                  {settings.lastBackup && (
                    <p className="text-xs text-slate-500">
                      {formatDate(settings.lastBackup)}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Next scheduled backup</p>
                <p className="font-medium text-slate-900">
                  {settings.autoBackupEnabled
                    ? `Today at ${settings.backupTime}`
                    : "Disabled"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Auto Backup */}
        <SettingsCard
          title="Automatic Backup"
          description="Schedule regular backups of your data"
          icon={Clock}
        >
          <SettingsGroup>
            <SettingsRow
              label="Enable Auto Backup"
              description="Automatically backup data on schedule"
            >
              <Toggle
                checked={settings.autoBackupEnabled}
                onChange={(v) => {
                  setSettings((prev) =>
                    prev ? { ...prev, autoBackupEnabled: v } : null
                  );
                }}
              />
            </SettingsRow>

            {settings.autoBackupEnabled && (
              <>
                <SettingsRow
                  label="Frequency"
                  description="How often to backup"
                >
                  <select
                    value={settings.backupFrequency}
                    onChange={(e) => {
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              backupFrequency: e.target.value as
                                | "daily"
                                | "weekly"
                                | "monthly",
                            }
                          : null
                      );
                    }}
                    className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </SettingsRow>
                <SettingsRow
                  label="Backup Time"
                  description="When to run backups"
                >
                  <input
                    type="time"
                    value={settings.backupTime}
                    onChange={(e) => {
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              backupTime: e.target.value,
                            }
                          : null
                      );
                    }}
                    className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  ></input>
                </SettingsRow>
                <SettingsRow
                  label="Retention Period"
                  description="How long to keep old backups"
                >
                  <select
                    value={settings.retentionDays}
                    onChange={(e) => {
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              retentionDays: parseInt(e.target.value),
                            }
                          : null
                      );
                    }}
                    className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </SettingsRow>
              </>
            )}
          </SettingsGroup>
        </SettingsCard>

        {/* Backup Destination */}
        <SettingsCard
          title="Backup Destination"
          description="Choose where to store your backups"
          icon={Cloud}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  value: "local",
                  label: "Local Only",
                  icon: HardDrive,
                  desc: "Store on this device",
                },
                {
                  value: "cloud",
                  label: "Cloud Only",
                  icon: Cloud,
                  desc: "Store in cloud",
                },
                {
                  value: "both",
                  label: "Both",
                  icon: Database,
                  desc: "Local + Cloud",
                },
              ].map((option) => {
                const Icon = option.icon;
                const isActive = settings.backupDestination === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              backupDestination: option.value as
                                | "local"
                                | "cloud"
                                | "both",
                            }
                          : null
                      );
                    }}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      isActive
                        ? "bg-teal-50 border-teal-300"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 mb-2",
                        isActive ? "text-teal-600" : "text-slate-400"
                      )}
                    />
                    <p className="font-medium text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{option.desc}</p>
                  </button>
                );
              })}
            </div>

            {(settings.backupDestination === "cloud" ||
              settings.backupDestination === "both") && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Cloud Provider
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "google-drive", label: "Google Drive" },
                    { value: "dropbox", label: "Dropbox" },
                    { value: "onedrive", label: "OneDrive" },
                  ].map((provider) => (
                    <button
                      key={provider.value}
                      onClick={() => {
                        setSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                cloudProvider: provider.value as
                                  | "google-drive"
                                  | "dropbox"
                                  | "onedrive",
                              }
                            : null
                        );
                      }}
                      className={cn(
                        "px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                        settings.cloudProvider === provider.value
                          ? "bg-teal-50 border-teal-300 text-teal-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {provider.label}
                    </button>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    void handleConnectDrive();
                  }}
                >
                  Connect Account
                </Button>
              </div>
            )}
          </div>
        </SettingsCard>

        {/* Backup History */}
        <SettingsCard
          title="Backup History"
          description="Recent backup activity"
          icon={Database}
        >
          <div className="space-y-2">
            {settings.backupHistory.length === 0 ? (
              <p className="text-sm text-slate-500">
                No backup history recorded.
              </p>
            ) : (
              settings.backupHistory.map((record) => (
                <div
                  key={record.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border",
                    record.status === "failed"
                      ? "border-red-200 bg-red-50"
                      : "border-slate-200"
                  )}
                >
                  <StatusIcon status={record.status} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">
                      {formatDate(record.timestamp)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {record.destination}
                    </p>
                    {record.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">
                        {record.errorMessage}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-slate-500 tabular-nums">
                    {formatSize(record.size)}
                  </span>
                  {record.status === "success" && (
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </SettingsCard>

        {/* Data Management */}
        <SettingsCard
          title="Data Management"
          description="Export, import, or delete your data"
          icon={Database}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Download className="h-5 w-5 text-teal-600" />
                <h4 className="font-medium text-slate-900">Export All Data</h4>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                Download all your data in a portable format (JSON/CSV)
              </p>
              <Button variant="secondary" size="sm">
                Export Data
              </Button>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Upload className="h-5 w-5 text-teal-600" />
                <h4 className="font-medium text-slate-900">Restore Data</h4>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                Restore data from a previous backup file
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void handleRestore();
                }}
                disabled={isRestoring || isBackingUp}
                leftIcon={
                  isRestoring ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : undefined
                }
              >
                {isRestoring ? "Restoring..." : "Import Backup"}
              </Button>
            </div>
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
                  These actions are permanent and cannot be undone.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Clear All Backups
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-error border-red-200 hover:bg-red-50 gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete All Data
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
