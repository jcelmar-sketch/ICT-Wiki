import { Routes } from '@angular/router';

export const articleRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./articles-list.page').then((m) => m.ArticlesListPage),
  },
];
