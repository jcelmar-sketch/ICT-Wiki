import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Admin API Service Base Class
 * 
 * Provides common CRUD operations and error handling for admin features.
 * Designed to be extended by specific resource services (articles, parts, categories).
 * 
 * Features:
 * - Generic CRUD methods with Supabase
 * - Standardized error handling
 * - Soft-delete support
 * - Pagination helpers
 * - RLS-aware queries (uses admin JWT token)
 * 
 * Usage:
 * ```typescript
 * @Injectable()
 * export class ArticleAdminService extends AdminApiService<Article> {
 *   constructor() {
 *     super('articles');
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AdminApiService<T = any> {
  protected supabase!: SupabaseClient;
  protected tableName: string;

  constructor(tableName: string = '') {
    this.tableName = tableName;
    this.initializeSupabase();
  }

  protected async initializeSupabase(): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        }
      }
    );
  }

  /**
   * Get all items with optional filtering and pagination
   * 
   * @param options Query options (filters, pagination, sorting)
   * @returns Observable of items array
   */
  getAll(options?: {
    filters?: { [key: string]: any };
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
  }): Observable<T[]> {
    return from(this.performGetAll(options || {})).pipe(
      catchError(this.handleError)
    );
  }

  private async performGetAll(options: any): Promise<T[]> {
    await this.initializeSupabase();

    let query = this.supabase
      .from(this.tableName)
      .select('*');

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Exclude soft-deleted items by default
    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    // Pagination
    if (options.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    // Sorting
    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.ascending !== false
      });
    } else {
      // Default sort by created_at descending
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
    }

    return (data as T[]) || [];
  }

  /**
   * Get a single item by ID
   * 
   * @param id Item ID
   * @param includeDeleted Whether to include soft-deleted items
   * @returns Observable of item or null
   */
  getById(id: string, includeDeleted: boolean = false): Observable<T | null> {
    return from(this.performGetById(id, includeDeleted)).pipe(
      catchError(this.handleError)
    );
  }

  private async performGetById(id: string, includeDeleted: boolean): Promise<T | null> {
    await this.initializeSupabase();

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to fetch ${this.tableName} by ID: ${error.message}`);
    }

    return data as T;
  }

  /**
   * Create a new item
   * 
   * @param item Item data
   * @returns Observable of created item
   */
  create(item: Partial<T>): Observable<T> {
    return from(this.performCreate(item)).pipe(
      catchError(this.handleError)
    );
  }

  private async performCreate(item: Partial<T>): Promise<T> {
    await this.initializeSupabase();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(item as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }

    return data as T;
  }

  /**
   * Update an existing item
   * 
   * @param id Item ID
   * @param updates Partial item data to update
   * @returns Observable of updated item
   */
  update(id: string, updates: Partial<T>): Observable<T> {
    return from(this.performUpdate(id, updates)).pipe(
      catchError(this.handleError)
    );
  }

  private async performUpdate(id: string, updates: Partial<T>): Promise<T> {
    await this.initializeSupabase();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }

    return data as T;
  }

  /**
   * Soft-delete an item (sets deleted_at timestamp)
   * 
   * @param id Item ID
   * @returns Observable of boolean success
   */
  softDelete(id: string): Observable<boolean> {
    return from(this.performSoftDelete(id)).pipe(
      catchError(this.handleError)
    );
  }

  private async performSoftDelete(id: string): Promise<boolean> {
    await this.initializeSupabase();

    const { error } = await this.supabase
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to soft-delete ${this.tableName}: ${error.message}`);
    }

    return true;
  }

  /**
   * Restore a soft-deleted item (clears deleted_at timestamp)
   * 
   * @param id Item ID
   * @returns Observable of boolean success
   */
  restore(id: string): Observable<boolean> {
    return from(this.performRestore(id)).pipe(
      catchError(this.handleError)
    );
  }

  private async performRestore(id: string): Promise<boolean> {
    await this.initializeSupabase();

    const { error } = await this.supabase
      .from(this.tableName)
      .update({ deleted_at: null } as any)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to restore ${this.tableName}: ${error.message}`);
    }

    return true;
  }

  /**
   * Permanently delete an item (hard delete)
   * 
   * @param id Item ID
   * @returns Observable of boolean success
   */
  permanentDelete(id: string): Observable<boolean> {
    return from(this.performPermanentDelete(id)).pipe(
      catchError(this.handleError)
    );
  }

  private async performPermanentDelete(id: string): Promise<boolean> {
    await this.initializeSupabase();

    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to permanently delete ${this.tableName}: ${error.message}`);
    }

    return true;
  }

  /**
   * Get count of items with optional filters
   * 
   * @param filters Optional filters
   * @param includeDeleted Whether to include soft-deleted items
   * @returns Observable of count
   */
  getCount(filters?: { [key: string]: any }, includeDeleted: boolean = false): Observable<number> {
    return from(this.performGetCount(filters, includeDeleted)).pipe(
      catchError(this.handleError)
    );
  }

  private async performGetCount(filters?: { [key: string]: any }, includeDeleted: boolean = false): Promise<number> {
    await this.initializeSupabase();

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Search items by text query
   * 
   * @param searchColumn Column to search in
   * @param searchTerm Search term
   * @param options Additional query options
   * @returns Observable of matching items
   */
  search(searchColumn: string, searchTerm: string, options?: {
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }): Observable<T[]> {
    return from(this.performSearch(searchColumn, searchTerm, options || {})).pipe(
      catchError(this.handleError)
    );
  }

  private async performSearch(searchColumn: string, searchTerm: string, options: any): Promise<T[]> {
    await this.initializeSupabase();

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .ilike(searchColumn, `%${searchTerm}%`);

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    if (options.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to search ${this.tableName}: ${error.message}`);
    }

    return (data as T[]) || [];
  }

  /**
   * Standardized error handler
   */
  protected handleError(error: any): Observable<never> {
    console.error('AdminApiService error:', error);
    
    const errorMessage = error?.message || 'An unexpected error occurred';
    
    return throwError(() => new Error(errorMessage));
  }
}
