/**
 * Unified Search Result Model
 * Combines articles and computer parts for search results display
 */

/**
 * Search result type discriminator
 */
export type SearchResultType = 'article' | 'part';

/**
 * Match range for highlighting
 */
export interface MatchRange {
  start: number;
  end: number;
}

/**
 * Field matches for highlighting search terms
 */
export interface FieldMatches {
  title?: MatchRange[];
  excerpt?: MatchRange[];
  content?: MatchRange[];
}

/**
 * Base search result interface
 */
export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  slug: string;
  excerpt: string | null; // Description for parts
  image: string | null; // cover_image for articles, image for parts
  relevance_score?: number; // Fuse.js score (0-1, lower is better)
  matches?: FieldMatches; // Highlight ranges for matched terms
}

/**
 * Article search result
 * Includes topic information for context
 */
export interface ArticleSearchResult extends SearchResult {
  type: 'article';
  topic_name: string;
  topic_slug: string;
  published_at: string;
}

/**
 * Part search result
 * Includes category and manufacturer for context
 */
export interface PartSearchResult extends SearchResult {
  type: 'part';
  category: string;
  manufacturer: string | null;
}

/**
 * Search filters
 * User-selected filters for refining search results
 */
export interface SearchFilters {
  type?: SearchResultType; // Filter by article or part
  topic_id?: string; // Filter articles by topic
  category?: string; // Filter parts by category
  tags?: string[]; // Filter articles by tags
}

/**
 * Search query with filters
 */
export interface SearchQuery {
  query: string; // Search text
  filters?: SearchFilters;
  limit?: number; // Max results (default: 50)
}
