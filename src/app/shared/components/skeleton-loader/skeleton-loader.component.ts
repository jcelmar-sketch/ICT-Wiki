/**
 * Skeleton Loader Component
 * Task T024: Loading state placeholders for content
 *
 * Provides animated skeleton screens for different content types:
 * - article-card: Article list/grid items
 * - article-detail: Full article view
 * - part-card: Computer part grid items
 * - list: Generic list items
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export type SkeletonVariant = 'article-card' | 'article-detail' | 'part-card' | 'list';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class SkeletonLoaderComponent {
  /**
   * Type of skeleton to display
   * Defaults to 'article-card'
   */
  @Input() variant: SkeletonVariant = 'article-card';

  /**
   * Number of skeleton items to show
   * Useful for list views
   */
  @Input() count: number = 1;

  /**
   * Get array of size 'count' for *ngFor iteration
   */
  get items(): number[] {
    return Array(this.count).fill(0);
  }
}
