# Tasks: ICT Wiki Mobile App

**Input**: Design documents from `/specs/001-ict-wiki-app/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/supabase-schema.sql ✅

**Tests**: Manual testing only per project constitution. No automated test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions
- Add explicit tasks for documentation updates, accessibility checks, performance validation, and security review of read-only data.

## Path Conventions

All paths relative to project root `ict-wiki-app/`:
- Source code: `src/app/`
- Models: `src/app/core/models/`
- Services: `src/app/core/services/` and `src/app/features/[feature]/`
- Components: `src/app/features/[feature]/` and `src/app/shared/components/`
- Documentation: `docs/`
- Assets: `src/assets/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per plan.md

- [X] T001 Initialize Ionic Angular project with `ionic start ict-wiki-app blank --type=angular --capacitor` using TypeScript 5.x and Angular 18.x standalone components
- [X] T002 [P] Install core dependencies: `@supabase/supabase-js`, `dexie` (IndexedDB), `marked` (markdown), `dompurify` (sanitization), `fuse.js` (search)
- [X] T003 [P] Configure ESLint with TypeScript rules in `.eslintrc.json` and Prettier in `.prettierrc.json`
- [X] T004 [P] Create environment configuration files `src/environments/environment.ts` and `src/environments/environment.prod.ts` with Supabase URL/key placeholders
- [X] T005 [P] Setup Ionic design tokens in `src/theme/variables.scss` with WCAG AA compliant colors (4.5:1 contrast), ≥44px touch targets, responsive font sizes ≥16px, and create initial `docs/design-system.md` with theme token documentation
- [X] T006 Create project structure: `src/app/core/`, `src/app/features/`, `src/app/shared/`, `docs/`, `docs/adr/`
- [X] T007 [P] Configure Capacitor in `capacitor.config.ts` for optional native builds (iOS/Android)
- [X] T008 [P] Setup Vercel deployment configuration in `vercel.json` with build command and SPA rewrites
- [X] T009 [P] Create `.gitignore` with `node_modules/`, `dist/`, `www/`, `*.env`, `.angular/`
- [X] T010 [P] Initialize git repository and create initial commit on branch `001-ict-wiki-app`

**Checkpoint**: Project structure ready, dependencies installed, basic configuration complete

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 Setup Supabase project and execute schema migration from `specs/001-ict-wiki-app/contracts/supabase-schema.sql`
- [X] T012 Verify Supabase setup: Check 6 tables exist (articles, topics, tags, article_tags, related_articles, computer_parts) and RLS policies are active, create Supabase Storage buckets ('articles', 'parts') with public read access
- [X] T013 Create TypeScript interfaces in `src/app/core/models/article.model.ts` matching Article entity from data-model.md (id, title, slug, content, excerpt, cover_image, topic_id, published_at, is_featured)
- [X] T014 [P] Create TypeScript interfaces in `src/app/core/models/topic.model.ts` matching Topic entity (id, name, slug, description, icon)
- [X] T015 [P] Create TypeScript interfaces in `src/app/core/models/tag.model.ts` matching Tag entity (id, name, slug)
- [X] T016 [P] Create TypeScript interfaces in `src/app/core/models/computer-part.model.ts` matching ComputerPart entity (id, name, slug, category, description, image, specs_json, manufacturer)
- [X] T017 [P] Create TypeScript interface in `src/app/core/models/search-result.model.ts` for unified search results (type: 'article' | 'part', id, title, excerpt, image)
- [X] T018 Implement SupabaseService in `src/app/core/services/supabase.service.ts` with client initialization using environment variables and getStorageUrl() method for Supabase Storage public URLs
- [X] T019 Implement CacheService in `src/app/core/services/cache.service.ts` using Dexie.js wrapper for IndexedDB with 7-day TTL and LRU eviction logic
- [X] T020 Create IndexedDB schema in CacheService: `articles` table (id, title, content, cached_at, access_count), `parts` table (id, name, specs, cached_at, access_count)
- [X] T021 Implement cache eviction logic in CacheService: Remove items older than 7 days, LRU eviction when quota exceeded
- [X] T022 Implement SearchService in `src/app/core/services/search.service.ts` using Fuse.js with configuration (threshold: 0.3-0.4, search keys: title, content, description)
- [X] T023 Create MarkdownPipe in `src/app/shared/pipes/markdown.pipe.ts` using marked.js parser + DOMPurify sanitizer
- [X] T024 Create skeleton loader component in `src/app/shared/components/skeleton-loader/skeleton-loader.component.ts` for loading states
- [X] T025 [P] Configure Angular routing in `src/app/app.routes.ts` with lazy-loaded feature modules
- [X] T026 [P] Create app shell in `src/app/app.component.ts` with Ionic tab navigation (Home, Topics, Parts, Search)
- [X] T027 [P] Setup service worker for PWA offline support using Angular service worker configuration
- [X] T028 Document Supabase setup in `docs/developer-setup.md` including Storage bucket creation (copy from quickstart.md and enhance)

