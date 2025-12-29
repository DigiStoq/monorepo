import { PowerSyncDatabase, column, Schema, Table } from "@powersync/web";
import { SupabaseConnector } from "./supabase-connector";

// ============================================================================
// CORE TABLES
// ============================================================================

const customers = new Table({
  name: column.text,
  type: column.text, // 'customer' | 'supplier' | 'both'
  phone: column.text,
  email: column.text,
  tax_id: column.text,
  address: column.text,
  city: column.text,
  state: column.text,
  zip_code: column.text,
  opening_balance: column.real,
  current_balance: column.real,
  credit_limit: column.real,
  credit_days: column.integer,
  notes: column.text,
  is_active: column.integer, // boolean as 0/1
  created_at: column.text,
  updated_at: column.text,
});

const categories = new Table({
  name: column.text,
  description: column.text,
  item_count: column.integer,
  created_at: column.text,
});

const items = new Table({
  name: column.text,
  sku: column.text,
  type: column.text, // 'product' | 'service'
  description: column.text,
  category_id: column.text,
  unit: column.text,
  sale_price: column.real,
  purchase_price: column.real,
  tax_rate: column.real,
  stock_quantity: column.real,
  low_stock_alert: column.real,
  is_active: column.integer,
  // Optional additional fields
  batch_number: column.text,
  expiry_date: column.text,
  manufacture_date: column.text,
  barcode: column.text,
  hsn_code: column.text,
  warranty_days: column.integer,
  brand: column.text,
  model_number: column.text,
  location: column.text,
  created_at: column.text,
  updated_at: column.text,
});

// ============================================================================
// SALES TABLES
// ============================================================================

