-- ============================================================================
-- MIGRATION 020: Add updated_at to transaction tables
-- DigiStoq - Add missing updated_at columns
-- ============================================================================

-- Add updated_at to cash_transactions
ALTER TABLE cash_transactions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at to bank_transactions
ALTER TABLE bank_transactions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at to loan_payments
ALTER TABLE loan_payments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
