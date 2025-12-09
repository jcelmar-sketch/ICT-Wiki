/**
 * Parts Service
 * Tasks T062-T067: Computer parts data management
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { CacheService } from '../../core/services/cache.service';
import { ComputerPart, PartCard, PartCategory } from '../../core/models/computer-part.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PartsService {
  private supabase = inject(SupabaseService);
  private cache = inject(CacheService);

  /**
   * Get all parts with pagination
   */
  getAll(offset: number = 0, limit: number = environment.partsPerPage): Observable<ComputerPart[]> {
    return from(
      this.supabase.getClient()
        .from('computer_parts')
        .select('*')
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(this.transformPart);
      })
    );
  }

  /**
   * Get parts by category
   */
  getByCategory(category: PartCategory, offset: number = 0, limit: number = environment.partsPerPage): Observable<ComputerPart[]> {
    return from(
      this.supabase.getClient()
        .from('computer_parts')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(this.transformPart);
      })
    );
  }

  /**
   * Get part by ID with caching
   */
  getById(id: string): Observable<ComputerPart> {
    return from(this.cache.getPart(id)).pipe(
      switchMap(cached => {
        if (cached) {
          return from([cached]);
        }

        return from(
          this.supabase.getClient()
            .from('computer_parts')
            .select('*')
            .eq('id', id)
            .single()
        ).pipe(
          map(({ data, error }) => {
            if (error) throw error;
            if (!data) throw new Error('Part not found');

            const part = this.transformPart(data);
            this.cache.cachePart(part).catch(err => 
              console.warn('[PartsService] Cache failed:', err)
            );

            return part;
          })
        );
      })
    );
  }

  /**
   * Get part by slug
   */
  getBySlug(slug: string): Observable<ComputerPart> {
    return from(
      this.supabase.getClient()
        .from('computer_parts')
        .select('*')
        .eq('slug', slug)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Part not found');

        const part = this.transformPart(data);
        this.cache.cachePart(part).catch(err => 
          console.warn('[PartsService] Cache failed:', err)
        );

        return part;
      })
    );
  }

  /**
   * Transform database response to ComputerPart model
   * Maps: image -> image_url (via Supabase Storage if path, or direct URL), specs_json -> specifications
   */
  private transformPart(data: any): ComputerPart {
    let imageUrl: string | null = null;
    
    if (data.image) {
      // If the image is already a full URL (starts with http), use it directly
      if (data.image.startsWith('http')) {
        imageUrl = data.image;
      } else {
        // Otherwise, generate Supabase Storage URL
        imageUrl = this.supabase.getStorageUrl('parts', data.image);
      }
    }
    
    return {
      ...data,
      image_url: imageUrl,
      specifications: data.specs_json || {},
      model_number: data.model_number || null,
    };
  }
}
