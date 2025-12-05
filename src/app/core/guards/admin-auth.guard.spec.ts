import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { adminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from '../services/admin-auth.service';

describe('adminAuthGuard', () => {
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AdminAuthService>;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    authService = jasmine.createSpyObj('AdminAuthService', ['isAuthenticated']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AdminAuthService, useValue: authService },
      ],
    });
  });

  it('allows navigation when authenticated', (done) => {
    authService.isAuthenticated.and.returnValue(of(true));

    TestBed.runInInjectionContext(() => {
      const result$ = adminAuthGuard({} as any, { url: '/admin/dashboard' } as any);
      (result$ as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBeTrue();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('redirects to login when unauthenticated', (done) => {
    authService.isAuthenticated.and.returnValue(of(false));

    const state = { url: '/admin/dashboard' } as any;
    TestBed.runInInjectionContext(() => {
      const result$ = adminAuthGuard({} as any, state);
      (result$ as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/admin/login'], {
          queryParams: { returnUrl: state.url },
        });
        done();
      });
    });
  });
});
