-- ============================================================================
-- MIGRATION 008: Invoice History
-- DigiStoq - Audit trail for invoice changes
-- ============================================================================

-- INVOICE HISTORY (audit trail for all invoice types)
CREATE TABLE invoice_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL,
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('sale', 'purchase')),
  action VARCHAR(30) NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'payment_recorded', 'deleted')),
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  user_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_invoice_history_invoice ON invoice_history(invoice_id);
CREATE INDEX idx_invoice_history_type ON invoice_history(invoice_type);
CREATE INDEX idx_invoice_history_action ON invoice_history(action);
CREATE INDEX idx_invoice_history_created ON invoice_history(created_at DESC);

-- Enable RLS
ALTER TABLE invoice_history ENABLE ROW LEVEL SECURITY;

-- RLS policy (allow all operations for authenticated users)
CREATE POLICY "Users can manage invoice history"
  ON invoice_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: PowerSync publication is FOR ALL TABLES, so invoice_history is automatically included
