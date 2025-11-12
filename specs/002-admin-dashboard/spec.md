# Feature Specification: Admin Dashboard for ICT Wiki

**Feature Branch**: `002-admin-dashboard`  
**Created**: 2025-11-12  
**Status**: Draft  
**Input**: User description: "Create an admin dashboard for ICT Wiki that allows only pre-existing admin accounts to sign in (no registration flow). The dashboard is a protected web/desktop interface (PWA + optional Capacitor desktop) separate from the public read-only app. Focus on the admin's tasks and goals: monitor site health, manage content, and audit actions."

## Clarifications

### Session 2025-11-12

- Q: What is the audit log retention policy and archival strategy? → A: Log retention: 90 days with daily exports to cold storage; UI shows last 30 days by default
- Q: What authentication method should be used for admin accounts? → A: Email/password only (simple authentication without MFA)
- Q: How should dashboard metrics be updated and cached? → A: Real-time queries with 5-minute cache for metrics; activity feed updates every 30 seconds
- Q: Should categories support hierarchical structure or remain flat? → A: Flat categories only (no hierarchy)
- Q: What structure should be used for hardware part specifications? → A: Structured key-value pairs stored as JSONB with predefined common fields (CPU Speed, Cores, Threads, Base Clock, Boost Clock, TDP, RAM Size, RAM Type, RAM Speed, Storage Capacity, Storage Type, GPU Model, VRAM, Interface) plus custom fields for flexibility

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Authentication (Priority: P1)

An admin needs to securely access the dashboard to manage content. They navigate to the admin login page, enter their pre-provisioned email and password, and gain access to the dashboard. Failed login attempts are tracked and after a configured number of failed attempts (assumed 5 attempts), the account is temporarily locked for security. The admin can log out at any time to end their session, and sessions automatically expire after a period of inactivity (assumed 30 minutes).

**Why this priority**: Without authentication, no admin functionality can be used. This is the gateway to all other features and must be rock-solid secure.

**Independent Test**: Can be fully tested by attempting to log in with valid credentials (redirects to dashboard), invalid credentials (shows error), and testing session timeout. Delivers immediate value by protecting the admin interface.

**Accessibility & Performance Check**: Login form must be keyboard-navigable, include proper ARIA labels for screen readers, provide clear error messages with sufficient color contrast (WCAG AA), and load within performance budget (p95 < 500ms for auth check).

**Documentation Update**: 
- `docs/user-guide.md` - Add admin authentication section
- `docs/architecture.md` - Document auth flow and session management
- Create new ADR for authentication strategy (email/password authentication without MFA)

**Acceptance Scenarios**:

1. **Given** an admin has valid credentials, **When** they enter their email and password and click Sign In, **Then** they are redirected to the Admin Dashboard and see their email displayed in the header
2. **Given** an admin enters invalid credentials, **When** they click Sign In, **Then** they see a clear error message "Invalid email or password" and remain on the login page
3. **Given** an admin is logged in, **When** they click the Logout button, **Then** their session ends and they are redirected to the login page
4. **Given** an admin has been idle for the configured timeout period (assumed 30 minutes), **When** they attempt any action, **Then** their session expires and they are redirected to the login page with a message "Session expired, please log in again"
5. **Given** an admin has failed login 5 times, **When** they attempt to log in again, **Then** they see a message "Account temporarily locked due to multiple failed attempts. Try again in 15 minutes"
6. **Given** an admin clicks "Forgot password" link, **When** they enter their email, **Then** they receive a password reset email with a secure token

---

### User Story 2 - Dashboard Overview & Metrics (Priority: P1)

An admin logs in and immediately sees a high-level overview of the site's health: total articles, categories, parts, recent uploads (last 7 days), pending drafts, and storage usage. They also see a feed of the most recent 20 administrative actions (creates, edits, deletes) with timestamps and actor information. This allows them to quickly assess site activity and spot any issues or unusual patterns.

**Why this priority**: The dashboard landing page is the admin's home base and provides immediate situational awareness. Without this, admins would be navigating blind.

**Independent Test**: Can be fully tested by logging in and verifying all metric cards display correct counts from the database. Delivers value by providing instant visibility into content health.

