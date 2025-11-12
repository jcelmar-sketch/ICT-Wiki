/**
 * Markdown Editor Component
 * Task T060: Textarea with live preview pane
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonTextarea, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-markdown-editor',
  template: `
    <ion-card>
      <ion-card-header>
        <div class="header-row">
          <ion-card-title>Content</ion-card-title>
          <ion-segment [(ngModel)]="activeTab" (ionChange)="onTabChange()">
            <ion-segment-button value="edit">
              <ion-label>Edit</ion-label>
            </ion-segment-button>
            <ion-segment-button value="preview">
              <ion-label>Preview</ion-label>
            </ion-segment-button>
            <ion-segment-button value="split">
              <ion-label>Split</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>
      </ion-card-header>

      <ion-card-content>
        <div class="editor-container" [class.split-view]="activeTab === 'split'">
          <!-- Editor -->
          <div class="editor-pane" *ngIf="activeTab === 'edit' || activeTab === 'split'">
            <ion-textarea
              [(ngModel)]="content"
              (ngModelChange)="onContentChange()"
              [rows]="20"
              placeholder="Write your article content in Markdown..."
              [autofocus]="true"
            ></ion-textarea>
          </div>

          <!-- Preview -->
          <div class="preview-pane" *ngIf="activeTab === 'preview' || activeTab === 'split'">
            <div 
              class="markdown-content" 
              [innerHTML]="sanitizedHtml"
              *ngIf="sanitizedHtml; else emptyPreview"
            ></div>
            <ng-template #emptyPreview>
              <p class="empty-message">Preview will appear here...</p>
            </ng-template>
          </div>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;

      ion-card-title {
        margin: 0;
      }

      ion-segment {
        min-width: 250px;
      }
    }

    .editor-container {
      display: grid;
      gap: 16px;
      min-height: 400px;

      &.split-view {
        grid-template-columns: 1fr 1fr;
      }
    }

    .editor-pane,
    .preview-pane {
      min-height: 400px;
    }

    .editor-pane ion-textarea {
      --padding-start: 12px;
      --padding-end: 12px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      border: 1px solid var(--ion-color-light);
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
    }

    .preview-pane {
      border: 1px solid var(--ion-color-light);
      border-radius: 4px;
      padding: 12px;
      overflow-y: auto;
      background: var(--ion-color-light-tint);
    }

    .markdown-content {
      h1, h2, h3, h4, h5, h6 {
        margin-top: 24px;
        margin-bottom: 12px;
      }

      p {
        margin-bottom: 12px;
        line-height: 1.6;
      }

      code {
        background: var(--ion-color-light);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.9em;
      }

      pre {
        background: var(--ion-color-light);
        padding: 12px;
        border-radius: 4px;
        overflow-x: auto;

        code {
          background: none;
          padding: 0;
        }
      }

      ul, ol {
        margin-bottom: 12px;
        padding-left: 24px;
      }

      blockquote {
        border-left: 4px solid var(--ion-color-primary);
        margin: 12px 0;
        padding: 12px 16px;
        background: var(--ion-color-light-tint);
      }

      img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
        margin: 12px 0;
      }

      a {
        color: var(--ion-color-primary);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .empty-message {
      color: var(--ion-color-medium);
      font-style: italic;
      text-align: center;
      padding: 48px 24px;
    }

    @media (max-width: 768px) {
      .header-row {
        flex-direction: column;
        align-items: flex-start;

        ion-segment {
          width: 100%;
        }
      }

      .editor-container.split-view {
        grid-template-columns: 1fr;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonTextarea,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class MarkdownEditorComponent implements OnInit, OnDestroy {
  @Input() content = '';
  @Output() contentChange = new EventEmitter<string>();

  activeTab: 'edit' | 'preview' | 'split' = 'edit';
  sanitizedHtml = '';

  private contentSubject = new Subject<string>();

  ngOnInit() {
    // Debounce content changes for preview update
    this.contentSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((content) => {
        this.updatePreview(content);
      });

    // Initial preview
    if (this.content) {
      this.updatePreview(this.content);
    }
  }

  ngOnDestroy() {
    this.contentSubject.complete();
  }

  onContentChange() {
    this.contentChange.emit(this.content);
    this.contentSubject.next(this.content);
  }

  onTabChange() {
    if (this.activeTab === 'preview' || this.activeTab === 'split') {
      this.updatePreview(this.content);
    }
  }

  private updatePreview(markdown: string) {
    if (!markdown) {
      this.sanitizedHtml = '';
      return;
    }

    try {
      // Parse markdown to HTML
      const html = marked.parse(markdown) as string;
      
      // Sanitize HTML to prevent XSS
      this.sanitizedHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'strong', 'em', 'u', 's', 'code', 'pre',
          'ul', 'ol', 'li',
          'a', 'img',
          'blockquote',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      });
    } catch (error) {
      console.error('Error parsing markdown:', error);
      this.sanitizedHtml = '<p class="error">Error parsing markdown</p>';
    }
  }
}
