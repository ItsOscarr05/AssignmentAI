const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(__dirname, '../hardcoded-strings.json');

// Patterns to match user-facing text
const PATTERNS = [
  // JSX text content
  /<[^>]*>([^<>{}\n]{3,})<\/[^>]*>/g,
  // String literals in JSX props
  /(title|label|placeholder|aria-label|alt)=["']([^"']{3,})["']/g,
  // Typography components
  /<Typography[^>]*>([^<>{}\n]{3,})<\/Typography>/g,
  // Button text
  /<Button[^>]*>([^<>{}\n]{3,})<\/Button>/g,
  // Alert text
  /<Alert[^>]*>([^<>{}\n]{3,})<\/Alert>/g,
  // Dialog title/content
  /<DialogTitle[^>]*>([^<>{}\n]{3,})<\/DialogTitle>/g,
  /<DialogContent[^>]*>([^<>{}\n]{3,})<\/DialogContent>/g,
];

// Strings to ignore
const IGNORE_PATTERNS = [
  /^[A-Z0-9\s\-_]+$/, // All caps (CSS classes)
  /^[a-z]+$/, // Single words
  /^\d+$/, // Numbers only
  /^(true|false|null|undefined)$/, // Boolean/null
  /^(className|id|style|onClick|onChange|onSubmit)$/, // React props
  /^(import|export|require|from|const|let|var|function|return)$/, // JS keywords
];

function findFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function shouldInclude(text) {
  if (text.length < 3) return false;
  if (text.includes('{') || text.includes('}') || text.includes('${')) return false;
  if (IGNORE_PATTERNS.some(pattern => pattern.test(text))) return false;
  return true;
}

function extractStrings() {
  const extractedStrings = [];
  const files = findFiles(SRC_DIR);

  console.log(`Found ${files.length} files to scan`);

  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, lineNum) => {
        PATTERNS.forEach(pattern => {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            const text = match[1] || match[2] || match[0];
            if (text && shouldInclude(text)) {
              extractedStrings.push({
                text: text.trim(),
                file: path.relative(SRC_DIR, filePath),
                line: lineNum + 1,
                context: line.trim(),
              });
            }
          }
        });
      });
    } catch (error) {
      console.warn(`Error scanning ${filePath}:`, error.message);
    }
  });

  return extractedStrings;
}

function main() {
  console.log('🔍 Scanning for hardcoded strings...');

  const allStrings = extractStrings();
  const uniqueStrings = allStrings
    .filter((item, index, self) => index === self.findIndex(t => t.text === item.text))
    .sort((a, b) => a.text.localeCompare(b.text));

  const results = {
    totalFound: allStrings.length,
    uniqueStrings: uniqueStrings.length,
    strings: uniqueStrings,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  console.log(`\n📊 Summary:`);
  console.log(`Total strings found: ${allStrings.length}`);
  console.log(`Unique strings: ${uniqueStrings.length}`);
  console.log(`Results saved to: ${OUTPUT_FILE}`);

  if (uniqueStrings.length > 0) {
    console.log(`\n🔑 Sample hardcoded strings:`);
    uniqueStrings.slice(0, 10).forEach(item => {
      console.log(`  "${item.text}" (${item.file}:${item.line})`);
    });

    if (uniqueStrings.length > 10) {
      console.log(`  ... and ${uniqueStrings.length - 10} more`);
    }
  }

  console.log(`\n💡 Next steps:`);
  console.log(`1. Review the extracted strings in ${OUTPUT_FILE}`);
  console.log(`2. Add missing translation keys to src/i18n/locales/en.json`);
  console.log(`3. Replace hardcoded strings with t('key') calls`);
}

main();
