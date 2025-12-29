import { useState, useEffect, useRef } from "react";
import { Button, Input } from "@/components/ui";
import { Receipt, Percent, FileText, CreditCard, Plus, Trash2, Save, Edit2, Palette, Check } from "lucide-react";
import { SettingsLayout } from "../components/settings-layout";
import { SettingsCard, SettingsRow, SettingsGroup } from "../components/settings-card";
import { cn } from "@/lib/cn";
import type { TaxSettings, TaxRate, InvoiceSettings, BankDetails, PDFTemplateId } from "../types";
import { PDF_TEMPLATES } from "@/lib/pdf";
import { useInvoiceSettings, useInvoiceSettingsMutations, useTaxRates, useTaxRateMutations } from "@/hooks/useSettings";

// Flat type matching what the database returns
interface FlatInvoiceSettings {
  id?: string;
  prefix: string;
  nextNumber: number;
  padding: number;
  termsAndConditions?: string;
  notes?: string;
  showPaymentQr?: boolean;
  showBankDetails: boolean;
  dueDateDays: number;
  lateFeesEnabled: boolean;
  lateFeesPercentage?: number;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankRoutingNumber?: string;
  bankBranchName?: string;
  bankSwiftCode?: string;
  pdfTemplate?: PDFTemplateId;
}

// Convert flat DB structure to nested UI structure
function flatToNested(flat: FlatInvoiceSettings): InvoiceSettings {
  // Build bankDetails with conditional optional fields
  const bankDetails: BankDetails = {
    accountName: flat.bankAccountName ?? "",
    accountNumber: flat.bankAccountNumber ?? "",
    bankName: flat.bankName ?? "",
    routingNumber: flat.bankRoutingNumber ?? "",
  };
  if (flat.bankBranchName) bankDetails.branchName = flat.bankBranchName;
  if (flat.bankSwiftCode) bankDetails.swiftCode = flat.bankSwiftCode;

  const result: InvoiceSettings = {
    prefix: flat.prefix,
    nextNumber: flat.nextNumber,
    padding: flat.padding,
    showBankDetails: flat.showBankDetails,
    bankDetails,
    dueDateDays: flat.dueDateDays,
    lateFeesEnabled: flat.lateFeesEnabled,
    pdfTemplate: flat.pdfTemplate ?? "classic",
  };

  if (flat.id) result.id = flat.id;
  if (flat.termsAndConditions) result.termsAndConditions = flat.termsAndConditions;
  if (flat.notes) result.notes = flat.notes;
  if (flat.showPaymentQr !== undefined) result.showPaymentQR = flat.showPaymentQr;
  if (flat.lateFeesPercentage !== undefined) result.lateFeesPercentage = flat.lateFeesPercentage;

  return result;
}

// Convert nested UI structure to flat DB structure for updates
function nestedToFlatUpdate(nested: InvoiceSettings): Record<string, string | number | boolean | undefined> {
  return {
    prefix: nested.prefix,
    nextNumber: nested.nextNumber,
    padding: nested.padding,
    termsAndConditions: nested.termsAndConditions || undefined,
    notes: nested.notes || undefined,
    showPaymentQr: nested.showPaymentQR,
    showBankDetails: nested.showBankDetails,
    dueDateDays: nested.dueDateDays,
    lateFeesEnabled: nested.lateFeesEnabled,
    lateFeesPercentage: nested.lateFeesPercentage,
    bankAccountName: nested.bankDetails?.accountName || undefined,
    bankAccountNumber: nested.bankDetails?.accountNumber || undefined,
    bankName: nested.bankDetails?.bankName || undefined,
    bankRoutingNumber: nested.bankDetails?.routingNumber || undefined,
    bankBranchName: nested.bankDetails?.branchName || undefined,
    bankSwiftCode: nested.bankDetails?.swiftCode || undefined,
    pdfTemplate: nested.pdfTemplate,
  };
}

