import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { TrashService } from '../../../core/services/trash.service';
import { TrashItem, TrashItemType } from '../../../core/models/trash.model';

@Component({
  selector: 'app-trash',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Trash & Recovery</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding trash-page">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Deleted Items</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="filters">
            <ion-segment [(ngModel)]="filter" (ionChange)="applyFilter()" value="all">
              <ion-segment-button value="all"><ion-label>All</ion-label></ion-segment-button>
              <ion-segment-button value="article"><ion-label>Articles</ion-label></ion-segment-button>
              <ion-segment-button value="part"><ion-label>Parts</ion-label></ion-segment-button>
              <ion-segment-button value="category"><ion-label>Categories</ion-label></ion-segment-button>
            </ion-segment>
          </div>

          <ion-progress-bar type="indeterminate" *ngIf="loading"></ion-progress-bar>

          <div class="table-container" *ngIf="filteredItems.length > 0 && !loading; else emptyState">
            <table class="trash-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Deleted</th>
                  <th>Auto-delete</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of filteredItems">
                  <td>
                    <ion-badge color="medium" class="type-badge">{{ item.item_type }}</ion-badge>
                  </td>
                  <td>
                    <div class="title-col">
                      <span class="item-title">{{ item.title }}</span>
                      <p class="item-meta">Deleted by {{ item.deleted_by_admin_email || 'unknown' }}</p>
                    </div>
                  </td>
                  <td>{{ formatTimestamp(item.deleted_at) }}</td>
                  <td>
                    <div class="purge-col" [class.warn]="item.days_until_purge <= 7">
                      <span>In {{ item.days_until_purge }} day(s)</span>
                      <p class="item-meta">{{ formatTimestamp(item.auto_delete_at) }}</p>
                    </div>
                  </td>
                  <td>
                    <div class="actions">
                      <ion-button size="small" fill="clear" color="success" (click)="restore(item)" [disabled]="loading">
                        <ion-icon slot="start" name="refresh-outline"></ion-icon>
                        Restore
                      </ion-button>
                      <ion-button size="small" fill="outline" color="danger" (click)="confirmPermanentDelete(item)" [disabled]="loading">
                        <ion-icon slot="start" name="trash-outline"></ion-icon>
                        Permanent Delete
                      </ion-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ion-card-content>
      </ion-card>

      <ng-template #emptyState>
        <div class="empty-state ion-text-center ion-padding">
          <ion-icon name="trash-outline" class="empty-icon"></ion-icon>
          <p *ngIf="!loading">Trash is empty. Deleted items will appear here for 30 days.</p>
        </div>
      </ng-template>
    </ion-content>
  `,
  styles: [`
    .trash-page {
      display: block;
      min-height: 100%;
    }

    .filters {
      margin-bottom: 12px;
    }

    .table-container {
      overflow-x: auto;
    }

    .trash-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 720px;
    }

    .trash-table th {
      text-align: left;
      padding: 12px 14px;
      background: var(--ion-color-light);
      color: var(--ion-color-medium);
      font-weight: 600;
      font-size: 0.9rem;
      border-bottom: 1px solid var(--ion-color-light-shade);
    }

    .trash-table td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--ion-color-light);
      vertical-align: middle;
      font-size: 0.95rem;
    }

    .trash-table tr:last-child td {
      border-bottom: none;
    }

    .type-badge {
      text-transform: uppercase;
    }

    .title-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .item-title {
      font-weight: 600;
    }

    .item-meta {
      color: var(--ion-color-medium);
      font-size: 13px;
      margin: 0;
    }

    .purge-col.warn {
      color: var(--ion-color-danger);
    }

    .actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
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
      .trash-table {
        min-width: 640px;
      }

      .actions {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class TrashPage implements OnInit {
  private trashService = inject(TrashService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  items: TrashItem[] = [];
  filteredItems: TrashItem[] = [];
  loading = false;
  filter: 'all' | TrashItemType = 'all';

  ngOnInit() {
    this.loadItems();
  }

  applyFilter() {
    if (this.filter === 'all') {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter((item) => item.item_type === this.filter);
    }
  }

  loadItems() {
    this.loading = true;
    this.trashService.getTrashItems().subscribe({
      next: (items) => {
        this.items = items;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load trash items', error);
        this.loading = false;
      },
    });
  }

  restore(item: TrashItem) {
    this.loading = true;
    this.trashService.restore(item.item_type, item.id).subscribe({
      next: (success) => {
        this.loading = false;
        if (success) {
          this.items = this.items.filter((i) => i.id !== item.id);
          this.applyFilter();
          this.presentToast('Item restored', 'success');
        }
      },
      error: (error) => {
        console.error('Restore failed', error);
        this.loading = false;
        this.presentToast('Failed to restore item', 'danger');
      },
    });
  }

  async confirmPermanentDelete(item: TrashItem) {
    const alert = await this.alertController.create({
      header: 'Permanent Delete',
      message: 'Type "PERMANENT DELETE" to confirm. This cannot be undone.',
      inputs: [{ name: 'confirm', type: 'text', placeholder: 'PERMANENT DELETE' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: (data) => {
            if (data?.confirm === 'PERMANENT DELETE') {
              this.permanentDelete(item);
            } else {
              this.presentToast('Confirmation text does not match', 'warning');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  permanentDelete(item: TrashItem) {
    this.loading = true;
    this.trashService.permanentDelete(item.item_type, item.id).subscribe({
      next: (success) => {
        this.loading = false;
        if (success) {
          this.items = this.items.filter((i) => i.id !== item.id);
          this.applyFilter();
          this.presentToast('Item permanently deleted', 'success');
        }
      },
      error: (error) => {
        console.error('Permanent delete failed', error);
        this.loading = false;
        this.presentToast('Failed to delete item', 'danger');
      },
    });
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
