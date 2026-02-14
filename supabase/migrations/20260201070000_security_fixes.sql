-- ============================================================================
-- MIGRATION 021: Security Fixes
-- Created: 2026-02-01
-- Description: Fix Supabase linter security issues
--   1. Remove SECURITY DEFINER from stock_ledger view
--   2. Add explicit search_path to update_updated_at_column function
--   3. Fix overly permissive RLS on invoice_history
--   4. Fix overly permissive RLS on login_history INSERT
-- ============================================================================

-- ============================================================================
-- 1. FIX SECURITY DEFINER ON stock_ledger VIEW
-- The view was implicitly using SECURITY DEFINER which bypasses RLS
-- ============================================================================

DROP VIEW IF EXISTS stock_ledger;

CREATE VIEW stock_ledger 
WITH (security_invoker = true)  -- Explicitly use invoker's permissions
AS
-- Purchases (Incoming Stock)
SELECT
    pii.id as id,
    pi.date as transaction_date,
    'purchase' as transaction_type,
    pi.invoice_number as reference_number,
    c.name as party_name,
    pii.item_id,
    pii.item_name,
    pii.quantity as quantity_change,
    pii.unit_price,
    pi.status as payment_status,
    pi.created_at,
    pi.user_id
FROM purchase_invoice_items pii
JOIN purchase_invoices pi ON pii.invoice_id = pi.id
LEFT JOIN customers c ON pi.customer_id = c.id

UNION ALL

-- Sales (Outgoing Stock)
SELECT
    sii.id,
    si.date as transaction_date,
    'sale' as transaction_type,
    si.invoice_number as reference_number,
    c.name as party_name,
    sii.item_id,
    sii.item_name,
    -sii.quantity as quantity_change,
    sii.unit_price,
    si.status as payment_status,
    si.created_at,
    si.user_id
FROM sale_invoice_items sii
JOIN sale_invoices si ON sii.invoice_id = si.id
LEFT JOIN customers c ON si.customer_id = c.id

UNION ALL

-- Credit Notes (Sales Returns - Incoming Stock)
SELECT
    cni.id,
    cn.date as transaction_date,
    'credit_note' as transaction_type,
    cn.credit_note_number as reference_number,
    c.name as party_name,
    cni.item_id,
    cni.item_name,
    cni.quantity as quantity_change,
    cni.unit_price,
    'approved' as payment_status,
    cn.created_at,
    cn.user_id
FROM credit_note_items cni
JOIN credit_notes cn ON cni.credit_note_id = cn.id
LEFT JOIN customers c ON cn.customer_id = c.id

UNION ALL

-- Manual Adjustments (Variable Stock)
SELECT
    ih.id::uuid,
    ih.created_at::date as transaction_date,
    'adjustment' as transaction_type,
    'MANUAL' as reference_number,
    ih.user_name as party_name,
    ih.item_id::uuid,
    i.name as item_name,
    COALESCE(CAST(ih.new_values::json->>'adjustment' AS DECIMAL), 0) as quantity_change,
    0 as unit_price,
    'completed' as payment_status,
    ih.created_at::timestamptz,
    ih.user_id::uuid
FROM item_history ih
LEFT JOIN items i ON ih.item_id::uuid = i.id
WHERE ih.action = 'stock_adjusted';

-- ============================================================================
-- 2. FIX FUNCTION SEARCH PATH - update_updated_at_column
-- Add explicit search_path to prevent search path injection
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================================
-- 3. FIX OVERLY PERMISSIVE RLS ON invoice_history
-- Replace USING(true) WITH CHECK(true) with proper user_id check
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage invoice history" ON invoice_history;

CREATE POLICY "Users can manage their own invoice_history" ON invoice_history
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- 4. FIX OVERLY PERMISSIVE RLS ON login_history INSERT
-- Replace WITH CHECK(true) with proper user_id check
-- ============================================================================

DROP POLICY IF EXISTS "System can insert login history" ON login_history;

CREATE POLICY "Users can insert own login history" ON login_history
  FOR INSERT 
  WITH CHECK (user_id = (select auth.uid()));
