import { execSync } from 'child_process';

// Run tests and capture JSON output
const testOutput = execSync('npx vitest run --reporter=json', { encoding: 'utf-8' });
const data = JSON.parse(testOutput);

// Analyze results
const fileStats = {};
data.testResults.forEach(result => {
  const failures = result.testResults.filter(test => test.status === 'failed').length;
  if (failures > 0) {
    // Get relative path from frontend directory
    const relativePath = result.testFilePath.split('frontend/').pop();
    fileStats[relativePath] = {
      failures,
      total: result.testResults.length,
      percentage: ((failures / result.testResults.length) * 100).toFixed(1),
    };
  }
});

// Sort by number of failures (descending)
const sortedFiles = Object.entries(fileStats).sort(([, a], [, b]) => b.failures - a.failures);

// Print results
console.log('\nTest Failure Analysis:');
console.log('=====================\n');
sortedFiles.forEach(([file, stats]) => {
  console.log(`${file}:`);
  console.log(`  Failures: ${stats.failures}/${stats.total} (${stats.percentage}%)`);
  console.log('');
});