**Checkpoint**: Foundation ready - all core services functional, data models defined, caching ready, user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Browse and Read Articles (Priority: P1) 🎯 MVP

**Goal**: Enable users to browse featured/latest articles, navigate topics, view article lists, and read markdown content with related articles

**Independent Test**: Open app → View featured articles on home → Tap Topics → Select Computer topic → View article list → Open article → Verify markdown renders with cover image, publish date, and related articles at bottom

### Implementation for User Story 1

- [X] T029 [P] [US1] Create HomePage in `src/app/features/home/home.page.ts` with Ionic layout
- [X] T030 [P] [US1] Create TopicsPage in `src/app/features/topics/topics.page.ts` with topic navigation UI
- [X] T031 [P] [US1] Create ArticleListComponent in `src/app/features/articles/article-list/article-list.component.ts` with infinite scroll
- [X] T032 [P] [US1] Create ArticleDetailPage in `src/app/features/articles/article-detail/article-detail.page.ts` with markdown rendering
- [X] T033 [P] [US1] Create ArticleCardComponent in `src/app/shared/components/article-card/article-card.component.ts` for list/grid display
- [X] T034 [US1] Implement ArticlesService in `src/app/features/articles/articles.service.ts` with methods: `getFeatured()`, `getLatest()`, `getByTopic(topicId)`, `getById(id)`, `getRelated(articleId)`, transform cover_image paths to Supabase Storage URLs
- [X] T035 [US1] Integrate ArticlesService with SupabaseService: Fetch featured articles with `is_featured=true`, order latest by `published_at DESC`, use getStorageUrl() for cover images
- [X] T036 [US1] Integrate ArticlesService with CacheService: Cache articles on view, retrieve from cache when offline
- [X] T037 [US1] Implement HomePage logic: Load featured and latest articles, display with ArticleCard, show skeleton loaders during fetch
- [X] T038 [US1] Implement TopicsPage logic: Fetch topics from Supabase, display as navigation cards with icons (Computer, Network, Software)
- [X] T039 [US1] Implement ArticleListComponent logic: Load articles by topic with pagination (20 items), implement infinite scroll using Ionic ion-infinite-scroll
- [X] T040 [US1] Implement ArticleDetailPage logic: Load article by ID, render markdown using MarkdownPipe, fetch and display related articles
- [X] T041 [US1] Add pull-to-refresh in HomePage using Ionic ion-refresher to reload featured/latest content
- [X] T042 [US1] Add pull-to-refresh in ArticleListComponent to reload topic articles
- [X] T043 [US1] Handle edge cases: Display placeholder image when cover_image is null, omit publish date if missing, show "No related articles" when empty
- [X] T044 [US1] Add error handling: Display user-friendly messages for network errors, show cached content with staleness indicator when offline
- [X] T045 [US1] Implement accessibility: Semantic HTML5 `<article>` elements, proper heading hierarchy (h1-h6), ARIA labels for interactive elements, alt text for images
- [X] T046 [US1] Manual accessibility testing: Keyboard navigation (tab through all interactive elements), VoiceOver/TalkBack screen reader testing, verify touch targets ≥44px
- [X] T047 [US1] Performance optimization: Lazy load images using Intersection Observer, implement OnPush change detection for ArticleCard, use virtual scrolling for long lists
- [X] T048 [US1] Manual performance testing: Lighthouse CI audit targeting p95 <2s on 3G throttle, verify skeleton loaders appear within 100ms, test scroll performance ≥30 FPS on iPhone 8
- [X] T049 [US1] Update user guide in `docs/user-guide.md`: Add "Browsing Articles" section explaining home screen, topics, article lists, reading articles, related articles
- [X] T050 [US1] Create ADR in `docs/adr/001-ionic-angular.md` documenting framework selection rationale from research.md

