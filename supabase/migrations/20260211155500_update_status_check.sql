ALTER TABLE sale_invoices DROP CONSTRAINT IF EXISTS sale_invoices_status_check;
ALTER TABLE sale_invoices ADD CONSTRAINT sale_invoices_status_check 
  CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'received', 'unpaid'));
