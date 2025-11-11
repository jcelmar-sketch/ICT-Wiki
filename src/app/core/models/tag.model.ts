/**
 * Tag Entity Model
 * Matches Supabase tags table schema from data-model.md
 */

export interface Tag {
  id: string; // UUID
  name: string; // 2-50 chars (e.g., 'TCP/IP', 'Wireless')
  slug: string; // URL-friendly identifier (a-z0-9-)
  created_at: string; // ISO 8601 timestamp
}

/**
 * Article-Tag relationship
 * Junction table model (max 10 tags per article)
 */
export interface ArticleTag {
  article_id: string; // UUID
  tag_id: string; // UUID
  created_at: string; // ISO 8601 timestamp
}

/**
 * Tag with article count
 * Used for filter UI and tag clouds
 */
export interface TagWithCount {
  id: string;
  name: string;
  slug: string;
  article_count: number;
}