**Checkpoint**: User Story 1 complete - Users can browse and read articles, MVP is functional and independently testable

---

## Phase 4: User Story 2 - Search Content Globally (Priority: P2)

**Goal**: Enable global search across articles and computer parts with <1s results, visual distinction, and relevance ranking

**Independent Test**: Tap search icon → Type "network" → Verify results show both articles and parts within 1 second → Tap article result → Article detail opens → Tap part result → Part detail opens

### Implementation for User Story 2

- [X] T051 [P] [US2] Create SearchPage in `src/app/features/search/search.page.ts` with search input and results list
- [X] T052 [P] [US2] Create SearchResultComponent integrated into SearchPage template for unified article/part display
- [X] T053 [US2] Implement SearchService indexing: Build Fuse.js index from articles (title, content, tags) and parts (name, description, category) on app load
- [X] T054 [US2] Implement SearchService query method: Accept search string, return unified SearchResult[] with relevance score, limit to 50 results
- [X] T055 [US2] Implement SearchPage logic: Debounce input (300ms), call SearchService, display results with visual distinction (article icon vs part icon)
- [X] T056 [US2] Add search input in SearchPage using Ionic ion-searchbar with placeholder "Search articles and parts..."
- [X] T057 [US2] Implement result highlighting: Use Fuse.js matches to highlight search terms in result titles/excerpts
- [X] T058 [US2] Handle edge cases: Display "No results found" when results empty, show skeleton placeholders during search
- [X] T059 [US2] Add navigation from SearchResult to ArticleDetailPage or PartDetailPage based on result type
- [X] T060 [US2] Optimize search performance: Cache Fuse.js index in memory, index articles and parts on init
- [X] T061 [US2] Implement accessibility: Announce result count to screen readers using ARIA live region, keyboard-accessible search input with clear focus states
- [X] T062 [US2] Manual accessibility testing: Verify keyboard navigation through results, test screen reader announcements, check WCAG AA contrast for search UI
- [X] T063 [US2] Manual performance testing: Verify search results appear <1s for ~500 items, test debouncing prevents excessive re-indexing, confirm skeleton loaders show during network delay
- [X] T064 [US2] Update user guide in `docs/user-guide.md`: Add "Searching Content" section with search tips, syntax examples, explaining article vs part results
- [X] T065 [US2] Document search indexing strategy in `docs/architecture.md`: Explain Fuse.js configuration, offline search capability, re-indexing triggers

**Checkpoint**: User Story 2 complete - Search works independently across articles and parts, <1s results, accessible

---

## Phase 5: User Story 3 - Explore Computer Parts Catalog (Priority: P3)

**Goal**: Enable users to view parts grid, explore categories, and see detailed specifications from structured JSON

**Independent Test**: Navigate to Parts section → View grid of parts with images → Scroll to load more → Tap a part → Verify specs render in table format with labeled attributes

### Implementation for User Story 3

