-- ============================================================================
-- MIGRATION 019: Make due_date nullable on invoices
-- DigiStoq - Allow invoices without explicit due dates
-- ============================================================================

-- Make due_date nullable on sale_invoices
ALTER TABLE sale_invoices ALTER COLUMN due_date DROP NOT NULL;

-- Make due_date nullable on purchase_invoices (if exists and has same constraint)
ALTER TABLE purchase_invoices ALTER COLUMN due_date DROP NOT NULL;
