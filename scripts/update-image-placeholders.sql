-- ============================================================================
-- Quick Fix: Update Images to Use Placeholders
-- Run this AFTER seed-database.sql if you don't have actual images
-- ============================================================================

-- Update article cover images to use placeholder service
UPDATE articles 
SET cover_image = 'https://placehold.co/800x400/1e293b/94a3b8?text=' || REPLACE(title, ' ', '+')
WHERE cover_image IS NOT NULL;

-- Update computer part images to use placeholder service
UPDATE computer_parts 
SET image = 'https://placehold.co/600x400/1e293b/94a3b8?text=' || REPLACE(name, ' ', '+')
WHERE image IS NOT NULL;

-- Verify updates
SELECT 
  'Articles with images' as category,
  COUNT(*) as count,
  MIN(cover_image) as sample_url
FROM articles 
WHERE cover_image IS NOT NULL

UNION ALL

SELECT 
  'Parts with images' as category,
  COUNT(*) as count,
  MIN(image) as sample_url
FROM computer_parts 
WHERE image IS NOT NULL;

-- ============================================================================
-- Note: This uses placehold.co which generates placeholder images on-the-fly
-- 
-- Format: https://placehold.co/{width}x{height}/{bg-color}/{text-color}?text={text}
-- 
-- Colors used:
--   Background: 1e293b (dark slate)
--   Text: 94a3b8 (light slate)
--
-- When you're ready to use real images:
-- 1. Upload images to Supabase Storage buckets
-- 2. Images will automatically use Supabase Storage URLs via getStorageUrl()
-- ============================================================================
