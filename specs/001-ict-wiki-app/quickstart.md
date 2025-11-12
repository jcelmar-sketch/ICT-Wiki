# ICT Wiki Mobile App - Developer Quickstart

**Feature**: ICT Wiki Mobile App  
**Branch**: `001-ict-wiki-app`  
**Last Updated**: 2025-11-10

## Overview

This guide helps developers set up the ICT Wiki mobile PWA development environment, run the app locally, and understand the project structure. Complete setup time: ~30 minutes.

## Prerequisites

Before starting, ensure you have:

- **Node.js**: v18.x or v20.x LTS ([download](https://nodejs.org/))
- **npm**: v9.x or higher (included with Node.js)
- **Git**: Latest version ([download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([download](https://code.visualstudio.com/))
- **Supabase Account**: Free tier ([sign up](https://supabase.com/))

### Optional (for native builds)
- **Android Studio** (for Android builds)
- **Xcode** (for iOS builds, macOS only)

---

## Quick Setup (5 Minutes)

### 1. Clone Repository

```bash
git clone https://github.com/lowmax205/ICT-Wiki.git
cd ICT-Wiki
git checkout 001-ict-wiki-app
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Ionic CLI and Framework
- Angular core and common packages
- Capacitor for native features
- Supabase JS client
- Development tools (TypeScript, ESLint, Prettier)

### 3. Environment Configuration

Create environment files from templates:

```bash
# Development environment
cp src/environments/environment.template.ts src/environments/environment.ts

# Production environment (optional for local dev)
cp src/environments/environment.template.ts src/environments/environment.prod.ts
```

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_PROJECT_URL',      // e.g., https://abc123.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY'      // Public anon key (safe to expose)
  },
  cacheExpiryDays: 7,
  searchResultLimit: 50,
  articlesPerPage: 20,
  partsPerPage: 20
};
```

**Where to find Supabase credentials**:
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Click "Settings" → "API"
4. Copy "Project URL" and "anon public" key

### 4. Start Development Server

```bash
npm start
```

Or using Ionic CLI directly:

```bash
ionic serve
```

App opens at `http://localhost:8100` with live reload enabled.

---

## Supabase Setup (10 Minutes)

### Create Supabase Project

1. **Sign in** to [Supabase Dashboard](https://app.supabase.com/)
2. **Create new project**:
   - Organization: Select or create
   - Project name: `ict-wiki` (or your choice)
   - Database password: Generate strong password (save it!)
   - Region: Choose closest to your location
   - Pricing: Free tier is sufficient

3. **Wait for provisioning** (~2 minutes)

### Run Database Migration

Once project is ready:

1. **Open SQL Editor** in Supabase dashboard (left sidebar)
2. **Create new query**
3. **Paste contents** of `specs/001-ict-wiki-app/contracts/supabase-schema.sql`
4. **Run query** (click "Run" or Ctrl+Enter)

You should see success message: "Migration successful: All 6 tables created"

### Verify Setup

Check that tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- `articles`
- `article_tags`
- `computer_parts`
- `related_articles`
- `tags`
- `topics`

### Seed Sample Data (Optional)

Add test data to verify app functionality:

```sql
-- Sample article
INSERT INTO articles (title, slug, content, excerpt, cover_image, topic_id, published_at, is_featured)
VALUES (
  'Introduction to Computer Networks',
  'introduction-to-computer-networks',
  '# Computer Networks\n\nComputer networks connect devices to share resources and communicate...',
  'Learn the fundamentals of how computers connect and communicate.',
  'https://via.placeholder.com/800x400?text=Networks',
  (SELECT id FROM topics WHERE slug = 'network'),
  NOW(),
  true
);

-- Sample tag
INSERT INTO tags (name, slug) VALUES ('networking', 'networking');

-- Link article to tag
INSERT INTO article_tags (article_id, tag_id)
VALUES (
  (SELECT id FROM articles WHERE slug = 'introduction-to-computer-networks'),
  (SELECT id FROM tags WHERE slug = 'networking')
);

-- Sample computer part
INSERT INTO computer_parts (name, slug, category, description, image, specs_json, manufacturer)
VALUES (
  'Intel Core i9-13900K',
  'intel-core-i9-13900k',
  'cpu',
  'High-performance 24-core desktop processor with hybrid architecture for gaming and content creation',
  'https://via.placeholder.com/400x400?text=i9-13900K',
  '{
    "cores": 24,
    "threads": 32,
    "base_clock": "3.0 GHz",
    "boost_clock": "5.8 GHz",
    "socket": "LGA1700",
    "tdp": "125W",
    "cache": "36MB L3",
    "integrated_graphics": "Intel UHD Graphics 770"
  }'::jsonb,
  'Intel'
);
```

---

## Development Workflow

### Running the App

**Development server** (with hot reload):
```bash
npm start
# or
ionic serve
```

**Production build** (optimized):
```bash
npm run build
# or
ionic build --prod
```

**Serve production build locally**:
```bash
npx http-server www/ -p 8080
```

### Code Quality

**Lint TypeScript**:
```bash
npm run lint
```

**Format code** (Prettier):
```bash
npm run format
```

**Type checking**:
```bash
npm run type-check
# or
tsc --noEmit
```

### Performance Monitoring

**Lighthouse CI** (performance audit):
```bash
npm run lighthouse
```

**Bundle analysis**:
```bash
npm run build:stats
npx webpack-bundle-analyzer dist/stats.json
```

---

## Project Structure

```
ict-wiki-app/
├── src/                              # Source code
│   ├── app/
│   │   ├── core/                     # Singleton services and models
│   │   │   ├── services/             # SupabaseService, CacheService, SearchService
│   │   │   └── models/               # TypeScript interfaces (Article, Part, etc.)
│   │   ├── features/                 # Feature modules (lazy-loaded)
│   │   │   ├── home/                 # Home page (featured + latest)
│   │   │   ├── articles/             # Article list and detail
│   │   │   ├── parts/                # Parts grid and detail
│   │   │   ├── topics/               # Topics navigation
│   │   │   └── search/               # Global search
│   │   ├── shared/                   # Reusable components/pipes
│   │   │   ├── components/           # ArticleCard, PartCard, SkeletonLoader
│   │   │   └── pipes/                # MarkdownPipe, SafeHtmlPipe
│   │   └── app.component.ts          # Root component
│   ├── assets/                       # Static assets
│   ├── theme/                        # Ionic design tokens
│   ├── environments/                 # Environment configs
│   └── index.html                    # App entry point
├── docs/                             # Documentation
│   ├── user-guide.md                 # End-user documentation
│   ├── developer-setup.md            # This file
│   ├── architecture.md               # System architecture
│   └── adr/                          # Architecture Decision Records
├── specs/001-ict-wiki-app/           # Feature spec and planning docs
├── ionic.config.json                 # Ionic CLI config
├── capacitor.config.ts               # Capacitor config (native builds)
├── angular.json                      # Angular CLI config
├── package.json                      # npm dependencies
└── tsconfig.json                     # TypeScript config
```

### Key Files to Know

- **`src/app/core/services/supabase.service.ts`**: Supabase client wrapper, data fetching
- **`src/app/core/services/cache.service.ts`**: IndexedDB caching with Dexie.js
- **`src/app/core/services/search.service.ts`**: Fuse.js client-side search
- **`src/app/app.routes.ts`**: Application routing configuration
- **`src/theme/variables.scss`**: Ionic design tokens (colors, spacing, fonts)

## Common Tasks

### Adding a New Feature

1. **Generate feature module**:
```bash
ionic generate page features/my-feature
```

2. **Add route** in `src/app/app.routes.ts`:
```typescript
{
  path: 'my-feature',
  loadComponent: () => import('./features/my-feature/my-feature.page').then(m => m.MyFeaturePage)
}
```

3. **Create service** (if needed):
```bash
ionic generate service features/my-feature/my-feature
```

### Creating a Shared Component

```bash
ionic generate component shared/components/my-component
```

Component auto-registers in `shared/` directory for reuse.

### Adding a New Ionic Icon

1. Browse icons: [Ionic Icons](https://ionic.io/ionicons)
2. Import in component:
```typescript
import { addIcons } from 'ionicons';
import { heartOutline, heart } from 'ionicons/icons';

addIcons({ 'heart-outline': heartOutline, heart });
```

3. Use in template:
```html
<ion-icon name="heart-outline"></ion-icon>
```

### Debugging Supabase Queries

Enable query logging:

```typescript
// In supabase.service.ts constructor
this.supabase = createClient(url, anonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  },
  global: {
    headers: { 'x-client-info': 'ict-wiki-app' }
  }
});

// Add logging
this.supabase.from('articles').select('*').then(res => {
  console.log('Query result:', res);
});
```

Check queries in Supabase Dashboard → Logs → API Logs

### Clearing IndexedDB Cache

**Programmatically**:
```typescript
import { db } from '@core/services/cache.service';

await db.delete(); // Delete entire database
await db.articles.clear(); // Clear articles table only
```

**Manually** (Chrome DevTools):
1. Open DevTools (F12)
2. Application tab → Storage → IndexedDB
3. Right-click `ICTWikiDB` → Delete database

---

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

**Solution**: Re-install dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### App not loading / blank screen

**Check**:
1. Browser console for errors (F12)
2. Environment variables are set correctly
3. Supabase project is running (not paused on free tier)

**Solution**:
```bash
# Clear cache and rebuild
rm -rf .angular www
npm start
```

### Supabase RLS errors (403 Forbidden)

**Cause**: Row Level Security policies blocking query

**Solution**:
1. Verify RLS policies exist:
```sql
SELECT * FROM pg_policies WHERE tablename = 'articles';
```

2. Check policy allows SELECT:
```sql
SELECT * FROM articles; -- Should return data
```

3. Ensure using anon key (not service role key in environment.ts)

### Slow search performance

**Check**:
1. Search index size: `localStorage.getItem('searchIndex').length`
2. Number of items: Should be <1000 for client-side search

**Solution**: If >1000 items, migrate to Supabase full-text search

### Mobile-specific issues

**Test on device**:
```bash
# Android
ionic capacitor run android -l

# iOS
ionic capacitor run ios -l
```

**Common fixes**:
- Clear app data: Settings → Apps → ICT Wiki → Clear Data
- Check CORS if API requests fail: Add domain to Supabase → Settings → API → CORS

---

## CI/CD Integration

### GitHub Actions (Example)

Create `.github/workflows/build.yml`:

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

### Vercel Deploy

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "www",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Connect repo in Vercel dashboard, add environment variables, deploy!

---

## Next Steps

1. ✅ Complete local setup
2. ⏭️ Read [Architecture Documentation](./architecture.md)
3. ⏭️ Review [User Guide](./user-guide.md)
4. ⏭️ Check [ADRs](./adr/) for technical decisions
5. ⏭️ Start implementing user stories (see `/specs/001-ict-wiki-app/tasks.md` when created)

## Resources

- **Ionic Docs**: https://ionicframework.com/docs
- **Angular Docs**: https://angular.io/docs
- **Supabase Docs**: https://supabase.com/docs
- **Capacitor Docs**: https://capacitorjs.com/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs

## Getting Help

- **Project Issues**: https://github.com/lowmax205/ICT-Wiki/issues
- **Ionic Forum**: https://forum.ionicframework.com/
- **Supabase Discord**: https://discord.supabase.com/

---

**Happy coding! 🚀**
