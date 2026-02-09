-- ============================================================================
-- MIGRATION 009: Verify PowerSync Publication  
-- DigiStoq - Publication verification (no changes needed)
-- ============================================================================
--
-- NOTE: The powersync publication was created as FOR ALL TABLES in a previous
-- migration or via Supabase dashboard. This means ALL tables are automatically
-- included - no manual additions needed.
--
-- This migration is a NO-OP but documents the expected state.
-- ============================================================================

-- Verification query - run this to see all synced tables:
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'powersync';

-- Expected tables (31 total):
-- Core: customers, items, categories
-- Sales: sale_invoices, sale_invoice_items, payment_ins, estimates, estimate_items,
--        credit_notes, credit_note_items, invoice_history
-- Purchases: purchase_invoices, purchase_invoice_items, payment_outs, expenses
-- Cash/Bank: bank_accounts, bank_transactions, cash_transactions, cheques, loans, loan_payments
-- Settings: company_settings, tax_rates, invoice_settings, sequence_counters
-- User: user_profiles, user_preferences, security_settings, login_history, 
--       backup_settings, backup_history

SELECT 'PowerSync publication is FOR ALL TABLES - all tables automatically synced' AS status;
