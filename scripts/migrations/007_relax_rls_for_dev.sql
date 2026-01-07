-- Migration: 007_relax_rls_for_dev.sql
-- Purpose: Relax RLS checks to avoid recursion errors during development
-- Date: 2026-01-07
-- Note: This migration intentionally uses simpler predicates (auth.uid() IS NOT NULL)
-- for environments where admin_users lookups cause recursive policy evaluation.

-- ADMIN_USERS: allow admins to INSERT their own profile (id must be auth.uid())
DROP POLICY IF EXISTS "Admins can insert own profile" ON admin_users;
CREATE POLICY "Admins can insert own profile" ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ACTIVITY_LOGS: allow any authenticated user to read and insert activity logs (dev-friendly)
DROP POLICY IF EXISTS "Admins can read activity logs" ON activity_logs;
CREATE POLICY "Admins can read activity logs" ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin users can insert activity logs" ON activity_logs;
CREATE POLICY "Admin users can insert activity logs" ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ARTICLES: use auth.uid() IS NOT NULL for admin checks (dev-friendly)
DROP POLICY IF EXISTS "Admins can create articles" ON articles;
CREATE POLICY "Admins can create articles" ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update articles" ON articles;
CREATE POLICY "Admins can update articles" ON articles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can see all articles" ON articles;
CREATE POLICY "Admins can see all articles" ON articles
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- COMPUTER_PARTS: relax admin checks
DROP POLICY IF EXISTS "Admins can create computer_parts" ON computer_parts;
CREATE POLICY "Admins can create computer_parts" ON computer_parts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update computer_parts" ON computer_parts;
CREATE POLICY "Admins can update computer_parts" ON computer_parts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can see all computer_parts" ON computer_parts;
CREATE POLICY "Admins can see all computer_parts" ON computer_parts
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- TOPICS: relax admin checks
DROP POLICY IF EXISTS "Admins can manage topics" ON topics;
CREATE POLICY "Admins can manage topics" ON topics
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- STORAGE: relax storage.object policies that referenced admin_users
DROP POLICY IF EXISTS "Admins can upload articles" ON storage.objects;
CREATE POLICY "Admins can upload articles" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'articles' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can delete parts" ON storage.objects;
CREATE POLICY "Admins can delete parts" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'parts' AND auth.uid() IS NOT NULL);

-- End of migration
