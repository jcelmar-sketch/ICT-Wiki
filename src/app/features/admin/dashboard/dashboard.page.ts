import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardMetricsService, DashboardMetrics, ActivityFeedItem } from '../../../core/services/dashboard-metrics.service';
import { MetricCardComponent } from '../shared/metric-card/metric-card.component';

/**
 * Admin Dashboard Page
 * Task T039, T043: Main landing page showing metrics and activity feed
 * 
 * Displays real-time metrics with 5-minute cache and activity feed updating every 30 seconds.
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
  
  metrics: DashboardMetrics | null = null;
  activities: ActivityFeedItem[] = [];
  loading = true;
  
  private metricsSubscription?: Subscription;
  private activitySubscription?: Subscription;

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

    // Load activity feed with 30-second refresh (T037)
    this.activitySubscription = this.metricsService.getActivityFeed(20).subscribe({
      next: (activities) => {
        this.activities = activities;
      },
      error: (error) => {
        console.error('Error loading activity feed:', error);
      }
    });
  }
  
  ngOnDestroy() {
    this.metricsSubscription?.unsubscribe();
    this.activitySubscription?.unsubscribe();
    this.metricsService.stopActivityFeedPolling();
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
