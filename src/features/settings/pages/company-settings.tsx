import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { Building2, MapPin, Phone, Globe, FileText, Save, Upload } from "lucide-react";
import { SettingsLayout } from "../components/settings-layout";
import { SettingsCard, SettingsRow, SettingsGroup } from "../components/settings-card";
import type { CompanySettings } from "../types";

// Mock data - would come from store/API
const mockCompanySettings: CompanySettings = {
  id: "1",
  name: "Acme Corporation",
  legalName: "Acme Corporation Inc.",
  address: {
    street: "123 Business Park",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA",
  },
  contact: {
    phone: "+1 212 555 1234",
    email: "contact@acmecorp.com",
    website: "https://acmecorp.com",
  },
  registration: {
    taxId: "12-3456789",
    ein: "12-3456789",
  },
  financialYear: {
    startMonth: 1,
    startDay: 1,
  },
  currency: "USD",
  locale: "en-US",
  timezone: "America/New_York",
};

export function CompanySettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(mockCompanySettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const updateField = <K extends keyof CompanySettings>(
    field: K,
    value: CompanySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field: keyof CompanySettings["address"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const updateContact = (field: keyof CompanySettings["contact"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  };

  const updateRegistration = (
    field: keyof CompanySettings["registration"],
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      registration: { ...prev.registration, [field]: value },
    }));
  };

  return (
    <SettingsLayout
      title="Company Settings"
      description="Manage your business profile and registration details"
      actions={
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Business Profile */}
        <SettingsCard
          title="Business Profile"
          description="Basic information about your business"
          icon={Building2}
        >
          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center">
                {settings.logo ? (
                  <img
                    src={settings.logo}
                    alt="Company logo"
                    className="h-full w-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </Button>
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG up to 2MB. Recommended: 200x200px
                </p>
              </div>
            </div>

            <SettingsGroup>
              <SettingsRow label="Business Name" description="Display name for your business">
                <Input
                  type="text"
                  value={settings.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-64"
                />
              </SettingsRow>
              <SettingsRow label="Legal Name" description="Registered legal name">
                <Input
                  type="text"
                  value={settings.legalName ?? ""}
                  onChange={(e) => updateField("legalName", e.target.value)}
                  className="w-64"
                />
              </SettingsRow>
            </SettingsGroup>
          </div>
        </SettingsCard>

        {/* Address */}
        <SettingsCard
          title="Business Address"
          description="Your registered business address"
          icon={MapPin}
        >
          <SettingsGroup>
            <SettingsRow label="Street Address">
              <Input
                type="text"
                value={settings.address.street}
                onChange={(e) => updateAddress("street", e.target.value)}
                className="w-64"
              />
            </SettingsRow>
            <SettingsRow label="City">
              <Input
                type="text"
                value={settings.address.city}
                onChange={(e) => updateAddress("city", e.target.value)}
                className="w-64"
              />
            </SettingsRow>
            <SettingsRow label="State">
              <Input
                type="text"
                value={settings.address.state}
                onChange={(e) => updateAddress("state", e.target.value)}
                className="w-64"
              />
            </SettingsRow>
            <SettingsRow label="Postal Code">
              <Input
                type="text"
                value={settings.address.postalCode}
                onChange={(e) => updateAddress("postalCode", e.target.value)}
                className="w-40"
              />
            </SettingsRow>
            <SettingsRow label="Country">
              <Input
                type="text"
                value={settings.address.country}
                onChange={(e) => updateAddress("country", e.target.value)}
                className="w-64"
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* Contact Information */}
        <SettingsCard
          title="Contact Information"
          description="Business contact details"
          icon={Phone}
        >
          <SettingsGroup>
            <SettingsRow label="Phone Number">
              <Input
                type="tel"
                value={settings.contact.phone}
                onChange={(e) => updateContact("phone", e.target.value)}
                className="w-64"
              />
            </SettingsRow>
            <SettingsRow label="Email Address">
              <Input
                type="email"
                value={settings.contact.email}
                onChange={(e) => updateContact("email", e.target.value)}
                className="w-64"
              />
            </SettingsRow>
            <SettingsRow label="Website">
              <Input
                type="url"
                value={settings.contact.website ?? ""}
                onChange={(e) => updateContact("website", e.target.value)}
                className="w-64"
                leftIcon={<Globe className="h-4 w-4" />}
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* Registration Details */}
        <SettingsCard
          title="Registration Details"
          description="Business registration numbers"
          icon={FileText}
        >
          <SettingsGroup>
            <SettingsRow label="Tax ID" description="Federal Tax Identification Number">
              <Input
                type="text"
                value={settings.registration.taxId ?? ""}
                onChange={(e) => updateRegistration("taxId", e.target.value)}
                className="w-64 font-mono"
                placeholder="12-3456789"
              />
            </SettingsRow>
            <SettingsRow label="EIN" description="Employer Identification Number">
              <Input
                type="text"
                value={settings.registration.ein ?? ""}
                onChange={(e) => updateRegistration("ein", e.target.value)}
                className="w-48 font-mono"
                placeholder="12-3456789"
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* Regional Settings */}
        <SettingsCard
          title="Regional Settings"
          description="Currency and localization preferences"
          icon={Globe}
        >
          <SettingsGroup>
            <SettingsRow label="Currency" description="Default currency for transactions">
              <select
                value={settings.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                className="w-40 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </SettingsRow>
            <SettingsRow label="Financial Year Start" description="When your financial year begins">
              <div className="flex gap-2">
                <select
                  value={settings.financialYear.startMonth}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      financialYear: {
                        ...prev.financialYear,
                        startMonth: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
                <select
                  value={settings.financialYear.startDay}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      financialYear: {
                        ...prev.financialYear,
                        startDay: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {Array.from({ length: 28 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </SettingsRow>
            <SettingsRow label="Timezone">
              <select
                value={settings.timezone}
                onChange={(e) => updateField("timezone", e.target.value)}
                className="w-64 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              </select>
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>
      </div>
    </SettingsLayout>
  );
}
