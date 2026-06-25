-- Analytics tables for HolaMate
-- user_login_history: login/signup/logout events
-- user_activity_logs: behavioral events (page views, searches, etc.)

CREATE TABLE IF NOT EXISTS user_login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sign_up', 'sign_in', 'sign_out')),
  provider TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ
);

ALTER TABLE user_login_history
  ALTER COLUMN created_at SET DEFAULT now();

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view', 'search', 'view_vendor',
    'add_to_cart', 'checkout', 'write_review',
    'use_ai', 'filter', 'sign_up', 'sign_in'
  )),
  event_data JSONB,
  page_url TEXT,
  created_at TIMESTAMPTZ
);

ALTER TABLE user_activity_logs
  ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON user_login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_event_type ON user_login_history(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON user_activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON user_activity_logs(session_id);

ALTER TABLE user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_login_history" ON user_login_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_read_activity_logs" ON user_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
