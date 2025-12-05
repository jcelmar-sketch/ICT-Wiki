/**
 * Topics Admin Service
 * Task T101: CRUD operations for topics management
 * 
 * Provides admin-specific topic operations including list with counts,
 * create, update, and delete with protection.
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Topic } from '../models/topic.model';

export interface TopicFormData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
}

@Injectable({
  providedIn: 'root',
})
export class TopicsAdminService {
  private supabase = inject(SupabaseService);

  /**
   * List all topics with article counts
   * @returns Observable of topics array
   */
  list(): Observable<Topic[]> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        
        // Get topics
        const { data: topics, error: topicsError } = await client
          .from('topics')
          .select('*')
          .is('deleted_at', null)
          .order('order', { ascending: true });

        if (topicsError) {
          throw new Error(`Failed to list topics: ${topicsError.message}`);
        }

        // Get article counts for each topic
        // Note: In a larger app, this might be a view or a separate query
        // For now, we'll do a count query for each topic or a group by
        // A more efficient way is to use a view or a subquery if Supabase supports it easily in JS client
        // Or we can fetch all article-topic relations.
        // Let's try a join if possible, or just separate counts if list is small (topics are usually few)
        
        // Alternative: Select count of articles
        // .select('*, articles(count)') -> this works if foreign key is set up correctly
        
        const topicsWithCounts = await Promise.all(topics.map(async (topic) => {
          const { count, error: countError } = await client
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id)
            .is('deleted_at', null);
            
          if (countError) {
            console.warn(`Failed to get count for topic ${topic.id}`, countError);
            return { ...topic, article_count: 0 };
          }
          
          return { ...topic, article_count: count || 0 };
        }));

        return topicsWithCounts as Topic[];
      })()
    ).pipe(
      catchError((error) => {
        console.error('TopicsAdminService.list error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single topic by ID
   * @param id - Topic UUID
   * @returns Observable of topic
   */
  get(id: string): Observable<Topic> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { data, error } = await client
          .from('topics')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw new Error(`Failed to get topic: ${error.message}`);
        }

        return data as Topic;
      })()
    ).pipe(
      catchError((error) => {
        console.error('TopicsAdminService.get error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new topic
   * @param formData - Topic form data
   * @returns Observable of created topic
   */
  create(formData: TopicFormData): Observable<Topic> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        
        const { data, error } = await client
          .from('topics')
          .insert({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            icon: formData.icon,
            order: formData.order,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create topic: ${error.message}`);
        }

        return data as Topic;
      })()
    ).pipe(
      catchError((error) => {
        console.error('TopicsAdminService.create error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing topic
   * @param id - Topic UUID
   * @param formData - Topic form data
   * @returns Observable of updated topic
   */
  update(id: string, formData: TopicFormData): Observable<Topic> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        
        const { data, error } = await client
          .from('topics')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            icon: formData.icon,
            order: formData.order,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update topic: ${error.message}`);
        }

        return data as Topic;
      })()
    ).pipe(
      catchError((error) => {
        console.error('TopicsAdminService.update error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check article count for a topic (for delete protection)
   * @param id - Topic UUID
   * @returns Observable of number
   */
  checkArticleCount(id: string): Observable<number> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { count, error } = await client
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', id)
          .is('deleted_at', null);

        if (error) {
          throw new Error(`Failed to check article count: ${error.message}`);
        }

        return count || 0;
      })()
    ).pipe(
      catchError((error) => {
        console.error('TopicsAdminService.checkArticleCount error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Soft-delete topic (set deleted_at timestamp)
   * @param id - Topic UUID
   * @returns Observable of void
   */
  delete(id: string): Observable<void> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { error } = await client
          .from('topics')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          throw new Error(`Failed to delete topic: ${error.message}`);
        }
      })()
    ).pipe(
      catchError((error) => {
        console.error('TopicsAdminService.delete error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if slug is unique
   * @param slug - Slug to check
   * @param excludeId - Topic ID to exclude from check (for updates)
   * @returns Observable of boolean (true if unique)
   */
  isSlugUnique(slug: string, excludeId?: string): Observable<boolean> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        let query = client
          .from('topics')
          .select('id')
          .eq('slug', slug)
          .is('deleted_at', null);

        if (excludeId) {
          query = query.neq('id', excludeId);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to check slug uniqueness: ${error.message}`);
        }

        return data.length === 0;
      })()
    ).pipe(
      catchError((error) => {
        console.error('TopicsAdminService.isSlugUnique error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Reassign articles from one topic to another
   * @param oldTopicId - Source Topic UUID
   * @param newTopicId - Target Topic UUID
   * @returns Observable of void
   */
  reassignArticles(oldTopicId: string, newTopicId: string): Observable<void> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { error } = await client
          .from('articles')
          .update({ topic_id: newTopicId })
          .eq('topic_id', oldTopicId);

        if (error) {
          throw new Error(`Failed to reassign articles: ${error.message}`);
        }
      })()
    ).pipe(
      catchError((error) => {
        console.error('TopicsAdminService.reassignArticles error:', error);
        return throwError(() => error);
      })
    );
  }
}
