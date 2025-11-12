# Admin Dashboard Quick Start Guide

**Feature**: Admin Dashboard  
**Branch**: `002-admin-dashboard`  
**Last Updated**: 2025-11-12

## Overview

This guide helps developers set up, develop, and test the ICT Wiki admin dashboard feature. The admin dashboard is a secure web application for managing content (articles, parts, categories), monitoring site health, and auditing admin actions.

---

## Prerequisites

Before starting development, ensure you have:

- [x] Node.js 20.x LTS or later
- [x] npm 10.x or later
- [x] Git installed and configured
- [x] VS Code (recommended) or your preferred IDE
- [x] Chrome/Firefox for testing (with DevTools)
- [x] Supabase account with existing project (or local Supabase setup)

**Existing Project Context**:
- This feature extends the existing ICT Wiki public PWA app
- Codebase uses Ionic 8 + Angular 20 + Supabase
- Admin routes will be added to existing app under `/admin` prefix

---

## Initial Setup

### 1. Clone and Switch to Feature Branch

```bash
# Clone repository if not already done
git clone https://github.com/your-org/ICT-Wiki.git
cd ICT-Wiki

# Switch to admin dashboard feature branch
git checkout 002-admin-dashboard

# Pull latest changes
git pull origin 002-admin-dashboard
```

### 2. Install Dependencies

```bash
# Install npm packages
npm install

# Verify installation
npm run lint
```

Expected output: `✓ All lint rules passed`

### 3. Environment Configuration

Create or update `.env` file in project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Local Supabase
# SUPABASE_URL=http://localhost:54321
# SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get Supabase keys**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Settings → API
4. Copy `URL`, `anon` key, and `service_role` key

**Update Angular environment files**:

`src/environments/environment.ts` (development):
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key-here',
};
```

`src/environments/environment.prod.ts` (production):
```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key-here',
};
```

### 4. Database Setup

Run database migrations to create admin tables:

```bash
# Option A: Using Supabase CLI (recommended)
npx supabase migration new create_admin_tables
# Copy SQL from specs/002-admin-dashboard/data-model.md → migration file
npx supabase db push

# Option B: Manual via Supabase Dashboard
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy SQL from specs/002-admin-dashboard/data-model.md
# 3. Run migration scripts in order:
#    - 001_create_admin_tables.sql
#    - 002_admin_rls_policies.sql
#    - 003_admin_triggers.sql
```

**Verify migrations**:
```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
  AND tablename IN ('admin_users', 'activity_logs', 'storage_metrics');

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'admin_users';
```

### 5. Create Test Admin User

```sql
-- Run in Supabase SQL Editor
-- Create Supabase Auth user
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at,
  role,
  raw_user_meta_data
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@test.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  'authenticated',
  '{"role": "admin"}'::jsonb
);

-- Create admin_users entry
INSERT INTO admin_users (id, email, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@test.com',
  'admin'
);
```

**Test credentials**:
- Email: `admin@test.com`
- Password: `admin123`

---

## Development Workflow

### Start Development Server

```bash
npm start
```

Expected output:
```
** Angular Live Development Server is listening on localhost:4200 **
✔ Compiled successfully.
```

Open browser: `http://localhost:4200/admin/login`

### Project Structure Overview

```
src/app/
├── features/
│   ├── admin/                     # NEW: Admin dashboard feature
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   └── guards/
│   │   ├── dashboard/
│   │   ├── articles/
│   │   ├── parts/
│   │   ├── categories/
│   │   ├── activity/
│   │   ├── trash/
│   │   └── shared/
│   ├── home/                      # Existing public app
│   ├── articles/
│   └── parts/
├── core/
│   ├── services/
│   │   ├── admin-auth.service.ts  # NEW
│   │   ├── activity-log.service.ts # NEW
│   │   └── admin-api.service.ts   # NEW
│   ├── guards/
│   │   ├── admin-auth.guard.ts    # NEW
│   │   └── role.guard.ts          # NEW
│   └── models/
│       ├── admin.model.ts         # NEW
│       ├── activity-log.model.ts  # NEW
│       └── trash.model.ts         # NEW
└── shared/
    ├── components/
    └── pipes/
```

### Creating New Components

```bash
# Admin dashboard components (standalone)
ng generate component features/admin/dashboard --standalone

# Admin service
ng generate service core/services/admin-auth

# Admin guard
ng generate guard core/guards/admin-auth
```

### Coding Standards

**TypeScript**:
- Use strict mode (already configured in `tsconfig.json`)
- Prefer `interface` over `type` for models
- Use `readonly` for immutable properties
- Avoid `any`; use `unknown` if type truly unknown

**Angular**:
- Use standalone components (no NgModules)
- Implement `OnDestroy` and unsubscribe from Observables
- Use `OnPush` change detection for performance
- Prefer reactive forms over template-driven
- Use `async` pipe in templates to auto-unsubscribe

**RxJS**:
- Use `takeUntilDestroyed()` for automatic cleanup
- Prefer `switchMap` over `mergeMap` for sequential operations
- Use `shareReplay(1)` for shared HTTP responses
- Avoid nested `subscribe()` calls