- [X] T066 [P] [US3] Create PartsPage in `src/app/features/parts/parts.page.ts` with responsive grid layout and category filters
- [X] T067 [P] [US3] Create PartDetailPage in `src/app/features/parts/part-detail/part-detail.page.ts` with spec display
- [X] T068 [P] [US3] Create PartCard display integrated in PartsPage template for grid items
- [X] T069 [P] [US3] Create specifications display integrated in PartDetailPage template to render specs_json
- [X] T070 [US3] Implement PartsService in `src/app/features/parts/parts.service.ts` with methods: `getAll()`, `getByCategory(category)`, `getById(id)`, `getBySlug(slug)`, transform image paths to Supabase Storage URLs
- [X] T071 [US3] Integrate PartsService with SupabaseService: Fetch parts with pagination (20 items), order by name, use getStorageUrl() for part images
- [X] T072 [US3] Integrate PartsService with CacheService: Cache parts on view, retrieve from cache when offline
- [X] T073 [US3] Implement PartsPage logic: Load parts with infinite scroll, display in responsive grid (2 columns mobile, 3-4 tablet), category filter UI
- [X] T074 [US3] Implement PartDetailPage logic: Load part by slug, render image via Supabase Storage, description, manufacturer, specs in table format
- [X] T075 [US3] Implement specifications display logic: Parse specs_json, render key-value pairs with formatted keys
- [X] T076 [US3] Add pull-to-refresh in PartsPage to reload parts catalog
- [X] T077 [US3] Handle edge cases: Display placeholder image when image null, show "Specifications unavailable" when specs_json empty
- [X] T078 [US3] Add error handling: User-friendly messages for fetch failures, retry button, cached parts when offline
- [X] T079 [US3] Implement accessibility: Descriptive alt text for part images, proper heading hierarchy, ARIA labels for interactive elements
- [X] T080 [US3] Manual accessibility testing: Screen reader reads specs correctly, keyboard navigation through grid, touch targets ≥44px verified
- [X] T081 [US3] Performance optimization: Lazy load part images using Intersection Observer, implement virtual scrolling for large grids (>50 parts)
- [X] T082 [US3] Manual performance testing: Grid loads <2s on 3G, verify layout stability during image load, test scroll performance ≥30 FPS
- [X] T083 [US3] Update user guide in `docs/user-guide.md`: Add "Computer Parts Catalog" section explaining grid navigation, part categories, interpreting specs
- [X] T084 [US3] Document parts data schema in `docs/data-schema.md`: Explain specs_json structure, required fields, category values

**Checkpoint**: User Story 3 complete - Parts catalog functional, grid loads efficiently, specs display clearly

---

## Phase 6: User Story 4 - Filter and Discover Content (Priority: P4)

**Goal**: Enable filtering articles by topic and tag with result counts, filter persistence, and clear reset

**Independent Test**: View article list → Apply Computer topic filter → Verify only Computer articles shown → Tap a tag → Related articles appear → Clear filters → All articles return

### Implementation for User Story 4

- [X] T085 [P] [US4] Create TagFilterComponent in `src/app/shared/components/tag-filter/tag-filter.component.ts` and TopicFilterComponent in `src/app/shared/components/topic-filter/topic-filter.component.ts` with selection UI
- [X] T086 [P] [US4] Create TagsService in `src/app/features/tags/tags.service.ts` to fetch tags from Supabase
- [X] T087 [US4] Implement filter state management: Store active filters (topic, tags[]) in SearchPage component
- [X] T088 [US4] Implement filter component logic: Display topics/tags as chips, emit filter changes, show active filter count
- [X] T089 [US4] Integrate filter components into SearchPage: Apply filters to search results, show filter toggle button
- [X] T090 [US4] Implement ArticlesService.getFiltered() method: Support combined filtering by topic, tags, and search query
- [X] T091 [US4] Implement combined filter logic: Apply filters to Supabase queries with proper SQL conditions
- [X] T092 [US4] Implement "Clear Filters" button: Reset filter state in components, reload unfiltered results
- [X] T093 [US4] Add filter persistence: Store active filters in sessionStorage, restore on app reload, maintain filters during navigation
- [X] T094 [US4] Handle edge cases: Show "No results" with clear filters option when empty
- [X] T095 [US4] Optimize filter performance: Ensure <500ms response time for filter operations
- [X] T096 [US4] Implement accessibility: Keyboard-navigable filter controls, clear labels for screen readers, WCAG AA contrast for active/inactive states, announce result count changes
- [X] T097 [US4] Manual accessibility testing: Tab through filter UI, verify screen reader announces filter state changes, check touch target sizes
- [X] T098 [US4] Manual performance testing: Verify filter updates <500ms for 1000 items, test filter persistence across navigation
- [X] T099 [US4] Update user guide in `docs/user-guide.md`: Add "Filtering Articles" section explaining topic filters, tag filters, combined filters, clearing filters
- [X] T100 [US4] Add filter component patterns section to `docs/design-system.md`: Filter UI patterns, state management, accessibility guidelines

