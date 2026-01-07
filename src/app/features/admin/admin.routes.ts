/**
 * Admin Dashboard Routes
 * Lazy-loaded admin feature routes with authentication guards
 */

import { Routes } from '@angular/router';
import { adminAuthGuard } from '../../core/guards/admin-auth.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.page').then(
        (m) => m.ForgotPasswordPage
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    canActivate: [adminAuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'articles',
        loadChildren: () =>
          import('./articles/articles.routes').then((m) => m.articleRoutes),
      },
      {
        path: 'parts',
        loadChildren: () =>
          import('./parts/parts.routes').then((m) => m.partRoutes),
      },
      {
        path: 'topics',
        loadChildren: () =>
          import('./topics/topics.routes').then(
            (m) => m.topicRoutes
          ),
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('./activity/activity.page').then((m) => m.ActivityPage),
      },
      {
        path: 'trash',
        loadComponent: () =>
          import('./trash/trash.page').then((m) => m.TrashPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/settings.page').then((m) => m.AdminSettingsPage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
