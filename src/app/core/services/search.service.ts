/**
 * Search Service
 * Task T022: Client-side fuzzy search using Fuse.js
 *
 * Provides unified search across articles and computer parts
 * with configurable threshold and field weights.
 */

import { Injectable } from '@angular/core';
import Fuse, { FuseResult } from 'fuse.js';
import { Article } from '../models/article.model';
import { ComputerPart } from '../models/computer-part.model';
import {
  SearchResult,
  ArticleSearchResult,
  PartSearchResult,
  SearchQuery,
} from '../models/search-result.model';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private articleFuse: Fuse<Article> | null = null;
  private partFuse: Fuse<ComputerPart> | null = null;
  private articles: Article[] = [];
  private parts: ComputerPart[] = [];

  // Fuse.js configuration per spec (threshold 0.3-0.4)
  private readonly FUSE_OPTIONS_ARTICLES: any = {
    keys: [
      { name: 'title', weight: 0.6 }, // Title most important
      { name: 'content', weight: 0.3 }, // Content secondary
      { name: 'excerpt', weight: 0.1 }, // Excerpt tertiary
    ],
    threshold: 0.35, // Balance between fuzzy and exact matching
    includeScore: true,
    includeMatches: true, // Enable match highlighting
    minMatchCharLength: 2,
    ignoreLocation: true, // Search entire fields
  };

  private readonly FUSE_OPTIONS_PARTS: any = {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'description', weight: 0.2 },
      { name: 'manufacturer', weight: 0.1 },
    ],
    threshold: 0.35,
    includeScore: true,
    includeMatches: true, // Enable match highlighting
    minMatchCharLength: 2,
    ignoreLocation: true,
  };

  /**
   * Index articles for searching
   * Should be called when articles are loaded from Supabase
   * @param articles Array of articles to index
   */
  indexArticles(articles: Article[]): void {
    this.articles = articles;
    this.articleFuse = new Fuse(articles, this.FUSE_OPTIONS_ARTICLES);
  }

  /**
   * Index computer parts for searching
   * Should be called when parts are loaded from Supabase
   * @param parts Array of computer parts to index
   */
  indexParts(parts: ComputerPart[]): void {
    this.parts = parts;
    this.partFuse = new Fuse(parts, this.FUSE_OPTIONS_PARTS);
  }

  /**
   * Search articles with Fuse.js
   * @param query Search text
   * @param limit Maximum results (default: 50)
   * @returns Array of article search results with relevance scores
   */
  searchArticles(query: string, limit: number = 50): ArticleSearchResult[] {
    if (!this.articleFuse || !query.trim()) return [];

    const results: FuseResult<Article>[] = this.articleFuse.search(query, { limit });

    return results.map(result => {
      const matches = this.extractMatches(result.matches);
      
      return {
        type: 'article' as const,
        id: result.item.id,
        title: result.item.title,
        slug: result.item.slug,
        excerpt: result.item.excerpt,
        image: result.item.cover_image,
        topic_name: '', // Will be populated by caller with join
        topic_slug: '',
        published_at: result.item.published_at,
        relevance_score: result.score ?? 1,
        matches,
      };
    });
  }

  /**
   * Search computer parts with Fuse.js
   * @param query Search text
   * @param limit Maximum results (default: 50)
   * @returns Array of part search results with relevance scores
   */
  searchParts(query: string, limit: number = 50): PartSearchResult[] {
    if (!this.partFuse || !query.trim()) return [];

    const results: FuseResult<ComputerPart>[] = this.partFuse.search(query, { limit });

    return results.map(result => {
      const matches = this.extractMatches(result.matches);
      
      return {
        type: 'part' as const,
        id: result.item.id,
        title: result.item.name,
        slug: result.item.slug,
        excerpt: result.item.description,
        image: result.item.image_url,
        category: result.item.category,
        manufacturer: result.item.manufacturer,
        relevance_score: result.score ?? 1,
        matches,
      };
    });
  }

  /**
   * Unified search across articles and parts
   * @param searchQuery Search query with optional filters
   * @returns Combined and sorted search results
   */
  search(searchQuery: SearchQuery): SearchResult[] {
    const { query, filters, limit = 50 } = searchQuery;

    if (!query.trim()) return [];

    let results: SearchResult[] = [];

    // Search articles if no type filter or type is 'article'
    if (!filters?.type || filters.type === 'article') {
      const articleResults = this.searchArticles(query, limit);
      results.push(...articleResults);
    }

    // Search parts if no type filter or type is 'part'
    if (!filters?.type || filters.type === 'part') {
      const partResults = this.searchParts(query, limit);
      results.push(...partResults);
    }

    // Sort by relevance score (lower is better in Fuse.js)
    results.sort((a, b) => (a.relevance_score ?? 1) - (b.relevance_score ?? 1));

    // Apply limit
    return results.slice(0, limit);
  }

  /**
   * Check if search indexes are ready
   * @returns True if both article and part indexes exist
   */
  isReady(): boolean {
    return this.articleFuse !== null && this.partFuse !== null;
  }

  /**
   * Get number of indexed items
   * @returns Object with article and part counts
   */
  getIndexStats(): { articles: number; parts: number } {
    return {
      articles: this.articles.length ?? 0,
      parts: this.parts.length ?? 0,
    };
  }

  /**
   * Clear search indexes
   * Use when re-indexing or clearing cache
   */
  clearIndexes(): void {
    this.articleFuse = null;
    this.partFuse = null;
    this.articles = [];
    this.parts = [];
  }

  /**
   * Extract match ranges from Fuse.js results
   * @param matches Fuse.js match array
   * @returns Field matches object with ranges
   */
  private extractMatches(matches: readonly any[] | undefined): import('../models/search-result.model').FieldMatches | undefined {
    if (!matches || matches.length === 0) return undefined;

    const fieldMatches: import('../models/search-result.model').FieldMatches = {};

    for (const match of matches) {
      const fieldName = match.key as 'title' | 'excerpt' | 'content';
      if (!fieldMatches[fieldName]) {
        fieldMatches[fieldName] = [];
      }

      // Extract indices from Fuse.js match
      if (match.indices && match.indices.length > 0) {
        for (const [start, end] of match.indices) {
          fieldMatches[fieldName]!.push({ start, end: end + 1 }); // Fuse uses inclusive end
        }
      }
    }

    return Object.keys(fieldMatches).length > 0 ? fieldMatches : undefined;
  }

  /**
   * Highlight matched terms in text
   * @param text Original text
   * @param ranges Match ranges to highlight
   * @returns HTML string with highlighted matches
   */
  highlightMatches(text: string, ranges?: import('../models/search-result.model').MatchRange[]): string {
    if (!ranges || ranges.length === 0) return text;

    // Sort ranges by start position
    const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);

    let highlightedText = '';
    let lastIndex = 0;

    for (const range of sortedRanges) {
      // Add non-highlighted text before this match
      highlightedText += this.escapeHtml(text.substring(lastIndex, range.start));
      
      // Add highlighted match
      const matchedText = text.substring(range.start, range.end);
      highlightedText += `<mark class="search-highlight">${this.escapeHtml(matchedText)}</mark>`;
      
      lastIndex = range.end;
    }

    // Add remaining text
    highlightedText += this.escapeHtml(text.substring(lastIndex));

    return highlightedText;
  }

  /**
   * Escape HTML special characters
   * @param text Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
