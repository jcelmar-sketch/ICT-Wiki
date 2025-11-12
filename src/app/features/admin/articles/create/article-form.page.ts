import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonItem,
  IonLabel,
  IonSpinner,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, arrowBackOutline, trashOutline } from 'ionicons/icons';
import { ArticlesAdminService } from '../../../../core/services/articles-admin.service';
import { ArticleAdmin, ArticleFormData } from '../../../../core/models/article.model';
import { MarkdownEditorComponent } from '../components/markdown-editor/markdown-editor.component';
import { ImageUploadComponent } from '../components/image-upload/image-upload.component';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-article-form',
  templateUrl: './article-form.page.html',
  styleUrls: ['./article-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonItem,
    IonLabel,
    IonSpinner,
    MarkdownEditorComponent,
    ImageUploadComponent,
  ],
})
export class ArticleFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private articlesService = inject(ArticlesAdminService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  articleForm!: FormGroup;
  isEditMode = false;
  articleId: string | null = null;
  loading = true;
  saving = false;
  article: ArticleAdmin | null = null;
  
  // For concurrent edit detection (T070)
  private lastUpdatedTimestamp: string | null = null;

  constructor() {
    addIcons({arrowBackOutline,saveOutline,trashOutline,'saveOutline':saveOutline,'arrowBackOutline':arrowBackOutline,'trashOutline':trashOutline,});
  }

  ngOnInit() {
    this.initForm();
    this.setupSlugAutoGeneration(); // T063
    
    // Check if edit mode
    this.articleId = this.route.snapshot.paramMap.get('id');
    if (this.articleId) {
      this.isEditMode = true;
      this.loadArticle(this.articleId);
    } else {
      this.loading = false;
    }
  }

  initForm() {
    this.articleForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      content: ['', [Validators.required, Validators.minLength(100)]],
      excerpt: ['', [Validators.maxLength(500)]],
      cover_image: [null],
      topic_id: ['', Validators.required],
      status: ['draft', Validators.required],
      is_featured: [false],
    });
  }

  /**
   * T063: Setup slug auto-generation from title
   */
  setupSlugAutoGeneration() {
    this.articleForm.get('title')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((title: string) => {
        if (title && !this.articleForm.get('slug')?.dirty) {
          const slug = this.generateSlug(title);
          this.articleForm.patchValue({ slug }, { emitEvent: false });
        }
      });
  }

  /**
   * Generate URL-friendly slug from title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * T068: Load article for editing
   */
  loadArticle(id: string) {
    this.articlesService.get(id).subscribe({
      next: (article) => {
        this.article = article;
        this.lastUpdatedTimestamp = article.updated_at;
        
        this.articleForm.patchValue({
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          cover_image: article.cover_image,
          topic_id: article.topic_id,
          status: article.status,
          is_featured: article.is_featured,
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading article:', error);
        this.showToast('Failed to load article', 'danger');
        this.router.navigate(['/admin/articles']);
      },
    });
  }

  /**
   * T064, T067: Validate and save article
   */
  async onSave() {
    if (this.articleForm.invalid) {
      this.articleForm.markAllAsTouched();
      this.showToast('Please fix form errors', 'warning');
      return;
    }

    // T064: Check slug uniqueness
    const slug = this.articleForm.get('slug')?.value;
    const isUnique = await this.checkSlugUniqueness(slug);
    if (!isUnique) {
      this.articleForm.get('slug')?.setErrors({ notUnique: true });
      this.showToast('Slug already exists. Please use a different slug.', 'warning');
      return;
    }

    // T070: Concurrent edit detection for updates
    if (this.isEditMode && this.articleId) {
      const canSave = await this.checkConcurrentEdit();
      if (!canSave) {
        return;
      }
    }

    this.saving = true;
    const formData: ArticleFormData = this.articleForm.value;

    const operation = this.isEditMode && this.articleId
      ? this.articlesService.update(this.articleId, formData)
      : this.articlesService.create(formData);

    operation.subscribe({
      next: () => {
        this.showToast(
          this.isEditMode ? 'Article updated successfully' : 'Article created successfully',
          'success'
        );
        this.router.navigate(['/admin/articles']);
      },
      error: (error) => {
        console.error('Error saving article:', error);
        this.showToast('Failed to save article', 'danger');
        this.saving = false;
      },
    });
  }

  /**
   * T064: Check if slug is unique
   */
  async checkSlugUniqueness(slug: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.articlesService.isSlugUnique(slug, this.articleId || undefined).subscribe({
        next: (isUnique) => resolve(isUnique),
        error: () => resolve(true), // Allow save if check fails
      });
    });
  }

  /**
   * T070: Check for concurrent edits
   */
  async checkConcurrentEdit(): Promise<boolean> {
    if (!this.articleId || !this.lastUpdatedTimestamp) {
      return true;
    }

    return new Promise((resolve) => {
      this.articlesService.getLastUpdated(this.articleId!).subscribe({
        next: async (currentTimestamp) => {
          if (currentTimestamp !== this.lastUpdatedTimestamp) {
            const alert = await this.alertController.create({
              header: 'Concurrent Edit Detected',
              message: 'This article has been modified by another user. What would you like to do?',
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel',
                  handler: () => resolve(false),
                },
                {
                  text: 'Reload Fresh Data',
                  handler: () => {
                    this.loadArticle(this.articleId!);
                    resolve(false);
                  },
                },
                {
                  text: 'Overwrite Changes',
                  role: 'destructive',
                  handler: () => resolve(true),
                },
              ],
            });
            await alert.present();
          } else {
            resolve(true);
          }
        },
        error: () => resolve(true), // Allow save if check fails
      });
    });
  }

  /**
   * T069: Soft-delete confirmation
   */
  async onDelete() {
    if (!this.articleId) return;

    const alert = await this.alertController.create({
      header: 'Delete Article',
      message: 'Type "DELETE" to confirm moving this article to trash.',
      inputs: [
        {
          name: 'confirmation',
          type: 'text',
          placeholder: 'Type DELETE',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: (data) => {
            if (data.confirmation === 'DELETE') {
              this.deleteArticle();
              return true;
            } else {
              this.showToast('Please type DELETE to confirm', 'warning');
              return false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  deleteArticle() {
    if (!this.articleId) return;

    this.articlesService.softDelete(this.articleId).subscribe({
      next: () => {
        this.showToast('Article moved to trash', 'success');
        this.router.navigate(['/admin/articles']);
      },
      error: (error) => {
        console.error('Error deleting article:', error);
        this.showToast('Failed to delete article', 'danger');
      },
    });
  }

  /**
   * Show toast notification
   */
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.articleForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.articleForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) return 'This field is required';
    if (field.hasError('minlength')) {
      const min = field.errors['minlength'].requiredLength;
      return `Minimum ${min} characters required`;
    }
    if (field.hasError('maxlength')) {
      const max = field.errors['maxlength'].requiredLength;
      return `Maximum ${max} characters allowed`;
    }
    if (field.hasError('pattern')) return 'Only lowercase letters, numbers, and hyphens allowed';
    if (field.hasError('notUnique')) return 'This slug is already in use';

    return 'Invalid value';
  }
}
