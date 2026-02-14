-- ============================================================================
-- MIGRATION 022: Drop Duplicate Indexes
-- Created: 2026-02-01
-- Description: Remove duplicate indexes flagged by Supabase linter
-- ============================================================================

-- ============================================================================
-- 1. DROP DUPLICATE INDEX ON purchase_invoice_items
-- Keep: idx_purchase_invoice_items_invoice_id
-- Drop: idx_purchase_invoice_items_invoice (duplicate)
-- ============================================================================
DROP INDEX IF EXISTS idx_purchase_invoice_items_invoice;

-- ============================================================================
-- 2. DROP DUPLICATE INDEX ON purchase_invoices
-- Keep: idx_purchase_invoices_customer_id
-- Drop: idx_purchase_invoices_customer (duplicate)
-- ============================================================================
DROP INDEX IF EXISTS idx_purchase_invoices_customer;

-- ============================================================================
-- 3. DROP DUPLICATE INDEX ON sale_invoice_items
-- Keep: idx_sale_invoice_items_invoice_id
-- Drop: idx_sale_invoice_items_invoice (duplicate)
-- ============================================================================
DROP INDEX IF EXISTS idx_sale_invoice_items_invoice;

-- ============================================================================
-- 4. DROP DUPLICATE INDEX ON sale_invoices
-- Keep: idx_sale_invoices_customer_id
-- Drop: idx_sale_invoices_customer (duplicate)
-- ============================================================================
DROP INDEX IF EXISTS idx_sale_invoices_customer;
