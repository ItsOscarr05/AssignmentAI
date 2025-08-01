const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const TRANSLATION_FILE = path.join(__dirname, '../src/i18n/locales/en.json');
const OUTPUT_FILE = path.join(__dirname, '../extracted-strings.json');

// Simple function to find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Patterns to match hardcoded strings
const PATTERNS = [
  // JSX text content between tags
  /<[^>]*>([^<>{}\n]+)<\/[^>]*>/g,
  // String literals
  /"([^"]{3,})"/g,
  // Template literals
  /`([^`]{3,})`/g,
];

// Common strings to ignore
const IGNORE_PATTERNS = [
  /^[A-Z0-9\s\-_]+$/, // All caps strings
  /^[a-z]+$/, // Single words
  /^\d+$/, // Numbers only
  /^(true|false|null|undefined)$/, // Boolean/null values
  /^(className|id|style|onClick|onChange|onSubmit)$/, // React props
];

function extractStrings() {
  const strings = new Set();

  try {
    const files = findFiles(SRC_DIR);
    console.log(`Found ${files.length} files to scan`);

    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');

        PATTERNS.forEach(pattern => {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const text = match[1] || match[0];
            if (text && text.trim() && !shouldIgnore(text)) {
              strings.add(text.trim());
            }
          }
        });
      } catch (err) {
        console.warn(`Error reading file ${file}:`, err.message);
      }
    });
  } catch (err) {
    console.error('Error scanning files:', err.message);
  }

  return Array.from(strings).sort();
}

function shouldIgnore(text) {
  return (
    IGNORE_PATTERNS.some(pattern => pattern.test(text)) ||
    text.length < 3 ||
    text.includes('{') ||
    text.includes('}') ||
    text.includes('${') ||
    text.includes('import') ||
    text.includes('export') ||
    text.includes('require')
  );
}

function generateTranslationKeys(strings) {
  let existingTranslations = {};

  try {
    existingTranslations = JSON.parse(fs.readFileSync(TRANSLATION_FILE, 'utf8'));
  } catch (err) {
    console.warn('Could not read existing translation file:', err.message);
  }

  const newKeys = {};

  strings.forEach(string => {
    // Generate a key based on the string content
    const key = string
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    if (!existingTranslations[key] && !newKeys[key]) {
      newKeys[key] = string;
    }
  });

  return newKeys;
}

function main() {
  console.log('🔍 Extracting hardcoded strings...');

  const strings = extractStrings();
  console.log(`Found ${strings.length} potential hardcoded strings`);

  const newKeys = generateTranslationKeys(strings);
  console.log(`Generated ${Object.keys(newKeys).length} new translation keys`);

  // Save extracted strings
  try {
    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(
        {
          extracted: strings,
          newKeys: newKeys,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log(`📄 Results saved to ${OUTPUT_FILE}`);

    if (Object.keys(newKeys).length > 0) {
      console.log('\n🔑 New translation keys:');
      Object.entries(newKeys).forEach(([key, value]) => {
        console.log(`  "${key}": "${value}"`);
      });
    }

    console.log('\n💡 Next steps:');
    console.log('1. Review the extracted strings');
    console.log('2. Add new keys to translation files');
    console.log('3. Replace hardcoded strings with translation keys');
  } catch (err) {
    console.error('Error saving results:', err.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractStrings, generateTranslationKeys };