**Accessibility & Performance Check**: Metrics cards must have semantic HTML (proper headings, lists), sufficient color contrast, and announce values to screen readers. Dashboard must load all metrics within performance budget (p95 < 1000ms). Activity feed must support keyboard navigation.

**Documentation Update**: 
- `docs/user-guide.md` - Add dashboard overview section with metric explanations
- `docs/architecture.md` - Document metric calculation and caching strategy (5-minute cache for metrics, 30-second refresh for activity feed)

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they land on the dashboard, **Then** they see metric cards showing accurate counts for Articles, Categories, Parts, Recent Uploads (7 days), Pending Drafts, and Storage Usage
2. **Given** there are recent admin actions, **When** an admin views the dashboard, **Then** they see a feed of the last 20 actions with timestamp, admin email, action type (created/edited/deleted), and item name
3. **Given** there are no articles yet, **When** an admin views the dashboard, **Then** the Articles card shows "0" and displays an empty state message "No articles yet"
4. **Given** storage usage exceeds 80% of quota, **When** an admin views the dashboard, **Then** they see a warning indicator on the Storage Usage card
5. **Given** storage usage exceeds 80% of quota, **When** an admin views the dashboard, **Then** they see a warning banner with "Storage usage at X%. Consider deleting unused files."
6. **Given** an admin wants to quickly create content, **When** they view the dashboard, **Then** they see prominent "Create Article", "Create Part", and "Create Topic" buttons

---

### User Story 3 - Article Management (Priority: P1)

An admin needs to create, view, edit, and delete articles. They navigate to the Articles section and see a list of all articles with filters for category, tag, status, and date range. They can search by title. To create a new article, they click "Create Article" and fill in a form with title, slug (auto-generated but editable), category, tags, cover image, markdown content with live preview, status (draft/published), and excerpt. They can save as draft or publish immediately. When editing, all fields are pre-populated. Deleting requires typing "DELETE" for confirmation and moves the article to a Trash area for 30 days before permanent deletion.

**Why this priority**: Articles are the core content of ICT Wiki. Without article management, the admin dashboard serves no purpose for content creation.

**Independent Test**: Can be fully tested by creating a new article, viewing it, editing it, and deleting it. Verifies the entire CRUD lifecycle. Delivers value by enabling content publishing.

**Accessibility & Performance Check**: Article forms must be fully keyboard-navigable with proper focus management. Markdown editor must support keyboard shortcuts and announce changes to screen readers. Image upload must show progress indicators. Form validation errors must be clearly announced. Article creation must complete within performance budget (p95 < 2000ms excluding image upload).

**Documentation Update**: 
- `docs/user-guide.md` - Add article management section with detailed workflow
- Create new ADR for markdown sanitization and image storage strategy
- `docs/data-schema.md` - Document article entity and relationships

**Acceptance Scenarios**:

1. **Given** an admin is on the Articles list page, **When** they view the list, **Then** they see all articles with title, category, tags, author, created_at, updated_at, status, and action buttons (View, Edit, Delete)
2. **Given** an admin wants to filter articles, **When** they select a category from the filter dropdown, **Then** only articles in that category are displayed
3. **Given** an admin clicks "Create Article", **When** the form loads, **Then** they see fields for title, slug (auto-generated from title), category dropdown, tags input, cover image upload area, markdown editor with preview pane, status toggle (Draft/Published), excerpt field, and Save/Publish buttons
4. **Given** an admin enters an article title, **When** the title field loses focus, **Then** the slug field is auto-populated with a URL-safe version (e.g., "My Article!" becomes "my-article")
5. **Given** an admin uploads a cover image, **When** the upload completes, **Then** they see a preview of the image and a progress indicator during upload
6. **Given** an admin writes markdown content, **When** they type, **Then** the preview pane updates in real-time showing the rendered HTML
7. **Given** an admin clicks "Publish", **When** all required fields are valid, **Then** the article is saved with status "Published" and appears on the public site immediately
8. **Given** an admin clicks "Save Draft", **When** the form is submitted, **Then** the article is saved with status "Draft" and does NOT appear on the public site
9. **Given** an admin tries to save an article without a title, **When** they submit the form, **Then** they see a validation error "Title is required" and the form does not submit
10. **Given** an admin tries to use a slug that already exists, **When** they submit the form, **Then** they see a validation error "Slug must be unique" with a suggestion for an available slug
11. **Given** an admin clicks Delete on an article, **When** the confirmation modal appears, **Then** they must type "DELETE" to confirm and the article moves to Trash (soft delete) with a success message "Article moved to Trash. Can be restored within 30 days"
12. **Given** an admin views an article, **When** they click the Edit button, **Then** the edit form loads with all existing data pre-populated
13. **Given** there are many articles, **When** an admin navigates the list, **Then** they see pagination controls (10 articles per page by default) with page numbers and next/prev buttons
14. **Given** an admin edits and saves an article, **When** the save completes, **Then** an activity log entry is created recording the admin's email, timestamp, action "edited", and article title

