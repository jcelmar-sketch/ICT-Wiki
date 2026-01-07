/**
 * Article Detail Page
 * Tasks T032, T040, T043-T045: Full article view with markdown rendering
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ArticlesService } from '../articles.service';
import { Article, RelatedArticle } from '../../../core/models/article.model';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ArticleCardComponent } from '../../../shared/components/article-card/article-card.component';

@Component({
  selector: 'app-article-detail',
  templateUrl: './article-detail.page.html',
  styleUrls: ['./article-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    MarkdownPipe,
    SkeletonLoaderComponent,
  ],
})
export class ArticleDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private articlesService = inject(ArticlesService);

  article: Article | null = null;
  relatedArticles: RelatedArticle[] = [];
  loading = true;
  loadingRelated = false;
  errorMessage: string | null = null;

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadArticle(slug);
    }
  }

  loadArticle(slug: string) {
    this.loading = true;
    this.errorMessage = null;

    this.articlesService.getBySlug(slug).subscribe({
      next: (article) => {
        this.article = article;
        this.loading = false;

        // Increment view count
        this.articlesService.incrementViewCount(article.id);

        // Load related articles
        this.loadRelated(article.id);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Article not found';
        this.loading = false;
      },
    });
  }

  loadRelated(articleId: string) {
    this.loadingRelated = true;
    this.articlesService.getRelated(articleId).subscribe({
      next: (related) => {
        this.relatedArticles = related;
        this.loadingRelated = false;
      },
      error: () => {
        this.loadingRelated = false;
      },
    });
  }

  get formattedDate(): string {
    if (!this.article) return '';
    const date = new Date(this.article.published_at);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  goBack() {
    window.history.back();
  }
}
