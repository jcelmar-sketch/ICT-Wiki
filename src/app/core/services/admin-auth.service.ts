import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { AdminUser, AdminSession, LoginCredentials, LoginResponse, SessionStatus } from '../models/admin.model';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

/**
 * Admin Authentication Service
 * 
 * Handles admin login, session management, account lockout, and security features.
 * 
 * Features:
 * - Email/password authentication via Supabase
 * - Session timeout tracking (30 minutes default)
 * - Failed login attempt tracking (5 attempts before 15-minute lockout)
 * - Activity logging for all auth events
 * - JWT token management
 * 
 * Performance Requirement: Login p95 < 500ms
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private supabase: SupabaseClient = this.supabaseService.getClient();
  
  // Session state
  private currentSessionSubject = new BehaviorSubject<AdminSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();
  
  private sessionTimeoutHandle: any = null;
  
  // Config from environment
  private readonly SESSION_TIMEOUT_MS = environment.admin.sessionTimeoutMinutes * 60 * 1000;
  private readonly MAX_FAILED_ATTEMPTS = environment.admin.maxFailedLoginAttempts;
  private readonly LOCKOUT_DURATION_MS = environment.admin.accountLockoutMinutes * 60 * 1000;
  private readonly FORM_TTL_MS = 24 * 60 * 60 * 1000; // 24h persistence

  constructor() {
    this.checkExistingSession();
  }

  /**
   * Check for existing valid session on service initialization
   */
  private async checkExistingSession(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (session?.user) {
      // Verify user is in admin_users table and not locked
      const adminUser = await this.fetchAdminUser(session.user.id);
      
      if (adminUser && !this.isAccountLocked(adminUser)) {
        const adminSession: AdminSession = {
          user: adminUser,
          tokens: {
            accessToken: session.access_token,
            refreshToken: session.refresh_token || ''
          },
          expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT_MS)
        };
        
        this.currentSessionSubject.next(adminSession);
        this.startSessionTimeout();
      } else {
        // Invalid or locked admin account
        await this.logout();
      }
    }
  }

  /**
   * Authenticate admin user with email and password
   * 
   * @param credentials Email and password
   * @returns Observable of login response with session or error
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return from(this.performLogin(credentials)).pipe(
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => ({
          success: false,
          error: error.message || 'Login failed. Please try again.'
        }));
      })
    );
  }

  /**
   * Internal login implementation with account lockout logic
   */
  private async performLogin(credentials: LoginCredentials): Promise<LoginResponse> {
    const startTime = Date.now();

    try {
      // First, check if account exists and lockout status
      const { data: existingAdmin } = await this.supabase
        .from('admin_users')
        .select('*')
        .eq('email', credentials.email)
        .single();

      if (existingAdmin && this.isAccountLocked(existingAdmin)) {
        await this.logLoginFailure(credentials.email, 'Account locked');
        return {
          success: false,
          error: `Account locked due to too many failed attempts. Try again after ${this.formatLockoutTime(existingAdmin.locked_until)}.`
        };
      }

      // Attempt authentication
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error || !data.user) {
        // Handle failed login
        await this.handleFailedLogin(credentials.email);
        await this.logLoginFailure(credentials.email, error?.message || 'Invalid credentials');
        
        const failedAttempts = existingAdmin?.failed_login_attempts || 0;
        const remainingAttempts = this.MAX_FAILED_ATTEMPTS - failedAttempts - 1;
        
        return {
          success: false,
          error: remainingAttempts > 0
            ? `Invalid credentials. ${remainingAttempts} attempts remaining.`
            : 'Account locked due to too many failed attempts.'
        };
      }

      // Verify admin user exists in admin_users table
      const adminUser = await this.fetchAdminUser(data.user.id);
      
      if (!adminUser) {
        await this.supabase.auth.signOut();
        await this.logLoginFailure(credentials.email, 'Not an admin user');
        return {
          success: false,
          error: 'Access denied. Admin privileges required.'
        };
      }

      // Reset failed attempts on successful login
      await this.resetFailedAttempts(adminUser.id);

      // Create session
      const session: AdminSession = {
        user: adminUser,
        tokens: {
          accessToken: data.session!.access_token,
          refreshToken: data.session!.refresh_token
        },
        expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT_MS)
      };

      this.currentSessionSubject.next(session);
      this.startSessionTimeout();

      // Log successful login
      await this.logLoginSuccess(adminUser.id, credentials.email);
      
      // Update last_login_at timestamp
      await this.supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminUser.id);

      const duration = Date.now() - startTime;
      console.log(`Admin login completed in ${duration}ms`);

      return {
        success: true,
        session
      };

    } catch (error: any) {
      console.error('Login exception:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Sign out current admin user
   */
  logout(): Observable<void> {
    return from(this.performLogout());
  }

  private async performLogout(): Promise<void> {
    this.clearSessionTimeout();
    this.clearFormState();
    
    await this.supabase.auth.signOut();
    
    this.currentSessionSubject.next(null);
    
    await this.router.navigate(['/admin/login']);
  }

  /**
   * Get current authenticated admin user
   */
  getCurrentUser(): Observable<AdminUser | null> {
    return this.currentSession$.pipe(
      map(session => session?.user || null)
    );
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): Observable<boolean> {
    return this.currentSession$.pipe(
      map(session => {
        if (!session) return false;
        
        const now = new Date();
        const isExpired = now >= session.expiresAt;
        
        if (isExpired) {
          this.logout().subscribe();
          return false;
        }
        
        return true;
      })
    );
  }

  /**
   * Check session validity and return status
   */
  checkSession(): Observable<SessionStatus> {
    return this.currentSession$.pipe(
      map(session => {
        if (!session) {
          return { valid: false, reason: 'No active session' };
        }
        
        const now = new Date();
        const timeRemaining = session.expiresAt.getTime() - now.getTime();
        
        if (timeRemaining <= 0) {
          this.logout().subscribe();
          return { valid: false, reason: 'Session expired' };
        }
        
        // Warn if less than 5 minutes remaining
        if (timeRemaining < 5 * 60 * 1000) {
          return {
            valid: true,
            expiresIn: Math.floor(timeRemaining / 1000),
            warning: 'Session expiring soon'
          };
        }
        
        return {
          valid: true,
          expiresIn: Math.floor(timeRemaining / 1000)
        };
      })
    );
  }

  /**
   * Refresh session to extend timeout
   */
  refreshSession(): Observable<boolean> {
    const currentSession = this.currentSessionSubject.value;
    
    if (!currentSession) {
      return of(false);
    }
    
    // Extend expiration time
    currentSession.expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT_MS);
    this.currentSessionSubject.next(currentSession);
    
    // Reset timeout
    this.startSessionTimeout();
    
    return of(true);
  }

  /**
   * Update admin password
   * 
   * @param currentPassword Current password for verification
   * @param newPassword New password to set
   * @returns Observable of success or error message
   */
  updatePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return from(this.performPasswordUpdate(currentPassword, newPassword)).pipe(
      catchError(error => {
        console.error('Password update error:', error);
        return of({
          success: false,
          message: error.message || 'Failed to update password. Please try again.'
        });
      })
    );
  }

  private async performPasswordUpdate(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const session = this.currentSessionSubject.value;
      if (!session) {
        return { success: false, message: 'No active session' };
      }

      // Verify current password by attempting to re-authenticate
      const { error: authError } = await this.supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword
      });

      if (authError) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Update password in Supabase Auth
      const { error: updateError } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return { success: false, message: updateError.message };
      }

      // Log the password change
      await this.supabase
        .from('activity_logs')
        .insert({
          admin_id: session.user.id,
          admin_email: session.user.email,
          action_type: 'password_changed',
          item_type: null,
          item_id: null,
          item_title: null
        });

      return { success: true, message: 'Password updated successfully' };
    } catch (error: any) {
      console.error('Password update exception:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  }

  /**
   * Update admin email address
   * 
   * @param newEmail New email address
   * @param password Current password for verification
   * @returns Observable of success or error message
   */
  updateEmail(newEmail: string, password: string): Observable<{ success: boolean; message: string }> {
    return from(this.performEmailUpdate(newEmail, password)).pipe(
      catchError(error => {
        console.error('Email update error:', error);
        return of({
          success: false,
          message: error.message || 'Failed to update email. Please try again.'
        });
      })
    );
  }

  private async performEmailUpdate(newEmail: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const session = this.currentSessionSubject.value;
      if (!session) {
        return { success: false, message: 'No active session' };
      }

      // Verify password first
      const { error: authError } = await this.supabase.auth.signInWithPassword({
        email: session.user.email,
        password
      });

      if (authError) {
        return { success: false, message: 'Password is incorrect' };
      }

      // Check if new email is already in use
      const { data: existingUser } = await this.supabase
        .from('admin_users')
        .select('id')
        .eq('email', newEmail)
        .neq('id', session.user.id)
        .single();

      if (existingUser) {
        return { success: false, message: 'Email address is already in use' };
      }

      // Update email in Supabase Auth
      const { error: updateError } = await this.supabase.auth.updateUser({
        email: newEmail
      });

      if (updateError) {
        return { success: false, message: updateError.message };
      }

      // Update email in admin_users table
      const { error: dbError } = await this.supabase
        .from('admin_users')
        .update({ email: newEmail, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);

      if (dbError) {
        return { success: false, message: dbError.message };
      }

      // Update current session with new email
      const updatedSession = { ...session };
      updatedSession.user.email = newEmail;
      updatedSession.user.updated_at = new Date().toISOString();
      this.currentSessionSubject.next(updatedSession);

      // Log the email change
      await this.supabase
        .from('activity_logs')
        .insert({
          admin_id: session.user.id,
          admin_email: newEmail,
          action_type: 'email_changed',
          item_type: null,
          item_id: null,
          item_title: null
        });

      return { success: true, message: 'Email updated successfully. Please log in again with your new email.' };
    } catch (error: any) {
      console.error('Email update exception:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  }

  // Private helper methods

  private async fetchAdminUser(userId: string): Promise<AdminUser | null> {
    const { data, error } = await this.supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data as AdminUser;
  }

  private isAccountLocked(admin: AdminUser): boolean {
    if (!admin.locked_until) return false;
    
    const now = new Date();
    const lockedUntil = new Date(admin.locked_until);
    
    return now < lockedUntil;
  }

  private async handleFailedLogin(email: string): Promise<void> {
    const { data: admin } = await this.supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (!admin) return;
    
    const newFailedAttempts = (admin.failed_login_attempts || 0) + 1;
    const updates: any = { failed_login_attempts: newFailedAttempts };
    
    // Lock account if max attempts reached
    if (newFailedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      updates.locked_until = new Date(Date.now() + this.LOCKOUT_DURATION_MS).toISOString();
    }
    
    await this.supabase
      .from('admin_users')
      .update(updates)
      .eq('id', admin.id);
  }

  private async resetFailedAttempts(adminId: string): Promise<void> {
    await this.supabase
      .from('admin_users')
      .update({
        failed_login_attempts: 0,
        locked_until: null
      })
      .eq('id', adminId);
  }

  private startSessionTimeout(): void {
    this.clearSessionTimeout();
    
    this.sessionTimeoutHandle = setTimeout(() => {
      console.log('Session timeout reached');
      this.logout().subscribe();
    }, this.SESSION_TIMEOUT_MS);
  }

  private clearSessionTimeout(): void {
    if (this.sessionTimeoutHandle) {
      clearTimeout(this.sessionTimeoutHandle);
      this.sessionTimeoutHandle = null;
    }
  }

  // Form state persistence for session timeout recovery

  saveFormState(formType: string, itemId: string | null, formData: Record<string, any>): void {
    const sanitized = { ...formData };
    delete (sanitized as any).password;
    delete (sanitized as any).confirmPassword;

    const payload = {
      formData: sanitized,
      savedAt: Date.now(),
      expiresAt: Date.now() + this.FORM_TTL_MS,
    };

    const key = this.getFormStorageKey(formType, itemId);
    localStorage.setItem(key, JSON.stringify(payload));
  }

  getSavedFormState<T = Record<string, any>>(formType: string, itemId: string | null): T | null {
    const key = this.getFormStorageKey(formType, itemId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const payload = JSON.parse(raw) as { formData: T; expiresAt: number };
      if (Date.now() > payload.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      return payload.formData;
    } catch (error) {
      console.error('Failed to parse saved form state', error);
      localStorage.removeItem(key);
      return null;
    }
  }

  purgeExpiredFormState(): void {
    const now = Date.now();
    Object.keys(localStorage)
      .filter((key) => key.startsWith('admin_form_'))
      .forEach((key) => {
        try {
          const payload = JSON.parse(localStorage.getItem(key) || '{}');
          if (!payload.expiresAt || now > payload.expiresAt) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      });
  }

  clearFormState(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('admin_form_'))
      .forEach((key) => localStorage.removeItem(key));
  }

  private getFormStorageKey(formType: string, itemId: string | null): string {
    const normalizedId = itemId || 'new';
    return `admin_form_${formType}_${normalizedId}`;
  }

  private async logLoginSuccess(adminId: string, email: string): Promise<void> {
    await this.supabase
      .from('activity_logs')
      .insert({
        admin_id: adminId,
        admin_email: email,
        action_type: 'login_success',
        item_type: null,
        item_id: null,
        item_title: null
      });
  }

  private async logLoginFailure(email: string, reason: string): Promise<void> {
    await this.supabase
      .from('activity_logs')
      .insert({
        admin_id: null,
        admin_email: email,
        action_type: 'login_failure',
        item_type: null,
        item_id: null,
        item_title: null,
        notes: { reason }
      });
  }

  private formatLockoutTime(lockedUntil: string): string {
    const lockoutDate = new Date(lockedUntil);
    const now = new Date();
    const minutesRemaining = Math.ceil((lockoutDate.getTime() - now.getTime()) / 60000);
    
    return minutesRemaining > 1
      ? `${minutesRemaining} minutes`
      : '1 minute';
  }
}
