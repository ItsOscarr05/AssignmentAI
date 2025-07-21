#!/usr/bin/env node

/**
 * Environment Switcher Script
 *
 * Usage:
 *   node scripts/switch-env.js dev     # Switch to development mode
 *   node scripts/switch-env.js prod    # Switch to production mode
 *   node scripts/switch-env.js test    # Switch to test mode
 *   node scripts/switch-env.js         # Show current mode
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = path.join(__dirname, '../src/config/environment.ts');

const modes = {
  dev: 'development',
  prod: 'production',
  test: 'test',
};

function updateEnvironment(mode) {
  try {
    let content = fs.readFileSync(envFile, 'utf8');

    // Find and replace the CURRENT_MODE line
    const regex = /const CURRENT_MODE: EnvironmentConfig\['mode'\] = '([^']+)';/;
    const newLine = `const CURRENT_MODE: EnvironmentConfig['mode'] = '${mode}';`;

    if (content.match(regex)) {
      content = content.replace(regex, newLine);
      fs.writeFileSync(envFile, content, 'utf8');
      console.log(`✅ Switched to ${mode} mode`);
    } else {
      console.error('❌ Could not find CURRENT_MODE line in environment.ts');
    }
  } catch (error) {
    console.error('❌ Error updating environment:', error.message);
  }
}

function showCurrentMode() {
  try {
    const content = fs.readFileSync(envFile, 'utf8');
    const match = content.match(/const CURRENT_MODE: EnvironmentConfig\['mode'\] = '([^']+)';/);

    if (match) {
      console.log(`Current mode: ${match[1]}`);
    } else {
      console.log('Could not determine current mode');
    }
  } catch (error) {
    console.error('❌ Error reading environment file:', error.message);
  }
}

// Main execution
const mode = process.argv[2];

if (!mode) {
  console.log('🌍 Environment Switcher');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/switch-env.js dev     # Switch to development mode');
  console.log('  node scripts/switch-env.js prod    # Switch to production mode');
  console.log('  node scripts/switch-env.js test    # Switch to test mode');
  console.log('  node scripts/switch-env.js         # Show current mode');
  console.log('');
  showCurrentMode();
} else if (modes[mode]) {
  updateEnvironment(modes[mode]);
} else {
  console.error(`❌ Invalid mode: ${mode}`);
  console.log('Valid modes: dev, prod, test');
}
