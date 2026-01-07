-- ============================================================================
-- Fix Admin Dashboard Issues
-- Version: 1.0.1
-- Date: 2025-12-09
-- Description: Fix display_order column and RLS policies for admin operations
-- ============================================================================

-- ============================================================================
-- 1. FIX TOPICS TABLE - Add display_order column
-- ============================================================================

-- Check if display_order exists, if not add it and migrate data from "order"
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'topics' AND column_name = 'display_order'
  ) THEN
    -- Add display_order column
    ALTER TABLE topics ADD COLUMN display_order INTEGER;
    
    -- Migrate data from "order" column if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'topics' AND column_name = 'order'
    ) THEN
      UPDATE topics SET display_order = "order";
      ALTER TABLE topics ALTER COLUMN display_order SET NOT NULL;
      ALTER TABLE topics ADD CONSTRAINT topics_display_order_unique UNIQUE (display_order);
      ALTER TABLE topics ADD CONSTRAINT chk_display_order_positive CHECK (display_order > 0);
    END IF;
  END IF;
END $$;

-- Create index on display_order
CREATE INDEX IF NOT EXISTS idx_topics_display_order ON topics(display_order);

COMMENT ON COLUMN topics.display_order IS 'Display order in navigation (1-based)';

-- ============================================================================
-- 2. FIX RLS POLICIES FOR ADMIN OPERATIONS
-- ============================================================================

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admin users can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin users can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON admin_users;

-- Activity Logs: Allow admin inserts
CREATE POLICY "Admin users can insert activity logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Admin Users: Allow admins to read their own and other admin data
CREATE POLICY "Admin users can read admin_users"
ON admin_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid()
  )
);

-- Admin Users: Allow admins to update admin_users (for email/password changes)
CREATE POLICY "Admin users can update admin_users"
ON admin_users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid()
  )
);

-- ============================================================================
-- 3. FIX STORAGE RLS POLICIES
-- ============================================================================

-- Allow authenticated admins to upload images
DROP POLICY IF EXISTS "Admin users can upload images" ON storage.objects;
CREATE POLICY "Admin users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('articles', 'parts', 'topics') AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Allow public read access to images
DROP POLICY IF EXISTS "Public users can view images" ON storage.objects;
CREATE POLICY "Public users can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('articles', 'parts', 'topics'));

-- Allow admins to update images
DROP POLICY IF EXISTS "Admin users can update images" ON storage.objects;
CREATE POLICY "Admin users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('articles', 'parts', 'topics') AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
)
WITH CHECK (
  bucket_id IN ('articles', 'parts', 'topics') AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Allow admins to delete images
DROP POLICY IF EXISTS "Admin users can delete images" ON storage.objects;
CREATE POLICY "Admin users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('articles', 'parts', 'topics') AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- ============================================================================
-- 4. CREATE STORAGE BUCKETS IF NOT EXISTS
-- ============================================================================

-- Create articles bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('articles', 'articles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Create parts bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('parts', 'parts', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Create topics bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('topics', 'topics', true, 2097152, ARRAY['image/svg+xml', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. VERIFY SETUP
-- ============================================================================

-- Check topics table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'topics' AND column_name IN ('order', 'display_order')
ORDER BY column_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('admin_users', 'activity_logs')
ORDER BY tablename, policyname;

-- Check storage buckets
SELECT id, name, public FROM storage.buckets
WHERE id IN ('articles', 'parts', 'topics');

COMMENT ON TABLE topics IS 'High-level categories - Updated to use display_order column';
