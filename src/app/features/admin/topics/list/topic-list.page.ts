import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController, ViewWillEnter } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TopicsAdminService } from '../../../../core/services/topics-admin.service';
import { Topic } from '../../../../core/models/topic.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-topic-list',
  templateUrl: './topic-list.page.html',
  styleUrls: ['./topic-list.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class TopicListPage implements ViewWillEnter {
  private topicsService = inject(TopicsAdminService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  topics$ = new BehaviorSubject<Topic[]>([]);
  loading = false;

  ionViewWillEnter() {
    this.loadTopics();
  }

  loadTopics() {
    this.loading = true;
    this.topicsService.list()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (topics) => {
          console.log('Topics loaded successfully:', topics);
          this.topics$.next(topics);
        },
        error: (error) => {
          console.error('Error loading topics:', error);
          this.topics$.next([]);
        }
      });
  }

  async deleteTopic(topic: Topic) {
    // Check article count first
    if (topic.article_count && topic.article_count > 0) {
      await this.showReassignModal(topic);
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete <strong>${topic.name}</strong>? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.performDelete(topic.id);
          }
        }
      ]
    });

    await alert.present();
  }

  private async showReassignModal(topic: Topic) {
    const topics = this.topics$.value.filter(t => t.id !== topic.id);
    
    if (topics.length === 0) {
      const alert = await this.alertController.create({
        header: 'Cannot Delete Topic',
        message: `This topic contains ${topic.article_count} articles, and there are no other topics to reassign them to. Please create another topic first.`,
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Reassign Articles',
      message: `This topic contains ${topic.article_count} articles. You must reassign them to another topic before deleting.`,
      inputs: [
        {
          name: 'targetTopicId',
          type: 'radio',
          label: topics[0].name,
          value: topics[0].id,
          checked: true
        },
        ...topics.slice(1).map(t => ({
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
              this.reassignAndDelete(topic.id, data);
            }
          }
        }
      ]
    });

    await alert.present();
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
    this.topicsService.delete(id).subscribe({
      next: async () => {
        const toast = await this.toastController.create({
          message: 'Topic deleted successfully',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        this.loadTopics();
      },
      error: async (error) => {
        const toast = await this.toastController.create({
          message: 'Failed to delete topic',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }
}
