/**
 * Search Page
 * Tasks T048-T061: Unified search across articles and computer parts
 * Tasks T078-T091: Filter integration for enhanced discovery
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { SearchService } from '../../core/services/search.service';
import { ArticlesService } from '../articles/articles.service';
import { TopicsService } from '../topics/topics.service';
import { TagsService } from '../tags/tags.service';
import { SearchResult, SearchQuery } from '../../core/models/search-result.model';
import { Topic } from '../../core/models/topic.model';
import { Tag } from '../../core/models/tag.model';
import { ArticleCard } from '../../core/models/article.model';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { TagFilterComponent } from '../../shared/components/tag-filter/tag-filter.component';
import { TopicFilterComponent } from '../../shared/components/topic-filter/topic-filter.component';
import { HighlightPipe } from '../../shared/pipes/highlight.pipe';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule, 
    RouterModule, 
    SkeletonLoaderComponent,
    TagFilterComponent,
    TopicFilterComponent,
    HighlightPipe,
  ],
})
export class SearchPage implements OnInit {
  private searchService = inject(SearchService);
  private articlesService = inject(ArticlesService);
  private topicsService = inject(TopicsService);
  private tagsService = inject(TagsService);

  searchQuery = '';
  results: SearchResult[] = [];
  loading = false;
  searched = false;
  errorMessage: string | null = null;

  // Pre-loaded articles with pagination
  articles: ArticleCard[] = [];
  currentPage = 1;
  pageSize = 5;
  totalArticles = 0;

  // Filter state
  showFilters = false;
  topics: Topic[] = [];
  tags: Tag[] = [];
  selectedTopic: string | null = null;
  selectedTags: string[] = [];
  sortOrder: 'latest' | 'oldest' = 'latest';

  private searchSubject = new Subject<string>();

  ngOnInit() {
    // Load pre-existing articles
    this.loadArticles();

    // Initialize search indexes
    this.initializeIndexes();

    // Load filter data
    this.loadFilters();

    // Restore filter state from sessionStorage
    this.restoreFilterState();

    // Debounce search input
    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.performSearch(query);
    });
  }

  /**
   * Load latest articles for initial display
   */
  loadArticles() {
    this.loading = true;
    this.articlesService.getLatest(100).subscribe({
      next: (articles) => {
        this.articles = articles;
        this.totalArticles = articles.length;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load articles';
        this.loading = false;
        console.error('Error loading articles:', error);
      },
    });
  }

  loadFilters() {
    this.topicsService.getAll().subscribe({
      next: (topics) => {
        this.topics = topics;
      },
    });

    this.tagsService.getPopular(20).subscribe({
      next: (tags) => {
        this.tags = tags;
      },
    });
  }

  initializeIndexes() {
    // Load articles for indexing
    this.articlesService.getLatest(500).subscribe({
      next: (articles) => {
        // Convert ArticleCard to Article-like format for indexing
        const articlesForIndex = articles.map(card => ({
          id: card.id,
          title: card.title,
          slug: card.slug,
          content: card.excerpt || '',
          excerpt: card.excerpt,
          cover_image: card.cover_image,
          topic_id: '',
          published_at: card.published_at,
          created_at: '',
          updated_at: '',
          view_count: 0,
          is_featured: false,
        }));
        this.searchService.indexArticles(articlesForIndex);
      },
    });

    // Index computer parts (US3)
    // Lazy-loaded to avoid circular dependencies
    import('../parts/parts.service').then(({ PartsService }) => {
      const partsService = inject(PartsService);
      partsService.getAll(0, 500).subscribe({
        next: (parts) => {
          this.searchService.indexParts(parts);
        },
      });
    });
  }

  onSearchInput(event: any) {
    const query = event.target.value || '';
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    if (!query.trim()) {
      this.results = [];
      this.searched = false;
      this.currentPage = 1; // Reset pagination
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    try {
      const searchQuery: SearchQuery = {
        query,
        limit: 50,
      };

      this.results = this.searchService.search(searchQuery);
      this.searched = true;
      this.loading = false;
    } catch (error: any) {
      this.errorMessage = error.message || 'Search failed';
      this.loading = false;
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.results = [];
    this.searched = false;
    this.currentPage = 1; // Reset pagination
  }

  /**
   * Get sorted articles based on sort order
   */
  get sortedArticles(): ArticleCard[] {
    const sorted = [...this.articles];
    if (this.sortOrder === 'latest') {
      // Sort by published_at descending (newest first)
      sorted.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    } else {
      // Sort by published_at ascending (oldest first)
      sorted.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
    }
    return sorted;
  }

  /**
   * Get paginated articles for current page
   */
  get paginatedArticles(): ArticleCard[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.sortedArticles.slice(startIndex, endIndex);
  }

  /**
   * Get total number of pages
   */
  get totalPages(): number {
    return Math.ceil(this.totalArticles / this.pageSize);
  }

  /**
   * Navigate to next page
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /**
   * Navigate to previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getResultLink(result: SearchResult): string[] {
    return result.type === 'article' 
      ? ['/articles', result.slug]
      : ['/parts', result.slug];
  }

  /**
   * Get highlighted title with search matches
   * @param result Search result with match data
   * @returns HTML string with highlighted matches
   */
  getHighlightedTitle(result: SearchResult): string {
    if (!result.matches?.title) {
      return result.title;
    }
    return this.searchService.highlightMatches(result.title, result.matches.title);
  }

  /**
   * Get highlighted excerpt with search matches
   * @param result Search result with match data
   * @returns HTML string with highlighted matches
   */
  getHighlightedExcerpt(result: SearchResult): string {
    if (!result.excerpt) {
      return '';
    }
    if (!result.matches?.excerpt) {
      return result.excerpt;
    }
    return this.searchService.highlightMatches(result.excerpt, result.matches.excerpt);
  }

  // Filter event handlers
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  onTopicSelected(topicId: string) {
    this.selectedTopic = topicId;
    this.saveFilterState();
    this.applyFilters();
  }

  onTopicCleared() {
    this.selectedTopic = null;
    this.saveFilterState();
    this.applyFilters();
  }

  onTagSelected(tagId: string) {
    if (!this.selectedTags.includes(tagId)) {
      this.selectedTags = [...this.selectedTags, tagId];
      this.saveFilterState();
      this.applyFilters();
    }
  }

  onTagDeselected(tagId: string) {
    this.selectedTags = this.selectedTags.filter(id => id !== tagId);
    this.saveFilterState();
    this.applyFilters();
  }

  onClearAllTags() {
    this.selectedTags = [];
    this.saveFilterState();
    this.applyFilters();
  }

  applyFilters() {
    if (this.searchQuery) {
      this.performSearch(this.searchQuery);
    } else {
      // Reset to first page when sort order changes
      this.currentPage = 1;
    }
  }

  onSortOrderChange(order: 'latest' | 'oldest') {
    this.sortOrder = order;
    this.currentPage = 1; // Reset to first page
    this.saveFilterState();
  }

  get hasActiveFilters(): boolean {
    return this.selectedTopic !== null || this.selectedTags.length > 0;
  }

  /**
   * Save filter state to sessionStorage
   */
  private saveFilterState() {
    const filterState = {
      searchQuery: this.searchQuery,
      selectedTopic: this.selectedTopic,
      selectedTags: this.selectedTags,
      sortOrder: this.sortOrder,
    };
    sessionStorage.setItem('ict-wiki-search-filters', JSON.stringify(filterState));
  }

  /**
   * Restore filter state from sessionStorage
   */
  private restoreFilterState() {
    try {
      const savedState = sessionStorage.getItem('ict-wiki-search-filters');
      if (savedState) {
        const filterState = JSON.parse(savedState);
        this.searchQuery = filterState.searchQuery || '';
        this.selectedTopic = filterState.selectedTopic || null;
        this.selectedTags = filterState.selectedTags || [];
        this.sortOrder = filterState.sortOrder || 'latest';

        // Trigger search if query exists
        if (this.searchQuery) {
          this.performSearch(this.searchQuery);
        }
      }
    } catch (error) {
      console.error('Failed to restore filter state:', error);
    }
  }

  /**
   * Clear all filters and reset state
   */
  clearAllFilters() {
    this.selectedTopic = null;
    this.selectedTags = [];
    this.searchQuery = '';
    this.results = [];
    this.searched = false;
    sessionStorage.removeItem('ict-wiki-search-filters');
  }
}
