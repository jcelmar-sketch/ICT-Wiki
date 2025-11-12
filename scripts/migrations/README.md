# Admin Dashboard Database Migrations

This directory contains SQL migration scripts for the ICT-Wiki Admin Dashboard feature.

## Overview

Three migration scripts must be run in order against your Supabase database:

1. **001_create_admin_tables.sql** - Creates core admin tables and extends existing tables
2. **002_admin_rls_policies.sql** - Enables Row Level Security and creates access policies
3. **003_admin_triggers.sql** - Creates activity logging triggers and utility functions

## Prerequisites

- Supabase project with existing `articles`, `parts`, and `categories` tables
- Admin access to Supabase SQL Editor or CLI
- Service role key (for programmatic execution)

## How to Run Migrations

### Option 1: Supabase Dashboard (SQL Editor)

1. Log in to your Supabase project at https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the contents of `001_create_admin_tables.sql`
5. Paste into the SQL Editor and click **Run**
6. Verify success by checking the "Results" panel
7. Repeat for `002_admin_rls_policies.sql` and `003_admin_triggers.sql` in order

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Run migrations in order
supabase db push --file scripts/migrations/001_create_admin_tables.sql
supabase db push --file scripts/migrations/002_admin_rls_policies.sql
supabase db push --file scripts/migrations/003_admin_triggers.sql
```

### Option 3: PostgreSQL Client (psql)

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations in order
\i scripts/migrations/001_create_admin_tables.sql
\i scripts/migrations/002_admin_rls_policies.sql
\i scripts/migrations/003_admin_triggers.sql
```

## Verification

After running all three migrations, verify success with these queries:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_users', 'activity_logs', 'storage_metrics');

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('admin_users', 'activity_logs', 'articles', 'parts', 'categories')
ORDER BY tablename, policyname;

-- Check triggers
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%audit_trigger' OR tgname LIKE 'prevent_%'
ORDER BY tgrelid::regclass, tgname;

-- Check storage metrics singleton
SELECT * FROM storage_metrics;
```

## Post-Migration Setup

### 1. Create Test Admin User

```sql
-- First, create user in Supabase Auth (Dashboard > Authentication > Users)
-- Or use Supabase client:
-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'admin@test.com',
--   password: 'admin123',
--   email_confirm: true
-- })

-- Then insert into admin_users table (replace UUID with actual user ID)
INSERT INTO admin_users (id, email, role)
VALUES ('<user-id-from-auth-users>', 'admin@test.com', 'admin');
```

### 2. Update Existing Articles (Optional)

If you have existing articles, update them to have the new fields:

```sql
-- Set all existing articles to published status
UPDATE articles 
SET status = 'published' 
WHERE status IS NULL;

-- Optionally set an admin as author for existing articles
UPDATE articles 
SET author_id = '<admin-user-id>' 
WHERE author_id IS NULL;
```

### 3. Test Activity Logging

```sql
-- Create a test article (should generate activity log)
INSERT INTO articles (title, slug, content, status) 
VALUES ('Test Article', 'test-article', 'Test content', 'draft');

-- Verify activity log was created
SELECT * FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 1;
```

## Rollback (Emergency)

If you need to rollback the migrations:

```sql
-- WARNING: This will delete all admin data!

-- Drop triggers
DROP TRIGGER IF EXISTS article_audit_trigger ON articles;
DROP TRIGGER IF EXISTS part_audit_trigger ON parts;
DROP TRIGGER IF EXISTS category_audit_trigger ON categories;
DROP TRIGGER IF EXISTS prevent_category_deletion ON categories;

-- Drop functions
DROP FUNCTION IF EXISTS log_article_changes();
DROP FUNCTION IF EXISTS log_part_changes();
DROP FUNCTION IF EXISTS log_category_changes();
DROP FUNCTION IF EXISTS prevent_category_deletion_with_articles();
DROP FUNCTION IF EXISTS update_storage_metrics();
DROP FUNCTION IF EXISTS jsonb_diff(JSONB, JSONB);
DROP FUNCTION IF EXISTS get_admin_email();

-- Drop admin tables
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS storage_metrics CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Remove columns from existing tables
ALTER TABLE articles DROP COLUMN IF EXISTS author_id;
ALTER TABLE articles DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE articles DROP COLUMN IF EXISTS status;
ALTER TABLE parts DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE categories DROP COLUMN IF EXISTS deleted_at;
```

## Troubleshooting

### Error: "relation already exists"

The migrations use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, so this should not occur. If it does, it means tables already exist - verify they have the correct schema.

### Error: "column already exists"

The migrations use `ADD COLUMN IF NOT EXISTS`, so this should not occur. If it does, verify the existing columns match the expected schema.

### Error: "role 'authenticated' does not exist"

This means you're not running against a Supabase database. Supabase creates the `authenticated` and `service_role` roles automatically.

### RLS Blocking Admin Actions

If admins can't perform actions after RLS is enabled:

1. Verify the JWT token includes `"role": "admin"` claim
2. Check policies with: `SELECT * FROM pg_policies WHERE tablename = 'admin_users';`
3. Test with service role temporarily to isolate RLS issues

## Support

For issues with these migrations:

1. Check Supabase logs: Dashboard > Database > Logs
2. Review the [Supabase Docs](https://supabase.com/docs)
3. Contact the project maintainer

---

**Last Updated**: 2025-11-12
**Feature**: Admin Dashboard (002-admin-dashboard)
**Author**: ICT-Wiki Team
