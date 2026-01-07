/**
 * Specs Editor Component
 * Task T084: Predefined hardware spec fields + dynamic custom fields
 */

import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline } from 'ionicons/icons';
import { PartSpecs } from '../../../../../core/models/part.model';

@Component({
  selector: 'app-specs-editor',
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>{{ label }}</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <form [formGroup]="specsForm">
          <!-- Predefined Fields -->
          <div class="predefined-section">
            <h3>Common Specifications</h3>
            <div class="specs-grid">
              <ion-item *ngFor="let field of predefinedFields">
                <ion-label position="stacked">{{ field }}</ion-label>
                <ion-input
                  [formControlName]="field"
                  [placeholder]="'e.g., ' + getPlaceholder(field)"
                ></ion-input>
              </ion-item>
            </div>
          </div>

          <!-- Custom Fields -->
          <div class="custom-section">
            <div class="section-header">
              <h3>Custom Specifications</h3>
              <ion-button size="small" fill="outline" (click)="addCustomField()">
                <ion-icon slot="start" name="add-outline"></ion-icon>
                Add Custom Field
              </ion-button>
            </div>

            <div formArrayName="customFields">
              <div
                *ngFor="let field of customFields.controls; let i = index"
                [formGroupName]="i"
                class="custom-field-row"
              >
                <ion-item class="field-key">
                  <ion-label position="stacked">Field Name</ion-label>
                  <ion-input formControlName="key" placeholder="e.g., Socket Type"></ion-input>
                </ion-item>

                <ion-item class="field-value">
                  <ion-label position="stacked">Value</ion-label>
                  <ion-input formControlName="value" placeholder="e.g., LGA 1700"></ion-input>
                </ion-item>

                <ion-button
                  fill="clear"
                  color="danger"
                  (click)="removeCustomField(i)"
                  class="remove-btn"
                >
                  <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                </ion-button>
              </div>
            </div>

            <p class="hint" *ngIf="customFields.length === 0">
              Add custom specification fields for unique part attributes.
            </p>
          </div>
        </form>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .predefined-section,
    .custom-section {
      margin-bottom: 24px;
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-dark);
      margin: 0 0 16px 0;
    }

    .specs-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;

      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      ion-item {
        --padding-start: 0;
        --inner-padding-end: 0;
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .custom-field-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 12px;
      align-items: end;
      margin-bottom: 12px;

      @media (max-width: 767px) {
        grid-template-columns: 1fr;

        .remove-btn {
          justify-self: end;
        }
      }

      ion-item {
        --padding-start: 0;
        --inner-padding-end: 0;
      }

      .remove-btn {
        margin-bottom: 8px;
      }
    }

    .hint {
      font-size: 14px;
      color: var(--ion-color-medium);
      font-style: italic;
      text-align: center;
      padding: 16px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
  ],
})
export class SpecsEditorComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() label = 'Specifications';
  @Input() specs: PartSpecs = {};
  @Output() specsChange = new EventEmitter<PartSpecs>();

  specsForm!: FormGroup;

  predefinedFields = [
    'CPU Speed',
    'Cores',
    'Threads',
    'Base Clock',
    'Boost Clock',
    'TDP',
    'RAM Size',
    'RAM Type',
    'RAM Speed',
    'Storage Capacity',
    'Storage Type',
    'GPU Model',
    'VRAM',
    'Interface',
  ];

  constructor() {
    addIcons({ addOutline, trashOutline });
  }

  ngOnInit() {
    this.initForm();
    if (this.specs && Object.keys(this.specs).length > 0) {
      this.populateForm(this.specs);
    }

    // Subscribe to form changes
    this.specsForm.valueChanges.subscribe(() => {
      this.emitSpecs();
    });
  }

  initForm() {
    const predefinedControls: any = {};
    this.predefinedFields.forEach((field) => {
      predefinedControls[field] = [''];
    });

    this.specsForm = this.fb.group({
      ...predefinedControls,
      customFields: this.fb.array([]),
    });
  }

  populateForm(specs: PartSpecs) {
    // Populate predefined fields
    this.predefinedFields.forEach((field) => {
      if (specs[field]) {
        this.specsForm.get(field)?.setValue(specs[field]);
      }
    });

    // Populate custom fields
    Object.keys(specs).forEach((key) => {
      if (!this.predefinedFields.includes(key)) {
        this.customFields.push(
          this.fb.group({
            key: [key, [Validators.required]],
            value: [specs[key], [Validators.required]],
          })
        );
      }
    });
  }

  get customFields(): FormArray {
    return this.specsForm.get('customFields') as FormArray;
  }

  addCustomField() {
    this.customFields.push(
      this.fb.group({
        key: ['', [Validators.required]],
        value: ['', [Validators.required]],
      })
    );
  }

  removeCustomField(index: number) {
    this.customFields.removeAt(index);
  }

  emitSpecs() {
    const specs: PartSpecs = {};

    // Add predefined fields (only non-empty)
    this.predefinedFields.forEach((field) => {
      const value = this.specsForm.get(field)?.value?.trim();
      if (value) {
        specs[field] = value;
      }
    });

    // Add custom fields (only valid ones)
    this.customFields.controls.forEach((control) => {
      const key = control.get('key')?.value?.trim();
      const value = control.get('value')?.value?.trim();
      if (key && value) {
        specs[key] = value;
      }
    });

    this.specsChange.emit(specs);
  }

  getPlaceholder(field: string): string {
    const placeholders: { [key: string]: string } = {
      'CPU Speed': '3.5 GHz',
      Cores: '8',
      Threads: '16',
      'Base Clock': '3.0 GHz',
      'Boost Clock': '4.5 GHz',
      TDP: '125W',
      'RAM Size': '16GB',
      'RAM Type': 'DDR4',
      'RAM Speed': '3200 MHz',
      'Storage Capacity': '1TB',
      'Storage Type': 'NVMe SSD',
      'GPU Model': 'RTX 4070',
      VRAM: '12GB',
      Interface: 'PCIe 4.0',
    };
    return placeholders[field] || '';
  }
}
