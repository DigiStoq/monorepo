ALTER TABLE invoice_settings ADD COLUMN tax_enabled INTEGER DEFAULT 1;
ALTER TABLE invoice_settings ADD COLUMN tax_inclusive INTEGER DEFAULT 0;
ALTER TABLE invoice_settings ADD COLUMN round_tax INTEGER DEFAULT 1;
