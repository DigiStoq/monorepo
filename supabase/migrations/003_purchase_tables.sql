-- ============================================================================
-- MIGRATION 003: Purchase Module
-- DigiStoq - Purchase Tables
-- ============================================================================

-- PURCHASE INVOICES
CREATE TABLE purchase_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_invoice_number VARCHAR(100),
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'received', 'paid', 'partial', 'overdue', 'cancelled')),
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  amount_due DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_invoices_customer ON purchase_invoices(customer_id);
CREATE INDEX idx_purchase_invoices_date ON purchase_invoices(date);
CREATE INDEX idx_purchase_invoices_status ON purchase_invoices(status);

-- PURCHASE INVOICE ITEMS
CREATE TABLE purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
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

CREATE INDEX idx_purchase_invoice_items_invoice ON purchase_invoice_items(invoice_id);

-- PAYMENT OUTS
CREATE TABLE payment_outs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(20) CHECK (payment_mode IN ('cash', 'bank', 'card', 'ach', 'cheque', 'other')),
  reference_number VARCHAR(100),
  invoice_id UUID REFERENCES purchase_invoices(id),
  invoice_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_outs_customer ON payment_outs(customer_id);
CREATE INDEX idx_payment_outs_date ON payment_outs(date);

-- EXPENSES
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_number VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(30) CHECK (category IN ('rent', 'utilities', 'salaries', 'office', 'travel', 'marketing', 'maintenance', 'insurance', 'taxes', 'other')),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255),
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(20) CHECK (payment_mode IN ('cash', 'bank', 'card', 'ach', 'cheque', 'other')),
  reference_number VARCHAR(100),
  description TEXT NOT NULL,
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
