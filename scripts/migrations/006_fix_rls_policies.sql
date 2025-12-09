-- Migration: 006_fix_rls_policies.sql
-- Purpose: Fix RLS policies to work without JWT custom claims
-- Date: 2025-12-09
-- Issue: Previous policies checked auth.jwt() ->> 'role' which Supabase doesn't set by default
-- Solution: Check admin_users table directly using auth.uid()

-- =============================================================================
-- ADMIN_USERS RLS POLICIES (FIXED)
-- =============================================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop old policies that checked JWT claims
DROP POLICY IF EXISTS "Admins can read own profile" ON admin_users;
DROP POLICY IF EXISTS "Super admins can read all" ON admin_users;
DROP POLICY IF EXISTS "Admins can update own profile" ON admin_users;

-- New policy: Admins can read their own profile
CREATE POLICY "Admins can read own profile" ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- New policy: Admins can update their own profile
CREATE POLICY "Admins can update own profile" ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- ACTIVITY_LOGS RLS POLICIES (FIXED)
-- =============================================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Admins can read activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;

-- New policy: Authenticated users (admins) can read all logs
CREATE POLICY "Admins can read activity logs" ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- New policy: Service role can insert logs (for triggers)
CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow inserts from authenticated admins
CREATE POLICY "Admins can insert activity logs" ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- ARTICLES RLS POLICIES (FIXED)
-- =============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can create articles" ON articles;
DROP POLICY IF EXISTS "Admins can update articles" ON articles;
DROP POLICY IF EXISTS "Admins can soft-delete articles" ON articles;
DROP POLICY IF EXISTS "Allow public read published articles" ON articles;
DROP POLICY IF EXISTS "Admins can see all articles" ON articles;

-- New policy: Admins can create articles
CREATE POLICY "Admins can create articles" ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- New policy: Admins can update articles
CREATE POLICY "Admins can update articles" ON articles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- New policy: Public can read published, non-deleted articles
CREATE POLICY "Public can read published articles" ON articles
  FOR SELECT
  TO public
  USING (status = 'published' AND deleted_at IS NULL);

-- New policy: Admins can see all articles
CREATE POLICY "Admins can see all articles" ON articles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- COMPUTER_PARTS RLS POLICIES (FIXED)
-- =============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can create computer_parts" ON computer_parts;
DROP POLICY IF EXISTS "Admins can update computer_parts" ON computer_parts;
DROP POLICY IF EXISTS "Admins can soft-delete computer_parts" ON computer_parts;
DROP POLICY IF EXISTS "Allow public read active computer_parts" ON computer_parts;

-- New policy: Admins can create computer_parts
CREATE POLICY "Admins can create computer_parts" ON computer_parts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- New policy: Admins can update computer_parts
CREATE POLICY "Admins can update computer_parts" ON computer_parts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- New policy: Public can read active computer_parts
CREATE POLICY "Public can read active computer_parts" ON computer_parts
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

-- New policy: Admins can see all computer_parts
CREATE POLICY "Admins can see all computer_parts" ON computer_parts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- TOPICS RLS POLICIES (ENSURE ENABLED)
-- =============================================================================

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Public can read all topics
CREATE POLICY IF NOT EXISTS "Public can read topics" ON topics
  FOR SELECT
  TO public
  USING (true);

-- Admins can manage topics
CREATE POLICY IF NOT EXISTS "Admins can manage topics" ON topics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- STORAGE RLS POLICIES (ENSURE ARTICLES BUCKET)
-- =============================================================================

-- Articles bucket: Admins can upload/read/delete
CREATE POLICY IF NOT EXISTS "Admins can upload articles" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'articles' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can read articles" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'articles');

CREATE POLICY IF NOT EXISTS "Admins can delete articles" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'articles' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Parts bucket: Similar policies
CREATE POLICY IF NOT EXISTS "Admins can upload parts" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'parts' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Public can read parts" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'parts');

CREATE POLICY IF NOT EXISTS "Admins can delete parts" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'parts' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );
