import { Routes } from '@angular/router';

export const partRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/part-list.page').then((m) => m.PartListPage),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/part-form.page').then((m) => m.PartFormPage),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./create/part-form.page').then((m) => m.PartFormPage),
  },
];
