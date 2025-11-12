# Research: ICT Wiki Mobile App

**Feature**: ICT Wiki Mobile App  
**Branch**: `001-ict-wiki-app`  
**Date**: 2025-11-10  
**Phase**: 0 - Technology Research & Architecture Decisions

## Overview

This document captures research findings and architectural decisions for the ICT Wiki mobile-first progressive web application. Research focused on selecting appropriate technologies for a read-only, offline-capable educational app with strong accessibility and performance requirements.

## Key Technology Decisions

### 1. Mobile Framework: Ionic 8 + Angular 18

**Decision**: Use Ionic Framework with Angular standalone components

**Rationale**:
- Ionic provides battle-tested mobile UI components optimized for touch interactions (≥44px targets by default)
- Built-in accessibility features (ARIA labels, keyboard navigation, screen reader support)
- Angular's reactive patterns (RxJS) naturally handle async data loading and caching
- Ionic's PWA toolkit simplifies offline-first architecture with service worker generation
- Capacitor enables optional native builds without code changes if PWA limitations discovered
- Strong TypeScript support aligns with code quality principles
- Large community and extensive documentation reduce risk

**Alternatives Considered**:
- **React + Ionic**: Considered but Angular's opinionated structure better supports large-scale maintainability principle
- **Flutter**: Better performance but steeper learning curve and less web-native (PWA secondary)
- **React Native**: Strong mobile support but weaker PWA story and no web-first design

**Best Practices**:
- Use Angular standalone components (reduce bundle size, improve tree-shaking)
- Lazy load feature modules to meet performance budgets
- Implement OnPush change detection for list components (article/parts grids)
- Use Ionic's built-in theming system for consistent design tokens
- Follow Angular style guide for file organization and naming

---

### 2. Backend & Data Access: Supabase

**Decision**: Use Supabase (PostgreSQL + REST API) for backend data storage and access

**Rationale**:
- Managed PostgreSQL eliminates operational complexity
- Row Level Security (RLS) enforces read-only access at database level (security principle)
- Auto-generated REST API reduces backend code footprint
- Real-time subscriptions available if needed for future admin features
- Built-in full-text search capabilities for article/parts search
- Free tier sufficient for educational project scale (~500 articles + parts)
- Supabase JS client has excellent TypeScript definitions

**Alternatives Considered**:
- **Firebase**: Strong offline support but vendor lock-in concerns and less SQL-native
- **Custom REST API**: More control but violates simplicity principle (unnecessary backend code)
- **Static JSON files**: Simple but lacks search capabilities and scales poorly

**Best Practices**:
- Configure RLS policies to enforce read-only access (no INSERT/UPDATE/DELETE)
- Use Supabase client `.select()` with specific column lists (reduce payload size)
- Implement response caching with stale-while-revalidate pattern
- Index full-text search columns (article title, content, part descriptions)
- Use Supabase edge functions only if complex server-side logic needed (avoid initially)

**Security Notes**:
- Supabase anonymous key is safe to expose (RLS enforces permissions)
- API URL stored in environment variables, never hardcoded
- CSP headers restrict data loading to Supabase domain only

---

### 3. Offline Storage: IndexedDB via Dexie.js

**Decision**: Use Dexie.js wrapper around IndexedDB for offline caching

