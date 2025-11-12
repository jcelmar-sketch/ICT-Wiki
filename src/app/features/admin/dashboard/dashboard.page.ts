import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

interface DashboardMetrics {
  totalArticles: number;
  totalTopics: number;
  totalParts: number;
  recentUploads: number;
  pendingDrafts: number;
  storageUsed: number;
  storageQuota: number;
  storagePercentage: number;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  admin_email: string;
  action_type: string;
  item_type: string | null;
  item_title: string | null;
}

/**
 * Admin Dashboard Page
 * 
 * Main landing page showing metrics and activity feed (FR-007, FR-008, FR-009, FR-010).
 * Displays real-time metrics with 5-minute cache and activity feed updating every 30 seconds.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class DashboardPage implements OnInit {
  private router = inject(Router);
  private supabase!: SupabaseClient;
  
  metrics: DashboardMetrics = {
    totalArticles: 0,
    totalTopics: 0,
    totalParts: 0,
    recentUploads: 0,
    pendingDrafts: 0,
    storageUsed: 0,
    storageQuota: 0,
    storagePercentage: 0
  };
  
  activities: ActivityItem[] = [];
  loading = true;
  storageWarning = false;
  
  private metricsCache: { data: DashboardMetrics | null; timestamp: number } = { data: null, timestamp: 0 };
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private activityRefreshInterval: any;

  async ngOnInit() {
    await this.initializeSupabase();
    await this.loadMetrics();
    await this.loadActivities();
    
    // Refresh activity feed every 30 seconds (FR-008)
    this.activityRefreshInterval = setInterval(() => {
      this.loadActivities();
    }, 30000);
    
    this.loading = false;
  }
  
  ngOnDestroy() {
    if (this.activityRefreshInterval) {
      clearInterval(this.activityRefreshInterval);
    }
  }
  
  private async initializeSupabase() {
    const { createClient } = await import('@supabase/supabase-js');
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }
  
  /**
   * Load dashboard metrics with 5-minute cache (FR-007)
   */
  async loadMetrics() {
    const now = Date.now();
    
    // Check cache
    if (this.metricsCache.data && (now - this.metricsCache.timestamp) < this.CACHE_DURATION_MS) {
      this.metrics = this.metricsCache.data;
      return;
    }
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Fetch all metrics in parallel
      const [articlesResult, topicsResult, partsResult, recentResult, draftsResult, storageResult] = await Promise.all([
        this.supabase.from('articles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        this.supabase.from('topics').select('id', { count: 'exact', head: true }),
        this.supabase.from('computer_parts').select('id', { count: 'exact', head: true }),
        this.supabase.from('articles').select('id', { count: 'exact', head: true })
          .is('deleted_at', null)
          .gte('created_at', sevenDaysAgo.toISOString()),
        this.supabase.from('articles').select('id', { count: 'exact', head: true })
          .eq('status', 'draft')
          .is('deleted_at', null),
        this.supabase.from('storage_metrics').select('*').limit(1).single()
      ]);
      
      this.metrics = {
        totalArticles: articlesResult.count || 0,
        totalTopics: topicsResult.count || 0,
        totalParts: partsResult.count || 0,
        recentUploads: recentResult.count || 0,
        pendingDrafts: draftsResult.count || 0,
        storageUsed: storageResult.data?.total_size_bytes || 0,
        storageQuota: storageResult.data?.quota_bytes || 1073741824, // Default 1GB
        storagePercentage: 0
      };
      
      // Calculate storage percentage
      if (this.metrics.storageQuota > 0) {
        this.metrics.storagePercentage = Math.round((this.metrics.storageUsed / this.metrics.storageQuota) * 100);
        this.storageWarning = this.metrics.storagePercentage > 80; // FR-009
      }
      
      // Update cache
      this.metricsCache = { data: this.metrics, timestamp: now };
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }
  
  /**
   * Load recent activity feed (FR-008)
   */
  async loadActivities() {
    try {
      const { data, error } = await this.supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      this.activities = (data || []).map(log => ({
        id: log.id,
        timestamp: log.created_at,
        admin_email: log.admin_email,
        action_type: log.action_type,
        item_type: log.item_type,
        item_title: log.item_title
      }));
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }
  
  /**
   * Format bytes to human-readable size
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
  
  /**
   * Format action type for display
   */
  formatActionType(action: string): string {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * Get icon for action type
   */
  getActionIcon(action: string): string {
    const iconMap: { [key: string]: string } = {
      'login_success': 'log-in-outline',
      'login_failure': 'warning-outline',
      'create': 'add-circle-outline',
      'edit': 'create-outline',
      'delete': 'trash-outline',
      'publish': 'checkmark-circle-outline',
      'unpublish': 'close-circle-outline'
    };
    return iconMap[action] || 'ellipse-outline';
  }
  
  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }
}