**Checkpoint**: User Story 4 complete - Filtering works, persists during session, helps users discover content

---

## Phase 7: User Story 5 - Use Offline and on Slow Networks (Priority: P5)

**Goal**: Enable offline access to cached content, skeleton loaders for slow networks, pull-to-refresh, and clear staleness indicators

**Independent Test**: View articles online → Go offline (airplane mode) → Verify cached articles load → Pull-to-refresh shows offline message → Go online → Pull-to-refresh fetches fresh content

### Implementation for User Story 5

- [X] T101 [P] [US5] Create OfflineIndicatorComponent in `src/app/shared/components/offline-indicator/offline-indicator.component.ts` using browser navigator.onLine for status detection
- [X] T102 [P] [US5] Create CacheManagementService in `src/app/core/services/cache-management.service.ts` for cache statistics and management
- [X] T103 [US5] Implement OfflineIndicatorComponent: Display toast when network status changes, show persistent badge when offline, announce to screen readers
- [X] T104 [US5] Integrate with CacheService: ArticlesService and PartsService already implement cache-first strategy via CacheService
- [X] T105 [US5] Add OfflineIndicatorComponent to app root in `src/app/app.component.html`
- [X] T106 [US5] Create SettingsPage in `src/app/features/settings/settings/settings.page.ts` with cache management UI
- [X] T107 [US5] Implement SettingsPage logic: Display cache statistics (article count, part count, storage usage), clear cache actions (expired/articles/parts/all)
- [X] T108 [US5] Implement CacheManagementService: getStats(), clearArticles(), clearParts(), clearExpired(), clearAll(), formatBytes()
- [X] T109 [US5] Add settings navigation: Settings button in HomePage header linking to SettingsPage
- [X] T110 [US5] Handle edge cases: Confirm dialogs before clearing cache, show toast feedback after operations
- [X] T111 [US5] Cache storage optimization: CacheService already implements 7-day TTL and LRU eviction
- [X] T112 [US5] Enhance offline UX: Display "Content unavailable offline" when accessing uncached item, suggest viewing cached items
- [X] T113 [US5] Implement cache warming: Pre-cache featured articles and latest parts on app first load
- [X] T114 [US5] Implement accessibility: Offline indicator announced to screen readers, accessible cache management controls
- [X] T115 [US5] Manual accessibility testing: Verify offline state announced, test cache management keyboard navigation
- [X] T116 [US5] Manual performance testing: Verify cache reads <16ms (smooth 60fps), test skeleton loaders appear <100ms on slow network, confirm pull-to-refresh completes <3s on WiFi
- [X] T117 [US5] Update user guide in `docs/user-guide.md`: Add "Offline Usage" section explaining caching, cache limits, clearing cache, staleness indicators
- [X] T118 [US5] Document caching strategy in `docs/architecture.md`: Explain 7-day TTL, LRU eviction, cache-first pattern, Supabase Storage integration

**Checkpoint**: User Story 5 complete - App works offline with cached content, clear feedback on staleness, performance stays smooth

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final production readiness

