import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { TopicsAdminService } from '../../../../core/services/topics-admin.service';
import { Topic } from '../../../../core/models/topic.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-topic-form',
  templateUrl: './topic-form.page.html',
  styleUrls: ['./topic-form.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterModule]
})
export class TopicFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private topicsService = inject(TopicsAdminService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  topicForm!: FormGroup;
  isEditMode = false;
  topicId: string | null = null;
  loading = false;
  submitting = false;

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
    this.setupSlugGeneration();
  }

  private initForm() {
    this.topicForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: [''],
      icon: ['folder-outline'],
      display_order: [1, [Validators.required, Validators.min(1)]]
    });
  }

  private checkEditMode() {
    this.topicId = this.route.snapshot.paramMap.get('id');
    if (this.topicId) {
      this.isEditMode = true;
      this.loadTopic(this.topicId);
    }
  }

  private loadTopic(id: string) {
    this.loading = true;
    this.topicsService.get(id).subscribe({
      next: (topic) => {
        this.topicForm.patchValue({
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
          icon: topic.icon,
          display_order: topic.order
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading topic', error);
        this.showToast('Failed to load topic', 'danger');
        this.router.navigate(['/admin/topics']);
      }
    });
  }

  private setupSlugGeneration() {
    // Auto-generate slug from name if slug is empty or untouched
    const nameControl = this.topicForm.get('name');
    const slugControl = this.topicForm.get('slug');

    if (nameControl && slugControl) {
      nameControl.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe((name) => {
          if (!this.isEditMode || slugControl.pristine) {
            const slug = this.generateSlug(name);
            slugControl.setValue(slug);
          }
        });
    }
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }

  async onSubmit() {
    if (this.topicForm.invalid) {
      this.topicForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.topicForm.value;

    // Check slug uniqueness
    // Note: In a real app, we should do this via async validator or check before submit
    // For now, we'll check before submit
    
    this.topicsService.isSlugUnique(formData.slug, this.topicId || undefined).subscribe({
      next: (isUnique) => {
        if (!isUnique) {
          this.topicForm.get('slug')?.setErrors({ notUnique: true });
          this.submitting = false;
          return;
        }

        const request$ = this.isEditMode && this.topicId
          ? this.topicsService.update(this.topicId, formData)
          : this.topicsService.create(formData);

        request$.subscribe({
          next: async () => {
            await this.showToast(
              `Topic ${this.isEditMode ? 'updated' : 'created'} successfully`,
              'success'
            );
            this.router.navigate(['/admin/topics']);
          },
          error: async (error) => {
            console.error('Error saving topic', error);
            await this.showToast('Failed to save topic', 'danger');
            this.submitting = false;
          }
        });
      },
      error: (error) => {
        console.error('Error checking slug', error);
        this.submitting = false;
      }
    });
  }

  async onDelete() {
    if (!this.topicId) return;

    // Check article count first
    this.loading = true;
    this.topicsService.checkArticleCount(this.topicId).subscribe({
      next: async (count) => {
        this.loading = false;
        if (count > 0) {
          await this.showReassignModal(this.topicId!, count);
        } else {
          await this.confirmDelete(this.topicId!);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error checking article count', error);
      }
    });
  }

  private async confirmDelete(id: string) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this topic? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.performDelete(id);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showReassignModal(topicId: string, count: number) {
    // Fetch other topics for reassignment
    this.topicsService.list().subscribe({
      next: async (topics) => {
        const otherTopics = topics.filter(t => t.id !== topicId);
        
        if (otherTopics.length === 0) {
          const alert = await this.alertController.create({
            header: 'Cannot Delete Topic',
            message: `This topic contains ${count} articles, and there are no other topics to reassign them to. Please create another topic first.`,
            buttons: ['OK']
          });
          await alert.present();
          return;
        }

        const alert = await this.alertController.create({
          header: 'Reassign Articles',
          message: `This topic contains ${count} articles. You must reassign them to another topic before deleting.`,
          inputs: [
            {
              name: 'targetTopicId',
              type: 'radio',
              label: otherTopics[0].name,
              value: otherTopics[0].id,
              checked: true
            },
            ...otherTopics.slice(1).map(t => ({
              name: 'targetTopicId',
              type: 'radio' as const,
              label: t.name,
              value: t.id
            }))
          ],
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Reassign & Delete',
              handler: (data) => {
                if (data) {
                  this.reassignAndDelete(topicId, data);
                }
              }
            }
          ]
        });
        await alert.present();
      },
      error: (error) => console.error('Error loading topics for reassignment', error)
    });
  }

  private reassignAndDelete(oldTopicId: string, newTopicId: string) {
    this.loading = true;
    this.topicsService.reassignArticles(oldTopicId, newTopicId).subscribe({
      next: () => {
        this.performDelete(oldTopicId);
      },
      error: async (error) => {
        this.loading = false;
        const toast = await this.toastController.create({
          message: 'Failed to reassign articles',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  private performDelete(id: string) {
    this.loading = true;
    this.topicsService.delete(id).subscribe({
      next: async () => {
        const toast = await this.toastController.create({
          message: 'Topic deleted successfully',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        this.router.navigate(['/admin/topics']);
      },
      error: async (error) => {
        this.loading = false;
        const toast = await this.toastController.create({
          message: 'Failed to delete topic',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }
}
