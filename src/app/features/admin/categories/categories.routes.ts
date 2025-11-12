import { Routes } from '@angular/router';

export const categoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./categories-list.page').then((m) => m.CategoriesListPage),
  },
];
