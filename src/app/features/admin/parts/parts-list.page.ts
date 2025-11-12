import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-parts-list',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Computer Parts Management</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Computer parts management will be implemented later.</p>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PartsListPage {}
