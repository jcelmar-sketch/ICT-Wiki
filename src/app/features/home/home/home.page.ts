/**
 * Home Page
 * Tasks T029, T037: Featured and latest articles with skeleton loaders
 *
 * Features:
 * - Featured articles section (max 5)
 * - Latest articles section (paginated)
 * - Pull-to-refresh
 * - Skeleton loaders during fetch
 * - Error handling with retry
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ArticlesService } from '../../articles/articles.service';
import { ArticleCard } from '../../../core/models/article.model';
import { ArticleCardComponent } from '../../../shared/components/article-card/article-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonicModule,
    ArticleCardComponent,
    SkeletonLoaderComponent,
  ],
})
export class HomePage implements OnInit {
  private articlesService = inject(ArticlesService);

  featuredArticles: ArticleCard[] = [];
  latestArticles: ArticleCard[] = [];
  
  loadingFeatured = true;
  loadingLatest = true;
  errorMessage: string | null = null;

  ngOnInit() {
    this.loadContent();
  }

  /**
   * Load featured and latest articles
   * T037: Load featured and latest, show skeleton loaders
   */
  loadContent() {
    this.loadingFeatured = true;
    this.loadingLatest = true;
    this.errorMessage = null;

    // Load featured articles
    this.articlesService.getFeatured().subscribe({
      next: (articles) => {
        this.featuredArticles = articles;
        this.loadingFeatured = false;
      },
      error: (error) => {
        console.error('[HomePage] Featured error:', error);
        this.errorMessage = error.message || 'Failed to load featured articles';
        this.loadingFeatured = false;
      },
    });

    // Load latest articles
    this.articlesService.getLatest(10).subscribe({
      next: (articles) => {
        this.latestArticles = articles;
        this.loadingLatest = false;
      },
      error: (error) => {
        console.error('[HomePage] Latest error:', error);
        if (!this.errorMessage) {
          this.errorMessage = error.message || 'Failed to load latest articles';
        }
        this.loadingLatest = false;
      },
    });
  }

  /**
   * Handle pull-to-refresh
   * T041: Pull-to-refresh in HomePage
   */
  handleRefresh(event: any) {
    this.loadContent();
    
    // Wait for both to complete
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  /**
   * Retry loading on error
   */
  retry() {
    this.loadContent();
  }
}
