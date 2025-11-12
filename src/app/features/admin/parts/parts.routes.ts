import { Routes } from '@angular/router';

export const partRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./parts-list.page').then((m) => m.PartsListPage),
  },
];
