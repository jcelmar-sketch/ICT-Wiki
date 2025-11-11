/**
 * Topic Detail Page
 * Display articles for a specific topic with infinite scroll
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TopicsService } from '../topics.service';
import { Topic } from '../../../core/models/topic.model';
import { ArticleListComponent } from '../../articles/article-list/article-list.component';

@Component({
  selector: 'app-topic-detail',
  templateUrl: './topic-detail.page.html',
  styleUrls: ['./topic-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ArticleListComponent],
})
export class TopicDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private topicsService = inject(TopicsService);

  topic: Topic | null = null;
  loading = true;

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadTopic(slug);
    }
  }

  loadTopic(slug: string) {
    this.topicsService.getBySlug(slug).subscribe({
      next: (topic) => {
        this.topic = topic;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  goBack() {
    window.history.back();
  }
}
