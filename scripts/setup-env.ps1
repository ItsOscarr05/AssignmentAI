# Function to generate a secure random string
function Generate-Secret {
    $bytes = New-Object Byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    [Convert]::ToBase64String($bytes)
}

# Function to prompt for sensitive values
function Prompt-ForValue {
    param (
        [string]$prompt,
        [string]$currentValue
    )
    if (-not [string]::IsNullOrEmpty($currentValue)) {
        Write-Host "Current value: $currentValue"
        $overwrite = Read-Host "Do you want to overwrite this value? (y/n)"
        if ($overwrite -ne 'y') {
            return $currentValue
        }
    }
    $value = Read-Host "Enter $prompt (press Enter to generate random)"
    if ([string]::IsNullOrEmpty($value)) {
        $value = Generate-Secret
    }
    return $value
}

# Function to get current value from environment file
function Get-CurrentValue {
    param (
        [string]$file,
        [string]$key
    )
    $content = Get-Content $file
    $line = $content | Where-Object { $_ -match "^$key=" }
    if ($line) {
        return $line.Split('=')[1]
    }
    return ""
}

# Create environment files if they don't exist
$envFiles = @("development", "staging", "production")
foreach ($env in $envFiles) {
    $envFile = ".env.$env"
    if (-not (Test-Path $envFile)) {
        Copy-Item ".env.example" $envFile
        Write-Host "Created $envFile"
    }
}

# Prompt for sensitive values
Write-Host "Setting up environment variables..."
Write-Host "Note: Press Enter to generate random values for sensitive data"

# Development environment
Write-Host "`nDevelopment Environment:"
$devToken = Prompt-ForValue "development auth token" (Get-CurrentValue ".env.development" "VITE_AUTH_TOKEN_KEY")
$devRefresh = Prompt-ForValue "development refresh token" (Get-CurrentValue ".env.development" "VITE_REFRESH_TOKEN_KEY")
$devCsrf = Prompt-ForValue "development CSRF token" (Get-CurrentValue ".env.development" "VITE_CSRF_TOKEN_KEY")

# Staging environment
Write-Host "`nStaging Environment:"
$stagingToken = Prompt-ForValue "staging auth token" (Get-CurrentValue ".env.staging" "VITE_AUTH_TOKEN_KEY")
$stagingRefresh = Prompt-ForValue "staging refresh token" (Get-CurrentValue ".env.staging" "VITE_REFRESH_TOKEN_KEY")
$stagingCsrf = Prompt-ForValue "staging CSRF token" (Get-CurrentValue ".env.staging" "VITE_CSRF_TOKEN_KEY")

# Production environment
Write-Host "`nProduction Environment:"
$prodToken = Prompt-ForValue "production auth token" (Get-CurrentValue ".env.production" "VITE_AUTH_TOKEN_KEY")
$prodRefresh = Prompt-ForValue "production refresh token" (Get-CurrentValue ".env.production" "VITE_REFRESH_TOKEN_KEY")
$prodCsrf = Prompt-ForValue "production CSRF token" (Get-CurrentValue ".env.production" "VITE_CSRF_TOKEN_KEY")

# Update environment files
$envFiles = @{
    "development" = @{
        "token" = $devToken
        "refresh" = $devRefresh
        "csrf" = $devCsrf
    }
    "staging" = @{
        "token" = $stagingToken
        "refresh" = $stagingRefresh
        "csrf" = $stagingCsrf
    }
    "production" = @{
        "token" = $prodToken
        "refresh" = $prodRefresh
        "csrf" = $prodCsrf
    }
}

# Save generated values to a secure file
$secureFile = "generated-secrets.txt"
$secureContent = @"
Generated Environment Values
===========================

Development Environment:
- Auth Token: $devToken
- Refresh Token: $devRefresh
- CSRF Token: $devCsrf

Staging Environment:
- Auth Token: $stagingToken
- Refresh Token: $stagingRefresh
- CSRF Token: $stagingCsrf

Production Environment:
- Auth Token: $prodToken
- Refresh Token: $prodRefresh
- CSRF Token: $prodCsrf

Note: This file contains sensitive information. Please store it securely and delete it after use.
"@

$secureContent | Set-Content $secureFile

foreach ($env in $envFiles.Keys) {
    $file = ".env.$env"
    $content = Get-Content $file
    $content = $content -replace "VITE_AUTH_TOKEN_KEY=.*", "VITE_AUTH_TOKEN_KEY=$($envFiles[$env].token)"
    $content = $content -replace "VITE_REFRESH_TOKEN_KEY=.*", "VITE_REFRESH_TOKEN_KEY=$($envFiles[$env].refresh)"
    $content = $content -replace "VITE_CSRF_TOKEN_KEY=.*", "VITE_CSRF_TOKEN_KEY=$($envFiles[$env].csrf)"
    $content | Set-Content $file
}

Write-Host "`nEnvironment setup complete!"
Write-Host "Generated values have been saved to $secureFile"
Write-Host "Please store these values securely and delete the file after use."
Write-Host "Never commit these values to version control." 