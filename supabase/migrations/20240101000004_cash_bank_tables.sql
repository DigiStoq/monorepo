-- ============================================================================
-- MIGRATION 004: Cash & Bank Module
-- DigiStoq - Cash & Bank Tables
-- ============================================================================

-- BANK ACCOUNTS
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL UNIQUE,
  account_type VARCHAR(20) CHECK (account_type IN ('savings', 'checking', 'credit', 'loan', 'other')),
  opening_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active);

-- BANK TRANSACTIONS
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES bank_accounts(id),
  date DATE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  reference_number VARCHAR(100),
  related_customer_id UUID REFERENCES customers(id),
  related_customer_name VARCHAR(255),
  related_invoice_id UUID,
  related_invoice_number VARCHAR(50),
  balance DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_transactions_account ON bank_transactions(account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(date);

-- CASH TRANSACTIONS
CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('in', 'out', 'adjustment')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  related_customer_id UUID REFERENCES customers(id),
  related_customer_name VARCHAR(255),
  related_invoice_id UUID,
  related_invoice_number VARCHAR(50),
  balance DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cash_transactions_date ON cash_transactions(date);

-- CHEQUES
CREATE TABLE cheques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cheque_number VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) CHECK (type IN ('received', 'issued')),
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255),
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'bounced', 'cancelled')),
  related_invoice_id UUID,
  related_invoice_number VARCHAR(50),
  notes TEXT,
  cleared_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cheques_customer ON cheques(customer_id);
CREATE INDEX idx_cheques_status ON cheques(status);
CREATE INDEX idx_cheques_due_date ON cheques(due_date);

-- LOANS
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('taken', 'given')),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255),
  lender_name VARCHAR(255),
  principal_amount DECIMAL(15,2) NOT NULL,
  outstanding_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  interest_type VARCHAR(20) DEFAULT 'simple' CHECK (interest_type IN ('simple', 'compound')),
  start_date DATE NOT NULL,
  end_date DATE,
  emi_amount DECIMAL(15,2),
  emi_day INTEGER,
  total_emis INTEGER,
  paid_emis INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'defaulted')),
  notes TEXT,
  linked_bank_account_id UUID REFERENCES bank_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_type ON loans(type);

-- LOAN PAYMENTS
CREATE TABLE loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'bank', 'cheque')),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX idx_loan_payments_date ON loan_payments(date);
