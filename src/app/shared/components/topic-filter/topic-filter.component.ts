/**
 * Topic Filter Component
 * Tasks T086-T091: Topic filtering for articles
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Topic } from '../../../core/models/topic.model';

@Component({
  selector: 'app-topic-filter',
  templateUrl: './topic-filter.component.html',
  styleUrls: ['./topic-filter.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TopicFilterComponent {
  @Input() topics: Topic[] = [];
  @Input() selectedTopic: string | null = null;
  @Output() topicSelected = new EventEmitter<string>();
  @Output() clearSelection = new EventEmitter<void>();

  isSelected(topicId: string): boolean {
    return this.selectedTopic === topicId;
  }

  selectTopic(topicId: string) {
    if (this.isSelected(topicId)) {
      this.clearSelection.emit();
    } else {
      this.topicSelected.emit(topicId);
    }
  }

  onClearSelection() {
    this.clearSelection.emit();
  }

  get hasSelection(): boolean {
    return this.selectedTopic !== null;
  }

  getTopicIcon(topic: Topic): string {
    const iconMap: Record<string, string> = {
      hardware: 'hardware-chip-outline',
      networking: 'wifi-outline',
      software: 'code-slash-outline',
      security: 'shield-checkmark-outline',
      database: 'server-outline',
    };
    return iconMap[topic.slug] || 'book-outline';
  }
}
