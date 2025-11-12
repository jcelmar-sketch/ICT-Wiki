# Database Management Scripts

This directory contains SQL scripts for managing the ICT Wiki database.

## Scripts Overview

### 1. `reset-and-setup-admin.sql`
Clears all data from the database and creates an admin user record.

**⚠️ WARNING:** This will delete ALL data in the database!

**Usage:**
```bash
# Using Supabase SQL Editor (recommended)
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of reset-and-setup-admin.sql
4. Click "Run"

# Or using psql command line
psql -h db.YOUR_PROJECT.supabase.co -p 5432 -U postgres -d postgres -f scripts/reset-and-setup-admin.sql
```

**After running, you MUST create the admin user in Supabase Auth:**
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" > "Create new user"
3. Email: `admin@ictwiki.local`
4. Password: `Admin123!` (or your preferred password)
5. Enable "Auto Confirm User"
6. Click "Create user"

### 2. `seed-database.sql`
Populates the database with sample data including:
- 3 Topics (Computer, Network, Software)
- 10 Tags
- 20+ Computer Parts (CPUs, GPUs, RAM, Storage)
- 4 Sample Articles
- Article tags and relationships

**Usage:**
```bash
# Using Supabase SQL Editor (recommended)
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of seed-database.sql
4. Click "Run"

# Or using psql command line
psql -h db.YOUR_PROJECT.supabase.co -p 5432 -U postgres -d postgres -f scripts/seed-database.sql
```

### 3. `manage-database.ps1` (PowerShell helper)
Automates the execution of SQL scripts with helpful prompts.

**Usage:**
```powershell
# Full setup (reset + seed)
.\scripts\manage-database.ps1 -Action full

# Reset only
.\scripts\manage-database.ps1 -Action reset

# Seed only
.\scripts\manage-database.ps1 -Action seed
```

## Quick Start Guide

### First Time Setup

1. **Apply database migrations** (if not already done):
   ```bash
   # Apply the three migration files via Supabase SQL Editor
   # - scripts/migrations/001_create_admin_tables.sql
   # - scripts/migrations/002_admin_rls_policies.sql
   # - scripts/migrations/003_admin_triggers.sql
   ```

2. **Reset and setup admin**:
   ```bash
   # Run reset-and-setup-admin.sql via Supabase SQL Editor
   ```

3. **Create admin user in Supabase Auth**:
   - Email: `admin@ictwiki.local`
   - Password: `Admin123!`
   - Auto-confirm: Yes

4. **Seed sample data**:
   ```bash
   # Run seed-database.sql via Supabase SQL Editor
   ```

5. **Test login**:
   - Navigate to `/admin/login`
   - Login with `admin@ictwiki.local` / `Admin123!`

### Development Workflow

When you need to reset your development database:

```bash
# 1. Clear all data and recreate admin record
Run: reset-and-setup-admin.sql

# 2. Recreate admin user in Supabase Auth
Go to Supabase Dashboard > Authentication > Users > Add user

# 3. Populate with sample data
Run: seed-database.sql

# 4. Test
Login at /admin/login
```

## Computer Parts Categories

The seed data includes parts in these categories:

- **cpu**: Processors (Intel Core i9, AMD Ryzen 9, etc.)
- **gpu**: Graphics cards (NVIDIA RTX 4090, AMD RX 7900 XTX, etc.)
- **ram**: Memory modules (DDR4/DDR5)
- **storage**: SSDs and hard drives (NVMe, SATA)

## Database Credentials

### Admin User (Default)
- **Email**: `admin@ictwiki.local`
- **Password**: `Admin123!` (change after first login)
- **Role**: `super_admin`

### Supabase Connection
Find your connection details in:
- Supabase Dashboard > Settings > Database
- Connection string format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## Troubleshooting

### Error: "Cannot find module"
Make sure you're in the project root directory when running scripts.

### Error: "Permission denied"
Ensure you're using the service role key, not the anon key.

### Admin user can't login
1. Verify the user exists in Supabase Auth (Dashboard > Authentication > Users)
2. Check that email matches: `admin@ictwiki.local`
3. Ensure user is confirmed (not in "Waiting for verification" state)
4. Check browser console for error messages

### No computer parts showing on /tabs/parts
1. Verify seed-database.sql was executed successfully
2. Check Supabase Dashboard > Table Editor > computer_parts
3. Ensure RLS policies allow read access (they should for public data)

## Notes

- All UUIDs are hardcoded for consistency across environments
- `ON CONFLICT DO NOTHING` prevents duplicate data on re-runs
- Image fields are NULL (placeholders) - update with real URLs as needed
- Admin user record is created but auth is handled by Supabase Auth
- RLS policies ensure only admins can modify data
