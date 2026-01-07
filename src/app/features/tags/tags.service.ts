/**
 * Tags Service
 * Tasks T078-T091: Tag data management for filtering
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { Tag } from '../../core/models/tag.model';

@Injectable({
  providedIn: 'root',
})
export class TagsService {
  private supabase = inject(SupabaseService);

  /**
   * Get all tags
   */
  getAll(): Observable<Tag[]> {
    return from(
      this.supabase.getClient()
        .from('tags')
        .select('*')
        .order('name', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }

  /**
   * Get tags used by a specific article
   */
  getByArticleId(articleId: string): Observable<Tag[]> {
    return from(
      this.supabase.getClient()
        .from('article_tags')
        .select('tag_id, tags(*)')
        .eq('article_id', articleId)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data?.map((item: any) => item.tags).filter(Boolean) || [];
      })
    );
  }

  /**
   * Get popular tags (most used)
   */
  getPopular(limit: number = 10): Observable<Tag[]> {
    return from(
      this.supabase.getClient()
        .from('tags')
        .select('*, article_tags(count)')
        .order('article_tags.count', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }
}
