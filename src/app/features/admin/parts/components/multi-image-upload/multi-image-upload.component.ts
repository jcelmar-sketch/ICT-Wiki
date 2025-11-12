/**
 * Multi-Image Upload Component
 * Task T085: Multiple file upload with reorder and remove
 */

import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  arrowUpOutline,
  arrowDownOutline,
} from 'ionicons/icons';
import { SupabaseService } from '../../../../../core/services/supabase.service';

interface ImageItem {
  url: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

@Component({
  selector: 'app-multi-image-upload',
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>{{ label }}</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <!-- Upload Area -->
        <div
          class="upload-area"
          [class.drag-over]="isDragging"
          (drop)="onDrop($event)"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (click)="fileInput.click()"
        >
          <ion-icon name="cloud-upload-outline"></ion-icon>
          <p class="upload-text">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p class="upload-hint">JPEG, PNG, WEBP (max 5MB each)</p>
          <input
            #fileInput
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style="display: none"
            (change)="onFileSelect($event)"
          />
        </div>

        <!-- Image Grid -->
        <ion-grid *ngIf="images.length > 0" class="images-grid">
          <ion-row>
            <ion-col
              *ngFor="let image of images; let i = index"
              size="12"
              size-sm="6"
              size-md="4"
              class="image-col"
            >
              <div class="image-item" [class.uploading]="image.uploading">
                <!-- Image Preview -->
                <img [src]="image.url" [alt]="'Image ' + (i + 1)" />

                <!-- Upload Progress -->
                <div class="upload-overlay" *ngIf="image.uploading">
                  <ion-progress-bar [value]="(image.progress || 0) / 100"></ion-progress-bar>
                  <span class="progress-text">{{ image.progress }}%</span>
                </div>

                <!-- Error State -->
                <div class="error-overlay" *ngIf="image.error">
                  <ion-icon name="close-circle-outline"></ion-icon>
                  <span class="error-text">{{ image.error }}</span>
                </div>

                <!-- Actions -->
                <div class="image-actions" *ngIf="!image.uploading && !image.error">
                  <ion-button
                    size="small"
                    fill="clear"
                    (click)="moveUp(i)"
                    [disabled]="i === 0"
                  >
                    <ion-icon slot="icon-only" name="arrow-up-outline"></ion-icon>
                  </ion-button>
                  <ion-button
                    size="small"
                    fill="clear"
                    (click)="moveDown(i)"
                    [disabled]="i === images.length - 1"
                  >
                    <ion-icon slot="icon-only" name="arrow-down-outline"></ion-icon>
                  </ion-button>
                  <ion-button
                    size="small"
                    fill="clear"
                    color="danger"
                    (click)="removeImage(i)"
                  >
                    <ion-icon slot="icon-only" name="close-circle-outline"></ion-icon>
                  </ion-button>
                </div>

                <!-- Image Number Badge -->
                <div class="image-number">{{ i + 1 }}</div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Info Message -->
        <p class="info-message" *ngIf="images.length === 0">
          No images uploaded yet. Click or drag files to upload.
        </p>
        <p class="info-message" *ngIf="images.length > 0">
          {{ images.length }} image(s) uploaded. First image will be used as primary.
        </p>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .upload-area {
      border: 2px dashed var(--ion-color-medium);
      border-radius: 12px;
      padding: 40px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: var(--ion-color-light);

      &:hover {
        border-color: var(--ion-color-primary);
        background: var(--ion-color-primary-tint);
      }

      &.drag-over {
        border-color: var(--ion-color-primary);
        background: var(--ion-color-primary-tint);
        border-style: solid;
      }

      ion-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
        margin-bottom: 12px;
      }

      .upload-text {
        margin: 0 0 4px 0;
        color: var(--ion-color-dark);

        strong {
          color: var(--ion-color-primary);
        }
      }

      .upload-hint {
        margin: 0;
        font-size: 12px;
        color: var(--ion-color-medium);
      }
    }

    .images-grid {
      margin-top: 24px;
      padding: 0;
    }

    .image-col {
      padding: 8px;
    }

    .image-item {
      position: relative;
      width: 100%;
      padding-top: 100%; /* 1:1 Aspect Ratio */
      border-radius: 8px;
      overflow: hidden;
      background: var(--ion-color-light);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .upload-overlay,
      .error-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.7);
        color: white;

        ion-progress-bar {
          width: 80%;
          margin-bottom: 8px;
        }

        .progress-text {
          font-size: 14px;
          font-weight: 500;
        }

        ion-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .error-text {
          font-size: 12px;
          padding: 0 12px;
          text-align: center;
        }
      }