---

### User Story 4 - Parts Management (Priority: P2)

An admin needs to manage hardware parts information. They navigate to the Parts section and see a list of all parts with filters for type and brand, plus search. To create a new part, they fill in a form with name, slug (auto-generated), type, brand, image upload(s), short description, and structured specs (key-value pairs or JSON editor). They can save, edit, and delete parts similarly to articles. Deleting parts also uses soft-delete with Trash.

**Why this priority**: Parts are important content but slightly lower priority than articles since articles are the primary content type. Parts can be added after article management is working.

**Independent Test**: Can be fully tested by creating a new part, viewing it, editing specs, and deleting it. Verifies parts-specific CRUD operations. Delivers value by expanding content types beyond articles.

**Accessibility & Performance Check**: Parts forms must be keyboard-navigable. Specs editor (JSON or key-value UI) must be accessible with screen reader support. Multi-image upload must show progress for each image. Performance budget for part creation: p95 < 2000ms excluding image uploads.

**Documentation Update**: 
- `docs/user-guide.md` - Add parts management section
- `docs/data-schema.md` - Document part entity and specs structure (structured key-value pairs with predefined + custom fields)
- Create new ADR for parts specs data model and common field definitions

**Acceptance Scenarios**:

1. **Given** an admin is on the Parts list page, **When** they view the list, **Then** they see all parts with name, type, brand, created_at, and action buttons (View, Edit, Delete)
2. **Given** an admin clicks "Create Part", **When** the form loads, **Then** they see fields for name, slug (auto-generated), type dropdown or input, brand input, image upload area (supports multiple), description textarea, specs editor, and Save button
3. **Given** an admin uploads multiple part images, **When** uploads complete, **Then** they see thumbnail previews of all images with option to reorder or remove
4. **Given** an admin enters part specs using key-value pairs, **When** they add a spec like "RAM: 16GB", **Then** the spec is added to the list with options to edit or remove
5. **Given** an admin saves a part, **When** all required fields are valid, **Then** the part is saved and appears in the public app's parts catalog
6. **Given** an admin filters parts by type "CPU", **When** the filter is applied, **Then** only CPU parts are displayed
7. **Given** an admin deletes a part, **When** they confirm deletion by typing "DELETE", **Then** the part moves to Trash and is no longer visible on the public site

---

### User Story 5 - Topic Management (Priority: P2)

An admin needs to create and manage content topics.y navigate to the Topics section and see a list of all topics with name, slug, and article count. They can create new topics with name and slug (auto-generated). When editing, they can update the name and slug. Deleting a topic is prevented if it still contains articles; the admin must either reassign articles to another topic or confirm they want to delete all articles in that topic.

**Why this priority**: Topics are organizational infrastructure for articles. While important, they can be managed after basic article CRUD is working. Initial topics could be manually created in the database.

**Independent Test**: Can be fully tested by creating a category, assigning articles to it, attempting to delete it (blocked), reassigning articles, then successfully deleting. Delivers value by providing content organization.

**Accessibility & Performance Check**: Category forms must be keyboard-navigable with clear error messages. Delete confirmation must clearly explain the consequence and provide options. Performance budget for category operations: p95 < 500ms.

**Documentation Update**: 
- `docs/user-guide.md` - Add category management section with reassignment workflow
- `docs/data-schema.md` - Document category entity and cascade rules

**Acceptance Scenarios**:

