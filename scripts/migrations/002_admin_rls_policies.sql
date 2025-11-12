-- Migration: 002_admin_rls_policies.sql
-- Purpose: Enable RLS and create admin-only access policies
-- Date: 2025-11-12
-- Run this AFTER 001_create_admin_tables.sql

-- =============================================================================
-- ADMIN_USERS RLS POLICIES
-- =============================================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can read their own profile
DROP POLICY IF EXISTS "Admins can read own profile" ON admin_users;
CREATE POLICY "Admins can read own profile" ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND auth.jwt() ->> 'role' = 'admin');

-- Super admins can read all profiles
DROP POLICY IF EXISTS "Super admins can read all" ON admin_users;
CREATE POLICY "Super admins can read all" ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Admins can update their own profile
DROP POLICY IF EXISTS "Admins can update own profile" ON admin_users;
CREATE POLICY "Admins can update own profile" ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- ACTIVITY_LOGS RLS POLICIES
-- =============================================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs (read-only audit trail)
DROP POLICY IF EXISTS "Admins can read activity logs" ON activity_logs;
CREATE POLICY "Admins can read activity logs" ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Only system (service role) can insert logs
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =============================================================================
-- STORAGE_METRICS RLS POLICIES
-- =============================================================================

ALTER TABLE storage_metrics ENABLE ROW LEVEL SECURITY;

-- Admins can read storage metrics
DROP POLICY IF EXISTS "Admins can read storage metrics" ON storage_metrics;
CREATE POLICY "Admins can read storage metrics" ON storage_metrics
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- System can update storage metrics
DROP POLICY IF EXISTS "System can update storage metrics" ON storage_metrics;
CREATE POLICY "System can update storage metrics" ON storage_metrics
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- ARTICLES RLS POLICIES
-- =============================================================================

-- Admins can create articles
DROP POLICY IF EXISTS "Admins can create articles" ON articles;
CREATE POLICY "Admins can create articles" ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can update articles
DROP POLICY IF EXISTS "Admins can update articles" ON articles;
CREATE POLICY "Admins can update articles" ON articles
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can soft-delete articles (set deleted_at)
DROP POLICY IF EXISTS "Admins can soft-delete articles" ON articles;
CREATE POLICY "Admins can soft-delete articles" ON articles
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' AND deleted_at IS NULL)
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Public can only see published, non-deleted articles
DROP POLICY IF EXISTS "Allow public read" ON articles;
DROP POLICY IF EXISTS "Allow public read published articles" ON articles;
CREATE POLICY "Allow public read published articles" ON articles
  FOR SELECT
  TO public
  USING (status = 'published' AND deleted_at IS NULL);

-- Admins can see all articles including drafts and deleted
DROP POLICY IF EXISTS "Admins can see all articles" ON articles;
CREATE POLICY "Admins can see all articles" ON articles
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- COMPUTER_PARTS RLS POLICIES
-- =============================================================================

-- Admins can create computer_parts
DROP POLICY IF EXISTS "Admins can create computer_parts" ON computer_parts;
CREATE POLICY "Admins can create computer_parts" ON computer_parts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can update computer_parts
DROP POLICY IF EXISTS "Admins can update computer_parts" ON computer_parts;
CREATE POLICY "Admins can update computer_parts" ON computer_parts
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can soft-delete computer_parts
DROP POLICY IF EXISTS "Admins can soft-delete computer_parts" ON computer_parts;
CREATE POLICY "Admins can soft-delete computer_parts" ON computer_parts
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' AND deleted_at IS NULL)
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Public can read active computer_parts
DROP POLICY IF EXISTS "Allow public read" ON computer_parts;
DROP POLICY IF EXISTS "Allow public read active computer_parts" ON computer_parts;
CREATE POLICY "Allow public read active computer_parts" ON computer_parts
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

-- Admins can see all computer_parts
DROP POLICY IF EXISTS "Admins can see all computer_parts" ON computer_parts;
CREATE POLICY "Admins can see all computer_parts" ON computer_parts
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- TOPICS RLS POLICIES
-- =============================================================================

-- Admins can create topics
DROP POLICY IF EXISTS "Admins can create topics" ON topics;
CREATE POLICY "Admins can create topics" ON topics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can update topics
DROP POLICY IF EXISTS "Admins can update topics" ON topics;
CREATE POLICY "Admins can update topics" ON topics
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can soft-delete topics
DROP POLICY IF EXISTS "Admins can soft-delete topics" ON topics;
CREATE POLICY "Admins can soft-delete topics" ON topics
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' AND deleted_at IS NULL)
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Public can read active topics
DROP POLICY IF EXISTS "Allow public read" ON topics;
DROP POLICY IF EXISTS "Allow public read active topics" ON topics;
CREATE POLICY "Allow public read active topics" ON topics
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

-- Admins can see all topics
DROP POLICY IF EXISTS "Admins can see all topics" ON topics;
CREATE POLICY "Admins can see all topics" ON topics
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Run these to verify policies are created:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('admin_users', 'activity_logs', 'storage_metrics', 'articles', 'parts', 'categories') ORDER BY tablename, policyname;
