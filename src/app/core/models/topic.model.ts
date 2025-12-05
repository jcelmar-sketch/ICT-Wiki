/**
 * Topic Entity Model
 * Matches Supabase topics table schema from data-model.md
 */

export interface Topic {
  id: string; // UUID
  name: string; // 3-100 chars (Computer, Network, Software)
  slug: string; // URL-friendly identifier (a-z0-9-)
  description: string | null; // Topic description
  icon: string | null; // Ionicon name (e.g., 'desktop-outline')
  order: number; // Display order (1-based, unique)
  created_at: string; // ISO 8601 timestamp
  deleted_at?: string | null; // Soft-delete timestamp
  article_count?: number; // Count of associated articles
}

/**
 * Topic navigation item
 * Used for topic selection UI
 */
export interface TopicNavItem {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  article_count?: number; // Optional: total articles in this topic
}
