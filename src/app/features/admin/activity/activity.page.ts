import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-activity',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Activity Log</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Activity log will be implemented later.</p>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ActivityPage {}
