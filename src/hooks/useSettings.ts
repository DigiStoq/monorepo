import { useQuery } from "@powersync/react";
import { useCallback, useMemo } from "react";
import { getPowerSyncDatabase } from "@/lib/powersync";
import type {
  FlatCompanySettings,
  InvoiceSettings,
  TaxRate,
} from "@/features/settings/types";

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
  pdf_template: string | null;
  tax_enabled: number;
  tax_inclusive: number;
  round_tax: number;
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

function mapRowToCompanySettings(row: CompanySettingsRow): FlatCompanySettings {
  const result: FlatCompanySettings = {
    id: row.id,
    name: row.name,
    financialYearStartMonth: row.financial_year_start_month,
    financialYearStartDay: row.financial_year_start_day,
    currency: row.currency,
    locale: row.locale,
    timezone: row.timezone,
  };
  if (row.legal_name) result.legalName = row.legal_name;
  if (row.logo_url) result.logoUrl = row.logo_url;
  if (row.address_street) result.addressStreet = row.address_street;
  if (row.address_city) result.addressCity = row.address_city;
  if (row.address_state) result.addressState = row.address_state;
  if (row.address_postal_code)
    result.addressPostalCode = row.address_postal_code;
  if (row.address_country) result.addressCountry = row.address_country;
  if (row.contact_phone) result.contactPhone = row.contact_phone;
  if (row.contact_email) result.contactEmail = row.contact_email;
  if (row.contact_website) result.contactWebsite = row.contact_website;
  if (row.tax_id) result.taxId = row.tax_id;
  if (row.ein) result.ein = row.ein;
  if (row.created_at) result.createdAt = row.created_at;
  if (row.updated_at) result.updatedAt = row.updated_at;
  return result;
}

function mapRowToInvoiceSettings(row: InvoiceSettingsRow): InvoiceSettings {
  const result: InvoiceSettings = {
    id: row.id,
    prefix: row.prefix,
    nextNumber: row.next_number,
    padding: row.padding,
    showBankDetails: row.show_bank_details === 1,
    dueDateDays: row.due_date_days,
    lateFeesEnabled: row.late_fees_enabled === 1,
    pdfTemplate:
      (row.pdf_template as "classic" | "modern" | "minimal" | null) ??
      "classic",
    // default tax settings to true if null (migration defaults handled by SQL usually, but good for safety)
    taxEnabled: row.tax_enabled !== 0,
    taxInclusive: row.tax_inclusive === 1,
    roundTax: row.round_tax !== 0,
  };
  if (row.terms_and_conditions)
    result.termsAndConditions = row.terms_and_conditions;
  if (row.notes) result.notes = row.notes;
  if (row.show_payment_qr === 1) result.showPaymentQr = true;
  result.lateFeesPercentage = row.late_fees_percentage;
  if (row.bank_account_name) result.bankAccountName = row.bank_account_name;
  if (row.bank_account_number)
    result.bankAccountNumber = row.bank_account_number;
  if (row.bank_name) result.bankName = row.bank_name;
  if (row.bank_routing_number)
    result.bankRoutingNumber = row.bank_routing_number;
  if (row.bank_branch_name) result.bankBranchName = row.bank_branch_name;
  if (row.bank_swift_code) result.bankSwiftCode = row.bank_swift_code;
  if (row.created_at) result.createdAt = row.created_at;
  if (row.updated_at) result.updatedAt = row.updated_at;
  return result;
}

function mapRowToTaxRate(row: TaxRateRow): TaxRate {
  const result: TaxRate = {
    id: row.id,
    name: row.name,
    rate: row.rate,
    type: row.type as "percentage" | "fixed",
    isDefault: row.is_default === 1,
    isActive: row.is_active === 1,
  };
  if (row.description) result.description = row.description;
  return result;
}

// ============================================================================
// COMPANY SETTINGS
// ============================================================================

export function useCompanySettings(): {
  settings: FlatCompanySettings | null;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<CompanySettingsRow>(
    `SELECT * FROM company_settings LIMIT 1`
  );

  // Memoize based on the row id and updated_at to prevent unnecessary re-renders
  const settings = useMemo(() => {
    return data[0] ? mapRowToCompanySettings(data[0]) : null;
  }, [data]);

  return { settings, isLoading, error };
}

interface CompanySettingsMutations {
  updateCompanySettings: (data: Partial<FlatCompanySettings>) => Promise<void>;
}

