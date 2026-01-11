-- ============================================================================
-- MIGRATION: Add item_history table for audit trail
-- Created: 2026-01-03
-- Description: Creates item_history table to track changes to items
--              including stock adjustments, updates, activations, etc.
-- ============================================================================

-- Create item_history table
CREATE TABLE IF NOT EXISTS item_history (
  id TEXT PRIMARY KEY NOT NULL,
  item_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created' | 'updated' | 'stock_adjusted' | 'activated' | 'deactivated' | 'deleted'
  description TEXT,
  old_values TEXT, -- JSON string of changed fields
  new_values TEXT, -- JSON string of new values
  user_id TEXT,
  user_name TEXT,
  created_at TEXT NOT NULL
);

-- Create index for efficient querying by item_id
CREATE INDEX IF NOT EXISTS idx_item_history_item_id ON item_history(item_id);

-- Create index for querying by date
CREATE INDEX IF NOT EXISTS idx_item_history_created_at ON item_history(created_at);

-- Enable RLS on the table
ALTER TABLE item_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user access
CREATE POLICY "Users can access their own item history"
ON item_history
FOR ALL
USING (user_id = auth.uid()::text);

-- Add item_history table to PowerSync publication
-- This enables sync of item history entries to the client
ALTER PUBLICATION powersync ADD TABLE item_history;
