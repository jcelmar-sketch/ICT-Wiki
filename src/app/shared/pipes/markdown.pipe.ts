/**
 * Markdown Pipe
 * Task T023: Safe markdown rendering with XSS protection
 *
 * Transforms markdown text to sanitized HTML using:
 * - marked.js for markdown parsing
 * - DOMPurify for XSS sanitization
 */

import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  constructor() {
    // Configure marked.js options
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert \n to <br>
    });
  }

  /**
   * Transform markdown text to sanitized HTML
   * @param value Markdown string
   * @returns Sanitized HTML safe for [innerHTML] binding
   */
  transform(value: string | null): string {
    if (!value) return '';

    try {
      // Step 1: Parse markdown to HTML
      const rawHtml = marked.parse(value, { async: false }) as string;

      // Step 2: Sanitize HTML to prevent XSS
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          // Text formatting
          'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
          // Headings
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          // Lists
          'ul', 'ol', 'li',
          // Tables
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          // Links and media
          'a', 'img',
          // Quotes and blocks
          'blockquote', 'hr',
          // Code blocks
          'div', 'span',
        ],
        ALLOWED_ATTR: [
          'href', 'title', 'target', 'rel', // Links
          'src', 'alt', 'width', 'height', // Images
          'class', 'id', // Styling
          'start', 'type', // Lists
        ],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
        ALLOW_DATA_ATTR: false,
        SAFE_FOR_TEMPLATES: true,
      });

      return cleanHtml;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return '<p>Error rendering content</p>';
    }
  }
}
