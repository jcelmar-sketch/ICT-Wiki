/**
 * Highlight Pipe
 * Task T057: Render highlighted search terms in results
 * 
 * Safely renders HTML with highlighted search matches
 * using Angular's DomSanitizer to prevent XSS attacks.
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true,
})
export class HighlightPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  /**
   * Transform text with HTML highlights into safe HTML
   * @param value HTML string with <mark> tags
   * @returns Sanitized HTML safe for display
   */
  transform(value: string | null): SafeHtml {
    if (!value) return '';
    
    // Sanitize HTML to prevent XSS while allowing <mark> tags
    return this.sanitizer.sanitize(1, value) || '';
  }
}
