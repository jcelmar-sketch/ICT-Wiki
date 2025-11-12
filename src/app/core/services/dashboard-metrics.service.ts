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
    try {
      const client = this.supabase.getClient();

      // Parallel queries for all metrics
      const [
        articlesCount,
        topicsCount,
        partsCount,
        recentUploadsCount,
        draftsCount,
        storageMetrics,
      ] = await Promise.all([
        client.from('articles').select('id', { count: 'exact', head: true }),
        client.from('topics').select('id', { count: 'exact', head: true }),
        client.from('computer_parts').select('id', { count: 'exact', head: true }),
        client
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        client
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'draft'),
        client.from('storage_metrics').select('*').single(),
      ]);

      const storageData = storageMetrics.data || { total_bytes: 0, used_bytes: 0 };
      const usagePercentage = storageData.total_bytes > 0
        ? (storageData.used_bytes / storageData.total_bytes) * 100
        : 0;

      const metrics: DashboardMetrics = {
        totalArticles: articlesCount.count || 0,
        totalTopics: topicsCount.count || 0,
        totalParts: partsCount.count || 0,
        recentUploads: recentUploadsCount.count || 0,
        pendingDrafts: draftsCount.count || 0,
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
      throw error;
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
