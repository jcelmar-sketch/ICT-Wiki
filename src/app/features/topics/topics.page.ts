/**
 * Topics Page
 * Tasks T030, T038: Topic navigation with icon cards
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TopicsService } from './topics.service';
import { Topic } from '../../core/models/topic.model';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-topics',
  templateUrl: './topics.page.html',
  styleUrls: ['./topics.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, SkeletonLoaderComponent],
})
export class TopicsPage implements OnInit {
  private topicsService = inject(TopicsService);

  topics: Topic[] = [];
  loading = true;
  errorMessage: string | null = null;

  ngOnInit() {
    this.loadTopics();
  }

  loadTopics() {
    this.loading = true;
    this.topicsService.getAll().subscribe({
      next: (topics) => {
        this.topics = topics;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load topics';
        this.loading = false;
      },
    });
  }

  handleRefresh(event: any) {
    this.loadTopics();
    setTimeout(() => event.target.complete(), 1500);
  }
}
