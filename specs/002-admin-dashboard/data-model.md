# Data Model: Admin Dashboard

**Feature**: Admin Dashboard  
**Date**: 2025-11-12  
**Status**: Phase 1 Design

## Overview

This document defines the database schema for the admin dashboard feature. All tables use PostgreSQL via Supabase with Row Level Security (RLS) policies to enforce access control.

**Design Principles**:
- Leverage existing `articles`, `parts`, `categories` tables from public app
- Add admin-specific tables: `admin_users`, `activity_logs`, `storage_metrics`
- Use soft-delete pattern with `deleted_at` timestamp
- Store structured data in JSONB for flexibility (specs, notes)
- Index frequently queried columns for performance

---

## Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│  admin_users    │         │  activity_logs  │
│─────────────────│         │─────────────────│
│ id (PK)         │────────<│ admin_id (FK)   │
│ email           │         │ created_at      │
│ role            │         │ action_type     │
│ failed_attempts │         │ item_type       │
│ locked_until    │         │ item_id         │
└─────────────────┘         │ notes (JSONB)   │
                            └─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│  articles       │         │  parts          │
│─────────────────│         │─────────────────│
│ id (PK)         │         │ id (PK)         │
│ title           │         │ name            │
│ slug (UNIQUE)   │         │ slug (UNIQUE)   │
│ category_id (FK)│─────┐   │ type            │
│ author_id (FK)  │     │   │ brand           │
│ content         │     │   │ specs (JSONB)   │
│ status          │     │   │ deleted_at      │
│ deleted_at      │     │   └─────────────────┘
└─────────────────┘     │
                        │   ┌─────────────────┐
                        └──>│  categories     │
                            │─────────────────│
                            │ id (PK)         │
                            │ name            │
                            │ slug (UNIQUE)   │
                            │ deleted_at      │
                            └─────────────────┘

┌─────────────────┐
│ storage_metrics │
│─────────────────│
│ id (PK)         │
│ total_files     │
│ total_bytes     │
│ quota_bytes     │
│ usage_percent   │
│ last_updated    │
└─────────────────┘
```

---

## Table Schemas

### 1. admin_users

Pre-provisioned administrator accounts. Authentication handled by Supabase Auth; this table stores admin-specific metadata.

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_locked ON admin_users(locked_until) WHERE locked_until IS NOT NULL;

-- RLS Policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can read their own profile
CREATE POLICY "Admins can read own profile" ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND auth.jwt() ->> 'role' = 'admin');

-- Super admins can read all profiles
CREATE POLICY "Super admins can read all" ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Admins can update their own profile (last_login_at)
CREATE POLICY "Admins can update own profile" ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.uid() = id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Fields**:
- `id`: Foreign key to `auth.users` (Supabase Auth UUID)
- `email`: Admin email address (must be unique, indexed for lookups)
- `role`: Admin privilege level (`admin` or `super_admin`)
- `failed_login_attempts`: Counter for account lockout logic
- `locked_until`: Timestamp when account unlocks (NULL if not locked)
- `last_login_at`: Timestamp of most recent successful login
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp (auto-updated via trigger)

**Relationships**:
- One-to-many with `activity_logs` (admin actions)
- One-to-many with `articles` via `author_id`

**Business Rules**:
- Maximum 5 failed login attempts before 15-minute lockout
- Lockout counter resets on successful login
- `role` determines dashboard permissions (future: super_admin can manage other admins)

---

### 2. activity_logs

Audit trail of all admin actions for compliance and debugging.

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'login_success', 'login_failure',
    'create', 'edit', 'delete',
    'publish', 'unpublish',
    'restore', 'permanent_delete'
  )),
  item_type TEXT CHECK (item_type IN ('article', 'part', 'category', NULL)),
  item_id UUID,
  item_title TEXT,
  ip_address INET,
  user_agent TEXT,
  notes JSONB,
  archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_admin_id ON activity_logs(admin_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_item_type ON activity_logs(item_type);
CREATE INDEX idx_activity_logs_archived ON activity_logs(archived) WHERE archived = FALSE;

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs (read-only audit trail)
CREATE POLICY "Admins can read activity logs" ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Only system (service role) can insert logs
CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

**Fields**:
- `id`: Primary key (auto-generated UUID)
- `created_at`: When action occurred (indexed for time-based queries)
- `admin_id`: Who performed the action (FK to `admin_users`)
- `admin_email`: Denormalized email for quick display (avoids JOIN)
- `action_type`: Type of action (login, CRUD operations)
- `item_type`: Type of affected item (`article`, `part`, `category`, or NULL for auth events)
- `item_id`: ID of affected item (NULL for auth events)
- `item_title`: Denormalized title for display
- `ip_address`: Source IP for security analysis
- `user_agent`: Browser/device info
- `notes`: Structured metadata (e.g., `{"changes": {"title": {"old": "Foo", "new": "Bar"}}}`)
- `archived`: Whether exported to cold storage (TRUE after 90-day export)

**Relationships**:
- Many-to-one with `admin_users`

**Business Rules**:
- Retention: 90 days in hot storage, then archived to Supabase Storage bucket `audit-archive`
- Export mechanism: Supabase Edge Function (`export-activity-logs`) runs daily at 2 AM UTC via pg_cron or Database Webhooks
- Export format: CSV files named `activity-logs-YYYY-MM-DD.csv` with columns: created_at, admin_email, action_type, item_type, item_id, item_title, ip_address, notes
- Exported logs marked with `archived = true` flag to exclude from future exports
- UI displays last 30 days by default (non-archived logs only)
- Immutable: Admins can only read, not modify (enforced by RLS)
- Auto-logged via database triggers for data changes, manually logged for auth events

---

### 3. articles (Extended)

Existing table from public app, extended with admin fields.

```sql
-- Existing table, add new columns
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES admin_users(id);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- Index for trash queries
CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);

