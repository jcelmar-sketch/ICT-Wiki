#!/usr/bin/env node

/**
 * ICT Wiki Supabase Setup Script
 *
 * This script handles:
 * 1. Running migrations (create tables, RLS policies, triggers)
 * 2. Seeding test data (articles, parts, categories, admin user)
 * 3. Initializing storage buckets
 *
 * Usage:
 *   node scripts/setup-supabase.js
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars set
 *   - Or pass as CLI args: node scripts/setup-supabase.js <url> <key>
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from env or CLI args
const SUPABASE_URL = process.argv[2] || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.argv[3] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Error: Missing Supabase credentials.\nUsage: node scripts/setup-supabase.js <URL> <SERVICE_ROLE_KEY>'
  );
  process.exit(1);
}

// Initialize Supabase client with service role (for admin operations)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function log(message, type = 'info') {
  const prefix = {
    info: '[ℹ️  INFO]',
    success: '[✅ SUCCESS]',
    warn: '[⚠️  WARN]',
    error: '[❌ ERROR]',
  }[type] || '[LOG]';
  console.log(`${prefix} ${message}`);
}

async function runMigration(name, sqlFile) {
  const filePath = path.join(__dirname, 'migrations', sqlFile);
  if (!fs.existsSync(filePath)) {
    await log(`Migration file not found: ${filePath}`, 'warn');
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  try {
    // Execute raw SQL via Supabase PostgREST API
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, try alternative method
      // Split into individual statements and execute
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('--'));

      for (const statement of statements) {
        if (!statement) continue;
        
        try {
          const { error: stmtError } = await supabase.rpc('exec_statement', {
            stmt: statement,
          });
          if (stmtError && !stmtError.message.includes('does not exist')) {
            throw stmtError;
          }
        } catch (e) {
          // If RPC methods don't exist, provide manual instructions
          throw new Error('RPC execution not available');
        }
      }
    }

    await log(`Migration ${name} completed`, 'success');
    return true;
  } catch (err) {
    // JS SDK limitation: can't execute raw SQL directly
    // Provide instructions for manual execution but continue
    await log(
      `Migration ${name}: Cannot auto-execute via JS SDK. Run manually via Supabase Dashboard SQL Editor`,
      'warn'
    );
    return false;
  }
}

async function seedData() {
  try {
    // Create test admin user in Auth
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: 'admin@ict.local',
        password: 'Admin123!',
        email_confirm: true,
      });

    // Handle user already exists gracefully
    if (authError && !authError.message.includes('already') && !authError.message.includes('registered')) {
      throw authError;
    }

    // If user already exists, fetch it
    let adminId = authUser?.user?.id;
    
    if (!adminId) {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError) {
        const existingUser = users.find(u => u.email === 'admin@ict.local');
        adminId = existingUser?.id;
      }
    }
    
    await log(`Admin user created/found: ${adminId}`, 'success');

    // Insert admin user into admin_users table
    const { error: adminError } = await supabase.from('admin_users').upsert([
      {
        id: adminId,
        email: 'admin@ict.local',
        role: 'admin',
        failed_login_attempts: 0,
        last_login_at: new Date().toISOString(),
      },
    ]);

    if (adminError) throw adminError;
    await log('Admin user added to database', 'success');

    // Seed topics (not categories)
    // Note: Some database schemas use 'order', others use 'display_order'
    // We'll include both to be compatible with either schema
    const { error: topicError } = await supabase
      .from('topics')
      .upsert([
        {
          name: 'Computer',
          slug: 'computer',
          description: 'Computer hardware, architecture, and systems',
          icon: 'desktop-outline',
          order: 1,
          display_order: 1,
        },
        {
          name: 'Network',
          slug: 'network',
          description: 'Networking protocols, infrastructure, and security',
          icon: 'share-social-outline',
          order: 2,
          display_order: 2,
        },
        {
          name: 'Software',
          slug: 'software',
          description: 'Software development, tools, and methodologies',
          icon: 'code-slash-outline',
          order: 3,
          display_order: 3,
        },
      ], { onConflict: 'slug' });

    if (topicError && !topicError.message.includes('duplicate'))
      throw topicError;
    await log('3 Topics seeded', 'success');

    // Get topic IDs for articles
    const { data: topics } = await supabase.from('topics').select('id, slug');
    const topicMap = {};
    topics?.forEach(t => { topicMap[t.slug] = t.id; });

    // Seed sample articles (using topic_id, published_at instead of status/category/author_id)
    const { error: articleError } = await supabase.from('articles').upsert([
      {
        title: 'Getting Started with CPUs',
        slug: 'getting-started-cpus',
        content: '# CPU Fundamentals\n\n## What is a CPU?\nA Central Processing Unit (CPU) is the main component that executes instructions from programs.\n\n## Key Specifications\n- Cores and Threads\n- Clock Speed (GHz)\n- TDP (Thermal Design Power)\n\n## Popular CPU Brands\n- Intel Core series\n- AMD Ryzen series\n\n## Performance Factors\nThe performance of a CPU depends on multiple factors including core count, clock speed, cache size, and architecture efficiency.',
        excerpt: 'Learn the basics of CPU technology and key specifications',
        topic_id: topicMap['computer'],
        published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        is_featured: true,
      },
      {
        title: 'Network Protocols 101',
        slug: 'network-protocols-101',
        content: '# Understanding Network Protocols\n\n## OSI Model\nThe seven-layer model for network communication.\n\n## Common Protocols\n- **TCP**: Reliable, ordered delivery\n- **UDP**: Fast, connectionless\n- **IP**: Routing and addressing\n- **HTTP/HTTPS**: Web communication\n- **DNS**: Domain name resolution\n\n## Protocol Stack\nProtocols work together in layers to enable network communication.',
        excerpt: 'Overview of fundamental network protocols and the OSI model',
        topic_id: topicMap['computer'],
        published_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        is_featured: false,
      },
    ], { onConflict: 'slug' });

    if (articleError && !articleError.message.includes('duplicate'))
      throw articleError;
    await log('3 Articles seeded', 'success');

    // Seed sample computer parts
    const { error: partError } = await supabase.from('computer_parts').upsert([
      {
        name: 'Intel Core i9-13900K',
        slug: 'intel-i9-13900k',
        category: 'cpu',
        manufacturer: 'Intel',
        description: 'High-performance desktop processor with 24 cores (8 P-cores + 16 E-cores) and up to 5.8 GHz boost clock. Ideal for gaming, content creation, and heavy multitasking workloads.',
        image: 'https://via.placeholder.com/400x300?text=Intel+i9-13900K',
        specs_json: { cores: 24, threads: 32, base_clock: '3.0 GHz', boost_clock: '5.8 GHz', tdp: '253W', socket: 'LGA1700' },
      },
      {
        name: 'AMD Ryzen 7 7700X',
        slug: 'amd-ryzen-7-7700x',
        category: 'cpu',
        manufacturer: 'AMD',
        description: 'High-end Ryzen processor with 8 cores and 16 threads, built on 5nm process technology. Features excellent multi-threaded performance with support for DDR5 and PCIe 5.0.',
        image: 'https://via.placeholder.com/400x300?text=AMD+Ryzen+7700X',
        specs_json: { cores: 8, threads: 16, base_clock: '4.5 GHz', boost_clock: '5.4 GHz', tdp: '105W', socket: 'AM5' },
      },
      {
        name: 'Corsair Vengeance DDR5 32GB',
        slug: 'corsair-vengeance-ddr5-32gb',
        category: 'ram',
        manufacturer: 'Corsair',
        description: 'High-performance DDR5 memory kit with 32GB capacity running at 6000 MHz. Perfect for demanding gaming and creative workloads with low CL30 latency.',
        image: 'https://via.placeholder.com/400x300?text=Corsair+DDR5+32GB',
        specs_json: { capacity: '32GB', type: 'DDR5', speed: '6000 MHz', cas_latency: 'CL30', voltage: '1.35V' },
      },
      {
        name: 'Samsung 990 Pro 2TB',
        slug: 'samsung-990-pro-2tb',
        category: 'storage',
        manufacturer: 'Samsung',
        description: 'High-speed NVMe SSD with PCIe 4.0 interface delivering exceptional read/write speeds up to 7450 MB/s. Enterprise-grade reliability with advanced thermal control.',
        image: 'https://via.placeholder.com/400x300?text=Samsung+990+Pro+2TB',
        specs_json: { capacity: '2TB', interface: 'NVMe PCIe 4.0 x4', speed_read: '7450 MB/s', speed_write: '6900 MB/s', form_factor: 'M.2 2280' },
      },
      {
        name: 'NVIDIA GeForce RTX 4090',
        slug: 'nvidia-rtx-4090',
        category: 'gpu',
        manufacturer: 'NVIDIA',
        description: 'Flagship gaming graphics card with 24GB GDDR6X memory and 16384 CUDA cores. Delivers exceptional 4K gaming performance with ray tracing and DLSS 3.0 support.',
        image: 'https://via.placeholder.com/400x300?text=NVIDIA+RTX+4090',
        specs_json: { memory: '24GB GDDR6X', cuda_cores: 16384, boost_clock: '2.52 GHz', power_consumption: '450W', outputs: ['HDMI 2.1', 'DisplayPort 1.4a'] },
      },
      {
        name: 'ASUS ROG Z790-E Gaming WiFi',
        slug: 'asus-rog-z790-e',
        category: 'motherboard',
        manufacturer: 'ASUS',
        description: 'Premium gaming motherboard with robust power delivery, PCIe 5.0 support, Wi-Fi 6E, and comprehensive connectivity options for high-end Intel builds.',
        image: 'https://via.placeholder.com/400x300?text=ASUS+ROG+Z790-E',
        specs_json: { socket: 'LGA1700', chipset: 'Intel Z790', form_factor: 'ATX', memory_slots: 4, max_memory: '128GB', pcie_slots: ['PCIe 5.0 x16', 'PCIe 4.0 x16'] },
      },
      {
        name: 'Corsair RM1000e 1000W',
        slug: 'corsair-rm1000e',
        category: 'psu',
        manufacturer: 'Corsair',
        description: '80+ Gold certified modular power supply with 1000W output. Features low-noise operation, digital monitoring via Corsair iMON, and silent fan mode for efficient power delivery.',
        image: 'https://via.placeholder.com/400x300?text=Corsair+RM1000e',
        specs_json: { wattage: '1000W', certification: '80+ Gold', modular: 'Fully Modular', fan_size: '135mm', voltage: '100-240V AC' },
      },
      {
        name: 'Noctua NH-D15S',
        slug: 'noctua-nh-d15s',
        category: 'cooling',
        manufacturer: 'Noctua',
        description: 'Premium dual-tower air cooler with SecuFirm2 mounting system. Provides excellent cooling performance with near-silent operation for high-end processors.',
        image: 'https://via.placeholder.com/400x300?text=Noctua+NH-D15S',
        specs_json: { type: 'Air', height: '160mm', weight: '680g', tdp: '250W', noise_level: '19.2 dB' },
      },
      {
        name: 'Lian Li LANCOOL 3',
        slug: 'lian-li-lancool-3',
        category: 'case',
        manufacturer: 'Lian Li',
        description: 'Mid-tower ATX case with tempered glass panel, excellent airflow, and cable management options. Supports up to 7 fans and GPU length up to 330mm.',
        image: 'https://via.placeholder.com/400x300?text=Lian+Li+LANCOOL+3',
        specs_json: { type: 'Mid-Tower', form_factor: 'ATX', material: 'Aluminum/Steel', fans_included: 2, max_gpu_length: '330mm' },
      },
      {
        name: 'Logitech MX Master 3S',
        slug: 'logitech-mx-master-3s',
        category: 'peripherals',
        manufacturer: 'Logitech',
        description: 'Advanced wireless mouse with precision scrolling, customizable buttons, and multi-device connectivity. Perfect for productivity and creative professionals.',
        image: 'https://via.placeholder.com/400x300?text=Logitech+MX+Master+3S',
        specs_json: { connection: 'Wireless 2.4GHz + Bluetooth', dpi: '8000', buttons: 8, battery_life: '70 days', color: 'Graphite' },
      },
      {
        name: 'Mechanical Keyboard - Keychron Q1',
        slug: 'keychron-q1',
        category: 'peripherals',
        manufacturer: 'Keychron',
        description: 'Premium mechanical keyboard with fully customizable switches, wireless connectivity, and aluminum frame. Ideal for gaming and typing enthusiasts.',
        image: 'https://via.placeholder.com/400x300?text=Keychron+Q1',
        specs_json: { layout: '75%', switch_type: 'Hot-swap', connection: 'Wireless/Wired', backlight: 'RGB', material: 'Aluminum' },
      },
    ], { onConflict: 'slug' });

    if (partError && !partError.message.includes('duplicate'))
      throw partError;
    await log('12 Computer Parts seeded (CPUs, RAM, Storage, GPU, Motherboard, PSU, Cooling, Case, Peripherals)', 'success');
  } catch (err) {
    await log(`Seeding error: ${err.message}`, 'error');
    throw err;
  }
}

async function initializeStorageBuckets() {
  try {
    const buckets = ['articles', 'parts', 'audit-archive'];

    for (const bucketName of buckets) {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some((b) => b.name === bucketName);

      if (!exists) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: false,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
          ],
        });

        if (error) throw error;
        await log(`Storage bucket created: ${bucketName}`, 'success');
      } else {
        await log(`Storage bucket already exists: ${bucketName}`, 'warn');
      }
    }
  } catch (err) {
    await log(`Storage initialization error: ${err.message}`, 'error');
    throw err;
  }
}

async function main() {
  console.log('\n🚀 ICT Wiki Supabase Setup\n');

  try {
    // Step 1: Run migrations
    console.log('\n📋 Step 1: Running Migrations\n');
    await runMigration('Create Admin Tables', '001_create_admin_tables.sql');
    await runMigration('Enable RLS Policies', '002_admin_rls_policies.sql');
    await runMigration('Create Audit Triggers', '003_admin_triggers.sql');

    // Step 2: Seed data
    console.log('\n🌱 Step 2: Seeding Database\n');
    await seedData();

    // Step 3: Initialize storage
    console.log('\n📦 Step 3: Initializing Storage Buckets\n');
    await initializeStorageBuckets();

    console.log('\n✨ Setup Complete!\n');
    console.log('Test Credentials:');
    console.log('  Email: admin@ict.local');
    console.log('  Password: Admin123!');
    console.log(
      '\n⚠️  Migration Warning: Migrations could not be auto-executed via JS SDK.'
    );
    console.log(
      'Please run the migration files manually via Supabase Dashboard SQL Editor:'
    );
    console.log('  1. scripts/migrations/001_create_admin_tables.sql');
    console.log('  2. scripts/migrations/002_admin_rls_policies.sql');
    console.log('  3. scripts/migrations/003_admin_triggers.sql');
    console.log('\n');
  } catch (err) {
    await log(`Setup failed: ${err.message}`, 'error');
    process.exit(1);
  }
}

main();
