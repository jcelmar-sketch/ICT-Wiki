# Data Model: ICT Wiki Mobile App

**Feature**: ICT Wiki Mobile App  
**Branch**: `001-ict-wiki-app`  
**Date**: 2025-11-10  
**Phase**: 1 - Data Modeling

## Overview

This document defines the data entities, relationships, and validation rules for the ICT Wiki application. The model supports read-only access to ICT articles and computer parts with support for categorization, search, and offline caching.

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│   Article   │────┐    │    Topic     │
│             │    │    │              │
│  - id       │    │    │  - id        │
│  - title    │    │    │  - name      │
│  - content  │    └───▶│  - slug      │
│  - topic_id │         │              │
└─────────────┘         └──────────────┘
      │                        
      │ many-to-many           
      │                        
┌─────▼─────┐          ┌──────────────┐
│    Tag    │          │ ComputerPart │
│           │          │              │
│  - id     │          │  - id        │
│  - name   │          │  - name      │
│  - slug   │          │  - category  │
└───────────┘          └──────────────┘
      │                        
      │ many-to-many           
      │ (article_tags)         
      │                        
┌─────▼─────────┐
│ ArticleTag    │
│               │
│  - article_id │
│  - tag_id     │
└───────────────┘

┌─────────────────────┐
│ RelatedArticle      │
│                     │
│  - article_id       │
│  - related_article_id│
│  - order            │
└─────────────────────┘
```

## Core Entities

### 1. Article

Represents an ICT knowledge article (Computer, Network, or Software topic).

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier |
| title | VARCHAR(255) | NOT NULL, UNIQUE | Article title |
| slug | VARCHAR(255) | NOT NULL, UNIQUE, INDEX | URL-friendly identifier |
| content | TEXT | NOT NULL | Markdown content |
| excerpt | VARCHAR(500) | NULL | Short summary for lists/cards |
| cover_image | VARCHAR(500) | NULL | URL to cover image |
| topic_id | UUID | FOREIGN KEY → topics(id), NOT NULL, INDEX | Topic category reference |
| published_at | TIMESTAMP | NOT NULL, INDEX | Publication date |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| view_count | INTEGER | NOT NULL, DEFAULT 0 | Number of views (optional analytics) |
| is_featured | BOOLEAN | NOT NULL, DEFAULT FALSE, INDEX | Featured on home screen |

**Validation Rules**:
- `title`: 10-255 characters, must not contain special chars that break URLs
- `slug`: Lowercase, alphanumeric + hyphens only, must be derived from title
- `content`: Markdown format, minimum 100 characters
- `excerpt`: Auto-generated from first 500 chars of content if not provided
- `cover_image`: Valid URL format, HTTPS only, must be accessible
- `published_at`: Cannot be in the future
- `view_count`: Non-negative integer

**Indexes**:
- Primary: `id`
- Unique: `slug`
- Foreign Key: `topic_id`
- Query: `published_at DESC` (for latest articles)
- Query: `is_featured = TRUE, published_at DESC` (home featured)
- Full-text: `title, content` (for search)

**Example**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Understanding TCP/IP Protocol Stack",
  "slug": "understanding-tcp-ip-protocol-stack",
  "content": "# TCP/IP Overview\n\nThe TCP/IP protocol...",
  "excerpt": "Learn about the fundamental networking protocol that powers the internet.",
  "cover_image": "https://cdn.example.com/images/tcp-ip.jpg",
  "topic_id": "topic-uuid-network",
  "published_at": "2025-11-01T10:00:00Z",
  "created_at": "2025-10-28T15:30:00Z",
  "updated_at": "2025-11-01T10:00:00Z",
  "view_count": 342,
  "is_featured": true
}
```

---

### 2. Topic

Represents a high-level category for organizing articles (Computer, Network, Software).

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Topic name |
| slug | VARCHAR(100) | NOT NULL, UNIQUE, INDEX | URL-friendly identifier |
| description | TEXT | NULL | Topic description |
| icon | VARCHAR(50) | NULL | Icon identifier (e.g., "desktop", "network") |
| order | INTEGER | NOT NULL, UNIQUE | Display order |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Validation Rules**:
- `name`: 3-100 characters, capitalized
- `slug`: Lowercase, alphanumeric + hyphens
- `order`: Positive integer, unique across topics
- `icon`: Valid Ionic icon name from library

**Indexes**:
- Primary: `id`
- Unique: `slug`, `name`, `order`

