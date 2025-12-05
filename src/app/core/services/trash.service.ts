import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { TrashItem, TrashItemType, TrashListResponse } from '../models/trash.model';

/**
 * Trash & Soft-Delete Service
 *
 * Handles management of deleted items:
 * - Retrieves soft-deleted items from trash
 * - Restores items (soft-undelete)
 * - Permanently deletes items (hard-delete)
 * - Filters and pagination
 *
 * Soft-delete architecture:
 * - Items moved to trash table on delete
 * - Auto-purge after 30 days via Edge Function
 * - Admin can restore or permanently delete before purge
 */
@Injectable({
  providedIn: 'root'
})
export class TrashService {
  private supabaseService = inject(SupabaseService);

  /**
   * Get all trash items with optional filtering
   *
   * @param filters Optional filters (item_type, date range, search)
   * @param limit Page size (default: 50)
   * @param offset Pagination offset (default: 0)
   * @returns Observable of trash items
   */
  getTrashItems(filters?: {
    item_type?: TrashItemType;
    search?: string;
    date_from?: string;
    date_to?: string;
  }, limit = 50, offset = 0): Observable<TrashItem[]> {
    return from(this.performGetTrash(filters, limit, offset)).pipe(
      catchError((error) => {
        console.error('Failed to fetch trash items', error);
        return throwError(() => new Error('Failed to fetch trash items'));
      })
    );
  }

  /**
   * Restore a deleted item from trash
   *
   * @param itemType Type of item (article, part, category)
   * @param itemId Item ID
   * @returns Observable<boolean> indicating success
   */
  restore(itemType: TrashItemType, itemId: string): Observable<boolean> {
    return from(this.performRestore(itemType, itemId)).pipe(
      catchError((error) => {
        console.error('Failed to restore item', error);
        return throwError(() => new Error(`Failed to restore ${itemType}`));
      })
    );
  }

  /**
   * Permanently delete an item from trash (hard-delete)
   *
   * @param itemType Type of item (article, part, category)
   * @param itemId Item ID
   * @returns Observable<boolean> indicating success
   */
  permanentDelete(itemType: TrashItemType, itemId: string): Observable<boolean> {
    return from(this.performPermanentDelete(itemType, itemId)).pipe(
      catchError((error) => {
        console.error('Failed to permanently delete item', error);
        return throwError(() => new Error(`Failed to delete ${itemType}`));
      })
    );
  }

  private async performGetTrash(
    filters?: any,
    limit: number = 50,
    offset: number = 0
  ): Promise<TrashItem[]> {
    const supabase = await this.supabaseService.getClient();

    let query = supabase
      .from('trash')
      .select('*')
      .order('deleted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.item_type) {
      query = query.eq('item_type', filters.item_type);
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    if (filters?.date_from) {
      query = query.gte('deleted_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('deleted_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      days_until_purge: this.calculateDaysUntilPurge(item.auto_delete_at)
    }));
  }

  private async performRestore(itemType: TrashItemType, itemId: string): Promise<boolean> {
    const supabase = await this.supabaseService.getClient();

    // Get the trash item to restore
    const { data: trashItem, error: fetchError } = await supabase
      .from('trash')
      .select('*')
      .eq('id', itemId)
      .eq('item_type', itemType)
      .single();

    if (fetchError) throw fetchError;
    if (!trashItem) throw new Error('Item not found in trash');

    // Restore the item based on type
    const { error: restoreError } = await supabase
      .from(itemType === 'article' ? 'articles' : itemType === 'part' ? 'parts' : 'categories')
      .insert([trashItem.snapshot]);

    if (restoreError) throw restoreError;

    // Remove from trash
    const { error: deleteError } = await supabase
      .from('trash')
      .delete()
      .eq('id', itemId)
      .eq('item_type', itemType);

    if (deleteError) throw deleteError;

    return true;
  }

  private async performPermanentDelete(itemType: TrashItemType, itemId: string): Promise<boolean> {
    const supabase = await this.supabaseService.getClient();

    // Hard-delete from trash table
    const { error } = await supabase
      .from('trash')
      .delete()
      .eq('id', itemId)
      .eq('item_type', itemType);

    if (error) throw error;

    return true;
  }

  private calculateDaysUntilPurge(autoDeleteAt: string): number {
    const now = new Date();
    const purgeDate = new Date(autoDeleteAt);
    const diffMs = purgeDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }
}
