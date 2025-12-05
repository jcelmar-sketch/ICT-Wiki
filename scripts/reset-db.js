#!/usr/bin/env node

/**
 * ICT Wiki Database Reset & Seed Script (via Supabase JS SDK)
 *
 * Resets database to clean state and re-seeds test data.
 * Does NOT require psql or raw database access.
 *
 * Usage:
 *   node scripts/reset-db.js
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars set
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function resetDatabase() {
  console.log('🗑️  Resetting database...\n');

  try {
    // Delete in order to avoid foreign key constraints
    await supabase.from('activity_logs').delete().gte('created_at', '1970-01-01');
    console.log('✓ Cleared activity logs');

    await supabase.from('trash').delete().gte('created_at', '1970-01-01');
    console.log('✓ Cleared trash');

    await supabase
      .from('articles')
      .delete()
      .gte('created_at', '1970-01-01')
      .is('deleted_at', null);
    console.log('✓ Cleared articles');

    await supabase
      .from('parts')
      .delete()
      .gte('created_at', '1970-01-01')
      .is('deleted_at', null);
    console.log('✓ Cleared parts');

    await supabase.from('categories').delete().gte('created_at', '1970-01-01');
    console.log('✓ Cleared categories');

    await supabase
      .from('admin_users')
      .delete()
      .gte('created_at', '1970-01-01');
    console.log('✓ Cleared admin users\n');

    console.log('✅ Database reset complete\n');
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    process.exit(1);
  }
}

async function seedDatabase() {
  console.log('🌱 Seeding test data...\n');

  try {
    // Create admin user
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: 'admin@ict-wiki.local',
      password: 'TestAdmin123!',
      email_confirm: true,
    });

    const adminId =
      authUser?.user?.id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    await supabase.from('admin_users').insert({
      id: adminId,
      email: 'admin@ict-wiki.local',
      role: 'admin',
      failed_attempts: 0,
    });

    console.log('✓ Admin user created');

    // Seed categories
    await supabase.from('categories').insert([
      {
        name: 'Computer Hardware',
        slug: 'computer-hardware',
        description: 'CPUs, RAM, Storage components',
        order_index: 1,
      },
      {
        name: 'Networking',
        slug: 'networking',
        description: 'Network devices and protocols',
        order_index: 2,
      },
      {
        name: 'Software',
        slug: 'software',
        description: 'Operating systems and applications',
        order_index: 3,
      },
      {
        name: 'Peripherals',
        slug: 'peripherals',
        description: 'Mice, keyboards, monitors, and other peripherals',
        order_index: 4,
      },
      {
        name: 'Mobile Devices',
        slug: 'mobile-devices',
        description: 'Smartphones and tablets',
        order_index: 5,
      },
    ]);

    console.log('✓ Categories seeded');

    // Seed articles
    await supabase.from('articles').insert([
      {
        title: 'Getting Started with CPUs',
        slug: 'getting-started-cpus',
        content: '# CPU Fundamentals\n\n## What is a CPU?\nA Central Processing Unit (CPU) is the main component that executes instructions from programs. It\'s the brain of your computer.\n\n## Types of CPUs\n- **Desktop CPUs**: High performance for workstations\n- **Mobile CPUs**: Optimized for power efficiency\n- **Server CPUs**: Built for reliability and throughput\n\n## Key Specifications\n- Cores and Threads\n- Clock Speed (GHz)\n- TDP (Thermal Design Power)\n- Cache Size',
        excerpt: 'Learn the basics of CPU technology and specifications',
        status: 'published',
        category: 'Computer Hardware',
        author_id: adminId,
      },
      {
        title: 'Network Protocols 101',
        slug: 'network-protocols-101',
        content: '# Understanding Network Protocols\n\n## OSI Model\nThe seven-layer model for network communication:\n1. Physical\n2. Data Link\n3. Network (IP)\n4. Transport (TCP/UDP)\n5. Session\n6. Presentation\n7. Application (HTTP, HTTPS)\n\n## Common Protocols\n- **TCP**: Reliable, ordered delivery\n- **UDP**: Fast, connectionless\n- **IP**: Routing and addressing\n- **HTTP/HTTPS**: Web communication',
        excerpt: 'Overview of network protocols and the OSI model',
        status: 'published',
        category: 'Networking',
        author_id: adminId,
      },
      {
        title: 'Guide to RAM and Memory',
        slug: 'guide-ram-memory',
        content: '# RAM and Memory Management\n\n## Types of Memory\n- **RAM (Random Access Memory)**: Temporary, volatile\n- **ROM (Read-Only Memory)**: Permanent, non-volatile\n- **Cache**: Ultra-fast, small capacity\n\n## DDR Standards\n- DDR3: Legacy, slower\n- DDR4: Current standard\n- DDR5: Latest, faster speeds\n\n## Choosing the Right RAM\nConsider speed, capacity, and compatibility with your motherboard.',
        excerpt: 'Understanding RAM types, standards, and selection',
        status: 'published',
        category: 'Computer Hardware',
        author_id: adminId,
      },
      {
        title: 'Storage Solutions: SSD vs HDD',
        slug: 'storage-solutions-ssd-vs-hdd',
        content: '# Comparing Storage Technologies\n\n## Hard Disk Drives (HDD)\n- Mechanical, rotating disks\n- Larger capacity, lower cost\n- Slower performance\n- Better for archival\n\n## Solid State Drives (SSD)\n- No moving parts, uses flash memory\n- Faster speeds\n- Higher cost per GB\n- NVMe interface for even better performance\n\n## When to Use Each\nHDDs for bulk storage, SSDs for OS and applications.',
        excerpt: 'Detailed comparison of HDD and SSD technologies',
        status: 'published',
        category: 'Computer Hardware',
        author_id: adminId,
      },
      {
        title: 'Wireless Network Standards',
        slug: 'wireless-network-standards',
        content: '# Wi-Fi and Wireless Standards\n\n## Wi-Fi Generations\n- **802.11b**: 11 Mbps\n- **802.11g**: 54 Mbps\n- **802.11n (Wi-Fi 4)**: 600 Mbps\n- **802.11ac (Wi-Fi 5)**: 3.5 Gbps\n- **802.11ax (Wi-Fi 6)**: 10 Gbps\n\n## Frequency Bands\n- 2.4 GHz: Longer range, more interference\n- 5 GHz: Shorter range, less interference\n- 6 GHz: Newest band with Wi-Fi 6E\n\n## Choosing a Router\nConsider coverage, speed requirements, and budget.',
        excerpt: 'Overview of Wi-Fi standards and wireless technology',
        status: 'published',
        category: 'Networking',
        author_id: adminId,
      },
      {
        title: 'Operating Systems Comparison',
        slug: 'operating-systems-comparison',
        content: '# Comparing Operating Systems\n\n## Major Operating Systems\n- **Windows**: Market leader, user-friendly\n- **macOS**: Integrated ecosystem\n- **Linux**: Open-source, customizable\n- **Chrome OS**: Web-based, lightweight\n\n## Features Comparison\n- File system\n- Security model\n- Application ecosystem\n- Hardware requirements\n- Cost\n\n## Choosing an OS\nDepends on your workflow, software needs, and hardware.',
        excerpt: 'Comparison of popular operating systems',
        status: 'published',
        category: 'Software',
        author_id: adminId,
      },
      {
        title: 'Cybersecurity Best Practices',
        slug: 'cybersecurity-best-practices',
        content: '# Staying Secure Online\n\n## Essential Security Measures\n1. Keep software updated\n2. Use strong, unique passwords\n3. Enable two-factor authentication\n4. Use antivirus/anti-malware\n5. Backup your data regularly\n\n## Password Security\n- At least 12 characters\n- Mix of upper, lower, numbers, symbols\n- Unique for each account\n- Use a password manager\n\n## Recognizing Threats\n- Phishing emails\n- Suspicious links\n- Malware warnings\n- Social engineering',
        excerpt: 'Essential cybersecurity practices for users',
        status: 'published',
        category: 'Software',
        author_id: adminId,
      },
      {
        title: 'Monitor Technology Explained',
        slug: 'monitor-technology-explained',
        content: '# Understanding Monitor Specifications\n\n## Display Technologies\n- **LCD**: Standard, affordable\n- **LED**: Backlit LCD\n- **OLED**: Superior contrast\n- **Mini-LED**: High brightness\n\n## Key Specifications\n- Resolution (1080p, 1440p, 4K)\n- Refresh rate (60 Hz to 360+ Hz)\n- Response time (1ms to 10ms)\n- Color accuracy (sRGB, Adobe RGB)\n\n## Choosing the Right Monitor\nConsider use case: gaming, design, productivity, or general use.',
        excerpt: 'Guide to monitor technologies and specifications',
        status: 'published',
        category: 'Peripherals',
        author_id: adminId,
      },
      {
        title: 'Future of Technology',
        slug: 'future-of-technology',
        content: '# Emerging Technologies to Watch\n\n## Artificial Intelligence\n- Machine learning applications\n- Natural language processing\n- Computer vision\n\n## Quantum Computing\n- Exponential processing power\n- Parallel computation\n- Current limitations\n\n## 5G and Beyond\n- Faster mobile connectivity\n- Lower latency\n- IoT enablement\n\n## Renewable Energy Computing\n- Sustainable data centers\n- Power efficiency\n- Carbon-neutral operations',
        excerpt: 'Emerging technologies shaping the future',
        status: 'published',
        category: 'Software',
        author_id: adminId,
      },
      {
        title: 'Draft: Advanced CPU Architecture',
        slug: 'draft-advanced-cpu-architecture',
        content: '# Advanced CPU Architecture Concepts\n\n## Instruction Sets\n- x86-64\n- ARM\n- RISC-V\n\n## Parallelization\n- Multi-core processing\n- Hyperthreading\n- GPU acceleration\n\n*This article is still under development*',
        excerpt: 'Work in progress on advanced CPU concepts',
        status: 'draft',
        category: 'Computer Hardware',
        author_id: adminId,
      },
    ]);

    console.log('✓ Articles seeded');

    // Seed parts - expanded catalog
    await supabase.from('parts').insert([
      // CPUs
      {
        name: 'Intel Core i9-13900K',
        slug: 'intel-i9-13900k',
        type: 'CPU',
        brand: 'Intel',
        description: 'High-performance desktop processor with hybrid architecture',
        specs: {
          cores: 24,
          threads: 32,
          base_clock: '3.0 GHz',
          boost_clock: '5.8 GHz',
          tdp: 253,
          socket: 'LGA1700',
          generation: '13th Gen Raptor Lake',
        },
      },
      {
        name: 'AMD Ryzen 7 7700X',
        slug: 'amd-ryzen-7-7700x',
        type: 'CPU',
        brand: 'AMD',
        description: 'High-end Ryzen processor with Zen 4 architecture',
        specs: {
          cores: 8,
          threads: 16,
          base_clock: '4.5 GHz',
          boost_clock: '5.4 GHz',
          tdp: 105,
          socket: 'AM5',
          generation: 'Ryzen 7000 Series',
        },
      },
      {
        name: 'Intel Core i7-13700K',
        slug: 'intel-i7-13700k',
        type: 'CPU',
        brand: 'Intel',
        description: 'Excellent for gaming and productivity',
        specs: {
          cores: 16,
          threads: 24,
          base_clock: '3.4 GHz',
          boost_clock: '5.4 GHz',
          tdp: 253,
          socket: 'LGA1700',
        },
      },
      {
        name: 'AMD Ryzen 5 5600X',
        slug: 'amd-ryzen-5-5600x',
        type: 'CPU',
        brand: 'AMD',
        description: 'Affordable Ryzen with solid performance',
        specs: {
          cores: 6,
          threads: 12,
          base_clock: '3.7 GHz',
          boost_clock: '4.6 GHz',
          tdp: 65,
          socket: 'AM4',
        },
      },

      // Memory
      {
        name: 'Corsair Vengeance DDR5 32GB',
        slug: 'corsair-vengeance-ddr5-32gb',
        type: 'RAM',
        brand: 'Corsair',
        description: 'High-performance DDR5 memory',
        specs: {
          capacity: '32GB',
          type: 'DDR5',
          speed: '6000 MHz',
          cl: 30,
          form_factor: 'DIMM',
        },
      },
      {
        name: 'G.Skill Trident Z5 RGB 64GB',
        slug: 'gskill-trident-z5-rgb-64gb',
        type: 'RAM',
        brand: 'G.Skill',
        description: 'Premium DDR5 with RGB lighting',
        specs: {
          capacity: '64GB',
          type: 'DDR5',
          speed: '6400 MHz',
          cl: 32,
          form_factor: 'DIMM',
          rgb: true,
        },
      },
      {
        name: 'Kingston Fury Beast DDR4 16GB',
        slug: 'kingston-fury-beast-ddr4-16gb',
        type: 'RAM',
        brand: 'Kingston',
        description: 'Reliable DDR4 memory',
        specs: {
          capacity: '16GB',
          type: 'DDR4',
          speed: '3200 MHz',
          cl: 16,
          form_factor: 'DIMM',
        },
      },

      // Storage
      {
        name: 'Samsung 990 Pro 2TB',
        slug: 'samsung-990-pro-2tb',
        type: 'Storage',
        brand: 'Samsung',
        description: 'High-speed NVMe SSD with PCIe 4.0',
        specs: {
          capacity: '2TB',
          interface: 'NVMe PCIe 4.0',
          speed_read: '7450 MB/s',
          speed_write: '6900 MB/s',
          form_factor: 'M.2',
        },
      },
      {
        name: 'WD Black SN850X 1TB',
        slug: 'wd-black-sn850x-1tb',
        type: 'Storage',
        brand: 'Western Digital',
        description: 'Gaming-focused NVMe SSD',
        specs: {
          capacity: '1TB',
          interface: 'NVMe PCIe 4.0',
          speed_read: '7100 MB/s',
          speed_write: '6000 MB/s',
          form_factor: 'M.2',
        },
      },
      {
        name: 'Sabrent Rocket 4 Plus 4TB',
        slug: 'sabrent-rocket-4-plus-4tb',
        type: 'Storage',
        brand: 'Sabrent',
        description: 'Large capacity NVMe for professionals',
        specs: {
          capacity: '4TB',
          interface: 'NVMe PCIe 4.0',
          speed_read: '7000 MB/s',
          speed_write: '6500 MB/s',
          form_factor: 'M.2',
        },
      },

      // Motherboards
      {
        name: 'ASUS ROG Z790-E Gaming WiFi',
        slug: 'asus-rog-z790-e',
        type: 'Motherboard',
        brand: 'ASUS',
        description: 'Premium gaming motherboard for 13th Gen Intel',
        specs: {
          socket: 'LGA1700',
          chipset: 'Z790',
          form_factor: 'ATX',
          memory_slots: 4,
          memory_type: 'DDR5',
          pcie_slots: 5,
        },
      },
      {
        name: 'MSI MPG X870E Godlike',
        slug: 'msi-mpg-x870e-godlike',
        type: 'Motherboard',
        brand: 'MSI',
        description: 'Flagship AMD X870E motherboard',
        specs: {
          socket: 'AM5',
          chipset: 'X870E',
          form_factor: 'E-ATX',
          memory_slots: 4,
          memory_type: 'DDR5',
          pcie_slots: 7,
        },
      },

      // GPUs
      {
        name: 'NVIDIA RTX 4090',
        slug: 'nvidia-rtx-4090',
        type: 'GPU',
        brand: 'NVIDIA',
        description: 'Flagship gaming GPU with 24GB VRAM',
        specs: {
          memory: '24GB GDDR6X',
          architecture: 'Ada Lovelace',
          cuda_cores: 16384,
          boost_clock: '2.52 GHz',
          power_consumption: '450W',
        },
      },
      {
        name: 'AMD Radeon RX 7900 XTX',
        slug: 'amd-radeon-rx-7900-xtx',
        type: 'GPU',
        brand: 'AMD',
        description: 'High-performance AMD gaming GPU',
        specs: {
          memory: '24GB GDDR6',
          architecture: 'RDNA 3',
          stream_processors: 6144,
          boost_clock: '2.5 GHz',
          power_consumption: '420W',
        },
      },

      // Cooling
      {
        name: 'Noctua NH-D15 Chromax',
        slug: 'noctua-nh-d15-chromax',
        type: 'Cooling',
        brand: 'Noctua',
        description: 'Premium air cooler for high-end CPUs',
        specs: {
          type: 'Air',
          socket_compatibility: ['LGA1700', 'AM5', 'AM4'],
          height: '165mm',
          tdp_capacity: '250W',
          noise_level: '19.1 dB',
        },
      },
      {
        name: 'CORSAIR iCUE H150i Elite Capellix',
        slug: 'corsair-icue-h150i',
        type: 'Cooling',
        brand: 'Corsair',
        description: 'All-in-one liquid cooler with RGB',
        specs: {
          type: 'Liquid',
          radiator_size: '360mm',
          socket_compatibility: ['LGA1700', 'AM5', 'AM4'],
          tdp_capacity: '350W',
          rgb: true,
        },
      },

      // Power Supplies
      {
        name: 'Corsair RM1000e 1000W Gold',
        slug: 'corsair-rm1000e',
        type: 'PSU',
        brand: 'Corsair',
        description: 'Fully modular 1000W power supply',
        specs: {
          capacity: '1000W',
          certification: '80+ Gold',
          modular: 'Full',
          efficiency: '90%',
          form_factor: 'ATX',
        },
      },
      {
        name: 'Seasonic Prime TX-1000',
        slug: 'seasonic-prime-tx-1000',
        type: 'PSU',
        brand: 'Seasonic',
        description: 'Titanium-rated power supply',
        specs: {
          capacity: '1000W',
          certification: '80+ Titanium',
          modular: 'Full',
          efficiency: '94%',
          form_factor: 'ATX',
        },
      },

      // Cases
      {
        name: 'Lian Li LANCOOL 3',
        slug: 'lian-li-lancool-3',
        type: 'Case',
        brand: 'Lian Li',
        description: 'Mesh case with excellent airflow',
        specs: {
          form_factor: 'Mid-Tower',
          max_gpu_length: '330mm',
          max_cooler_height: '180mm',
          drive_bays: '2x 3.5\" + 3x 2.5\"',
          fan_support: '6x 120mm',
        },
      },

      // Monitors
      {
        name: 'LG 27GP850',
        slug: 'lg-27gp850',
        type: 'Monitor',
        brand: 'LG',
        description: '27\" 1440p 180Hz IPS gaming monitor',
        specs: {
          size: '27 inches',
          resolution: '2560x1440',
          refresh_rate: '180 Hz',
          response_time: '1ms',
          panel_type: 'IPS',
          color_gamut: '98% DCI-P3',
        },
      },
      {
        name: 'Dell S3722DGF',
        slug: 'dell-s3722dgf',
        type: 'Monitor',
        brand: 'Dell',
        description: '37\" Ultra-wide curved display',
        specs: {
          size: '37.5 inches',
          resolution: '3840x1600',
          refresh_rate: '144 Hz',
          response_time: '1ms',
          panel_type: 'VA',
          curved: true,
        },
      },

      // Peripherals
      {
        name: 'Logitech G PRO X Superlight',
        slug: 'logitech-g-pro-x-superlight',
        type: 'Peripheral',
        brand: 'Logitech',
        description: 'Ultra-light wireless gaming mouse',
        specs: {
          type: 'Mouse',
          weight: '63g',
          dpi: '25600',
          wireless: true,
          battery_life: '70 hours',
        },
      },
      {
        name: 'Corsair K95 Platinum XT',
        slug: 'corsair-k95-platinum-xt',
        type: 'Peripheral',
        brand: 'Corsair',
        description: 'Premium mechanical gaming keyboard',
        specs: {
          type: 'Keyboard',
          switches: 'Cherry MX',
          rgb: true,
          programmable_keys: true,
          wireless: false,
        },
      },
    ]);

    console.log('✓ Parts seeded (28 total)');

    console.log('\n✅ Database seeded complete\n');
    console.log('Test Credentials:');
    console.log('  Email: admin@ict-wiki.local');
    console.log('  Password: TestAdmin123!\n');
    console.log('Data Summary:');
    console.log('  • 5 Categories');
    console.log('  • 10 Articles (9 published, 1 draft)');
    console.log('  • 28 Parts (CPUs, RAM, Storage, GPUs, Cooling, etc.)');
    console.log('  • 1 Admin user\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

async function main() {
  console.log('\n🔄 ICT Wiki Database Reset & Seed\n');
  await resetDatabase();
  await seedDatabase();
}

main();
