/**
 * Tabs Layout Routes
 * Defines tab-based navigation structure with lazy-loaded feature modules
 */

import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../features/home/home.routes').then((m) => m.routes),
      },
      {
        path: 'topics',
        loadChildren: () => import('../features/topics/topics.routes').then((m) => m.routes),
      },
      {
        path: 'parts',
        loadChildren: () => import('../features/parts/parts.routes').then((m) => m.routes),
      },
      {
        path: 'search',
        loadChildren: () => import('../features/search/search.routes').then((m) => m.routes),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
