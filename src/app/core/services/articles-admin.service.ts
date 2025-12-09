/**
 * Articles Admin Service
 * Task T055: CRUD operations for article management
 * 
 * Provides admin-specific article operations including draft management,
 * soft-delete, restore, and author tracking.
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { ArticleAdmin, ArticleFormData } from '../models/article.model';

export interface ArticleListParams {
  topic_id?: string;
  status?: 'draft' | 'published';
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ArticlesAdminService {
  private supabase = inject(SupabaseService);

  /**
   * List articles with filters and pagination
   * @param params - Filter and pagination parameters
   * @returns Observable of articles array
   */
  list(params: ArticleListParams = {}): Observable<ArticleAdmin[]> {
    const {
      topic_id,
      status,
      search,
      page = 1,
      pageSize = 25,
    } = params;

    return from(
      (async () => {
        const client = this.supabase.getClient();
        let query = client
          .from('articles')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // Apply filters
        if (topic_id) {
          query = query.eq('topic_id', topic_id);
        }
        if (status) {
          query = query.eq('status', status);
        }
        if (search) {
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        // Apply pagination
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;
        query = query.range(start, end);

        const { data, error } = await query;
        if (error) throw error;
        return data as ArticleAdmin[];
      })()
    ).pipe(
      catchError((error) => {
        console.error('Error listing articles:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single article by ID
   * @param id - Article UUID
   * @returns Observable of article
   */
  get(id: string): Observable<ArticleAdmin> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { data, error } = await client
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data as ArticleAdmin;
      })()
    ).pipe(
      catchError((error) => {
        console.error('Error fetching article:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new article
   * @param formData - Article data
   * @returns Observable of created article
   */
  create(formData: ArticleFormData): Observable<ArticleAdmin> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const user = await this.supabase.getUser();

        const articleData = {
          ...formData,
          author_id: user?.id || null,
          published_at: formData.status === 'published' ? new Date().toISOString() : null,
          view_count: 0,
        };

        const { data, error } = await client
          .from('articles')
          .insert(articleData)
          .select()
          .single();

        if (error) throw error;
        return data as ArticleAdmin;
      })()
    ).pipe(
      catchError((error) => {
        console.error('Error creating article:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing article
   * @param id - Article UUID
   * @param formData - Updated article data
   * @returns Observable of updated article
   */
  update(id: string, formData: Partial<ArticleFormData>): Observable<ArticleAdmin> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        
        const updateData: any = {
          ...formData,
          updated_at: new Date().toISOString(),
        };

        // Set published_at when changing status to published
        if (formData.status === 'published') {
          const { data: currentArticle } = await client
            .from('articles')
            .select('published_at')
            .eq('id', id)
            .single();

          if (!currentArticle?.published_at) {
            updateData.published_at = new Date().toISOString();
          }
        }

        const { data, error } = await client
          .from('articles')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as ArticleAdmin;
      })()
    ).pipe(
      catchError((error) => {
        console.error('Error updating article:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Soft-delete article (move to trash)
   * @param id - Article UUID
   * @returns Observable of void
   */
  softDelete(id: string): Observable<void> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { error } = await client
          .from('articles')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
      })()
    ).pipe(
      catchError((error) => {
        console.error('Error soft-deleting article:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete article (alias for softDelete)
   * @param id - Article UUID
   * @returns Observable of void
   */
  delete(id: string): Observable<void> {
    return this.softDelete(id);
  }

  /**
   * Restore article from trash
   * @param id - Article UUID
   * @returns Observable of void
   */
  restore(id: string): Observable<void> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { error } = await client
          .from('articles')
          .update({ deleted_at: null })
          .eq('id', id);

        if (error) throw error;
      })()
    ).pipe(
      catchError((error) => {
        console.error('Error restoring article:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if slug is unique
   * @param slug - Article slug
   * @param excludeId - Optional article ID to exclude from check (for updates)
   * @returns Observable of boolean (true if unique)
   */
  isSlugUnique(slug: string, excludeId?: string): Observable<boolean> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        let query = client
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('slug', slug);

        if (excludeId) {
          query = query.neq('id', excludeId);
        }

        const { count, error } = await query;
        if (error) throw error;
        return count === 0;
      })()
    ).pipe(
      catchError((error) => {
        console.error('Error checking slug uniqueness:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get article's last updated timestamp for concurrent edit detection
   * @param id - Article UUID
   * @returns Observable of ISO timestamp
   */
  getLastUpdated(id: string): Observable<string> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { data, error } = await client
          .from('articles')
          .select('updated_at')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data.updated_at;
      })()
    ).pipe(
      catchError((error) => {
        console.error('Error fetching last updated timestamp:', error);
        return throwError(() => error);
      })
    );
  }
}
