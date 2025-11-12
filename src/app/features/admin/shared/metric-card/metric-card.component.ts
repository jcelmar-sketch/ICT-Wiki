/**
 * Metric Card Component
 * Task T040: Reusable card for displaying dashboard metrics
 *
 * Shows a metric with label, value, icon, and optional warning state
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  documentTextOutline, 
  pricetagsOutline, 
  hardwareChipOutline,
  cloudUploadOutline,
  documentOutline,
  cloudOutline,
  warningOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-metric-card',
  template: `
    <ion-card [class.warning]="warning">
      <ion-card-content>
        <div class="metric-icon">
          <ion-icon [name]="icon" [class.white-icon]="warning"></ion-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ value }}</div>
          <div class="metric-label">{{ label }}</div>
          <div class="metric-detail" *ngIf="detail">{{ detail }}</div>
        </div>
        <div class="warning-indicator" *ngIf="warning">
          <ion-icon name="warning-outline"></ion-icon>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    :host {
      display: flex;
      height: 100%;
    }

    ion-card {
      margin: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    ion-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    ion-card.warning {
      border-left: 4px solid var(--ion-color-warning);
      background: var(--ion-color-warning-tint);
    }

    ion-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      flex: 1;
      min-height: 140px;
    }

    .metric-icon {
      font-size: 48px;
      color: var(--ion-color-primary);
      flex-shrink: 0;
    }

    .metric-icon ion-icon {
      width: 48px;
      height: 48px;
    }

    .metric-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 80px;
    }

    .metric-value {
      font-size: 32px;
      font-weight: bold;
      line-height: 1.1;
      color: var(--ion-text-color);
      margin-bottom: 6px;
    }

    .metric-label {
      font-size: 14px;
      color: var(--ion-color-step-600);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .metric-detail {
      font-size: 12px;
      color: var(--ion-color-step-550);
      margin-top: 2px;
      min-height: 16px;
    }

    .warning-indicator {
      font-size: 32px;
      color: var(--ion-color-warning);
      flex-shrink: 0;
    }

    .warning-indicator ion-icon {
      width: 32px;
      height: 32px;
    }

    .white-icon {
      color: #ffffff !important;
    }

    @media (max-width: 768px) {
      ion-card-content {
        padding: 16px;
      }

      .metric-icon {
        font-size: 36px;
      }

      .metric-icon ion-icon {
        width: 36px;
        height: 36px;
      }

      .metric-value {
        font-size: 24px;
      }
    }
  `],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonIcon],
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() icon = 'document-text-outline';
  @Input() detail = '';
  @Input() warning = false;

  constructor() {
    addIcons({
      'document-text-outline': documentTextOutline,
      'pricetags-outline': pricetagsOutline,
      'hardware-chip-outline': hardwareChipOutline,
      'cloud-upload-outline': cloudUploadOutline,
      'document-outline': documentOutline,
      'cloud-outline': cloudOutline,
      'warning-outline': warningOutline,
    });
  }
}