1. **Given** an admin is on the Topics list page, **When** they view the list, **Then** they see all topics with name, slug, article count, and action buttons (Edit, Delete)
2. **Given** an admin clicks "Create Topic", **When** the form loads, **Then** they see fields for name and slug (auto-generated from name)
3. **Given** an admin creates a topic with name "Graphics Cards", **When** they save, **Then** the slug is auto-generated as "graphics-cards" and the topic appears in the list
4. **Given** an admin tries to delete a topic that has 5 articles, **When** they click Delete, **Then** they see a warning "This topic contains 5 articles. Please reassign them to another topic first or confirm permanent deletion of all articles"
5. **Given** an admin deletes an empty topic, **When** they confirm deletion, **Then** the topic is permanently deleted and removed from all dropdown menus

---

### User Story 6 - Activity Audit & History (Priority: P3)

An admin needs to review what actions have been taken and by whom for accountability and troubleshooting. They navigate to the Activity section and see a detailed log of all admin actions: login attempts (success/failure), content creates/edits/deletes, publish/unpublish actions, with timestamp, admin email, action type, item type, item title/slug, and optional notes. They can filter by admin, action type, and date range to find specific events.

**Why this priority**: Audit logging is important for security and compliance but is not blocking for basic content management. Can be implemented after core CRUD operations are stable.

**Independent Test**: Can be fully tested by performing various actions (create article, edit part, delete category), then viewing the Activity page and verifying all actions are logged with correct details. Delivers value by providing accountability and debugging information.

**Accessibility & Performance Check**: Activity log table must be keyboard-navigable and sortable. Filters must be accessible with proper ARIA labels. Long activity lists must use pagination or virtual scrolling. Performance budget for loading activity page: p95 < 1000ms for 100 log entries.

**Documentation Update**: 
- `docs/user-guide.md` - Add activity audit section explaining what is logged
- `docs/architecture.md` - Document audit logging implementation and retention policy
- Create new ADR for audit log retention and compliance requirements

**Acceptance Scenarios**:

1. **Given** an admin is on the Activity page, **When** they view the log, **Then** they see the most recent 50 actions with timestamp, admin email, action type, item type, item title, and optional note
2. **Given** various actions have been performed, **When** an admin views the activity log, **Then** they see entries for login success/failure, article created/edited/deleted, part created/edited/deleted, category created/edited/deleted, publish/unpublish actions
3. **Given** an admin wants to find specific actions, **When** they filter by admin email "admin@example.com", **Then** only actions performed by that admin are displayed
4. **Given** an admin wants to see recent deletions, **When** they filter by action type "deleted", **Then** only delete actions are displayed
5. **Given** an admin wants to review last week's activity, **When** they set date range filter to last 7 days, **Then** only actions from the last 7 days are displayed
6. **Given** an admin views a specific article, **When** they scroll to the activity history section, **Then** they see all actions performed on that article (who created it, who edited it, what changed)

---

### User Story 7 - Trash & Recovery (Priority: P3)

An admin accidentally deletes an article and needs to restore it. They navigate to the Trash section and see all soft-deleted items (articles, parts, categories) with deletion timestamp and the admin who deleted them. They can restore an item (moves it back to active status) or permanently delete it (removes all data and associated images). Items in Trash are automatically permanently deleted after 30 days.

**Why this priority**: Trash/recovery is a safety feature that prevents data loss but is not critical for the initial launch. Can be added after core CRUD is stable to improve admin confidence.

**Independent Test**: Can be fully tested by deleting an article, viewing it in Trash, restoring it, verifying it appears in the active list again, then deleting it again and permanently deleting it from Trash. Delivers value by providing an "undo" mechanism.

**Accessibility & Performance Check**: Trash interface must be keyboard-navigable with clear distinction between restore and permanent delete actions. Confirmation modals must be accessible. Performance budget for Trash operations: p95 < 1000ms.

**Documentation Update**: 
- `docs/user-guide.md` - Add trash & recovery section with workflow
- `docs/architecture.md` - Document soft-delete implementation and auto-purge schedule

**Acceptance Scenarios**:

