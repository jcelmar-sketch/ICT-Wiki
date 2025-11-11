# Supabase Database Schema

**Feature**: ICT Wiki Mobile App  
**Version**: 1.0.0  
**Date**: 2025-11-10

## Overview

This SQL migration creates the complete database schema for the ICT Wiki application including:
- Topics, Articles, Tags, and Computer Parts tables
- Junction tables for many-to-many relationships
- Indexes for performance optimization
- Row Level Security (RLS) policies for read-only access
- Full-text search indexes

## Migration Script

```sql
-- ============================================================================
-- ICT Wiki Database Schema Migration
-- Version: 1.0.0
-- Description: Initial schema for articles, parts, and taxonomy
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TOPICS TABLE
-- ============================================================================

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  "order" INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_topic_name_length CHECK (char_length(name) >= 3),
  CONSTRAINT chk_topic_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT chk_topic_order_positive CHECK ("order" > 0)
);

CREATE INDEX idx_topics_slug ON topics(slug);
CREATE INDEX idx_topics_order ON topics("order");

COMMENT ON TABLE topics IS 'High-level categories for organizing articles (Computer, Network, Software)';
COMMENT ON COLUMN topics.slug IS 'URL-friendly identifier for routing';
COMMENT ON COLUMN topics."order" IS 'Display order in navigation (1-based)';

-- ============================================================================
-- ARTICLES TABLE
-- ============================================================================

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  cover_image VARCHAR(500),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
  published_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  view_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  
  CONSTRAINT chk_title_length CHECK (char_length(title) BETWEEN 10 AND 255),
  CONSTRAINT chk_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT chk_content_length CHECK (char_length(content) >= 100),
  CONSTRAINT chk_excerpt_length CHECK (excerpt IS NULL OR char_length(excerpt) BETWEEN 10 AND 500),
  CONSTRAINT chk_cover_image_https CHECK (cover_image IS NULL OR cover_image LIKE 'https://%'),
  CONSTRAINT chk_published_not_future CHECK (published_at <= NOW()),
  CONSTRAINT chk_view_count_nonnegative CHECK (view_count >= 0)
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_topic_id ON articles(topic_id);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_featured ON articles(is_featured, published_at DESC) WHERE is_featured = TRUE;
CREATE INDEX idx_articles_updated_at ON articles(updated_at DESC);

-- Full-text search index
CREATE INDEX idx_articles_search ON articles USING GIN (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
);

COMMENT ON TABLE articles IS 'ICT knowledge articles with markdown content';
COMMENT ON COLUMN articles.content IS 'Markdown-formatted article content';
COMMENT ON COLUMN articles.excerpt IS 'Short summary auto-generated from content if not provided';
COMMENT ON COLUMN articles.is_featured IS 'Display on home screen featured section';

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TAGS TABLE
-- ============================================================================

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_tag_name_length CHECK (char_length(name) BETWEEN 2 AND 50),
  CONSTRAINT chk_tag_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_name ON tags(name);

COMMENT ON TABLE tags IS 'Keyword labels for cross-topic article discovery';

-- ============================================================================
-- ARTICLE_TAGS JUNCTION TABLE
-- ============================================================================

CREATE TABLE article_tags (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX idx_article_tags_article ON article_tags(article_id);
CREATE INDEX idx_article_tags_tag ON article_tags(tag_id);

COMMENT ON TABLE article_tags IS 'Many-to-many relationship between articles and tags';

-- Function to limit tags per article to 10
CREATE OR REPLACE FUNCTION check_article_tag_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM article_tags WHERE article_id = NEW.article_id) >= 10 THEN
    RAISE EXCEPTION 'Article cannot have more than 10 tags';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_article_tag_limit BEFORE INSERT ON article_tags
  FOR EACH ROW EXECUTE FUNCTION check_article_tag_limit();

-- ============================================================================
-- RELATED_ARTICLES JUNCTION TABLE
-- ============================================================================

CREATE TABLE related_articles (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  related_article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (article_id, related_article_id),
  CONSTRAINT chk_not_self_related CHECK (article_id != related_article_id),
  CONSTRAINT chk_order_range CHECK ("order" BETWEEN 1 AND 5),
  CONSTRAINT uniq_article_order UNIQUE (article_id, "order")
);

CREATE INDEX idx_related_articles_source ON related_articles(article_id, "order" ASC);
CREATE INDEX idx_related_articles_target ON related_articles(related_article_id);

COMMENT ON TABLE related_articles IS 'Defines related article relationships for "You may also like"';
COMMENT ON COLUMN related_articles."order" IS 'Display order (1-5, max 5 related articles)';

-- Function to limit related articles to 5
CREATE OR REPLACE FUNCTION check_related_article_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM related_articles WHERE article_id = NEW.article_id) >= 5 THEN
    RAISE EXCEPTION 'Article cannot have more than 5 related articles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_related_article_limit BEFORE INSERT ON related_articles
  FOR EACH ROW EXECUTE FUNCTION check_related_article_limit();

-- ============================================================================
-- COMPUTER_PARTS TABLE
-- ============================================================================

CREATE TABLE computer_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  image VARCHAR(500),
  specs_json JSONB NOT NULL,
  manufacturer VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_name_length CHECK (char_length(name) BETWEEN 5 AND 255),
  CONSTRAINT chk_parts_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT chk_description_length CHECK (char_length(description) BETWEEN 50 AND 500),
  CONSTRAINT chk_image_https CHECK (image IS NULL OR image LIKE 'https://%'),
  CONSTRAINT chk_manufacturer_length CHECK (manufacturer IS NULL OR char_length(manufacturer) BETWEEN 2 AND 100),
  CONSTRAINT chk_category_valid CHECK (
    category IN ('cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'cooling', 'case', 'peripherals')
  )
);

CREATE INDEX idx_parts_slug ON computer_parts(slug);
CREATE INDEX idx_parts_category ON computer_parts(category, name ASC);
CREATE INDEX idx_parts_manufacturer ON computer_parts(manufacturer) WHERE manufacturer IS NOT NULL;
CREATE INDEX idx_parts_updated_at ON computer_parts(updated_at DESC);

-- Full-text search index for parts
CREATE INDEX idx_parts_search ON computer_parts USING GIN (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- JSONB index for specs queries
CREATE INDEX idx_parts_specs ON computer_parts USING GIN (specs_json);

COMMENT ON TABLE computer_parts IS 'Computer hardware components with structured specifications';
COMMENT ON COLUMN computer_parts.specs_json IS 'Category-specific specifications in JSON format';

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON computer_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE related_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE computer_parts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (SELECT only)
CREATE POLICY "Enable read access for all users" ON topics
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON articles
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON article_tags
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON related_articles
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON computer_parts
  FOR SELECT USING (true);

-- No INSERT, UPDATE, DELETE policies defined = operations blocked for anonymous users

-- ============================================================================
-- SEED DATA: INITIAL TOPICS
-- ============================================================================

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
    'wifi-outline',
    2
  ),
  (
    'e5f7a9b1-c3d5-6e8f-0a2b-4c6d8e0f1a3b'::uuid,
    'Software',
    'software',
    'Software development, tools, and methodologies',
    'code-slash-outline',
    3
  );

-- ============================================================================
-- UTILITY VIEWS
-- ============================================================================

-- View: Articles with topic and tag count
CREATE VIEW articles_summary AS
SELECT 
  a.id,
  a.title,
  a.slug,
  a.excerpt,
  a.cover_image,
  a.published_at,
  a.view_count,
  a.is_featured,
  t.name AS topic_name,
  t.slug AS topic_slug,
  (SELECT COUNT(*) FROM article_tags WHERE article_id = a.id) AS tag_count,
  (SELECT COUNT(*) FROM related_articles WHERE article_id = a.id) AS related_count
FROM articles a
JOIN topics t ON a.topic_id = t.id;

COMMENT ON VIEW articles_summary IS 'Articles with denormalized topic info and counts';

-- View: Parts summary
CREATE VIEW parts_summary AS
SELECT 
  id,
  name,
  slug,
  category,
  description,
  image,
  manufacturer,
  specs_json,
  created_at
FROM computer_parts
ORDER BY category, name;

COMMENT ON VIEW parts_summary IS 'Computer parts ordered by category and name';

-- ============================================================================
-- PERFORMANCE FUNCTIONS
-- ============================================================================

-- Function: Get articles by topic with pagination
CREATE OR REPLACE FUNCTION get_articles_by_topic(
  p_topic_slug VARCHAR,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  slug VARCHAR,
  excerpt VARCHAR,
  cover_image VARCHAR,
  published_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.cover_image,
    a.published_at
  FROM articles a
  JOIN topics t ON a.topic_id = t.id
  WHERE t.slug = p_topic_slug
  ORDER BY a.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function: Search articles and parts
CREATE OR REPLACE FUNCTION search_content(
  p_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  result_type VARCHAR,
  id UUID,
  title VARCHAR,
  slug VARCHAR,
  excerpt VARCHAR,
  image VARCHAR,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  -- Search articles
  SELECT 
    'article'::VARCHAR AS result_type,
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.cover_image AS image,
    ts_rank(to_tsvector('english', a.title || ' ' || a.content), websearch_to_tsquery('english', p_query)) AS rank
  FROM articles a
  WHERE to_tsvector('english', a.title || ' ' || a.content) @@ websearch_to_tsquery('english', p_query)
  
  UNION ALL
  
  -- Search parts
  SELECT 
    'part'::VARCHAR AS result_type,
    p.id,
    p.name AS title,
    p.slug,
    p.description AS excerpt,
    p.image,
    ts_rank(to_tsvector('english', p.name || ' ' || p.description), websearch_to_tsquery('english', p_query)) AS rank
  FROM computer_parts p
  WHERE to_tsvector('english', p.name || ' ' || p.description) @@ websearch_to_tsquery('english', p_query)
  
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify schema
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('topics', 'articles', 'tags', 'article_tags', 'related_articles', 'computer_parts');
  
  IF table_count = 6 THEN
    RAISE NOTICE 'Migration successful: All 6 tables created';
  ELSE
    RAISE EXCEPTION 'Migration failed: Expected 6 tables, found %', table_count;
  END IF;
END $$;
```

