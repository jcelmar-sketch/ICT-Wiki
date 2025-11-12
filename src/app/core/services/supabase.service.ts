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
          persistSession: true, // Enable session persistence for admin auth
          autoRefreshToken: true,
          detectSessionInUrl: true,
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

  // Admin Auth Methods (T015)

  /**
   * Get current admin session
   * @returns Promise with session data or null
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  /**
   * Get current admin user
   * @returns Promise with user data or null
   */
  async getUser() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  /**
   * Sign in with email and password
   * @param email - Admin email
   * @param password - Admin password
   * @returns Promise with session data
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Sign out current admin user
   * @returns Promise that resolves when signed out
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Send password recovery email
   * @param email - Admin email
   * @returns Promise that resolves when email is sent
   */
  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    if (error) throw error;
  }

  /**
   * Listen to auth state changes
   * @param callback - Function to call when auth state changes
   * @returns Subscription object with unsubscribe method
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}
