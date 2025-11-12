-- Migration: 003_admin_triggers.sql
-- Purpose: Create activity logging triggers and utility functions
-- Date: 2025-11-12
-- Run this AFTER 002_admin_rls_policies.sql

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to get current admin user email from JWT
CREATE OR REPLACE FUNCTION get_admin_email()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() ->> 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate JSONB diff (simplified version)
CREATE OR REPLACE FUNCTION jsonb_diff(old_data JSONB, new_data JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}'::JSONB;
  key TEXT;
BEGIN
  FOR key IN SELECT jsonb_object_keys(new_data)
  LOOP
    IF old_data->key IS DISTINCT FROM new_data->key THEN
      result := result || jsonb_build_object(
        key,
        jsonb_build_object(
          'old', old_data->key,
          'new', new_data->key
        )
      );
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ARTICLE LOGGING TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION log_article_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_admin_email TEXT;
  v_action_type TEXT;
BEGIN
  -- Get admin info from current session
  v_admin_id := auth.uid();
  v_admin_email := COALESCE(get_admin_email(), 'system');
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if it's a status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action_type := CASE 
        WHEN NEW.status = 'published' THEN 'publish'
        WHEN NEW.status = 'draft' THEN 'unpublish'
        ELSE 'edit'
      END;
    -- Check if it's soft-delete
    ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action_type := 'delete';
    -- Check if it's restore
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action_type := 'restore';
    ELSE
      v_action_type := 'edit';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'permanent_delete';
  END IF;
  
  -- Insert activity log
  INSERT INTO activity_logs (
    admin_id,
    admin_email,
    action_type,
    item_type,
    item_id,
    item_title,
    notes
  ) VALUES (
    v_admin_id,
    v_admin_email,
    v_action_type,
    'article',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.title, OLD.title),
    CASE 
      WHEN TG_OP = 'UPDATE' THEN 
        jsonb_build_object('changes', jsonb_diff(to_jsonb(OLD), to_jsonb(NEW)))
      ELSE NULL
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS article_audit_trigger ON articles;
CREATE TRIGGER article_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON articles
FOR EACH ROW EXECUTE FUNCTION log_article_changes();

-- =============================================================================
-- COMPUTER_PART LOGGING TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION log_computer_part_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_admin_email TEXT;
  v_action_type TEXT;
BEGIN
  v_admin_id := auth.uid();
  v_admin_email := COALESCE(get_admin_email(), 'system');
  
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action_type := 'delete';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action_type := 'restore';
    ELSE
      v_action_type := 'edit';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'permanent_delete';
  END IF;
  
  INSERT INTO activity_logs (
    admin_id,
    admin_email,
    action_type,
    item_type,
    item_id,
    item_title,
    notes
  ) VALUES (
    v_admin_id,
    v_admin_email,
    v_action_type,
    'computer_part',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.name, OLD.name),
    CASE 
      WHEN TG_OP = 'UPDATE' THEN 
        jsonb_build_object('changes', jsonb_diff(to_jsonb(OLD), to_jsonb(NEW)))
      ELSE NULL
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS computer_part_audit_trigger ON computer_parts;
CREATE TRIGGER computer_part_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON computer_parts
FOR EACH ROW EXECUTE FUNCTION log_computer_part_changes();

-- =============================================================================
-- TOPIC LOGGING TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION log_topic_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_admin_email TEXT;
  v_action_type TEXT;
BEGIN
  v_admin_id := auth.uid();
  v_admin_email := COALESCE(get_admin_email(), 'system');
  
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action_type := 'delete';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action_type := 'restore';
    ELSE
      v_action_type := 'edit';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'permanent_delete';
  END IF;
  
  INSERT INTO activity_logs (
    admin_id,
    admin_email,
    action_type,
    item_type,
    item_id,
    item_title,
    notes
  ) VALUES (
    v_admin_id,
    v_admin_email,
    v_action_type,
    'topic',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.name, OLD.name),
    CASE 
      WHEN TG_OP = 'UPDATE' THEN 
        jsonb_build_object('changes', jsonb_diff(to_jsonb(OLD), to_jsonb(NEW)))
      ELSE NULL
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS topic_audit_trigger ON topics;
CREATE TRIGGER topic_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON topics
FOR EACH ROW EXECUTE FUNCTION log_topic_changes();

-- =============================================================================
-- CATEGORY DELETION PROTECTION TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_topic_deletion_with_articles()
RETURNS TRIGGER AS $$
DECLARE
  article_count INT;
BEGIN
  -- Count non-deleted articles in this topic
  SELECT COUNT(*) INTO article_count
  FROM articles
  WHERE topic_id = OLD.id AND deleted_at IS NULL;

  IF article_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete topic with % active articles. Reassign articles first.', article_count;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_topic_deletion ON topics;
CREATE TRIGGER prevent_topic_deletion
BEFORE DELETE ON topics
FOR EACH ROW
EXECUTE FUNCTION prevent_topic_deletion_with_articles();

-- =============================================================================
-- STORAGE METRICS UPDATE TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_storage_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate totals from storage.objects
  UPDATE storage_metrics
  SET 
    total_files = (SELECT COUNT(*) FROM storage.objects WHERE bucket_id IN ('articles', 'parts')),
    total_bytes = (SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0) FROM storage.objects WHERE bucket_id IN ('articles', 'parts')),
    last_updated = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger requires access to storage.objects table
-- Run this manually in Supabase SQL Editor with elevated permissions
-- DROP TRIGGER IF EXISTS storage_metrics_update ON storage.objects;
-- CREATE TRIGGER storage_metrics_update
-- AFTER INSERT OR DELETE ON storage.objects
-- FOR EACH ROW
-- EXECUTE FUNCTION update_storage_metrics();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Run these to verify triggers are created:
-- SELECT tgname, tgrelid::regclass, tgenabled FROM pg_trigger WHERE tgname LIKE '%audit_trigger' OR tgname LIKE 'prevent_%' ORDER BY tgrelid::regclass, tgname;

-- Test logging (should insert activity log entry):
-- INSERT INTO articles (title, slug, content, status) VALUES ('Test Article', 'test-article', 'Test content', 'draft');
-- SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 1;
