import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonSpinner,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, hardwareChipOutline } from 'ionicons/icons';
import { PartsAdminService } from '../../../../core/services/parts-admin.service';
import { PartAdmin } from '../../../../core/models/part.model';

@Component({
  selector: 'app-part-list',
  templateUrl: './part-list.page.html',
  styleUrls: ['./part-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonSpinner,
  ],
})
export class PartListPage implements OnInit {
  private partsService = inject(PartsAdminService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  parts: PartAdmin[] = [];
  loading = true;

  // Filters
  searchQuery = '';
  selectedType = '';
  selectedBrand = '';

  // Available filter options
  partTypes: string[] = [];
  brands: string[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 25;
  hasMore = true;

  constructor() {
    addIcons({ addOutline, createOutline, trashOutline, hardwareChipOutline });
  }

  // Expose Object.keys for template use
  getSpecKeys(specs: any): string[] {
    return Object.keys(specs || {});
  }

  ngOnInit() {
    this.loadFilterOptions();
    this.loadParts();
  }

  /**
   * Load filter options (types and brands)
   */
  loadFilterOptions() {
    this.partsService.getPartTypes().subscribe({
      next: (types) => {
        this.partTypes = types;
      },
      error: (error) => {
        console.error('Error loading part types:', error);
      },
    });

    this.partsService.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
      },
      error: (error) => {
        console.error('Error loading brands:', error);
      },
    });
  }

  /**
   * Load parts with current filters
   */
  loadParts() {
    this.loading = true;

    this.partsService
      .list({
        part_type: this.selectedType || undefined,
        brand: this.selectedBrand || undefined,
        search: this.searchQuery || undefined,
        page: this.currentPage,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (parts) => {
          this.parts = parts;
          this.hasMore = parts.length === this.pageSize;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading parts:', error);
          this.showToast('Failed to load parts', 'danger');
          this.loading = false;
        },
      });
  }

  /**
   * Handle search input change
   */
  onSearchChange(event: any) {
    this.searchQuery = event.target.value;
    this.currentPage = 1;
    this.loadParts();
  }

  /**
   * Handle filter changes
   */
  onFilterChange() {
    this.currentPage = 1;
    this.loadParts();
  }

  /**
   * Navigate to next page
   */
  nextPage() {
    if (this.hasMore) {
      this.currentPage++;
      this.loadParts();
    }
  }

  /**
   * Navigate to previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadParts();
    }
  }

  /**
   * Delete part with confirmation
   */
  async deletePart(part: PartAdmin) {
    const alert = await this.alertController.create({
      header: 'Delete Part',
      message: `Are you sure you want to delete "${part.name}"? It will be moved to trash.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.partsService.softDelete(part.id).subscribe({
              next: () => {
                this.showToast('Part moved to trash', 'success');
                this.loadParts();
              },
              error: (error) => {
                console.error('Error deleting part:', error);
                this.showToast('Failed to delete part', 'danger');
              },
            });
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Show toast notification
   */
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  /**
   * Format price for display
   */
  formatPrice(price: number | null): string {
    if (price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  }

  /**
   * Get badge color for part type
   */
  getTypeColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      CPU: 'primary',
      GPU: 'secondary',
      RAM: 'tertiary',
      Storage: 'success',
      Motherboard: 'warning',
      PSU: 'danger',
      Case: 'medium',
      Cooling: 'light',
    };
    return colorMap[type] || 'medium';
  }
}
