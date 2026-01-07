/**
 * Tag Filter Component
 * Tasks T078-T085: Tag filtering for articles
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Tag } from '../../../core/models/tag.model';

@Component({
  selector: 'app-tag-filter',
  templateUrl: './tag-filter.component.html',
  styleUrls: ['./tag-filter.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TagFilterComponent {
  @Input() tags: Tag[] = [];
  @Input() selectedTags: string[] = [];
  @Output() tagSelected = new EventEmitter<string>();
  @Output() tagDeselected = new EventEmitter<string>();
  @Output() clearAll = new EventEmitter<void>();

  isSelected(tagId: string): boolean {
    return this.selectedTags.includes(tagId);
  }

  toggleTag(tagId: string) {
    if (this.isSelected(tagId)) {
      this.tagDeselected.emit(tagId);
    } else {
      this.tagSelected.emit(tagId);
    }
  }

  onClearAll() {
    this.clearAll.emit();
  }

  get hasSelection(): boolean {
    return this.selectedTags.length > 0;
  }
}