-- RLS Policies (in addition to existing public read policy)

-- Admins can create articles
CREATE POLICY "Admins can create articles" ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can update articles
CREATE POLICY "Admins can update articles" ON articles
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can soft-delete articles (set deleted_at)
CREATE POLICY "Admins can soft-delete articles" ON articles
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' AND deleted_at IS NULL)
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Public can only see published, non-deleted articles (existing policy updated)
DROP POLICY IF EXISTS "Allow public read" ON articles;
CREATE POLICY "Allow public read published articles" ON articles
  FOR SELECT
  TO public
  USING (status = 'published' AND deleted_at IS NULL);

-- Admins can see all articles including drafts and deleted
CREATE POLICY "Admins can see all articles" ON articles
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Activity log trigger
CREATE TRIGGER article_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON articles
FOR EACH ROW
EXECUTE FUNCTION log_article_changes(); -- Function defined in research.md
```

**New Fields** (in addition to existing schema):
- `author_id`: Admin who created the article (FK to `admin_users`)
- `deleted_at`: Soft-delete timestamp (NULL if active)
- `status`: Publication status (`draft` or `published`)

**Existing Fields** (from public app schema):
- `id`: Primary key (UUID)
- `title`: Article title
- `slug`: URL-safe slug (unique)
- `category_id`: FK to `categories`
- `tags`: Array of tags or comma-separated
- `cover_image`: URL to Supabase Storage image
- `content`: Markdown content
- `rendered_html`: Cached HTML (for performance)
- `excerpt`: Short summary
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Business Rules**:
- Drafts visible only in admin dashboard, not public app
- Published articles visible immediately on public app
- Soft-deleted articles hidden from public app but visible in admin trash
- Permanent delete removes record and associated images after 30 days

---

### 4. parts (Extended)

Existing table from public app, extended with admin fields.

```sql
-- Existing table, add new columns
ALTER TABLE parts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index for trash queries
CREATE INDEX IF NOT EXISTS idx_parts_deleted_at ON parts(deleted_at) WHERE deleted_at IS NOT NULL;

-- RLS Policies
-- (Similar to articles: admins can CRUD, public can read non-deleted)

CREATE POLICY "Admins can create parts" ON parts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update parts" ON parts
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can soft-delete parts" ON parts
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' AND deleted_at IS NULL)
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Allow public read" ON parts;
CREATE POLICY "Allow public read active parts" ON parts
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

CREATE POLICY "Admins can see all parts" ON parts
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Activity log trigger
CREATE TRIGGER part_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON parts
FOR EACH ROW
EXECUTE FUNCTION log_part_changes();
```

**New Fields**:
- `deleted_at`: Soft-delete timestamp (NULL if active)

**Existing Fields** (from public app schema):
- `id`: Primary key (UUID)
- `name`: Part name
- `slug`: URL-safe slug (unique)
- `type`: Part type (e.g., "CPU", "GPU", "RAM")
- `brand`: Manufacturer name
- `images`: Array of URLs to Supabase Storage images
- `description`: Short description
- `specs`: JSONB structured specs with predefined common fields (CPU Speed, Cores, Threads, Base Clock, Boost Clock, TDP, RAM Size, RAM Type, RAM Speed, Storage Capacity, Storage Type, GPU Model, VRAM, Interface) plus custom fields. Example: `{"CPU Speed": "3.5 GHz", "Cores": "8", "TDP": "65W", "Custom Field": "Custom Value"}`
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Business Rules**:
- Specs stored as JSONB with predefined common fields + custom fields
- Multiple images supported (array of URLs)
- Soft-deleted parts hidden from public app but visible in admin trash

---

### 5. categories (Extended)

Existing table from public app, extended with admin fields.

```sql
-- Existing table, add new columns
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index for trash queries
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NOT NULL;