      .error-overlay {
        background: rgba(var(--ion-color-danger-rgb), 0.9);
      }

      .image-actions {
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s ease;

        ion-button {
          --background: rgba(0, 0, 0, 0.6);
          --color: white;
          --border-radius: 50%;
          width: 32px;
          height: 32px;
        }
      }

      &:hover .image-actions {
        opacity: 1;
      }

      .image-number {
        position: absolute;
        bottom: 8px;
        left: 8px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
      }
    }

    .info-message {
      margin-top: 16px;
      font-size: 14px;
      color: var(--ion-color-medium);
      text-align: center;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonProgressBar,
    IonGrid,
    IonRow,
    IonCol,
  ],
})
export class MultiImageUploadComponent {
  private supabase = inject(SupabaseService);

  @Input() label = 'Product Images';
  @Input() bucket = 'parts';
  @Input() imageUrls: string[] = [];
  @Output() imageUrlsChange = new EventEmitter<string[]>();

  images: ImageItem[] = [];
  isDragging = false;

  constructor() {
    addIcons({
      'cloud-upload-outline': cloudUploadOutline,
      'close-circle-outline': closeCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'arrow-up-outline': arrowUpOutline,
      'arrow-down-outline': arrowDownOutline,
    });
  }

  ngOnInit() {
    if (this.imageUrls && this.imageUrls.length > 0) {
      this.images = this.imageUrls.map((url) => ({ url }));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
    // Reset input
    event.target.value = '';
  }

  handleFiles(files: File[]) {
    files.forEach((file) => {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        this.images.push({
          url: '',
          error: validation.error,
        });
        return;
      }

      // Add placeholder
      const imageItem: ImageItem = {
        url: URL.createObjectURL(file),
        uploading: true,
        progress: 0,
      };
      this.images.push(imageItem);

      // Upload file
      this.uploadFile(file, imageItem);
    });
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large (max 5MB)' };
    }

    return { valid: true };
  }

  async uploadFile(file: File, imageItem: ImageItem) {
    try {
      const client = this.supabase.getClient();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${this.bucket}/${fileName}`;

      const { data, error } = await client.storage
        .from(this.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = client.storage.from(this.bucket).getPublicUrl(filePath);

      // Update image item
      imageItem.url = urlData.publicUrl;
      imageItem.uploading = false;
      imageItem.progress = 100;

      // Emit updated URLs
      this.emitUrls();
    } catch (error: any) {
      console.error('Upload error:', error);
      imageItem.uploading = false;
      imageItem.error = error.message || 'Upload failed';
    }
  }

  moveUp(index: number) {
    if (index > 0) {
      const temp = this.images[index];
      this.images[index] = this.images[index - 1];
      this.images[index - 1] = temp;
      this.emitUrls();
    }
  }

  moveDown(index: number) {
    if (index < this.images.length - 1) {
      const temp = this.images[index];
      this.images[index] = this.images[index + 1];
      this.images[index + 1] = temp;
      this.emitUrls();
    }
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
    this.emitUrls();
  }

  emitUrls() {
    const urls = this.images
      .filter((img) => !img.uploading && !img.error && img.url)
      .map((img) => img.url);
    this.imageUrlsChange.emit(urls);
  }
}
