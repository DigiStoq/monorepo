-- ============================================================================
-- MIGRATION 014: Add Transport Details to Sale Invoices
-- DigiStoq - Add transport fields for invoice generation
-- ============================================================================

-- Add transport_name column
ALTER TABLE sale_invoices ADD COLUMN IF NOT EXISTS transport_name TEXT;

-- Add delivery_date column
ALTER TABLE sale_invoices ADD COLUMN IF NOT EXISTS delivery_date TEXT;

-- Add delivery_location column
ALTER TABLE sale_invoices ADD COLUMN IF NOT EXISTS delivery_location TEXT;

-- Note: These fields are optional and used primarily for the "Bill/Cash Memo"
-- invoice template style.