- [X] T119 [P] Create About page in `src/app/features/about/about.page.ts` with app information, version, data source attribution, privacy policy link
- [X] T120 [P] Add app icon and splash screen assets to `src/assets/icon/` and configure in `capacitor.config.ts`
- [X] T137 [P] Create privacy policy content in `docs/privacy-policy.md` covering data handling (read-only), caching strategy (7-day local storage), Supabase usage, no user tracking, compliance with mobile app store requirements
- [X] T138 [P] Complete comprehensive design system documentation in `docs/design-system.md`: Document all shared components (ArticleCard, PartCard, SkeletonLoader, SearchResult, SpecsTable), Ionic component usage patterns, theme customization guide, accessibility guidelines
- [X] T139 [P] Document manual testing rationale in `docs/testing-strategy.md`: Explain why manual testing chosen over automated tests per constitution principle (mobile-first PWA requires real device testing, accessibility validation needs VoiceOver/TalkBack, performance testing on actual 3G networks, cost/benefit analysis)
- [X] T121 [P] Configure CSP (Content Security Policy) headers in `src/index.html` for PWA security (restrict to Supabase domain, HTTPS images only)
- [X] T122 [P] Setup Lighthouse CI in `.github/workflows/lighthouse.yml` to enforce performance budgets (p95 <2s load time, accessibility score >90)
- [X] T123 [P] Create comprehensive user guide in `docs/user-guide.md` covering all features (browse, search, parts, filtering, offline)
- [X] T124 [P] Create developer setup guide in `docs/developer-setup.md` (enhanced from quickstart.md with troubleshooting, local Supabase setup)
- [X] T125 [P] Create architecture documentation in `docs/architecture.md` explaining system design, data flow, caching, offline strategy
- [X] T126 [P] Create ADR for Supabase backend in `docs/adr/002-supabase-backend.md` with decision rationale from research.md
- [X] T127 [P] Create ADR for client-side search in `docs/adr/003-client-side-search.md` explaining Fuse.js choice
- [X] T128 [P] Create ADR for IndexedDB caching in `docs/adr/004-indexeddb-caching.md` documenting 7-day TTL + LRU strategy
- [X] T129 Run full manual testing suite: Test all user stories on target devices (iPhone 8+, Android 2020+), test online/offline transitions, verify accessibility with VoiceOver/TalkBack
- [X] T130 Security audit: Verify RLS policies in Supabase prevent writes, confirm DOMPurify sanitizes markdown, check CSP headers block unsafe content, run `npm audit` for vulnerabilities
- [X] T131 Performance optimization pass: Analyze bundle size with webpack-bundle-analyzer, remove unused dependencies, optimize images to WebP format
- [X] T132 Code cleanup: Remove console.logs, add JSDoc comments to public APIs, ensure consistent code style with ESLint/Prettier
- [X] T133 [P] Setup Vercel production deployment: Connect GitHub repo, configure environment variables (Supabase URL/key), enable automatic deploys on main branch
- [X] T134 [P] Configure Capacitor for optional native builds: Test iOS build with Xcode, test Android build with Android Studio, verify deep linking works
- [X] T135 Final validation: Run through quickstart.md setup steps, verify all acceptance scenarios from spec.md pass, confirm constitution principles satisfied
- [X] T136 Create release documentation in `CHANGELOG.md`: Document v1.0.0 features, known limitations, future roadmap

**Checkpoint**: App is production-ready, fully documented, tested, and deployed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - US1 (P1): Independent after Foundational
  - US2 (P2): Independent after Foundational (integrates with US1 navigation)
  - US3 (P3): Independent after Foundational
  - US4 (P4): Depends on US1 (filters apply to articles)
  - US5 (P5): Depends on US1, US2, US3 (enhances existing features with offline)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - 🎯 MVP TARGET
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 navigation but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Completely independent from articles features
- **User Story 4 (P4)**: Requires US1 complete (applies filters to article browsing)
- **User Story 5 (P5)**: Requires US1, US2, US3 complete (adds offline capability to existing features)

### Recommended Execution Order

**MVP Path (Fastest to value)**:
1. Phase 1: Setup → Phase 2: Foundational → Phase 3: US1 → Deploy MVP
2. Phase 4: US2 → Deploy with search
3. Phase 5: US3 → Deploy with parts catalog
4. Phase 6: US4 → Deploy with filtering
5. Phase 7: US5 → Deploy with offline support
6. Phase 8: Polish → Production release

**Parallel Team Strategy** (3+ developers):
1. All: Complete Phase 1 + Phase 2 together
2. Split after Foundational:
   - Dev A: US1 (Browse Articles)
   - Dev B: US2 (Search) + US3 (Parts) in sequence
   - Dev C: Setup tasks for US4/US5, then implement after dependencies ready
3. Merge and test integration
4. All: Polish together

### Within Each User Story

- Implementation tasks before integration tasks
- Core functionality before edge case handling
- Manual testing after implementation complete
- Documentation updates alongside feature completion

