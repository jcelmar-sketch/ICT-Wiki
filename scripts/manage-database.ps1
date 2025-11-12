# ============================================================================
# ICT Wiki Database Management Script
# Manages database reset, admin setup, and data seeding
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("reset", "seed", "full")]
    [string]$Action = "full",
    
    [Parameter(Mandatory=$false)]
    [string]$SupabaseUrl = $env:SUPABASE_URL,
    
    [Parameter(Mandatory=$false)]
    [string]$SupabaseKey = $env:SUPABASE_SERVICE_KEY
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "ICT Wiki Database Management" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase credentials are available
if (-not $SupabaseUrl -or -not $SupabaseKey) {
    Write-Host "ERROR: Supabase credentials not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set environment variables or provide parameters:" -ForegroundColor Yellow
    Write-Host "  - SUPABASE_URL or -SupabaseUrl" -ForegroundColor Yellow
    Write-Host "  - SUPABASE_SERVICE_KEY or -SupabaseKey" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host "  .\scripts\manage-database.ps1 -Action full -SupabaseUrl 'https://xxx.supabase.co' -SupabaseKey 'xxx'" -ForegroundColor Yellow
    exit 1
}

# Function to execute SQL via Supabase REST API
function Invoke-SupabaseSql {
    param(
        [string]$SqlFile,
        [string]$Description
    )
    
    Write-Host "Executing: $Description" -ForegroundColor Yellow
    
    if (-not (Test-Path $SqlFile)) {
        Write-Host "  ERROR: File not found: $SqlFile" -ForegroundColor Red
        return $false
    }
    
    $sqlContent = Get-Content $SqlFile -Raw
    
    try {
        $headers = @{
            "apikey" = $SupabaseKey
            "Authorization" = "Bearer $SupabaseKey"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            query = $sqlContent
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod `
            -Uri "$SupabaseUrl/rest/v1/rpc/exec_sql" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "  SUCCESS: $Description completed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ERROR: Failed to execute SQL" -ForegroundColor Red
        Write-Host "  Details: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to execute SQL using psql (alternative method)
function Invoke-PsqlCommand {
    param(
        [string]$SqlFile,
        [string]$Description
    )
    
    Write-Host "Executing: $Description" -ForegroundColor Yellow
    
    if (-not (Test-Path $SqlFile)) {
        Write-Host "  ERROR: File not found: $SqlFile" -ForegroundColor Red
        return $false
    }
    
    # Extract connection string from Supabase URL
    $dbUrl = $SupabaseUrl -replace "https://", ""
    $projectRef = $dbUrl -split "\." | Select-Object -First 1
    
    Write-Host ""
    Write-Host "  MANUAL STEP REQUIRED:" -ForegroundColor Yellow
    Write-Host "  Please run the following command manually:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  psql -h db.$projectRef.supabase.co -p 5432 -U postgres -d postgres -f `"$SqlFile`"" -ForegroundColor White
    Write-Host ""
    Write-Host "  You can find the database password in your Supabase project settings." -ForegroundColor Gray
    Write-Host ""
    
    $confirm = Read-Host "  Have you executed the SQL file? (y/n)"
    return ($confirm -eq "y")
}

# Main execution logic
Write-Host "Action: $Action" -ForegroundColor Cyan
Write-Host ""

$scriptsDir = "$PSScriptRoot"
$resetScript = "$scriptsDir\reset-and-setup-admin.sql"
$seedScript = "$scriptsDir\seed-database.sql"

switch ($Action) {
    "reset" {
        Write-Host "Resetting database and creating admin user..." -ForegroundColor Yellow
        Write-Host ""
        
        if (Invoke-PsqlCommand -SqlFile $resetScript -Description "Database Reset & Admin Setup") {
            Write-Host ""
            Write-Host "============================================" -ForegroundColor Green
            Write-Host "Database reset complete!" -ForegroundColor Green
            Write-Host "============================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "IMPORTANT: Create admin user in Supabase Auth" -ForegroundColor Yellow
            Write-Host "  1. Go to: $SupabaseUrl" -ForegroundColor Cyan
            Write-Host "  2. Navigate to: Authentication > Users" -ForegroundColor Cyan
            Write-Host "  3. Click 'Add user' > 'Create new user'" -ForegroundColor Cyan
            Write-Host "  4. Email: admin@ictwiki.local" -ForegroundColor Cyan
            Write-Host "  5. Password: Admin123! (or your choice)" -ForegroundColor Cyan
            Write-Host "  6. Enable 'Auto Confirm User'" -ForegroundColor Cyan
            Write-Host ""
        }
    }
    
    "seed" {
        Write-Host "Seeding database with sample data..." -ForegroundColor Yellow
        Write-Host ""
        
        if (Invoke-PsqlCommand -SqlFile $seedScript -Description "Database Seeding") {
            Write-Host ""
            Write-Host "============================================" -ForegroundColor Green
            Write-Host "Database seeding complete!" -ForegroundColor Green
            Write-Host "============================================" -ForegroundColor Green
        }
    }
    
    "full" {
        Write-Host "Performing full database setup..." -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "Step 1: Reset database and create admin" -ForegroundColor Cyan
        if (Invoke-PsqlCommand -SqlFile $resetScript -Description "Database Reset & Admin Setup") {
            Write-Host ""
            
            Write-Host "Step 2: Seed database with sample data" -ForegroundColor Cyan
            if (Invoke-PsqlCommand -SqlFile $seedScript -Description "Database Seeding") {
                Write-Host ""
                Write-Host "============================================" -ForegroundColor Green
                Write-Host "Full database setup complete!" -ForegroundColor Green
                Write-Host "============================================" -ForegroundColor Green
                Write-Host ""
                Write-Host "IMPORTANT: Create admin user in Supabase Auth" -ForegroundColor Yellow
                Write-Host "  1. Go to: $SupabaseUrl" -ForegroundColor Cyan
                Write-Host "  2. Navigate to: Authentication > Users" -ForegroundColor Cyan
                Write-Host "  3. Click 'Add user' > 'Create new user'" -ForegroundColor Cyan
                Write-Host "  4. Email: admin@ictwiki.local" -ForegroundColor Cyan
                Write-Host "  5. Password: Admin123! (or your choice)" -ForegroundColor Cyan
                Write-Host "  6. Enable 'Auto Confirm User'" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "Then you can login at: $SupabaseUrl/admin/login" -ForegroundColor Cyan
            }
        }
    }
}

Write-Host ""
Write-Host "Script execution completed." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
