/**
 * Part Model
 * Task T078: Computer hardware part entity with admin extensions
 */

/**
 * Base Part interface (public-facing)
 */
export interface Part {
  id: string;
  name: string;
  slug: string;
  part_type: string; // CPU, GPU, RAM, Storage, Motherboard, PSU, Case, Cooling
  brand: string;
  description: string | null;
  specs: PartSpecs; // JSONB field
  images: string[]; // Array of Supabase Storage URLs
  price: number | null; // Optional pricing information
  created_at: string;
  updated_at: string;
}

/**
 * Part specifications (stored as JSONB)
 * Flexible structure allowing predefined and custom fields
 */
export interface PartSpecs {
  // Common predefined fields (all optional)
  'CPU Speed'?: string;
  'Cores'?: string;
  'Threads'?: string;
  'Base Clock'?: string;
  'Boost Clock'?: string;
  'TDP'?: string;
  'RAM Size'?: string;
  'RAM Type'?: string;
  'RAM Speed'?: string;
  'Storage Capacity'?: string;
  'Storage Type'?: string;
  'GPU Model'?: string;
  'VRAM'?: string;
  'Interface'?: string;
  
  // Allow custom fields
  [key: string]: string | undefined;
}

/**
 * Part with admin-specific fields
 * Task T078: Extension for admin dashboard
 */
export interface PartAdmin extends Part {
  deleted_at: string | null; // Soft-delete timestamp
}

/**
 * Part form data (DTO for create/update)
 */
export interface PartFormData {
  name: string;
  slug: string;
  part_type: string;
  brand: string;
  description: string | null;
  specs: PartSpecs;
  images: string[];
  price: number | null;
}
