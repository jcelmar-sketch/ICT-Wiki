/**
 * Cache Management Service
 * Tasks T100-T105: Cache statistics and management
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { CacheService } from '../../core/services/cache.service';

export interface CacheStats {
  articleCount: number;
  partCount: number;
  totalSize: number;
  quota: number;
  usage: number; // percentage
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

@Injectable({
  providedIn: 'root',
})
export class CacheManagementService {
  private cache = inject(CacheService);

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const articles = await this.cache.articles.toArray();
    const parts = await this.cache.parts.toArray();

    // Estimate storage usage
    const estimatedSize = await this.estimateSize();
    const quota = 50 * 1024 * 1024; // 50MB quota

    // Find date range
    const allEntries = [...articles, ...parts];
    const dates = allEntries
      .map(entry => new Date(entry.cached_at))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      articleCount: articles.length,
      partCount: parts.length,
      totalSize: estimatedSize,
      quota,
      usage: (estimatedSize / quota) * 100,
      oldestEntry: dates.length > 0 ? dates[0] : null,
      newestEntry: dates.length > 0 ? dates[dates.length - 1] : null,
    };
  }

  /**
   * Estimate total cache size
   */
  private async estimateSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    
    // Fallback: rough estimation
    const articles = await this.cache.articles.toArray();
    const parts = await this.cache.parts.toArray();
    
    const articlesSize = JSON.stringify(articles).length;
    const partsSize = JSON.stringify(parts).length;
    
    return articlesSize + partsSize;
  }

  /**
   * Clear all cached articles
   */
  async clearArticles(): Promise<void> {
    await this.cache.articles.clear();
  }

  /**
   * Clear all cached parts
   */
  async clearParts(): Promise<void> {
    await this.cache.parts.clear();
  }

  /**
   * Clear entire cache
   */
  async clearAll(): Promise<void> {
    await this.cache.articles.clear();
    await this.cache.parts.clear();
  }

  /**
   * Clear expired entries only
   */
  async clearExpired(): Promise<void> {
    const now = Date.now();
    const expiryMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    await this.cache.articles
      .where('cached_at')
      .below(new Date(now - expiryMs).toISOString())
      .delete();

    await this.cache.parts
      .where('cached_at')
      .below(new Date(now - expiryMs).toISOString())
      .delete();
  }

  /**
   * Format bytes to human-readable size
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
