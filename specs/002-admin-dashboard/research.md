# Phase 0: Research & Technical Decisions

**Feature**: Admin Dashboard  
**Date**: 2025-11-12  
**Status**: Complete

## Research Areas

This document consolidates research findings for all technical decisions required to implement the admin dashboard. Each section follows the format: Decision → Rationale → Alternatives Considered.

---

## 1. Admin Authentication Strategy

### Decision: Supabase Auth with Email/Password + JWT Sessions

**Implementation**:
- Use Supabase Auth service with email/password provider
- Store admin role as custom JWT claim: `{ role: 'admin' }`
- Session managed by Supabase client (auto-refresh JWT tokens)
- 30-minute inactivity timeout via `expiresIn` configuration
- Account lockout tracked in `admin_users.failed_login_attempts` column

**Rationale**:
- Supabase Auth provides battle-tested authentication with built-in security
- JWT tokens enable stateless session validation (no Redis/session store needed)
- Custom claims allow role-based access control at database and API level
- Supabase client handles token refresh automatically
- Reduces implementation complexity vs. building custom auth

**Alternatives Considered**:
1. **Custom JWT implementation**: Requires building token generation, validation, refresh logic from scratch. High security risk if implemented incorrectly. Rejected for complexity and security concerns.
2. **Session cookies with server-side storage**: Requires backend session store (Redis), complicates PWA offline behavior, increases infrastructure cost. Rejected for stateful complexity.
3. **Firebase Auth**: Similar feature set but requires switching entire backend from Supabase. Rejected to maintain consistency with existing infrastructure.

**Security Measures**:
- bcrypt password hashing (handled by Supabase Auth)
- Failed login tracking: increment `failed_login_attempts` on auth error
- Account lockout: if `failed_login_attempts >= 5`, set `locked_until = NOW() + 15 minutes`
- Reset lockout counter on successful login
- No MFA required per specification (email/password only)

**Angular Implementation Pattern**:
```typescript
// admin-auth.service.ts
async login(email: string, password: string): Promise<AdminUser> {
  // Check if account is locked
  const user = await this.checkAccountLockout(email);
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new Error('Account locked. Try again later.');
  }

  // Attempt Supabase auth
  const { data, error } = await this.supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await this.incrementFailedAttempts(email);
    throw error;
  }

  // Verify admin role claim
  const claims = data.session.user.user_metadata;
  if (claims.role !== 'admin') {
    throw new Error('Unauthorized: Admin role required');
  }

  // Reset failed attempts on success
  await this.resetFailedAttempts(email);
  return this.mapToAdminUser(data.user);
}
```