1. **Given** an admin deletes an article, **When** they navigate to the Trash section, **Then** they see the deleted article with deletion timestamp and deleting admin's email
2. **Given** an admin views an item in Trash, **When** they click "Restore", **Then** the item is moved back to active status and appears in its respective list (Articles, Parts, or Categories)
3. **Given** an admin views an item in Trash, **When** they click "Permanently Delete", **Then** they see a confirmation modal requiring typing "PERMANENT DELETE" and upon confirmation the item and all associated images are permanently removed
4. **Given** an item has been in Trash for 30 days, **When** the auto-purge process runs, **Then** the item is automatically permanently deleted
5. **Given** an admin restores an article from Trash, **When** the restore completes, **Then** an activity log entry is created recording the restore action

---

### User Story 8 - Responsive Admin UI (Priority: P2)

An admin accesses the dashboard on their mobile phone, tablet, and desktop computer. On desktop, they see a two-column layout with left navigation and main content area. On mobile, the navigation collapses into a drawer/hamburger menu and the content uses full width. All forms, lists, and actions work equally well on all screen sizes. The admin can perform any action from any device.

**Why this priority**: Mobile responsiveness is important for admins who may need to manage content on the go, but desktop is the primary interface. Mobile optimization can follow desktop implementation.

**Independent Test**: Can be fully tested by accessing the admin dashboard on different viewport sizes and verifying navigation, forms, and actions work correctly. Delivers value by enabling content management from any device.

**Accessibility & Performance Check**: Responsive breakpoints must not break keyboard navigation or screen reader functionality. Touch targets must be at least 44x44px on mobile. Hamburger menu must be accessible and announce state changes. Performance budget must be maintained across all device sizes.

**Documentation Update**: 
- `docs/design-system.md` - Document responsive breakpoints and mobile patterns
- `docs/user-guide.md` - Add note about mobile access capabilities

**Acceptance Scenarios**:

1. **Given** an admin accesses the dashboard on a desktop (>1024px width), **When** the page loads, **Then** they see a two-column layout with persistent left navigation and main content area
2. **Given** an admin accesses the dashboard on a mobile device (<768px width), **When** the page loads, **Then** they see a hamburger menu icon and full-width content area
3. **Given** an admin is on mobile, **When** they tap the hamburger menu, **Then** the navigation drawer slides in from the left with all navigation options
4. **Given** an admin is editing an article on mobile, **When** they view the form, **Then** all fields are stacked vertically and easy to interact with using touch
5. **Given** an admin uploads an image on mobile, **When** they tap the upload area, **Then** they can choose from camera or photo library

---

### Edge Cases

