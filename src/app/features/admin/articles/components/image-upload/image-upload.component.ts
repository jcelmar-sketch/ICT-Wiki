/**
 * Image Upload Component
 * Task T061: Drag-drop, progress bar, and preview
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
  IonImg,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, closeCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../../../core/services/supabase.service';

@Component({
  selector: 'app-image-upload',
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
          [class.has-image]="imageUrl"
          (drop)="onDrop($event)"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (click)="openFilePicker(fileInput, $event)"
          (keydown.enter)="openFilePicker(fileInput, $event)"
          (keydown.space)="openFilePicker(fileInput, $event)"
          tabindex="0"
          role="button"
          aria-label="Upload image"
        >
          <!-- Preview -->
          <div class="preview" *ngIf="imageUrl">
            <ion-img [src]="imageUrl" [alt]="label"></ion-img>
            <ion-button
              class="remove-btn"
              fill="clear"
              color="danger"
              (click)="removeImage($event)"
            >
              <ion-icon slot="icon-only" name="close-circle-outline"></ion-icon>
            </ion-button>
          </div>

          <!-- Upload Prompt -->
          <div class="upload-prompt" *ngIf="!imageUrl && !uploading">
            <ion-icon name="cloud-upload-outline"></ion-icon>
            <p>Tap or drag an image</p>
            <small>Max 5MB • JPG, PNG, WebP • Camera or library</small>
          </div>

          <!-- Uploading State -->
          <div class="uploading-state" *ngIf="uploading">
            <ion-progress-bar [value]="uploadProgress / 100"></ion-progress-bar>
            <p>Uploading... {{ uploadProgress }}%</p>
          </div>

          <!-- Success State -->
          <div class="success-state" *ngIf="uploadSuccess">
            <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
            <p>Upload successful!</p>
          </div>

          <!-- Error State -->
          <div class="error-state" *ngIf="uploadError">
            <ion-icon name="close-circle-outline" color="danger"></ion-icon>
            <p>{{ uploadError }}</p>
          </div>
        </div>

        <!-- Hidden File Input -->
        <input
          #fileInput
          type="file"
          [attr.accept]="accept"
          [attr.capture]="capture"
          (change)="onFileSelected($event)"
          style="display: none"
        />
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .upload-area {
      position: relative;
      min-height: 200px;
      border: 2px dashed var(--ion-color-medium);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      overflow: hidden;

      &:hover {
        border-color: var(--ion-color-primary);
        background: var(--ion-color-primary-tint);
      }

      &.drag-over {
        border-color: var(--ion-color-primary);
        background: var(--ion-color-primary-tint);
        border-style: solid;
      }

      &.has-image {
        border-style: solid;
        border-color: var(--ion-color-light);
      }
    }

    .preview {
      position: relative;
      width: 100%;

      ion-img {
        width: 100%;
        height: auto;
        max-height: 400px;
        object-fit: contain;
      }

      .remove-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        --background: rgba(0, 0, 0, 0.6);
        --border-radius: 50%;
      }
    }

    .upload-prompt,
    .uploading-state,
    .success-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;

      ion-icon {
        font-size: 64px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      p {
        margin: 8px 0;
        color: var(--ion-color-dark);
      }

      small {
        color: var(--ion-color-medium);
        font-size: 12px;
      }
    }

    .uploading-state {
      ion-progress-bar {
        width: 100%;
        max-width: 300px;
        margin-bottom: 16px;
      }
    }

    .success-state ion-icon {
      color: var(--ion-color-success);
    }

    .error-state {
      ion-icon {
        color: var(--ion-color-danger);
      }

      p {
        color: var(--ion-color-danger);
      }
    }

    @media (max-width: 767px) {
      .upload-area {
        min-height: 160px;
        padding: 16px;
      }

      .upload-prompt,
      .uploading-state,
      .success-state,
      .error-state {
        padding: 24px 12px;

        ion-icon {
          font-size: 48px;
        }
      }
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
    IonImg,
  ],
})
export class ImageUploadComponent {
  private supabase = inject(SupabaseService);
  
  @Input() label = 'Cover Image';
  @Input() bucket = 'articles';
  @Input() capture: string | null = 'environment';
  @Input() accept = 'image/jpeg,image/png,image/webp';
  @Input() imageUrl: string | null = null;
  @Output() imageUrlChange = new EventEmitter<string | null>();

  isDragging = false;
  uploading = false;
  uploadProgress = 0;
  uploadSuccess = false;
  uploadError = '';

  constructor() {
    addIcons({
      'cloud-upload-outline': cloudUploadOutline,
      'close-circle-outline': closeCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
    });
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
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
  }

  openFilePicker(input: HTMLInputElement, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    input.click();
  }

  async uploadFile(file: File) {
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.uploadError = 'Invalid file type. Use JPG, PNG, or WebP.';
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.uploadError = 'File too large. Maximum size is 5MB.';
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;
    this.uploadError = '';
    this.uploadSuccess = false;

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const filepath = `${this.bucket}/${filename}`;

      // Upload to Supabase Storage
      const client = this.supabase.getClient();
      const { data, error } = await client.storage
        .from(this.bucket)
        .upload(filepath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const publicUrl = this.supabase.getStorageUrl(this.bucket, data.path);
      
      this.uploadProgress = 100;
      this.uploadSuccess = true;
      this.imageUrl = publicUrl;
      this.imageUrlChange.emit(publicUrl);

      // Reset success state after 2 seconds
      setTimeout(() => {
        this.uploadSuccess = false;
        this.uploading = false;
      }, 2000);
    } catch (error: any) {
      console.error('Upload error:', error);
      this.uploadError = error.message || 'Upload failed';
      this.uploading = false;
    }
  }

  removeImage(event: Event) {
    event.stopPropagation();
    this.imageUrl = null;
    this.imageUrlChange.emit(null);
    this.uploadProgress = 0;
    this.uploadSuccess = false;
    this.uploadError = '';
  }
}
