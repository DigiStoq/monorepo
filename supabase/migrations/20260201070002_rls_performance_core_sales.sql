-- ============================================================================
-- MIGRATION 023: RLS Performance - Core & Sales Tables
-- Created: 2026-02-01
-- Description: Optimize RLS policies by wrapping auth.uid() in subquery
--              to prevent per-row re-evaluation
-- Pattern: USING (user_id = auth.uid()) -> USING (user_id = (select auth.uid()))
-- ============================================================================

-- ============================================================================
-- CORE TABLES: customers, items, categories
-- ============================================================================

-- Customers
DROP POLICY IF EXISTS "Users can manage their own customers" ON customers;
CREATE POLICY "Users can manage their own customers" ON customers
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Items
DROP POLICY IF EXISTS "Users can manage their own items" ON items;
CREATE POLICY "Users can manage their own items" ON items
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Categories
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
CREATE POLICY "Users can manage their own categories" ON categories
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- SALES TABLES: sale_invoices, sale_invoice_items, payment_ins
-- ============================================================================

-- Sale Invoices
DROP POLICY IF EXISTS "Users can manage their own sale_invoices" ON sale_invoices;
CREATE POLICY "Users can manage their own sale_invoices" ON sale_invoices
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Sale Invoice Items
DROP POLICY IF EXISTS "Users can manage their own sale_invoice_items" ON sale_invoice_items;
CREATE POLICY "Users can manage their own sale_invoice_items" ON sale_invoice_items
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Payment Ins
DROP POLICY IF EXISTS "Users can manage their own payment_ins" ON payment_ins;
CREATE POLICY "Users can manage their own payment_ins" ON payment_ins
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- ESTIMATES & CREDIT NOTES
-- ============================================================================

-- Estimates
DROP POLICY IF EXISTS "Users can manage their own estimates" ON estimates;
CREATE POLICY "Users can manage their own estimates" ON estimates
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Estimate Items
DROP POLICY IF EXISTS "Users can manage their own estimate_items" ON estimate_items;
CREATE POLICY "Users can manage their own estimate_items" ON estimate_items
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Credit Notes
DROP POLICY IF EXISTS "Users can manage their own credit_notes" ON credit_notes;
CREATE POLICY "Users can manage their own credit_notes" ON credit_notes
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Credit Note Items
DROP POLICY IF EXISTS "Users can manage their own credit_note_items" ON credit_note_items;
CREATE POLICY "Users can manage their own credit_note_items" ON credit_note_items
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