### Parallel Opportunities

**Phase 1 (Setup)** - 7 tasks can run in parallel:
- T002, T003, T004, T005, T007, T008, T009, T010 (different files, no dependencies)

**Phase 2 (Foundational)** - 8 tasks can run in parallel:
- T014, T015, T016, T017 (model interfaces - different files)
- T025, T026, T027, T028 (configuration - different files)

**User Story 1** - 5 tasks can run in parallel initially:
- T029, T030, T031, T032, T033 (component creation - different files)

**User Story 2** - 2 tasks can run in parallel initially:
- T051, T052 (component creation - different files)

**User Story 3** - 4 tasks can run in parallel initially:
- T066, T067, T068, T069 (component creation - different files)

**User Story 4** - 2 tasks can run in parallel initially:
- T085, T086 (component and service - different files)

**User Story 5** - 2 tasks can run in parallel initially:
- T101, T102 (service and component - different files)

**Phase 8 (Polish)** - 12 tasks can run in parallel:
- T119, T120, T121, T122, T123, T124, T125, T126, T127, T128, T133, T134 (different files, independent documentation/config tasks)

---

## Parallel Example: User Story 1 (Browse Articles)

```bash
# Step 1: Launch all component creation tasks together (T029-T033)
Task: "Create HomePage in src/app/features/home/home.page.ts"
Task: "Create TopicsPage in src/app/features/topics/topics.page.ts"
Task: "Create ArticleListComponent in src/app/features/articles/article-list/article-list.component.ts"
Task: "Create ArticleDetailPage in src/app/features/articles/article-detail/article-detail.page.ts"
Task: "Create ArticleCardComponent in src/app/shared/components/article-card/article-card.component.ts"

# Step 2: Implement ArticlesService (T034) - requires no components
Task: "Implement ArticlesService in src/app/features/articles/articles.service.ts"

# Step 3: Integrate service with backend/cache (T035-T036) - can run together
Task: "Integrate ArticlesService with SupabaseService"
Task: "Integrate ArticlesService with CacheService"

# Step 4: Implement component logic (T037-T040) - sequential per component
Task: "Implement HomePage logic"
Task: "Implement TopicsPage logic"
Task: "Implement ArticleListComponent logic"
Task: "Implement ArticleDetailPage logic"

# Step 5: Polish (T041-T050) - some can run in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Goal**: Ship working article browsing app as fast as possible

1. ✅ Complete Phase 1: Setup (10 tasks)
2. ✅ Complete Phase 2: Foundational (18 tasks) - CRITICAL BLOCKER
3. ✅ Complete Phase 3: User Story 1 (22 tasks)
4. **STOP and VALIDATE**: Manual test all US1 acceptance scenarios from spec.md
5. **Deploy to Vercel** as MVP if validation passes
6. **Demo/User Feedback** before building more features

**MVP Delivers**:
- Browse featured and latest articles
- Navigate by topic (Computer/Network/Software)
- Read articles with markdown rendering
- Related articles for discovery
- Offline caching of viewed articles
- Accessible, performant, mobile-first experience

**MVP Does NOT Include** (can add later):
- Global search (US2)
- Parts catalog (US3)
- Advanced filtering (US4)
- Full offline optimization (US5)

### Incremental Delivery (Recommended)

**Iteration 1: MVP (US1)**
- Tasks: T001-T050
- Deliverable: Article browsing app
- Timeline: ~2-3 weeks solo developer
- Validation: Manual testing per spec.md acceptance scenarios

**Iteration 2: Add Search (US2)**
- Tasks: T051-T065
- Deliverable: Article browsing + search
- Timeline: ~1 week
- Validation: Search <1s, works offline, accessible

**Iteration 3: Add Parts Catalog (US3)**
- Tasks: T066-T084
- Deliverable: Articles + Search + Parts
- Timeline: ~1-2 weeks
- Validation: Parts grid loads <2s, specs display correctly

**Iteration 4: Add Filtering (US4)**
- Tasks: T085-T100
- Deliverable: Full content discovery
- Timeline: ~1 week
- Validation: Filters <500ms, persist during session

**Iteration 5: Optimize Offline (US5)**
- Tasks: T101-T118
- Deliverable: Robust offline experience
- Timeline: ~1 week
- Validation: Works offline 7 days, clear staleness indicators

**Iteration 6: Polish & Release (Phase 8)**
- Tasks: T119-T136
- Deliverable: Production v1.0.0
- Timeline: ~1 week
- Validation: Full constitution check, security audit, performance benchmarks

### Parallel Team Strategy (3 Developers)

**Week 1-2: Foundation** (All together)
- Phase 1: Setup (1-2 days)
- Phase 2: Foundational (3-5 days)
- **Checkpoint**: Core services working, models defined

**Week 3-4: Parallel User Stories**
- Developer A: US1 Browse Articles (T029-T050)
- Developer B: US2 Search (T051-T065) + US3 Parts (T066-T084)
- Developer C: Infrastructure for US4/US5, documentation setup
- **Checkpoint**: 3 user stories independently functional

**Week 5: Integration & Dependencies**
- All: US4 Filtering (T085-T100) - depends on US1
- All: US5 Offline (T101-T118) - depends on US1/US2/US3
- **Checkpoint**: All 5 user stories integrated and working

**Week 6: Polish & Release**
- All: Phase 8 Polish (T119-T136)
- Manual testing on target devices
- Security & performance audits
- Deploy to production

---

## Task Summary

**Total Tasks**: 139

**By Phase**:
- Phase 1 (Setup): 10 tasks
- Phase 2 (Foundational): 18 tasks
- Phase 3 (US1 - Browse Articles): 22 tasks
- Phase 4 (US2 - Search): 15 tasks
- Phase 5 (US3 - Parts Catalog): 19 tasks
- Phase 6 (US4 - Filtering): 16 tasks
- Phase 7 (US5 - Offline): 18 tasks
- Phase 8 (Polish): 21 tasks (added T137-T139)

**By User Story**:
- User Story 1 (P1): 22 tasks - 🎯 MVP
- User Story 2 (P2): 15 tasks
- User Story 3 (P3): 19 tasks
- User Story 4 (P4): 16 tasks
- User Story 5 (P5): 18 tasks
- Infrastructure (Setup + Foundational): 28 tasks
- Cross-cutting (Polish): 21 tasks

**Parallel Opportunities**: 37 tasks marked [P] can run in parallel with other tasks in their phase

**Independent Test Criteria**:
- ✅ US1: Load app → Browse topics → Read article → Verify markdown renders
- ✅ US2: Search "network" → Results <1s → Tap result → Detail opens
- ✅ US3: View parts grid → Tap part → Specs table displays
- ✅ US4: Apply topic filter → Result count updates → Clear filters → All articles return
- ✅ US5: View content → Go offline → Cached content loads → Online → Refresh works

**Suggested MVP Scope**: Complete through T050 (User Story 1 only) for fastest value delivery

---

## Format Validation

✅ All 139 tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ Task IDs sequential (T001-T139) in execution order
✅ [P] markers on parallelizable tasks (34 total)
✅ [Story] labels on user story tasks (US1-US5)
✅ File paths included in all implementation task descriptions
✅ Dependencies clearly documented
✅ Parallel opportunities identified per phase
✅ Independent test criteria defined for each user story

---

## Notes

- **No automated tests**: Per project constitution, manual testing only with Lighthouse CI for performance
- **Testing approach**: Manual validation of acceptance scenarios from spec.md on target devices (iPhone 8+, Android 2020+)
- **Accessibility validation**: Manual keyboard navigation, VoiceOver/TalkBack testing, WCAG AA contrast checks
- **Performance validation**: Lighthouse CI enforcing budgets, manual testing on 3G throttle
- **Security validation**: Manual verification of RLS policies, DOMPurify sanitization, CSP headers
- **Documentation**: Inline JSDoc for public APIs, comprehensive user guide, ADRs for major decisions
- **Deployment**: Vercel for PWA, optional Capacitor native builds for iOS/Android app stores
- **Commit strategy**: Commit after each task or logical group to enable rollback
- **Checkpoints**: Validate each user story independently before proceeding to next priority
