/**
 * Article Entity Model
 * Matches Supabase articles table schema from data-model.md
 */

export interface Article {
  id: string; // UUID
  title: string; // 10-255 chars
  slug: string; // URL-friendly identifier
  content: string; // Markdown content (≥100 chars)
  excerpt: string | null; // Short summary (10-500 chars)
  cover_image: string | null; // HTTPS URL
  topic_id: string; // UUID reference to topics table
  published_at: string; // ISO 8601 timestamp
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  view_count: number; // Non-negative integer
  is_featured: boolean; // Display on home featured section
}

/**
 * Article with denormalized topic information
 * Used for list/card displays
 */
export interface ArticleWithTopic extends Article {
  topic_name: string;
  topic_slug: string;
}

/**
 * Article card display model
 * Minimal data for list/grid views
 */
export interface ArticleCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string;
  topic_name: string;
  topic_slug: string;
}

/**
 * Related article reference
 * Used in article detail "You may also like" section
 */
export interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  order: number; // 1-5
}

/**
 * Article admin model with extended fields (T054)
 * Includes soft-delete, draft status, and author tracking
 */
export interface ArticleAdmin extends Article {
  author_id: string | null; // UUID reference to admin_users
  status: 'draft' | 'published'; // Publication status
  deleted_at: string | null; // Soft-delete timestamp
}

/**
 * Article create/update DTO for admin
 */
export interface ArticleFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  topic_id: string;
  status: 'draft' | 'published';
  is_featured: boolean;
}