**Seed Data** (Initial Topics):
```json
[
  {
    "id": "topic-uuid-computer",
    "name": "Computer",
    "slug": "computer",
    "description": "Computer hardware, architecture, and systems",
    "icon": "desktop-outline",
    "order": 1
  },
  {
    "id": "topic-uuid-network",
    "name": "Network",
    "slug": "network",
    "description": "Networking protocols, infrastructure, and security",
    "icon": "wifi-outline",
    "order": 2
  },
  {
    "id": "topic-uuid-software",
    "name": "Software",
    "slug": "software",
    "description": "Software development, tools, and methodologies",
    "icon": "code-slash-outline",
    "order": 3
  }
]
```

---

### 3. Tag

Represents keyword labels for cross-topic article discovery.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Tag name |
| slug | VARCHAR(50) | NOT NULL, UNIQUE, INDEX | URL-friendly identifier |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Validation Rules**:
- `name`: 2-50 characters, lowercase preferred
- `slug`: Lowercase, alphanumeric + hyphens
- Tag names should be consistent (e.g., "security" not "Security" and "security-related")

**Indexes**:
- Primary: `id`
- Unique: `slug`, `name`

**Example**:
```json
{
  "id": "tag-uuid-1",
  "name": "networking",
  "slug": "networking",
  "created_at": "2025-10-15T12:00:00Z"
}
```

---

### 4. ArticleTag (Junction Table)

Many-to-many relationship between Articles and Tags.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| article_id | UUID | FOREIGN KEY → articles(id), NOT NULL | Article reference |
| tag_id | UUID | FOREIGN KEY → tags(id), NOT NULL | Tag reference |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Validation Rules**:
- Unique pair: (`article_id`, `tag_id`) - no duplicate tags on same article
- Maximum 10 tags per article

**Indexes**:
- Composite Primary: (`article_id`, `tag_id`)
- Foreign Keys: `article_id`, `tag_id`

**Example**:
```json
{
  "article_id": "article-uuid-1",
  "tag_id": "tag-uuid-networking",
  "created_at": "2025-11-01T10:00:00Z"
}
```

---

### 5. RelatedArticle (Junction Table)

Defines related article relationships for "You may also like" features.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| article_id | UUID | FOREIGN KEY → articles(id), NOT NULL | Source article |
| related_article_id | UUID | FOREIGN KEY → articles(id), NOT NULL | Related article reference |
| order | INTEGER | NOT NULL | Display order (1-based) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Validation Rules**:
- `article_id` ≠ `related_article_id` (cannot relate to self)
- Unique pair: (`article_id`, `related_article_id`)
- Unique order per article: (`article_id`, `order`)
- Maximum 5 related articles per article
- Order must be 1-5

**Indexes**:
- Composite Primary: (`article_id`, `related_article_id`)
- Foreign Keys: `article_id`, `related_article_id`
- Query: `article_id, order ASC`

**Example**:
```json
{
  "article_id": "article-uuid-tcp-ip",
  "related_article_id": "article-uuid-osi-model",
  "order": 1,
  "created_at": "2025-11-01T10:00:00Z"
}
```

---

### 6. ComputerPart

Represents a computer hardware component with specifications.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Part name |
| slug | VARCHAR(255) | NOT NULL, UNIQUE, INDEX | URL-friendly identifier |
| category | VARCHAR(50) | NOT NULL, INDEX | Part category (CPU, GPU, RAM, etc.) |
| description | VARCHAR(500) | NOT NULL | Short description |
| image | VARCHAR(500) | NULL | URL to part image |
| specs_json | JSONB | NOT NULL | Structured specifications |
| manufacturer | VARCHAR(100) | NULL, INDEX | Manufacturer name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Validation Rules**:
- `name`: 5-255 characters
- `slug`: Lowercase, alphanumeric + hyphens
- `category`: Must be one of predefined categories (see Category Enum below)
- `description`: 50-500 characters
- `image`: Valid URL, HTTPS only
- `specs_json`: Valid JSON with required keys based on category
- `manufacturer`: 2-100 characters if provided

**Category Enum**:
```typescript
enum PartCategory {
  CPU = 'cpu',
  GPU = 'gpu',
  RAM = 'ram',
  STORAGE = 'storage',
  MOTHERBOARD = 'motherboard',
  PSU = 'psu',
  COOLING = 'cooling',
  CASE = 'case',
  PERIPHERALS = 'peripherals'
}
```

**Indexes**:
- Primary: `id`
- Unique: `slug`
- Query: `category, name ASC`
- Query: `manufacturer`
- Full-text: `name, description` (for search)

**specs_json Schema** (varies by category):