**Rationale**:
- IndexedDB provides structured storage (unlike localStorage's 5MB string limit)
- Dexie.js simplifies IndexedDB's callback-based API with promises
- Supports complex queries needed for filtering cached content
- Can store markdown content, images (as blobs), and metadata
- Works reliably across iOS Safari and Android Chrome
- Integrates well with Angular services via observables

**Alternatives Considered**:
- **LocalStorage**: Too limited (5MB, string-only, no async)
- **Raw IndexedDB**: Verbose callback API harder to maintain
- **PouchDB**: Over-engineered for read-only caching use case

**Best Practices**:
- Cache articles/parts on first view (LRU eviction when storage full)
- Store timestamps for cache invalidation (7-day expiry per spec)
- Separate databases for articles vs parts (clearer data management)
- Use Dexie's `.bulkPut()` for efficient batch caching
- Implement cache warming: pre-cache featured content on app load

**Caching Strategy**:
```
1. On app load: Check IndexedDB for cached content
2. Display cached content immediately (fast initial render)
3. Fetch fresh data from Supabase in background
4. Update cache + UI if changes detected
5. On offline: Serve only cached content with staleness indicator
```

---

### 4. Markdown Rendering: marked.js + DOMPurify

**Decision**: Use marked.js for markdown parsing with DOMPurify for sanitization

**Rationale**:
- marked.js is lightweight (20KB gzipped), fast, and widely adopted
- Supports GitHub Flavored Markdown (tables, task lists, strikethrough)
- Extensible via custom renderers (can add image lazy loading)
- DOMPurify prevents XSS attacks from malicious markdown content
- Both libraries actively maintained and security-audited

**Alternatives Considered**:
- **markdown-it**: More features but heavier bundle size
- **showdown**: Older, less performant, fewer GFM features
- **remark/rehype**: Powerful but complex plugin system overkill for simple rendering

**Best Practices**:
- Sanitize HTML output with DOMPurify before rendering
- Configure marked for GFM (tables for parts specs if needed in articles)
- Add custom renderer for images: lazy loading + responsive srcset
- Cache rendered HTML in IndexedDB (avoid re-parsing on every view)
- Use Web Workers for large markdown files (>50KB) to avoid UI blocking

**Security**:
- Always run DOMPurify after marked.js parsing
- Whitelist allowed HTML tags (no `<script>`, `<iframe>`, `<object>`)
- Strip event handlers from rendered HTML

---

### 5. Search Implementation: Client-Side with Fuse.js

**Decision**: Client-side fuzzy search using Fuse.js library

**Rationale**:
- Meets <1 second search requirement for expected content scale (~500 items)
- No backend infrastructure needed (aligns with simplicity)
- Works offline automatically (searches cached data)
- Supports typo tolerance and relevance scoring
- Lightweight (12KB gzipped)
- Supabase full-text search available as fallback if scale grows

**Alternatives Considered**:
- **Supabase full-text search**: Requires network, doesn't work offline
- **Lunr.js**: Similar to Fuse but harder to configure and less maintained
- **Algolia**: Excellent but overkill and costly for read-only educational app

**Best Practices**:
- Index on app load: article titles, content snippets, tags, part names, descriptions
- Configure Fuse.js threshold for fuzzy matching (0.3-0.4 for balanced results)
- Debounce search input (300ms) to reduce re-indexing overhead
- Return max 50 results, rank by relevance score
- Highlight matched terms in results UI

**Performance Optimization**:
- Build search index once on data fetch, cache in memory
- Re-index only when data updates (detected via timestamp comparison)
- Use Web Worker for indexing large datasets (if >1000 items in future)

---

### 6. Performance Optimization Strategies

**Bundle Size Optimization**:
- Code splitting by route (lazy load feature modules)
- Tree-shake unused Ionic components
- Use Angular standalone components (smaller bundles)
- Purge unused CSS with PurgeCSS
- Compress assets with Brotli

**Runtime Performance**:
- Virtual scrolling for article/parts lists (Ionic's ion-virtual-scroll)
- Image lazy loading with Intersection Observer
- Skeleton loaders for perceived performance
- Service worker precaching for app shell
- OnPush change detection for list items

**Network Optimization**:
- Compress API responses (Supabase supports gzip)
- Request only needed columns with `.select('id,title,cover_image')`
- Implement pagination (20 items per page for infinite scroll)
- Prefetch next page while user views current page
- Cache API responses with 5-minute TTL

---

### 7. Accessibility Implementation Plan

**Keyboard Navigation**:
- All interactive elements reachable via tab
- Skip navigation link to main content
- Focus indicators meet WCAG AA (3:1 contrast minimum)
- Escape key closes modals/search overlays
- Arrow keys navigate lists where appropriate

**Screen Reader Support**:
- Semantic HTML5 elements (`<article>`, `<nav>`, `<main>`)
- ARIA labels for icon-only buttons
- Live regions announce search results count, loading states
- Image alt text from article metadata or descriptive fallback
- Role attributes for custom components

**Visual Accessibility**:
- Color contrast ≥4.5:1 for text (enforced in design tokens)
- Touch targets ≥44px (Ionic default, verified in tests)
- Responsive font sizes (min 16px, scale with system preferences)
- Focus indicators visible in all states
- No reliance on color alone for information

**Testing Process**:
1. Manual keyboard test on every new screen
2. VoiceOver/TalkBack spot checks on key flows
3. Color contrast validation in design review
4. Touch target size verification during development

---

### 8. Deployment & Hosting

**Decision**: Vercel for PWA hosting, optional Capacitor native builds

**Rationale**:
- Vercel provides free PWA hosting with HTTPS, edge CDN, automatic deploys
- Built-in preview deployments for PR reviews
- Excellent Angular support with zero-config deployment
- Service worker support and environment variable management
- Lighthouse CI integration available
- Can deploy to app stores later via Capacitor without architecture changes

**Alternatives Considered**:
- **Netlify**: Similar features, good choice but Vercel has better Angular DX
- **Firebase Hosting**: Good but couples with Firebase ecosystem
- **GitHub Pages**: Free but limited build/deploy automation

**Deployment Strategy**:
1. Development: Local Ionic serve with hot reload
2. Staging: Vercel preview deploy on PR creation
3. Production: Vercel production deploy on merge to main
4. Native: Future Capacitor builds distributed via TestFlight/Play Console

---

## Architecture Decision Records (ADRs)

Full ADRs created in `/docs/adr/`:

1. **ADR-001: Ionic + Angular for Mobile PWA** - Framework selection
2. **ADR-002: Supabase for Backend** - Data storage and access
3. **ADR-003: Client-Side Search** - Search implementation approach
4. **ADR-004: IndexedDB Caching Strategy** - Offline storage design

---

## Open Questions & Future Considerations

### Resolved in This Phase
✅ Mobile framework selection  
✅ Backend/database choice  
✅ Offline caching approach  
✅ Search implementation  
✅ Testing strategy  
✅ Accessibility plan  

### Deferred to Implementation
- Exact cache eviction strategy (LRU vs FIFO vs custom scoring)
- Image optimization pipeline (responsive images, WebP format)
- Analytics integration (privacy-respecting option needed)
- Content update notifications (push notifications if native builds)
- Internationalization (if needed for non-English content)

### Monitoring Post-Launch
- Actual cache hit rates in production
- Real-world performance metrics (Core Web Vitals)
- Accessibility issues reported by users
- Bundle size growth over time
- Search result relevance quality

---

## Dependencies & Risks

### Technical Dependencies
| Dependency | Version | Risk Level | Mitigation |
|------------|---------|------------|------------|
| Ionic | 8.x | Low | Stable, LTS support, large community |
| Angular | 18.x | Low | Active development, strong backward compatibility |
| Supabase | Latest | Medium | Managed service but third-party dependency, can migrate to self-hosted PostgreSQL if needed |
| Dexie.js | 4.x | Low | Thin wrapper over standard IndexedDB API, easy to replace |
| marked.js | 12.x | Low | Standard markdown library, multiple alternatives available |
### Security Risks
- **User-generated content**: Not applicable (read-only, admin-created content)
- **API key exposure**: Supabase anonymous key safe due to RLS policies
- **XSS via markdown**: Mitigated with DOMPurify sanitization
- **Dependency vulnerabilities**: Automated scanning with npm audit, Dependabot

### Performance Risks
- **Search slowdown with scale**: Client-side search may degrade at >1000 items → migrate to Supabase FTS
- **Cache bloat**: IndexedDB can fill device storage → implement aggressive eviction
- **Markdown rendering blocking**: Large articles may block UI → use Web Workers

---

## Next Steps (Phase 1)

1. ✅ Complete research.md (this document)
2. ⏭️ Create data-model.md defining entities and schemas
3. ⏭️ Generate API contracts (Supabase table schemas + RLS policies)
4. ⏭️ Write quickstart.md for developer onboarding
5. ⏭️ Update agent context files with technology stack
6. ⏭️ Re-run Constitution Check after design phase
