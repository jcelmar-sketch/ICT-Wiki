import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { Observable, Subject, interval } from 'rxjs';
import { AdminUser } from '../../../core/models/admin.model';
import { takeUntil } from 'rxjs/operators';

/**
 * Admin Layout Component
 * 
 * Main wrapper for authenticated admin routes.
 * Provides:
 * - Header with navigation and logout
 * - Session timeout detection
 * - User information display
 * - Responsive sidebar (to be implemented)
 */
@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AdminAuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  currentUser$!: Observable<AdminUser | null>;
  sessionWarning = false;
  readonly splitPaneWhen = '(min-width: 768px)';

  ngOnInit() {
    this.currentUser$ = this.authService.getCurrentUser();
    
    // Check session every 60 seconds
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkSessionTimeout();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if session is expiring soon
   */
  private checkSessionTimeout() {
    this.authService.checkSession().subscribe(status => {
      if (!status.valid) {
        // Session expired - will auto-redirect via guard
        return;
      }
      
      // Warn if less than 5 minutes remaining
      if (status.expiresIn && status.expiresIn < 300) {
        this.sessionWarning = true;
      } else {
        this.sessionWarning = false;
      }
    });
  }

  /**
   * Extend session (refresh timeout)
   */
  extendSession() {
    this.authService.refreshSession().subscribe(success => {
      if (success) {
        this.sessionWarning = false;
      }
    });
  }

  /**
   * Logout current user
   */
  logout() {
    this.authService.logout().subscribe();
  }

  /**
   * Navigate to route
   */
  navigate(path: string) {
    this.router.navigate([`/admin/${path}`]);
  }
}
