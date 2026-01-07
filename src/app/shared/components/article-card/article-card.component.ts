/**
 * Article Card Component
 * Task T033: Reusable card for article list/grid display
 *
 * Features:
 * - Cover image with fallback
 * - Title, excerpt, topic, publish date
 * - Tap to navigate to article detail
 * - Accessibility with semantic HTML
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ArticleCard } from '../../../core/models/article.model';

@Component({
  selector: 'app-article-card',
  templateUrl: './article-card.component.html',
  styleUrls: ['./article-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class ArticleCardComponent {
  @Input({ required: true }) article!: ArticleCard;
  @Input() layout: 'list' | 'grid' = 'list';

  /**
   * Format publish date to readable string
   */
  get formattedDate(): string {
    const date = new Date(this.article.published_at);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get cover image URL or placeholder
   */
  get imageUrl(): string {
    return this.article.cover_image || 'assets/images/article-placeholder.svg';
  }
}
