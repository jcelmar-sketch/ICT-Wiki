# Database Setup Instructions

## Step 1: Run Schema Migration

1. Go to your Supabase project dashboard: https://app.supabase.com/
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire content from `supabase-schema.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute the migration
7. Verify output shows "Migration successful: All 6 tables created"

## Step 2: Create Storage Buckets

### Create 'articles' bucket:
1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `articles`
4. Public bucket: **Yes** (enable public access)
5. Click **Create bucket**

### Create 'parts' bucket:
1. Click **New bucket**
2. Name: `parts`
3. Public bucket: **Yes** (enable public access)
4. Click **Create bucket**

### Set up bucket policies:
For both buckets, add a policy for public read access:
1. Click on the bucket name
2. Go to **Policies** tab
3. Click **New policy**
4. Select **Get objects** (for SELECT operations)
5. Policy name: `Public read access`
6. Policy definition:
```sql
(true)
```
7. Click **Review** then **Save policy**

## Step 3: Seed Sample Data

1. Go back to **SQL Editor**
2. Create a new query
3. Copy the entire content from `scripts/seed-database.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute
6. Verify output shows:
   - X articles
   - X computer parts
   - X tags

## Step 4: Upload Sample Images (Optional)

Since we're using placeholder image paths, you have two options:

### Option A: Use placeholder service
The sample data uses paths like `articles/cpu-architecture-cover.jpg`. These will need actual images.

You can temporarily use a placeholder service by updating image URLs in the database:
```sql
-- Update article cover images to use placeholders
UPDATE articles 
SET cover_image = 'https://placehold.co/800x400/1e293b/94a3b8?text=' || REPLACE(title, ' ', '+')
WHERE cover_image IS NOT NULL;

-- Update part images to use placeholders
UPDATE computer_parts 
SET image = 'https://placehold.co/600x400/1e293b/94a3b8?text=' || REPLACE(name, ' ', '+')
WHERE image IS NOT NULL;
```

### Option B: Upload actual images
1. Find appropriate images for each article/part
2. Go to **Storage** > **articles** bucket
3. Upload images with matching filenames (e.g., `cpu-architecture-cover.jpg`)
4. Repeat for **parts** bucket
5. The app will automatically use the Supabase Storage URLs

## Step 5: Verify Setup

Run this query to verify everything is working:
```sql
-- Check tables exist and have data
SELECT 'topics' as table_name, COUNT(*) as count FROM topics
UNION ALL
SELECT 'articles', COUNT(*) FROM articles
UNION ALL
SELECT 'tags', COUNT(*) FROM tags
UNION ALL
SELECT 'computer_parts', COUNT(*) FROM computer_parts
UNION ALL
SELECT 'article_tags', COUNT(*) FROM article_tags
UNION ALL
SELECT 'related_articles', COUNT(*) FROM related_articles;

-- Test article query
SELECT 
  a.title,
  t.name as topic,
  a.is_featured,
  a.published_at
FROM articles a
JOIN topics t ON a.topic_id = t.id
ORDER BY a.published_at DESC;

-- Test parts query
SELECT 
  name,
  category,
  manufacturer,
  specs_json->>'cores' as cores
FROM computer_parts
WHERE category = 'cpu';
```

## Step 6: Test in App

1. Make sure your environment variables are set correctly in `src/environments/environment.ts`
2. Run the app: `npm start`
3. You should see:
   - Featured articles on the home page
   - Articles listed under each topic
   - Computer parts in the parts catalog
   - Search functionality working

## Troubleshooting

### "Could not find the table 'public.articles'"
- Verify Step 1 was completed successfully
- Check that all 6 tables exist in **Database** > **Tables**

### Images not loading
- Verify Storage buckets were created (Step 2)
- Check bucket policies allow public read access
- For development, use Option A (placeholder images)

### No data showing in app
- Verify Step 3 completed successfully
- Check browser console for errors
- Verify Supabase URL and anon key in environment files

### RLS policy errors
- Ensure RLS is enabled on all tables
- Verify public read policies exist
- Check Supabase logs in **Logs** > **Database**

## Sample Data Summary

The seed data includes:

**Articles (4):**
- Understanding CPU Architecture (Computer, Featured)
- Graphics Processing Units: Beyond Gaming (Computer, Featured)
- Memory Hierarchy: From Registers to Cloud Storage (Computer)
- TCP/IP Protocol Suite (Network, Featured)

**Computer Parts (8):**
- CPUs: Intel i9-14900K, AMD Ryzen 9 7950X, Intel i5-14600K
- GPUs: RTX 4090, RX 7900 XTX, RTX 4070
- RAM: Corsair Vengeance DDR5 32GB, G.Skill Trident Z5 64GB
- Storage: Samsung 990 PRO 2TB, WD Black SN850X 1TB

**Topics (3):**
- Computer
- Network
- Software

**Tags (10):**
- Hardware, CPU, GPU, Memory, Storage, Performance, Gaming, Specifications, Components, Architecture
