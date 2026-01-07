/**
 * Part Detail Page
 * Tasks T068-T072: Computer part details with specifications
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { PartsService } from '../parts.service';
import { ComputerPart } from '../../../core/models/computer-part.model';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-part-detail',
  templateUrl: './part-detail.page.html',
  styleUrls: ['./part-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, SkeletonLoaderComponent],
})
export class PartDetailPage implements OnInit {
  private partsService = inject(PartsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  part?: ComputerPart;
  loading = true;
  error = false;

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.router.navigate(['/tabs/parts']);
      return;
    }

    this.loadPart(slug);
  }

  loadPart(slug: string) {
    this.loading = true;
    this.error = false;

    this.partsService.getBySlug(slug).subscribe({
      next: (part) => {
        this.part = part;
        this.loading = false;
      },
      error: (err) => {
        console.error('[PartDetailPage] Load error:', err);
        this.error = true;
        this.loading = false;
      },
    });
  }

  retry() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadPart(slug);
    }
  }

  goBack() {
    this.router.navigate(['/tabs/parts']);
  }

  getSpecEntries(): [string, string][] {
    const specs = this.part?.specifications || {};
    return Object.entries(specs)
      .filter(([_, value]) => value != null)
      .map(([key, value]) => [key, String(value)]);
  }

  formatSpecKey(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
