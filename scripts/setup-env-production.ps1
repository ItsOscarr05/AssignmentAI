# Setup .env.production file for AssignmentAI
# This script helps you create the production environment file

Write-Host "Setting up .env.production file for AssignmentAI" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if .env.production already exists
if (Test-Path ".env.production") {
    Write-Host "WARNING: .env.production already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Setup cancelled. Existing file preserved." -ForegroundColor Red
        exit 0
    }
}

# Copy template
Write-Host "`nCopying environment template..." -ForegroundColor Yellow
Copy-Item "env.production.template" ".env.production"

Write-Host "SUCCESS: .env.production file created!" -ForegroundColor Green

# Prompt for critical variables
Write-Host "`nPlease provide the following critical environment variables:" -ForegroundColor Yellow

# ACME Email (required for SSL)
$acmeEmail = Read-Host "ACME Email for SSL certificates (e.g., admin@assignmentai.app)"
if ($acmeEmail) {
    (Get-Content ".env.production") -replace "ACME_EMAIL=admin@assignmentai.app", "ACME_EMAIL=$acmeEmail" | Set-Content ".env.production"
}

# Database password
$dbPassword = Read-Host "Database password (for POSTGRES_PASSWORD)"
if ($dbPassword) {
    (Get-Content ".env.production") -replace "DB_PASSWORD=your-secure-db-password", "DB_PASSWORD=$dbPassword" | Set-Content ".env.production"
    (Get-Content ".env.production") -replace "POSTGRES_PASSWORD=\$\{DB_PASSWORD\}", "POSTGRES_PASSWORD=$dbPassword" | Set-Content ".env.production"
}

# Redis password
$redisPassword = Read-Host "Redis password (for REDIS_PASSWORD)"
if ($redisPassword) {
    (Get-Content ".env.production") -replace "REDIS_PASSWORD=your-secure-redis-password", "REDIS_PASSWORD=$redisPassword" | Set-Content ".env.production"
}

# Secret key
$secretKey = Read-Host "Secret key (for SECRET_KEY) - press Enter to generate automatically"
if (-not $secretKey) {
    $secretKey = -join ((33..126) | Get-Random -Count 50 | ForEach-Object {[char]$_})
    Write-Host "Generated secret key: $secretKey" -ForegroundColor Gray
}
if ($secretKey) {
    (Get-Content ".env.production") -replace "SECRET_KEY=\$\{SECRET_KEY\}", "SECRET_KEY=$secretKey" | Set-Content ".env.production"
}

# OpenAI API Key
$openaiKey = Read-Host "OpenAI API Key (for OPENAI_API_KEY)"
if ($openaiKey) {
    (Get-Content ".env.production") -replace "OPENAI_API_KEY=\$\{OPENAI_API_KEY\}", "OPENAI_API_KEY=$openaiKey" | Set-Content ".env.production"
}

# Stripe keys
$stripePublishable = Read-Host "Stripe Publishable Key (for STRIPE_PUBLISHABLE_KEY)"
if ($stripePublishable) {
    (Get-Content ".env.production") -replace "STRIPE_PUBLISHABLE_KEY=\$\{STRIPE_PUBLISHABLE_KEY\}", "STRIPE_PUBLISHABLE_KEY=$stripePublishable" | Set-Content ".env.production"
}

$stripeSecret = Read-Host "Stripe Secret Key (for STRIPE_SECRET_KEY)"
if ($stripeSecret) {
    (Get-Content ".env.production") -replace "STRIPE_SECRET_KEY=\$\{STRIPE_SECRET_KEY\}", "STRIPE_SECRET_KEY=$stripeSecret" | Set-Content ".env.production"
}

$stripeWebhook = Read-Host "Stripe Webhook Secret (for STRIPE_WEBHOOK_SECRET)"
if ($stripeWebhook) {
    (Get-Content ".env.production") -replace "STRIPE_WEBHOOK_SECRET=\$\{STRIPE_WEBHOOK_SECRET\}", "STRIPE_WEBHOOK_SECRET=$stripeWebhook" | Set-Content ".env.production"
}

# AWS keys
$awsAccessKey = Read-Host "AWS Access Key ID (for AWS_ACCESS_KEY_ID)"
if ($awsAccessKey) {
    (Get-Content ".env.production") -replace "AWS_ACCESS_KEY_ID=\$\{AWS_ACCESS_KEY_ID\}", "AWS_ACCESS_KEY_ID=$awsAccessKey" | Set-Content ".env.production"
}

$awsSecretKey = Read-Host "AWS Secret Access Key (for AWS_SECRET_ACCESS_KEY)"
if ($awsSecretKey) {
    (Get-Content ".env.production") -replace "AWS_SECRET_ACCESS_KEY=\$\{AWS_SECRET_ACCESS_KEY\}", "AWS_SECRET_ACCESS_KEY=$awsSecretKey" | Set-Content ".env.production"
}

# Email password
$smtpPassword = Read-Host "SMTP Password (for SMTP_PASSWORD)"
if ($smtpPassword) {
    (Get-Content ".env.production") -replace "SMTP_PASSWORD=\$\{SMTP_PASSWORD\}", "SMTP_PASSWORD=$smtpPassword" | Set-Content ".env.production"
}

# Grafana password
$grafanaPassword = Read-Host "Grafana Admin Password (for GRAFANA_PASSWORD)"
if ($grafanaPassword) {
    (Get-Content ".env.production") -replace "GRAFANA_PASSWORD=\$\{GRAFANA_PASSWORD\}", "GRAFANA_PASSWORD=$grafanaPassword" | Set-Content ".env.production"
}

Write-Host "`nSUCCESS: .env.production file configured!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Review the .env.production file to ensure all values are correct" -ForegroundColor White
Write-Host "2. Upload the file to your server" -ForegroundColor White
Write-Host "3. Deploy using: docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor White
Write-Host "4. Monitor Traefik logs for SSL certificate issuance" -ForegroundColor White

Write-Host "`nIMPORTANT: Keep your .env.production file secure and never commit it to version control!" -ForegroundColor Yellow 