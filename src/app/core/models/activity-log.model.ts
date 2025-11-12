/**
 * Activity log domain models for audit trail
 */

export enum ActionType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  PUBLISH = 'publish',
  UNPUBLISH = 'unpublish',
  RESTORE = 'restore',
  PERMANENT_DELETE = 'permanent_delete',
}

export type ItemType = 'article' | 'part' | 'category' | null;

export interface ActivityLog {
  id: string; // UUID
  created_at: string; // ISO timestamp
  admin_id: string; // UUID
  admin_email: string;
  action_type: ActionType;
  item_type: ItemType;
  item_id: string | null; // UUID
  item_title: string | null;
  ip_address: string | null;
  user_agent: string | null;
  notes: Record<string, any> | null; // JSONB metadata
  archived: boolean;
}

export interface ActivityLogFilter {
  admin_email?: string;
  action_type?: ActionType;
  item_type?: ItemType;
  date_from?: string; // ISO date
  date_to?: string; // ISO date
  limit?: number;
  offset?: number;
}

export interface ActivityLogResponse {
  logs: ActivityLog[];
  total_count: number;
}
