-- ============================================================================
-- MIGRATION 002: Sales Module
-- DigiStoq - Sales Tables
-- ============================================================================

-- SALE INVOICES
CREATE TABLE sale_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  amount_due DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sale_invoices_customer ON sale_invoices(customer_id);
CREATE INDEX idx_sale_invoices_date ON sale_invoices(date);
CREATE INDEX idx_sale_invoices_status ON sale_invoices(status);

-- SALE INVOICE ITEMS
CREATE TABLE sale_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES sale_invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL
);

CREATE INDEX idx_sale_invoice_items_invoice ON sale_invoice_items(invoice_id);

-- PAYMENT INS
CREATE TABLE payment_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(20) CHECK (payment_mode IN ('cash', 'bank', 'card', 'ach', 'cheque', 'other')),
  reference_number VARCHAR(100),
  invoice_id UUID REFERENCES sale_invoices(id),
  invoice_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_ins_customer ON payment_ins(customer_id);
CREATE INDEX idx_payment_ins_date ON payment_ins(date);

-- ESTIMATES
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  valid_until DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  converted_to_invoice_id UUID REFERENCES sale_invoices(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_estimates_customer ON estimates(customer_id);
CREATE INDEX idx_estimates_status ON estimates(status);

-- ESTIMATE ITEMS
CREATE TABLE estimate_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL
);

CREATE INDEX idx_estimate_items_estimate ON estimate_items(estimate_id);

-- CREDIT NOTES
CREATE TABLE credit_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_note_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  invoice_id UUID REFERENCES sale_invoices(id),
  invoice_number VARCHAR(50),
  reason VARCHAR(20) CHECK (reason IN ('return', 'discount', 'error', 'other')),
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_notes_customer ON credit_notes(customer_id);

-- CREDIT NOTE ITEMS
CREATE TABLE credit_note_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_note_id UUID NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(15,2) NOT NULL,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL
);

CREATE INDEX idx_credit_note_items_note ON credit_note_items(credit_note_id);
