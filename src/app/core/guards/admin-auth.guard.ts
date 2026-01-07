import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * Admin Authentication Guard
 * 
 * Protects admin routes by checking for valid authentication session.
 * Redirects unauthenticated users to /admin/login.
 * 
 * Usage:
 * ```typescript
 * {
 *   path: 'dashboard',
 *   canActivate: [adminAuthGuard],
 *   component: DashboardComponent
 * }
 * ```
 */
export const adminAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  return authService.isAuthenticated().pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }

      // Store attempted URL for redirect after login
      const returnUrl = state.url;
      
      // Redirect to login
      router.navigate(['/admin/login'], {
        queryParams: { returnUrl }
      });
      
      return false;
    })
  );
};
