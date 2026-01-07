require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ldymwxewqimxqnzmvblo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeW13eGV3cWlteHFuem12YmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3Mjk3NzUsImV4cCI6MjA3ODMwNTc3NX0.Pm3i4WHWy7nj2Cum9KkljI7mA738QercLnbqgQxksGQ';

const supabase = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

(async () => {
  try {
    console.log('Testing topics...');
    const t = await supabase.from('topics').select('id').limit(1);
    console.log('topics:', t.error ? t.error.message : 'ok');

    console.log('Testing activity_logs...');
    const a = await supabase.from('activity_logs').select('id').limit(1);
    console.log('activity_logs:', a.error ? a.error.message : 'ok');

    console.log('Testing articles count...');
    const ac = await supabase.from('articles').select('id', { count: 'exact', head: true });
    console.log('articles count:', ac.error ? ac.error.message : `count=${ac.count}`);

    console.log('Testing computer_parts...');
    const p = await supabase.from('computer_parts').select('id').limit(1);
    console.log('computer_parts:', p.error ? p.error.message : 'ok');

    console.log('Testing parts...');
    const p2 = await supabase.from('parts').select('id').limit(1);
    console.log('parts:', p2.error ? p2.error.message : 'ok');

    console.log('Testing storage_metrics...');
    const s = await supabase.from('storage_metrics').select('*').single();
    console.log('storage_metrics:', s.error ? s.error.message : 'ok');
  } catch (e) {
    console.error('Unexpected error:', e.message || e);
  }
})();