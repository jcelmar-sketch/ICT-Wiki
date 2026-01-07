import { TestBed } from '@angular/core/testing';
import { MarkdownEditorComponent } from './markdown-editor.component';

describe('MarkdownEditorComponent security', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MarkdownEditorComponent],
    });
  });

  it('strips dangerous script content while keeping safe HTML', () => {
    const fixture = TestBed.createComponent(MarkdownEditorComponent);
    const component = fixture.componentInstance;

    component.content = '# Title <script>alert(1)</script><img src="x" onerror="alert(2)">';
    component.activeTab = 'preview';
    component.onTabChange();

    // DomSanitizer removes dangerous attributes but may keep img tag
    expect(component.sanitizedHtml).toContain('Title');
    expect(component.sanitizedHtml).not.toContain('<script>');
    expect(component.sanitizedHtml).not.toContain('onerror');
  });

  it('renders allowed markdown elements', () => {
    const fixture = TestBed.createComponent(MarkdownEditorComponent);
    const component = fixture.componentInstance;

    component.content = '*italic* **bold** [link](https://example.com)';
    component.activeTab = 'preview';
    component.onTabChange();

    expect(component.sanitizedHtml).toContain('<em>italic</em>');
    expect(component.sanitizedHtml).toContain('<strong>bold</strong>');
    expect(component.sanitizedHtml).toContain('href="https://example.com"');
  });
});