- What happens when an admin's session expires during a long editing session? The system should detect the expired session on next save attempt, preserve the form data in local storage, prompt for re-authentication, and restore the form data after successful login.
- How does the system handle concurrent edits (two admins editing the same article)? The system should implement optimistic locking: when an admin saves, check if the article was modified since they started editing. If yes, show a conflict warning with options to view changes or overwrite.
- What happens when image upload fails (network error, file too large, unsupported format)? The system should show a clear error message ("Upload failed: File too large. Maximum size is 5MB"), allow retry, and not block form submission (image upload is optional).
- How does the system maintain WCAG requirements under high contrast mode? All UI components must support Windows High Contrast Mode and respect user's color scheme preferences. Text must remain readable and interactive elements must remain distinguishable.
- How does the system protect read-only data integrity during bulk operations? Bulk actions (multi-select delete) must use confirmation pattern from FR-048 and prevent deletion if any items are referenced by other content (e.g., categories with articles).
- What is the impact on performance budgets when loading a large article list (1000+ articles)? The system must implement pagination (default 25 per page) or virtual scrolling to maintain p95 < 1000ms load time regardless of total article count.
- What happens when storage quota is exceeded? The system should prevent new uploads when quota is reached, show a clear error message "Storage quota exceeded. Please delete old files or contact administrator to increase quota", and highlight storage usage warning on dashboard.
- How does the markdown editor handle potentially malicious content? The system must sanitize markdown on save and render to prevent XSS attacks, strip dangerous HTML tags and attributes, and preserve safe formatting. Document sanitization rules in an ADR.
- What happens when an admin tries to delete the last category? The system should prevent deletion and show message "Cannot delete the last category. At least one category must exist."
- How does the system handle Trash items that are older than 30 days? An automated process should run daily to permanently delete items older than 30 days from Trash, with prior notification to admins (email summary of items to be purged).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an admin login page with email and password fields only (no MFA), no registration option, and redirect to dashboard on successful authentication
- **FR-002**: System MUST validate admin credentials against pre-provisioned accounts using email/password authentication and show clear error message "Invalid email or password" on authentication failure
- **FR-003**: System MUST lock admin accounts temporarily (15 minutes) after a configurable number of failed login attempts (default 5)
- **FR-004**: System MUST provide a "Forgot password" link that sends a secure password reset email to the registered admin email address
- **FR-005**: System MUST display the logged-in admin's email in the dashboard header and provide a prominent Logout button
- **FR-006**: System MUST expire admin sessions after a configurable period of inactivity (default 30 minutes) and redirect to login with message "Session expired, please log in again"
- **FR-007**: System MUST display dashboard metric cards showing counts for: Articles (total), Categories (total), Parts (total), Recent Uploads (last 7 days), Pending Drafts, Storage Usage (percentage and absolute size) using real-time queries with 5-minute cache
- **FR-008**: System MUST display a feed of the last 20 admin actions on the dashboard with timestamp, admin email, action type, item type, and item name, updating every 30 seconds
- **FR-009**: System MUST display an Alerts section on the dashboard showing storage warnings when usage exceeds 80% of quota
- **FR-010**: System MUST provide quick action buttons on the dashboard for "Create Article", "Create Part", and "Create Topic"
- **FR-011**: System MUST provide an Articles list page showing all articles with: title, category, tags, author, created_at, updated_at, status (Published/Draft), and action buttons (View, Edit, Delete)
- **FR-012**: System MUST support filtering articles by category, tag, status, and date range, plus text search on title
- **FR-013**: System MUST paginate article lists with configurable page size (default 25 items per page)
- **FR-014**: System MUST provide an article creation form with required fields (title, category, content) and optional fields (slug auto-generated from title with manual override allowed, tags, cover image, excerpt, status defaults to draft)
- **FR-015**: System MUST auto-generate URL-safe slugs from article titles with option to manually edit and validate uniqueness
- **FR-016**: System MUST provide a markdown editor with live preview pane for article content
- **FR-017**: System MUST support drag-and-drop image upload for article cover images with progress indicator and preview
- **FR-018**: System MUST store uploaded images in accessible storage and return public URLs that work in the public app
- **FR-019**: System MUST validate image uploads for file size (max 5MB default), type (JPEG, PNG, WebP, GIF), and dimensions
- **FR-020**: System MUST save articles with status "Draft" (not visible on public site) or "Published" (immediately visible on public site)
- **FR-021**: System MUST validate required article fields before save and show clear error messages for missing or invalid data
- **FR-022**: System MUST show validation error and suggest alternative slug when an admin tries to use a duplicate slug
- **FR-023**: System MUST implement soft-delete for articles: clicking Delete shows confirmation modal (see FR-048 for confirmation pattern), then moves article to Trash with 30-day retention
- **FR-024**: System MUST provide article edit form pre-populated with all existing data and preserve validation rules
- **FR-025**: System MUST log all article actions (create, edit, delete, publish, unpublish) with timestamp, admin email, and article identifier
- **FR-026**: System MUST provide a Parts list page showing all parts with: name, type, brand, created_at, and action buttons (View, Edit, Delete)
- **FR-027**: System MUST support filtering parts by type and brand, plus text search on name
- **FR-028**: System MUST provide a part creation form with required fields (name, type) and optional fields (slug, brand, images, description, specs)
- **FR-029**: System MUST support multiple image uploads for parts with thumbnail previews and reorder/remove capabilities
- **FR-030**: System MUST provide a specs editor for parts supporting structured key-value pairs stored as JSONB with predefined common fields (CPU Speed, Cores, TDP, RAM Size, etc.) and the ability to add custom fields. Validation: keys must be non-empty strings, values must be non-empty strings, no duplicate keys within same part
- **FR-031**: System MUST implement soft-delete for parts using same pattern as articles (FR-023, FR-048): confirmation modal, move to Trash, 30-day retention
- **FR-032**: System MUST provide a Topics list page showing all flat topics (no hierarchy) with: name, slug, article count, and action buttons (Edit, Delete)
- **FR-033**: System MUST auto-generate URL-safe slugs from topic names with option to manually edit and validate uniqueness
- **FR-034**: System MUST prevent deletion of topics that contain articles and show warning message with article count and options to reassign or force delete
- **FR-035**: System MUST provide an Activity/Audit log page showing all admin actions: login success/failure, content CRUD operations, publish/unpublish actions
- **FR-036**: System MUST record activity log entries with: timestamp, admin email, action type, item type, item identifier, item title, and optional notes. Logs MUST be retained for 90 days in the database with automated daily exports to cold storage (Supabase Storage bucket `audit-archive`) at 2 AM UTC. The UI MUST display the last 30 days by default with pagination. Archived logs older than 30 days remain queryable in the database until the 90-day retention expires.
- **FR-037**: System MUST support filtering activity log by admin email, action type, and date range
- **FR-038**: System MUST display item-specific activity history when viewing individual articles, parts, or categories
- **FR-039**: System MUST provide a Trash section showing all soft-deleted items with deletion timestamp and deleting admin's email
- **FR-040**: System MUST allow admins to restore items from Trash (moves back to active status) or permanently delete (removes all data and images)
- **FR-041**: System MUST require typing "PERMANENT DELETE" to confirm permanent deletion from Trash
- **FR-042**: System MUST automatically permanently delete items that have been in Trash for 30 days or more
- **FR-043**: System MUST use responsive design with two-column layout (left nav + content) on desktop and collapsible drawer nav on mobile
- **FR-044**: System MUST ensure all admin functions are accessible and usable on mobile, tablet, and desktop devices
- **FR-045**: System MUST protect admin routes and require valid authentication token and admin role to access
- **FR-046**: System MUST sanitize markdown content on save and render to prevent XSS attacks
- **FR-047**: System MUST implement CSRF protection for all state-changing operations
- **FR-048**: System MUST show confirmation modals for all destructive actions: (1) Soft-delete: Require typing "DELETE" (case-sensitive) to confirm moving item to Trash, (2) Permanent delete: Require typing "PERMANENT DELETE" (case-sensitive) to confirm irreversible deletion, (3) Bulk operations: List all affected items and require explicit confirmation. All modals must show clear warning text and item details
- **FR-049**: System MUST detect concurrent edits using optimistic locking: Store article.updated_at timestamp when form loads, compare with current database value before save. If timestamps differ, show conflict modal with: (1) "View Changes" button showing field-by-field diff of conflicting changes, (2) "Overwrite" button to force save with confirmation "This will discard changes made by [other admin email] at [timestamp]", (3) "Cancel" button to abort save and reload fresh data
- **FR-050**: System MUST preserve form data in localStorage when session expires and restore after re-authentication. Schema: key format `admin_form_{formType}_{itemId}` (e.g., `admin_form_article_create`, `admin_form_article_edit_123`), value is JSON object with form fields and metadata `{formData: {...}, savedAt: timestamp, expiresAt: timestamp}`. Expiration: 24 hours from save. Security: Do not store sensitive fields (passwords); clear localStorage on explicit logout
- **FR-051**: System MUST prevent new uploads when storage quota is reached and show clear error message with quota information
- **FR-052**: System MUST show success toast notifications on successful save operations and clear error messages on failures
- **FR-053**: System MUST provide helpful empty states for all list views (e.g., "No articles yet — click Create Article")
- **FR-054**: Experience MUST stay consistent with shared UX patterns from the public app where applicable (typography, spacing, color palette)
- **FR-055**: Interfaces MUST meet WCAG 2.1 Level AA accessibility basics: keyboard navigation for all functions, sufficient color contrast (4.5:1 for text), alt text for images, ARIA labels for interactive elements
- **FR-056**: System MUST protect read-only data integrity by validating all inputs, using parameterized queries to prevent SQL injection, and implementing proper authorization checks
- **FR-057**: System MUST meet defined performance budgets: auth check p95 < 500ms, dashboard load p95 < 1000ms, article creation p95 < 2000ms (excluding image upload), list pagination p95 < 1000ms for up to 100 items

