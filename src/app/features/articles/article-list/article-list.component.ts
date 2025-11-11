/**
 * Article List Component
 * Tasks T031, T039, T042: Paginated article list with infinite scroll
 */

import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ArticlesService } from '../articles.service';
import { ArticleCard } from '../../../core/models/article.model';
import { ArticleCardComponent } from '../../../shared/components/article-card/article-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-article-list',
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ArticleCardComponent, SkeletonLoaderComponent],
})
export class ArticleListComponent implements OnInit {
  private articlesService = inject(ArticlesService);

  @Input({ required: true }) topicId!: string;
  
  articles: ArticleCard[] = [];
  loading = true;
  loadingMore = false;
  errorMessage: string | null = null;
  
  private offset = 0;
  private readonly pageSize = environment.articlesPerPage;
  hasMore = true;

  ngOnInit() {
    this.loadArticles();
  }

  loadArticles(reset = false) {
    if (reset) {
      this.offset = 0;
      this.articles = [];
      this.hasMore = true;
    }

    this.loading = reset || this.offset === 0;
    this.loadingMore = !reset && this.offset > 0;

    this.articlesService.getByTopic(this.topicId, this.offset, this.pageSize).subscribe({
      next: (newArticles) => {
        this.articles = reset ? newArticles : [...this.articles, ...newArticles];
        this.hasMore = newArticles.length === this.pageSize;
        this.offset += newArticles.length;
        this.loading = false;
        this.loadingMore = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
        this.loadingMore = false;
      },
    });
  }

  loadMore(event: any) {
    if (!this.hasMore || this.loadingMore) {
      event.target.complete();
      return;
    }

    this.loadArticles();
    setTimeout(() => event.target.complete(), 1000);
  }

  handleRefresh(event: any) {
    this.loadArticles(true);
    setTimeout(() => event.target.complete(), 1500);
  }
}
