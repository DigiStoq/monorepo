-- ============================================================================
-- Sprint 5: Settings Module Tables
-- Run this migration in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- POWERSYNC SYNC RULES (Add to PowerSync Dashboard)
-- ============================================================================
-- After running this migration, add these to your bucket_definitions
-- in PowerSync Dashboard:
--
-- bucket_definitions:
--   global:
--     data:
--       # ... existing tables ...
--       - SELECT * FROM user_profiles
--       - SELECT * FROM user_preferences
--       - SELECT * FROM security_settings
--       - SELECT * FROM login_history
--       - SELECT * FROM backup_settings
--       - SELECT * FROM backup_history
-- ============================================================================

-- ============================================================================
-- USER PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'accountant')),
  language TEXT DEFAULT 'en',
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  decimal_separator TEXT DEFAULT '.',
  thousands_separator TEXT DEFAULT ',',
  decimal_places INTEGER DEFAULT 2 CHECK (decimal_places >= 0 AND decimal_places <= 4),
  compact_mode BOOLEAN DEFAULT false,
  auto_save BOOLEAN DEFAULT true,
  dashboard_widgets JSONB DEFAULT '[]'::jsonb,
  print_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================================
-- SECURITY SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method TEXT CHECK (two_factor_method IS NULL OR two_factor_method IN ('app', 'sms', 'email')),
  session_timeout INTEGER DEFAULT 30 CHECK (session_timeout >= 5 AND session_timeout <= 1440),
  require_password_change BOOLEAN DEFAULT false,
  password_change_days INTEGER CHECK (password_change_days IS NULL OR password_change_days >= 1),
  allowed_ips TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================================
-- LOGIN HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  success BOOLEAN DEFAULT true
);

-- Create index for faster queries on login history
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_timestamp ON login_history(timestamp DESC);

-- ============================================================================
-- BACKUP SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS backup_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_backup_enabled BOOLEAN DEFAULT false,
  backup_frequency TEXT DEFAULT 'weekly' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  backup_time TEXT DEFAULT '02:00',
  retention_days INTEGER DEFAULT 30 CHECK (retention_days >= 1 AND retention_days <= 365),
  backup_destination TEXT DEFAULT 'local' CHECK (backup_destination IN ('local', 'cloud')),
  cloud_provider TEXT CHECK (cloud_provider IS NULL OR cloud_provider IN ('google_drive', 'dropbox', 'onedrive')),
  last_backup TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================================
-- BACKUP HISTORY (for tracking backup operations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('manual', 'automatic')),
  destination TEXT NOT NULL,
  file_size BIGINT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
  error_message TEXT,
  file_path TEXT
);

CREATE INDEX IF NOT EXISTS idx_backup_history_user_id ON backup_history(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_timestamp ON backup_history(timestamp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- User Preferences: Users can only access their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Security Settings: Users can only access their own security settings
CREATE POLICY "Users can view own security settings" ON security_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own security settings" ON security_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own security settings" ON security_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Login History: Users can only view their own login history
CREATE POLICY "Users can view own login history" ON login_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert login history" ON login_history
  FOR INSERT WITH CHECK (true);

-- Backup Settings: Users can only access their own backup settings
CREATE POLICY "Users can view own backup settings" ON backup_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own backup settings" ON backup_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own backup settings" ON backup_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Backup History: Users can only view their own backup history
CREATE POLICY "Users can view own backup history" ON backup_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own backup history" ON backup_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at
  BEFORE UPDATE ON security_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_settings_updated_at
  BEFORE UPDATE ON backup_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS FOR AUTHENTICATED USERS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON security_settings TO authenticated;
GRANT SELECT, INSERT ON login_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON backup_settings TO authenticated;
GRANT SELECT, INSERT ON backup_history TO authenticated;
