-- ============================================================================
-- MIGRATION 024: RLS Performance - Purchases & Banking Tables
-- Created: 2026-02-01
-- Description: Optimize RLS policies by wrapping auth.uid() in subquery
--              to prevent per-row re-evaluation
-- ============================================================================

-- ============================================================================
-- PURCHASE TABLES
-- ============================================================================

-- Purchase Invoices
DROP POLICY IF EXISTS "Users can manage their own purchase_invoices" ON purchase_invoices;
CREATE POLICY "Users can manage their own purchase_invoices" ON purchase_invoices
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Purchase Invoice Items
DROP POLICY IF EXISTS "Users can manage their own purchase_invoice_items" ON purchase_invoice_items;
CREATE POLICY "Users can manage their own purchase_invoice_items" ON purchase_invoice_items
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Payment Outs
DROP POLICY IF EXISTS "Users can manage their own payment_outs" ON payment_outs;
CREATE POLICY "Users can manage their own payment_outs" ON payment_outs
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Expenses
DROP POLICY IF EXISTS "Users can manage their own expenses" ON expenses;
CREATE POLICY "Users can manage their own expenses" ON expenses
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- BANKING TABLES
-- ============================================================================

-- Bank Accounts
DROP POLICY IF EXISTS "Users can manage their own bank_accounts" ON bank_accounts;
CREATE POLICY "Users can manage their own bank_accounts" ON bank_accounts
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Bank Transactions
DROP POLICY IF EXISTS "Users can manage their own bank_transactions" ON bank_transactions;
CREATE POLICY "Users can manage their own bank_transactions" ON bank_transactions
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Cash Transactions
DROP POLICY IF EXISTS "Users can manage their own cash_transactions" ON cash_transactions;
CREATE POLICY "Users can manage their own cash_transactions" ON cash_transactions
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Cheques
DROP POLICY IF EXISTS "Users can manage their own cheques" ON cheques;
CREATE POLICY "Users can manage their own cheques" ON cheques
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Loans
DROP POLICY IF EXISTS "Users can manage their own loans" ON loans;
CREATE POLICY "Users can manage their own loans" ON loans
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Loan Payments
DROP POLICY IF EXISTS "Users can manage their own loan_payments" ON loan_payments;
CREATE POLICY "Users can manage their own loan_payments" ON loan_payments
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
