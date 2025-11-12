import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-articles-list',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Articles Management</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Articles management will be implemented in Phase 5.</p>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ArticlesListPage {}
