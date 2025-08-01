const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, '../src');

// Mapping of hardcoded strings to translation keys
const STRING_MAPPINGS = {
  // About page
  'Our Mission': 't("pages.about.mission")',
  'Our Story': 't("pages.about.story")',
  'Our Values': 't("pages.about.values")',
  'Our Commitment': 't("pages.about.commitment")',
  'Join Our Journey': 't("pages.about.joinJourney")',
  'Create Account': 't("auth.createAccount")',
  'Two-Factor Authentication': 't("pages.verify2FA.title")',
  'Review Submission': 't("pages.submissionReview.title")',
  'Submission Content': 't("pages.submissionReview.submissionContent")',
  'Edit Profile': 't("pages.profile.editProfile")',
  'Coming Soon': 't("pages.profile.comingSoon")',
  'No Activity Yet': 't("pages.workshop.noActivityYet")',
  'Pricing Plans': 't("pages.pricePlan.title")',
  '/month': 't("pages.pricePlan.perMonth")',
  'Secure checkout via Stripe': 't("pages.pricePlan.secureCheckout")',
  'No commitment. Cancel anytime.': 't("pages.pricePlan.noCommitment")',
  'No Results Found': 't("pages.help.noResults")',
  'Contact Support': 't("pages.help.contactSupport")',
  'support@assignmentai.com': 't("pages.help.email")',
  'Within 24 hours': 't("pages.help.responseTime")',
  'Monday - Friday: 9 AM - 6 PM EST': 't("pages.help.hours")',
  'Available 24/7 for urgent issues': 't("pages.help.urgentSupport")',
};

// Long text mappings (for multi-line content)
const LONG_TEXT_MAPPINGS = {
  'At AssignmentAI, our mission is to empower students to focus on what truly matters to them—their passions, their majors, and the subjects that inspire them. We believe that every student deserves the opportunity to dive deeply into their chosen field without being overwhelmed by the busy work and administrative tasks of non-essential classes.':
    't("pages.about.missionText")',
  'By leveraging intelligent automation and AI-driven support, AssignmentAI helps alleviate the burden of repetitive assignments and coursework that can distract from meaningful learning. Our goal is to give students back their most valuable resource: time. With more time to dedicate to their interests and career goals, students can achieve greater mastery, creativity, and fulfillment in their academic journey.':
    't("pages.about.missionText2")',
  'We are committed to creating a future where education is not about checking boxes, but about genuine exploration, growth, and doing what you love.':
    't("pages.about.missionText3")',
  'AssignmentAI was created by a single college student during his freshman year at James Madison University. As he navigated the challenges of higher education, he made a simple yet powerful observation: despite paying to attend a high-end academic institution, students are often required to devote significant time and energy to subjects and concepts that do not align with their true passions or career goals.':
    't("pages.about.storyText")',
  'Frustrated by the disconnect between the promise of a personalized education and the reality of mandatory busy work, he set out to build a solution. AssignmentAI was born from the desire to help students reclaim their time and focus on what genuinely excites them. What started as a personal project quickly grew into a platform designed to empower students everywhere to pursue their interests, deepen their expertise, and make the most of their academic investment.':
    't("pages.about.storyText2")',
  'We are committed to continuous improvement and innovation. Our team regularly updates the platform with new features and improvements based on user feedback. We maintain strict privacy and security standards to ensure that your academic work remains protected. Our goal is to be your trusted partner in academic success.':
    't("pages.about.commitmentText")',
  "Whether you're a student looking to improve your academic performance or an educator interested in enhancing your teaching methods, AssignmentAI is here to support you. Join our growing community of learners and educators who are embracing the future of education.":
    't("pages.about.joinJourneyText")',
  "We couldn't find any help articles matching your search. Try different keywords or browse our categories.":
    't("pages.help.noResultsText")',
  "We're working on creating a comprehensive activity tracking system to help you monitor your progress and achievements. Stay tuned for updates!":
    't("pages.profile.activityTrackingText")',
  "We're developing an exciting achievements system to reward your progress and milestones. Get ready to earn badges and unlock special features!":
    't("pages.profile.achievementsText")',
  'Your weekly activity will appear here once you start using the AI Workshop.':
    't("pages.workshop.noActivityText")',
};

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

function replaceStringsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace long text first (to avoid partial matches)
    for (const [text, replacement] of Object.entries(LONG_TEXT_MAPPINGS)) {
      if (content.includes(text)) {
        content = content.replace(
          new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          replacement
        );
        modified = true;
        console.log(`  Replaced long text in ${path.relative(SRC_DIR, filePath)}`);
      }
    }

    // Replace shorter strings
    for (const [text, replacement] of Object.entries(STRING_MAPPINGS)) {
      if (content.includes(text)) {
        content = content.replace(
          new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          replacement
        );
        modified = true;
        console.log(`  Replaced "${text}" in ${path.relative(SRC_DIR, filePath)}`);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.warn(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function addTranslationImport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if translation import already exists
    if (content.includes('useTranslation') || content.includes('t(')) {
      return false;
    }

    // Add import if file contains translation keys
    if (content.includes('t(')) {
      const importStatement = "import { useTranslation } from 'react-i18next';\n";
      const hookStatement = '  const { t } = useTranslation();\n';

      // Add import at the top
      if (!content.includes('import { useTranslation }')) {
        const lines = content.split('\n');
        let importIndex = 0;

        // Find the last import statement
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            importIndex = i + 1;
          }
        }

        lines.splice(importIndex, 0, importStatement);
        content = lines.join('\n');
      }

      // Add hook in component
      if (!content.includes('const { t } = useTranslation()')) {
        const lines = content.split('\n');
        let hookIndex = 0;

        // Find the component function
        for (let i = 0; i < lines.length; i++) {
          if (
            (lines[i].includes('const ') && lines[i].includes(': React.FC')) ||
            (lines[i].includes('function ') && lines[i].includes('('))
          ) {
            hookIndex = i + 1;
            break;
          }
        }

        // Find the opening brace
        for (let i = hookIndex; i < lines.length; i++) {
          if (lines[i].includes('{')) {
            hookIndex = i + 1;
            break;
          }
        }

        lines.splice(hookIndex, 0, hookStatement);
        content = lines.join('\n');
      }

      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.warn(`Error adding translation import to ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Replacing hardcoded strings with translation keys...');

  const files = findFiles(SRC_DIR);
  console.log(`Found ${files.length} files to process`);

  let replacedFiles = 0;
  let addedImports = 0;

  files.forEach(filePath => {
    const replaced = replaceStringsInFile(filePath);
    if (replaced) {
      replacedFiles++;
    }

    const addedImport = addTranslationImport(filePath);
    if (addedImport) {
      addedImports++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`Files with replacements: ${replacedFiles}`);
  console.log(`Files with added imports: ${addedImports}`);
  console.log(`\n💡 Next steps:`);
  console.log(`1. Review the changes in the modified files`);
  console.log(`2. Test the application to ensure translations work correctly`);
  console.log(`3. Add any missing translation keys to the locale files`);
}

main();
