/**
 * Admin user domain models for ICT Wiki admin dashboard
 */

export interface AdminUser {
  id: string; // UUID from auth.users
  email: string;
  role: 'admin' | 'super_admin';
  failed_login_attempts: number;
  locked_until: string | null; // ISO timestamp
  last_login_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface AdminSession {
  user: AdminUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  session?: AdminSession;
  error?: string;
}

export interface SessionStatus {
  valid: boolean;
  reason?: string;
  expiresIn?: number; // seconds
  warning?: string;
}
