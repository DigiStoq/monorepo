-- ============================================================================
-- MIGRATION 025: RLS Performance - Settings & User Tables
-- Created: 2026-02-01
-- Description: Optimize RLS policies by wrapping auth.uid() in subquery
--              to prevent per-row re-evaluation
-- ============================================================================

-- ============================================================================
-- SETTINGS TABLES
-- ============================================================================

-- Company Settings
DROP POLICY IF EXISTS "Users can manage their own company_settings" ON company_settings;
CREATE POLICY "Users can manage their own company_settings" ON company_settings
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Tax Rates
DROP POLICY IF EXISTS "Users can manage their own tax_rates" ON tax_rates;
CREATE POLICY "Users can manage their own tax_rates" ON tax_rates
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Invoice Settings
DROP POLICY IF EXISTS "Users can manage their own invoice_settings" ON invoice_settings;
CREATE POLICY "Users can manage their own invoice_settings" ON invoice_settings
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Sequence Counters
DROP POLICY IF EXISTS "Users can manage their own sequence_counters" ON sequence_counters;
CREATE POLICY "Users can manage their own sequence_counters" ON sequence_counters
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- USER PROFILES TABLE (3 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ============================================================================
-- USER PREFERENCES TABLE (3 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ============================================================================
-- SECURITY SETTINGS TABLE (3 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own security settings" ON security_settings;
CREATE POLICY "Users can view own security settings" ON security_settings
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own security settings" ON security_settings;
CREATE POLICY "Users can insert own security settings" ON security_settings
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own security settings" ON security_settings;
CREATE POLICY "Users can update own security settings" ON security_settings
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ============================================================================
-- LOGIN HISTORY TABLE (1 policy - SELECT only, INSERT fixed in Sprint 1)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own login history" ON login_history;
CREATE POLICY "Users can view own login history" ON login_history
  FOR SELECT USING (user_id = (select auth.uid()));

-- ============================================================================
-- BACKUP SETTINGS TABLE (3 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own backup settings" ON backup_settings;
CREATE POLICY "Users can view own backup settings" ON backup_settings
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own backup settings" ON backup_settings;
CREATE POLICY "Users can insert own backup settings" ON backup_settings
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own backup settings" ON backup_settings;
CREATE POLICY "Users can update own backup settings" ON backup_settings
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ============================================================================
-- BACKUP HISTORY TABLE (2 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own backup history" ON backup_history;
CREATE POLICY "Users can view own backup history" ON backup_history
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own backup history" ON backup_history;
CREATE POLICY "Users can insert own backup history" ON backup_history
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- ITEM HISTORY TABLE (1 policy)
-- ============================================================================

DROP POLICY IF EXISTS "Users can access their own item history" ON item_history;
CREATE POLICY "Users can access their own item history" ON item_history
  FOR ALL
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

-- ============================================================================
-- WRITE CHECKPOINTS TABLE (3 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own checkpoints" ON write_checkpoints;
CREATE POLICY "Users can read own checkpoints" ON write_checkpoints
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own checkpoints" ON write_checkpoints;
CREATE POLICY "Users can insert own checkpoints" ON write_checkpoints
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own checkpoints" ON write_checkpoints;
CREATE POLICY "Users can update own checkpoints" ON write_checkpoints
  FOR UPDATE USING (user_id = (select auth.uid()));
