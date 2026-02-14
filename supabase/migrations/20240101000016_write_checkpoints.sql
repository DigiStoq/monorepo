-- ============================================================================
-- MIGRATION 016: Write Checkpoints for PowerSync
-- DigiStoq - Custom write checkpoints to fix UI flickering
-- ============================================================================
-- NOTE: Checkpoint increment logic is handled by Edge Function (increment-checkpoint)
-- ============================================================================

-- Table to track write checkpoints per client (supports multi-device per user)
CREATE TABLE IF NOT EXISTS write_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  checkpoint BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, client_id)
);

-- Enable RLS
ALTER TABLE write_checkpoints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent migration)
DROP POLICY IF EXISTS "Users can read own checkpoints" ON write_checkpoints;
DROP POLICY IF EXISTS "Users can insert own checkpoints" ON write_checkpoints;
DROP POLICY IF EXISTS "Users can update own checkpoints" ON write_checkpoints;

-- RLS Policies
CREATE POLICY "Users can read own checkpoints"
  ON write_checkpoints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkpoints"
  ON write_checkpoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkpoints"
  ON write_checkpoints FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookups (IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS idx_write_checkpoints_user_client 
  ON write_checkpoints(user_id, client_id);