## Usage Examples

### Query Featured Articles
```sql
SELECT id, title, slug, excerpt, cover_image, published_at
FROM articles
WHERE is_featured = TRUE
ORDER BY published_at DESC
LIMIT 5;
```

### Query Articles by Topic
```sql
SELECT * FROM get_articles_by_topic('network', 20, 0);
```

### Full-Text Search
```sql
SELECT * FROM search_content('TCP protocol networking', 50);
```

### Get Article with Relations
```sql
SELECT 
  a.*,
  t.name AS topic_name,
  ARRAY_AGG(DISTINCT tg.name) FILTER (WHERE tg.name IS NOT NULL) AS tags,
  (
    SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', ra.id,
        'title', ra.title,
        'slug', ra.slug
      ) ORDER BY rel."order"
    )
    FROM related_articles rel
    JOIN articles ra ON rel.related_article_id = ra.id
    WHERE rel.article_id = a.id
  ) AS related_articles
FROM articles a
JOIN topics t ON a.topic_id = t.id
LEFT JOIN article_tags at ON a.id = at.article_id
LEFT JOIN tags tg ON at.tag_id = tg.id
WHERE a.slug = 'your-article-slug'
GROUP BY a.id, t.name;
```

## Notes

- All timestamps are in UTC
- UUIDs generated server-side via `uuid_generate_v4()`
- RLS enforces read-only access (no write operations allowed for anonymous users)
- Full-text search uses English language stemming
- Indexes optimize common query patterns (latest, featured, by-topic, search)
- Triggers automatically update `updated_at` timestamps
- Constraints enforce data quality at database level