**Example Component**:
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminAuthService } from '@core/services/admin-auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  metrics$ = this.adminAuth.getDashboardMetrics();
  
  constructor(
    private adminAuth: AdminAuthService,
  ) {}

  ngOnInit(): void {
    // Observables with async pipe auto-unsubscribe
  }
}
```

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (for TDD)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

**Test Coverage Requirements**:
- Services: 80% minimum
- Guards: 90% minimum (critical for security)
- Components: 60% minimum (focus on logic, not UI)

**Example Service Test**:
```typescript
import { TestBed } from '@angular/core/testing';
import { AdminAuthService } from './admin-auth.service';
import { SupabaseService } from './supabase.service';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let supabaseSpy: jasmine.SpyObj<SupabaseService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SupabaseService', ['auth']);
    
    TestBed.configureTestingModule({
      providers: [
        AdminAuthService,
        { provide: SupabaseService, useValue: spy }
      ]
    });
    
    service = TestBed.inject(AdminAuthService);
    supabaseSpy = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login with valid credentials', async () => {
    supabaseSpy.auth.signInWithPassword.and.returnValue(
      Promise.resolve({
        data: { user: { id: '123', email: 'admin@test.com' }, session: {} },
        error: null
      })
    );

    const result = await service.login('admin@test.com', 'password');
    expect(result.email).toBe('admin@test.com');
  });
});
```

---

## Common Development Tasks

### 1. Adding a New Admin Page

```bash
# Generate page component
ng generate component features/admin/settings --standalone

# Update routing (src/app/app.routes.ts)
```

Add route:
```typescript
{
  path: 'admin',
  canActivate: [AdminAuthGuard],
  children: [
    {
      path: 'settings',
      loadComponent: () => import('./features/admin/settings/settings.page').then(m => m.SettingsPage)
    }
  ]
}
```

### 2. Implementing CRUD Service

```typescript
// src/app/core/services/articles-admin.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Article, ArticleInput } from '@core/models/article.model';
import { Observable, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ArticlesAdminService {
  constructor(private supabase: SupabaseService) {}

  list(filters?: { category?: string; status?: string }): Observable<Article[]> {
    let query = this.supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    return from(query.then(response => {
      if (response.error) throw response.error;
      return response.data as Article[];
    }));
  }

  create(article: ArticleInput): Observable<Article> {
    return from(
      this.supabase
        .from('articles')
        .insert(article)
        .select()
        .single()
        .then(response => {
          if (response.error) throw response.error;
          return response.data as Article;
        })
    );
  }

  update(id: string, article: Partial<ArticleInput>): Observable<Article> {
    return from(
      this.supabase
        .from('articles')
        .update(article)
        .eq('id', id)
        .select()
        .single()
        .then(response => {
          if (response.error) throw response.error;
          return response.data as Article;
        })
    );
  }

  softDelete(id: string): Observable<void> {
    return from(
      this.supabase
        .from('articles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .then(response => {
          if (response.error) throw response.error;
        })
    );
  }
}
```

### 3. Adding Form Validation

```typescript
// Reactive form with validation
import { FormBuilder, Validators } from '@angular/forms';

export class ArticleFormComponent {
  articleForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    category_id: ['', Validators.required],
    content: ['', Validators.required],
    status: ['draft', Validators.required],
  });

  constructor(private fb: FormBuilder) {}

  onSubmit(): void {
    if (this.articleForm.valid) {
      const article = this.articleForm.value as ArticleInput;
      // Submit article...
    } else {
      // Show validation errors
      this.articleForm.markAllAsTouched();
    }
  }
}
```

### 4. Implementing Route Guards

```typescript
// src/app/core/guards/admin-auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AdminAuthService } from '@core/services/admin-auth.service';
import { map, take } from 'rxjs/operators';

