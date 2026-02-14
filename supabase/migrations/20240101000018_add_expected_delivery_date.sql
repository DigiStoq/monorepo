-- Add expected_delivery_date to purchase_invoices table
ALTER TABLE purchase_invoices ADD COLUMN expected_delivery_date TEXT;