-- RLS Policies
-- (Similar to articles and parts)

CREATE POLICY "Admins can create categories" ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can soft-delete categories" ON categories
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' AND deleted_at IS NULL)
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Allow public read" ON categories;
CREATE POLICY "Allow public read active categories" ON categories
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

CREATE POLICY "Admins can see all categories" ON categories
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Activity log trigger
CREATE TRIGGER category_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW
EXECUTE FUNCTION log_category_changes();

-- Prevent deletion if articles exist
CREATE OR REPLACE FUNCTION prevent_category_deletion_with_articles()
RETURNS TRIGGER AS $$
DECLARE
  article_count INT;
BEGIN
  -- Count non-deleted articles in this category
  SELECT COUNT(*) INTO article_count
  FROM articles
  WHERE category_id = OLD.id AND deleted_at IS NULL;

  IF article_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete category with % active articles. Reassign articles first.', article_count;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_category_deletion
BEFORE DELETE ON categories
FOR EACH ROW
EXECUTE FUNCTION prevent_category_deletion_with_articles();
```

**New Fields**:
- `deleted_at`: Soft-delete timestamp (NULL if active)

**Existing Fields** (from public app schema):
- `id`: Primary key (UUID)
- `name`: Category name
- `slug`: URL-safe slug (unique)
- `description`: Category description
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Business Rules**:
- Flat structure (no parent-child hierarchy per clarification)
- Cannot delete category with active articles (enforced by trigger)
- Soft-deleted categories hidden from public app

---

### 6. storage_metrics

Tracks storage usage for quota monitoring.

```sql
CREATE TABLE storage_metrics (
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

-- Insert initial row (singleton table)
INSERT INTO storage_metrics (id) VALUES ('00000000-0000-0000-0000-000000000001');

-- RLS Policies
ALTER TABLE storage_metrics ENABLE ROW LEVEL SECURITY;

-- Admins can read storage metrics
CREATE POLICY "Admins can read storage metrics" ON storage_metrics
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- System can update storage metrics
CREATE POLICY "System can update storage metrics" ON storage_metrics
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update function called after image upload/delete
CREATE OR REPLACE FUNCTION update_storage_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate totals from storage.objects
  UPDATE storage_metrics
  SET 
    total_files = (SELECT COUNT(*) FROM storage.objects WHERE bucket_id IN ('articles', 'parts')),
    total_bytes = (SELECT COALESCE(SUM(metadata->>'size')::BIGINT, 0) FROM storage.objects WHERE bucket_id IN ('articles', 'parts')),
    last_updated = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on storage.objects table
CREATE TRIGGER storage_metrics_update
AFTER INSERT OR DELETE ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION update_storage_metrics();
```

**Fields**:
- `id`: Primary key (fixed UUID for singleton pattern)
- `total_files`: Count of all files in `articles` and `parts` buckets
- `total_bytes`: Sum of file sizes in bytes
- `quota_bytes`: Storage quota (5GB default, configurable)
- `usage_percent`: Calculated column (total_bytes / quota_bytes * 100)
- `last_updated`: Timestamp of last metrics update

**Business Rules**:
- Singleton table (only one row exists)
- Auto-updated via trigger on `storage.objects` table
- Dashboard displays warning if `usage_percent > 80`
- Prevents uploads if `usage_percent >= 100`

---

## Migration Scripts

### Initial Migration (001_create_admin_tables.sql)

```sql
-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_locked ON admin_users(locked_until) WHERE locked_until IS NOT NULL;

-- Create activity_logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'login_success', 'login_failure',
    'create', 'edit', 'delete',
    'publish', 'unpublish',
    'restore', 'permanent_delete'
  )),
  item_type TEXT CHECK (item_type IN ('article', 'part', 'category', NULL)),
  item_id UUID,
  item_title TEXT,
  ip_address INET,
  user_agent TEXT,
  notes JSONB,
  archived BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_admin_id ON activity_logs(admin_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_item_type ON activity_logs(item_type);
CREATE INDEX idx_activity_logs_archived ON activity_logs(archived) WHERE archived = FALSE;

-- Create storage_metrics table
CREATE TABLE storage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_files INT NOT NULL DEFAULT 0,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  quota_bytes BIGINT NOT NULL DEFAULT 5368709120,
  usage_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN quota_bytes > 0 THEN (total_bytes::NUMERIC / quota_bytes::NUMERIC * 100)
      ELSE 0
    END
  ) STORED,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO storage_metrics (id) VALUES ('00000000-0000-0000-0000-000000000001');

