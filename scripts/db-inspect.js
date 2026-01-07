#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const tables = ['admin_users','articles','parts','categories','activity_logs','trash'];

(async () => {
  console.log('\nDB Inspect - connection info:');
  console.log(' SUPABASE_URL:', SUPABASE_URL);

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*').limit(5);
      if (error) {
        console.log(`\n${table}: ERROR ->`, error.message);
        continue;
      }
      console.log(`\n${table}: ${Array.isArray(data) ? data.length : 0} sample rows`);
      console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      console.log(`\n${table}: EXCEPTION ->`, err.message);
    }
  }

  // Also run a head count query to compare
  console.log('\nHead counts (exact):');
  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      console.log(` ${table}: ${count || 0}`);
    } catch (err) {
      console.log(` ${table}: ERROR -> ${err.message}`);
    }
  }

  process.exit(0);
})();