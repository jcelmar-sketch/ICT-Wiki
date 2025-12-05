import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { lastValueFrom, take } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';
import { SupabaseService } from './supabase.service';
import { AdminUser } from '../models/admin.model';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let router: jasmine.SpyObj<Router>;
  let supabaseService: jasmine.SpyObj<SupabaseService>;
  let supabaseClient: any;

  const baseAdmin: AdminUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: 'admin',
    failed_login_attempts: 0,
    locked_until: null,
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const createSupabaseClient = (adminOverrides: Partial<AdminUser> = {}) => {
    const adminRecord: AdminUser = { ...baseAdmin, ...adminOverrides };

    const activityInsert = jasmine.createSpy('insert').and.resolveTo({ error: null });

    const adminSelectSingle = jasmine
      .createSpy('single')
      .and.callFake(async () => ({ data: adminRecord, error: null }));

    const adminUpdateEq = jasmine
      .createSpy('eq')
      .and.callFake(async () => ({ error: null }));

    const adminUpdate = jasmine.createSpy('update').and.returnValue({ eq: adminUpdateEq });

    const adminSelectEq = jasmine
      .createSpy('eq')
      .and.returnValue({ single: adminSelectSingle });

    const adminSelect = jasmine
      .createSpy('select')
      .and.callFake(() => ({ eq: adminSelectEq }));

    const activityFrom = { insert: activityInsert };
    const adminFrom = {
      select: adminSelect,
      update: adminUpdate,
    };

    const from = jasmine.createSpy('from').and.callFake((table: string) => {
      if (table === 'admin_users') return adminFrom;
      if (table === 'activity_logs') return activityFrom;
      return {
        update: jasmine.createSpy('update').and.returnValue({ eq: adminUpdateEq }),
        select: adminSelect,
      };
    });

    const auth = {
      signInWithPassword: jasmine.createSpy('signInWithPassword').and.callFake(async ({ email, password }) => {
        if (password === 'correct') {
          return {
            data: {
              user: { ...adminRecord, email },
              session: {
                access_token: 'access',
                refresh_token: 'refresh',
              },
            },
            error: null,
          };
        }
        return {
          data: { user: null, session: null },
          error: new Error('Invalid credentials'),
        };
      }),
      getSession: jasmine
        .createSpy('getSession')
        .and.resolveTo({ data: { session: { user: adminRecord, access_token: 'access', refresh_token: 'refresh' } }, error: null }),
      signOut: jasmine.createSpy('signOut').and.resolveTo({ error: null }),
    };

    return { auth, from } as any;
  };

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    supabaseService = jasmine.createSpyObj('SupabaseService', ['getClient']);
    supabaseClient = createSupabaseClient();
    supabaseService.getClient.and.returnValue(supabaseClient);

    TestBed.configureTestingModule({
      providers: [
        AdminAuthService,
        { provide: Router, useValue: router },
        { provide: SupabaseService, useValue: supabaseService },
      ],
    });

    localStorage.clear();
    service = TestBed.inject(AdminAuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('logs in successfully and sets session state', (done) => {
    service
      .login({ email: 'admin@test.com', password: 'correct' })
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          service.getCurrentUser().pipe(take(1)).subscribe((user) => {
            expect(user?.email).toBe('admin@test.com');
            done();
          });
        },
        error: done.fail,
      });
  });

  it('handles invalid credentials with error message and failed attempt update', (done) => {
    service
      .login({ email: 'admin@test.com', password: 'wrong' })
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          expect(response.success).toBeFalse();
          expect(response.error).toContain('Invalid credentials');
          expect(supabaseClient.from).toHaveBeenCalledWith('admin_users');
          done();
        },
        error: done.fail,
      });
  });

  it('expires session and triggers logout when expired', (done) => {
    const expiredSession = {
      user: baseAdmin,
      tokens: { accessToken: 'access', refreshToken: 'refresh' },
      expiresAt: new Date(Date.now() - 1000),
    };

    (service as any).currentSessionSubject.next(expiredSession);

    service
      .checkSession()
      .pipe(take(1))
      .subscribe((status) => {
        expect(status.valid).toBeFalse();
        expect(status.reason).toBe('Session expired');
        expect(supabaseClient.auth.signOut).toHaveBeenCalled();
        done();
      });
  });

  it('saves and restores form state without sensitive fields', () => {
    const formData = { title: 'Example', password: 'secret', content: 'Hello' };
    service.saveFormState('article', '123', formData);

    const restored = service.getSavedFormState('article', '123');
    expect(restored).toEqual({ title: 'Example', content: 'Hello' });
  });

  it('purges expired form entries', () => {
    const key = 'admin_form_article_123';
    localStorage.setItem(
      key,
      JSON.stringify({ formData: { title: 'Old' }, expiresAt: Date.now() - 1000 })
    );

    service.purgeExpiredFormState();
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('clears form state on logout', async () => {
    service.saveFormState('article', '123', { title: 'Keep' });

    await lastValueFrom(service.logout());

    expect(localStorage.length).toBe(0);
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
  });
});