export function useCompanySettingsMutations(): CompanySettingsMutations {
  const db = getPowerSyncDatabase();

  const updateCompanySettings = useCallback(
    async (data: Partial<FlatCompanySettings>): Promise<void> => {
      const now = new Date().toISOString();

      // Check if settings exist
      const existing = await db.getAll<CompanySettingsRow>(
        `SELECT id FROM company_settings LIMIT 1`
      );

      if (existing.length === 0) {
        // Insert new settings
        const id = crypto.randomUUID();
        const fields: string[] = ["id", "created_at", "updated_at"];
        const placeholders: string[] = ["?", "?", "?"];
        const values: (string | number | null)[] = [id, now, now];

        if (data.name !== undefined) {
          fields.push("name");
          placeholders.push("?");
          values.push(data.name);
        }
        if (data.legalName !== undefined) {
          fields.push("legal_name");
          placeholders.push("?");
          values.push(data.legalName ?? null);
        }
        if (data.logoUrl !== undefined) {
          fields.push("logo_url");
          placeholders.push("?");
          values.push(data.logoUrl ?? null);
        }
        if (data.addressStreet !== undefined) {
          fields.push("address_street");
          placeholders.push("?");
          values.push(data.addressStreet ?? null);
        }
        if (data.addressCity !== undefined) {
          fields.push("address_city");
          placeholders.push("?");
          values.push(data.addressCity ?? null);
        }
        if (data.addressState !== undefined) {
          fields.push("address_state");
          placeholders.push("?");
          values.push(data.addressState ?? null);
        }
        if (data.addressPostalCode !== undefined) {
          fields.push("address_postal_code");
          placeholders.push("?");
          values.push(data.addressPostalCode ?? null);
        }
        if (data.addressCountry !== undefined) {
          fields.push("address_country");
          placeholders.push("?");
          values.push(data.addressCountry ?? null);
        }
        if (data.contactPhone !== undefined) {
          fields.push("contact_phone");
          placeholders.push("?");
          values.push(data.contactPhone ?? null);
        }
        if (data.contactEmail !== undefined) {
          fields.push("contact_email");
          placeholders.push("?");
          values.push(data.contactEmail ?? null);
        }
        if (data.contactWebsite !== undefined) {
          fields.push("contact_website");
          placeholders.push("?");
          values.push(data.contactWebsite ?? null);
        }
        if (data.taxId !== undefined) {
          fields.push("tax_id");
          placeholders.push("?");
          values.push(data.taxId ?? null);
        }
        if (data.ein !== undefined) {
          fields.push("ein");
          placeholders.push("?");
          values.push(data.ein ?? null);
        }
        if (data.financialYearStartMonth !== undefined) {
          fields.push("financial_year_start_month");
          placeholders.push("?");
          values.push(data.financialYearStartMonth);
        }
        if (data.financialYearStartDay !== undefined) {
          fields.push("financial_year_start_day");
          placeholders.push("?");
          values.push(data.financialYearStartDay);
        }
        if (data.currency !== undefined) {
          fields.push("currency");
          placeholders.push("?");
          values.push(data.currency);
        }
        if (data.locale !== undefined) {
          fields.push("locale");
          placeholders.push("?");
          values.push(data.locale);
        }
        if (data.timezone !== undefined) {
          fields.push("timezone");
          placeholders.push("?");
          values.push(data.timezone);
        }

        await db.execute(
          `INSERT INTO company_settings (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`,
          values
        );
      } else {
        // Update existing settings
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
          await db.execute(
            `UPDATE company_settings SET ${fields.join(", ")}`,
            values
          );
        }
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

  // Memoize based on the row id and updated_at to prevent unnecessary re-renders
  const settings = useMemo(() => {
    return data[0] ? mapRowToInvoiceSettings(data[0]) : null;
  }, [data]);

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

      // Check if settings exist
      const existing = await db.getAll<InvoiceSettingsRow>(
        `SELECT id FROM invoice_settings LIMIT 1`
      );

      if (existing.length === 0) {
        // Insert new settings
        const id = crypto.randomUUID();
        const insertFields: string[] = ["id", "created_at", "updated_at"];
        const placeholders: string[] = ["?", "?", "?"];
        const insertValues: (string | number | null)[] = [id, now, now];

        if (data.prefix !== undefined) {
          insertFields.push("prefix");
          placeholders.push("?");
          insertValues.push(data.prefix);
        }
        if (data.nextNumber !== undefined) {
          insertFields.push("next_number");
          placeholders.push("?");
          insertValues.push(data.nextNumber);
        }
        if (data.padding !== undefined) {
          insertFields.push("padding");
          placeholders.push("?");
          insertValues.push(data.padding);
        }
        if (data.termsAndConditions !== undefined) {
          insertFields.push("terms_and_conditions");
          placeholders.push("?");
          insertValues.push(data.termsAndConditions ?? null);
        }
        if (data.notes !== undefined) {
          insertFields.push("notes");
          placeholders.push("?");
          insertValues.push(data.notes ?? null);
        }
        if (data.showPaymentQr !== undefined) {
          insertFields.push("show_payment_qr");
          placeholders.push("?");
          insertValues.push(data.showPaymentQr ? 1 : 0);
        }
        if (data.showBankDetails !== undefined) {
          insertFields.push("show_bank_details");
          placeholders.push("?");
          insertValues.push(data.showBankDetails ? 1 : 0);
        }
        if (data.dueDateDays !== undefined) {
          insertFields.push("due_date_days");
          placeholders.push("?");
          insertValues.push(data.dueDateDays);
        }
        if (data.lateFeesEnabled !== undefined) {
          insertFields.push("late_fees_enabled");
          placeholders.push("?");
          insertValues.push(data.lateFeesEnabled ? 1 : 0);
        }
        if (data.lateFeesPercentage !== undefined) {
          insertFields.push("late_fees_percentage");
          placeholders.push("?");
          insertValues.push(data.lateFeesPercentage);
        }
        if (data.bankAccountName !== undefined) {
          insertFields.push("bank_account_name");
          placeholders.push("?");
          insertValues.push(data.bankAccountName ?? null);
        }
        if (data.bankAccountNumber !== undefined) {
          insertFields.push("bank_account_number");
          placeholders.push("?");
          insertValues.push(data.bankAccountNumber ?? null);
        }
        if (data.bankName !== undefined) {
          insertFields.push("bank_name");
          placeholders.push("?");
          insertValues.push(data.bankName ?? null);
        }
        if (data.bankRoutingNumber !== undefined) {
          insertFields.push("bank_routing_number");
          placeholders.push("?");
          insertValues.push(data.bankRoutingNumber ?? null);
        }
        if (data.bankBranchName !== undefined) {
          insertFields.push("bank_branch_name");
          placeholders.push("?");
          insertValues.push(data.bankBranchName ?? null);
        }
        if (data.bankSwiftCode !== undefined) {
          insertFields.push("bank_swift_code");
          placeholders.push("?");
          insertValues.push(data.bankSwiftCode ?? null);
        }
        if (data.pdfTemplate !== undefined) {
          insertFields.push("pdf_template");
          placeholders.push("?");
          insertValues.push(data.pdfTemplate);
        }
        if (data.taxEnabled !== undefined) {
          insertFields.push("tax_enabled");
          placeholders.push("?");
          insertValues.push(data.taxEnabled ? 1 : 0);
        }
        if (data.taxInclusive !== undefined) {
          insertFields.push("tax_inclusive");
          placeholders.push("?");
          insertValues.push(data.taxInclusive ? 1 : 0);
        }
        if (data.roundTax !== undefined) {
          insertFields.push("round_tax");
          placeholders.push("?");
          insertValues.push(data.roundTax ? 1 : 0);
        }

        await db.execute(
          `INSERT INTO invoice_settings (${insertFields.join(", ")}) VALUES (${placeholders.join(", ")})`,
          insertValues
        );
      } else {
        // Update existing settings
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
        if (data.pdfTemplate !== undefined) {
          fields.push("pdf_template = ?");
          values.push(data.pdfTemplate);
        }
        if (data.taxEnabled !== undefined) {
          fields.push("tax_enabled = ?");
          values.push(data.taxEnabled ? 1 : 0);
        }
        if (data.taxInclusive !== undefined) {
          fields.push("tax_inclusive = ?");
          values.push(data.taxInclusive ? 1 : 0);
        }
        if (data.roundTax !== undefined) {
          fields.push("round_tax = ?");
          values.push(data.roundTax ? 1 : 0);
        }

        fields.push("updated_at = ?");
        values.push(now);

        if (fields.length > 1) {
          await db.execute(
            `UPDATE invoice_settings SET ${fields.join(", ")}`,
            values
          );
        }
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
  const params = useMemo(() => {
    const activeFilter =
      filters?.isActive !== undefined ? (filters.isActive ? 1 : 0) : null;
    return [activeFilter];
  }, [filters?.isActive]);

  const { data, isLoading, error } = useQuery<TaxRateRow>(
    `SELECT * FROM tax_rates
     WHERE ($1 IS NULL OR is_active = $1)
     ORDER BY rate ASC`,
    params
  );

  const taxRates = useMemo(() => data.map(mapRowToTaxRate), [data]);

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
        await db.execute(
          `UPDATE tax_rates SET ${fields.join(", ")} WHERE id = ?`,
          values
        );
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
