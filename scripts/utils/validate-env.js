const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the .env.example file
const envExample = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8');

// Parse the example file to get required variables
const requiredVars = envExample
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .map(line => line.split('=')[0].trim());

// Check if all required variables are set
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  process.exit(1);
}

console.log('All required environment variables are set.');
