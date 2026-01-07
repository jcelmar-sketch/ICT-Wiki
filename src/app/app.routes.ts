/**
 * App Routes Configuration
 * Task T025: Lazy-loaded feature modules with tab-based navigation
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'articles/:slug',
    loadComponent: () =>
      import('./features/articles/article-detail/article-detail.page').then((m) => m.ArticleDetailPage),
  },
  {
    path: 'parts/:slug',
    loadComponent: () =>
      import('./features/parts/part-detail/part-detail.page').then((m) => m.PartDetailPage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings/settings.page').then( m => m.SettingsPage)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.page').then( m => m.AboutPage)
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: '**',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];