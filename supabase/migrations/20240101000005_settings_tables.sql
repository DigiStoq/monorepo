-- ============================================================================
-- MIGRATION 005: Settings & Configuration
-- DigiStoq - Settings Tables
-- ============================================================================

-- COMPANY SETTINGS (singleton)
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  logo_url TEXT,
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(100),
  address_postal_code VARCHAR(20),
  address_country VARCHAR(100) DEFAULT 'USA',
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_website VARCHAR(255),
  tax_id VARCHAR(50),
  ein VARCHAR(50),
  financial_year_start_month INTEGER DEFAULT 1,
  financial_year_start_day INTEGER DEFAULT 1,
  currency VARCHAR(10) DEFAULT 'USD',
  locale VARCHAR(20) DEFAULT 'en-US',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TAX RATES
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  type VARCHAR(20) DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tax_rates_active ON tax_rates(is_active);

-- INVOICE SETTINGS (singleton)
CREATE TABLE invoice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prefix VARCHAR(20) DEFAULT 'INV',
  next_number INTEGER DEFAULT 1001,
  padding INTEGER DEFAULT 4,
  terms_and_conditions TEXT,
  notes TEXT,
  show_payment_qr BOOLEAN DEFAULT false,
  show_bank_details BOOLEAN DEFAULT true,
  due_date_days INTEGER DEFAULT 30,
  late_fees_enabled BOOLEAN DEFAULT false,
  late_fees_percentage DECIMAL(5,2),
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_name VARCHAR(255),
  bank_routing_number VARCHAR(50),
  bank_branch_name VARCHAR(255),
  bank_swift_code VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEQUENCE COUNTERS
CREATE TABLE sequence_counters (
  id VARCHAR(50) PRIMARY KEY,
  prefix VARCHAR(20) NOT NULL,
  next_number INTEGER NOT NULL DEFAULT 1,
  padding INTEGER DEFAULT 4,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize sequence counters
INSERT INTO sequence_counters (id, prefix, next_number) VALUES
  ('sale_invoice', 'INV', 1001),
  ('purchase_invoice', 'PUR', 1001),
  ('estimate', 'EST', 1001),
  ('credit_note', 'CN', 1001),
  ('payment_in', 'REC', 1001),
  ('payment_out', 'PAY', 1001),
  ('expense', 'EXP', 1001),
  ('cheque', 'CHQ', 1001);

-- Insert default tax rates
INSERT INTO tax_rates (name, rate, type, description, is_default, is_active) VALUES
  ('No Tax', 0, 'percentage', 'Tax exempt', false, true),
  ('Standard Rate', 8.875, 'percentage', 'Standard sales tax', true, true),
  ('Reduced Rate', 4.5, 'percentage', 'Reduced tax rate for essentials', false, true);

-- Insert default company settings
INSERT INTO company_settings (name, currency, locale, timezone) VALUES
  ('My Business', 'USD', 'en-US', 'America/New_York');

-- Insert default invoice settings
INSERT INTO invoice_settings (prefix, next_number, due_date_days) VALUES
  ('INV', 1001, 30);
