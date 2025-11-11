/**
 * Articles Service
 * Tasks T034-T036: Article data management with Supabase and caching
 * Tasks T078-T091: Filter support for tags and topics
 *
 * Provides methods for fetching articles with offline support:
 * - getFeatured(): Featured articles for home page
 * - getLatest(): Latest published articles
 * - getByTopic(): Articles filtered by topic
 * - getById(): Single article with full content
 * - getRelated(): Related articles for "You may also like"
 * - getFiltered(): Articles filtered by multiple criteria
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';
import { Article, ArticleCard, ArticleWithTopic, RelatedArticle } from '../../core/models/article.model';
import { environment } from '../../../environments/environment';

export interface ArticleFilter {
  topicId?: string;
  tagIds?: string[];
  searchQuery?: string;
  offset?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ArticlesService {
  private supabase = inject(SupabaseService);
  private cache = inject(CacheService);

  /**
   * Get featured articles for home page
   * Ordered by published_at DESC, limited to 5
   * T035: Fetch with is_featured=true
   */
  getFeatured(): Observable<ArticleCard[]> {
    return from(
      this.supabase.getClient()
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          cover_image,
          published_at,
          topic_id,
          topics!inner(name, slug)
        `)
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(5)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToArticleCards(data || []);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get latest published articles
   * Ordered by published_at DESC
   * T035: Order by published_at DESC
   */
  getLatest(limit: number = environment.articlesPerPage): Observable<ArticleCard[]> {
    return from(
      this.supabase.getClient()
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          cover_image,
          published_at,
          topic_id,
          topics!inner(name, slug)
        `)
        .order('published_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToArticleCards(data || []);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get articles by topic with pagination
   * T035: Filter by topic_id
   */
  getByTopic(topicId: string, offset: number = 0, limit: number = environment.articlesPerPage): Observable<ArticleCard[]> {
    return from(
      this.supabase.getClient()
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          cover_image,
          published_at,
          topic_id,
          topics!inner(name, slug)
        `)
        .eq('topic_id', topicId)
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToArticleCards(data || []);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get single article by ID with full content
   * T036: Cache on view, retrieve from cache when offline
   */
  getById(id: string): Observable<Article> {
    // Try cache first (T036)
    return from(this.cache.getArticle(id)).pipe(
      switchMap(cached => {
        if (cached) {
          console.log('[ArticlesService] Serving from cache:', id);
          return of(cached);
        }

        // Fetch from Supabase
        return from(
          this.supabase.getClient()
            .from('articles')
            .select('*')
            .eq('id', id)
            .single()
        ).pipe(
          map(({ data, error }) => {
            if (error) throw error;
            if (!data) throw new Error('Article not found');

            // Cache for offline access (T036)
            this.cache.cacheArticle(data).catch(err => 
              console.warn('[ArticlesService] Cache failed:', err)
            );

            return data;
          })
        );
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get article by slug (for routing)
   * T036: Cache on view
   */
  getBySlug(slug: string): Observable<Article> {
    return from(
      this.supabase.getClient()
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Article not found');

        // Cache for offline access (T036)
        this.cache.cacheArticle(data).catch(err => 
          console.warn('[ArticlesService] Cache failed:', err)
        );

        return data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get related articles for "You may also like" section
   * Maximum 5 related articles ordered by order field
   */
  getRelated(articleId: string): Observable<RelatedArticle[]> {
    return from(
      this.supabase.getClient()
        .from('related_articles')
        .select(`
          order,
          related_article_id,
          articles!related_articles_related_article_id_fkey(
            id,
            title,
            slug,
            excerpt,
            cover_image
          )
        `)
        .eq('article_id', articleId)
        .order('order', { ascending: true })
        .limit(5)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((item: any) => ({
          id: item.articles.id,
          title: item.articles.title,
          slug: item.articles.slug,
          excerpt: item.articles.excerpt,
          cover_image: item.articles.cover_image,
          order: item.order,
        }));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Increment view count for analytics
   * Fire-and-forget (don't block UI)
   */
  incrementViewCount(articleId: string): void {
    this.supabase.getClient()
      .rpc('increment_view_count', { article_id: articleId })
      .then(({ error }) => {
        if (error) console.warn('[ArticlesService] View count failed:', error);
      });
  }

  /**
   * Map Supabase response to ArticleCard model
   * Transforms cover_image path to full Supabase Storage URL
   */
  private mapToArticleCards(data: any[]): ArticleCard[] {
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      cover_image: this.supabase.getStorageUrl('articles', item.cover_image),
      published_at: item.published_at,
      topic_name: item.topics?.name || '',
      topic_slug: item.topics?.slug || '',
    }));
  }

  /**
   * Get filtered articles (US4: Filter & Discovery)
   * T078-T091: Combined filtering by topic, tags, and search query
   */
  getFiltered(filter: ArticleFilter): Observable<ArticleCard[]> {
    const offset = filter.offset || 0;
    const limit = filter.limit || environment.articlesPerPage;

    return new Observable(observer => {
      (async () => {
        let query = this.supabase.getClient()
          .from('articles')
          .select(`
            id,
            title,
            slug,
            excerpt,
            cover_image,
            published_at,
            topics (
              name,
              slug
            )
          `);

        // Apply topic filter
        if (filter.topicId) {
          query = query.eq('topic_id', filter.topicId);
        }

        // Apply tag filter (requires join with article_tags)
        if (filter.tagIds && filter.tagIds.length > 0) {
          // Get article IDs that have the specified tags
          const { data: taggedArticles } = await this.supabase.getClient()
            .from('article_tags')
            .select('article_id')
            .in('tag_id', filter.tagIds);
          
          if (taggedArticles && taggedArticles.length > 0) {
            const articleIds = taggedArticles.map(ta => ta.article_id);
            query = query.in('id', articleIds);
          } else {
            // No articles match the tag filter, return empty
            observer.next([]);
            observer.complete();
            return;
          }
        }

        // Apply search query (basic text search)
        if (filter.searchQuery) {
          query = query.or(`title.ilike.%${filter.searchQuery}%,excerpt.ilike.%${filter.searchQuery}%`);
        }

        // Apply ordering and pagination
        query = query
          .order('published_at', { ascending: false })
          .range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
          observer.error(error);
          return;
        }

        observer.next(this.mapToArticleCards(data || []));
        observer.complete();
      })();
    });
  }

  /**
   * Centralized error handling
   */
  private handleError(error: any): Observable<never> {
    console.error('[ArticlesService] Error:', error);
    
    // Check if offline
    if (!navigator.onLine) {
      return throwError(() => new Error('You are offline. Please check your internet connection.'));
    }

    return throwError(() => error);
  }
}
