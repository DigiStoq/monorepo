-- Update invoice_history table to allow more types in invoice_type check constraint
-- The original constraint only allowed 'sale' and 'purchase'

ALTER TABLE invoice_history DROP CONSTRAINT IF EXISTS invoice_history_invoice_type_check;

ALTER TABLE invoice_history 
  ADD CONSTRAINT invoice_history_invoice_type_check 
  CHECK (invoice_type IN ('sale', 'purchase', 'estimate', 'credit_note', 'payment_in', 'payment_out'));
