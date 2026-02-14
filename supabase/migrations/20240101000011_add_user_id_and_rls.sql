-- ============================================================================
-- MIGRATION 011: Multi-tenancy & Data Isolation
-- ============================================================================

-- Function to get current user ID (helper for policies if needed, though auth.uid() is standard)
-- We rely on auth.uid() provided by Supabase Auth

-- List of tables requiring user isolation:
-- customers, items, categories
-- sale_invoices, sale_invoice_items, payment_ins, estimates, estimate_items, credit_notes, credit_note_items
-- purchase_invoices, purchase_invoice_items, payment_outs, expenses
-- bank_accounts, bank_transactions, cash_transactions, cheques, loans, loan_payments
-- company_settings, tax_rates, invoice_settings, sequence_counters

-- 1. Add user_id column to core tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Add user_id column to sales tables
ALTER TABLE sale_invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE sale_invoice_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE payment_ins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE credit_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE credit_note_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Add user_id column to purchase tables
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE payment_outs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 4. Add user_id column to cash & bank tables
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE loan_payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 5. Add user_id column to settings tables
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE tax_rates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE invoice_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE sequence_counters ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 6. Index user_id for performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_invoices_user_id ON sale_invoices(user_id);
-- (Items tables usually queried via parent, but RLS checks every row, so index is good)
CREATE INDEX IF NOT EXISTS idx_sale_invoice_items_user_id ON sale_invoice_items(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_ins_user_id ON payment_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimate_items_user_id ON estimate_items(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_user_id ON credit_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_note_items_user_id ON credit_note_items(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_user_id ON purchase_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_user_id ON purchase_invoice_items(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_outs_user_id ON payment_outs(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_user_id ON bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_id ON cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cheques_user_id ON cheques(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_user_id ON loan_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_user_id ON company_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_user_id ON tax_rates(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_settings_user_id ON invoice_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_sequence_counters_user_id ON sequence_counters(user_id);

-- 7. Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON customers;
DROP POLICY IF EXISTS "Allow all for authenticated" ON items;
DROP POLICY IF EXISTS "Allow all for authenticated" ON categories;
DROP POLICY IF EXISTS "Allow all for authenticated" ON sale_invoices;
DROP POLICY IF EXISTS "Allow all for authenticated" ON sale_invoice_items;
DROP POLICY IF EXISTS "Allow all for authenticated" ON payment_ins;
DROP POLICY IF EXISTS "Allow all for authenticated" ON estimates;
DROP POLICY IF EXISTS "Allow all for authenticated" ON estimate_items;
DROP POLICY IF EXISTS "Allow all for authenticated" ON credit_notes;
DROP POLICY IF EXISTS "Allow all for authenticated" ON credit_note_items;
DROP POLICY IF EXISTS "Allow all for authenticated" ON purchase_invoices;
DROP POLICY IF EXISTS "Allow all for authenticated" ON purchase_invoice_items;
DROP POLICY IF EXISTS "Allow all for authenticated" ON payment_outs;
DROP POLICY IF EXISTS "Allow all for authenticated" ON expenses;
DROP POLICY IF EXISTS "Allow all for authenticated" ON bank_accounts;
DROP POLICY IF EXISTS "Allow all for authenticated" ON bank_transactions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON cash_transactions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON cheques;
DROP POLICY IF EXISTS "Allow all for authenticated" ON loans;
DROP POLICY IF EXISTS "Allow all for authenticated" ON loan_payments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON company_settings;
DROP POLICY IF EXISTS "Allow all for authenticated" ON tax_rates;
DROP POLICY IF EXISTS "Allow all for authenticated" ON invoice_settings;
-- sequence_counters had enable RLS called but maybe no policy? Check logic. Assuming yes.
DROP POLICY IF EXISTS "Allow all for authenticated" ON sequence_counters;

-- 8. Create Strict Policies
-- Pattern: Users can SELECT, INSERT, UPDATE, DELETE rows where user_id = auth.uid()

-- Customers
CREATE POLICY "Users can manage their own customers" ON customers
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Items
CREATE POLICY "Users can manage their own items" ON items
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Categories
CREATE POLICY "Users can manage their own categories" ON categories
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sale Invoices
CREATE POLICY "Users can manage their own sale_invoices" ON sale_invoices
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sale Invoice Items
CREATE POLICY "Users can manage their own sale_invoice_items" ON sale_invoice_items
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Payment Ins
CREATE POLICY "Users can manage their own payment_ins" ON payment_ins
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Estimates
CREATE POLICY "Users can manage their own estimates" ON estimates
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Estimate Items
CREATE POLICY "Users can manage their own estimate_items" ON estimate_items
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Credit Notes
CREATE POLICY "Users can manage their own credit_notes" ON credit_notes
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Credit Note Items
CREATE POLICY "Users can manage their own credit_note_items" ON credit_note_items
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Purchase Invoices
CREATE POLICY "Users can manage their own purchase_invoices" ON purchase_invoices
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Purchase Invoice Items
CREATE POLICY "Users can manage their own purchase_invoice_items" ON purchase_invoice_items
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Payment Outs
CREATE POLICY "Users can manage their own payment_outs" ON payment_outs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Expenses
CREATE POLICY "Users can manage their own expenses" ON expenses
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Bank Accounts
CREATE POLICY "Users can manage their own bank_accounts" ON bank_accounts
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Bank Transactions
CREATE POLICY "Users can manage their own bank_transactions" ON bank_transactions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Cash Transactions
CREATE POLICY "Users can manage their own cash_transactions" ON cash_transactions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Cheques
CREATE POLICY "Users can manage their own cheques" ON cheques
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Loans
CREATE POLICY "Users can manage their own loans" ON loans
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Loan Payments
CREATE POLICY "Users can manage their own loan_payments" ON loan_payments
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Company Settings
CREATE POLICY "Users can manage their own company_settings" ON company_settings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tax Rates
CREATE POLICY "Users can manage their own tax_rates" ON tax_rates
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Invoice Settings
CREATE POLICY "Users can manage their own invoice_settings" ON invoice_settings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sequence Counters
CREATE POLICY "Users can manage their own sequence_counters" ON sequence_counters
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