### Terminology

- **Admin User**: An administrator account with elevated privileges. Database table: `admin_users`, TypeScript interface: `AdminUser`, text reference: "admin user"
- **Soft-delete**: Marking an item as deleted by setting `deleted_at` timestamp to NOW(), making it invisible to public but recoverable from Trash. Opposite: hard delete (permanent deletion)
- **Activity Log**: Audit trail entry recording admin actions. Database table: `activity_logs`, TypeScript interface: `ActivityLog`
- **Trash**: Collection of soft-deleted items awaiting permanent deletion after 30-day retention period. UI route: `/admin/trash`
- **Cold Storage**: Long-term archival storage for activity logs older than 90 days. Implementation: CSV exports in Supabase Storage bucket `audit-archive`
- **Topic**: Represents a flat (non-hierarchical) content organizational grouping for articles. Database table: `topics`, TypeScript interface: `Topic`, UI label: "Topics"

## Key Entities

- **Admin User**: Represents a pre-provisioned administrator account with email (unique identifier), hashed password, role claim (admin), account status (active/locked), failed login attempts count, last login timestamp, created timestamp. Admins are created outside the dashboard application.

- **Article**: Represents a content article with title, slug (unique, URL-safe), category (foreign key), tags (array or comma-separated), cover image URL, markdown content, rendered HTML content (cached), excerpt, author (admin user foreign key), status (Published/Draft), created timestamp, updated timestamp, deleted timestamp (for soft-delete).

