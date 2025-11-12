# Implementation Plan: Admin Dashboard

**Branch**: `002-admin-dashboard` | **Date**: 2025-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-admin-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a secure admin dashboard for ICT Wiki that enables pre-provisioned administrators to authenticate via email/password (no registration), manage content (articles, parts, categories), monitor site health through real-time metrics, review activity audit logs, and recover soft-deleted items from trash. The dashboard is a separate PWA/Capacitor desktop application using the existing Ionic 8 + Angular 18 stack with Supabase backend, implementing responsive UI for mobile/tablet/desktop access while maintaining strict read-only data protection for public content and comprehensive activity logging for compliance.

## Technical Context

**Language/Version**: TypeScript 5.8 with ES2022 target, strict mode enabled  
**Primary Dependencies**: 
- Ionic 8.x (Angular standalone components)
- Angular 20.x framework with standalone architecture
- Supabase JS client v2.80+ for PostgreSQL REST API, Auth, and Storage
- RxJS 7.8 for reactive state management
- marked.js + DOMPurify for markdown rendering with XSS protection
- Jasmine + Karma for unit testing

**Storage**: 
- PostgreSQL (via Supabase) for all persistent data
- Supabase Storage for uploaded images (articles, parts, admin avatars)
- No IndexedDB caching in admin dashboard (real-time data only)

**Testing**: Jasmine + Karma (existing setup), Angular Testing Library patterns  
**Target Platform**: 
- Primary: Desktop browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Secondary: Tablet/mobile responsive (iOS Safari 14+, Android Chrome 90+)
- Optional: Capacitor 7.x for native desktop builds (future)

**Project Type**: Web application (admin SPA separate from public PWA)  
**Performance Goals**: 
- Auth check: p95 < 500ms
- Dashboard load: p95 < 1000ms
- Article creation: p95 < 2000ms (excluding image upload)
- List pagination: p95 < 1000ms for 100 items
- Metrics cache: 5-minute TTL, activity feed 30-second refresh

**Constraints**: 
- Email/password auth only (no MFA)
- Flat category structure (no hierarchy)
- 90-day audit log retention with daily cold storage exports
- 30-day trash retention before permanent deletion
- WCAG 2.1 AA compliance for all UI
- Must reuse shared design tokens from public app

**Scale/Scope**: 
- ~5-10 admin users (pre-provisioned)
- ~1000 articles, ~500 parts, ~50 categories (initial estimate)
- ~8 feature pages (auth, dashboard, articles, parts, categories, activity, trash, settings)
- ~15 CRUD forms + 10 list views + 5 metric cards

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Quality & Maintainability**: ✅ PASS
  - Unit tests required for all services (AdminAuthService, ActivityLogService, AdminApiService) using Jasmine + Karma
  - Integration tests for authentication flow and CRUD operations
  - ESLint + Prettier already configured; admin code follows existing rules
  - Shared logic extracted to services with clear ownership (core/services/admin-*)
  - All forms use reactive validation with clear error messages
  
- [x] **UX & Accessibility**: ✅ PASS
  - Reuses shared Ionic components (ion-button, ion-input, ion-card) for consistency
  - New patterns: markdown editor with live preview, specs key-value editor, confirmation modals
  - WCAG 2.1 AA compliance: keyboard navigation for all forms, 4.5:1 contrast ratio, ARIA labels on custom components
  - Responsive breakpoints: desktop (>1024px two-column), tablet (768-1024px stacked), mobile (<768px drawer nav)
  - Screen reader testing required for markdown editor and multi-step forms
  
- [x] **Documentation**: ✅ PASS
  - User guide updates: Add admin dashboard section with authentication, CRUD workflows, trash recovery
  - Architecture updates: Document admin auth flow, session management, audit logging, soft-delete implementation
  - New ADRs required:
    * ADR-003: Admin authentication strategy (email/password, session timeout, account lockout)
    * ADR-004: Activity audit logging (retention policy, cold storage exports, PII handling)
    * ADR-005: Soft-delete and trash recovery (30-day retention, auto-purge schedule)
    * ADR-006: Part specs data model (structured key-value with predefined + custom fields)
  - Data schema updates: Add admin_users, activity_logs, trash_items, storage_metrics tables
  
