import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivityLogService } from '../../../core/services/activity-log.service';
import { ActivityLog, ActionType, ItemType } from '../../../core/models/activity-log.model';

@Component({
  selector: 'app-activity',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Activity Log</ion-title>
        <ion-buttons slot="end">
          <ion-button
            fill="clear"
            size="small"
            (click)="exportCsv()"
            [disabled]="loading || activities.length === 0"
            aria-label="Export filtered activity logs"
          >
            <ion-icon slot="start" name="download-outline"></ion-icon>
            Export CSV
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding activity-page">
      <ion-card class="filters-card">
        <ion-card-header>
          <ion-card-title>Filters</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <form [formGroup]="filtersForm" class="filters-grid" (ngSubmit)="applyFilters()">
            <ion-item>
              <ion-label position="stacked">Admin Email</ion-label>
              <ion-input
                formControlName="admin_email"
                placeholder="admin@example.com"
                inputmode="email"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Action Type</ion-label>
              <ion-select formControlName="action_type" interface="popover" placeholder="All actions">
                <ion-select-option value="">All</ion-select-option>
                <ion-select-option *ngFor="let action of actionTypes" [value]="action.value">
                  {{ action.label }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Item Type</ion-label>
              <ion-select formControlName="item_type" interface="popover" placeholder="All items">
                <ion-select-option value="">All</ion-select-option>
                <ion-select-option value="article">Article</ion-select-option>
                <ion-select-option value="part">Part</ion-select-option>
                <ion-select-option value="category">Category</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Start Date</ion-label>
              <ion-input type="date" formControlName="start_date"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">End Date</ion-label>
              <ion-input type="date" formControlName="end_date"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Search</ion-label>
              <ion-input formControlName="search" placeholder="Title or admin email"></ion-input>
            </ion-item>
          </form>

          <div class="filter-actions">
            <ion-button size="small" type="submit" (click)="applyFilters()" [disabled]="loading">
              Apply Filters
            </ion-button>
            <ion-button size="small" fill="clear" (click)="resetFilters()" [disabled]="loading">
              Reset
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-card class="table-card">
        <ion-card-header class="table-header">
          <ion-card-title>Results</ion-card-title>
          <ion-badge color="medium">{{ totalActivities }} total</ion-badge>
        </ion-card-header>
        <ion-card-content>
          <ion-progress-bar type="indeterminate" *ngIf="loading"></ion-progress-bar>

          <div class="table-container" *ngIf="activities.length > 0 && !loading; else noActivity">
            <table class="activity-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th style="width: 25%;">Item</th>
                  <th>Admin</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let activity of activities">
                  <td>
                    <div class="action-cell">
                      <ion-badge [color]="getActionColor(activity.action_type)">
                        {{ formatActionType(activity.action_type) }}
                      </ion-badge>
                    </div>
                  </td>
                  <td>
                    <div *ngIf="activity.item_title" class="item-cell">
                      <ion-badge color="light" class="item-type">{{ activity.item_type }}</ion-badge>
                      <span class="item-title">{{ activity.item_title }}</span>
                    </div>
                    <span *ngIf="!activity.item_title" class="text-muted">-</span>
                  </td>
                  <td>{{ activity.admin_email }}</td>
                  <td class="date-cell">{{ formatTimestamp(activity.created_at) }}</td>
                  <td class="notes-cell">
                    <div class="notes-wrapper">
                      <div class="notes-content" [class.expanded]="expandedNotes.has(activity.id)">
                        <span *ngIf="activity.notes">{{ activity.notes | json }}</span>
                        <span *ngIf="!activity.notes" class="text-muted">-</span>
                      </div>
                      <ion-button 
                        *ngIf="activity.notes" 
                        fill="clear" 
                        size="small" 
                        class="expand-btn"
                        (click)="toggleNote(activity.id)"
                      >
                        <ion-icon slot="icon-only" [name]="expandedNotes.has(activity.id) ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
                      </ion-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination-controls ion-padding-top" *ngIf="totalActivities > pageSize">
            <ion-grid>
              <ion-row class="ion-align-items-center ion-justify-content-between">
                <ion-col size="auto">
                  <ion-button fill="clear" (click)="prevPage()" [disabled]="currentPage === 1 || loading">
                    <ion-icon slot="start" name="chevron-back-outline"></ion-icon>
                    Previous
                  </ion-button>
                </ion-col>
                <ion-col size="auto">
                  Page {{ currentPage }} of {{ Math.ceil(totalActivities / pageSize) || 1 }}
                </ion-col>
                <ion-col size="auto">
                  <ion-button fill="clear" (click)="nextPage()" [disabled]="currentPage * pageSize >= totalActivities || loading">
                    Next
                    <ion-icon slot="end" name="chevron-forward-outline"></ion-icon>
                  </ion-button>
                </ion-col>
              </ion-row>
            </ion-grid>
          </div>
        </ion-card-content>
      </ion-card>

      <ng-template #noActivity>
        <div class="empty-state ion-text-center ion-padding">
          <ion-icon name="list-outline" class="empty-icon"></ion-icon>
          <p *ngIf="!loading">No activity logs found</p>
        </div>
      </ng-template>
    </ion-content>
  `,
  styles: [`
    .activity-page {
      display: block;
      min-height: 100%;
    }

    .filters-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .filter-actions {
      margin-top: 12px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .table-card {
      margin-top: 12px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .table-container {
      overflow-x: auto;
      background: var(--ion-card-background, #fff);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    
    .activity-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 880px;
    }
    
    .activity-table th {
      text-align: left;
      padding: 16px;
      background: var(--ion-color-light);
      color: var(--ion-color-medium);
      font-weight: 600;
      font-size: 0.9rem;
      border-bottom: 1px solid var(--ion-color-light-shade);
    }
    
    .activity-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--ion-color-light);
      font-size: 0.95rem;
      vertical-align: middle;
    }
    
    .activity-table tr:last-child td {
      border-bottom: none;
    }
    
    .action-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    
    .item-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .item-type {
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }
    
    .item-title {
      font-weight: 500;
    }
    
    .date-cell {
      white-space: nowrap;
      color: var(--ion-color-medium);
      font-size: 0.9rem;
    }
    
    .notes-cell {
      max-width: 320px;
      vertical-align: top;
    }

    .notes-wrapper {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .notes-content {
      flex: 1;
      color: var(--ion-color-medium);
      font-size: 0.85rem;
      min-width: 0;
    }

    .notes-content.expanded {
      white-space: pre-wrap;
      word-break: break-word;
    }

    .notes-content:not(.expanded) {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .expand-btn {
      --padding-start: 4px;
      --padding-end: 4px;
      height: 24px;
      margin: 0;
      min-height: 24px;
      font-size: 0.8rem;
      --color: var(--ion-color-primary);
    }
    
    .text-muted {
      color: var(--ion-color-medium-tint);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .empty-icon {
      font-size: 48px;
      color: var(--ion-color-medium);
    }

    @media (max-width: 768px) {
      .activity-table {
        min-width: 720px;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class ActivityPage implements OnInit {
  private activityService = inject(ActivityLogService);
  private fb = inject(FormBuilder);

  activities: ActivityLog[] = [];
  loading = false;
  exporting = false;
  currentPage = 1;
  pageSize = 50;
  totalActivities = 0;
  Math = Math;
  expandedNotes = new Set<string>();

  private readonly defaultStartDate = this.getDateDaysAgo(30);

  actionTypes = [
    { value: ActionType.LOGIN_SUCCESS, label: 'Login Success' },
    { value: ActionType.LOGIN_FAILURE, label: 'Login Failure' },
    { value: ActionType.CREATE, label: 'Create' },
    { value: ActionType.EDIT, label: 'Edit' },
    { value: ActionType.DELETE, label: 'Delete' },
    { value: ActionType.PUBLISH, label: 'Publish' },
    { value: ActionType.UNPUBLISH, label: 'Unpublish' },
    { value: ActionType.RESTORE, label: 'Restore' },
    { value: ActionType.PERMANENT_DELETE, label: 'Permanent Delete' },
  ];

  filtersForm = this.fb.group({
    admin_email: [''],
    action_type: [''],
    item_type: [''],
    start_date: [this.formatDateInput(this.defaultStartDate)],
    end_date: [this.formatDateInput(new Date())],
    search: [''],
  });

  ngOnInit() {
    this.applyFilters();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadActivity();
  }

  resetFilters() {
    this.filtersForm.reset({
      admin_email: '',
      action_type: '',
      item_type: '',
      start_date: this.formatDateInput(this.defaultStartDate),
      end_date: this.formatDateInput(new Date()),
      search: '',
    });
    this.applyFilters();
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.totalActivities) {
      this.currentPage++;
      this.loadActivity();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadActivity();
    }
  }

  toggleNote(id: string) {
    if (this.expandedNotes.has(id)) {
      this.expandedNotes.delete(id);
    } else {
      this.expandedNotes.add(id);
    }
  }

  exportCsv() {
    const filter = {
      ...this.buildFilter(),
      offset: 0,
      limit: Math.min(this.totalActivities || this.pageSize, 500),
    };

    this.exporting = true;
    this.activityService.getRecentActivity(filter).subscribe({
      next: (response) => {
        this.downloadCsv(response.logs);
        this.exporting = false;
      },
      error: (error) => {
        console.error('Failed to export activity logs', error);
        this.exporting = false;
      },
    });
  }

  formatActionType(action: string): string {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getActionColor(action: ActionType): string {
    const map: Record<ActionType, string> = {
      [ActionType.LOGIN_SUCCESS]: 'success',
      [ActionType.LOGIN_FAILURE]: 'warning',
      [ActionType.CREATE]: 'primary',
      [ActionType.EDIT]: 'tertiary',
      [ActionType.DELETE]: 'danger',
      [ActionType.PUBLISH]: 'success',
      [ActionType.UNPUBLISH]: 'medium',
      [ActionType.RESTORE]: 'secondary',
      [ActionType.PERMANENT_DELETE]: 'danger',
    };
    return map[action] || 'medium';
  }
  
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  private loadActivity() {
    const filter = this.buildFilter();
    this.loading = true;

    this.activityService.getRecentActivity(filter).subscribe({
      next: (response) => {
        this.activities = response.logs;
        this.totalActivities = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading activity logs:', error);
        this.loading = false;
      },
    });
  }

  private buildFilter() {
    const form = this.filtersForm.value;
    const startDate = form.start_date ? new Date(form.start_date) : undefined;
    const endDate = form.end_date ? new Date(form.end_date) : undefined;

    return {
      admin_email: form.admin_email || undefined,
      action_type: (form.action_type as ActionType) || undefined,
      item_type: (form.item_type as ItemType) || undefined,
      start_date: startDate,
      end_date: endDate,
      search: form.search || undefined,
      limit: this.pageSize,
      offset: (this.currentPage - 1) * this.pageSize,
    };
  }

  private downloadCsv(logs: ActivityLog[]) {
    if (!logs || logs.length === 0) return;

    const header = [
      'created_at',
      'admin_email',
      'action_type',
      'item_type',
      'item_id',
      'item_title',
      'notes',
    ];

    const rows = logs.map((log) => [
      this.formatTimestamp(log.created_at),
      log.admin_email,
      log.action_type,
      log.item_type || '',
      log.item_id || '',
      log.item_title || '',
      log.notes ? JSON.stringify(log.notes) : '',
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private formatDateInput(date: Date | null): string | null {
    if (!date) return null;
    return date.toISOString().slice(0, 10);
  }
}
