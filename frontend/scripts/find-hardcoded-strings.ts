import * as fs from 'fs';
import * as path from 'path';

interface ExtractedString {
  text: string;
  file: string;
  line: number;
  context: string;
}

class I18nExtractor {
  private extractedStrings: ExtractedString[] = [];
  private readonly srcDir = path.join(__dirname, '../src');
  private readonly outputFile = path.join(__dirname, '../hardcoded-strings.json');

  // Patterns to match user-facing text
  private readonly patterns = [
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
  private readonly ignorePatterns = [
    /^[A-Z0-9\s\-_]+$/, // All caps (CSS classes)
    /^[a-z]+$/, // Single words
    /^\d+$/, // Numbers only
    /^(true|false|null|undefined)$/, // Boolean/null
    /^(className|id|style|onClick|onChange|onSubmit)$/, // React props
    /^(import|export|require|from|const|let|var|function|return)$/, // JS keywords
  ];

  public async extract(): Promise<void> {
    console.log('🔍 Scanning for hardcoded strings...');

    const files = this.findFiles();
    console.log(`Found ${files.length} files to scan`);

    for (const file of files) {
      await this.scanFile(file);
    }

    this.saveResults();
    this.printSummary();
  }

  private findFiles(): string[] {
    const files: string[] = [];

    function walk(dir: string): void {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walk(fullPath);
        } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
          files.push(fullPath);
        }
      }
    }

    walk(this.srcDir);
    return files;
  }

  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];

        for (const pattern of this.patterns) {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            const text = match[1] || match[2] || match[0];
            if (text && this.shouldInclude(text)) {
              this.extractedStrings.push({
                text: text.trim(),
                file: path.relative(this.srcDir, filePath),
                line: lineNum + 1,
                context: line.trim(),
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Error scanning ${filePath}:`, error);
    }
  }

  private shouldInclude(text: string): boolean {
    if (text.length < 3) return false;
    if (text.includes('{') || text.includes('}') || text.includes('${')) return false;
    if (this.ignorePatterns.some(pattern => pattern.test(text))) return false;
    return true;
  }

  private saveResults(): void {
    const uniqueStrings = this.extractedStrings
      .filter((item, index, self) => index === self.findIndex(t => t.text === item.text))
      .sort((a, b) => a.text.localeCompare(b.text));

    const results = {
      totalFound: this.extractedStrings.length,
      uniqueStrings: uniqueStrings.length,
      strings: uniqueStrings,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(this.outputFile, JSON.stringify(results, null, 2));
  }

  private printSummary(): void {
    const uniqueStrings = this.extractedStrings
      .filter((item, index, self) => index === self.findIndex(t => t.text === item.text))
      .sort((a, b) => a.text.localeCompare(b.text));

    console.log(`\n📊 Summary:`);
    console.log(`Total strings found: ${this.extractedStrings.length}`);
    console.log(`Unique strings: ${uniqueStrings.length}`);
    console.log(`Results saved to: ${this.outputFile}`);

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
    console.log(`1. Review the extracted strings in ${this.outputFile}`);
    console.log(`2. Add missing translation keys to src/i18n/locales/en.json`);
    console.log(`3. Replace hardcoded strings with t('key') calls`);
  }
}

// Run the extractor
const extractor = new I18nExtractor();
extractor.extract().catch(console.error);
