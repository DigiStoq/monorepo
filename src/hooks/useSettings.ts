import { useQuery } from "@powersync/react";
import { useCallback } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type { CompanySettings, InvoiceSettings, TaxRate } from "@/features/settings/types";

// Database row types (snake_case columns from SQLite)
interface CompanySettingsRow {
  id: string;
  name: string;
  legal_name: string | null;
  logo_url: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_website: string | null;
  tax_id: string | null;
  ein: string | null;
  financial_year_start_month: number;
  financial_year_start_day: number;
  currency: string;
  locale: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceSettingsRow {
  id: string;
  prefix: string;
  next_number: number;
  padding: number;
  terms_and_conditions: string | null;
  notes: string | null;
  show_payment_qr: number;
  show_bank_details: number;
  due_date_days: number;
  late_fees_enabled: number;
  late_fees_percentage: number;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  bank_routing_number: string | null;
  bank_branch_name: string | null;
  bank_swift_code: string | null;
  created_at: string;
  updated_at: string;
}

interface TaxRateRow {
  id: string;
  name: string;
  rate: number;
  type: string;
  description: string | null;
  is_default: number;
  is_active: number;
  created_at: string;
}

function mapRowToCompanySettings(row: CompanySettingsRow): CompanySettings {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    addressStreet: row.address_street ?? undefined,
    addressCity: row.address_city ?? undefined,
    addressState: row.address_state ?? undefined,
    addressPostalCode: row.address_postal_code ?? undefined,
    addressCountry: row.address_country ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    contactWebsite: row.contact_website ?? undefined,
    taxId: row.tax_id ?? undefined,
    ein: row.ein ?? undefined,
    financialYearStartMonth: row.financial_year_start_month,
    financialYearStartDay: row.financial_year_start_day,
    currency: row.currency,
    locale: row.locale,
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToInvoiceSettings(row: InvoiceSettingsRow): InvoiceSettings {
  return {
    id: row.id,
    prefix: row.prefix,
    nextNumber: row.next_number,
    padding: row.padding,
    termsAndConditions: row.terms_and_conditions ?? undefined,
    notes: row.notes ?? undefined,
    showPaymentQr: row.show_payment_qr === 1,
    showBankDetails: row.show_bank_details === 1,
    dueDateDays: row.due_date_days,
    lateFeesEnabled: row.late_fees_enabled === 1,
    lateFeesPercentage: row.late_fees_percentage,
    bankAccountName: row.bank_account_name ?? undefined,
    bankAccountNumber: row.bank_account_number ?? undefined,
    bankName: row.bank_name ?? undefined,
    bankRoutingNumber: row.bank_routing_number ?? undefined,
    bankBranchName: row.bank_branch_name ?? undefined,
    bankSwiftCode: row.bank_swift_code ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToTaxRate(row: TaxRateRow): TaxRate {
  return {
    id: row.id,
    name: row.name,
    rate: row.rate,
    type: row.type,
    description: row.description ?? undefined,
    isDefault: row.is_default === 1,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

// ============================================================================
// COMPANY SETTINGS
// ============================================================================

export function useCompanySettings(): {
  settings: CompanySettings | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<CompanySettingsRow>(
    `SELECT * FROM company_settings LIMIT 1`
  );

  const settings = data[0] ? mapRowToCompanySettings(data[0]) : null;

  return { settings, isLoading, error };
}

interface CompanySettingsMutations {
  updateCompanySettings: (data: Partial<CompanySettings>) => Promise<void>;
}

export function useCompanySettingsMutations(): CompanySettingsMutations {
  const db = getPowerSyncDatabase();

  const updateCompanySettings = useCallback(
    async (data: Partial<CompanySettings>): Promise<void> => {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (data.name !== undefined) {
        fields.push("name = ?");
        values.push(data.name);
      }
      if (data.legalName !== undefined) {
        fields.push("legal_name = ?");
        values.push(data.legalName ?? null);
      }
      if (data.logoUrl !== undefined) {
        fields.push("logo_url = ?");
        values.push(data.logoUrl ?? null);
      }
      if (data.addressStreet !== undefined) {
        fields.push("address_street = ?");
        values.push(data.addressStreet ?? null);
      }
      if (data.addressCity !== undefined) {
        fields.push("address_city = ?");
        values.push(data.addressCity ?? null);
      }
      if (data.addressState !== undefined) {
        fields.push("address_state = ?");
        values.push(data.addressState ?? null);
      }
      if (data.addressPostalCode !== undefined) {
        fields.push("address_postal_code = ?");
        values.push(data.addressPostalCode ?? null);
      }
      if (data.addressCountry !== undefined) {
        fields.push("address_country = ?");
        values.push(data.addressCountry ?? null);
      }
      if (data.contactPhone !== undefined) {
        fields.push("contact_phone = ?");
        values.push(data.contactPhone ?? null);
      }
      if (data.contactEmail !== undefined) {
        fields.push("contact_email = ?");
        values.push(data.contactEmail ?? null);
      }
      if (data.contactWebsite !== undefined) {
        fields.push("contact_website = ?");
        values.push(data.contactWebsite ?? null);
      }
      if (data.taxId !== undefined) {
        fields.push("tax_id = ?");
        values.push(data.taxId ?? null);
      }
      if (data.ein !== undefined) {
        fields.push("ein = ?");
        values.push(data.ein ?? null);
      }
      if (data.financialYearStartMonth !== undefined) {
        fields.push("financial_year_start_month = ?");
        values.push(data.financialYearStartMonth);
      }
      if (data.financialYearStartDay !== undefined) {
        fields.push("financial_year_start_day = ?");
        values.push(data.financialYearStartDay);
      }
      if (data.currency !== undefined) {
        fields.push("currency = ?");
        values.push(data.currency);
      }
      if (data.locale !== undefined) {
        fields.push("locale = ?");
        values.push(data.locale);
      }
      if (data.timezone !== undefined) {
        fields.push("timezone = ?");
        values.push(data.timezone);
      }

      fields.push("updated_at = ?");
      values.push(now);

      if (fields.length > 1) {
        await db.execute(`UPDATE company_settings SET ${fields.join(", ")}`, values);
      }
    },
    [db]
  );

  return { updateCompanySettings };
}

// ============================================================================
// INVOICE SETTINGS
// ============================================================================

export function useInvoiceSettings(): {
  settings: InvoiceSettings | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<InvoiceSettingsRow>(
    `SELECT * FROM invoice_settings LIMIT 1`
  );

  const settings = data[0] ? mapRowToInvoiceSettings(data[0]) : null;

  return { settings, isLoading, error };
}

interface InvoiceSettingsMutations {
  updateInvoiceSettings: (data: Partial<InvoiceSettings>) => Promise<void>;
}

export function useInvoiceSettingsMutations(): InvoiceSettingsMutations {
  const db = getPowerSyncDatabase();

  const updateInvoiceSettings = useCallback(
    async (data: Partial<InvoiceSettings>): Promise<void> => {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (data.prefix !== undefined) {
        fields.push("prefix = ?");
        values.push(data.prefix);
      }
      if (data.nextNumber !== undefined) {
        fields.push("next_number = ?");
        values.push(data.nextNumber);
      }
      if (data.padding !== undefined) {
        fields.push("padding = ?");
        values.push(data.padding);
      }
      if (data.termsAndConditions !== undefined) {
        fields.push("terms_and_conditions = ?");
        values.push(data.termsAndConditions ?? null);
      }
      if (data.notes !== undefined) {
        fields.push("notes = ?");
        values.push(data.notes ?? null);
      }
      if (data.showPaymentQr !== undefined) {
        fields.push("show_payment_qr = ?");
        values.push(data.showPaymentQr ? 1 : 0);
      }
      if (data.showBankDetails !== undefined) {
        fields.push("show_bank_details = ?");
        values.push(data.showBankDetails ? 1 : 0);
      }
      if (data.dueDateDays !== undefined) {
        fields.push("due_date_days = ?");
        values.push(data.dueDateDays);
      }
      if (data.lateFeesEnabled !== undefined) {
        fields.push("late_fees_enabled = ?");
        values.push(data.lateFeesEnabled ? 1 : 0);
      }
      if (data.lateFeesPercentage !== undefined) {
        fields.push("late_fees_percentage = ?");
        values.push(data.lateFeesPercentage);
      }
      if (data.bankAccountName !== undefined) {
        fields.push("bank_account_name = ?");
        values.push(data.bankAccountName ?? null);
      }
      if (data.bankAccountNumber !== undefined) {
        fields.push("bank_account_number = ?");
        values.push(data.bankAccountNumber ?? null);
      }
      if (data.bankName !== undefined) {
        fields.push("bank_name = ?");
        values.push(data.bankName ?? null);
      }
      if (data.bankRoutingNumber !== undefined) {
        fields.push("bank_routing_number = ?");
        values.push(data.bankRoutingNumber ?? null);
      }
      if (data.bankBranchName !== undefined) {
        fields.push("bank_branch_name = ?");
        values.push(data.bankBranchName ?? null);
      }
      if (data.bankSwiftCode !== undefined) {
        fields.push("bank_swift_code = ?");
        values.push(data.bankSwiftCode ?? null);
      }

      fields.push("updated_at = ?");
      values.push(now);

      if (fields.length > 1) {
        await db.execute(`UPDATE invoice_settings SET ${fields.join(", ")}`, values);
      }
    },
    [db]
  );

  return { updateInvoiceSettings };
}

// ============================================================================
// TAX RATES
// ============================================================================

export function useTaxRates(filters?: { isActive?: boolean }): {
  taxRates: TaxRate[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const activeFilter = filters?.isActive !== undefined ? (filters.isActive ? 1 : 0) : null;

  const { data, isLoading, error } = useQuery<TaxRateRow>(
    `SELECT * FROM tax_rates
     WHERE ($1 IS NULL OR is_active = $1)
     ORDER BY rate ASC`,
    [activeFilter]
  );

  const taxRates = data.map(mapRowToTaxRate);

  return { taxRates, isLoading, error };
}

interface TaxRateMutations {
  createTaxRate: (data: {
    name: string;
    rate: number;
    type?: "percentage" | "fixed";
    description?: string;
    isDefault?: boolean;
  }) => Promise<string>;
  updateTaxRate: (
    id: string,
    data: Partial<{
      name: string;
      rate: number;
      type: string;
      description: string;
      isDefault: boolean;
      isActive: boolean;
    }>
  ) => Promise<void>;
  deleteTaxRate: (id: string) => Promise<void>;
}

export function useTaxRateMutations(): TaxRateMutations {
  const db = getPowerSyncDatabase();

  const createTaxRate = useCallback(
    async (data: {
      name: string;
      rate: number;
      type?: "percentage" | "fixed";
      description?: string;
      isDefault?: boolean;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // If this is default, unset other defaults
      if (data.isDefault) {
        await db.execute(`UPDATE tax_rates SET is_default = 0`);
      }

      await db.execute(
        `INSERT INTO tax_rates (id, name, rate, type, description, is_default, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.rate,
          data.type ?? "percentage",
          data.description ?? null,
          data.isDefault ? 1 : 0,
          1,
          now,
        ]
      );

      return id;
    },
    [db]
  );

  const updateTaxRate = useCallback(
    async (
      id: string,
      data: Partial<{
        name: string;
        rate: number;
        type: string;
        description: string;
        isDefault: boolean;
        isActive: boolean;
      }>
    ): Promise<void> => {
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (data.isDefault) {
        await db.execute(`UPDATE tax_rates SET is_default = 0`);
      }

      if (data.name !== undefined) {
        fields.push("name = ?");
        values.push(data.name);
      }
      if (data.rate !== undefined) {
        fields.push("rate = ?");
        values.push(data.rate);
      }
      if (data.type !== undefined) {
        fields.push("type = ?");
        values.push(data.type);
      }
      if (data.description !== undefined) {
        fields.push("description = ?");
        values.push(data.description);
      }
      if (data.isDefault !== undefined) {
        fields.push("is_default = ?");
        values.push(data.isDefault ? 1 : 0);
      }
      if (data.isActive !== undefined) {
        fields.push("is_active = ?");
        values.push(data.isActive ? 1 : 0);
      }

      values.push(id);

      if (fields.length > 0) {
        await db.execute(`UPDATE tax_rates SET ${fields.join(", ")} WHERE id = ?`, values);
      }
    },
    [db]
  );

  const deleteTaxRate = useCallback(
    async (id: string): Promise<void> => {
      await db.execute(`DELETE FROM tax_rates WHERE id = ?`, [id]);
    },
    [db]
  );

  return {
    createTaxRate,
    updateTaxRate,
    deleteTaxRate,
  };
}
