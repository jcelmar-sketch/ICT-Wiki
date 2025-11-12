# Tasks: Admin Dashboard

**Input**: Design documents from `/specs/002-admin-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Unit tests required for all services and guards. Integration tests for CRUD flows. Accessibility checks for all UI components.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions
- Add explicit tasks for documentation updates, accessibility checks, performance validation, and security review.

## Path Conventions

This is a single Angular project using Ionic framework. All paths relative to repository root:
- **Features**: `src/app/features/admin/`
- **Core services**: `src/app/core/services/`
- **Models**: `src/app/core/models/`
- **Guards**: `src/app/core/guards/`
- **Tests**: Tests co-located with source files (`.spec.ts`)
- **Docs**: `docs/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and admin-specific structure

- [x] T001 Create admin feature folder structure at `src/app/features/admin/` with subfolders: auth/, dashboard/, articles/, parts/, categories/, activity/, trash/, settings/, shared/
- [x] T002 [P] Create core models for admin domain in `src/app/core/models/admin.model.ts` with AdminUser, AdminSession interfaces
- [x] T003 [P] Create activity log model in `src/app/core/models/activity-log.model.ts` with ActivityLog, ActionType enums
- [x] T004 [P] Create trash model in `src/app/core/models/trash.model.ts` with TrashItem interface
- [x] T005 Update Angular routes in `src/app/app.routes.ts` to add `/admin` path with lazy-loaded children
- [x] T006 [P] Create environment configuration placeholders for Supabase in `src/environments/environment.ts` and `src/environments/environment.prod.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Run Supabase migration `001_create_admin_tables.sql` from `specs/002-admin-dashboard/data-model.md` to create admin_users, activity_logs, storage_metrics tables
- [x] T008 Run Supabase migration `002_admin_rls_policies.sql` to enable RLS and create admin-only access policies
- [x] T009 Run Supabase migration `003_admin_triggers.sql` to create activity logging triggers on articles, parts, categories
- [x] T010 Create AdminAuthService in `src/app/core/services/admin-auth.service.ts` with login(), logout(), getCurrentUser(), checkSession() methods
- [x] T011 Create AdminAuthGuard in `src/app/core/guards/admin-auth.guard.ts` implementing CanActivateFn to protect admin routes
- [x] T012 Create RoleGuard in `src/app/core/guards/role.guard.ts` to verify admin role claim from JWT
- [x] T013 Create ActivityLogService in `src/app/core/services/activity-log.service.ts` with log(), getRecentActivity(), filter() methods
- [x] T014 Create AdminApiService base in `src/app/core/services/admin-api.service.ts` with common CRUD methods and error handling
- [x] T015 [P] Extend SupabaseService in `src/app/core/services/supabase.service.ts` to expose admin auth methods
- [ ] T016 [P] Unit test AdminAuthService in `src/app/core/services/admin-auth.service.spec.ts` covering login success/failure, lockout, session expiry, session timeout detection, localStorage preservation
- [ ] T017 [P] Unit test AdminAuthGuard in `src/app/core/guards/admin-auth.guard.spec.ts` covering redirect scenarios (unauthenticated → /admin/login, authenticated → allow, expired session → /admin/login with returnUrl)
- [ ] T018 [P] Unit test ActivityLogService in `src/app/core/services/activity-log.service.spec.ts` covering log creation, filtering by admin/action/date, pagination, error handling

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable pre-provisioned admins to securely log in with email/password, handle session management, account lockout, and password reset

**Independent Test**: Access `/admin/login`, enter valid credentials → redirected to dashboard. Enter invalid credentials → error shown. Idle 30 min → session expires. Fail 5 logins → account locked.

### Tests for User Story 1

- [ ] T019 [P] [US1] Integration test for login flow in `src/app/features/admin/auth/login/login.page.spec.ts` covering successful login, invalid credentials, account lockout
- [ ] T020 [P] [US1] Accessibility check for login form: keyboard navigation, ARIA labels, screen reader announcements (document results in task notes)
- [ ] T021 [P] [US1] Performance benchmark: Auth check p95 < 500ms (use Chrome DevTools Performance tab, document results)

### Implementation for User Story 1

- [x] T022 [P] [US1] Create LoginPage component in `src/app/features/admin/auth/login/login.page.ts` with reactive form (email, password fields)
- [x] T023 [P] [US1] Create LoginPage template in `src/app/features/admin/auth/login/login.page.html` with ion-input fields, error messages, submit button
- [x] T024 [P] [US1] Create LoginPage styles in `src/app/features/admin/auth/login/login.page.scss` with responsive layout, WCAG AA contrast
- [x] T025 [P] [US1] Create ForgotPasswordPage component in `src/app/features/admin/auth/forgot-password/forgot-password.page.ts` with email input form
- [x] T026 [P] [US1] Create ForgotPasswordPage template in `src/app/features/admin/auth/forgot-password/forgot-password.page.html`
- [x] T027 [US1] Implement login logic in LoginPage: form submission, validation, AdminAuthService.login() call, error handling, redirect to dashboard
- [x] T028 [US1] Implement session timeout detection: use RxJS interval to check session expiry every 60 seconds, preserve form data in localStorage on expiry using key format `admin_form_{formType}_{itemId}` with JSON value `{formData: {...}, savedAt: timestamp, expiresAt: timestamp + 24h}`. Restore data after re-login, clear on explicit logout
- [ ] T028a [US1] Unit test for localStorage form preservation in `src/app/core/services/admin-auth.service.spec.ts` covering: form data saved with 24h expiry, data restored after re-login, expired data purged, sensitive fields (password) excluded, localStorage cleared on explicit logout
- [x] T029 [US1] Implement account lockout UI: show lockout message when AdminAuthService returns locked error, display countdown timer
- [x] T030 [US1] Implement forgot password logic in ForgotPasswordPage: call Supabase Auth recover endpoint, show success message
- [ ] T030a [US1] Integration test for forgot password flow in `src/app/features/admin/auth/forgot-password/forgot-password.page.spec.ts` covering: email sent successfully, invalid email error, rate limiting (max 3 per hour)
- [x] T031 [US1] Add logout button to admin header (implement in Phase 4 US2 when header is created)
- [x] T032 [US1] Update `docs/user-guide.md` adding "Admin Authentication" section with login workflow, lockout rules, password reset
- [x] T033 [US1] Create ADR-003 in `docs/adr/003-admin-authentication-strategy.md` documenting email/password choice, session timeout, lockout logic

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Admins can log in and access protected routes.

---

## Phase 4: User Story 2 - Dashboard Overview & Metrics (Priority: P1) 🎯 MVP

**Goal**: Display dashboard landing page with 6 metric cards (articles, categories, parts, recent uploads, pending drafts, storage usage) and activity feed of last 20 admin actions

**Independent Test**: Log in → dashboard loads showing all metrics with accurate counts. Activity feed shows recent actions. Metrics refresh every 5 minutes. Activity feed updates every 30 seconds.

### Tests for User Story 2

- [ ] T034 [P] [US2] Integration test for dashboard metrics in `src/app/features/admin/dashboard/dashboard.page.spec.ts` verifying all 6 metric cards display correct data
- [ ] T035 [P] [US2] Accessibility check for dashboard: semantic HTML (headings, lists), keyboard navigation to quick action buttons, screen reader announcements
- [ ] T036 [P] [US2] Performance benchmark: Dashboard load p95 < 1000ms with 5-minute cache (use Lighthouse, document results)

### Implementation for User Story 2

- [x] T037 [P] [US2] Create DashboardMetricsService in `src/app/core/services/dashboard-metrics.service.ts` with getMetrics(), getActivityFeed() using RxJS ReplaySubject cache
- [ ] T038 [P] [US2] Unit test DashboardMetricsService in `src/app/core/services/dashboard-metrics.service.spec.ts` covering cache TTL, activity polling
- [x] T039 [P] [US2] Create DashboardPage component in `src/app/features/admin/dashboard/dashboard.page.ts` with metrics$ and activityFeed$ observables
- [x] T040 [P] [US2] Create MetricCardComponent in `src/app/features/admin/shared/metric-card/metric-card.component.ts` as reusable card with label, value, icon, warning state
- [x] T041 [P] [US2] Create AdminHeaderComponent in `src/app/features/admin/shared/header/header.component.ts` with admin email display and logout button
- [x] T042 [P] [US2] Create AdminSidebarComponent in `src/app/features/admin/shared/sidebar/sidebar.component.ts` with navigation menu items
- [x] T043 [US2] Create DashboardPage template in `src/app/features/admin/dashboard/dashboard.page.html` with 6 metric-card components and activity feed list
- [x] T044 [US2] Create DashboardPage styles in `src/app/features/admin/dashboard/dashboard.page.scss` with CSS Grid layout for metric cards
- [x] T045 [US2] Implement admin layout wrapper using ion-split-pane in `src/app/features/admin/admin-layout.component.ts` with responsive sidebar (desktop: persistent, mobile: drawer)
- [x] T046 [US2] Implement storage usage warning: if usage > 80%, add warning class to storage metric card and show alert banner on dashboard
- [x] T047 [US2] Implement quick action buttons: "Create Article", "Create Part", "Create Category" routing to respective create pages
- [x] T048 [US2] Connect logout button in AdminHeaderComponent to AdminAuthService.logout() and redirect to login page
- [x] T049 [US2] Update `docs/user-guide.md` adding "Dashboard Overview" section explaining metric meanings, activity feed, quick actions
- [x] T050 [US2] Update `docs/architecture.md` documenting metrics caching strategy (5-min ReplaySubject), activity feed polling (30-sec interval)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Admins can log in and view dashboard with live metrics.

---

## Phase 5: User Story 3 - Article Management (Priority: P1) 🎯 MVP

**Goal**: Full CRUD for articles including list with filters, create/edit forms with markdown editor and live preview, soft-delete to trash

**Independent Test**: Navigate to Articles → see list with filters. Click Create Article → fill form with markdown content → preview updates live → publish. Edit article → all fields pre-populated. Delete article → moves to trash.

### Tests for User Story 3

- [ ] T051 [P] [US3] Integration test for article CRUD in `src/app/features/admin/articles/articles.spec.ts` covering create, edit, delete, restore flow
- [ ] T052 [P] [US3] Accessibility check for article forms: markdown editor keyboard shortcuts, image upload progress announcements, form validation error announcements
- [ ] T053 [P] [US3] Performance benchmark: Article creation p95 < 2000ms excluding image upload (use Chrome DevTools, document results)

### Implementation for User Story 3

- [x] T054 [P] [US3] Extend Article model in `src/app/core/models/article.model.ts` to add author_id, status, deleted_at fields
- [x] T055 [P] [US3] Create ArticlesAdminService in `src/app/core/services/articles-admin.service.ts` with list(), get(), create(), update(), softDelete(), restore() methods
- [ ] T056 [P] [US3] Unit test ArticlesAdminService in `src/app/core/services/articles-admin.service.spec.ts` covering CRUD operations and error handling
- [x] T057 [P] [US3] Create ArticleListPage component in `src/app/features/admin/articles/list/article-list.page.ts` with filters (category, status, search) and pagination
- [x] T058 [P] [US3] Create ArticleListPage template in `src/app/features/admin/articles/list/article-list.page.html` with ion-searchbar, filter selects, article cards, pagination
- [x] T059 [P] [US3] Create ArticleFormPage component in `src/app/features/admin/articles/create/article-form.page.ts` with reactive form (title, slug, category, tags, content, status)
- [x] T060 [P] [US3] Create MarkdownEditorComponent in `src/app/features/admin/articles/components/markdown-editor/markdown-editor.component.ts` with textarea and live preview pane
- [x] T061 [P] [US3] Create ImageUploadComponent in `src/app/features/admin/articles/components/image-upload/image-upload.component.ts` with drag-drop, progress bar, preview
- [x] T062 [US3] Create ArticleFormPage template in `src/app/features/admin/articles/create/article-form.page.html` with all form fields, markdown-editor, image-upload components
- [x] T063 [US3] Implement slug auto-generation: watch title field changes, transform to lowercase-hyphenated slug, allow manual override
- [x] T064 [US3] Implement form validation: title required, slug unique check, category required, markdown content required, show inline error messages
- [x] T065 [US3] Implement markdown preview: pipe content through MarkdownPipe and DOMPurify, update preview pane on debounced input (300ms)
- [x] T066 [US3] Implement image upload: validate file type/size client-side, upload to Supabase Storage articles bucket, show progress, return public URL
- [x] T066a [US3] Implement storage quota enforcement in ImageUploadComponent: Query storage_metrics before upload attempt, if usage_percent >= 100 reject upload and show error toast "Storage quota exceeded. Please delete unused files or contact administrator.", link to storage metrics on dashboard
- [x] T067 [US3] Implement article save: call ArticlesAdminService.create(), handle validation errors, show success toast, redirect to article list
- [x] T068 [US3] Create ArticleEditPage component in `src/app/features/admin/articles/edit/article-edit.page.ts` reusing ArticleFormPage logic, pre-populate fields from route param ID
- [x] T069 [US3] Implement soft-delete confirmation modal: require typing "DELETE", call ArticlesAdminService.softDelete(), show success message "Article moved to Trash"
- [x] T070 [US3] Implement concurrent edit detection: store article.updated_at timestamp in component on form load, compare with fresh database value before save. If timestamps differ, show conflict modal with: (1) "View Changes" button with field-by-field diff, (2) "Overwrite" button with confirmation showing other admin email and timestamp, (3) "Cancel" button to reload fresh data
- [x] T071 [US3] Add article management routes to `src/app/app.routes.ts` under /admin/articles (list, create, edit/:id)
- [x] T072 [US3] Update `docs/user-guide.md` adding "Article Management" section with create/edit/delete workflows, markdown tips, slug best practices
- [x] T073 [US3] Create ADR-004 in `docs/adr/004-markdown-sanitization.md` documenting DOMPurify configuration, allowed tags, XSS prevention
- [ ] T073a [US3] Security test for markdown sanitization in `src/app/features/admin/articles/components/markdown-editor/markdown-editor.component.spec.ts` covering: XSS prevention with malicious script tags, dangerous attributes (onerror, onclick) stripped, safe HTML preserved (headings, links, code blocks, lists), DOMPurify configuration matches public app
- [x] T074 [US3] Update `docs/data-schema.md` adding article schema extensions (author_id, status, deleted_at columns)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Admin dashboard has full article management capability - this is a shippable MVP!

---

## Phase 6: User Story 4 - Parts Management (Priority: P2)

**Goal**: Full CRUD for hardware parts including list with filters, create/edit forms with specs key-value editor, multi-image upload, soft-delete to trash

**Independent Test**: Navigate to Parts → see list with type/brand filters. Click Create Part → fill form including specs (CPU Speed: 3.5 GHz) → upload multiple images → save. Edit part → specs editable. Delete part → moves to trash.

### Tests for User Story 4

- [~] T075 [P] [US4] Integration test for part CRUD in `src/app/features/admin/parts/parts.spec.ts` covering create with specs, edit, delete flow (SKIPPED per user directive)
- [~] T076 [P] [US4] Accessibility check for parts forms: specs editor keyboard navigation, multi-image upload progress, screen reader support for dynamic fields (SKIPPED per user directive)
- [~] T077 [P] [US4] Performance benchmark: Part creation p95 < 2000ms excluding image uploads (document results) (SKIPPED per user directive)

### Implementation for User Story 4

- [x] T078 [P] [US4] Extend Part model in `src/app/core/models/part.model.ts` to add deleted_at field and PartSpecs type definition
- [x] T079 [P] [US4] Create PartsAdminService in `src/app/core/services/parts-admin.service.ts` with list(), get(), create(), update(), softDelete(), restore() methods
- [~] T080 [P] [US4] Unit test PartsAdminService in `src/app/core/services/parts-admin.service.spec.ts` covering CRUD and specs validation (SKIPPED per user directive)
- [x] T081 [P] [US4] Create PartListPage component in `src/app/features/admin/parts/list/part-list.page.ts` with filters (type, brand, search) and pagination
- [x] T082 [P] [US4] Create PartListPage template in `src/app/features/admin/parts/list/part-list.page.html` with filter dropdowns and part cards
- [x] T083 [P] [US4] Create PartFormPage component in `src/app/features/admin/parts/create/part-form.page.ts` with reactive form (name, slug, type, brand, description, specs)
- [x] T084 [P] [US4] Create SpecsEditorComponent in `src/app/features/admin/parts/components/specs-editor/specs-editor.component.ts` with predefined fields (CPU Speed, RAM, TDP) + dynamic custom fields
- [x] T085 [P] [US4] Create MultiImageUploadComponent in `src/app/features/admin/parts/components/multi-image-upload/multi-image-upload.component.ts` supporting multiple files, reorder, remove
- [x] T086 [US4] Create PartFormPage template in `src/app/features/admin/parts/create/part-form.page.html` with specs-editor and multi-image-upload components
- [x] T087 [US4] Implement specs editor predefined fields: create optional form controls for common hardware specs (CPU Speed, Cores, Threads, Base Clock, Boost Clock, TDP, RAM Size, RAM Type, RAM Speed, Storage Capacity, Storage Type, GPU Model, VRAM, Interface) with text input validators (non-empty if filled)
- [x] T088 [US4] Implement specs editor custom fields: FormArray allowing add/remove key-value pairs, validate uniqueness of keys, prevent empty values
- [x] T089 [US4] Implement multi-image upload: allow selecting multiple files, upload each to Supabase Storage parts bucket, show individual progress bars, store URLs in array
- [x] T090 [US4] Implement part save: transform specs editor output to JSONB format, call PartsAdminService.create(), handle errors, redirect to part list
- [x] T091 [US4] Create PartEditPage component in `src/app/features/admin/parts/edit/part-edit.page.ts` reusing PartFormPage logic, pre-populate specs editor from JSONB
- [x] T092 [US4] Implement part soft-delete: show confirmation modal, call PartsAdminService.softDelete(), remove from public catalog
- [x] T093 [US4] Add parts management routes to `src/app/app.routes.ts` under /admin/parts (list, create, edit/:id)
- [x] T094 [US4] Update `docs/user-guide.md` adding "Parts Management" section with specs editor usage, image best practices
- [x] T095 [US4] Create ADR-005 in `docs/adr/005-part-specs-data-model.md` documenting JSONB structure, predefined fields list (CPU Speed, Cores, Threads, Base Clock, Boost Clock, TDP, RAM Size, RAM Type, RAM Speed, Storage Capacity, Storage Type, GPU Model, VRAM, Interface), validation rules (non-empty string keys/values, no duplicates), extensibility rationale (custom fields support)
- [x] T096 [US4] Update `docs/data-schema.md` documenting part specs JSONB schema with example values

**Checkpoint**: At this point, User Stories 1-4 should all work independently. Parts catalog management is complete.

---

## Phase 7: User Story 5 - Topic Management (Priority: P2)

**Goal**: CRUD for flat topics including list with article counts, create/edit forms, delete protection when topics have articles

**Independent Test**: Navigate to Topics → see list with article counts. Create topic "Graphics Cards" → slug auto-generated "graphics-cards". Assign articles to topic. Try to delete topic → blocked with warning. Reassign articles → delete succeeds.

### Tests for User Story 5

- [ ] T097 [P] [US5] Integration test for topic CRUD in `src/app/features/admin/topics/topics.spec.ts` covering create, edit, delete protection, reassignment
- [ ] T098 [P] [US5] Accessibility check for topic forms: keyboard navigation, clear error messages, delete confirmation accessibility
- [ ] T099 [P] [US5] Performance benchmark: Topic operations p95 < 500ms (document results)

### Implementation for User Story 5

- [ ] T100 [P] [US5] Extend Topic model in `src/app/core/models/topic.model.ts` to add deleted_at field and article_count property
- [ ] T101 [P] [US5] Create TopicsAdminService in `src/app/core/services/topics-admin.service.ts` with list(), get(), create(), update(), delete(), checkArticleCount() methods
- [ ] T102 [P] [US5] Unit test TopicsAdminService in `src/app/core/services/topics-admin.service.spec.ts` covering delete protection logic
- [ ] T103 [P] [US5] Create TopicListPage component in `src/app/features/admin/topics/list/topic-list.page.ts` displaying all topics with article counts
- [ ] T104 [P] [US5] Create TopicListPage template in `src/app/features/admin/topics/list/topic-list.page.html` with topic table/cards
- [ ] T105 [P] [US5] Create TopicFormPage component in `src/app/features/admin/topics/edit/topic-form.page.ts` with reactive form (name, slug, description)
- [ ] T106 [US5] Create TopicFormPage template in `src/app/features/admin/topics/edit/topic-form.page.html` with name and slug inputs
- [ ] T107 [US5] Implement topic slug auto-generation: watch name field, transform to slug, allow manual override, check uniqueness
- [ ] T108 [US5] Implement topic save: call TopicsAdminService.create() or update(), show success toast, refresh topic list
- [ ] T109 [US5] Implement delete protection: call checkArticleCount() before delete, if count > 0 show modal "This topic contains X articles. Reassign or confirm deletion"
- [ ] T110 [US5] Implement article reassignment UI in delete modal: dropdown to select target topic, button to reassign all articles, then delete topic
- [ ] T111 [US5] Implement topic permanent delete: show confirmation modal requiring "PERMANENT DELETE" typed, call TopicsAdminService.delete(), remove from all dropdowns
- [ ] T112 [US5] Add topics management routes to `src/app/app.routes.ts` under /admin/topics (list, create, edit/:id)
- [ ] T113 [US5] Update `docs/user-guide.md` adding "Topic Management" section with reassignment workflow, flat structure clarification
- [ ] T114 [US5] Update `docs/data-schema.md` documenting topic cascade rules and delete protection trigger

**Checkpoint**: At this point, User Stories 1-5 should all work independently. Content organization with topics is complete.

---

## Phase 8: User Story 8 - Responsive Admin UI (Priority: P2)

**Goal**: Ensure admin dashboard works seamlessly on desktop (2-column layout), tablet (collapsible sidebar), and mobile (drawer menu) with all features accessible

**Independent Test**: Access dashboard on desktop → see persistent sidebar. Access on tablet → sidebar collapses to icons. Access on mobile → hamburger menu with drawer. All forms and actions work with touch on mobile.

### Tests for User Story 8

- [ ] T115 [P] [US8] Responsive layout test: verify breakpoints at 1024px (desktop), 768px (tablet), <768px (mobile) using Chrome DevTools device emulation
- [ ] T116 [P] [US8] Accessibility check for responsive UI: keyboard navigation maintained at all breakpoints, hamburger menu accessible, touch targets ≥44x44px
- [ ] T117 [P] [US8] Performance benchmark: maintain p95 budgets across all device sizes (test on mobile network throttling)

### Implementation for User Story 8

- [ ] T118 [P] [US8] Implement ion-split-pane responsive behavior in admin-layout.component.ts with when="lg" breakpoint (1024px)
- [ ] T119 [P] [US8] Create responsive CSS for AdminSidebarComponent in `src/app/features/admin/shared/sidebar/sidebar.component.scss` with desktop (full labels), tablet (icon-only), mobile (drawer)
- [ ] T120 [P] [US8] Implement hamburger menu button in AdminHeaderComponent visible only on mobile (<768px) triggering ion-menu
- [ ] T121 [US8] Test and adjust all form layouts (article, part, category) to stack vertically on mobile, ensure adequate spacing for touch targets
- [ ] T122 [US8] Test image upload on mobile: enable camera access, allow selecting from photo library, show appropriate mobile UI
- [ ] T123 [US8] Test markdown editor on mobile: ensure textarea resizes properly, preview pane scrollable, keyboard doesn't obscure inputs
- [ ] T124 [US8] Implement mobile-specific optimizations: increase button sizes, simplify metric card layouts, adjust pagination controls for touch
- [ ] T125 [US8] Update `docs/design-system.md` documenting responsive breakpoints (desktop >1024px, tablet 768-1024px, mobile <768px) and mobile patterns
- [ ] T126 [US8] Update `docs/user-guide.md` adding note "Admin dashboard fully supports mobile access. All features available on phones and tablets."

**Checkpoint**: At this point, admin dashboard is fully responsive and accessible across all device sizes.

---

## Phase 9: User Story 6 - Activity Audit & History (Priority: P3)

**Goal**: Display comprehensive activity log of all admin actions with filters (admin email, action type, date range) for accountability and troubleshooting

**Independent Test**: Perform actions (create article, edit part, delete category, login). Navigate to Activity → see all actions logged with timestamps, admin emails, item details. Filter by action type "delete" → see only deletions.

### Tests for User Story 6

- [ ] T127 [P] [US6] Integration test for activity logging in `src/app/features/admin/activity/activity.spec.ts` verifying auto-logging from triggers and manual auth logs
- [ ] T128 [P] [US6] Accessibility check for activity log: sortable table keyboard navigation, filter inputs ARIA labels, pagination accessible
- [ ] T129 [P] [US6] Performance benchmark: Activity page load p95 < 1000ms for 100 entries (test with pagination)

### Implementation for User Story 6

- [ ] T130 [P] [US6] Create ActivityPage component in `src/app/features/admin/activity/activity.page.ts` with filters (admin, action type, date range) and pagination
- [ ] T131 [P] [US6] Create ActivityPage template in `src/app/features/admin/activity/activity.page.html` with filter dropdowns, date pickers, activity log table
- [ ] T132 [US6] Implement activity log display: call ActivityLogService.getRecentActivity() with filters, display in ion-list or table with timestamp, admin email, action, item type, item title
- [ ] T133 [US6] Implement filter logic: apply admin email filter, action type filter, date range filter to SQL query parameters, update list on filter change
- [ ] T134 [US6] Implement pagination for activity log: default 50 items per page, prev/next buttons, page number display
- [ ] T135 [US6] Implement date range picker: default to last 30 days, allow selecting custom range, max 90 days (data retention policy)
- [ ] T136 [US6] Implement export functionality: button to export current filtered results as CSV, include all columns
- [ ] T137 [US6] Add item-specific activity history to article/part/category detail views: show filtered activity log for that item ID in expandable section
- [ ] T138 [US6] Add activity log routes to `src/app/app.routes.ts` under /admin/activity
- [ ] T139 [US6] Update `docs/user-guide.md` adding "Activity Audit" section explaining logged actions, retention policy (90 days), filtering, export
- [ ] T140 [US6] Update `docs/architecture.md` documenting activity logging triggers, cold storage export schedule (daily 2 AM UTC)
- [ ] T141 [US6] Create ADR-006 in `docs/adr/006-audit-log-retention.md` documenting 90-day retention, daily exports, compliance requirements
- [ ] T141a [US6] Create Supabase Edge Function in `supabase/functions/export-activity-logs/index.ts` to query logs older than 90 days, export as CSV with columns (created_at, admin_email, action_type, item_type, item_title, notes), upload to `audit-archive` Supabase Storage bucket, mark exported logs as archived=true
- [ ] T141b [US6] Schedule export Edge Function using Supabase Database Webhooks or pg_cron: Run daily at 2 AM UTC, log export results to activity_logs, send failure notifications to admin email if export fails

**Checkpoint**: At this point, full audit trail is available for accountability and compliance.

---

## Phase 10: User Story 7 - Trash & Recovery (Priority: P3)

**Goal**: Display all soft-deleted items in Trash section with ability to restore or permanently delete, auto-purge after 30 days

**Independent Test**: Delete article → appears in Trash with deletion timestamp and admin email. Click Restore → article moves back to active list. Click Permanent Delete → type "PERMANENT DELETE" → article and images removed forever.

### Tests for User Story 7

- [ ] T142 [P] [US7] Integration test for trash operations in `src/app/features/admin/trash/trash.spec.ts` covering soft-delete, restore, permanent delete flow
- [ ] T143 [P] [US7] Accessibility check for trash UI: clear distinction between Restore and Permanent Delete buttons, confirmation modal accessibility
- [ ] T144 [P] [US7] Performance benchmark: Trash page load p95 < 1000ms (document results)

### Implementation for User Story 7

- [ ] T145 [P] [US7] Create TrashService in `src/app/core/services/trash.service.ts` with getTrashItems(), restore(), permanentDelete() methods
- [ ] T146 [P] [US7] Unit test TrashService in `src/app/core/services/trash.service.spec.ts` covering restore and permanent delete operations
- [ ] T147 [P] [US7] Create TrashPage component in `src/app/features/admin/trash/trash.page.ts` displaying all soft-deleted items across articles, parts, categories
- [ ] T148 [P] [US7] Create TrashPage template in `src/app/features/admin/trash/trash.page.html` with trash items table, Restore/Permanent Delete action buttons
- [ ] T149 [US7] Implement trash items display: query all items WHERE deleted_at IS NOT NULL, show item type, title, deleted timestamp, deleted by admin email, auto-delete date (deleted_at + 30 days)
- [ ] T150 [US7] Implement restore functionality: button calls TrashService.restore(itemType, itemId), sets deleted_at = NULL, shows success toast "Item restored", refreshes list
- [ ] T151 [US7] Implement permanent delete confirmation modal: require typing "PERMANENT DELETE" exactly, warn "This action cannot be undone", show item details
- [ ] T152 [US7] Implement permanent delete: call TrashService.permanentDelete(), delete associated images from Supabase Storage, remove database record, log action, show success message
- [ ] T153 [US7] Implement auto-purge indication: show countdown "Auto-delete in X days" for each item, highlight items with <7 days remaining
- [ ] T154 [US7] Create Supabase Edge Function for auto-purge in `supabase/functions/trash-auto-purge/index.ts` to run daily, delete items older than 30 days. Include: error logging for failed deletions, email notification to admins 24h before purge with list of items to be deleted, retry logic (3 attempts with exponential backoff), transaction rollback on partial failure
- [ ] T155 [US7] Schedule auto-purge Edge Function to run daily at 2 AM UTC using Supabase Database Webhooks or pg_cron, log execution results to activity_logs table
- [ ] T156 [US7] Add trash routes to `src/app/app.routes.ts` under /admin/trash
- [ ] T157 [US7] Update `docs/user-guide.md` adding "Trash & Recovery" section with restore workflow, permanent delete warning, auto-purge schedule
- [ ] T158 [US7] Update `docs/architecture.md` documenting soft-delete implementation (deleted_at column), auto-purge Edge Function schedule
- [ ] T159 [US7] Create ADR-007 in `docs/adr/007-soft-delete-and-trash-recovery.md` documenting 30-day retention rationale, auto-purge implementation

**Checkpoint**: At this point, all 8 user stories are fully implemented. Admin dashboard is feature-complete!

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, final testing, and documentation

- [ ] T160 [P] Run full accessibility audit using axe DevTools on all admin pages, fix any violations, document results in `specs/002-admin-dashboard/accessibility-report.md`
- [ ] T161 [P] Run Lighthouse CI on admin dashboard, ensure Performance >90, Accessibility >95, Best Practices >90, document scores
- [ ] T162 [P] Implement global error handling: catch unhandled errors, show user-friendly toast messages, log to ActivityLogService with stack traces
- [ ] T163 [P] Implement loading states: add skeleton loaders to all list pages, show spinners during save operations, disable buttons during async operations
- [ ] T164 [P] Implement optimistic UI updates: show item in list immediately after create, revert on error, mark as "saving..." during network request
- [ ] T165 [P] Add confirmation toasts: "Article created", "Part updated", "Category deleted", "Settings saved" with undo option where applicable
- [ ] T166 [P] Implement keyboard shortcuts: Ctrl+S to save forms, Esc to close modals, / to focus search, document shortcuts in help section
- [ ] T167 [P] Code cleanup: remove console.logs, fix ESLint warnings, ensure all imports organized, remove unused code
- [ ] T168 [P] Security review: verify all admin routes protected by guards, check RLS policies, audit CORS settings, ensure no secrets in code
- [ ] T168a [P] Verify CSRF protection: Confirm Supabase JWT tokens use Authorization header (not cookies), test that cross-origin requests without valid JWT are rejected, document CSRF prevention strategy in security review notes
- [ ] T168b [P] Security test for CSRF protection: Use curl or Postman to send cross-origin POST request to Supabase API without valid JWT Authorization header, verify request is rejected with 401 Unauthorized. Confirm JWT tokens never stored in cookies (only localStorage). Document test results in security review notes.
- [ ] T169 [P] Performance optimization: lazy-load images, implement virtual scrolling for long lists (>100 items), minimize bundle size
- [ ] T170 Run integration test suite covering all user stories end-to-end, fix any failures
- [ ] T171 Create admin settings page at `src/app/features/admin/settings/settings.page.ts` with cache clear, profile view, theme toggle (optional)
- [ ] T172 Validate quickstart.md: follow setup steps on clean machine, verify all commands work, update any outdated instructions
- [ ] T173 Create deployment guide in `docs/deployment.md` with Vercel/Netlify instructions, environment variable checklist, Supabase configuration
- [ ] T174 Create troubleshooting guide in `docs/troubleshooting-admin.md` with common issues (auth failures, RLS errors, upload failures) and solutions
- [ ] T175 Final documentation review: verify all ADRs created, user-guide.md complete, architecture.md updated, data-schema.md accurate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3 (US1 - Auth)**: Depends on Phase 2 - MUST complete before other stories (provides login)
- **Phase 4 (US2 - Dashboard)**: Depends on Phase 2 and Phase 3 (needs auth) - Dashboard is landing page after login
- **Phase 5 (US3 - Articles)**: Depends on Phase 2, can start in parallel with US2 after Phase 3
- **Phase 6 (US4 - Parts)**: Depends on Phase 2, independent of other stories, can run in parallel
- **Phase 7 (US5 - Topics)**: Depends on Phase 2, independent but topics needed for articles
- **Phase 8 (US8 - Responsive)**: Can start after any UI pages exist, cross-cutting concern
- **Phase 9 (US6 - Activity)**: Depends on Phase 2, independent, can run in parallel
- **Phase 10 (US7 - Trash)**: Depends on US3, US4, US5 implementing soft-delete first
- **Phase 11 (Polish)**: Depends on all desired user stories being complete

### Critical Path (MVP - Minimum Viable Product)

For fastest path to shippable product:
1. **Phase 1**: Setup (1-2 tasks can be done in parallel)
2. **Phase 2**: Foundational (all 12 tasks, some parallelizable) - BLOCKING
3. **Phase 3**: US1 Authentication (14 tasks, some parallel) - REQUIRED
4. **Phase 4**: US2 Dashboard (14 tasks) - LANDING PAGE
5. **Phase 5**: US3 Articles (24 tasks) - CORE VALUE
6. **STOP HERE for MVP**: Minimal admin dashboard with login, metrics, and article management

### Recommended Execution Order (Full Feature)

For complete admin dashboard with all features:
1. Setup (Phase 1)
2. Foundational (Phase 2) ← Wait for completion
3. US1 Authentication (Phase 3) ← Must complete first
4. US2 Dashboard (Phase 4) ← Should complete early
5. **Parallel execution possible from here**:
   - Team A: US3 Articles (Phase 5)
   - Team B: US4 Parts (Phase 6)
   - Team C: US5 Categories (Phase 7)
   - Team D: US8 Responsive (Phase 8)
6. US6 Activity (Phase 9) ← Can run parallel
7. US7 Trash (Phase 10) ← Needs US3, US4, US5 soft-delete first
8. Polish (Phase 11) ← Final touches

### User Story Dependencies

- **US1 (Auth)**: BLOCKS all other stories - no one can access admin dashboard without login
- **US2 (Dashboard)**: Depends on US1 (auth) - provides landing page after login
- **US3 (Articles)**: Independent after Foundational phase - can run parallel with US4, US5
- **US4 (Parts)**: Independent after Foundational phase - can run parallel
- **US5 (Topics)**: Independent but logically needed before/with US3 (articles need topics)
- **US6 (Activity)**: Independent after Foundational phase (ActivityLogService) - can run parallel
- **US7 (Trash)**: Depends on US3, US4, US5 implementing soft-delete first
- **US8 (Responsive)**: Cross-cutting, can start after any UI exists

### Within Each User Story

- **Tests first**: Write tests and ensure they FAIL before implementation (TDD)
- **Models before services**: Create data models/interfaces first
- **Services before UI**: Implement business logic before components
- **Components in order**: List pages → Create pages → Edit pages → Delete functionality
- **Integration last**: Connect components to services, test full flow

### Parallel Opportunities

**Setup Phase (Phase 1)**: All 6 tasks marked [P] can run in parallel (different files)

**Foundational Phase (Phase 2)**: 
- T007-T009 (database migrations) can run sequentially or together if tested
- T010-T015 (services) can run in parallel
- T016-T018 (tests) can run in parallel after their services are done

**User Story 3 (Articles) Parallel Examples**:
- T054-T056 (model, service, tests) can run in parallel
- T057-T061 (list page, form page, markdown editor, image upload) can run in parallel (different files)

**Cross-Story Parallel Execution**:
Once US1 (Auth) and US2 (Dashboard) are complete:
- Developer A: US3 Articles
- Developer B: US4 Parts
- Developer C: US5 Topics
- Developer D: US6 Activity
- All can work simultaneously without conflicts

---

## Parallel Example: User Story 3 (Articles)

```bash
# After Foundational phase is complete, launch Article Management user story

