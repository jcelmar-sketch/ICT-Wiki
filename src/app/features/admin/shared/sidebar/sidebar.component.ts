/**
 * Admin Sidebar Component
 * Task T042: Navigation menu for admin dashboard
 */

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { 
  IonMenu, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonIcon, 
  IonLabel 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  speedometerOutline,
  documentTextOutline,
  hardwareChipOutline,
  pricetagsOutline,
  listOutline,
  trashOutline,
  settingsOutline,
} from 'ionicons/icons';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-admin-sidebar',
  template: `
    <ion-menu contentId="main-content" type="overlay">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Navigation</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-content>
        <ion-list>
          <ion-item 
            *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="active"
            button
            detail="false"
          >
            <ion-icon [name]="item.icon" slot="start"></ion-icon>
            <ion-label>{{ item.label }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
  `,
  styles: [`
    ion-item.active {
      --background: var(--ion-color-primary-tint);
      --color: var(--ion-color-primary-contrast);
    }

    ion-item {
      --padding-start: 16px;
      --inner-padding-end: 16px;
    }

    ion-icon {
      font-size: 24px;
      margin-right: 16px;
    }
  `],
  standalone: true,
  imports: [
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    RouterLink,
    RouterLinkActive,
  ],
})
export class AdminSidebarComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'speedometer-outline' },
    { label: 'Articles', route: '/admin/articles', icon: 'document-text-outline' },
    { label: 'Parts', route: '/admin/parts', icon: 'hardware-chip-outline' },
    { label: 'Topics', route: '/admin/topics', icon: 'pricetags-outline' },
    { label: 'Activity Log', route: '/admin/activity', icon: 'list-outline' },
    { label: 'Trash', route: '/admin/trash', icon: 'trash-outline' },
    { label: 'Settings', route: '/admin/settings', icon: 'settings-outline' },
  ];

  constructor() {
    addIcons({
      'speedometer-outline': speedometerOutline,
      'document-text-outline': documentTextOutline,
      'hardware-chip-outline': hardwareChipOutline,
      'pricetags-outline': pricetagsOutline,
      'list-outline': listOutline,
      'trash-outline': trashOutline,
      'settings-outline': settingsOutline,
    });
  }
}
