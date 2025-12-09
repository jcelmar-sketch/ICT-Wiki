import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController, ViewWillEnter } from '@ionic/angular';
import { ArticlesAdminService, ArticleListParams } from '../../../core/services/articles-admin.service';
import { ArticleAdmin } from '../../../core/models/article.model';
import { TopicsAdminService } from '../../../core/services/topics-admin.service';
import { Topic } from '../../../core/models/topic.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-articles-list',
  templateUrl: './articles-list.page.html',
  styleUrls: ['./articles-list.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, FormsModule, ReactiveFormsModule]
})
export class ArticlesListPage implements OnInit, ViewWillEnter {
  private articlesService = inject(ArticlesAdminService);
  private topicsService = inject(TopicsAdminService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  articles: ArticleAdmin[] = [];
  topics: Topic[] = [];
  loading = true;
  
  // Filters
  filterForm!: FormGroup;
  searchQuery = '';
  selectedTopic = '';
  selectedStatus = '';

  // Pagination
  currentPage = 1;
  pageSize = 25;
  totalArticles = 0;

  constructor() {}

  ngOnInit() {
    this.initializeForm();
    this.loadTopics();
  }

  ionViewWillEnter() {
    this.loadArticles();
  }

  private initializeForm() {
    this.filterForm = this.fb.group({
      search: [''],
      topic_id: [''],
      status: ['']
    });
  }

  private loadTopics() {
    this.topicsService.list().subscribe({
      next: (topics) => {
        this.topics = topics;
      },
      error: (error) => {
        console.error('Error loading topics:', error);
      }
    });
  }

  loadArticles() {
    this.loading = true;
    const params: ArticleListParams = {
      search: this.filterForm.get('search')?.value,
      topic_id: this.filterForm.get('topic_id')?.value,
      status: this.filterForm.get('status')?.value,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.articlesService.list(params)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (articles) => {
          this.articles = articles;
          console.log('Articles loaded:', articles);
        },
        error: (error) => {
          console.error('Error loading articles:', error);
          this.articles = [];
        }
      });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadArticles();
  }

  resetFilters() {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadArticles();
  }

  nextPage() {
    if ((this.currentPage * this.pageSize) < this.totalArticles) {
      this.currentPage++;
      this.loadArticles();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadArticles();
    }
  }

  async deleteArticle(article: ArticleAdmin) {
    const alert = await this.alertController.create({
      header: 'Delete Article',
      message: `Are you sure you want to move <strong>${article.title}</strong> to trash?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.performDelete(article.id);
          }
        }
      ]
    });

    await alert.present();
  }

  private performDelete(id: string) {
    this.loading = true;
    this.articlesService.delete(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: async () => {
          const toast = await this.toastController.create({
            message: 'Article moved to trash',
            duration: 2000,
            color: 'success'
          });
          await toast.present();
          this.loadArticles();
        },
        error: async (error: any) => {
          console.error('Error deleting article:', error);
          const toast = await this.toastController.create({
            message: 'Failed to delete article',
            duration: 2000,
            color: 'danger'
          });
          await toast.present();
        }
      });
  }

  getTopicName(topicId: string): string {
    const topic = this.topics.find(t => t.id === topicId);
    return topic ? topic.name : 'Unknown';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  editArticle(article: ArticleAdmin) {
    this.router.navigate(['/admin/articles/edit', article.id]);
  }

  createArticle() {
    this.router.navigate(['/admin/articles/create']);
  }
}
