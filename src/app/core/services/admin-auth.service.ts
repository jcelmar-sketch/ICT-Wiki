import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, throwError, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { AdminUser, AdminSession, LoginCredentials, LoginResponse, SessionStatus } from '../models/admin.model';
import { environment } from '../../../environments/environment';

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
  
  // Session state
  private currentSessionSubject = new BehaviorSubject<AdminSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();
  
  private sessionTimeoutHandle: any = null;
  
  // Config from environment
  private readonly SESSION_TIMEOUT_MS = environment.admin.sessionTimeoutMinutes * 60 * 1000;
  private readonly MAX_FAILED_ATTEMPTS = environment.admin.maxFailedLoginAttempts;
  private readonly LOCKOUT_DURATION_MS = environment.admin.accountLockoutMinutes * 60 * 1000;
  
  private supabase!: SupabaseClient;

  constructor() {
    this.initializeSupabase();
    this.checkExistingSession();
  }

  /**
   * Initialize Supabase client with admin auth configuration
   */
  private async initializeSupabase(): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          storage: localStorage
        }
      }
    );
  }

  /**
   * Check for existing valid session on service initialization
   */
  private async checkExistingSession(): Promise<void> {
    await this.initializeSupabase();
    
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
