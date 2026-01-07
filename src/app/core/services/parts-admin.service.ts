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
  private partsTable: 'computer_parts' | 'parts' | null = null;

  // Resolve the canonical parts table in this environment (try computer_parts then parts)
  private async resolvePartsTable(): Promise<'computer_parts' | 'parts'> {
    if (this.partsTable) return this.partsTable;

    const client = this.supabase.getClient();
    try {
      const { error: cpuErr } = await client.from('computer_parts').select('id', { head: true });
      if (!cpuErr) {
        this.partsTable = 'computer_parts';
        return 'computer_parts';
      }
    } catch { /* ignore */ }

    try {
      const { error: partsErr } = await client.from('parts').select('id', { head: true });
      if (!partsErr) {
        this.partsTable = 'parts';
        return 'parts';
      }
    } catch { /* ignore */ }

    // Default to computer_parts if neither exists (queries will then fail with clearer error)
    this.partsTable = 'computer_parts';
    return 'computer_parts';
  }

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

        // Detect availability of both tables and fetch from both if present
        let computerExists = false;
        let partsExists = false;
        try {
          const { error: e1 } = await client.from('computer_parts').select('id', { head: true });
          computerExists = !e1;
        } catch {}
        try {
          const { error: e2 } = await client.from('parts').select('id', { head: true });
          partsExists = !e2;
        } catch {}

        // Helper to normalize rows to PartAdmin shape
        const normalize = (row: any, table: 'computer_parts' | 'parts'): PartAdmin => {
          if (table === 'computer_parts') {
            return {
              id: row.id,
              name: row.name,
              slug: row.slug,
              part_type: row.category,
              brand: row.manufacturer,
              description: row.description,
              specs: row.specs_json || row.specs || null,
              images: row.image ? [row.image] : [],
              price: row.price ?? null,
              created_at: row.created_at,
              updated_at: row.updated_at,
              deleted_at: row.deleted_at || null,
            } as PartAdmin;
          }
          return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            part_type: row.type,
            brand: row.brand,
            description: row.description,
            specs: row.specs || row.specs_json || null,
            images: row.image ? [row.image] : [],
            price: row.price ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at || null,
          } as PartAdmin;
        };

        const results: PartAdmin[] = [];

        // Query each table with filters applied and collect results
        if (computerExists) {
          let q = client.from('computer_parts').select('*').order('created_at', { ascending: false });
          if (part_type) q = q.eq('category', part_type);
          if (brand) q = q.ilike('manufacturer', `%${brand}%`);
          if (search) q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
          const fromIdx = (page - 1) * pageSize;
          const toIdx = fromIdx + pageSize - 1;
          q = q.range(fromIdx, toIdx);
          const { data: rows, error } = await q;
          if (error) throw new Error(`Failed to list computer_parts: ${error.message}`);
          (rows || []).forEach((r: any) => results.push(normalize(r, 'computer_parts')));
        }

        if (partsExists) {
          let q = client.from('parts').select('*').order('created_at', { ascending: false });
          if (part_type) q = q.eq('type', part_type);
          if (brand) q = q.ilike('brand', `%${brand}%`);
          if (search) q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
          const fromIdx = (page - 1) * pageSize;
          const toIdx = fromIdx + pageSize - 1;
          q = q.range(fromIdx, toIdx);
          const { data: rows, error } = await q;
          if (error) throw new Error(`Failed to list parts: ${error.message}`);
          (rows || []).forEach((r: any) => results.push(normalize(r, 'parts')));
        }

        // If neither table exists, throw
        if (!computerExists && !partsExists) {
          throw new Error('No parts table found (computer_parts or parts)');
        }

        // Sort by created_at desc then apply pagination on merged results
        results.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        const fromIdx = (page - 1) * pageSize;
        const paged = results.slice(fromIdx, fromIdx + pageSize);
        return paged;
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
        const table = await this.resolvePartsTable();
        const { data, error } = await client
          .from(table)
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
        const table = await this.resolvePartsTable();

        const payload = table === 'computer_parts'
          ? {
              name: formData.name,
              slug: formData.slug,
              category: formData.part_type,
              manufacturer: formData.brand,
              description: formData.description,
              specs_json: formData.specs,
              image: formData.images?.[0] || null,
            }
          : {
              name: formData.name,
              slug: formData.slug,
              type: formData.part_type,
              brand: formData.brand,
              description: formData.description,
              specs: formData.specs,
              image: formData.images?.[0] || null,
            };

        const { data, error } = await client
          .from(table)
          .insert(payload)
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
        const table = await this.resolvePartsTable();

        const updatePayload = table === 'computer_parts'
          ? {
              name: formData.name,
              slug: formData.slug,
              category: formData.part_type,
              manufacturer: formData.brand,
              description: formData.description,
              specs_json: formData.specs,
              image: formData.images?.[0] || null,
              updated_at: new Date().toISOString(),
            }
          : {
              name: formData.name,
              slug: formData.slug,
              type: formData.part_type,
              brand: formData.brand,
              description: formData.description,
              specs: formData.specs,
              image: formData.images?.[0] || null,
              updated_at: new Date().toISOString(),
            };

        const { data, error } = await client
          .from(table)
          .update(updatePayload)
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
        const table = await this.resolvePartsTable();
        const { error } = await client
          .from(table)
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
        const table = await this.resolvePartsTable();
        const { error } = await client
          .from(table)
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
        const table = await this.resolvePartsTable();
        let query = client
          .from(table)
          .select('id')
          .eq('slug', slug);

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
        const table = await this.resolvePartsTable();
        const { data, error } = await client
          .from(table)
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
        const table = await this.resolvePartsTable();
        const field = table === 'computer_parts' ? 'manufacturer' : 'brand';

        const { data, error } = await client
          .from(table)
          .select(field);

        if (error) {
          throw new Error(`Failed to get brands: ${error.message}`);
        }

        // Extract unique manufacturers (brands)
        const brands = [...new Set(data
          .map((item: any) => item[field])
          .filter((manufacturer: string | null): manufacturer is string => manufacturer !== null))]
          .sort();
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
