import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardMetricsService, DashboardMetrics } from '../../../core/services/dashboard-metrics.service';
import { ActivityLogService } from '../../../core/services/activity-log.service';
import { ActivityLog } from '../../../core/models/activity-log.model';
import { MetricCardComponent } from '../shared/metric-card/metric-card.component';

/**
 * Admin Dashboard Page
 * Task T039, T043: Main landing page showing metrics and activity feed
 * 
 * Displays real-time metrics with 5-minute cache and activity feed.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, MetricCardComponent]
})
export class DashboardPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private metricsService = inject(DashboardMetricsService);
  private activityService = inject(ActivityLogService);
  
  metrics: DashboardMetrics | null = null;
  activities: ActivityLog[] = [];
  loading = true;
  
  // Pagination for activity feed
  currentPage = 1;
  pageSize = 5;
  totalActivities = 0;
  
  private metricsSubscription?: Subscription;
  private activitySubscription?: Subscription;

  // Expose Math to template
  Math = Math;

  ngOnInit() {
    // Load metrics with 5-minute cache (T037)
    this.metricsSubscription = this.metricsService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading metrics:', error);
        this.loading = false;
      }
    });

    this.loadActivityFeed();
  }
  
  ngOnDestroy() {
    this.metricsSubscription?.unsubscribe();
    this.activitySubscription?.unsubscribe();
    this.metricsService.stopActivityFeedPolling();
  }

  loadActivityFeed() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    this.activitySubscription = this.activityService.getRecentActivity({
      limit: this.pageSize,
      offset: (this.currentPage - 1) * this.pageSize,
      start_date: yesterday
    }).subscribe({
      next: (response) => {
        this.activities = response.logs;
        this.totalActivities = response.total;
      },
      error: (error) => {
        console.error('Error loading activity feed:', error);
      }
    });
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.totalActivities) {
      this.currentPage++;
      this.loadActivityFeed();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadActivityFeed();
    }
  }
  
  /**
   * Manually refresh metrics
   */
  async refreshMetrics() {
    this.loading = true;
    try {
      await this.metricsService.refreshMetrics();
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Navigate to quick action
   */
  navigateToCreate(type: 'article' | 'part' | 'topic') {
    this.router.navigate([`/admin/${type}s/create`]);
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

  /**
   * Get storage warning state
   */
  get storageWarning(): boolean {
    return this.metrics?.storageUsed.warning || false;
  }
}