```typescript
// CPU Example
interface CPUSpecs {
  cores: number;
  threads: number;
  base_clock: string; // e.g., "3.6 GHz"
  boost_clock: string; // e.g., "5.0 GHz"
  socket: string; // e.g., "LGA1700"
  tdp: string; // e.g., "125W"
  cache: string; // e.g., "30MB L3"
  integrated_graphics?: string;
}

// GPU Example
interface GPUSpecs {
  memory: string; // e.g., "16GB GDDR6"
  memory_bus: string; // e.g., "256-bit"
  core_clock: string; // e.g., "2.5 GHz"
  cuda_cores?: number; // NVIDIA
  stream_processors?: number; // AMD
  tdp: string; // e.g., "320W"
  outputs: string[]; // e.g., ["HDMI 2.1", "DisplayPort 1.4"]
}

// RAM Example
interface RAMSpecs {
  capacity: string; // e.g., "16GB"
  type: string; // e.g., "DDR5"
  speed: string; // e.g., "6000 MHz"
  cas_latency: string; // e.g., "CL36"
  voltage: string; // e.g., "1.35V"
  form_factor: string; // e.g., "DIMM"
}
```

**Example**:
```json
{
  "id": "part-uuid-1",
  "name": "Intel Core i9-13900K",
  "slug": "intel-core-i9-13900k",
  "category": "cpu",
  "description": "High-performance 24-core desktop processor with hybrid architecture",
  "image": "https://cdn.example.com/parts/i9-13900k.jpg",
  "manufacturer": "Intel",
  "specs_json": {
    "cores": 24,
    "threads": 32,
    "base_clock": "3.0 GHz",
    "boost_clock": "5.8 GHz",
    "socket": "LGA1700",
    "tdp": "125W",
    "cache": "36MB L3",
    "integrated_graphics": "Intel UHD Graphics 770"
  },
  "created_at": "2025-10-20T14:00:00Z",
  "updated_at": "2025-10-20T14:00:00Z"
}
```

---

## Database Schema (PostgreSQL)

### SQL Schema Definition

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Topics Table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  "order" INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_topics_slug ON topics(slug);

-- Articles Table
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
  CONSTRAINT chk_published_not_future CHECK (published_at <= NOW())
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_topic_id ON articles(topic_id);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_featured ON articles(is_featured, published_at DESC) WHERE is_featured = TRUE;

-- Full-text search index for articles
CREATE INDEX idx_articles_search ON articles USING GIN (to_tsvector('english', title || ' ' || content));

-- Tags Table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);

-- Article-Tag Junction Table
CREATE TABLE article_tags (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX idx_article_tags_article ON article_tags(article_id);
CREATE INDEX idx_article_tags_tag ON article_tags(tag_id);

-- Related Articles Junction Table
CREATE TABLE related_articles (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  related_article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_id, related_article_id),
  CONSTRAINT chk_not_self_related CHECK (article_id != related_article_id),
  CONSTRAINT chk_order_range CHECK ("order" BETWEEN 1 AND 5),
  UNIQUE (article_id, "order")
);

CREATE INDEX idx_related_articles_source ON related_articles(article_id, "order" ASC);

-- Computer Parts Table
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
  CONSTRAINT chk_category CHECK (
    category IN ('cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'cooling', 'case', 'peripherals')
  )
);

CREATE INDEX idx_parts_slug ON computer_parts(slug);
CREATE INDEX idx_parts_category ON computer_parts(category, name ASC);
CREATE INDEX idx_parts_manufacturer ON computer_parts(manufacturer);

-- Full-text search index for parts
CREATE INDEX idx_parts_search ON computer_parts USING GIN (to_tsvector('english', name || ' ' || description));

-- Row Level Security Policies (Read-Only Access)
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE related_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE computer_parts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access only
CREATE POLICY "Enable read access for all users" ON topics FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON articles FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tags FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON article_tags FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON related_articles FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON computer_parts FOR SELECT USING (true);
```

---

## TypeScript Interfaces (Frontend)

```typescript
// src/app/core/models/topic.model.ts
export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  created_at: string;
}

// src/app/core/models/article.model.ts
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  topic_id: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  is_featured: boolean;
  // Joined data (when fetching with relations)
  topic?: Topic;
  tags?: Tag[];
  related_articles?: Article[];
}

// src/app/core/models/tag.model.ts
export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

// src/app/core/models/part.model.ts
export interface ComputerPart {
  id: string;
  name: string;
  slug: string;
  category: PartCategory;
  description: string;
  image: string | null;
  specs_json: Record<string, any>; // Category-specific specs
  manufacturer: string | null;
  created_at: string;
  updated_at: string;
}

