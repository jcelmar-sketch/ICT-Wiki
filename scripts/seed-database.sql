-- ============================================================================
-- ICT Wiki Sample Data Seed
-- Run this AFTER running the main schema migration
-- ============================================================================

-- ============================================================================
-- TOPICS
-- ============================================================================

INSERT INTO topics (id, name, slug, description, icon, "order") VALUES
  (
    'f7c9a3e1-8b4d-4c5e-a6f2-1d3e7b9c2a4f'::uuid,
    'Computer',
    'computer',
    'Computer hardware, architecture, and systems',
    'desktop-outline',
    1
  ),
  (
    'a2b4c6d8-1e3f-5a7b-9c0d-2e4f6a8b0c1d'::uuid,
    'Network',
    'network',
    'Networking protocols, infrastructure, and security',
    'share-social-outline',
    2
  ),
  (
    'e5f7a9b1-c3d5-6e8f-0a2b-4c6d8e0f1a3b'::uuid,
    'Software',
    'software',
    'Software development, tools, and methodologies',
    'code-slash-outline',
    3
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TAGS
-- ============================================================================

INSERT INTO tags (id, name, slug) VALUES
  ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid, 'Hardware', 'hardware'),
  ('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, 'CPU', 'cpu'),
  ('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, 'GPU', 'gpu'),
  ('4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'::uuid, 'Memory', 'memory'),
  ('5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b'::uuid, 'Storage', 'storage'),
  ('6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c'::uuid, 'Performance', 'performance'),
  ('7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d'::uuid, 'Gaming', 'gaming'),
  ('8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e'::uuid, 'Specifications', 'specifications'),
  ('9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f'::uuid, 'Components', 'components'),
  ('0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a'::uuid, 'Architecture', 'architecture')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMPUTER PARTS - CPUs
-- ============================================================================

INSERT INTO computer_parts (id, name, slug, category, description, image, specs_json, manufacturer) VALUES
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'::uuid,
    'Intel Core i9-14900K',
    'intel-core-i9-14900k',
    'cpu',
    'High-performance desktop processor with 24 cores (8 P-cores + 16 E-cores) and up to 6.0 GHz boost clock. Ideal for gaming, content creation, and heavy multitasking workloads.',
    NULL,
    '{"cores": 24, "threads": 32, "base_clock": "3.0 GHz", "boost_clock": "6.0 GHz", "tdp": "125W", "socket": "LGA1700", "cache_l3": "36 MB"}'::jsonb,
    'Intel'
  ),
  (
    'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e'::uuid,
    'AMD Ryzen 9 7950X',
    'amd-ryzen-9-7950x',
    'cpu',
    'Flagship 16-core, 32-thread processor built on 5nm process technology. Features exceptional multi-threaded performance with support for DDR5 and PCIe 5.0.',
    NULL,
    '{"cores": 16, "threads": 32, "base_clock": "4.5 GHz", "boost_clock": "5.7 GHz", "tdp": "170W", "socket": "AM5", "cache_l3": "64 MB"}'::jsonb,
    'AMD'
  ),
  (
    'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f'::uuid,
    'Intel Core i5-14600K',
    'intel-core-i5-14600k',
    'cpu',
    'Mid-range gaming processor with 14 cores (6 P-cores + 8 E-cores) offering excellent value for 1440p gaming and productivity tasks at an affordable price point.',
    NULL,
    '{"cores": 14, "threads": 20, "base_clock": "3.5 GHz", "boost_clock": "5.3 GHz", "tdp": "125W", "socket": "LGA1700", "cache_l3": "24 MB"}'::jsonb,
    'Intel'
  ),
  (
    'aa1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d'::uuid,
    'AMD Ryzen 7 7800X3D',
    'amd-ryzen-7-7800x3d',
    'cpu',
    'Gaming-focused 8-core processor with 96MB 3D V-Cache technology for exceptional gaming performance. Best choice for pure gaming builds with excellent efficiency.',
    NULL,
    '{"cores": 8, "threads": 16, "base_clock": "4.2 GHz", "boost_clock": "5.0 GHz", "tdp": "120W", "socket": "AM5", "cache_l3": "96 MB"}'::jsonb,
    'AMD'
  ),
  (
    'bb2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e'::uuid,
    'Intel Core i7-14700K',
    'intel-core-i7-14700k',
    'cpu',
    'Powerful 20-core processor (8 P-cores + 12 E-cores) ideal for content creation and gaming. Excellent all-around performance at a competitive price.',
    NULL,
    '{"cores": 20, "threads": 28, "base_clock": "3.4 GHz", "boost_clock": "5.6 GHz", "tdp": "125W", "socket": "LGA1700", "cache_l3": "33 MB"}'::jsonb,
    'Intel'
  ),
  (
    'cc3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f'::uuid,
    'AMD Ryzen 5 7600X',
    'amd-ryzen-5-7600x',
    'cpu',
    'Budget-friendly 6-core processor with excellent single-threaded performance. Perfect for 1080p/1440p gaming and everyday productivity tasks.',
    NULL,
    '{"cores": 6, "threads": 12, "base_clock": "4.7 GHz", "boost_clock": "5.3 GHz", "tdp": "105W", "socket": "AM5", "cache_l3": "32 MB"}'::jsonb,
    'AMD'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMPUTER PARTS - GPUs=======================================================
-- COMPUTER PARTS - GPUs
-- ============================================================================

INSERT INTO computer_parts (id, name, slug, category, description, image, specs_json, manufacturer) VALUES
  (
    'd4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a'::uuid,
    'NVIDIA GeForce RTX 4090',
    'nvidia-geforce-rtx-4090',
    'gpu',
    'Flagship graphics card with 24GB GDDR6X memory, delivering unprecedented 4K gaming performance and ray tracing capabilities powered by Ada Lovelace architecture.',
    NULL,
    '{"vram": "24 GB GDDR6X", "cuda_cores": 16384, "base_clock": "2235 MHz", "boost_clock": "2520 MHz", "tdp": "450W", "interface": "PCIe 4.0 x16", "memory_bus": "384-bit"}'::jsonb,
    'NVIDIA'
  ),
  (
    'e5f6a7b8-c9d0-4e5f-8a9b-0c1d2e3f4a5b'::uuid,
    'AMD Radeon RX 7900 XTX',
    'amd-radeon-rx-7900-xtx',
    'gpu',
    'High-end graphics card featuring 24GB GDDR6 memory and RDNA 3 architecture. Excellent for 4K gaming with competitive pricing and strong rasterization performance.',
    NULL,
    '{"vram": "24 GB GDDR6", "stream_processors": 6144, "game_clock": "2300 MHz", "boost_clock": "2500 MHz", "tdp": "355W", "interface": "PCIe 4.0 x16", "memory_bus": "384-bit"}'::jsonb,
    'AMD'
  ),
  (
    'f6a7b8c9-d0e1-4f5a-8b9c-0d1e2f3a4b5c'::uuid,
    'NVIDIA GeForce RTX 4070',
    'nvidia-geforce-rtx-4070',
    'gpu',
    'Mid-range GPU offering strong 1440p gaming performance with 12GB GDDR6X memory, DLSS 3, and excellent power efficiency for mainstream gaming builds.',
    NULL,
    '{"vram": "12 GB GDDR6X", "cuda_cores": 5888, "base_clock": "1920 MHz", "boost_clock": "2475 MHz", "tdp": "200W", "interface": "PCIe 4.0 x16", "memory_bus": "192-bit"}'::jsonb,
    'NVIDIA'
  ),
  (
    'aa4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a'::uuid,
    'NVIDIA GeForce RTX 4080',
    'nvidia-geforce-rtx-4080',
    'gpu',
    'High-performance graphics card with 16GB GDDR6X memory, perfect for 4K gaming and content creation with DLSS 3 and advanced ray tracing.',
    NULL,
    '{"vram": "16 GB GDDR6X", "cuda_cores": 9728, "base_clock": "2205 MHz", "boost_clock": "2505 MHz", "tdp": "320W", "interface": "PCIe 4.0 x16", "memory_bus": "256-bit"}'::jsonb,
    'NVIDIA'
  ),
  (
    'bb5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b'::uuid,
    'AMD Radeon RX 7800 XT',
    'amd-radeon-rx-7800-xt',
    'gpu',
    'Excellent 1440p gaming card with 16GB GDDR6 memory. Great value with strong rasterization performance and competitive pricing.',
    NULL,
    '{"vram": "16 GB GDDR6", "stream_processors": 3840, "game_clock": "2124 MHz", "boost_clock": "2430 MHz", "tdp": "263W", "interface": "PCIe 4.0 x16", "memory_bus": "256-bit"}'::jsonb,
    'AMD'
  ),
  (
    'cc6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c'::uuid,
    'NVIDIA GeForce RTX 4060',
    'nvidia-geforce-rtx-4060',
    'gpu',
    '1440p gaming card with 8GB GDDR6 memory, DLSS 3, and excellent power efficiency for entry-level builds.',
    NULL,
    '{"vram": "8 GB GDDR6", "cuda_cores": 4352, "base_clock": "2310 MHz", "boost_clock": "2535 MHz", "tdp": "160W", "interface": "PCIe 4.0 x16", "memory_bus": "128-bit"}'::jsonb,
    'NVIDIA'
  ),
  (
    'dd7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d'::uuid,
    'AMD Radeon RX 7600',
    'amd-radeon-rx-7600',
    'gpu',
    'Entry-level gaming card with 8GB GDDR6 memory, perfect for 1080p gaming at high settings with excellent value for budget builds.',
    NULL,
    '{"vram": "8 GB GDDR6", "stream_processors": 2048, "game_clock": "2250 MHz", "boost_clock": "2655 MHz", "tdp": "165W", "interface": "PCIe 4.0 x16", "memory_bus": "128-bit"}'::jsonb,
    'AMD'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMPUTER PARTS - RAM
-- ============================================================================

INSERT INTO computer_parts (id, name, slug, category, description, image, specs_json, manufacturer) VALUES
  (
    'a7b8c9d0-e1f2-4a5b-8c9d-0e1f2a3b4c5d'::uuid,
    'Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz',
    'corsair-vengeance-ddr5-32gb-6000mhz',
    'ram',
    'High-performance DDR5 memory kit with 32GB capacity running at 6000MHz. Features low-latency timings and heat spreaders for stable overclocking on modern platforms.',
    NULL,
    '{"capacity": "32 GB", "type": "DDR5", "speed": "6000 MHz", "cas_latency": "CL30", "voltage": "1.35V", "form_factor": "DIMM", "kit_configuration": "2x16GB"}'::jsonb,
    'Corsair'
  ),
  (
    'b8c9d0e1-f2a3-4b5c-8d9e-0f1a2b3c4d5e'::uuid,
    'G.Skill Trident Z5 RGB 64GB (2x32GB) 6400MHz',
    'gskill-trident-z5-rgb-64gb-6400mhz',
    'ram',
    'Premium DDR5 RGB memory kit with 64GB capacity and 6400MHz speed. Features stunning RGB lighting and excellent overclocking potential for high-end builds.',
    NULL,
    '{"capacity": "64 GB", "type": "DDR5", "speed": "6400 MHz", "cas_latency": "CL32", "voltage": "1.4V", "form_factor": "DIMM", "kit_configuration": "2x32GB"}'::jsonb,
    'G.Skill'
  ),
  (
    'aa8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e'::uuid,
    'Kingston FURY Beast DDR4 16GB (2x8GB) 3200MHz',
    'kingston-fury-beast-ddr4-16gb-3200mhz',
    'ram',
    'Reliable DDR4 memory kit with 16GB capacity and 3200MHz speed. Great value for budget builds with solid performance and low-profile design.',
    NULL,
    '{"capacity": "16 GB", "type": "DDR4", "speed": "3200 MHz", "cas_latency": "CL16", "voltage": "1.35V", "form_factor": "DIMM", "kit_configuration": "2x8GB"}'::jsonb,
    'Kingston'
  ),
  (
    'bb9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f'::uuid,
    'Corsair Dominator Platinum RGB 32GB (2x16GB) 5600MHz',
    'corsair-dominator-platinum-rgb-32gb-5600mhz',
    'ram',
    'Premium DDR5 memory with stunning RGB lighting and exceptional build quality. Optimized for Intel and AMD platforms with tight timings.',
    NULL,
    '{"capacity": "32 GB", "type": "DDR5", "speed": "5600 MHz", "cas_latency": "CL36", "voltage": "1.25V", "form_factor": "DIMM", "kit_configuration": "2x16GB"}'::jsonb,
    'Corsair'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMPUTER PARTS - Storage
-- ============================================================================

INSERT INTO computer_parts (id, name, slug, category, description, image, specs_json, manufacturer) VALUES
  (
    'c9d0e1f2-a3b4-4c5d-8e9f-0a1b2c3d4e5f'::uuid,
    'Samsung 990 PRO 2TB NVMe SSD',
    'samsung-990-pro-2tb',
    'storage',
    'Flagship PCIe 4.0 NVMe SSD delivering sequential read speeds up to 7,450 MB/s. Perfect for gaming, content creation, and demanding workloads with exceptional endurance.',
    NULL,
    '{"capacity": "2 TB", "interface": "PCIe 4.0 x4 NVMe", "form_factor": "M.2 2280", "read_speed": "7450 MB/s", "write_speed": "6900 MB/s", "tbw": "1200 TB", "dram_cache": true}'::jsonb,
    'Samsung'
  ),
  (
    'd0e1f2a3-b4c5-4d5e-8f9a-0b1c2d3e4f5a'::uuid,
    'WD Black SN850X 1TB NVMe SSD',
    'wd-black-sn850x-1tb',
    'storage',
    'High-performance PCIe 4.0 NVMe SSD with 1TB capacity, ideal for gaming with fast load times and excellent sustained performance.',
    NULL,
    '{"capacity": "1 TB", "interface": "PCIe 4.0 x4 NVMe", "form_factor": "M.2 2280", "read_speed": "7300 MB/s", "write_speed": "6300 MB/s", "tbw": "600 TB", "dram_cache": true}'::jsonb,
    'Western Digital'
  ),
  (
    'aa0e1f2a-3b4c-5d6e-7f8a-9b0c1d2e3f4a'::uuid,
    'Crucial P3 Plus 4TB NVMe SSD',
    'crucial-p3-plus-4tb',
    'storage',
    'Large capacity PCIe 4.0 NVMe SSD offering excellent value with 4TB storage. Perfect for game libraries and media storage with solid performance.',
    NULL,
    '{"capacity": "4 TB", "interface": "PCIe 4.0 x4 NVMe", "form_factor": "M.2 2280", "read_speed": "5000 MB/s", "write_speed": "4200 MB/s", "tbw": "800 TB", "dram_cache": false}'::jsonb,
    'Crucial'
  ),
  (
    'bb1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b'::uuid,
    'Samsung 870 EVO 2TB SATA SSD',
    'samsung-870-evo-2tb',
    'storage',
    'Reliable SATA SSD with 2TB capacity and excellent endurance. Great for secondary storage or upgrading older systems with SATA interfaces.',
    NULL,
    '{"capacity": "2 TB", "interface": "SATA III 6Gb/s", "form_factor": "2.5 inch", "read_speed": "560 MB/s", "write_speed": "530 MB/s", "tbw": "1200 TB", "dram_cache": true}'::jsonb,
    'Samsung'
  ),
  (
    'cc2a3b4c-5d6e-7f8a-9b0c-1d2e3f4a5b6c'::uuid,
    'Kingston NV2 500GB NVMe SSD',
    'kingston-nv2-500gb',
    'storage',
    'Budget-friendly NVMe SSD with 500GB capacity, perfect for OS drive in budget builds with significantly faster speeds than SATA.',
    NULL,
    '{"capacity": "500 GB", "interface": "PCIe 4.0 x4 NVMe", "form_factor": "M.2 2280", "read_speed": "3500 MB/s", "write_speed": "2100 MB/s", "tbw": "160 TB", "dram_cache": false}'::jsonb,
    'Kingston'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ARTICLES - Computer Architecture
-- ============================================================================

INSERT INTO articles (id, title, slug, content, excerpt, cover_image, topic_id, published_at, is_featured) VALUES
  (
    '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid,
    'Understanding CPU Architecture: A Comprehensive Guide',
    'understanding-cpu-architecture',
    '# Understanding CPU Architecture

## Introduction

The Central Processing Unit (CPU) is the brain of any computer system. Understanding its architecture is fundamental to computer science and helps in making informed decisions when building or upgrading systems.

## Core Components

### Control Unit (CU)
The control unit orchestrates all CPU operations by:
- Fetching instructions from memory
- Decoding instructions
- Executing instructions
- Storing results

### Arithmetic Logic Unit (ALU)
The ALU performs all arithmetic and logical operations including:
- Addition, subtraction, multiplication, division
- Logical AND, OR, NOT, XOR operations
- Comparison operations

### Registers
Registers are small, ultra-fast storage locations within the CPU that hold:
- **Program Counter (PC)**: Address of next instruction
- **Instruction Register (IR)**: Current instruction being executed
- **Accumulator (ACC)**: Temporary storage for calculations
- **General Purpose Registers**: Flexible storage for various operations

## Modern CPU Architectures

### x86-64 Architecture
The dominant architecture for desktop and server processors, developed by Intel and AMD. Key features:
- 64-bit processing capability
- Backward compatibility with 32-bit software
- Advanced instruction sets (SSE, AVX)
- Out-of-order execution
- Hyper-threading technology

### ARM Architecture
Energy-efficient RISC architecture used in mobile devices and increasingly in laptops:
- Simplified instruction set
- Lower power consumption
- High performance per watt
- Growing adoption in servers and workstations

## Performance Factors

### Clock Speed
Measured in GHz, indicates how many instruction cycles the CPU can execute per second. Modern CPUs range from 3.0 GHz to 6.0 GHz.

### Core Count
Multi-core processors can execute multiple instruction streams simultaneously:
- **Dual-core**: 2 cores, suitable for basic tasks
- **Quad-core**: 4 cores, standard for mainstream computing
- **Hexa-core and above**: 6+ cores for demanding workloads

### Cache Memory
CPU cache is organized in levels:
- **L1 Cache**: Smallest (32-64 KB per core) but fastest
- **L2 Cache**: Larger (256-512 KB per core), slightly slower
- **L3 Cache**: Shared cache (8-64 MB), slower but much larger

### Thread Count
With technologies like Intel''s Hyper-Threading and AMD''s SMT, each physical core can handle two threads simultaneously, improving multitasking performance.

## Instruction Pipeline

Modern CPUs use pipelining to improve throughput:
1. **Fetch**: Retrieve instruction from memory
2. **Decode**: Interpret instruction
3. **Execute**: Perform operation
4. **Memory Access**: Read/write data
5. **Write Back**: Store results

This allows multiple instructions to be in different stages simultaneously, significantly improving performance.

## Conclusion

Understanding CPU architecture helps in:
- Choosing the right processor for specific needs
- Optimizing software performance
- Troubleshooting system bottlenecks
- Making informed upgrade decisions

Modern CPUs are marvels of engineering with billions of transistors working in harmony to power our digital world.',
    'Learn about CPU architecture, including core components, modern designs like x86-64 and ARM, performance factors, and how instruction pipelining works.',
    NULL,
    'f7c9a3e1-8b4d-4c5e-a6f2-1d3e7b9c2a4f'::uuid,
    NOW() - INTERVAL '5 days',
    true
  ),
  (
    '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid,
    'Graphics Processing Units (GPUs): Beyond Gaming',
    'gpus-beyond-gaming',
    '# Graphics Processing Units (GPUs): Beyond Gaming

## What is a GPU?

A Graphics Processing Unit (GPU) is a specialized processor designed for parallel processing of graphics and computational tasks. While initially developed for rendering graphics in games, modern GPUs have become essential for various computing workloads.

## GPU Architecture

### Streaming Multiprocessors (SMs)
GPUs contain hundreds or thousands of cores organized into streaming multiprocessors:
- **NVIDIA**: CUDA cores grouped in SMs
- **AMD**: Stream processors grouped in Compute Units

### Memory Hierarchy
- **VRAM**: Dedicated high-bandwidth graphics memory (GDDR6/GDDR6X)
- **L1/L2 Cache**: Fast on-chip memory for frequently accessed data
- **Registers**: Per-thread storage for computations

## Applications Beyond Gaming

### Machine Learning and AI
GPUs excel at training neural networks due to:
- Massive parallel processing capability
- High memory bandwidth
- Specialized tensor cores for matrix operations
- Support for frameworks like CUDA, OpenCL

### Video Editing and Rendering
Professional content creators rely on GPUs for:
- Real-time video effects
- 3D rendering
- Color grading
- Encoding/decoding video streams

### Scientific Computing
Researchers use GPUs for:
- Molecular dynamics simulations
- Climate modeling
- Computational fluid dynamics
- Protein folding research

### Cryptocurrency Mining
Some cryptocurrencies use GPU-intensive proof-of-work algorithms, though this use case has declined with the rise of dedicated ASIC miners.

## GPU Technologies

### Ray Tracing
Modern GPUs feature dedicated ray tracing cores for realistic lighting:
- **RT Cores** (NVIDIA): Hardware-accelerated ray/triangle intersection
- **Ray Accelerators** (AMD): Similar functionality for RDNA architecture

### DLSS and FSR
AI-powered upscaling technologies improve performance:
- **DLSS** (Deep Learning Super Sampling): NVIDIA''s AI upscaling
- **FSR** (FidelityFX Super Resolution): AMD''s open-source upscaling

### Multi-GPU Configurations
- **SLI** (NVIDIA): Scalable Link Interface for multi-GPU gaming
- **CrossFire** (AMD): Similar multi-GPU technology
- **NVLink**: High-bandwidth GPU interconnect for professional workloads

## Choosing the Right GPU

### Considerations
1. **Use Case**: Gaming vs. professional workloads
2. **Resolution**: 1080p, 1440p, or 4K gaming
3. **VRAM**: 8GB minimum for modern games, 16GB+ for content creation
4. **Power Requirements**: Ensure adequate PSU capacity
5. **Cooling**: Consider case airflow and noise levels

### Performance Metrics
- **TFLOPS**: Theoretical floating-point performance
- **Memory Bandwidth**: Data transfer rate to/from VRAM
- **Frame Rates**: FPS in target games at desired settings

## Conclusion

GPUs have evolved from simple graphics accelerators to powerful parallel processors essential for modern computing. Whether gaming, creating content, training AI models, or conducting scientific research, understanding GPU architecture and capabilities is crucial for optimal system performance.',
    'Explore GPU architecture, applications beyond gaming including AI and scientific computing, ray tracing technology, and how to choose the right graphics card.',
    NULL,
    'f7c9a3e1-8b4d-4c5e-a6f2-1d3e7b9c2a4f'::uuid,
    NOW() - INTERVAL '3 days',
    true
  ),
  (
    '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid,
    'Memory Hierarchy: From Registers to Cloud Storage',
    'memory-hierarchy-explained',
    '# Memory Hierarchy: From Registers to Cloud Storage

## The Memory Pyramid

Computer systems use a hierarchical memory structure trading off speed, cost, and capacity. Understanding this hierarchy is essential for optimizing system performance.

## Levels of Memory Hierarchy

### Level 1: CPU Registers (Fastest, Smallest)
- **Access Time**: <1 nanosecond
- **Capacity**: 32-256 bytes per core
- **Purpose**: Hold data for immediate CPU operations
- **Volatility**: Volatile

### Level 2: CPU Cache
#### L1 Cache
- **Access Time**: 1-2 nanoseconds
- **Capacity**: 32-64 KB per core
- **Split**: Separate instruction and data caches

#### L2 Cache
- **Access Time**: 3-10 nanoseconds
- **Capacity**: 256-512 KB per core
- **Purpose**: Bridge between L1 and L3

#### L3 Cache
- **Access Time**: 10-20 nanoseconds
- **Capacity**: 8-64 MB shared
- **Purpose**: Reduce main memory access

### Level 3: Main Memory (RAM)
- **Access Time**: 50-100 nanoseconds
- **Capacity**: 8-128 GB typical systems
- **Technology**: DDR4/DDR5 SDRAM
- **Volatility**: Volatile
- **Bandwidth**: 25-100 GB/s

### Level 4: SSD Storage
- **Access Time**: 10-100 microseconds
- **Capacity**: 256 GB - 8 TB
- **Technology**: NAND flash (NVMe, SATA)
- **Volatility**: Non-volatile
- **Sequential Read**: 500-7,500 MB/s

### Level 5: HDD Storage
- **Access Time**: 5-10 milliseconds
- **Capacity**: 500 GB - 20 TB
- **Technology**: Magnetic platters
- **Volatility**: Non-volatile
- **Sequential Read**: 80-200 MB/s

### Level 6: Cloud Storage (Slowest, Largest)
- **Access Time**: Varies by network (100ms+)
- **Capacity**: Virtually unlimited
- **Technology**: Distributed file systems
- **Accessibility**: Network-dependent

## Memory Technologies

### DDR5 vs DDR4
**DDR5 Advantages:**
- Higher bandwidth (4800-8400 MT/s vs 2133-3200 MT/s)
- Lower voltage (1.1V vs 1.2V)
- Larger capacity per module (up to 128GB)
- On-die ECC

**DDR4:**
- Lower cost
- Mature ecosystem
- Sufficient for most applications

### Storage: NVMe vs SATA
**NVMe PCIe 4.0:**
- Sequential read: 7,000+ MB/s
- Low latency: Direct PCIe connection
- Better for: OS drive, gaming, content creation

**SATA III:**
- Sequential read: ~550 MB/s
- Lower cost per GB
- Better for: Mass storage, archival data

## Cache Coherency

In multi-core systems, cache coherency protocols ensure data consistency:
- **MESI Protocol**: Modified, Exclusive, Shared, Invalid states
- **MOESI**: Adds Owner state for optimization
- **Snooping**: Monitors cache activity on shared bus

## Virtual Memory

Operating systems use virtual memory to:
- Provide each process with isolated address space
- Enable running programs larger than physical RAM
- Implement memory protection between processes
- Use page files/swap space as extended memory

## Performance Optimization

### Locality of Reference
Programs perform better when they exhibit:
- **Temporal Locality**: Recently accessed data likely accessed again
- **Spatial Locality**: Data near recently accessed locations likely needed

### Prefetching
Modern CPUs predict future memory accesses:
- **Hardware Prefetching**: Automatic pattern detection
- **Software Prefetching**: Compiler-inserted hints

## Conclusion

The memory hierarchy balances the competing demands of speed, capacity, and cost. Understanding this hierarchy enables:
- Intelligent system component selection
- Software optimization for better cache utilization
- Troubleshooting performance bottlenecks
- Informed decisions about system upgrades and configurations',
    'Comprehensive guide to computer memory hierarchy from CPU registers to cloud storage, covering cache levels, RAM technologies, storage options, and optimization strategies.',
    NULL,
    'f7c9a3e1-8b4d-4c5e-a6f2-1d3e7b9c2a4f'::uuid,
    NOW() - INTERVAL '7 days',
    false
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ARTICLES - Networking
-- ============================================================================

INSERT INTO articles (id, title, slug, content, excerpt, cover_image, topic_id, published_at, is_featured) VALUES
  (
    '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'::uuid,
    'TCP/IP Protocol Suite: The Foundation of Internet Communication',
    'tcp-ip-protocol-suite',
    '# TCP/IP Protocol Suite: The Foundation of Internet Communication

## Introduction

The TCP/IP (Transmission Control Protocol/Internet Protocol) suite is the fundamental communication protocol that powers the internet and most modern networks. Understanding its layers and protocols is essential for network professionals and developers.

## The Four-Layer TCP/IP Model

### Layer 1: Network Access (Link Layer)
Handles physical transmission of data:
- **Ethernet**: Wired LAN communication
- **Wi-Fi (802.11)**: Wireless networking
- **PPP**: Point-to-Point Protocol for serial connections
- **ARP**: Address Resolution Protocol (maps IP to MAC addresses)

### Layer 2: Internet Layer
Responsible for addressing and routing packets:
- **IP (Internet Protocol)**: Packet addressing and routing
- **ICMP**: Error reporting and diagnostics (ping, traceroute)
- **IPsec**: Secure IP communication
- **IGMP**: Multicast group management

### Layer 3: Transport Layer
Provides end-to-end communication services:

#### TCP (Transmission Control Protocol)
- **Connection-oriented**: Three-way handshake establishes connection
- **Reliable**: Guarantees packet delivery and order
- **Flow control**: Prevents sender from overwhelming receiver
- **Use cases**: Web browsing, email, file transfer

#### UDP (User Datagram Protocol)
- **Connectionless**: No handshake required
- **Unreliable**: No delivery guarantees
- **Low latency**: Minimal overhead
- **Use cases**: Streaming, gaming, DNS queries

### Layer 4: Application Layer
High-level protocols for specific services:
- **HTTP/HTTPS**: Web communication
- **FTP**: File transfer
- **SMTP/POP3/IMAP**: Email
- **DNS**: Domain name resolution
- **SSH**: Secure remote access
- **DHCP**: Dynamic IP configuration

## TCP Three-Way Handshake

Connection establishment process:
1. **SYN**: Client sends synchronization request
2. **SYN-ACK**: Server acknowledges and synchronizes
3. **ACK**: Client acknowledges, connection established

## IP Addressing

### IPv4
- **Format**: 32-bit address (e.g., 192.168.1.1)
- **Total Addresses**: ~4.3 billion
- **Classes**: A, B, C, D, E
- **Private Ranges**: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16

### IPv6
- **Format**: 128-bit address (e.g., 2001:0db8::1)
- **Total Addresses**: 340 undecillion
- **Benefits**: Eliminates NAT necessity, improved security
- **Adoption**: Growing but coexists with IPv4

## Subnetting and CIDR

### Subnet Masks
Divide networks into smaller segments:
- **255.255.255.0** (/24): 254 usable hosts
- **255.255.0.0** (/16): 65,534 usable hosts
- **255.0.0.0** (/8): 16,777,214 usable hosts

### CIDR Notation
Classless Inter-Domain Routing for efficient addressing:
- **192.168.1.0/24**: Network with 256 addresses
- **10.0.0.0/8**: Large private network

## NAT (Network Address Translation)

Allows multiple devices to share a single public IP:
- **Static NAT**: One-to-one mapping
- **Dynamic NAT**: Pool of public IPs
- **PAT (Port Address Translation)**: Overloading with port numbers

## Quality of Service (QoS)

Prioritize network traffic for optimal performance:
- **DSCP**: Differentiated Services Code Point marking
- **Traffic Shaping**: Control bandwidth usage
- **Queuing**: Manage packet priority

## Common Network Tools

### Diagnostic Tools
- **ping**: Test reachability (ICMP echo)
- **traceroute/tracert**: Trace packet path
- **netstat**: Network statistics and connections
- **nslookup/dig**: DNS queries
- **wireshark**: Packet analysis

## Security Considerations

### Firewalls
Filter traffic based on rules:
- **Stateful**: Track connection state
- **Stateless**: Examine individual packets
- **Application-level**: Deep packet inspection

### VPN (Virtual Private Network)
Secure tunneling protocols:
- **IPsec**: Network-layer VPN
- **SSL/TLS VPN**: Application-layer VPN
- **WireGuard**: Modern, lightweight VPN

## Conclusion

TCP/IP is the backbone of modern networking. Mastering its concepts enables:
- Effective network troubleshooting
- Secure network design
- Optimal performance tuning
- Understanding of internet infrastructure',
    'Deep dive into the TCP/IP protocol suite covering the four-layer model, TCP vs UDP, IP addressing, subnetting, NAT, and essential network tools.',
    NULL,
    'a2b4c6d8-1e3f-5a7b-9c0d-2e4f6a8b0c1d'::uuid,
    NOW() - INTERVAL '4 days',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ARTICLE TAGS (Link articles to tags)
-- ============================================================================
-- CPU Architecture article tags
INSERT INTO article_tags (article_id, tag_id) VALUES
  ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid, '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid), -- Hardware
  ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid, '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid), -- CPU
  ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid, '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c'::uuid), -- Performance
  ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid, '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f'::uuid), -- Components
  ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid, '0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a'::uuid) -- Architecture
ON CONFLICT (article_id, tag_id) DO NOTHING;

-- GPU article tags
INSERT INTO article_tags (article_id, tag_id) VALUES
  ('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid), -- Hardware
  ('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid), -- GPU
  ('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d'::uuid), -- Gaming
  ('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c'::uuid) -- Performance
ON CONFLICT (article_id, tag_id) DO NOTHING;

-- Memory Hierarchy article tags
INSERT INTO article_tags (article_id, tag_id) VALUES
  ('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid), -- Hardware
  ('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'::uuid), -- Memory
  ('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b'::uuid), -- Storage
  ('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c'::uuid) -- Performance
ON CONFLICT (article_id, tag_id) DO NOTHING;

-- TCP/IP article tags
INSERT INTO article_tags (article_id, tag_id) VALUES
  ('4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'::uuid, '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e'::uuid) -- Specifications
ON CONFLICT (article_id, tag_id) DO NOTHING;

-- ============================================================================
-- RELATED ARTICLES
-- ============================================================================

-- CPU Architecture related articles
INSERT INTO related_articles (article_id, related_article_id, "order") VALUES
  ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid, '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, 1),
  ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid, '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, 2)
ON CONFLICT (article_id, related_article_id) DO NOTHING;

-- GPU article related articles
INSERT INTO related_articles (article_id, related_article_id, "order") VALUES
  ('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid, 1),
  ('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, 2)
ON CONFLICT (article_id, related_article_id) DO NOTHING;

-- Memory Hierarchy related articles
INSERT INTO related_articles (article_id, related_article_id, "order") VALUES
  ('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid, 1),
  ('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid, '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid, 2)
ON CONFLICT (article_id, related_article_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  article_count INTEGER;
  part_count INTEGER;
  tag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO article_count FROM articles;
  SELECT COUNT(*) INTO part_count FROM computer_parts;
  SELECT COUNT(*) INTO tag_count FROM tags;
  
  RAISE NOTICE 'Seed data loaded successfully:';
  RAISE NOTICE '  - % articles', article_count;
  RAISE NOTICE '  - % computer parts', part_count;
  RAISE NOTICE '  - % tags', tag_count;
END $$;
