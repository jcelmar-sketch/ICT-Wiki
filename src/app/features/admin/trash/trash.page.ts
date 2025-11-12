import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-trash',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Trash</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Trash management will be implemented later.</p>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class TrashPage {}
