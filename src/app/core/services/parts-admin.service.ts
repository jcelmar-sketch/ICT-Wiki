/**
 * Parts Admin Service
 * Task T079: CRUD operations for parts management
 * 
 * Provides admin-specific part operations including specs management,
 * soft-delete, restore, and multi-image handling.
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { PartAdmin, PartFormData } from '../models/part.model';

export interface PartListParams {
  part_type?: string;
  brand?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PartsAdminService {
  private supabase = inject(SupabaseService);

  /**
   * List parts with filters and pagination
   * @param params - Filter and pagination parameters
   * @returns Observable of parts array
   */
  list(params: PartListParams = {}): Observable<PartAdmin[]> {
    const {
      part_type,
      brand,
      search,
      page = 1,
      pageSize = 25,
    } = params;

    return from(
      (async () => {
        const client = this.supabase.getClient();
        let query = client
          .from('computer_parts')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // Apply filters
        if (part_type) {
          query = query.eq('part_type', part_type);
        }

        if (brand) {
          query = query.ilike('brand', `%${brand}%`);
        }

        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to list parts: ${error.message}`);
        }

        return data as PartAdmin[];
      })()
    ).pipe(
      catchError((error) => {
        console.error('PartsAdminService.list error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single part by ID
   * @param id - Part UUID
   * @returns Observable of part
   */
  get(id: string): Observable<PartAdmin> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { data, error } = await client
          .from('computer_parts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw new Error(`Failed to get part: ${error.message}`);
        }

        return data as PartAdmin;
      })()
    ).pipe(
      catchError((error) => {
        console.error('PartsAdminService.get error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new part
   * @param formData - Part form data
   * @returns Observable of created part
   */
  create(formData: PartFormData): Observable<PartAdmin> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        
        const { data, error } = await client
          .from('computer_parts')
          .insert({
            name: formData.name,
            slug: formData.slug,
            part_type: formData.part_type,
            brand: formData.brand,
            description: formData.description,
            specs: formData.specs,
            images: formData.images,
            price: formData.price,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create part: ${error.message}`);
        }

        return data as PartAdmin;
      })()
    ).pipe(
      catchError((error) => {
        console.error('PartsAdminService.create error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing part
   * @param id - Part UUID
   * @param formData - Part form data
   * @returns Observable of updated part
   */
  update(id: string, formData: PartFormData): Observable<PartAdmin> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        
        const { data, error } = await client
          .from('computer_parts')
          .update({
            name: formData.name,
            slug: formData.slug,
            part_type: formData.part_type,
            brand: formData.brand,
            description: formData.description,
            specs: formData.specs,
            images: formData.images,
            price: formData.price,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update part: ${error.message}`);
        }

        return data as PartAdmin;
      })()
    ).pipe(
      catchError((error) => {
        console.error('PartsAdminService.update error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Soft-delete part (set deleted_at timestamp)
   * @param id - Part UUID
   * @returns Observable of void
   */
  softDelete(id: string): Observable<void> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { error } = await client
          .from('computer_parts')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          throw new Error(`Failed to delete part: ${error.message}`);
        }
      })()
    ).pipe(
      catchError((error) => {
        console.error('PartsAdminService.softDelete error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Restore soft-deleted part
   * @param id - Part UUID
   * @returns Observable of void
   */
  restore(id: string): Observable<void> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { error } = await client
          .from('computer_parts')
          .update({ deleted_at: null })
          .eq('id', id);

        if (error) {
          throw new Error(`Failed to restore part: ${error.message}`);
        }
      })()
    ).pipe(
      catchError((error) => {
        console.error('PartsAdminService.restore error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if slug is unique
   * @param slug - Slug to check
   * @param excludeId - Part ID to exclude from check (for updates)
   * @returns Observable of boolean (true if unique)
   */
  isSlugUnique(slug: string, excludeId?: string): Observable<boolean> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        let query = client
          .from('computer_parts')
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
        console.error('PartsAdminService.isSlugUnique error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get last updated timestamp for concurrent edit detection
   * @param id - Part UUID
   * @returns Observable of timestamp string
   */
  getLastUpdated(id: string): Observable<string> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { data, error } = await client
          .from('computer_parts')
          .select('updated_at')
          .eq('id', id)
          .single();

        if (error) {
          throw new Error(`Failed to get last updated timestamp: ${error.message}`);
        }

        return data.updated_at;
      })()
    ).pipe(
      catchError((error) => {
        console.error('PartsAdminService.getLastUpdated error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get available part types
   * @returns Observable of part type array
   */
  getPartTypes(): Observable<string[]> {
    return from(
      Promise.resolve([
        'CPU',
        'GPU',
        'RAM',
        'Storage',
        'Motherboard',
        'PSU',
        'Case',
        'Cooling',
      ])
    );
  }

  /**
   * Get available brands (distinct from database)
   * @returns Observable of brand array
   */
  getBrands(): Observable<string[]> {
    return from(
      (async () => {
        const client = this.supabase.getClient();
        const { data, error } = await client
          .from('computer_parts')
          .select('brand')
          .is('deleted_at', null)
          .order('brand');

        if (error) {
          throw new Error(`Failed to get brands: ${error.message}`);
        }

        // Extract unique brands
        const brands = [...new Set(data.map((item: any) => item.brand))];
        return brands;
      })()
    ).pipe(
      catchError((error) => {
        console.error('PartsAdminService.getBrands error:', error);
        return throwError(() => error);
      })
    );
  }
}
