-- ============================================================================
-- MIGRATION: Add MRP and Batch Number columns to invoice item tables
-- Created: 2026-01-03
-- Description: Adds mrp (Maximum Retail Price) and batch_number columns
--              to sale_invoice_items, estimate_items, and purchase_invoice_items
-- ============================================================================

-- Add columns to sale_invoice_items
ALTER TABLE sale_invoice_items ADD COLUMN IF NOT EXISTS mrp REAL;
ALTER TABLE sale_invoice_items ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- Add columns to estimate_items
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS mrp REAL;
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- Add columns to purchase_invoice_items
ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS mrp REAL;
ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- Add columns to credit_note_items (for consistency)
ALTER TABLE credit_note_items ADD COLUMN IF NOT EXISTS mrp REAL;
ALTER TABLE credit_note_items ADD COLUMN IF NOT EXISTS batch_number TEXT;
