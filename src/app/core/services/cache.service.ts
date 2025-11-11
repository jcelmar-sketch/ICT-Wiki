/**
 * Cache Service
 * Tasks T019-T021: IndexedDB caching with 7-day TTL and LRU eviction
 *
 * Uses Dexie.js wrapper for IndexedDB to cache articles and parts
 * with automatic expiration and Least Recently Used (LRU) eviction.
 */

import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { environment } from '../../../environments/environment';
import { Article } from '../models/article.model';
import { ComputerPart } from '../models/computer-part.model';

/**
 * Cached article with metadata
 */
interface CachedArticle extends Article {
  cached_at: number; // Unix timestamp (milliseconds)
  access_count: number; // LRU tracking
  last_accessed: number; // Unix timestamp (milliseconds)
}

/**
 * Cached computer part with metadata
 */
interface CachedPart extends ComputerPart {
  cached_at: number;
  access_count: number;
  last_accessed: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  articles: {
    total: number;
    expired: number;
    size_bytes: number;
  };
  parts: {
    total: number;
    expired: number;
    size_bytes: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CacheService extends Dexie {
  articles!: Table<CachedArticle, string>;
  parts!: Table<CachedPart, string>;

  private readonly EXPIRY_MS = environment.cacheExpiryDays * 24 * 60 * 60 * 1000; // 7 days in ms
  private readonly MAX_STORAGE_MB = 50; // Conservative IndexedDB quota
  private readonly MAX_STORAGE_BYTES = this.MAX_STORAGE_MB * 1024 * 1024;

  constructor() {
    super('ICTWikiCache');

    // Define IndexedDB schema (T020)
    this.version(1).stores({
      articles: 'id, cached_at, access_count, last_accessed, topic_id, is_featured',
      parts: 'id, cached_at, access_count, last_accessed, category, manufacturer',
    });
  }

  //
  // Article Cache Methods
  //

  /**
   * Get article from cache
   * @param id Article UUID
   * @returns Cached article or null if not found/expired
   */
  async getArticle(id: string): Promise<Article | null> {
    const cached = await this.articles.get(id);
    if (!cached) return null;

    // Check if expired
    if (this.isExpired(cached.cached_at)) {
      await this.articles.delete(id);
      return null;
    }

    // Update LRU metadata
    await this.articles.update(id, {
      access_count: cached.access_count + 1,
      last_accessed: Date.now(),
    });

    // Remove cache metadata before returning
    const { cached_at, access_count, last_accessed, ...article } = cached;
    return article;
  }

  /**
   * Cache an article
   * @param article Article to cache
   */
  async cacheArticle(article: Article): Promise<void> {
    const cached: CachedArticle = {
      ...article,
      cached_at: Date.now(),
      access_count: 1,
      last_accessed: Date.now(),
    };

    await this.articles.put(cached);
    await this.evictIfNeeded();
  }

  /**
   * Get multiple articles from cache
   * @param ids Array of article UUIDs
   * @returns Array of cached articles (excluding expired ones)
   */
  async getArticles(ids: string[]): Promise<Article[]> {
    const articles: Article[] = [];
    for (const id of ids) {
      const article = await this.getArticle(id);
      if (article) articles.push(article);
    }
    return articles;
  }

  //
  // Computer Part Cache Methods
  //

  /**
   * Get computer part from cache
   * @param id Part UUID
   * @returns Cached part or null if not found/expired
   */
  async getPart(id: string): Promise<ComputerPart | null> {
    const cached = await this.parts.get(id);
    if (!cached) return null;

    if (this.isExpired(cached.cached_at)) {
      await this.parts.delete(id);
      return null;
    }

    await this.parts.update(id, {
      access_count: cached.access_count + 1,
      last_accessed: Date.now(),
    });

    const { cached_at, access_count, last_accessed, ...part } = cached;
    return part;
  }

  /**
   * Cache a computer part
   * @param part Computer part to cache
   */
  async cachePart(part: ComputerPart): Promise<void> {
    const cached: CachedPart = {
      ...part,
      cached_at: Date.now(),
      access_count: 1,
      last_accessed: Date.now(),
    };

    await this.parts.put(cached);
    await this.evictIfNeeded();
  }

  /**
   * Get multiple parts from cache
   * @param ids Array of part UUIDs
   * @returns Array of cached parts (excluding expired ones)
   */
  async getParts(ids: string[]): Promise<ComputerPart[]> {
    const parts: ComputerPart[] = [];
    for (const id of ids) {
      const part = await this.getPart(id);
      if (part) parts.push(part);
    }
    return parts;
  }

  //
  // Cache Management (T021)
  //

  /**
   * Check if cached item is expired
   * @param cachedAt Unix timestamp in milliseconds
   * @returns True if item is older than 7 days
   */
  private isExpired(cachedAt: number): boolean {
    return Date.now() - cachedAt > this.EXPIRY_MS;
  }

  /**
   * Remove expired items from cache
   * @returns Number of items removed
   */
  async clearExpired(): Promise<number> {
    const cutoff = Date.now() - this.EXPIRY_MS;
    
    const expiredArticles = await this.articles
      .where('cached_at')
      .below(cutoff)
      .delete();

    const expiredParts = await this.parts
      .where('cached_at')
      .below(cutoff)
      .delete();

    return expiredArticles + expiredParts;
  }

  /**
   * Evict least recently used items if storage quota exceeded
   * LRU eviction based on access_count and last_accessed
   */
  private async evictIfNeeded(): Promise<void> {
    const stats = await this.getStats();
    const totalSize = stats.articles.size_bytes + stats.parts.size_bytes;

    if (totalSize > this.MAX_STORAGE_BYTES) {
      // First, clear expired items
      await this.clearExpired();

      // If still over quota, evict LRU items
      const updatedStats = await this.getStats();
      const updatedSize = updatedStats.articles.size_bytes + updatedStats.parts.size_bytes;

      if (updatedSize > this.MAX_STORAGE_BYTES) {
        await this.evictLRU(10); // Remove 10 least recently used items
      }
    }
  }

  /**
   * Evict least recently used items
   * @param count Number of items to remove
   */
  private async evictLRU(count: number): Promise<void> {
    // Get all articles and parts sorted by last_accessed (oldest first)
    const articles = await this.articles
      .orderBy('last_accessed')
      .limit(count)
      .toArray();

    const parts = await this.parts
      .orderBy('last_accessed')
      .limit(count)
      .toArray();

    // Combine and sort by last_accessed
    const combined = [
      ...articles.map(a => ({ id: a.id, type: 'article', last_accessed: a.last_accessed })),
      ...parts.map(p => ({ id: p.id, type: 'part', last_accessed: p.last_accessed })),
    ].sort((a, b) => a.last_accessed - b.last_accessed);

    // Delete oldest items
    for (let i = 0; i < Math.min(count, combined.length); i++) {
      const item = combined[i];
      if (item.type === 'article') {
        await this.articles.delete(item.id);
      } else {
        await this.parts.delete(item.id);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns Cache stats with counts and estimated sizes
   */
  async getStats(): Promise<CacheStats> {
    const articles = await this.articles.toArray();
    const parts = await this.parts.toArray();
    const cutoff = Date.now() - this.EXPIRY_MS;

    return {
      articles: {
        total: articles.length,
        expired: articles.filter(a => a.cached_at < cutoff).length,
        size_bytes: this.estimateSize(articles),
      },
      parts: {
        total: parts.length,
        expired: parts.filter(p => p.cached_at < cutoff).length,
        size_bytes: this.estimateSize(parts),
      },
    };
  }

  /**
   * Estimate size of cached items in bytes
   * Rough estimate based on JSON serialization
   */
  private estimateSize(items: any[]): number {
    try {
      return new Blob([JSON.stringify(items)]).size;
    } catch {
      // Fallback: assume average 5KB per item
      return items.length * 5120;
    }
  }

  /**
   * Clear all cached data
   * Use for logout or manual cache reset
   */
  async clearAll(): Promise<void> {
    await this.articles.clear();
    await this.parts.clear();
  }
}
