-- Add payment details columns to payment_ins and payment_outs tables

-- For Payment In (Receiving money)
ALTER TABLE payment_ins ADD COLUMN IF NOT EXISTS cheque_number VARCHAR(50);
ALTER TABLE payment_ins ADD COLUMN IF NOT EXISTS cheque_date DATE;
ALTER TABLE payment_ins ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE payment_ins ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);
ALTER TABLE payment_ins ADD COLUMN IF NOT EXISTS card_number VARCHAR(20); -- Last 4 digits or masked

-- For Payment Out (Paying money)
ALTER TABLE payment_outs ADD COLUMN IF NOT EXISTS cheque_number VARCHAR(50);
ALTER TABLE payment_outs ADD COLUMN IF NOT EXISTS cheque_date DATE;
ALTER TABLE payment_outs ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE payment_outs ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);
ALTER TABLE payment_outs ADD COLUMN IF NOT EXISTS card_number VARCHAR(20);

-- Update history triggers or logic if needed (not strictly required as history uses JSON blob for details)
