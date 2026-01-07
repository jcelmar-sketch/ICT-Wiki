import { Routes } from '@angular/router';

export const topicRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/topic-list.page').then((m) => m.TopicListPage),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./edit/topic-form.page').then((m) => m.TopicFormPage),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./edit/topic-form.page').then((m) => m.TopicFormPage),
  },
];