// Default invoice settings for when no data exists
const defaultInvoiceSettings: InvoiceSettings = {
  prefix: "INV",
  nextNumber: 1001,
  padding: 4,
  termsAndConditions: "1. Payment is due within 30 days.\n2. All sales are final.\n3. Subject to state jurisdiction.",
  notes: "Thank you for your business!",
  showPaymentQR: false,
  showBankDetails: true,
  bankDetails: {
    accountName: "",
    accountNumber: "",
    bankName: "",
    routingNumber: "",
    branchName: "",
    swiftCode: "",
  },
  dueDateDays: 30,
  lateFeesEnabled: false,
  lateFeesPercentage: 2,
  pdfTemplate: "classic",
};

const defaultTaxSettings: TaxSettings = {
  taxEnabled: true,
  defaultTaxRate: 8,
  taxRates: [],
  taxInclusive: false,
  roundTax: true,
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

export function TaxInvoiceSettingsPage() {
  // Fetch settings from PowerSync database
  const { settings: dbInvoiceSettings, isLoading: isLoadingInvoice } = useInvoiceSettings();
  const { updateInvoiceSettings } = useInvoiceSettingsMutations();
  const { taxRates: dbTaxRates, isLoading: isLoadingTax } = useTaxRates();
  const { createTaxRate, updateTaxRate: updateTaxRateDb, deleteTaxRate: deleteTaxRateDb } = useTaxRateMutations();

  // Local state for editing
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(defaultTaxSettings);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(defaultInvoiceSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const hasInitializedInvoice = useRef(false);
  const hasInitializedTax = useRef(false);

  // Sync database settings to local state only on initial load
  useEffect(() => {
    if (dbInvoiceSettings && !hasInitializedInvoice.current) {
      const flat = dbInvoiceSettings as unknown as FlatInvoiceSettings;
      setInvoiceSettings(flatToNested(flat));
      hasInitializedInvoice.current = true;
    }
  }, [dbInvoiceSettings]);

  // Sync tax rates from database only on initial load
  useEffect(() => {
    if (dbTaxRates && dbTaxRates.length > 0 && !hasInitializedTax.current) {
      setTaxSettings((prev) => ({
        ...prev,
        taxRates: dbTaxRates.map((r) => ({
          ...r,
          type: r.type as "percentage" | "fixed",
        })),
      }));
      hasInitializedTax.current = true;
    }
  }, [dbTaxRates]);

  // Helper to update template selection
  const handleTemplateChange = (templateId: PDFTemplateId) => {
    setInvoiceSettings((prev) => ({ ...prev, pdfTemplate: templateId }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save invoice settings to database
      const flatData = nestedToFlatUpdate(invoiceSettings);
      await updateInvoiceSettings(flatData);
    } catch (error) {
      console.error("Failed to save invoice settings:", error);
    }
    setIsSaving(false);
  };

  const isLoading = isLoadingInvoice || isLoadingTax;

  if (isLoading) {
    return (
      <SettingsLayout
        title="Tax & Invoice Settings"
        description="Configure tax rates and invoice preferences"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading...</div>
        </div>
      </SettingsLayout>
    );
  }

  const formatInvoiceNumber = () => {
    const paddedNumber = String(invoiceSettings.nextNumber).padStart(
      invoiceSettings.padding,
      "0"
    );
    return `${invoiceSettings.prefix}-${paddedNumber}`;
  };

  const updateTaxRate = (id: string, updates: Partial<TaxRate>) => {
    // Update local state for immediate UI feedback
    setTaxSettings((prev) => ({
      ...prev,
      taxRates: prev.taxRates.map((rate) =>
        rate.id === id ? { ...rate, ...updates } : rate
      ),
    }));
    // Persist to database
    void updateTaxRateDb(id, updates);
  };

  const setDefaultRate = (id: string) => {
    // Update local state for immediate UI feedback
    setTaxSettings((prev) => ({
      ...prev,
      taxRates: prev.taxRates.map((rate) => ({
        ...rate,
        isDefault: rate.id === id,
      })),
    }));
    // Persist to database
    void updateTaxRateDb(id, { isDefault: true });
  };

  const deleteRate = (id: string) => {
    // Update local state for immediate UI feedback
    setTaxSettings((prev) => ({
      ...prev,
      taxRates: prev.taxRates.filter((rate) => rate.id !== id),
    }));
    // Delete from database
    void deleteTaxRateDb(id);
  };

  const addNewRate = async () => {
    try {
      const newId = await createTaxRate({
        name: "New Tax",
        rate: 0,
        type: "percentage",
        isDefault: false,
      });
      const newRate: TaxRate = {
        id: newId,
        name: "New Tax",
        rate: 0,
        type: "percentage",
        isDefault: false,
        isActive: true,
      };
      setTaxSettings((prev) => ({
        ...prev,
        taxRates: [...prev.taxRates, newRate],
      }));
      setEditingRate(newId);
    } catch (error) {
      console.error("Failed to create tax rate:", error);
    }
  };

  const updateBankDetails = (field: keyof BankDetails, value: string) => {
    setInvoiceSettings((prev) => {
      if (!prev.bankDetails) return prev;
      return {
        ...prev,
        bankDetails: { ...prev.bankDetails, [field]: value },
      };
    });
  };

  return (
    <SettingsLayout
      title="Tax & Invoice Settings"
      description="Configure tax rates and invoice preferences"
      actions={
        <Button onClick={() => { void handleSave(); }} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Tax Settings */}
        <SettingsCard
          title="Tax Configuration"
          description="Enable and configure tax calculations"
          icon={Percent}
        >
          <SettingsGroup>
            <SettingsRow label="Enable Tax" description="Apply tax to transactions">
              <Toggle
                checked={taxSettings.taxEnabled}
                onChange={(v) =>
                  { setTaxSettings((prev) => ({ ...prev, taxEnabled: v })); }
                }
              />
            </SettingsRow>
            <SettingsRow
              label="Tax Inclusive Pricing"
              description="Prices already include tax"
            >
              <Toggle
                checked={taxSettings.taxInclusive}
                onChange={(v) =>
                  { setTaxSettings((prev) => ({ ...prev, taxInclusive: v })); }
                }
              />
            </SettingsRow>
            <SettingsRow label="Round Tax" description="Round tax amounts to nearest whole number">
              <Toggle
                checked={taxSettings.roundTax}
                onChange={(v) =>
                  { setTaxSettings((prev) => ({ ...prev, roundTax: v })); }
                }
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* Tax Rates */}
        <SettingsCard
          title="Tax Rates"
          description="Manage available tax rates"
          icon={Receipt}
          actions={
            <Button variant="secondary" size="sm" className="gap-2" onClick={() => { void addNewRate(); }}>
              <Plus className="h-4 w-4" />
              Add Rate
            </Button>
          }
        >
          <div className="space-y-2">
            {taxSettings.taxRates.map((rate) => (
              <div
                key={rate.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                  rate.isDefault
                    ? "bg-teal-50 border-teal-200"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                {editingRate === rate.id ? (
                  <>
                    <Input
                      type="text"
                      value={rate.name}
                      onChange={(e) => { updateTaxRate(rate.id, { name: e.target.value }); }}
                      className="w-32"
                      placeholder="Name"
                    />
                    <Input
                      type="number"
                      value={rate.rate}
                      onChange={(e) =>
                        { updateTaxRate(rate.id, { rate: parseFloat(e.target.value) || 0 }); }
                      }
                      className="w-20"
                      placeholder="Rate"
                    />
                    <span className="text-sm text-slate-500">%</span>
                    <Input
                      type="text"
                      value={rate.description ?? ""}
                      onChange={(e) =>
                        { updateTaxRate(rate.id, { description: e.target.value }); }
                      }
                      className="flex-1"
                      placeholder="Description"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingRate(null); }}
                    >
                      Done
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{rate.name}</span>
                        {rate.isDefault && (
                          <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      {rate.description && (
                        <p className="text-xs text-slate-500">{rate.description}</p>
                      )}
                    </div>
                    <span className="text-lg font-semibold text-slate-900 tabular-nums">
                      {rate.rate}%
                    </span>
                    <div className="flex items-center gap-1">
                      {!rate.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setDefaultRate(rate.id); }}
                          className="text-xs"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingRate(rate.id); }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { deleteRate(rate.id); }}
                        className="text-error hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </SettingsCard>

        {/* Invoice Numbering */}
        <SettingsCard
          title="Invoice Numbering"
          description="Configure invoice number format"
          icon={FileText}
        >
          <SettingsGroup>
            <SettingsRow label="Prefix" description="Text before the number">
              <Input
                type="text"
                value={invoiceSettings.prefix}
                onChange={(e) =>
                  { setInvoiceSettings((prev) => ({ ...prev, prefix: e.target.value })); }
                }
                className="w-24 font-mono"
              />
            </SettingsRow>
            <SettingsRow label="Next Number" description="Next invoice number">
              <Input
                type="number"
                value={invoiceSettings.nextNumber}
                onChange={(e) =>
                  { setInvoiceSettings((prev) => ({
                    ...prev,
                    nextNumber: parseInt(e.target.value) || 1,
                  })); }
                }
                className="w-28 font-mono"
              />
            </SettingsRow>
            <SettingsRow label="Number Padding" description="Leading zeros">
              <select
                value={invoiceSettings.padding}
                onChange={(e) =>
                  { setInvoiceSettings((prev) => ({
                    ...prev,
                    padding: parseInt(e.target.value),
                  })); }
                }
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={3}>3 digits</option>
                <option value={4}>4 digits</option>
                <option value={5}>5 digits</option>
                <option value={6}>6 digits</option>
              </select>
            </SettingsRow>
            <SettingsRow label="Preview">
              <span className="font-mono text-lg font-semibold text-teal-600">
                {formatInvoiceNumber()}
              </span>
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* PDF Template */}
        <SettingsCard
          title="PDF Template"
          description="Choose the visual style for your invoices and documents"
          icon={Palette}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PDF_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => { handleTemplateChange(template.id); }}
                className={cn(
                  "relative p-4 rounded-lg border-2 text-left transition-all",
                  invoiceSettings.pdfTemplate === template.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                {invoiceSettings.pdfTemplate === template.id && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-teal-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}

                {/* Template Preview Placeholder */}
                <div className={cn(
                  "h-24 mb-3 rounded border flex items-center justify-center",
                  template.id === "classic" && "bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200",
                  template.id === "modern" && "bg-gradient-to-br from-blue-100 to-slate-50 border-blue-200",
                  template.id === "minimal" && "bg-gradient-to-br from-slate-50 to-white border-slate-200"
                )}>
                  <div className="text-center">
                    <div className={cn(
                      "text-xs font-bold mb-1",
                      template.id === "classic" && "text-purple-600",
                      template.id === "modern" && "text-blue-600",
                      template.id === "minimal" && "text-slate-600"
                    )}>
                      INVOICE
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className={cn(
                        "h-1 w-16 rounded",
                        template.id === "classic" && "bg-purple-300",
                        template.id === "modern" && "bg-blue-300",
                        template.id === "minimal" && "bg-slate-300"
                      )} />
                      <div className={cn(
                        "h-1 w-12 rounded mx-auto",
                        template.id === "classic" && "bg-purple-200",
                        template.id === "modern" && "bg-blue-200",
                        template.id === "minimal" && "bg-slate-200"
                      )} />
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-slate-900">{template.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{template.description}</p>
              </button>
            ))}
          </div>
        </SettingsCard>

        {/* Payment Terms */}
        <SettingsCard
          title="Payment Terms"
          description="Default payment settings"
          icon={CreditCard}
        >
          <SettingsGroup>
            <SettingsRow label="Due Date" description="Days after invoice date">
              <select
                value={invoiceSettings.dueDateDays}
                onChange={(e) =>
                  { setInvoiceSettings((prev) => ({
                    ...prev,
                    dueDateDays: parseInt(e.target.value),
                  })); }
                }
                className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={0}>Due on Receipt</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={15}>15 days</option>
                <option value={30}>30 days</option>
                <option value={45}>45 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </SettingsRow>
            <SettingsRow label="Late Fees" description="Charge for overdue payments">
              <div className="flex items-center gap-3">
                <Toggle
                  checked={invoiceSettings.lateFeesEnabled}
                  onChange={(v) =>
                    { setInvoiceSettings((prev) => ({ ...prev, lateFeesEnabled: v })); }
                  }
                />
                {invoiceSettings.lateFeesEnabled && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={invoiceSettings.lateFeesPercentage ?? 0}
                      onChange={(e) =>
                        { setInvoiceSettings((prev) => ({
                          ...prev,
                          lateFeesPercentage: parseFloat(e.target.value) || 0,
                        })); }
                      }
                      className="w-16"
                    />
                    <span className="text-sm text-slate-500">% per month</span>
                  </div>
                )}
              </div>
            </SettingsRow>
          </SettingsGroup>

          <div className="my-4 border-t border-slate-100" />

          <SettingsGroup title="Bank Details for Payments">
            <SettingsRow label="Show Bank Details" description="Display on invoices">
              <Toggle
                checked={invoiceSettings.showBankDetails}
                onChange={(v) =>
                  { setInvoiceSettings((prev) => ({ ...prev, showBankDetails: v })); }
                }
              />
            </SettingsRow>
            {invoiceSettings.showBankDetails && invoiceSettings.bankDetails && (
              <>
                <SettingsRow label="Account Name">
                  <Input
                    type="text"
                    value={invoiceSettings.bankDetails.accountName}
                    onChange={(e) => { updateBankDetails("accountName", e.target.value); }}
                    className="w-64"
                  />
                </SettingsRow>
                <SettingsRow label="Account Number">
                  <Input
                    type="text"
                    value={invoiceSettings.bankDetails.accountNumber}
                    onChange={(e) => { updateBankDetails("accountNumber", e.target.value); }}
                    className="w-48 font-mono"
                  />
                </SettingsRow>
                <SettingsRow label="Bank Name">
                  <Input
                    type="text"
                    value={invoiceSettings.bankDetails.bankName}
                    onChange={(e) => { updateBankDetails("bankName", e.target.value); }}
                    className="w-48"
                  />
                </SettingsRow>
                <SettingsRow label="Routing Number">
                  <Input
                    type="text"
                    value={invoiceSettings.bankDetails.routingNumber}
                    onChange={(e) => { updateBankDetails("routingNumber", e.target.value); }}
                    className="w-32 font-mono"
                  />
                </SettingsRow>
                <SettingsRow label="SWIFT Code">
                  <Input
                    type="text"
                    value={invoiceSettings.bankDetails.swiftCode ?? ""}
                    onChange={(e) => { updateBankDetails("swiftCode", e.target.value); }}
                    className="w-48 font-mono"
                    placeholder="CHASUS33"
                  />
                </SettingsRow>
              </>
            )}
            <SettingsRow label="Show Payment QR" description="Generate payment QR code">
              <Toggle
                checked={invoiceSettings.showPaymentQR ?? false}
                onChange={(v) =>
                  { setInvoiceSettings((prev) => ({ ...prev, showPaymentQR: v })); }
                }
              />
            </SettingsRow>
          </SettingsGroup>
        </SettingsCard>

        {/* Terms and Notes */}
        <SettingsCard
          title="Default Text"
          description="Terms and notes for invoices"
          icon={FileText}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={invoiceSettings.termsAndConditions}
                onChange={(e) =>
                  { setInvoiceSettings((prev) => ({
                    ...prev,
                    termsAndConditions: e.target.value,
                  })); }
                }
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                placeholder="Enter your terms and conditions..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Notes
              </label>
              <textarea
                value={invoiceSettings.notes}
                onChange={(e) =>
                  { setInvoiceSettings((prev) => ({ ...prev, notes: e.target.value })); }
                }
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                placeholder="Thank you message or additional notes..."
              />
            </div>
          </div>
        </SettingsCard>
      </div>
    </SettingsLayout>
  );
}
