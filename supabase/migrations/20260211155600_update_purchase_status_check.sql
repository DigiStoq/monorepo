ALTER TABLE purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_status_check;

ALTER TABLE purchase_invoices ADD CONSTRAINT purchase_invoices_status_check
CHECK (status IN ('draft', 'ordered', 'received', 'paid', 'partial', 'overdue', 'cancelled', 'returned'));