**Reference**: [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

## 2. Activity Audit Logging

### Decision: PostgreSQL Table with Automatic Triggers + Daily Cold Storage Export

**Implementation**:
- Create `activity_logs` table with indexed columns: `created_at`, `admin_id`, `action_type`
- Use PostgreSQL triggers to auto-log INSERT/UPDATE/DELETE on `articles`, `parts`, `categories`
- Manual logging for auth events (login success/failure) via service layer
- Retention: 90 days in hot storage (PostgreSQL), daily exports to Supabase Storage (cold storage)
- UI displays last 30 days by default with option to search archived logs

**Schema**:
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'login_success', 'login_failure', 'create', 'edit', 'delete',
    'publish', 'unpublish', 'restore', 'permanent_delete'
  )),
  item_type TEXT CHECK (item_type IN ('article', 'part', 'category', NULL)),
  item_id UUID,
  item_title TEXT,
  ip_address INET,
  user_agent TEXT,
  notes JSONB, -- Store field changes, error details, etc.
  archived BOOLEAN DEFAULT FALSE,
  INDEX idx_created_at (created_at DESC),
  INDEX idx_admin_id (admin_id),
  INDEX idx_action_type (action_type)
);
```

**Automatic Logging Trigger Example**:
```sql
CREATE OR REPLACE FUNCTION log_article_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (admin_id, admin_email, action_type, item_type, item_id, item_title)
    VALUES (
      auth.uid(),
      auth.email(),
      'create',
      'article',
      NEW.id,
      NEW.title
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO activity_logs (admin_id, admin_email, action_type, item_type, item_id, item_title, notes)
    VALUES (
      auth.uid(),
      auth.email(),
      'edit',
      'article',
      NEW.id,
      NEW.title,
      jsonb_build_object('changes', jsonb_diff(to_jsonb(OLD), to_jsonb(NEW)))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER article_audit_trigger
AFTER INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION log_article_changes();
```

**Cold Storage Export Strategy**:
- Supabase Edge Function runs daily at 2 AM UTC (cron schedule)
- Query `activity_logs WHERE created_at < NOW() - INTERVAL '90 days' AND archived = FALSE`
- Export to CSV, upload to Supabase Storage bucket `activity-logs-archive/YYYY-MM-DD.csv`
- Mark exported rows as `archived = TRUE`
- Delete archived rows older than 365 days (annual cleanup)

**Rationale**:
- Database triggers ensure 100% capture of data changes (no missed logs if service fails)
- PostgreSQL provides excellent query performance with proper indexes
- Supabase Storage offers cheap cold storage for long-term compliance
- 90-day hot storage balances query performance with storage cost
- CSV format ensures portability for audits and external analysis tools

**Alternatives Considered**:
1. **Application-level logging only**: Risk of missing logs if service crashes or transaction rolls back. Requires manual logging in every service method. Rejected for reliability concerns.
2. **Third-party logging service (Datadog, Logtail)**: Adds external dependency and monthly cost ($50-200/month). Rejected to minimize dependencies and cost.
3. **Infinite retention in PostgreSQL**: Storage costs grow linearly with activity. Rejected for cost scalability.
4. **S3/GCS cold storage**: Requires additional cloud provider integration. Rejected to stay within Supabase ecosystem.

**Reference**: [PostgreSQL Triggers](https://www.postgresql.org/docs/current/plpgsql-trigger.html), [Supabase Edge Functions Cron](https://supabase.com/docs/guides/functions/schedule-functions)

---

## 3. Markdown Editor with Live Preview

### Decision: marked.js + DOMPurify + Monaco Editor (Optional)

**Implementation**:
- Reuse existing `marked.js` + `DOMPurify` stack from public app
- Simple `<textarea>` for markdown input (Phase 1)
- Live preview pane using `MarkdownPipe` (already exists in shared pipes)
- Optional upgrade to Monaco Editor in Phase 2 for syntax highlighting and autocomplete

**Component Structure**:
```typescript
@Component({
  selector: 'app-markdown-editor',
  template: `
    <div class="markdown-editor">
      <div class="editor-pane">
        <ion-textarea
          [(ngModel)]="content"
          (ngModelChange)="onContentChange($event)"
          [rows]="20"
          placeholder="Write markdown content..."
          aria-label="Markdown content editor"
        ></ion-textarea>
      </div>
      <div class="preview-pane" [innerHTML]="content | markdown"></div>
    </div>
  `,
})
export class MarkdownEditorComponent {
  @Input() content = '';
  @Output() contentChange = new EventEmitter<string>();

  onContentChange(value: string): void {
    this.contentChange.emit(value);
  }
}
```

**DOMPurify Configuration** (reuse existing):
```typescript
const cleanHtml = DOMPurify.sanitize(markedHtml, {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
  ALLOW_DATA_ATTR: false,
});
```

**Rationale**:
- Reuses existing markdown infrastructure (no new dependencies)
- `<textarea>` provides immediate functionality without complexity
- Monaco Editor upgrade path available if rich editing needed later
- DOMPurify prevents XSS attacks from malicious markdown
- Live preview improves UX by showing final output immediately

**Alternatives Considered**:
1. **Monaco Editor from start**: Adds ~2MB to bundle size, complex integration with Angular. Deferred to Phase 2 as optional enhancement.
2. **TinyMCE/Quill WYSIWYG**: Stores HTML instead of markdown, complicates content portability. Rejected to maintain markdown-first approach.
3. **SimpleMDE/EasyMDE**: Specialized markdown editors but adds dependency. Rejected; native textarea sufficient for MVP.
4. **No preview pane**: Poor UX; admins can't verify formatting. Rejected.

**Accessibility Considerations**:
- `<textarea>` is natively keyboard-accessible
- Preview pane has `role="region"` and `aria-live="polite"` for screen readers
- Keyboard shortcut documentation (Ctrl+B for bold, etc.) in user guide

**Reference**: [marked.js Docs](https://marked.js.org/), [DOMPurify Docs](https://github.com/cure53/DOMPurify)

---

## 4. Part Specs Key-Value Editor

### Decision: Dynamic FormArray with Predefined + Custom Fields

**Implementation**:
- UI presents predefined common fields as labeled inputs (CPU Speed, RAM, TDP, etc.)
- "Add Custom Field" button allows admins to add arbitrary key-value pairs
- Store as JSONB column in PostgreSQL: `{ "CPU Speed": "3.5 GHz", "RAM": "16GB", "custom_field": "custom_value" }`
- Validation: Required fields enforced, data types validated (number, text, unit)

**Angular Reactive Form Pattern**:
```typescript
@Component({
  selector: 'app-specs-editor',
  template: `
    <form [formGroup]="specsForm">
      <!-- Predefined Common Fields -->
      <ion-item>
        <ion-label position="stacked">CPU Speed</ion-label>
        <ion-input formControlName="cpuSpeed" placeholder="e.g., 3.5 GHz"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">RAM</ion-label>
        <ion-input formControlName="ram" placeholder="e.g., 16GB"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">TDP</ion-label>
        <ion-input formControlName="tdp" type="number" placeholder="e.g., 65"></ion-input>
      </ion-item>

      <!-- Custom Fields (Dynamic FormArray) -->
      <div formArrayName="customFields">
        <div *ngFor="let field of customFields.controls; let i = index" [formGroupName]="i">
          <ion-item>
            <ion-input formControlName="key" placeholder="Field name"></ion-input>
            <ion-input formControlName="value" placeholder="Field value"></ion-input>
            <ion-button fill="clear" (click)="removeCustomField(i)">
              <ion-icon name="trash-outline"></ion-icon>
            </ion-button>
          </ion-item>
        </div>
      </div>

      <ion-button (click)="addCustomField()">Add Custom Field</ion-button>
    </form>
  `,
})
export class SpecsEditorComponent {
  specsForm = this.fb.group({
    cpuSpeed: [''],
    ram: [''],
    tdp: [null, Validators.pattern(/^\d+$/)],
    customFields: this.fb.array([]),
  });

  get customFields(): FormArray {
    return this.specsForm.get('customFields') as FormArray;
  }

  addCustomField(): void {
    this.customFields.push(
      this.fb.group({
        key: ['', Validators.required],
        value: ['', Validators.required],
      })
    );
  }

  removeCustomField(index: number): void {
    this.customFields.removeAt(index);
  }

  getSpecs(): Record<string, string> {
    const formValue = this.specsForm.value;
    const specs: Record<string, string> = {};

    // Add predefined fields (non-empty only)
    if (formValue.cpuSpeed) specs['CPU Speed'] = formValue.cpuSpeed;
    if (formValue.ram) specs['RAM'] = formValue.ram;
    if (formValue.tdp) specs['TDP'] = `${formValue.tdp}W`;

    // Add custom fields
    formValue.customFields?.forEach((field: any) => {
      if (field.key && field.value) {
        specs[field.key] = field.value;
      }
    });

    return specs;
  }
}
```

**Database Storage**:
```sql
-- parts table column
specs JSONB DEFAULT '{}'::jsonb

-- Example stored value
{
  "CPU Speed": "3.5 GHz",
  "RAM": "16GB",
  "TDP": "65W",
  "Socket": "AM4",
  "Custom Field": "Custom Value"
}
```

**Rationale**:
- JSONB provides schema flexibility for diverse part types
- Predefined fields guide admins toward consistency
- Custom fields allow for unique specs without schema migrations
- PostgreSQL JSONB supports indexing and querying (e.g., `specs->>'CPU Speed'`)
- Angular FormArray enables dynamic UI with validation

**Alternatives Considered**:
1. **Fixed schema with EAV pattern**: Entity-Attribute-Value table structure. Overly complex for query performance. Rejected.
2. **Pure JSON editor**: Poor UX; admins must know JSON syntax. Rejected for usability.
3. **Markdown table**: Difficult to parse, no structured queries. Rejected.
4. **Separate specs table with FKs**: Normalized approach but requires complex joins for display. Rejected for simplicity.

**Validation Strategy**:
- Common fields have type-specific validation (number for TDP, pattern for units)
- Custom fields require both key and value to be non-empty
- Duplicate keys prevented via `Set` check before submission
- Server-side validation ensures JSONB structure integrity

**Reference**: [Angular Reactive Forms](https://angular.dev/guide/forms/reactive-forms), [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

---

## 5. Responsive Admin Layout

### Decision: CSS Grid Two-Column Desktop, Drawer Navigation Mobile

**Implementation**:
- **Desktop (>1024px)**: Fixed sidebar (240px width) + flexible content area
- **Tablet (768-1024px)**: Collapsible sidebar (icon-only or full) + content
- **Mobile (<768px)**: Hidden sidebar, hamburger menu opens ion-menu drawer

**Layout Structure**:
```html
<!-- admin-layout.component.html -->
<ion-split-pane contentId="main-content" [when]="'lg'">
  <!-- Sidebar (Desktop: always visible, Mobile: drawer) -->
  <ion-menu contentId="main-content" type="overlay">
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Admin Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item button routerLink="/admin/dashboard">
          <ion-icon name="home-outline" slot="start"></ion-icon>
          <ion-label>Dashboard</ion-label>
        </ion-item>
        <ion-item button routerLink="/admin/articles">
          <ion-icon name="document-text-outline" slot="start"></ion-icon>
          <ion-label>Articles</ion-label>
        </ion-item>
        <!-- More menu items -->
      </ion-list>
    </ion-content>
  </ion-menu>

  <!-- Main Content Area -->
  <div id="main-content" class="ion-page">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="logout()">
            <ion-icon name="log-out-outline"></ion-icon>
            Logout
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <router-outlet></router-outlet>
    </ion-content>
  </div>
</ion-split-pane>
```

**CSS Responsive Breakpoints**:
```scss
// Desktop: Always show sidebar
@media (min-width: 1024px) {
  ion-split-pane {
    --side-width: 240px;
  }
}

// Tablet: Collapsible sidebar
@media (min-width: 768px) and (max-width: 1023px) {
  ion-split-pane {
    --side-width: 80px; // Icon-only mode
  }
  ion-label {
    display: none; // Hide text, show icons only
  }
}

// Mobile: Drawer menu
@media (max-width: 767px) {
  ion-menu {
    --width: 280px;
  }
}
```

**Rationale**:
- `ion-split-pane` component handles responsive behavior automatically
- `ion-menu` provides native drawer pattern familiar to mobile users
- CSS Grid simplifies layout without complex flexbox calculations
- Reuses Ionic's built-in responsive utilities (no custom breakpoint logic)
- Touch targets automatically sized correctly (44x44px minimum on mobile)

**Alternatives Considered**:
1. **Custom CSS Grid from scratch**: Requires handling breakpoints, drawer animations, overlay manually. Rejected; Ionic components provide this out-of-box.
2. **Always-visible sidebar on mobile**: Wastes screen space on small devices. Rejected for poor mobile UX.
3. **Separate mobile vs desktop templates**: Duplicates code, hard to maintain. Rejected for maintainability.
4. **Bottom tab navigation (mobile-first)**: Conflicts with desktop two-column pattern. Rejected to prioritize desktop admin workflow.

**Accessibility Considerations**:
- `ion-menu-button` has ARIA labels for screen readers
- Sidebar navigation uses semantic `<nav>` element
- Focus trapped in drawer when open (handled by Ionic)
- Keyboard shortcut to toggle menu (ESC to close)

**Reference**: [Ionic Split Pane](https://ionicframework.com/docs/api/split-pane), [Ionic Menu](https://ionicframework.com/docs/api/menu)

---

## 6. Soft-Delete and Trash Recovery

### Decision: `deleted_at` Timestamp Column + Trash Items Snapshot Table

**Implementation**:
- Add `deleted_at TIMESTAMPTZ` column to `articles`, `parts`, `categories`
- Soft-delete: Set `deleted_at = NOW()` instead of DELETE query
- Trash view: Query `WHERE deleted_at IS NOT NULL AND deleted_at > NOW() - INTERVAL '30 days'`
- Permanent delete: Actual DELETE query after 30 days or manual confirmation
- Restore: Set `deleted_at = NULL`

**Schema Changes**:
```sql
-- Add deleted_at column to existing tables
ALTER TABLE articles ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE parts ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for trash queries
CREATE INDEX idx_articles_deleted_at ON articles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_parts_deleted_at ON parts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NOT NULL;

-- Optional: Snapshot table for complex scenarios
CREATE TABLE trash_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('article', 'part', 'category')),
  item_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by UUID REFERENCES admin_users(id),
  auto_delete_at TIMESTAMPTZ GENERATED ALWAYS AS (deleted_at + INTERVAL '30 days') STORED,
  item_snapshot JSONB NOT NULL, -- Full item data for recovery
  INDEX idx_auto_delete_at (auto_delete_at)
);
```

**Service Implementation**:
```typescript
// admin-api.service.ts
async softDeleteArticle(id: string): Promise<void> {
  const { error } = await this.supabase
    .from('articles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;

  // Log the delete action
  await this.activityLog.log({
    action: 'delete',
    itemType: 'article',
    itemId: id,
  });
}

async restoreArticle(id: string): Promise<void> {
  const { error } = await this.supabase
    .from('articles')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw error;

  await this.activityLog.log({
    action: 'restore',
    itemType: 'article',
    itemId: id,
  });
}

async permanentDeleteArticle(id: string): Promise<void> {
  // Fetch article to delete associated images
  const { data: article } = await this.supabase
    .from('articles')
    .select('cover_image')
    .eq('id', id)
    .single();

  // Delete image from storage
  if (article.cover_image) {
    await this.supabase.storage.from('articles').remove([article.cover_image]);
  }

  // Permanent delete from database
  const { error } = await this.supabase
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await this.activityLog.log({
    action: 'permanent_delete',
    itemType: 'article',
    itemId: id,
  });
}
```

**Auto-Purge Edge Function**:
```typescript
// supabase/functions/trash-auto-purge/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Find items older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Purge articles
  const { data: articles } = await supabase
    .from('articles')
    .select('id, cover_image')
    .lt('deleted_at', thirtyDaysAgo.toISOString())
    .not('deleted_at', 'is', null);

  for (const article of articles || []) {
    // Delete images
    if (article.cover_image) {
      await supabase.storage.from('articles').remove([article.cover_image]);
    }
    // Permanent delete
    await supabase.from('articles').delete().eq('id', article.id);
  }

  // Repeat for parts and categories...

  return new Response(JSON.stringify({ purged: articles?.length || 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Schedule: Daily at 2 AM UTC
```

**Rationale**:
- `deleted_at` timestamp is simple and performant (single column, indexed)
- Preserves referential integrity during soft-delete period (FKs still valid)
- Trash view uses standard SQL queries (no special logic)
- Auto-purge via Edge Function ensures 30-day retention without manual cleanup
- Snapshot table optional for complex recovery scenarios (e.g., restore with full history)

**Alternatives Considered**:
1. **Separate trash tables**: Requires moving data between tables, breaks FKs. Rejected for complexity.
2. **Boolean `is_deleted` flag**: Doesn't track deletion time, harder to implement 30-day rule. Rejected.
3. **No soft-delete**: Risky; accidental deletes irreversible. Rejected for user safety.
4. **Manual purge by admins**: Requires admin to remember to clean up. Rejected; automation preferred.

**Reference**: [PostgreSQL Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html), [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 7. Dashboard Metrics Caching

### Decision: RxJS ReplaySubject with 5-Minute TTL

**Implementation**:
- Metrics service exposes `metrics$: Observable<DashboardMetrics>`
- Cache stored in `ReplaySubject(1)` with timestamp validation
- If cache age > 5 minutes, fetch fresh data from Supabase
- Activity feed uses separate `interval(30000)` for 30-second polling

**Service Implementation**:
```typescript
@Injectable({ providedIn: 'root' })
export class DashboardMetricsService {
  private metricsCache$ = new ReplaySubject<{
    data: DashboardMetrics;
    cachedAt: Date;
  }>(1);

  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private supabase: SupabaseService) {}

  getMetrics(): Observable<DashboardMetrics> {
    return this.metricsCache$.pipe(
      switchMap((cache) => {
        const age = Date.now() - cache.cachedAt.getTime();
        if (age > this.CACHE_TTL_MS) {
          // Cache expired, fetch fresh data
          return this.fetchMetrics();
        }
        // Cache valid, return cached data
        return of(cache.data);
      }),
      startWith(null), // Trigger initial fetch
    );
  }

  private async fetchMetrics(): Promise<DashboardMetrics> {
    const [
      articlesCount,
      categoriesCount,
      partsCount,
      recentUploads,
      pendingDrafts,
      storageUsage,
    ] = await Promise.all([
      this.supabase.from('articles').select('id', { count: 'exact', head: true }),
      this.supabase.from('categories').select('id', { count: 'exact', head: true }),
      this.supabase.from('parts').select('id', { count: 'exact', head: true }),
      this.supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      this.supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft'),
      this.supabase.from('storage_metrics').select('*').single(),
    ]);

    const metrics: DashboardMetrics = {
      articlesCount: articlesCount.count || 0,
      categoriesCount: categoriesCount.count || 0,
      partsCount: partsCount.count || 0,
      recentUploadsCount: recentUploads.count || 0,
      pendingDraftsCount: pendingDrafts.count || 0,
      storageUsagePercent: storageUsage.data?.usage_percent || 0,
      storageUsageBytes: storageUsage.data?.usage_bytes || 0,
    };

    // Update cache
    this.metricsCache$.next({
      data: metrics,
      cachedAt: new Date(),
    });

    return metrics;
  }

  getActivityFeed(): Observable<ActivityLog[]> {
    // Poll every 30 seconds
    return interval(30000).pipe(
      startWith(0), // Immediate first fetch
      switchMap(() => this.fetchActivityFeed()),
    );
  }

  private async fetchActivityFeed(): Promise<ActivityLog[]> {
    const { data } = await this.supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    return data || [];
  }
}
```

**Rationale**:
- 5-minute cache reduces database load (6 queries → 1 query per 5 min)
- `ReplaySubject(1)` provides last emitted value to new subscribers instantly
- RxJS `interval` enables automatic 30-second activity feed updates
- No external cache store needed (Redis, LocalStorage)
- Automatic unsubscribe on component destroy prevents memory leaks

**Alternatives Considered**:
1. **No caching**: Every dashboard view triggers 6 queries. Poor database performance. Rejected.
2. **LocalStorage cache**: Shared across tabs but requires manual expiry logic. Rejected for simplicity.
3. **HTTP Cache-Control headers**: Works for static data but not for user-specific metrics. Rejected.
4. **Real-time subscriptions**: Supabase provides this, but unnecessary for 5-minute SLA. Rejected for complexity.

**Performance Impact**:
- Uncached: 6 queries @ ~50ms each = ~300ms total
- Cached: 0 queries = <1ms (in-memory read)
- Cache miss: Same as uncached but amortized over 5 minutes

**Reference**: [RxJS ReplaySubject](https://rxjs.dev/api/index/class/ReplaySubject), [RxJS Operators](https://rxjs.dev/guide/operators)

---

## 8. Image Upload and Validation

### Decision: Supabase Storage with Client + Server Validation

**Implementation**:
- Client-side validation: file type, size (<5MB), dimensions (optional)
- Upload to Supabase Storage bucket with public access
- Server-side validation: Supabase Storage policies enforce file type and size
- Progress indicator using `XMLHttpRequest.upload.onprogress` event

**Angular Upload Component**:
```typescript
@Component({
  selector: 'app-image-upload',
  template: `
    <input
      type="file"
      #fileInput
      accept="image/jpeg,image/png,image/webp,image/gif"
      (change)="onFileSelected($event)"
      hidden
    />
    <ion-button (click)="fileInput.click()">
      <ion-icon name="cloud-upload-outline"></ion-icon>
      Upload Image
    </ion-button>

    <div *ngIf="uploadProgress > 0" class="upload-progress">
      <ion-progress-bar [value]="uploadProgress / 100"></ion-progress-bar>
      <p>{{ uploadProgress }}% uploaded</p>
    </div>

    <img *ngIf="imageUrl" [src]="imageUrl" alt="Uploaded image preview" />
  `,
})
export class ImageUploadComponent {
  @Output() imageUploaded = new EventEmitter<string>();

  uploadProgress = 0;
  imageUrl: string | null = null;

  constructor(private supabase: SupabaseService) {}

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPEG, PNG, WebP, or GIF.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    // Upload to Supabase Storage
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await this.supabase.storage
        .from('articles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            this.uploadProgress = (progress.loaded / progress.total) * 100;
          },
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('articles')
        .getPublicUrl(fileName);

      this.imageUrl = urlData.publicUrl;
      this.imageUploaded.emit(this.imageUrl);
      this.uploadProgress = 0;
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
      this.uploadProgress = 0;
    }
  }
}
```

**Supabase Storage Policy** (server-side validation):
```sql
-- Allow authenticated admins to upload images
CREATE POLICY "Allow admin uploads" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' AND
    bucket_id = 'articles' AND
    (storage.extension(name) = 'jpg' OR
     storage.extension(name) = 'jpeg' OR
     storage.extension(name) = 'png' OR
     storage.extension(name) = 'webp' OR
     storage.extension(name) = 'gif')
  );