- [x] **Performance**: ✅ PASS
  - Auth check: p95 < 500ms (JWT validation + role check)
  - Dashboard load: p95 < 1000ms (5 metric queries with 5-min cache)
  - Article creation: p95 < 2000ms excluding image upload (form submission + DB insert)
  - List pagination: p95 < 1000ms for 100 items (Supabase range queries with limit/offset)
  - Metrics caching: 5-minute TTL using RxJS ReplaySubject with timestamp validation
  - Activity feed: 30-second polling with RxJS interval, auto-unsubscribe on destroy
  - Monitoring: Lighthouse CI enforces budgets, Supabase dashboard tracks query performance
  
- [x] **Security**: ✅ PASS
  - Admin routes protected by AuthGuard + RoleGuard (requires valid session + admin role claim)
  - Supabase RLS policies restrict admin table access to authenticated admin users only
  - Email/password auth with bcrypt hashing (Supabase Auth handles this)
  - Account lockout after 5 failed attempts (15-minute timeout)
  - Session expiry: 30 minutes inactivity, JWT refresh tokens
  - Markdown sanitization: DOMPurify with strict whitelist (reuses existing implementation)
  - CSRF protection: Supabase JWT tokens in Authorization header (not cookies)
  - Image upload validation: File type, size, dimensions checked client and server-side
  - Audit logging captures all admin actions with IP address, timestamp, admin ID
  - No secrets in repo: Supabase URL + keys in environment variables only
  - Dependency updates: Monthly `npm audit` + patch within 30 days for high/critical CVEs

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

The admin dashboard will be added to the existing Ionic/Angular monolith as a new feature module with route guards to protect admin-only routes. No separate backend required; reuses existing Supabase integration.

```text
src/app/
├── features/
│   ├── admin/                     # NEW: Admin dashboard feature module
│   │   ├── auth/                  # Admin authentication
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   └── guards/            # Auth guards for admin routes
│   │   ├── dashboard/             # Dashboard home with metrics
│   │   ├── articles/              # Article CRUD management
│   │   │   ├── list/
│   │   │   ├── create/
│   │   │   ├── edit/
│   │   │   └── components/        # Shared article form components
│   │   ├── parts/                 # Parts CRUD management
│   │   │   ├── list/
│   │   │   ├── create/
│   │   │   ├── edit/
│   │   │   └── components/        # Specs editor component
│   │   ├── categories/            # Category management
│   │   │   ├── list/
│   │   │   └── edit/
│   │   ├── activity/              # Activity audit logs
│   │   ├── trash/                 # Trash recovery
│   │   ├── settings/              # Admin preferences
│   │   └── shared/                # Admin-specific components
│   │       ├── header/            # Admin nav header
│   │       ├── sidebar/           # Desktop nav sidebar
│   │       └── metric-card/       # Dashboard metric cards
│   ├── home/                      # Existing public app features
│   ├── articles/
│   ├── parts/
│   └── search/
├── core/
│   ├── services/
│   │   ├── supabase.service.ts    # EXTEND: Add admin auth methods
│   │   ├── admin-auth.service.ts  # NEW: Admin session management
│   │   ├── activity-log.service.ts # NEW: Audit logging
│   │   └── admin-api.service.ts   # NEW: Admin CRUD operations
│   ├── models/
│   │   ├── admin.model.ts         # NEW: Admin user types
│   │   ├── activity-log.model.ts  # NEW: Activity log types
│   │   └── trash.model.ts         # NEW: Trash item types
│   └── guards/
│       ├── admin-auth.guard.ts    # NEW: Protect admin routes
│       └── role.guard.ts          # NEW: Verify admin role
└── shared/
    ├── components/                # Reused across public + admin
    └── pipes/

tests/
├── unit/                          # Jasmine + Karma unit tests
│   ├── admin-auth.service.spec.ts
│   ├── activity-log.service.spec.ts
│   └── admin-guards.spec.ts
└── e2e/                           # Future: Cypress/Playwright
```

**Structure Decision**: 
- **Single Project (Monolith)**: Admin dashboard added to existing Ionic/Angular app as `/admin` route prefix
- **Lazy Loaded Module**: Admin features lazy-loaded to avoid bloating public app bundle
- **Shared Core Services**: Reuses SupabaseService, extends with admin-specific methods
- **Route Protection**: Admin routes guarded by `AdminAuthGuard` requiring valid session + admin role
- **Responsive Layout**: Desktop uses two-column layout (sidebar + content), mobile uses drawer nav

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
