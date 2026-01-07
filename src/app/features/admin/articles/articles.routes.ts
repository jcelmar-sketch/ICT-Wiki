import { Routes } from '@angular/router';

export const articleRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./articles-list.page').then((m) => m.ArticlesListPage),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/article-form.page').then((m) => m.ArticleFormPage),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./create/article-form.page').then((m) => m.ArticleFormPage),
  },
];
