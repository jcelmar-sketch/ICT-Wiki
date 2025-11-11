/**
 * Tabs Page Component
 * Task T026: App shell with Ionic tab navigation
 *
 * Provides bottom tab navigation for:
 * - Home (featured/latest articles)
 * - Topics (category navigation)
 * - Parts (computer parts catalog)
 * - Search (unified search)
 */

import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {}
}
