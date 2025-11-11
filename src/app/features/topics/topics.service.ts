/**
 * Topics Service
 * Fetch and manage topic data from Supabase
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { Topic, TopicNavItem } from '../../core/models/topic.model';

@Injectable({
  providedIn: 'root',
})
export class TopicsService {
  private supabase = inject(SupabaseService);

  /**
   * Get all topics ordered by display order
   */
  getAll(): Observable<Topic[]> {
    return from(
      this.supabase.getClient()
        .from('topics')
        .select('*')
        .order('order', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }

  /**
   * Get topic by slug
   */
  getBySlug(slug: string): Observable<Topic> {
    return from(
      this.supabase.getClient()
        .from('topics')
        .select('*')
        .eq('slug', slug)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }
}