-- Allow public read access
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'articles');
```

**Rationale**:
- Client validation provides immediate feedback (no server round-trip)
- Server policies prevent malicious uploads bypassing client checks
- Supabase Storage handles CDN, compression, and public URL generation
- Progress indicator improves UX for large files
- Public bucket simplifies URL access (no signed URLs needed)

**Alternatives Considered**:
1. **Server-only validation**: Slow feedback, poor UX. Rejected.
2. **Cloudinary/ImageKit**: External service, additional cost. Rejected to stay in Supabase ecosystem.
3. **Base64 encoding in database**: Bloats database, poor performance. Rejected.
4. **Self-hosted S3-compatible storage**: Requires infrastructure management. Rejected for simplicity.

**Security Considerations**:
- File type validation prevents `.exe`, `.php` uploads
- Size limit prevents storage abuse
- Bucket policies enforce admin-only uploads
- Public URLs are deterministic but require knowing exact filename (not enumerable)

**Reference**: [Supabase Storage Docs](https://supabase.com/docs/guides/storage), [Angular File Upload](https://angular.dev/guide/forms)

---

## Summary of Key Decisions

| Area | Decision | Primary Rationale |
|------|----------|------------------|
| Authentication | Supabase Auth + JWT + Custom Claims | Battle-tested security, stateless sessions, built-in token refresh |
| Audit Logging | PostgreSQL + Triggers + Daily Cold Export | 100% capture rate, compliance-ready retention, cost-efficient |
| Markdown Editor | marked.js + DOMPurify + Textarea | Reuses existing stack, XSS protection, simple MVP with upgrade path |
| Part Specs | JSONB + Dynamic FormArray | Schema flexibility, structured queries, good UX with predefined + custom fields |
| Responsive Layout | Ionic Split Pane + Menu | Native mobile patterns, automatic breakpoint handling, accessible |
| Soft-Delete | `deleted_at` Timestamp + Auto-Purge | Simple, performant, preserves referential integrity during retention |
| Metrics Caching | RxJS ReplaySubject + 5-Min TTL | Reduces DB load, in-memory efficiency, automatic updates |
| Image Upload | Supabase Storage + Client/Server Validation | Secure, CDN-backed, progress indicators, simple integration |

---

## Next Steps (Phase 1)

All technical unknowns have been resolved. Proceed to:
1. Generate `data-model.md` with entity schemas
2. Generate API contracts in `/contracts/`
3. Create `quickstart.md` for developer onboarding
4. Update agent context with new technologies

---

**Research Status**: ✅ Complete  
**Reviewed By**: Auto-generated via `/speckit.plan`  
**Date**: 2025-11-12
