import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  ActivityLog,
  ActionType,
  ActivityLogFilter,
  ActivityLogResponse
} from '../models/activity-log.model';
import { environment } from '../../../environments/environment';

/**
 * Activity Log Service
 * 
 * Manages activity audit logs for admin actions.
 * Provides filtering, pagination, and archival of activity logs.
 * 
 * Features:
 * - Read-only access to activity_logs table (inserts handled by triggers)
 * - Filter by admin, action type, item type, date range
 * - Pagination support
 * - Archive old logs (90-day retention per spec)
 * - Performance: Dashboard activity feed p95 < 1000ms
 */
@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private supabase!: SupabaseClient;
  private readonly RETENTION_DAYS = environment.admin.activityLogRetentionDays;

  constructor() {
    this.initializeSupabase();
  }

  private async initializeSupabase(): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Log a custom admin action
   * 
   * Note: Most logging is automatic via database triggers.
   * Use this for actions not covered by triggers (e.g., manual operations).
   * 
   * @param log Activity log entry
   */
  log(log: Partial<ActivityLog>): Observable<boolean> {
    return from(this.performLog(log)).pipe(
      catchError(error => {
        console.error('Failed to log activity:', error);
        return of(false);
      })
    );
  }

  private async performLog(log: Partial<ActivityLog>): Promise<boolean> {
    await this.initializeSupabase();

    const { error } = await this.supabase
      .from('activity_logs')
      .insert({
        admin_id: log.admin_id,
        admin_email: log.admin_email,
        action_type: log.action_type,
        item_type: log.item_type || null,
        item_id: log.item_id || null,
        item_title: log.item_title || null,
        ip_address: log.ip_address || null,
        user_agent: log.user_agent || null,
        notes: log.notes || null
      });

    return !error;
  }

  /**
   * Get recent activity logs with optional filtering
   * 
   * @param filter Filter criteria
   * @returns Observable of activity log response with pagination
   */
  getRecentActivity(filter?: ActivityLogFilter): Observable<ActivityLogResponse> {
    return from(this.fetchActivity(filter || {}));
  }

  private async fetchActivity(filter: ActivityLogFilter): Promise<ActivityLogResponse> {
    await this.initializeSupabase();

    const limit = filter.limit || 50;
    const offset = filter.offset || 0;

    let query = this.supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filter.admin_id) {
      query = query.eq('admin_id', filter.admin_id);
    }

    if (filter.action_type) {
      query = query.eq('action_type', filter.action_type);
    }

    if (filter.item_type) {
      query = query.eq('item_type', filter.item_type);
    }

    if (filter.start_date) {
      query = query.gte('created_at', filter.start_date.toISOString());
    }

    if (filter.end_date) {
      query = query.lte('created_at', filter.end_date.toISOString());
    }

    if (filter.search) {
      query = query.or(`admin_email.ilike.%${filter.search}%,item_title.ilike.%${filter.search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch activity logs:', error);
      return {
        logs: [],
        total: 0,
        limit,
        offset
      };
    }

    return {
      logs: (data as ActivityLog[]) || [],
      total: count || 0,
      limit,
      offset
    };
  }

  /**
   * Filter activity logs by multiple criteria
   * 
   * @param filter Filter object with admin_id, action types, date range, etc.
   * @returns Observable of filtered activity logs
   */
  filter(filter: ActivityLogFilter): Observable<ActivityLog[]> {
    return this.getRecentActivity(filter).pipe(
      map(response => response.logs)
    );
  }

  /**
   * Get activity logs for a specific item (article, part, category)
   * 
   * @param itemType Type of item
   * @param itemId ID of item
   * @returns Observable of activity logs for that item
   */
  getItemHistory(itemType: string, itemId: string): Observable<ActivityLog[]> {
    return from(this.fetchItemHistory(itemType, itemId));
  }

  private async fetchItemHistory(itemType: string, itemId: string): Promise<ActivityLog[]> {
    await this.initializeSupabase();

    const { data, error } = await this.supabase
      .from('activity_logs')
      .select('*')
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch item history:', error);
      return [];
    }

    return (data as ActivityLog[]) || [];
  }

  /**
   * Archive old activity logs based on retention policy
   * 
   * Should be run periodically (e.g., daily cron job or manual trigger).
   * Archives logs older than RETENTION_DAYS.
   * 
   * @returns Observable of number of logs archived
   */
  archiveOldLogs(): Observable<number> {
    return from(this.performArchival());
  }

  private async performArchival(): Promise<number> {
    await this.initializeSupabase();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    const { data, error } = await this.supabase
      .from('activity_logs')
      .update({ archived: true })
      .eq('archived', false)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Failed to archive logs:', error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`Archived ${count} activity logs older than ${this.RETENTION_DAYS} days`);
    
    return count;
  }

  /**
   * Get activity statistics for dashboard
   * 
   * @param days Number of days to analyze (default 7)
   * @returns Observable of activity statistics
   */
  getActivityStats(days: number = 7): Observable<{ [key: string]: number }> {
    return from(this.fetchActivityStats(days));
  }

  private async fetchActivityStats(days: number): Promise<{ [key: string]: number }> {
    await this.initializeSupabase();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('activity_logs')
      .select('action_type')
      .eq('archived', false)
      .gte('created_at', startDate.toISOString());

    if (error || !data) {
      console.error('Failed to fetch activity stats:', error);
      return {};
    }

    // Count by action type
    const stats: { [key: string]: number } = {};
    
    data.forEach((log: any) => {
      const actionType = log.action_type;
      stats[actionType] = (stats[actionType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get most active admins
   * 
   * @param limit Number of admins to return
   * @param days Number of days to analyze
   * @returns Observable of admin activity counts
   */
  getMostActiveAdmins(limit: number = 5, days: number = 30): Observable<Array<{ admin_email: string; count: number }>> {
    return from(this.fetchMostActiveAdmins(limit, days));
  }

  private async fetchMostActiveAdmins(limit: number, days: number): Promise<Array<{ admin_email: string; count: number }>> {
    await this.initializeSupabase();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('activity_logs')
      .select('admin_email')
      .eq('archived', false)
      .gte('created_at', startDate.toISOString());

    if (error || !data) {
      console.error('Failed to fetch active admins:', error);
      return [];
    }

    // Count by admin_email
    const counts: { [email: string]: number } = {};
    
    data.forEach((log: any) => {
      const email = log.admin_email;
      counts[email] = (counts[email] || 0) + 1;
    });

    // Sort and limit
    const sorted = Object.entries(counts)
      .map(([admin_email, count]) => ({ admin_email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted;
  }
}
