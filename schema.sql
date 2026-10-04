CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner','super_admin','content_manager','video_manager','lab_manager','analyst','user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  last_login_at TIMESTAMPTZ,
  last_ip INET,
  last_user_agent TEXT
);
CREATE TABLE IF NOT EXISTS learning_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  answer_time_ms INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner','super_admin','content_manager','video_manager','lab_manager','analyst','user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  last_login_at TIMESTAMPTZ,
  last_ip INET,
  last_user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_learning_events_user ON learning_events(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS mastery (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  next_review TIMESTAMPTZ,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, skill)
);
CREATE TABLE IF NOT EXISTS app_state (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  route TEXT,
  ip INET,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user_time ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_log(created_at DESC);

CREATE TABLE IF NOT EXISTS security_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  event_type TEXT NOT NULL,
  ip INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_time ON security_log(created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(created_at DESC);
