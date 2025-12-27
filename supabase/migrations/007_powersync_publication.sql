-- ============================================================================
-- MIGRATION 007: PowerSync Publication
-- DigiStoq - Enable PowerSync Sync
-- ============================================================================

-- Create publication for PowerSync
-- This enables real-time sync between Supabase and PowerSync

CREATE PUBLICATION powersync FOR TABLE
  customers,
  items,
  categories,
  sale_invoices,
  sale_invoice_items,
  payment_ins,
  estimates,
  estimate_items,
  credit_notes,
  credit_note_items,
  purchase_invoices,
  purchase_invoice_items,
  payment_outs,
  expenses,
  bank_accounts,
  bank_transactions,
  cash_transactions,
  cheques,
  loans,
  loan_payments,
  company_settings,
  tax_rates,
  invoice_settings,
  sequence_counters;

-- Note: After running this migration, configure PowerSync sync rules
-- in the PowerSync dashboard to match these tables