# Parallel batch 1: Models and services
Task: "Extend Article model in src/app/core/models/article.model.ts"
Task: "Create ArticlesAdminService in src/app/core/services/articles-admin.service.ts"
Task: "Unit test ArticlesAdminService in src/app/core/services/articles-admin.service.spec.ts"

# Parallel batch 2: UI components (all different files)
Task: "Create ArticleListPage component in src/app/features/admin/articles/list/article-list.page.ts"
Task: "Create ArticleFormPage component in src/app/features/admin/articles/create/article-form.page.ts"
Task: "Create MarkdownEditorComponent in src/app/features/admin/articles/components/markdown-editor/markdown-editor.component.ts"
Task: "Create ImageUploadComponent in src/app/features/admin/articles/components/image-upload/image-upload.component.ts"

# Sequential batch: Integration tasks (depend on above)
Task: "Implement slug auto-generation logic"
Task: "Implement form validation"
Task: "Implement article save"
```

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**Goal**: Ship admin dashboard with essential features as quickly as possible

**MVP Scope** (User Stories 1, 2, 3):
1. ✅ Phase 1: Setup (6 tasks)
2. ✅ Phase 2: Foundational (12 tasks) - CRITICAL PATH
3. ✅ Phase 3: US1 Authentication (14 tasks) - MUST HAVE
4. ✅ Phase 4: US2 Dashboard (14 tasks) - MUST HAVE
5. ✅ Phase 5: US3 Article Management (24 tasks) - CORE VALUE

**Total MVP Tasks**: 70 tasks
**Estimated Time**: 2-3 weeks with 1 developer, 1 week with 2 developers

**MVP Delivers**:
- ✅ Secure admin login with session management
- ✅ Dashboard with site metrics and activity feed
- ✅ Full article CRUD with markdown editor
- ✅ Soft-delete and trash (30-day retention)
- ✅ Responsive UI (desktop + mobile)

**Stop and Validate**: After MVP (70 tasks), deploy to staging, test thoroughly, gather feedback before continuing.

### Incremental Delivery (Recommended)

**Release 1 - MVP** (Phases 1-5):
- Admin authentication
- Dashboard metrics
- Article management
- **DEPLOY and VALIDATE**

**Release 2 - Content Expansion** (Phases 6-7):
- Parts management (US4)
- Category management (US5)
- **DEPLOY and VALIDATE**

**Release 3 - Audit & Recovery** (Phases 9-10):
- Activity audit logs (US6)
- Trash recovery (US7)
- **DEPLOY and VALIDATE**

**Release 4 - Polish** (Phases 8, 11):
- Responsive UI enhancements (US8)
- Performance optimization
- Accessibility improvements
- **FINAL DEPLOY**

### Parallel Team Strategy

**With 3 developers** (optimal):

**Week 1**: Everyone on Setup + Foundational (Phases 1-2)
- Dev A: Database migrations, AdminAuthService
- Dev B: Guards, ActivityLogService
- Dev C: AdminApiService, tests

**Week 2**: Auth + Dashboard (Phases 3-4)
- Dev A: LoginPage, forgot password, auth tests
- Dev B: DashboardPage, metrics service
- Dev C: Admin layout, header, sidebar

**Week 3-4**: Parallel User Stories
- Dev A: US3 Articles (Phase 5) - 24 tasks
- Dev B: US4 Parts (Phase 6) - 22 tasks
- Dev C: US5 Topics (Phase 7) - 15 tasks

**Week 5**: Parallel User Stories
- Dev A: US8 Responsive (Phase 8) - 9 tasks
- Dev B: US6 Activity (Phase 9) - 15 tasks
- Dev C: US7 Trash (Phase 10) - 15 tasks

**Week 6**: Polish (Phase 11) - Everyone together

**Total Time with 3 devs**: ~6 weeks to full feature

---

## Task Summary

**Total Tasks**: 175 tasks

**By Phase**:
- Phase 1 (Setup): 6 tasks
- Phase 2 (Foundational): 12 tasks (BLOCKING)
- Phase 3 (US1 - Auth): 14 tasks (MVP)
- Phase 4 (US2 - Dashboard): 14 tasks (MVP)
- Phase 5 (US3 - Articles): 24 tasks (MVP)
- Phase 6 (US4 - Parts): 22 tasks
- Phase 7 (US5 - Topics): 15 tasks
- Phase 8 (US8 - Responsive): 9 tasks
- Phase 9 (US6 - Activity): 15 tasks
- Phase 10 (US7 - Trash): 15 tasks
- Phase 11 (Polish): 16 tasks

**By Priority**:
- P1 (Critical): 70 tasks (MVP: Auth, Dashboard, Articles)
- P2 (Important): 46 tasks (Parts, Topics, Responsive)
- P3 (Nice-to-have): 30 tasks (Activity, Trash)
- Cross-cutting: 16 tasks (Polish)

**Parallelizable Tasks**: 89 tasks marked [P] (51% can run in parallel with proper team coordination)

**Independent Test Criteria**:
- ✅ US1: Login with valid/invalid credentials, session timeout, account lockout
- ✅ US2: Dashboard metrics display correctly, activity feed updates
- ✅ US3: Create/edit/delete article, markdown preview, image upload
- ✅ US4: Create/edit/delete part with specs, multi-image upload
- ✅ US5: Create/edit/delete topic, article reassignment
- ✅ US6: View activity log, filter actions, export CSV
- ✅ US7: Soft-delete to trash, restore, permanent delete
- ✅ US8: Responsive layout on desktop/tablet/mobile

**Suggested MVP Scope**: Phase 1-5 (70 tasks) delivers authentication + dashboard + article management - this is a shippable, valuable admin dashboard.

---

## Notes

- All tasks include explicit file paths for clarity
- [P] tasks can be executed in parallel (different files, no dependencies)
- [Story] labels enable tracking and independent testing per user story
- Tests are co-located with implementation files (`.spec.ts` convention)
- Documentation tasks integrated throughout (ADRs, user guide updates)
- Security and accessibility checks embedded in each user story
- Performance budgets validated per user story
- Each user story checkpoint ensures independent functionality
- Stop at any checkpoint to validate, deploy, and gather feedback
- Commit after each task or logical task group
- Follow quickstart.md for development environment setup
