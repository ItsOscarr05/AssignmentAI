# Authentication Flow Test Script for Windows
# 
# This script runs the authentication tests and provides a summary

Write-Host "🧪 Running Authentication Flow Tests..." -ForegroundColor Cyan
Write-Host ""

try {
    # Set environment variables for development mode
    $env:NODE_ENV = "development"
    $env:VITEST_MODE = "development"
    
    # Run the specific auth flow test
    $testCommand = "npx vitest run src/__tests__/components/AuthFlow.test.tsx --reporter=verbose"
    
    Write-Host "Running: $testCommand" -ForegroundColor Yellow
    Write-Host "Environment: NODE_ENV=$env:NODE_ENV" -ForegroundColor Yellow
    Write-Host ("=" * 50) -ForegroundColor Gray
    
    # Change to the frontend directory and run the test
    Set-Location $PSScriptRoot\..
    Invoke-Expression $testCommand
    
    Write-Host ""
    Write-Host "✅ Authentication tests completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ Authentication tests failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 