# Run tests and capture JSON output
$testOutput = npx vitest run --reporter=json 2>&1

# Find the JSON part of the output
$jsonStart = $testOutput.IndexOf('{')
$jsonEnd = $testOutput.LastIndexOf('}') + 1
$jsonContent = $testOutput.Substring($jsonStart, $jsonEnd - $jsonStart)

# Convert the output to a PowerShell object
$data = $jsonContent | ConvertFrom-Json

# Create a hashtable to store file statistics
$fileStats = @{}

# Analyze results
foreach ($result in $data.testResults) {
    $failures = ($result.testResults | Where-Object { $_.status -eq 'failed' }).Count
    if ($failures -gt 0) {
        # Get relative path from frontend directory
        $relativePath = $result.testFilePath -replace '.*frontend/', ''
        $fileStats[$relativePath] = @{
            Failures = $failures
            Total = $result.testResults.Count
            Percentage = [math]::Round(($failures / $result.testResults.Count) * 100, 1)
        }
    }
}

# Sort by number of failures (descending)
$sortedFiles = $fileStats.GetEnumerator() | Sort-Object { $_.Value.Failures } -Descending

# Print results
Write-Host "`nTest Failure Analysis:"
Write-Host "=====================`n"
foreach ($file in $sortedFiles) {
    Write-Host "$($file.Key):"
    Write-Host "  Failures: $($file.Value.Failures)/$($file.Value.Total) ($($file.Value.Percentage)%)"
    Write-Host ""
} 