import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonBadge,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, arrowBackOutline, trashOutline } from 'ionicons/icons';
import { PartsAdminService } from '../../../../core/services/parts-admin.service';
import { PartAdmin, PartFormData, PartSpecs } from '../../../../core/models/part.model';
import { SpecsEditorComponent } from '../components/specs-editor/specs-editor.component';
import { MultiImageUploadComponent } from '../components/multi-image-upload/multi-image-upload.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivityLogService } from '../../../../core/services/activity-log.service';
import { ActivityLog, ActionType } from '../../../../core/models/activity-log.model';

@Component({
  selector: 'app-part-form',
  templateUrl: './part-form.page.html',
  styleUrls: ['./part-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonBadge,
    SpecsEditorComponent,
    MultiImageUploadComponent,
  ],
})
export class PartFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private partsService = inject(PartsAdminService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private activityLogService = inject(ActivityLogService);

  partForm!: FormGroup;
  isEditMode = false;
  partId: string | null = null;
  loading = true;
  saving = false;
  part: PartAdmin | null = null;

  partTypes: string[] = [];
  brands: string[] = [];

  // For concurrent edit detection
  private lastUpdatedTimestamp: string | null = null;
  activityHistory: ActivityLog[] = [];
  historyLoading = false;

  constructor() {
    addIcons({ arrowBackOutline, saveOutline, trashOutline });
  }

  ngOnInit() {
    this.initForm();
    this.setupSlugAutoGeneration();
    this.loadFilterOptions();

    // Check if edit mode
    this.partId = this.route.snapshot.paramMap.get('id');
    if (this.partId) {
      this.isEditMode = true;
      this.loadPart(this.partId);
    } else {
      this.loading = false;
    }
  }

  initForm() {
    this.partForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      part_type: ['', Validators.required],
      brand: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      specs: [{}],
      images: [[]],
      price: [null, [Validators.min(0)]],
    });
  }

  loadFilterOptions() {
    this.partsService.getPartTypes().subscribe({
      next: (types) => {
        this.partTypes = types;
      },
    });

    this.partsService.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
      },
    });
  }

  /**
   * Setup slug auto-generation from name
   */
  setupSlugAutoGeneration() {
    this.partForm
      .get('name')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((name: string) => {
        if (name && !this.partForm.get('slug')?.dirty) {
          const slug = this.generateSlug(name);
          this.partForm.patchValue({ slug }, { emitEvent: false });
        }
      });
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Load part for editing
   */
  loadPart(id: string) {
    this.partsService.get(id).subscribe({
      next: (part) => {
        this.part = part;
        this.lastUpdatedTimestamp = part.updated_at;

        this.partForm.patchValue({
          name: part.name,
          slug: part.slug,
          part_type: part.part_type,
          brand: part.brand,
          description: part.description,
          specs: part.specs,
          images: part.images,
          price: part.price,
        });

        this.loading = false;
        this.loadActivityHistory(part.id);
      },
      error: (error) => {
        console.error('Error loading part:', error);
        this.showToast('Failed to load part', 'danger');
        this.router.navigate(['/admin/parts']);
      },
    });
  }

  /**
   * Validate and save part
   */
  async onSave() {
    if (this.partForm.invalid) {
      this.partForm.markAllAsTouched();
      this.showToast('Please fix form errors', 'warning');
      return;
    }

    // Check slug uniqueness
    const slug = this.partForm.get('slug')?.value;
    const isUnique = await this.checkSlugUniqueness(slug);
    if (!isUnique) {
      this.partForm.get('slug')?.setErrors({ notUnique: true });
      this.showToast('Slug already exists. Please use a different slug.', 'warning');
      return;
    }

    // Concurrent edit detection for updates
    if (this.isEditMode && this.partId) {
      const canSave = await this.checkConcurrentEdit();
      if (!canSave) {
        return;
      }
    }

    this.saving = true;
    const formData: PartFormData = this.partForm.value;

    const operation = this.isEditMode && this.partId
      ? this.partsService.update(this.partId, formData)
      : this.partsService.create(formData);

    operation.subscribe({
      next: () => {
        this.showToast(
          this.isEditMode ? 'Part updated successfully' : 'Part created successfully',
          'success'
        );
        this.router.navigate(['/admin/parts']);
      },
      error: (error) => {
        console.error('Error saving part:', error);
        this.showToast('Failed to save part', 'danger');
        this.saving = false;
      },
    });
  }

  /**
   * Check if slug is unique
   */
  async checkSlugUniqueness(slug: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.partsService.isSlugUnique(slug, this.partId || undefined).subscribe({
        next: (isUnique) => resolve(isUnique),
        error: () => resolve(true),
      });
    });
  }

  /**
   * Check for concurrent edits
   */
  async checkConcurrentEdit(): Promise<boolean> {
    if (!this.partId || !this.lastUpdatedTimestamp) {
      return true;
    }

    return new Promise((resolve) => {
      this.partsService.getLastUpdated(this.partId!).subscribe({
        next: async (currentTimestamp) => {
          if (currentTimestamp !== this.lastUpdatedTimestamp) {
            const alert = await this.alertController.create({
              header: 'Concurrent Edit Detected',
              message: 'This part has been modified by another user. What would you like to do?',
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel',
                  handler: () => resolve(false),
                },
                {
                  text: 'Reload Fresh Data',
                  handler: () => {
                    this.loadPart(this.partId!);
                    resolve(false);
                  },
                },
                {
                  text: 'Overwrite Changes',
                  role: 'destructive',
                  handler: () => resolve(true),
                },
              ],
            });
            await alert.present();
          } else {
            resolve(true);
          }
        },
        error: () => resolve(true),
      });
    });
  }

  /**
   * Soft-delete confirmation
   */
  async onDelete() {
    if (!this.partId) return;

    const alert = await this.alertController.create({
      header: 'Delete Part',
      message: 'Are you sure you want to move this part to trash?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deletePart();
          },
        },
      ],
    });

    await alert.present();
  }

  deletePart() {
    if (!this.partId) return;

    this.partsService.softDelete(this.partId).subscribe({
      next: () => {
        this.showToast('Part moved to trash', 'success');
        this.router.navigate(['/admin/parts']);
      },
      error: (error) => {
        console.error('Error deleting part:', error);
        this.showToast('Failed to delete part', 'danger');
      },
    });
  }

  loadActivityHistory(partId: string) {
    this.historyLoading = true;
    this.activityLogService.getItemHistory('part', partId).subscribe({
      next: (logs) => {
        this.activityHistory = logs.slice(0, 10);
        this.historyLoading = false;
      },
      error: (error) => {
        console.error('Failed to load activity history', error);
        this.historyLoading = false;
      },
    });
  }

  formatAction(action: string | ActionType): string {
    return `${action}`.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  actionBadgeColor(action: ActionType | string): string {
    const map: Record<string, string> = {
      [ActionType.CREATE]: 'primary',
      [ActionType.EDIT]: 'tertiary',
      [ActionType.DELETE]: 'danger',
      [ActionType.RESTORE]: 'success',
      [ActionType.PERMANENT_DELETE]: 'danger',
      [ActionType.PUBLISH]: 'success',
      [ActionType.UNPUBLISH]: 'medium',
      [ActionType.LOGIN_SUCCESS]: 'success',
      [ActionType.LOGIN_FAILURE]: 'warning',
    };
    return map[action as string] || 'medium';
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Handle specs change from SpecsEditorComponent
   */
  onSpecsChange(specs: PartSpecs) {
    this.partForm.patchValue({ specs });
  }

  /**
   * Handle images change from MultiImageUploadComponent
   */
  onImagesChange(images: string[]) {
    this.partForm.patchValue({ images });
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
   * Check if form field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.partForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.partForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) return 'This field is required';
    if (field.hasError('minlength')) {
      const min = field.errors['minlength'].requiredLength;
      return `Minimum ${min} characters required`;
    }
    if (field.hasError('maxlength')) {
      const max = field.errors['maxlength'].requiredLength;
      return `Maximum ${max} characters allowed`;
    }
    if (field.hasError('pattern')) return 'Only lowercase letters, numbers, and hyphens allowed';
    if (field.hasError('notUnique')) return 'This slug is already in use';
    if (field.hasError('min')) return 'Value must be positive';

    return 'Invalid value';
  }
}
