/**
 * Trash and soft-delete domain models
 */

export type TrashItemType = 'article' | 'part' | 'category';

export interface TrashItem {
  id: string; // Original item ID
  item_type: TrashItemType;
  title: string;
  deleted_at: string; // ISO timestamp
  deleted_by_admin_id: string; // UUID
  deleted_by_admin_email: string;
  auto_delete_at: string; // ISO timestamp (deleted_at + 30 days)
  days_until_purge: number; // Calculated field
  snapshot: Record<string, any>; // JSONB of original item data
}

export interface TrashListResponse {
  items: TrashItem[];
  total_count: number;
}

export interface RestoreItemRequest {
  item_type: TrashItemType;
  item_id: string;
}

export interface PermanentDeleteRequest {
  item_type: TrashItemType;
  item_id: string;
  confirmation: string; // Must be "PERMANENT DELETE"
}
