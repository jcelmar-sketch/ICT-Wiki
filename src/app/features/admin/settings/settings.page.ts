import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-admin-settings',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Admin Settings</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Admin settings will be implemented later.</p>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class AdminSettingsPage {}