export enum PartCategory {
  CPU = 'cpu',
  GPU = 'gpu',
  RAM = 'ram',
  STORAGE = 'storage',
  MOTHERBOARD = 'motherboard',
  PSU = 'psu',
  COOLING = 'cooling',
  CASE = 'case',
  PERIPHERALS = 'peripherals'
}

// src/app/core/models/search-result.model.ts
export type SearchResultType = 'article' | 'part';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string; // article.title or part.name
  slug: string;
  excerpt: string; // article.excerpt or part.description
  image: string | null;
  relevanceScore: number; // Fuse.js score
}
```

---

## Data Access Patterns

### Common Queries

**1. Fetch Latest Articles**:
```typescript
const { data, error } = await supabase
  .from('articles')
  .select('id, title, slug, excerpt, cover_image, published_at, topic:topics(name, slug)')
  .order('published_at', { ascending: false })
  .limit(20);
```

**2. Fetch Featured Articles for Home**:
```typescript
const { data, error } = await supabase
  .from('articles')
  .select('id, title, slug, excerpt, cover_image, published_at')
  .eq('is_featured', true)
  .order('published_at', { ascending: false })
  .limit(5);
```

**3. Fetch Article with Tags and Related**:
```typescript
const { data, error } = await supabase
  .from('articles')
  .select(`
    *,
    topic:topics(*),
    tags:article_tags(tag:tags(*)),
    related:related_articles(
      order,
      related:articles(id, title, slug, cover_image)
    )
  `)
  .eq('slug', articleSlug)
  .single();
```

**4. Fetch Articles by Topic**:
```typescript
const { data, error } = await supabase
  .from('articles')
  .select('id, title, slug, excerpt, cover_image, published_at')
  .eq('topic_id', topicId)
  .order('published_at', { ascending: false })
  .range(0, 19); // Pagination
```

**5. Fetch Parts by Category**:
```typescript
const { data, error } = await supabase
  .from('computer_parts')
  .select('id, name, slug, description, image, category, manufacturer')
  .eq('category', 'cpu')
  .order('name', { ascending: true })
  .range(0, 19);
```

**6. Full-Text Search Across Articles**:
```typescript
const { data, error } = await supabase
  .from('articles')
  .select('id, title, slug, excerpt, cover_image')
  .textSearch('title', query, { type: 'websearch', config: 'english' })
  .limit(50);
```

---

## Caching Strategy (IndexedDB Schema)

### Dexie.js Database Schema

```typescript
// src/app/core/services/cache.service.ts
import Dexie, { Table } from 'dexie';

export interface CachedArticle extends Article {
  cached_at: number; // Timestamp
}

export interface CachedPart extends ComputerPart {
  cached_at: number;
}

export class AppDatabase extends Dexie {
  articles!: Table<CachedArticle, string>;
  parts!: Table<CachedPart, string>;

  constructor() {
    super('ICTWikiDB');
    this.version(1).stores({
      articles: 'id, slug, topic_id, cached_at, is_featured',
      parts: 'id, slug, category, cached_at'
    });
  }
}

export const db = new AppDatabase();
```

**Cache Invalidation Rules**:
- Expire cached items after 7 days (604800000 ms)
- LRU eviction when IndexedDB quota exceeded (typically 50% of available storage)
- Clear cache on version mismatch (schema changes)
- Manual cache clear option in settings

---

## Validation Summary

**Data Integrity Enforced By**:
- Database constraints (NOT NULL, UNIQUE, CHECK, FOREIGN KEY)
- Supabase RLS policies (read-only access)
- Frontend TypeScript interfaces (type safety)
- Form validation in UI (Angular Validators)

**Security Enforced By**:
- RLS policies prevent write operations
- Full-text search prevents SQL injection (parameterized queries)
- Input validation on all user-facing fields (though read-only app)
- HTTPS-only image URLs

**Performance Optimized By**:
- Composite indexes on frequently queried columns
- GIN indexes for full-text search
- Pagination limits (20 items per page)
- Selective column fetching (not SELECT *)
- IndexedDB caching reduces network requests

---

## Next Steps

1. ✅ Complete data-model.md (this document)
2. ⏭️ Generate Supabase migration SQL in `/contracts/supabase/`
3. ⏭️ Create quickstart.md for setting up local Supabase instance
4. ⏭️ Update agent context with data model details
5. ⏭️ Re-run Constitution Check
