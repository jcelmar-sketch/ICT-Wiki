/**
 * Computer Part Entity Model
 * Matches Supabase computer_parts table schema from data-model.md
 */

/**
 * Valid computer part categories
 */
export type PartCategory =
  | 'cpu'
  | 'gpu'
  | 'ram'
  | 'storage'
  | 'motherboard'
  | 'psu'
  | 'cooling'
  | 'case'
  | 'peripherals';

/**
 * Base computer part interface
 */
export interface ComputerPart {
  id: string; // UUID
  name: string; // 5-255 chars
  slug: string; // URL-friendly identifier
  category: PartCategory;
  description: string; // 50-500 chars
  image_url: string | null; // HTTPS URL (from DB: image)
  specifications: PartSpecs; // Category-specific specifications (from DB: specs_json)
  manufacturer: string | null; // 2-100 chars
  model_number: string | null; // Optional model number
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Generic specifications object
 * Actual structure varies by category
 */
export interface PartSpecs {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * CPU-specific specifications
 */
export interface CpuSpecs extends PartSpecs {
  cores?: number;
  threads?: number;
  base_clock?: string; // e.g., '3.6 GHz'
  boost_clock?: string;
  socket?: string;
  tdp?: string; // e.g., '65W'
  cache?: string;
}

/**
 * GPU-specific specifications
 */
export interface GpuSpecs extends PartSpecs {
  memory?: string; // e.g., '8GB GDDR6'
  core_clock?: string;
  boost_clock?: string;
  interface?: string; // e.g., 'PCIe 4.0 x16'
  power_connectors?: string;
  tdp?: string;
}

/**
 * RAM-specific specifications
 */
export interface RamSpecs extends PartSpecs {
  capacity?: string; // e.g., '16GB'
  type?: string; // e.g., 'DDR4'
  speed?: string; // e.g., '3200 MHz'
  latency?: string; // e.g., 'CL16'
  voltage?: string;
}

/**
 * Storage-specific specifications
 */
export interface StorageSpecs extends PartSpecs {
  capacity?: string; // e.g., '1TB'
  type?: string; // 'SSD', 'HDD', 'NVMe'
  interface?: string; // e.g., 'M.2 NVMe', 'SATA'
  read_speed?: string; // e.g., '3500 MB/s'
  write_speed?: string;
  form_factor?: string;
}

/**
 * Part card display model
 * Minimal data for grid views
 */
export interface PartCard {
  id: string;
  name: string;
  slug: string;
  category: PartCategory;
  image_url: string | null;
  manufacturer: string | null;
  key_specs?: string[]; // e.g., ['8 cores', '16GB GDDR6']
}
