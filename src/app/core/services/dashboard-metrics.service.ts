/**
 * Dashboard Metrics Service
 * Task T037: Provides cached dashboard metrics and activity feed
 *
 * Uses RxJS ReplaySubject for 5-minute cache TTL on metrics
 * and 30-second polling for activity feed updates.
 */

import { Injectable, inject } from '@angular/core';
import { ReplaySubject, Observable, interval, Subscription } from 'rxjs';
import { switchMap, startWith, shareReplay } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

export interface DashboardMetrics {
  totalArticles: number;
  totalTopics: number;
  totalParts: number;
  recentUploads: number; // Last 7 days
  pendingDrafts: number;
  storageUsed: {
    bytes: number;
    percentage: number;
    warning: boolean; // true if > 80%
  };
}

export interface ActivityFeedItem {
  id: string;
  created_at: string;
  admin_email: string;
  action_type: string;
  item_type: string;
  item_title: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardMetricsService {
  private supabase = inject(SupabaseService);
  private metricsCache$ = new ReplaySubject<DashboardMetrics>(1);
  private metricsCacheTime = 0;
  private readonly METRICS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private activityFeedSubscription?: Subscription;

  /**
   * Get dashboard metrics with 5-minute cache
   * @returns Observable of dashboard metrics
   */
  getMetrics(): Observable<DashboardMetrics> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (now - this.metricsCacheTime < this.METRICS_CACHE_TTL) {
      return this.metricsCache$.asObservable();
    }

    // Fetch fresh data
    this.fetchMetrics();
    return this.metricsCache$.asObservable();
  }

  /**
   * Get activity feed with 30-second auto-refresh
   * @param limit - Number of recent activities to fetch (default 20)
   * @returns Observable of activity feed items
   */
  getActivityFeed(limit = 20): Observable<ActivityFeedItem[]> {
    // Poll every 30 seconds
    return interval(30000).pipe(
      startWith(0), // Fetch immediately
      switchMap(() => this.fetchActivityFeed(limit)),
      shareReplay(1)
    );
  }

  /**
   * Manually refresh metrics (bypasses cache)
   */
  async refreshMetrics(): Promise<void> {
    await this.fetchMetrics();
  }

  /**
   * Fetch metrics from database
   */
  private async fetchMetrics(): Promise<void> {
    const client = this.supabase.getClient();

    // Helper: safe count of a table (returns 0 on error/missing table)
    const safeCount = async (tableName: string, opts?: any): Promise<number> => {
      try {
        const { count, error } = await client.from(tableName).select('id', { count: 'exact', head: true, ...opts });
        if (error) {
          console.warn(`safeCount: could not count table ${tableName}:`, error.message || error);
          return 0;
        }
        return count || 0;
      } catch (e: any) {
        console.warn(`safeCount: unexpected error counting ${tableName}:`, e.message || e);
        return 0;
      }
    };

    try {
      // Articles
      const totalArticles = await safeCount('articles');
      const recentUploads = await (async () => {
        try {
          const { count, error } = await client
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
          if (error) {
            console.warn('recentUploads: error fetching recent uploads:', error.message || error);
            return 0;
          }
          return count || 0;
        } catch (e: any) {
          console.warn('recentUploads: unexpected error:', e.message || e);
          return 0;
        }
      })();

      const pendingDrafts = await (async () => {
        try {
          const { count, error } = await client
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'draft');
          if (error) {
            console.warn('pendingDrafts: error fetching drafts:', error.message || error);
            return 0;
          }
          return count || 0;
        } catch (e: any) {
          console.warn('pendingDrafts: unexpected error:', e.message || e);
          return 0;
        }
      })();

      // Topics
      const totalTopics = await safeCount('topics');

      // Parts: try both `computer_parts` and legacy `parts` tables
      let totalParts = await safeCount('computer_parts');
      if (!totalParts) totalParts = await safeCount('parts');

      // Storage metrics (optional table)
      let storageData = { total_bytes: 0, used_bytes: 0 };
      try {
        const { data, error } = await client.from('storage_metrics').select('*').single();
        if (!error && data) storageData = data;
      } catch (e: any) {
        console.warn('storage_metrics not available or failed to fetch:', e.message || e);
      }

      const usagePercentage = storageData.total_bytes > 0
        ? (storageData.used_bytes / storageData.total_bytes) * 100
        : 0;

      const metrics: DashboardMetrics = {
        totalArticles,
        totalTopics,
        totalParts,
        recentUploads,
        pendingDrafts,
        storageUsed: {
          bytes: storageData.used_bytes,
          percentage: usagePercentage,
          warning: usagePercentage > 80,
        },
      };

      this.metricsCache$.next(metrics);
      this.metricsCacheTime = Date.now();
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Do not throw — dashboard should degrade gracefully
      this.metricsCache$.next({
        totalArticles: 0,
        totalTopics: 0,
        totalParts: 0,
        recentUploads: 0,
        pendingDrafts: 0,
        storageUsed: { bytes: 0, percentage: 0, warning: false },
      });
    }
  }

  /**
   * Fetch activity feed from database
   */
  private async fetchActivityFeed(limit: number): Promise<ActivityFeedItem[]> {
    try {
      const client = this.supabase.getClient();
      
      const { data, error } = await client
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }
  }

  /**
   * Stop activity feed polling (call on component destroy)
   */
  stopActivityFeedPolling(): void {
    if (this.activityFeedSubscription) {
      this.activityFeedSubscription.unsubscribe();
    }
  }
}
