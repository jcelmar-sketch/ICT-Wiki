-- Migration: 001_create_admin_tables.sql
-- Purpose: Create admin dashboard tables and extend existing tables
-- Date: 2025-11-12
-- Run this against your Supabase database using the SQL Editor or CLI

-- =============================================================================
-- ADMIN USERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_locked ON admin_users(locked_until) WHERE locked_until IS NOT NULL;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ACTIVITY LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'login_success', 'login_failure',
    'create', 'edit', 'delete',
    'publish', 'unpublish',
    'restore', 'permanent_delete'
  )),
  item_type TEXT CHECK (item_type IN ('article', 'computer_part', 'topic', NULL)),
  item_id UUID,
  item_title TEXT,
  ip_address INET,
  user_agent TEXT,
  notes JSONB,
  archived BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_item_type ON activity_logs(item_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_archived ON activity_logs(archived) WHERE archived = FALSE;

-- =============================================================================
-- STORAGE METRICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS storage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_files INT NOT NULL DEFAULT 0,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  quota_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5GB default
  usage_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN quota_bytes > 0 THEN (total_bytes::NUMERIC / quota_bytes::NUMERIC * 100)
      ELSE 0
    END
  ) STORED,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial singleton row (only if it doesn't exist)
INSERT INTO storage_metrics (id, total_files, total_bytes)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- EXTEND EXISTING TABLES
-- =============================================================================

-- Articles: Add admin fields
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES admin_users(id);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- Computer Parts: Add soft-delete field
ALTER TABLE computer_parts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Topics: Add soft-delete field
ALTER TABLE topics ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- =============================================================================
-- CREATE INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);

CREATE INDEX IF NOT EXISTS idx_computer_parts_deleted_at ON computer_parts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_topics_deleted_at ON topics(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Run these to verify the migration succeeded:
-- SELECT * FROM admin_users LIMIT 1;
-- SELECT * FROM activity_logs LIMIT 1;
-- SELECT * FROM storage_metrics;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'articles' AND column_name IN ('author_id', 'deleted_at', 'status');
