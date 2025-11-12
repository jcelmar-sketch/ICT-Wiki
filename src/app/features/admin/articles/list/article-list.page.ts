import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, documentTextOutline } from 'ionicons/icons';
import { ArticlesAdminService } from '../../../../core/services/articles-admin.service';
import { ArticleAdmin } from '../../../../core/models/article.model';

@Component({
  selector: 'app-article-list',
  templateUrl: './article-list.page.html',
  styleUrls: ['./article-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class ArticleListPage implements OnInit {
  private articlesService = inject(ArticlesAdminService);
  
  articles: ArticleAdmin[] = [];
  loading = true;
  
  // Filters
  searchQuery = '';
  selectedTopicId = '';
  selectedStatus = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 25;
  hasMore = true;

  constructor() {
    addIcons({addOutline,createOutline,trashOutline,documentTextOutline,'addOutline':addOutline,'createOutline':createOutline,'trashOutline':trashOutline,});
  }

  ngOnInit() {
    this.loadArticles();
  }

  /**
   * Load articles with current filters
   */
  loadArticles() {
    this.loading = true;
    
    const params = {
      search: this.searchQuery || undefined,
      topic_id: this.selectedTopicId || undefined,
      status: this.selectedStatus as 'draft' | 'published' | undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
    };

    this.articlesService.list(params).subscribe({
      next: (articles) => {
        this.articles = articles;
        this.hasMore = articles.length === this.pageSize;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading articles:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Handle search input
   */
  onSearchChange(event: any) {
    this.searchQuery = event.detail.value || '';
    this.currentPage = 1;
    this.loadArticles();
  }

  /**
   * Handle filter changes
   */
  onFilterChange() {
    this.currentPage = 1;
    this.loadArticles();
  }

  /**
   * Load next page
   */
  nextPage() {
    if (this.hasMore) {
      this.currentPage++;
      this.loadArticles();
    }
  }

  /**
   * Load previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadArticles();
    }
  }

  /**
   * Soft-delete article
   */
  async deleteArticle(article: ArticleAdmin, event: Event) {
    event.stopPropagation();
    
    if (!confirm(`Move "${article.title}" to trash?`)) {
      return;
    }

    this.articlesService.softDelete(article.id).subscribe({
      next: () => {
        this.loadArticles();
      },
      error: (error) => {
        console.error('Error deleting article:', error);
        alert('Failed to delete article');
      },
    });
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    return status === 'published' ? 'success' : 'warning';
  }
}
