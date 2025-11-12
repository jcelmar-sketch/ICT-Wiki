-- ============================================================================
-- ICT Wiki Database Reset and Admin Setup
-- WARNING: This will DELETE ALL DATA in the database!
-- Use this script for development/testing purposes only.
-- ============================================================================

-- ============================================================================
-- STEP 1: Clear all existing data (in correct order due to foreign keys)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Starting database cleanup...';
END $$;

-- Delete data from tables with foreign key dependencies first
DELETE FROM related_articles;
DELETE FROM article_tags;
DELETE FROM activity_logs;
DELETE FROM storage_metrics;

-- Delete main content tables
DELETE FROM articles;
DELETE FROM computer_parts;
DELETE FROM tags;
DELETE FROM topics;

-- Delete admin users
DELETE FROM admin_users;

DO $$
BEGIN
  RAISE NOTICE 'All existing data has been cleared.';
END $$;

-- ============================================================================
-- STEP 2: Reset sequences (if any)
-- ============================================================================

-- No sequences to reset as we use UUIDs

-- ============================================================================
-- STEP 3: Create admin user
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Creating admin user...';
END $$;

-- Insert admin user
-- Password: Admin123! (you should change this after first login)
-- This is a bcrypt hash of "Admin123!" - you'll need to hash it properly
-- For now, this is a placeholder that works with Supabase Auth

INSERT INTO admin_users (
  id,
  email,
  role,
  created_at,
  updated_at,
  failed_login_attempts,
  locked_until,
  last_login_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin@ictwiki.local',
  'super_admin',
  NOW(),
  NOW(),
  0,
  NULL,
  NULL
)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW(),
  failed_login_attempts = 0,
  locked_until = NULL;

DO $$
BEGIN
  RAISE NOTICE 'Admin user created successfully.';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Admin Credentials:';
  RAISE NOTICE '  Email: admin@ictwiki.local';
  RAISE NOTICE '  Password: You need to set this via Supabase Auth';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'IMPORTANT: Create this user in Supabase Auth dashboard:';
  RAISE NOTICE '  1. Go to Supabase Dashboard > Authentication > Users';
  RAISE NOTICE '  2. Click "Add user" > "Create new user"';
  RAISE NOTICE '  3. Email: admin@ictwiki.local';
  RAISE NOTICE '  4. Password: Admin123! (or your preferred password)';
  RAISE NOTICE '  5. Auto Confirm User: Yes';
  RAISE NOTICE '----------------------------------------';
END $$;

-- ============================================================================
-- STEP 4: Insert sample topics (optional - for testing)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Creating sample topics...';
END $$;

INSERT INTO topics (id, name, slug, description, icon, "order") VALUES
  (
    'f7c9a3e1-8b4d-4c5e-a6f2-1d3e7b9c2a4f'::uuid,
    'Computer',
    'computer',
    'Computer hardware, architecture, and systems',
    'desktop-outline',
    1
  ),
  (
    'a2b4c6d8-1e3f-5a7b-9c0d-2e4f6a8b0c1d'::uuid,
    'Network',
    'network',
    'Networking protocols, infrastructure, and security',
    'share-social-outline',
    2
  ),
  (
    'e5f7a9b1-c3d5-6e8f-0a2b-4c6d8e0f1a3b'::uuid,
    'Software',
    'software',
    'Software development, tools, and methodologies',
    'code-slash-outline',
    3
  )
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Sample topics created.';
END $$;

-- ============================================================================
-- STEP 5: Verify setup
-- ============================================================================

DO $$
DECLARE
  admin_count INTEGER;
  topic_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM admin_users;
  SELECT COUNT(*) INTO topic_count FROM topics;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Database Reset Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Current database state:';
  RAISE NOTICE '  - Admin users: %', admin_count;
  RAISE NOTICE '  - Topics: %', topic_count;
  RAISE NOTICE '  - Articles: 0';
  RAISE NOTICE '  - Computer parts: 0';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create admin user in Supabase Auth (see above)';
  RAISE NOTICE '  2. Run seed-database.sql to populate sample data';
  RAISE NOTICE '  3. Login at /admin/login with admin@ictwiki.local';
  RAISE NOTICE '========================================';
END $$;
