/**
 * Admin Header Component
 * Task T041: Header with admin email display and logout button
 */

import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, personCircleOutline } from 'ionicons/icons';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-header',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>ICT Wiki - Admin Dashboard</ion-title>
        
        <div slot="end" class="admin-controls">
          <span class="admin-email">
            <ion-icon name="person-circle-outline"></ion-icon>
            {{ adminEmail }}
          </span>
          <ion-button fill="clear" (click)="logout()">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    .admin-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-right: 8px;
    }

    .admin-email {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    .admin-email ion-icon {
      font-size: 20px;
    }

    @media (max-width: 768px) {
      .admin-email span {
        display: none;
      }
    }
  `],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButton, IonIcon],
})
export class AdminHeaderComponent implements OnInit {
  private authService = inject(AdminAuthService);
  private router = inject(Router);
  
  adminEmail = '';

  constructor() {
    addIcons({
      'log-out-outline': logOutOutline,
      'person-circle-outline': personCircleOutline,
    });
  }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user) => {
      this.adminEmail = user?.email || 'Admin';
    });
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/admin/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
