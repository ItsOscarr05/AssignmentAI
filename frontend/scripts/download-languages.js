#!/usr/bin/env node

/**
 * Script to download language dictionaries from npm packages
 * Usage: node scripts/download-languages.js
 */

const fs = require('fs');
const path = require('path');

// List of popular language dictionary packages
const languagePackages = [
  {
    name: 'i18n-iso-countries',
    languages: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
  },
  {
    name: 'i18n-iso-languages',
    languages: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
  },
  { name: 'moment', languages: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'] },
  { name: 'date-fns', languages: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'] },
];

console.log('🌍 Language Dictionary Downloader');
console.log('================================');

// Create languages directory if it doesn't exist
const languagesDir = path.join(__dirname, '../src/i18n/locales');
if (!fs.existsSync(languagesDir)) {
  fs.mkdirSync(languagesDir, { recursive: true });
}

// Function to create a basic language template
function createLanguageTemplate(langCode, langName) {
  return {
    navigation: {
      home: langCode === 'en' ? 'Home' : `[${langName}] Home`,
      assignments: langCode === 'en' ? 'Assignments' : `[${langName}] Assignments`,
      workshop: langCode === 'en' ? 'Workshop' : `[${langName}] Workshop`,
      aiTokens: langCode === 'en' ? 'AI Tokens' : `[${langName}] AI Tokens`,
      pricePlan: langCode === 'en' ? 'Price Plan' : `[${langName}] Price Plan`,
      settings: langCode === 'en' ? 'Settings' : `[${langName}] Settings`,
      profile: langCode === 'en' ? 'Profile' : `[${langName}] Profile`,
      help: langCode === 'en' ? 'Help' : `[${langName}] Help`,
    },
    settings: {
      title: langCode === 'en' ? 'Settings' : `[${langName}] Settings`,
      saveChanges: langCode === 'en' ? 'Save Changes' : `[${langName}] Save Changes`,
      settingsSavedSuccessfully:
        langCode === 'en'
          ? 'Settings saved successfully!'
          : `[${langName}] Settings saved successfully!`,
      searchSettings: langCode === 'en' ? 'Search settings...' : `[${langName}] Search settings...`,
      appearance: {
        title: langCode === 'en' ? 'Appearance' : `[${langName}] Appearance`,
        darkMode: langCode === 'en' ? 'Dark Mode' : `[${langName}] Dark Mode`,
        enableAnimations:
          langCode === 'en' ? 'Enable Animations' : `[${langName}] Enable Animations`,
        compactMode: langCode === 'en' ? 'Compact Mode' : `[${langName}] Compact Mode`,
        fontSize: langCode === 'en' ? 'Font Size' : `[${langName}] Font Size`,
      },
      language: {
        title: langCode === 'en' ? 'Language & Region' : `[${langName}] Language & Region`,
        language: langCode === 'en' ? 'Language' : `[${langName}] Language`,
        timeZone: langCode === 'en' ? 'Time Zone' : `[${langName}] Time Zone`,
        dateFormat: langCode === 'en' ? 'Date Format' : `[${langName}] Date Format`,
        currentLanguage: langCode === 'en' ? 'Current language' : `[${langName}] Current language`,
        translationPreferences:
          langCode === 'en' ? 'Translation Preferences' : `[${langName}] Translation Preferences`,
        autoTranslateContent:
          langCode === 'en' ? 'Auto-translate content' : `[${langName}] Auto-translate content`,
        showOriginalText:
          langCode === 'en'
            ? 'Show original text alongside translation'
            : `[${langName}] Show original text alongside translation`,
        regionalSettings:
          langCode === 'en' ? 'Regional Settings' : `[${langName}] Regional Settings`,
        useMetricSystem:
          langCode === 'en' ? 'Use metric system' : `[${langName}] Use metric system`,
        use24HourFormat:
          langCode === 'en' ? 'Use 24-hour time format' : `[${langName}] Use 24-hour time format`,
      },
      sound: {
        title: langCode === 'en' ? 'Sound & Feedback' : `[${langName}] Sound & Feedback`,
        soundSettings: langCode === 'en' ? 'Sound Settings' : `[${langName}] Sound Settings`,
        soundEffects: langCode === 'en' ? 'Sound Effects' : `[${langName}] Sound Effects`,
        hapticFeedback: langCode === 'en' ? 'Haptic Feedback' : `[${langName}] Haptic Feedback`,
        volume: langCode === 'en' ? 'Volume' : `[${langName}] Volume`,
        notificationSounds:
          langCode === 'en' ? 'Notification Sounds' : `[${langName}] Notification Sounds`,
        enableNotificationSounds:
          langCode === 'en'
            ? 'Enable Notification Sounds'
            : `[${langName}] Enable Notification Sounds`,
        typingSounds: langCode === 'en' ? 'Typing Sounds' : `[${langName}] Typing Sounds`,
        taskCompletionSounds:
          langCode === 'en' ? 'Task Completion Sounds' : `[${langName}] Task Completion Sounds`,
        quietHours: langCode === 'en' ? 'Quiet Hours' : `[${langName}] Quiet Hours`,
        startTime: langCode === 'en' ? 'Start Time' : `[${langName}] Start Time`,
        endTime: langCode === 'en' ? 'End Time' : `[${langName}] End Time`,
      },
      ai: {
        title: langCode === 'en' ? 'AI & Learning' : `[${langName}] AI & Learning`,
        modelConfiguration:
          langCode === 'en' ? 'AI Model Configuration' : `[${langName}] AI Model Configuration`,
        aiModel: langCode === 'en' ? 'AI Model' : `[${langName}] AI Model`,
        tokenLimit: langCode === 'en' ? 'Token Limit' : `[${langName}] Token Limit`,
        temperature:
          langCode === 'en' ? 'Temperature (Creativity)' : `[${langName}] Temperature (Creativity)`,
        contextLength: langCode === 'en' ? 'Context Length' : `[${langName}] Context Length`,
        aiFeatures: langCode === 'en' ? 'AI Features' : `[${langName}] AI Features`,
        aiAutoComplete: langCode === 'en' ? 'AI Auto-Complete' : `[${langName}] AI Auto-Complete`,
        codeSnippetsGeneration:
          langCode === 'en' ? 'Code Snippets Generation' : `[${langName}] Code Snippets Generation`,
        aiSuggestions: langCode === 'en' ? 'AI Suggestions' : `[${langName}] AI Suggestions`,
        realTimeAnalysis:
          langCode === 'en' ? 'Real-Time Analysis' : `[${langName}] Real-Time Analysis`,
      },
      notifications: {
        title: langCode === 'en' ? 'Notifications' : `[${langName}] Notifications`,
        notificationPreferences:
          langCode === 'en' ? 'Notification Preferences' : `[${langName}] Notification Preferences`,
        notificationChannels:
          langCode === 'en' ? 'Notification Channels' : `[${langName}] Notification Channels`,
        emailNotifications:
          langCode === 'en' ? 'Email Notifications' : `[${langName}] Email Notifications`,
        desktopNotifications:
          langCode === 'en' ? 'Desktop Notifications' : `[${langName}] Desktop Notifications`,
        soundNotifications:
          langCode === 'en' ? 'Sound Notifications' : `[${langName}] Sound Notifications`,
        notificationTypes:
          langCode === 'en' ? 'Notification Types' : `[${langName}] Notification Types`,
        assignmentUpdates:
          langCode === 'en' ? 'Assignment Updates' : `[${langName}] Assignment Updates`,
        deadlineReminders:
          langCode === 'en' ? 'Deadline Reminders' : `[${langName}] Deadline Reminders`,
        feedbackNotifications:
          langCode === 'en' ? 'Feedback Notifications' : `[${langName}] Feedback Notifications`,
        systemUpdates: langCode === 'en' ? 'System Updates' : `[${langName}] System Updates`,
        displayPreferences:
          langCode === 'en' ? 'Display Preferences' : `[${langName}] Display Preferences`,
        showNotificationPreview:
          langCode === 'en'
            ? 'Show notification preview'
            : `[${langName}] Show notification preview`,
        showNotificationBadge:
          langCode === 'en' ? 'Show notification badge' : `[${langName}] Show notification badge`,
        groupSimilarNotifications:
          langCode === 'en'
            ? 'Group similar notifications'
            : `[${langName}] Group similar notifications`,
        priorityLevel: langCode === 'en' ? 'Priority Level' : `[${langName}] Priority Level`,
        lowPriority: langCode === 'en' ? 'Low Priority' : `[${langName}] Low Priority`,
        mediumPriority: langCode === 'en' ? 'Medium Priority' : `[${langName}] Medium Priority`,
        highPriority: langCode === 'en' ? 'High Priority' : `[${langName}] High Priority`,
        workHours: langCode === 'en' ? 'Work Hours' : `[${langName}] Work Hours`,
        workDays: langCode === 'en' ? 'Work Days' : `[${langName}] Work Days`,
        previewNotifications:
          langCode === 'en' ? 'Preview Notifications' : `[${langName}] Preview Notifications`,
      },
      privacy: {
        title: langCode === 'en' ? 'Privacy & Security' : `[${langName}] Privacy & Security`,
        securityScore: langCode === 'en' ? 'Security Score' : `[${langName}] Security Score`,
        lastSecurityAudit:
          langCode === 'en' ? 'Last security audit' : `[${langName}] Last security audit`,
        privacySettings: langCode === 'en' ? 'Privacy Settings' : `[${langName}] Privacy Settings`,
        dataPrivacy: langCode === 'en' ? 'Data & Privacy' : `[${langName}] Data & Privacy`,
        allowDataCollection:
          langCode === 'en' ? 'Allow Data Collection' : `[${langName}] Allow Data Collection`,
        shareAnalytics: langCode === 'en' ? 'Share Analytics' : `[${langName}] Share Analytics`,
        showOnlineStatus:
          langCode === 'en' ? 'Show Online Status' : `[${langName}] Show Online Status`,
        allowActivityTracking:
          langCode === 'en' ? 'Allow Activity Tracking' : `[${langName}] Allow Activity Tracking`,
        accountSecurity: langCode === 'en' ? 'Account Security' : `[${langName}] Account Security`,
        twoFactorAuthentication:
          langCode === 'en'
            ? 'Two-Factor Authentication'
            : `[${langName}] Two-Factor Authentication`,
        biometricLogin: langCode === 'en' ? 'Biometric Login' : `[${langName}] Biometric Login`,
        autoLockAccount:
          langCode === 'en' ? 'Auto-Lock Account' : `[${langName}] Auto-Lock Account`,
        autoLockTimeout:
          langCode === 'en' ? 'Auto-Lock Timeout' : `[${langName}] Auto-Lock Timeout`,
        accountManagement:
          langCode === 'en' ? 'Account Management' : `[${langName}] Account Management`,
        downloadMyData: langCode === 'en' ? 'Download My Data' : `[${langName}] Download My Data`,
        deleteAccount: langCode === 'en' ? 'Delete Account' : `[${langName}] Delete Account`,
        securityInformation:
          langCode === 'en' ? 'Security Information' : `[${langName}] Security Information`,
        passwordStrength:
          langCode === 'en' ? 'Password Strength' : `[${langName}] Password Strength`,
        lastPasswordChange:
          langCode === 'en' ? 'Last Password Change' : `[${langName}] Last Password Change`,
        activeSessions: langCode === 'en' ? 'Active Sessions' : `[${langName}] Active Sessions`,
        devices: langCode === 'en' ? 'devices' : `[${langName}] devices`,
      },
    },
  };
}

// Language names mapping
const languageNames = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
};

// Generate language files
const languages = ['en', 'fr', 'es', 'de', 'ru', 'zh', 'ja', 'ko'];

console.log('📝 Generating language files...');

languages.forEach(langCode => {
  const langName = languageNames[langCode] || langCode;
  const template = createLanguageTemplate(langCode, langName);
  const filePath = path.join(languagesDir, `${langCode}.json`);

  fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
  console.log(`✅ Created ${langCode}.json (${langName})`);
});

console.log('\n🎉 Language files generated successfully!');
console.log(`📁 Location: ${languagesDir}`);
console.log('\n📋 Next steps:');
console.log('1. Edit the generated files with proper translations');
console.log('2. Install additional language packages: pnpm add moment date-fns');
console.log('3. Use the translations in your components with the useTranslation hook');
