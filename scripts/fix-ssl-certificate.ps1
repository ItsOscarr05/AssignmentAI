# SSL Certificate Fix Script for AssignmentAI
# This script diagnoses and fixes SSL certificate issues

param(
    [string]$ServerIP = "3.237.95.92",
    [string]$Domain = "assignmentai.app",
    [string]$Email = "admin@assignmentai.app"
)

Write-Host "🔍 Diagnosing SSL Certificate Issues for $Domain" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Step 1: Check if domain resolves correctly
Write-Host "`n1. Checking DNS resolution..." -ForegroundColor Yellow
try {
    $dnsResult = nslookup $Domain 2>$null
    if ($dnsResult -match $ServerIP) {
        Write-Host "✅ DNS resolution successful: $Domain -> $ServerIP" -ForegroundColor Green
    } else {
        Write-Host "❌ DNS resolution failed or incorrect IP" -ForegroundColor Red
        Write-Host "   Expected: $Domain -> $ServerIP" -ForegroundColor Red
        Write-Host "   Please check your DNS configuration" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ DNS lookup failed" -ForegroundColor Red
    exit 1
}

# Step 2: Check if ports 80 and 443 are accessible
Write-Host "`n2. Checking port accessibility..." -ForegroundColor Yellow
try {
    $tcp80 = Test-NetConnection -ComputerName $Domain -Port 80 -InformationLevel Quiet
    $tcp443 = Test-NetConnection -ComputerName $Domain -Port 443 -InformationLevel Quiet
    
    if ($tcp80.TcpTestSucceeded) {
        Write-Host "✅ Port 80 is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Port 80 is not accessible" -ForegroundColor Red
    }
    
    if ($tcp443.TcpTestSucceeded) {
        Write-Host "✅ Port 443 is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Port 443 is not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Port test failed" -ForegroundColor Red
}

# Step 3: Check SSL certificate status
Write-Host "`n3. Checking SSL certificate status..." -ForegroundColor Yellow
try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $request = [System.Net.WebRequest]::Create("https://$Domain")
    $null = $request.GetResponse()
    $cert = $request.ServicePoint.Certificate
    
    if ($cert) {
        Write-Host "✅ SSL certificate found" -ForegroundColor Green
        Write-Host "   Subject: $($cert.Subject)" -ForegroundColor Gray
        Write-Host "   Issuer: $($cert.Issuer)" -ForegroundColor Gray
        Write-Host "   Valid from: $($cert.GetEffectiveDateString())" -ForegroundColor Gray
        Write-Host "   Valid until: $($cert.GetExpirationDateString())" -ForegroundColor Gray
    } else {
        Write-Host "❌ No SSL certificate found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ SSL certificate check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Provide manual verification steps
Write-Host "`n4. Manual verification steps:" -ForegroundColor Yellow
Write-Host "   a Verify DNS records:" -ForegroundColor White
Write-Host "      - A record: $Domain -> $ServerIP" -ForegroundColor Gray
Write-Host "      - A record: www.$Domain -> $ServerIP" -ForegroundColor Gray
Write-Host "      - A record: api.$Domain -> $ServerIP" -ForegroundColor Gray
Write-Host "      - A record: monitoring.$Domain -> $ServerIP" -ForegroundColor Gray

Write-Host "`n   b Check server firewall:" -ForegroundColor White
Write-Host "      - Port 80 HTTP must be open for ACME challenge" -ForegroundColor Gray
Write-Host "      - Port 443 HTTPS must be open" -ForegroundColor Gray

Write-Host "`n   c Verify Traefik configuration:" -ForegroundColor White
Write-Host "      - ACME_EMAIL environment variable is set" -ForegroundColor Gray
Write-Host "      - Traefik service is running" -ForegroundColor Gray
Write-Host "      - ACME storage file has proper permissions" -ForegroundColor Gray

# Step 5: Provide fix commands
Write-Host "`n5. Fix commands run on server:" -ForegroundColor Yellow
Write-Host "   Check Traefik logs:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.prod.yml logs traefik" -ForegroundColor Gray

Write-Host "`n   Restart Traefik to force certificate renewal:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.prod.yml restart traefik" -ForegroundColor Gray

Write-Host "`n   Check ACME storage file:" -ForegroundColor White
Write-Host "   ls -la traefik/acme.json" -ForegroundColor Gray

Write-Host "`n   If ACME file is corrupted, remove it:" -ForegroundColor White
Write-Host "   sudo rm -f traefik/acme.json" -ForegroundColor Gray
Write-Host "   sudo chown 1000:1000 traefik/acme.json" -ForegroundColor Gray

Write-Host "`n   Restart all services:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.prod.yml down" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor Gray

Write-Host "`n6. Environment variable check:" -ForegroundColor Yellow
Write-Host "   Ensure these variables are set in your .env.production file:" -ForegroundColor White
Write-Host "   - ACME_EMAIL=$Email" -ForegroundColor Gray
Write-Host "   - All other required environment variables" -ForegroundColor Gray

Write-Host "`n🔧 Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify DNS records are pointing to $ServerIP" -ForegroundColor White
Write-Host "2. Ensure ports 80 and 443 are open on your server" -ForegroundColor White
Write-Host "3. Run the fix commands on your server" -ForegroundColor White
Write-Host "4. Wait 5-10 minutes for Let's Encrypt to issue the certificate" -ForegroundColor White
Write-Host "5. Test the site again" -ForegroundColor White

Write-Host "`n📝 Note: Let's Encrypt has rate limits. If you've made too many requests," -ForegroundColor Yellow
Write-Host "   you may need to wait up to 1 hour before trying again." -ForegroundColor Yellow