- **Part**: Represents a hardware component with name, slug (unique), type, brand, image URLs (array), short description, specs (structured key-value pairs with predefined common fields like CPU Speed, RAM, TDP, plus custom fields for flexibility), created timestamp, updated timestamp, deleted timestamp.

- **Topic**: Represents a flat (non-hierarchical) content organizational grouping with name, slug (unique, URL-safe), description, created timestamp, updated timestamp. Has one-to-many relationship with Articles. No parent-child relationships between topics.

- **Activity Log**: Represents an audit trail entry with timestamp, admin user (foreign key), action type (enum: login_success, login_failure, create, edit, delete, publish, unpublish, restore, permanent_delete), item type (enum: article, part, topic, null for login events), item identifier (slug or ID), item title, optional notes (e.g., field changes), IP address.

- **Trash Item**: Represents a soft-deleted content item (article, part, or topic) with original item type, original item ID, deletion timestamp, deleted by admin (foreign key), item snapshot (JSON), auto-delete date (deletion timestamp + 30 days).

- **Storage Metrics**: Represents storage usage tracking with total files count, total size in bytes, quota limit, last calculated timestamp. Updated on each upload/delete operation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can successfully authenticate and access the dashboard within 5 seconds from entering credentials
- **SC-002**: Dashboard metrics load and display within 3 seconds on initial page load
- **SC-003**: Admins can create and publish a new article (excluding image upload time) within 5 minutes from clicking "Create Article"
- **SC-004**: All admin actions (create, edit, delete) complete within 3 seconds (excluding file uploads) for responsive user experience
- **SC-005**: Article lists with up to 100 items load within 2 seconds using pagination
- **SC-006**: Image uploads complete within 10 seconds for files up to 5MB on a standard broadband connection
- **SC-007**: Admin interface achieves 95% task completion rate for primary actions (create article, edit article, delete article) without errors
- **SC-008**: Session timeout and re-authentication flow preserves 100% of in-progress form data when session expires during editing
- **SC-009**: Concurrent edit detection prevents 100% of data conflicts by warning admins before overwriting changes
- **SC-010**: Trash recovery feature enables admins to restore 100% of accidentally deleted items within the 30-day retention period
- **SC-011**: All admin interface pages achieve WCAG 2.1 Level AA compliance as verified by automated accessibility testing tools (Axe, Lighthouse)
- **SC-012**: Admin dashboard is fully functional on mobile devices (iOS Safari, Android Chrome) with 100% feature parity to desktop
- **SC-013**: Zero XSS or CSRF vulnerabilities detected in security audit of markdown rendering and form submission
- **SC-014**: Activity audit log captures 100% of admin actions with complete metadata (timestamp, actor, action, item) for compliance
- **SC-015**: System handles storage quota limits gracefully by preventing uploads when quota exceeded and showing clear error messages to admins
