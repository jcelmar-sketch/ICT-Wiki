/**
 * Supabase Service
 * Task T018: Centralized Supabase client with typed queries and Storage access
 *
 * Provides singleton access to Supabase client initialized with
 * environment variables, type-safe query helpers, and Storage URL generation.
 */

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: false, // Read-only app, no authentication needed
        },
      }
    );
  }

  /**
   * Get the Supabase client instance
   * Use for custom queries not covered by service methods
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get public URL for a file in Supabase Storage
   * @param bucket - Storage bucket name (e.g., 'articles', 'parts')
   * @param path - File path within bucket (e.g., 'covers/article-123.jpg')
   * @returns Public URL string or null if invalid
   */
  getStorageUrl(bucket: string, path: string | null): string | null {
    if (!path) return null;
    
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data?.publicUrl || null;
  }

  /**
   * Test connection to Supabase
   * @returns Promise that resolves if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('topics')
        .select('id', { count: 'exact', head: true });
      return !error;
    } catch {
      return false;
    }
  }
}
