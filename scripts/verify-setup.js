#!/usr/bin/env node

/**
 * Quick Start: Test connectivity and verify setup
 * 
 * Usage:
 *   node scripts/verify-setup.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('\n🔍 Verifying ICT Wiki Supabase Setup\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      '❌ Missing credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars'
    );
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // Test connection
    console.log('✓ Testing Supabase connection...');
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) throw error;
    console.log(
      `✓ Connected! Found ${data.users.length} users in Auth\n`
    );

    // Check tables exist
    console.log('✓ Checking database tables...');
    const tables = [
      'admin_users',
      'articles',
      'parts',
      'categories',
      'activity_logs',
      'trash',
    ];

    for (const table of tables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`  ✗ ${table} - NOT FOUND`);
      } else {
        console.log(`  ✓ ${table} (${count || 0} rows)`);
      }
    }

    // Check storage buckets
    console.log('\n✓ Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.log('  ⚠ Could not list buckets');
    } else {
      const bucketNames = buckets.map((b) => b.name);
      console.log(`  Found: ${bucketNames.join(', ')}`);
    }

    console.log('\n✅ Setup verification complete!\n');
    console.log('Next steps:');
    console.log(
      '  1. Run migrations via Supabase Dashboard SQL Editor:'
    );
    console.log('     - scripts/migrations/001_create_admin_tables.sql');
    console.log('     - scripts/migrations/002_admin_rls_policies.sql');
    console.log('     - scripts/migrations/003_admin_triggers.sql');
    console.log('  2. npm run db:setup   # Seed test data');
    console.log('\n');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
}

main();
