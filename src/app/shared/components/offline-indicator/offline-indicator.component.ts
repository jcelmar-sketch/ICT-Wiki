/**
 * Offline Indicator Component
 * Tasks T092-T099: Network status and offline mode indicators
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-offline-indicator',
  templateUrl: './offline-indicator.component.html',
  styleUrls: ['./offline-indicator.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class OfflineIndicatorComponent implements OnInit {
  isOnline = navigator.onLine;
  showToast = false;

  ngOnInit() {
    // Listen for online/offline events
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe((online) => {
      const wasOnline = this.isOnline;
      this.isOnline = online;

      // Show toast when connection status changes
      if (wasOnline !== online) {
        this.showStatusToast();
      }
    });
  }

  private showStatusToast() {
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  get statusMessage(): string {
    return this.isOnline 
      ? 'Back online - Content will sync'
      : 'Offline mode - Using cached content';
  }

  get statusIcon(): string {
    return this.isOnline ? 'cloud-done-outline' : 'cloud-offline-outline';
  }
}