export const adminAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && user.role === 'admin') {
        return true;
      } else {
        router.navigate(['/admin/login']);
        return false;
      }
    })
  );
};
```

---

## Debugging and Troubleshooting

### Common Issues

**Issue**: "Supabase client not initialized"
- **Solution**: Check `environment.ts` has correct `supabaseUrl` and `supabaseAnonKey`

**Issue**: "Unauthorized" when calling admin endpoints
- **Solution**: Verify JWT token includes `role: 'admin'` claim in `user_metadata`

**Issue**: "RLS policy violation"
- **Solution**: Check RLS policies in Supabase Dashboard → Authentication → Policies

**Issue**: Soft-delete not working
- **Solution**: Verify `deleted_at` column exists with `ALTER TABLE articles ADD COLUMN deleted_at TIMESTAMPTZ;`

### Debugging Tools

**Angular DevTools** (Chrome extension):
- Inspect component hierarchy
- Profile change detection
- View component properties

**Supabase Dashboard**:
- SQL Editor: Run test queries
- Table Editor: Inspect/edit data manually
- Logs: View API requests and errors

**Browser DevTools**:
- Network tab: Check API requests/responses
- Console: View Angular errors
- Application tab: Inspect JWT tokens in localStorage

**VS Code Extensions** (recommended):
- Angular Language Service
- ESLint
- Prettier
- Thunder Client (REST API testing)

---

## Testing Strategy

### Unit Tests

Test individual services and components in isolation.

**Service Test Example**:
```typescript
// admin-auth.service.spec.ts
it('should lock account after 5 failed attempts', async () => {
  // Arrange: Mock failed login 5 times
  const email = 'admin@test.com';
  for (let i = 0; i < 5; i++) {
    await service.incrementFailedAttempts(email);
  }

  // Act: Attempt 6th login
  const result = service.login(email, 'wrong-password');

  // Assert: Expect account locked error
  await expectAsync(result).toBeRejectedWith(
    jasmine.objectContaining({ message: 'Account locked' })
  );
});
```

**Component Test Example**:
```typescript
// login.page.spec.ts
it('should show validation error for invalid email', () => {
  component.loginForm.controls['email'].setValue('invalid-email');
  component.loginForm.controls['email'].markAsTouched();
  fixture.detectChanges();

  const errorElement = fixture.nativeElement.querySelector('.error-message');
  expect(errorElement.textContent).toContain('Invalid email');
});
```

### Integration Tests

Test multiple components/services working together.

**Example**:
```typescript
it('should redirect to dashboard after successful login', async () => {
  // Arrange: Mock auth service
  const authService = TestBed.inject(AdminAuthService);
  spyOn(authService, 'login').and.returnValue(
    Promise.resolve({ id: '123', email: 'admin@test.com', role: 'admin' })
  );

  // Act: Submit login form
  component.loginForm.setValue({ email: 'admin@test.com', password: 'password' });
  await component.onSubmit();

  // Assert: Router navigated to dashboard
  expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
});
```

### E2E Tests (Future)

Full user journey tests using Cypress or Playwright.

**Example Cypress Test**:
```typescript
describe('Admin Login Flow', () => {
  it('should login and view dashboard', () => {
    cy.visit('/admin/login');
    cy.get('[data-testid="email"]').type('admin@test.com');
    cy.get('[data-testid="password"]').type('admin123');
    cy.get('[data-testid="submit"]').click();
    
    cy.url().should('include', '/admin/dashboard');
    cy.contains('Dashboard Metrics').should('be.visible');
  });
});
```

---

## Deployment

### Development Environment

```bash
# Build development bundle
npm run build

# Output: www/ directory (serve with any static server)
```

### Production Build

```bash
# Build optimized production bundle
npm run build --configuration production

# Output: www/ directory
# - Minified JS/CSS
# - Service worker enabled
# - Source maps removed
```

### Deploy to Vercel (Example)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel Dashboard:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
```

### Environment Variables Checklist

- [ ] `SUPABASE_URL` configured
- [ ] `SUPABASE_ANON_KEY` configured (public)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured (server-only, never expose to client)
- [ ] Database migrations applied
- [ ] Admin user(s) created
- [ ] RLS policies enabled

---

## Performance Monitoring

### Lighthouse CI

Run Lighthouse audits on every PR:

```bash
npm run lighthouse

# Check scores:
# - Performance: >90
# - Accessibility: >95
# - Best Practices: >90
# - SEO: >90
```

### Performance Budget

Defined in `angular.json`:
- Initial bundle: <2MB (warning), <5MB (error)
- Component styles: <2KB (warning), <4KB (error)

### Monitoring Queries

Check slow database queries in Supabase Dashboard:
1. Go to Database → Query Performance
2. Sort by duration (descending)
3. Optimize queries with indexes or rewrites

---

## Resources

### Documentation
- [Ionic Framework Docs](https://ionicframework.com/docs)
- [Angular Docs](https://angular.dev)
- [Supabase Docs](https://supabase.com/docs)
- [RxJS Operators](https://rxjs.dev/guide/operators)

### Internal Docs
- [Architecture Documentation](../../../docs/architecture.md)
- [Data Schema](../../../docs/data-schema.md)
- [Admin Dashboard Spec](../spec.md)
- [Research Document](../research.md)
- [Data Model](../data-model.md)
- [API Contracts](../contracts/admin-api.yaml)

### Tools
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Angular CLI](https://angular.dev/cli)
- [Ionic CLI](https://ionicframework.com/docs/cli)

### Support
- GitHub Issues: [github.com/your-org/ICT-Wiki/issues](https://github.com/your-org/ICT-Wiki/issues)
- Slack: `#ict-wiki-dev` (if applicable)
- Email: dev@ict-wiki.example.com

---

## Next Steps

After completing this quick start:

1. ✅ Verify development environment setup
2. ✅ Run existing tests to ensure baseline passes
3. ✅ Familiarize yourself with project structure
4. ✅ Review spec, research, and data model documents
5. ⏭️ Proceed to `/speckit.tasks` to get implementation tasks

---

**Quick Start Status**: ✅ Complete  
**Last Reviewed**: 2025-11-12