-- Extend existing tables
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES admin_users(id);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

ALTER TABLE parts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);

CREATE INDEX IF NOT EXISTS idx_parts_deleted_at ON parts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NOT NULL;
```

### RLS Policies Migration (002_admin_rls_policies.sql)

*See individual table schemas above for complete RLS policies*

### Triggers Migration (003_admin_triggers.sql)

*See research.md for trigger function definitions (`log_article_changes`, etc.)*

---

## Data Validation Rules

### Admin Users
- Email must be valid format (enforced by Supabase Auth)
- Role must be `admin` or `super_admin`
- `failed_login_attempts` resets to 0 on successful login
- `locked_until` must be future timestamp or NULL

### Activity Logs
- `action_type` must be one of predefined values
- `item_type` required if `item_id` provided
- `notes` must be valid JSON
- `created_at` immutable after insert

### Articles
- `slug` must be unique across non-deleted articles
- `status` must be `draft` or `published`
- `category_id` must reference existing non-deleted category
- `deleted_at` cannot be future timestamp

### Parts
- `slug` must be unique across non-deleted parts
- `specs` must be valid JSONB
- `images` array must contain valid URLs

### Categories
- `slug` must be unique across non-deleted categories
- Cannot be deleted if active articles reference it

### Storage Metrics
- `total_bytes` cannot exceed `quota_bytes` (enforced by upload validation)
- `usage_percent` auto-calculated, cannot be manually set

---

## Performance Considerations

### Query Optimization
- All timestamp columns indexed for date range queries
- `deleted_at` indexes use partial index (`WHERE deleted_at IS NOT NULL`) to reduce index size
- Activity logs use descending index on `created_at` for recent-first queries
- JSONB columns (`specs`, `notes`) can be indexed if query patterns emerge

### Caching Strategy
- Dashboard metrics cached for 5 minutes (application layer)
- Activity feed polled every 30 seconds (application layer)
- No database-level caching configured (Supabase handles this)

### Scalability
- Activity logs partition by `created_at` if table exceeds 10M rows (future optimization)
- Storage metrics singleton pattern avoids unnecessary rows
- Soft-delete avoids cascading deletes and preserves audit trail

---

## Testing Data

### Seed Script (test-data.sql)

```sql
-- Create test admin user (password: admin123)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@test.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  'authenticated'
);

INSERT INTO admin_users (id, email, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@test.com',
  'admin'
);

-- Create test category
INSERT INTO categories (id, name, slug)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Test Category',
  'test-category'
);

-- Create test article
INSERT INTO articles (id, title, slug, category_id, author_id, content, status)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Test Article',
  'test-article',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '# Test Article\n\nThis is test content.',
  'published'
);

-- Create test part
INSERT INTO parts (id, name, slug, type, brand, specs)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Test CPU',
  'test-cpu',
  'CPU',
  'Test Brand',
  '{"CPU Speed": "3.5 GHz", "Cores": "8", "TDP": "65W"}'::jsonb
);
```

---

## Migration Checklist

- [ ] Run `001_create_admin_tables.sql`
- [ ] Run `002_admin_rls_policies.sql`
- [ ] Run `003_admin_triggers.sql`
- [ ] Verify RLS policies with `SELECT * FROM pg_policies WHERE tablename IN ('admin_users', 'activity_logs', 'articles', 'parts', 'categories');`
- [ ] Test soft-delete: `UPDATE articles SET deleted_at = NOW() WHERE id = '...'`
- [ ] Test restore: `UPDATE articles SET deleted_at = NULL WHERE id = '...'`
- [ ] Verify activity logs auto-created on CRUD operations
- [ ] Test storage metrics update after file upload/delete
- [ ] Load test data with `test-data.sql`

---

**Data Model Status**: ✅ Complete  
**Reviewed By**: Auto-generated via `/speckit.plan`  
**Date**: 2025-11-12
