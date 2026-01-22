-- ============================================================================
-- MIGRATION 010: Add Missing Columns for PowerSync Sync
-- DigiStoq - Sync local PowerSync schema changes to Supabase
-- ============================================================================
--
-- ISSUE: Local PowerSync schema has columns that don't exist in Supabase,
-- causing PGRST204 errors when trying to sync data.
-- ============================================================================

-- ============================================================================
-- 1. INVOICE_SETTINGS - Add pdf_template column
-- ============================================================================
ALTER TABLE invoice_settings 
ADD COLUMN IF NOT EXISTS pdf_template VARCHAR(20) DEFAULT 'classic' 
  CHECK (pdf_template IN ('classic', 'modern', 'minimal'));

-- ============================================================================
-- 2. ITEMS - Add additional product detail columns
-- ============================================================================
ALTER TABLE items ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS manufacture_date DATE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(50);
ALTER TABLE items ADD COLUMN IF NOT EXISTS warranty_days INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS model_number VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Create index on barcode for fast lookups
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);

-- ============================================================================
-- 3. EXPENSES - Add paid_to fields
-- ============================================================================
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid_to_name VARCHAR(255);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid_to_details TEXT;

-- ============================================================================
-- Verification: Check all columns exist
-- ============================================================================
-- Run this query to verify:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name IN ('invoice_settings', 'items', 'expenses') 
-- ORDER BY table_name, ordinal_position;
