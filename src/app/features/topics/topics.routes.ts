/**
 * Topics Feature Routes
 * Topic navigation and article lists by topic
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./topics.page').then((m) => m.TopicsPage),
  },
  {
    path: ':slug',
    loadComponent: () => import('./topic-detail/topic-detail.page').then((m) => m.TopicDetailPage),
  },
];