const sale_invoices = new Table({
  invoice_number: column.text,
  customer_id: column.text,
  customer_name: column.text,
  date: column.text,
  due_date: column.text,
  status: column.text, // 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  subtotal: column.real,
  tax_amount: column.real,
  discount_amount: column.real,
  total: column.real,
  amount_paid: column.real,
  amount_due: column.real,
  notes: column.text,
  terms: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const sale_invoice_items = new Table({
  invoice_id: column.text,
  item_id: column.text,
  item_name: column.text,
  description: column.text,
  quantity: column.real,
  unit: column.text,
  unit_price: column.real,
  discount_percent: column.real,
  tax_percent: column.real,
  amount: column.real,
});

const payment_ins = new Table({
  receipt_number: column.text,
  customer_id: column.text,
  customer_name: column.text,
  date: column.text,
  amount: column.real,
  payment_mode: column.text, // 'cash' | 'bank' | 'card' | 'ach' | 'cheque' | 'other'
  reference_number: column.text,
  invoice_id: column.text,
  invoice_number: column.text,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const estimates = new Table({
  estimate_number: column.text,
  customer_id: column.text,
  customer_name: column.text,
  date: column.text,
  valid_until: column.text,
  status: column.text, // 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
  subtotal: column.real,
  tax_amount: column.real,
  discount_amount: column.real,
  total: column.real,
  notes: column.text,
  terms: column.text,
  converted_to_invoice_id: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const estimate_items = new Table({
  estimate_id: column.text,
  item_id: column.text,
  item_name: column.text,
  description: column.text,
  quantity: column.real,
  unit: column.text,
  unit_price: column.real,
  discount_percent: column.real,
  tax_percent: column.real,
  amount: column.real,
});

const credit_notes = new Table({
  credit_note_number: column.text,
  customer_id: column.text,
  customer_name: column.text,
  date: column.text,
  invoice_id: column.text,
  invoice_number: column.text,
  reason: column.text, // 'return' | 'discount' | 'error' | 'other'
  subtotal: column.real,
  tax_amount: column.real,
  total: column.real,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const credit_note_items = new Table({
  credit_note_id: column.text,
  item_id: column.text,
  item_name: column.text,
  description: column.text,
  quantity: column.real,
  unit: column.text,
  unit_price: column.real,
  tax_percent: column.real,
  amount: column.real,
});

// Invoice history for audit trail
const invoice_history = new Table({
  invoice_id: column.text,
  invoice_type: column.text, // 'sale' | 'purchase'
  action: column.text, // 'created' | 'updated' | 'status_changed' | 'payment_recorded' | 'deleted'
  description: column.text,
  old_values: column.text, // JSON string of changed fields
  new_values: column.text, // JSON string of new values
  user_id: column.text,
  user_name: column.text,
  created_at: column.text,
});

// ============================================================================
// PURCHASE TABLES
// ============================================================================

const purchase_invoices = new Table({
  invoice_number: column.text,
  supplier_invoice_number: column.text,
  customer_id: column.text, // supplier reference
  customer_name: column.text,
  date: column.text,
  due_date: column.text,
  status: column.text, // 'draft' | 'received' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  subtotal: column.real,
  tax_amount: column.real,
  discount_amount: column.real,
  total: column.real,
  amount_paid: column.real,
  amount_due: column.real,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const purchase_invoice_items = new Table({
  invoice_id: column.text,
  item_id: column.text,
  item_name: column.text,
  description: column.text,
  quantity: column.real,
  unit: column.text,
  unit_price: column.real,
  discount_percent: column.real,
  tax_percent: column.real,
  amount: column.real,
});

const payment_outs = new Table({
  payment_number: column.text,
  customer_id: column.text, // supplier reference
  customer_name: column.text,
  date: column.text,
  amount: column.real,
  payment_mode: column.text, // 'cash' | 'bank' | 'card' | 'ach' | 'cheque' | 'other'
  reference_number: column.text,
  invoice_id: column.text,
  invoice_number: column.text,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const expenses = new Table({
  expense_number: column.text,
  category: column.text, // 'rent' | 'utilities' | 'salaries' | etc.
  customer_id: column.text,
  customer_name: column.text,
  date: column.text,
  amount: column.real,
  payment_mode: column.text,
  reference_number: column.text,
  description: column.text,
  notes: column.text,
  attachment_url: column.text,
  created_at: column.text,
  updated_at: column.text,
});

// ============================================================================
// CASH & BANK TABLES
// ============================================================================

const bank_accounts = new Table({
  name: column.text,
  bank_name: column.text,
  account_number: column.text,
  account_type: column.text, // 'savings' | 'checking' | 'credit' | 'loan' | 'other'
  opening_balance: column.real,
  current_balance: column.real,
  is_active: column.integer,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const bank_transactions = new Table({
  account_id: column.text,
  date: column.text,
  type: column.text, // 'deposit' | 'withdrawal' | 'transfer'
  amount: column.real,
  description: column.text,
  reference_number: column.text,
  related_customer_id: column.text,
  related_customer_name: column.text,
  related_invoice_id: column.text,
  related_invoice_number: column.text,
  balance: column.real,
  created_at: column.text,
});

const cash_transactions = new Table({
  date: column.text,
  type: column.text, // 'in' | 'out' | 'adjustment'
  amount: column.real,
  description: column.text,
  category: column.text,
  related_customer_id: column.text,
  related_customer_name: column.text,
  related_invoice_id: column.text,
  related_invoice_number: column.text,
  balance: column.real,
  created_at: column.text,
});

const cheques = new Table({
  cheque_number: column.text,
  type: column.text, // 'received' | 'issued'
  customer_id: column.text,
  customer_name: column.text,
  bank_name: column.text,
  date: column.text,
  due_date: column.text,
  amount: column.real,
  status: column.text, // 'pending' | 'cleared' | 'bounced' | 'cancelled'
  related_invoice_id: column.text,
  related_invoice_number: column.text,
  notes: column.text,
  cleared_date: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const loans = new Table({
  name: column.text,
  type: column.text, // 'taken' | 'given'
  customer_id: column.text,
  customer_name: column.text,
  lender_name: column.text,
  principal_amount: column.real,
  outstanding_amount: column.real,
  interest_rate: column.real,
  interest_type: column.text, // 'simple' | 'compound'
  start_date: column.text,
  end_date: column.text,
  emi_amount: column.real,
  emi_day: column.integer,
  total_emis: column.integer,
  paid_emis: column.integer,
  status: column.text, // 'active' | 'closed' | 'defaulted'
  notes: column.text,
  linked_bank_account_id: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const loan_payments = new Table({
  loan_id: column.text,
  date: column.text,
  principal_amount: column.real,
  interest_amount: column.real,
  total_amount: column.real,
  payment_method: column.text, // 'cash' | 'bank' | 'cheque'
  reference_number: column.text,
  notes: column.text,
  created_at: column.text,
});

// ============================================================================
// SETTINGS TABLES
// ============================================================================

const company_settings = new Table({
  name: column.text,
  legal_name: column.text,
  logo_url: column.text,
  address_street: column.text,
  address_city: column.text,
  address_state: column.text,
  address_postal_code: column.text,
  address_country: column.text,
  contact_phone: column.text,
  contact_email: column.text,
  contact_website: column.text,
  tax_id: column.text,
  ein: column.text,
  financial_year_start_month: column.integer,
  financial_year_start_day: column.integer,
  currency: column.text,
  locale: column.text,
  timezone: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const tax_rates = new Table({
  name: column.text,
  rate: column.real,
  type: column.text, // 'percentage' | 'fixed'
  description: column.text,
  is_default: column.integer,
  is_active: column.integer,
  created_at: column.text,
});

const invoice_settings = new Table({
  prefix: column.text,
  next_number: column.integer,
  padding: column.integer,
  terms_and_conditions: column.text,
  notes: column.text,
  show_payment_qr: column.integer,
  show_bank_details: column.integer,
  due_date_days: column.integer,
  late_fees_enabled: column.integer,
  late_fees_percentage: column.real,
  bank_account_name: column.text,
  bank_account_number: column.text,
  bank_name: column.text,
  bank_routing_number: column.text,
  bank_branch_name: column.text,
  bank_swift_code: column.text,
  pdf_template: column.text, // 'classic' | 'modern' | 'minimal'
  created_at: column.text,
  updated_at: column.text,
});

const sequence_counters = new Table(
  {
    prefix: column.text,
    next_number: column.integer,
    padding: column.integer,
    updated_at: column.text,
  },
  { indexes: {} }
);

// ============================================================================
// USER SETTINGS TABLES
// ============================================================================

const user_profiles = new Table({
  user_id: column.text,
  first_name: column.text,
  last_name: column.text,
  phone: column.text,
  avatar_url: column.text,
  role: column.text, // 'admin' | 'manager' | 'staff' | 'accountant'
  language: column.text,
  notification_email: column.integer, // boolean as 0/1
  notification_push: column.integer,
  notification_sms: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

const user_preferences = new Table({
  user_id: column.text,
  theme: column.text, // 'light' | 'dark' | 'system'
  date_format: column.text,
  decimal_separator: column.text,
  thousands_separator: column.text,
  decimal_places: column.integer,
  compact_mode: column.integer,
  auto_save: column.integer,
  dashboard_widgets: column.text, // JSON string
  print_settings: column.text, // JSON string
  created_at: column.text,
  updated_at: column.text,
});

const security_settings = new Table({
  user_id: column.text,
  two_factor_enabled: column.integer,
  two_factor_method: column.text, // 'app' | 'sms' | 'email' | null
  session_timeout: column.integer,
  require_password_change: column.integer,
  password_change_days: column.integer,
  allowed_ips: column.text, // JSON array string
  created_at: column.text,
  updated_at: column.text,
});

const login_history = new Table({
  user_id: column.text,
  timestamp: column.text,
  ip_address: column.text,
  user_agent: column.text,
  location: column.text,
  success: column.integer,
});

const backup_settings = new Table({
  user_id: column.text,
  auto_backup_enabled: column.integer,
  backup_frequency: column.text, // 'daily' | 'weekly' | 'monthly'
  backup_time: column.text,
  retention_days: column.integer,
  backup_destination: column.text, // 'local' | 'cloud'
  cloud_provider: column.text, // 'google_drive' | 'dropbox' | 'onedrive' | null
  last_backup: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const backup_history = new Table({
  user_id: column.text,
  timestamp: column.text,
  type: column.text, // 'manual' | 'automatic'
  destination: column.text,
  file_size: column.integer,
  status: column.text, // 'success' | 'failed' | 'in_progress'
  error_message: column.text,
  file_path: column.text,
});

// ============================================================================
// SCHEMA EXPORT
// ============================================================================

export const AppSchema = new Schema({
  // Core
  customers,
  categories,
  items,
  // Sales
  sale_invoices,
  sale_invoice_items,
  payment_ins,
  estimates,
  estimate_items,
  credit_notes,
  credit_note_items,
  invoice_history,
  // Purchases
  purchase_invoices,
  purchase_invoice_items,
  payment_outs,
  expenses,
  // Cash & Bank
  bank_accounts,
  bank_transactions,
  cash_transactions,
  cheques,
  loans,
  loan_payments,
  // Company Settings
  company_settings,
  tax_rates,
  invoice_settings,
  sequence_counters,
  // User Settings
  user_profiles,
  user_preferences,
  security_settings,
  login_history,
  backup_settings,
  backup_history,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Database = (typeof AppSchema)["types"];

// Core types
export type CustomerRecord = Database["customers"];
export type CategoryRecord = Database["categories"];
export type ItemRecord = Database["items"];

// Sales types
export type SaleInvoiceRecord = Database["sale_invoices"];
export type SaleInvoiceItemRecord = Database["sale_invoice_items"];
export type PaymentInRecord = Database["payment_ins"];
export type EstimateRecord = Database["estimates"];
export type EstimateItemRecord = Database["estimate_items"];
export type CreditNoteRecord = Database["credit_notes"];
export type CreditNoteItemRecord = Database["credit_note_items"];
export type InvoiceHistoryRecord = Database["invoice_history"];

// Purchase types
export type PurchaseInvoiceRecord = Database["purchase_invoices"];
export type PurchaseInvoiceItemRecord = Database["purchase_invoice_items"];
export type PaymentOutRecord = Database["payment_outs"];
export type ExpenseRecord = Database["expenses"];

// Cash & Bank types
export type BankAccountRecord = Database["bank_accounts"];
export type BankTransactionRecord = Database["bank_transactions"];
export type CashTransactionRecord = Database["cash_transactions"];
export type ChequeRecord = Database["cheques"];
export type LoanRecord = Database["loans"];
export type LoanPaymentRecord = Database["loan_payments"];

// Company Settings types
export type CompanySettingsRecord = Database["company_settings"];
export type TaxRateRecord = Database["tax_rates"];
export type InvoiceSettingsRecord = Database["invoice_settings"];
export type SequenceCounterRecord = Database["sequence_counters"];

// User Settings types
export type UserProfileRecord = Database["user_profiles"];
export type UserPreferencesRecord = Database["user_preferences"];
export type SecuritySettingsRecord = Database["security_settings"];
export type LoginHistoryRecord = Database["login_history"];
export type BackupSettingsRecord = Database["backup_settings"];
export type BackupHistoryRecord = Database["backup_history"];

// ============================================================================
// DATABASE INSTANCE
// ============================================================================

let powerSyncInstance: PowerSyncDatabase | null = null;

export function getPowerSyncDatabase(): PowerSyncDatabase {
  if (powerSyncInstance) {
    return powerSyncInstance;
  }

  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: "digistoq.sqlite",
    },
  });

  return powerSyncInstance;
}

export async function initializePowerSync(): Promise<PowerSyncDatabase> {
  const db = getPowerSyncDatabase();

  // Initialize connector for sync with Supabase
  const connector = new SupabaseConnector();

  // Connect to PowerSync service
  await db.connect(connector);

  return db;
}

export async function disconnectPowerSync(): Promise<void> {
  if (powerSyncInstance) {
    await powerSyncInstance.disconnect();
    powerSyncInstance = null;
  }
}

export { powerSyncInstance };
