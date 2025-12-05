-- Migration: 004_fix_rls_policies.sql
-- Purpose: Fix RLS policies to check admin_users table instead of JWT role
-- Date: 2025-11-24

-- =============================================================================
-- ADMIN_USERS
-- =============================================================================

-- Allow admins to read their own profile based on ID match only
-- (The existence of the row implies they are an admin)
DROP POLICY IF EXISTS "Admins can read own profile" ON admin_users;
CREATE POLICY "Admins can read own profile" ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to update their own profile
DROP POLICY IF EXISTS "Admins can update own profile" ON admin_users;
CREATE POLICY "Admins can update own profile" ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- TOPICS
-- =============================================================================

-- Fix Create
DROP POLICY IF EXISTS "Admins can create topics" ON topics;
CREATE POLICY "Admins can create topics" ON topics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Fix Update
DROP POLICY IF EXISTS "Admins can update topics" ON topics;
CREATE POLICY "Admins can update topics" ON topics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Fix Soft Delete
DROP POLICY IF EXISTS "Admins can soft-delete topics" ON topics;
CREATE POLICY "Admins can soft-delete topics" ON topics
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Fix Select (Admins can see all)
DROP POLICY IF EXISTS "Admins can see all topics" ON topics;
CREATE POLICY "Admins can see all topics" ON topics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- =============================================================================
-- ARTICLES
-- =============================================================================

-- Fix Create
DROP POLICY IF EXISTS "Admins can create articles" ON articles;
CREATE POLICY "Admins can create articles" ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Fix Update
DROP POLICY IF EXISTS "Admins can update articles" ON articles;
CREATE POLICY "Admins can update articles" ON articles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Fix Soft Delete
DROP POLICY IF EXISTS "Admins can soft-delete articles" ON articles;
CREATE POLICY "Admins can soft-delete articles" ON articles
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Fix Select (Admins can see all)
DROP POLICY IF EXISTS "Admins can see all articles" ON articles;
CREATE POLICY "Admins can see all articles" ON articles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- =============================================================================
-- COMPUTER_PARTS
-- =============================================================================

-- Fix Create
DROP POLICY IF EXISTS "Admins can create computer_parts" ON computer_parts;
CREATE POLICY "Admins can create computer_parts" ON computer_parts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Fix Update
DROP POLICY IF EXISTS "Admins can update computer_parts" ON computer_parts;
CREATE POLICY "Admins can update computer_parts" ON computer_parts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Fix Soft Delete
DROP POLICY IF EXISTS "Admins can soft-delete computer_parts" ON computer_parts;
CREATE POLICY "Admins can soft-delete computer_parts" ON computer_parts
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Fix Select (Admins can see all)
DROP POLICY IF EXISTS "Admins can see all computer_parts" ON computer_parts;
CREATE POLICY "Admins can see all computer_parts" ON computer_parts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- =============================================================================
-- ACTIVITY_LOGS
-- =============================================================================

-- Fix Select
DROP POLICY IF EXISTS "Admins can read activity logs" ON activity_logs;
CREATE POLICY "Admins can read activity logs" ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- =============================================================================
-- STORAGE_METRICS
-- =============================================================================

-- Fix Select
DROP POLICY IF EXISTS "Admins can read storage metrics" ON storage_metrics;
CREATE POLICY "Admins can read storage metrics" ON storage_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
