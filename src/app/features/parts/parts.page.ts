/**
 * Parts Page
 * Tasks T062-T067: Computer parts catalog with category filters
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { PartsService } from './parts.service';
import { ComputerPart, PartCategory } from '../../core/models/computer-part.model';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-parts',
  templateUrl: './parts.page.html',
  styleUrls: ['./parts.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, SkeletonLoaderComponent],
})
export class PartsPage implements OnInit {
  private partsService = inject(PartsService);

  parts: ComputerPart[] = [];
  selectedCategory: PartCategory | 'all' = 'all';
  loading = true;
  loadingMore = false;
  
  private offset = 0;
  private readonly pageSize = environment.partsPerPage;
  hasMore = true;

  categories: { value: PartCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Parts' },
    { value: 'cpu', label: 'Processors' },
    { value: 'gpu', label: 'Graphics Cards' },
    { value: 'ram', label: 'Memory (RAM)' },
    { value: 'storage', label: 'Storage' },
    { value: 'motherboard', label: 'Motherboards' },
    { value: 'psu', label: 'Power Supplies' },
    { value: 'cooling', label: 'Cooling' },
    { value: 'case', label: 'Cases' },
    { value: 'peripherals', label: 'Peripherals' },
  ];

  ngOnInit() {
    this.loadParts();
  }

  loadParts(reset = false) {
    if (reset) {
      this.offset = 0;
      this.parts = [];
      this.hasMore = true;
    }

    this.loading = reset || this.offset === 0;
    this.loadingMore = !reset && this.offset > 0;

    const loadObservable = this.selectedCategory === 'all'
      ? this.partsService.getAll(this.offset, this.pageSize)
      : this.partsService.getByCategory(this.selectedCategory as PartCategory, this.offset, this.pageSize);

    loadObservable.subscribe({
      next: (newParts) => {
        this.parts = reset ? newParts : [...this.parts, ...newParts];
        this.hasMore = newParts.length === this.pageSize;
        this.offset += newParts.length;
        this.loading = false;
        this.loadingMore = false;
      },
      error: () => {
        this.loading = false;
        this.loadingMore = false;
      },
    });
  }

  onCategoryChange(event: any) {
    this.selectedCategory = event.detail.value;
    this.loadParts(true);
  }

  getSpecsCount(specs: any): number {
    if (!specs || typeof specs !== 'object') return 0;
    return Object.keys(specs).filter(key => specs[key] != null).length;
  }

  loadMore(event: any) {
    if (!this.hasMore || this.loadingMore) {
      event.target.complete();
      return;
    }

    this.loadParts();
    setTimeout(() => event.target.complete(), 1000);
  }

  handleRefresh(event: any) {
    this.loadParts(true);
    setTimeout(() => event.target.complete(), 1500);
  }

  getCategoryLabel(category: PartCategory): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }
}
