/**
 * Settings Page
 * Tasks T100-T105: Cache management and offline settings
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CacheManagementService, CacheStats } from '../../../core/services/cache-management.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class SettingsPage implements OnInit {
  private cacheManager = inject(CacheManagementService);
  private router = inject(Router);

  stats: CacheStats | null = null;
  loading = true;

  ngOnInit() {
    this.loadStats();
  }

  async loadStats() {
    this.loading = true;
    try {
      this.stats = await this.cacheManager.getStats();
    } catch (error) {
      console.error('[SettingsPage] Failed to load stats:', error);
    } finally {
      this.loading = false;
    }
  }

  async clearArticles() {
    const alert = await this.presentConfirmAlert(
      'Clear Article Cache',
      'This will remove all cached articles. You can re-download them when online.'
    );

    if (alert) {
      await this.cacheManager.clearArticles();
      await this.loadStats();
      this.presentToast('Article cache cleared');
    }
  }

  async clearParts() {
    const alert = await this.presentConfirmAlert(
      'Clear Parts Cache',
      'This will remove all cached computer parts. You can re-download them when online.'
    );

    if (alert) {
      await this.cacheManager.clearParts();
      await this.loadStats();
      this.presentToast('Parts cache cleared');
    }
  }

  async clearExpired() {
    await this.cacheManager.clearExpired();
    await this.loadStats();
    this.presentToast('Expired cache entries removed');
  }

  async clearAll() {
    const alert = await this.presentConfirmAlert(
      'Clear All Cache',
      'This will remove all offline data. Are you sure?'
    );

    if (alert) {
      await this.cacheManager.clearAll();
      await this.loadStats();
      this.presentToast('All cache cleared');
    }
  }

  private async presentConfirmAlert(header: string, message: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alertController = document.createElement('ion-alert');
      alertController.header = header;
      alertController.message = message;
      alertController.buttons = [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => resolve(false),
        },
        {
          text: 'Confirm',
          role: 'confirm',
          handler: () => resolve(true),
        },
      ];

      document.body.appendChild(alertController);
      await alertController.present();
      await alertController.onDidDismiss();
      alertController.remove();
    });
  }

  private async presentToast(message: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.position = 'bottom';

    document.body.appendChild(toast);
    await toast.present();
    setTimeout(() => toast.remove(), 2500);
  }

  formatSize(bytes: number): string {
    return this.cacheManager.formatBytes(bytes);
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  goBack() {
    this.router.navigate(['/tabs/home']);
  }
}
