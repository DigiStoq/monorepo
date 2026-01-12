import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import {
  Settings,
  Palette,
  Calendar,
  Hash,
  FileText,
  Save,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { SettingsLayout } from "../components/settings-layout";
import {
  SettingsCard,
  SettingsRow,
  SettingsGroup,
} from "../components/settings-card";
import { cn } from "@/lib/cn";
import type { AppPreferences, DateFormat, DashboardWidget } from "../types";
import { useUserPreferences, useUserPreferencesMutations } from "@/hooks/useUserPreferences";

// Default empty state to prevent null access before load
const defaultPreferences: AppPreferences = {
  theme: "system",
  dateFormat: "DD/MM/YYYY",
  numberFormat: {
    decimalSeparator: ".",
    thousandsSeparator: ",",
    decimalPlaces: 2,
  },
  defaultInvoiceTerms: 30,
  defaultPaymentTerms: "Net 30",
  showDashboardWidgets: [],
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-teal-600" : "bg-muted"
        }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"
          }`}
      />
    </button>
  );
}

const themeOptions: {
  value: AppPreferences["theme"];
  label: string;
  icon: typeof Sun;
}[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

const dateFormatOptions: {
  value: DateFormat;
  label: string;
  example: string;
}[] = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY", example: "25/12/2024" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY", example: "12/25/2024" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD", example: "2024-12-25" },
    { value: "DD-MMM-YYYY", label: "DD-MMM-YYYY", example: "25-Dec-2024" },
  ];

const widgetOptions: { id: DashboardWidget; label: string }[] = [
  { id: "sales-chart", label: "Sales Chart" },
  { id: "receivables", label: "Receivables Summary" },
  { id: "payables", label: "Payables Summary" },
  { id: "recent-transactions", label: "Recent Transactions" },
  { id: "low-stock-alerts", label: "Low Stock Alerts" },
  { id: "quick-actions", label: "Quick Actions" },
  { id: "bank-balance", label: "Bank Balance" },
  { id: "monthly-comparison", label: "Monthly Comparison" },
];

export function PreferencesPage(): React.ReactNode {
  const { preferences: storedPreferences, isLoading } = useUserPreferences();
  const { updateUserPreferences } = useUserPreferencesMutations();

  const [preferences, setPreferences] =
    useState<AppPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isLoading && storedPreferences) {
      setPreferences(storedPreferences);
    }
  }, [storedPreferences, isLoading]);

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      await updateUserPreferences(preferences);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof AppPreferences>(
    field: K,
    value: AppPreferences[K]
  ): void => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const toggleWidget = (widgetId: DashboardWidget): void => {
    setPreferences((prev) => {
      const currentWidgets = prev.showDashboardWidgets || [];
      const newWidgets = currentWidgets.includes(widgetId)
        ? currentWidgets.filter((w) => w !== widgetId)
        : [...currentWidgets, widgetId];

      return {
        ...prev,
        showDashboardWidgets: newWidgets,
      };
    });
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500">Loading preferences...</p>
      </div>
    );
  }

  return (
    <SettingsLayout
      title="Preferences"
      description="Customize your app experience"
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
        {/* Appearance */}
        <SettingsCard
          title="Appearance"
          description="Customize how the app looks"
          icon={Palette}
        >
          <SettingsGroup>
            <SettingsRow
              label="Theme"
              description="Choose your preferred color scheme"
            >
              <div className="flex gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = preferences.theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        updateField("theme", option.value);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                        isActive
                          ? "bg-teal-50 border-teal-300 text-teal-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SettingsRow>
            <SettingsRow
              label="Compact Mode"
              description="Use smaller spacing and fonts"
            >
              <Toggle
                checked={preferences.compactMode}
                onChange={(v) => {
                  updateField("compactMode", v);
                }}
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* Date & Number Format */}
        <SettingsCard
          title="Date & Number Format"
          description="Regional formatting preferences"
          icon={Calendar}
        >
          <SettingsGroup>
            <SettingsRow label="Date Format">
              <select
                value={preferences.dateFormat}
                onChange={(e) => {
                  updateField("dateFormat", e.target.value as DateFormat);
                }}
                className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {dateFormatOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.example})
                  </option>
                ))}
              </select>
            </SettingsRow>
            <SettingsRow label="Decimal Separator">
              <select
                value={preferences.numberFormat.decimalSeparator}
                onChange={(e) => {
                  setPreferences((prev) => ({
                    ...prev,
                    numberFormat: {
                      ...prev.numberFormat,
                      decimalSeparator: e.target.value as "." | ",",
                    },
                  }));
                  setHasChanges(true);
                }}
                className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value=".">Period (.)</option>
                <option value=",">Comma (,)</option>
              </select>
            </SettingsRow>
            <SettingsRow label="Thousands Separator">
              <select
                value={preferences.numberFormat.thousandsSeparator}
                onChange={(e) => {
                  setPreferences((prev) => ({
                    ...prev,
                    numberFormat: {
                      ...prev.numberFormat,
                      thousandsSeparator: e.target.value as "," | "." | " ",
                    },
                  }));
                  setHasChanges(true);
                }}
                className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value=",">Comma (,)</option>
                <option value=".">Period (.)</option>
                <option value=" ">Space</option>
              </select>
            </SettingsRow>
            <SettingsRow label="Decimal Places">
              <select
                value={preferences.numberFormat.decimalPlaces}
                onChange={(e) => {
                  setPreferences((prev) => ({
                    ...prev,
                    numberFormat: {
                      ...prev.numberFormat,
                      decimalPlaces: parseInt(e.target.value),
                    },
                  }));
                  setHasChanges(true);
                }}
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* Default Values */}
        <SettingsCard
          title="Default Values"
          description="Preset values for new transactions"
          icon={Hash}
        >
          <SettingsGroup>
            <SettingsRow
              label="Default Invoice Terms"
              description="Days until payment is due"
            >
              <select
                value={preferences.defaultInvoiceTerms}
                onChange={(e) => {
                  updateField("defaultInvoiceTerms", parseInt(e.target.value));
                }}
                className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={15}>15 days</option>
                <option value={30}>30 days</option>
                <option value={45}>45 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </SettingsRow>
            <SettingsRow label="Payment Terms Text">
              <select
                value={preferences.defaultPaymentTerms}
                onChange={(e) => {
                  updateField("defaultPaymentTerms", e.target.value);
                }}
                className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </SettingsRow>
            <SettingsRow
              label="Auto-Save"
              description="Automatically save changes"
            >
              <Toggle
                checked={preferences.autoSave}
                onChange={(v) => {
                  updateField("autoSave", v);
                }}
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* Dashboard Widgets */}
        <SettingsCard
          title="Dashboard Widgets"
          description="Choose which widgets to show on your dashboard"
          icon={Settings}
        >
          <div className="grid grid-cols-2 gap-3">
            {widgetOptions.map((widget) => {
              const isActive = preferences.showDashboardWidgets.includes(
                widget.id
              );
              return (
                <button
                  key={widget.id}
                  onClick={() => {
                    toggleWidget(widget.id);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left",
                    isActive
                      ? "bg-teal-50 border-teal-300"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                      isActive
                        ? "bg-teal-600 border-teal-600"
                        : "border-slate-300"
                    )}
                  >
                    {isActive && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-teal-700" : "text-slate-600"
                    )}
                  >
                    {widget.label}
                  </span>
                </button>
              );
            })}
          </div>
        </SettingsCard>

        {/* Print Settings */}
        <SettingsCard
          title="Print Settings"
          description="Default settings for printing documents"
          icon={FileText}
        >
          <SettingsGroup>
            <SettingsRow label="Paper Size">
              <select
                value={preferences.printSettings.paperSize}
                onChange={(e) => {
                  setPreferences((prev) => ({
                    ...prev,
                    printSettings: {
                      ...prev.printSettings,
                      paperSize: e.target.value as "A4" | "Letter" | "Legal",
                    },
                  }));
                }}
                className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </SettingsRow>
            <SettingsRow
              label="Show Company Logo"
              description="Include logo on printed documents"
            >
              <Toggle
                checked={preferences.printSettings.showLogo}
                onChange={(v) => {
                  setPreferences((prev) => ({
                    ...prev,
                    printSettings: { ...prev.printSettings, showLogo: v },
                  }));
                }}
              />
            </SettingsRow>
            <SettingsRow
              label="Show Signature Line"
              description="Include signature area on documents"
            >
              <Toggle
                checked={preferences.printSettings.showSignature}
                onChange={(v) => {
                  setPreferences((prev) => ({
                    ...prev,
                    printSettings: { ...prev.printSettings, showSignature: v },
                  }));
                }}
              />
            </SettingsRow>
            <SettingsRow
              label="Show Terms & Conditions"
              description="Print terms on invoices"
            >
              <Toggle
                checked={preferences.printSettings.showTerms}
                onChange={(v) => {
                  setPreferences((prev) => ({
                    ...prev,
                    printSettings: { ...prev.printSettings, showTerms: v },
                  }));
                }}
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>
      </div>
    </SettingsLayout>
  );
}
