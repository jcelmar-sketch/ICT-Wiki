import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * Role-Based Access Control Guard
 * 
 * Verifies that the authenticated admin user has the required role.
 * Used to restrict access to super_admin-only features.
 * 
 * Usage:
 * ```typescript
 * {
 *   path: 'settings/users',
 *   canActivate: [adminAuthGuard, roleGuard],
 *   data: { requiredRole: 'super_admin' },
 *   component: UserManagementComponent
 * }
 * ```
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  const requiredRole = route.data['requiredRole'] as string;

  if (!requiredRole) {
    console.warn('roleGuard used without requiredRole in route data');
    return true;
  }

  return authService.getCurrentUser().pipe(
    take(1),
    map(user => {
      if (!user) {
        // Not authenticated - redirect to login
        router.navigate(['/admin/login']);
        return false;
      }

      if (user.role === requiredRole || user.role === 'super_admin') {
        // User has required role or is super_admin (has all permissions)
        return true;
      }

      // Insufficient permissions - redirect to dashboard
      console.warn(`Access denied: User role '${user.role}' does not match required role '${requiredRole}'`);
      router.navigate(['/admin/dashboard']);
      return false;
    })
  );
};
