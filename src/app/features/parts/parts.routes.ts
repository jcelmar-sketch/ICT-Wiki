/**
 * Parts Feature Routes
 * Computer parts catalog and details
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./parts.page').then((m) => m.PartsPage),
  },
  {
    path: ':slug',
    loadComponent: () => import('./part-detail/part-detail.page').then((m) => m.PartDetailPage),
  },
];
