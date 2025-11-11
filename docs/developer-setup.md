# Developer Setup Guide

**Project**: ICT Wiki Mobile App  
**Last Updated**: 2025-11-10

## Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Ionic CLI**: `npm install -g @ionic/cli`
- **Git**: For version control
- **Supabase Account**: https://supabase.com (free tier sufficient)

## Initial Setup

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
- Ionic 8.x + Angular 18.x
- Supabase JS client
- Dexie.js (IndexedDB)
- Fuse.js (search)
- marked.js + DOMPurify (markdown)
- Development tools (ESLint, Prettier)

### 3. Supabase Database Setup

#### Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details:
   - **Name**: `ict-wiki-app`
   - **Database Password**: (save securely)
   - **Region**: Choose closest to your target users (e.g., `us-east-1`)
4. Wait for project provisioning (~2 minutes)

#### Execute Database Migration

1. Navigate to your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy entire contents of `specs/001-ict-wiki-app/contracts/supabase-schema.sql`
5. Paste into SQL editor
6. Click **"Run"**
7. Verify success message: `"Migration successful: All 6 tables created"`

#### Verify Tables

In **Table Editor**, confirm these tables exist:
- ✅ `topics` (3 seed rows: Computer, Network, Software)
- ✅ `articles`
- ✅ `tags`
- ✅ `article_tags`
- ✅ `related_articles`
- ✅ `computer_parts`

#### Check RLS Policies

1. Go to **Authentication** → **Policies**
2. Each table should have **read-only policy** enabled:
   - Policy name: "Enable read access for all users"
   - Allowed operation: `SELECT` only
   - Target roles: `anon`, `authenticated`

### 4. Environment Configuration

#### Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon/public key**: Long JWT token (starts with `eyJ...`)

#### Create Environment File

Create `.env` in project root:

```bash
# Supabase Configuration
SUPABASE_URL="https://ldymwxewqimxqnzmvblo.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
```

**Security Note**: The anon key is safe to expose in client-side code because:
- RLS policies enforce read-only access
- No authentication required for public data
- No write operations allowed

#### Update Environment Files

The credentials are already configured in:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

If you need to change them, update both files with your actual values.

### 5. Verify Setup

Run the verification script:

```bash
npx tsx verify-supabase.ts
```

Expected output:
```
✅ OK topics               (3 rows)
✅ OK articles             (0 rows)
✅ OK tags                 (0 rows)
✅ OK article_tags         (0 rows)
✅ OK related_articles     (0 rows)
✅ OK computer_parts       (0 rows)

✅ SUCCESS: All 6 tables verified!
✅ RLS policies working (read access granted)
```

## Development

### Run Development Server

```bash
ionic serve
```

- Opens browser at `http://localhost:8100`
- Live reload enabled
- Ionic DevApp compatible

### Build for Production

```bash
npm run build --configuration=production
```

Output: `www/` directory

### Run on Mobile (Optional)

#### iOS (macOS only)

```bash
ionic capacitor add ios
ionic capacitor run ios
```

Requires:
- Xcode 14+
- iOS Simulator or physical device
- Apple Developer account (for device testing)

#### Android

```bash
ionic capacitor add android
ionic capacitor run android
```

Requires:
- Android Studio
- Android SDK 21+ (Lollipop)
- Android device or emulator

### Code Quality

#### Linting

```bash
npm run lint
```

#### Format Code

```bash
npx prettier --write "src/**/*.{ts,html,scss}"
```

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # TypeScript interfaces
│   │   │   ├── article.model.ts
│   │   │   ├── topic.model.ts
│   │   │   ├── tag.model.ts
│   │   │   ├── computer-part.model.ts
│   │   │   └── search-result.model.ts
│   │   └── services/        # Singleton services
│   │       ├── supabase.service.ts
│   │       ├── cache.service.ts
│   │       └── search.service.ts
│   ├── features/            # Feature modules (lazy-loaded)
│   │   ├── home/
│   │   ├── topics/
│   │   ├── parts/
│   │   └── search/
│   ├── shared/              # Shared components/pipes
│   │   ├── components/
│   │   │   └── skeleton-loader/
│   │   └── pipes/
│   │       └── markdown.pipe.ts
│   ├── tabs/                # Tab navigation shell
│   ├── app.component.ts
│   └── app.routes.ts
├── environments/
│   ├── environment.ts       # Development config
│   └── environment.prod.ts  # Production config
└── theme/
    └── variables.scss       # Design tokens
```

## Configuration Files

### Design System

- **Theme tokens**: `src/theme/variables.scss`
- **Documentation**: `docs/design-system.md`
- **WCAG AA**: 4.5:1 contrast ratios, ≥44px touch targets

### Caching

- **Strategy**: IndexedDB via Dexie.js
- **TTL**: 7 days (configurable in `environment.ts`)
- **Eviction**: LRU (Least Recently Used)
- **Quota**: 50MB max

### Search

- **Engine**: Fuse.js
- **Threshold**: 0.35 (fuzzy matching)
- **Performance**: <1s for ~500 items

## Troubleshooting

### "Could not find table in schema cache"

**Cause**: Supabase schema cache not refreshed  
**Fix**: Wait 30 seconds or restart Supabase project in dashboard

### "Quota exceeded" error

**Cause**: IndexedDB storage limit reached  
**Fix**: Clear cache in browser DevTools → Application → IndexedDB → Delete `ICTWikiCache`

### Service worker not updating

**Cause**: Aggressive browser caching  
**Fix**: 
1. Open DevTools → Application → Service Workers
2. Check "Update on reload"
3. Unregister service worker
4. Hard refresh (Ctrl+Shift+R)

### Capacitor build fails

**Cause**: Missing native dependencies  
**Fix**:
```bash
npx cap sync
```

## Deployment

### Vercel (PWA)

1. Push to GitHub
2. Import repository in Vercel dashboard
3. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Deploy

Build settings (already in `vercel.json`):
- **Build Command**: `npm run build --configuration=production`
- **Output Directory**: `www`

### iOS App Store (Optional)

1. Build with Capacitor: `ionic capacitor build ios --prod`
2. Open Xcode project
3. Configure signing & capabilities
4. Archive and upload to App Store Connect

### Google Play Store (Optional)

1. Build with Capacitor: `ionic capacitor build android --prod`
2. Open Android Studio
3. Generate signed APK/AAB
4. Upload to Google Play Console

## Additional Resources

- **Ionic Framework**: https://ionicframework.com/docs
- **Angular**: https://angular.dev
- **Supabase**: https://supabase.com/docs
- **Capacitor**: https://capacitorjs.com/docs
- **Design System**: `docs/design-system.md`
- **Architecture Decisions**: `docs/adr/` (to be created)

## Support

For issues or questions:
1. Check `docs/` directory for additional documentation
2. Review open issues on GitHub
3. Create new issue with:
   - Environment details (OS, Node version, npm version)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

---

**Happy coding!** 🚀
