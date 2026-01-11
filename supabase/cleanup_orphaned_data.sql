-- Delete orphaned data (rows without a user_id)
-- Run this in the Supabase SQL Editor
-- ORDER MATTERS: Deleting children before parents to avoid Foreign Key constraints

BEGIN;

-- 1. Deepest Dependencies (Items associated with documents)
DELETE FROM sale_invoice_items WHERE user_id IS NULL;
DELETE FROM purchase_invoice_items WHERE user_id IS NULL;
DELETE FROM estimate_items WHERE user_id IS NULL;
DELETE FROM credit_note_items WHERE user_id IS NULL;

-- 2. Linked Payments & Transactions (Reference Documents or Customers)
DELETE FROM loan_payments WHERE user_id IS NULL;
DELETE FROM payment_ins WHERE user_id IS NULL; -- References sale_invoices
DELETE FROM payment_outs WHERE user_id IS NULL; -- References purchase_invoices
DELETE FROM bank_transactions WHERE user_id IS NULL;
DELETE FROM cash_transactions WHERE user_id IS NULL;
DELETE FROM cheques WHERE user_id IS NULL;

-- 3. Documents (Reference Customers, Items)
DELETE FROM credit_notes WHERE user_id IS NULL;
DELETE FROM sale_invoices WHERE user_id IS NULL;
DELETE FROM purchase_invoices WHERE user_id IS NULL;
DELETE FROM estimates WHERE user_id IS NULL;
DELETE FROM loans WHERE user_id IS NULL;
DELETE FROM expenses WHERE user_id IS NULL;
DELETE FROM invoice_history WHERE user_id IS NULL;

-- 4. Core Entities (Reference each other or standalone)
DELETE FROM items WHERE user_id IS NULL; -- References categories
DELETE FROM customers WHERE user_id IS NULL; -- The big parent
DELETE FROM categories WHERE user_id IS NULL;
DELETE FROM bank_accounts WHERE user_id IS NULL;

-- 5. Settings & Config
DELETE FROM company_settings WHERE user_id IS NULL;
DELETE FROM tax_rates WHERE user_id IS NULL;
DELETE FROM invoice_settings WHERE user_id IS NULL;
DELETE FROM sequence_counters WHERE user_id IS NULL;

COMMIT;
