import {
  AnalyticsOutlined,
  AssignmentOutlined,
  Brush,
  CheckCircle,
  CompareArrows,
  DataUsageOutlined,
  DeleteForeverOutlined,
  DesktopWindowsOutlined,
  DownloadOutlined,
  EmailOutlined,
  Error,
  EventOutlined,
  FeedbackOutlined,
  FingerprintOutlined,
  HistoryOutlined,
  Info,
  Language,
  LockOutlined,
  Notifications,
  NotificationsActiveOutlined,
  NotificationsOutlined,
  PrivacyTipOutlined,
  Psychology,
  Save,
  Search,
  SecurityOutlined,
  SecurityUpdateOutlined,
  ShieldOutlined,
  Tune,
  UpdateOutlined,
  VerifiedUserOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
  VpnKeyOutlined,
  Warning,
  Widgets,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import AIFeaturesDemo from '../components/ai/AIFeaturesDemo';
import DateFormatSelector from '../components/common/DateFormatSelector';
import TimezoneSelector from '../components/common/TimezoneSelector';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { useTranslation } from '../hooks/useTranslation';
import { preferences } from '../services/api';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';
import { DateFormat } from '../utils/dateFormat';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps & { breakpoint?: string }) {
  const { children, value, index, breakpoint = 'standard', ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3) }}>
          {children}
        </Box>
      )}
    </div>
  );
}

type SubscriptionPlan = 'free' | 'plus' | 'pro' | 'max';

interface SubscriptionConfig {
  model: string;
  tokenLimit: number;
  label: string;
}

const Settings: React.FC = () => {
  const theme = useTheme();
  const { breakpoint } = useAspectRatio();

  const [tabValue, setTabValue] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationPreview, setShowNotificationPreview] = useState(false);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);
  const [dateFormatError, setDateFormatError] = useState<string | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);

  // General Settings
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [fontSize, setFontSize] = useState(14);
  const [animations, setAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  // Language & Region Settings
  const [timeZone, setTimeZone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState<DateFormat>('MM/DD/YYYY');

  // AI Settings
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [temperature, setTemperature] = useState('0.7');
  const [contextLength, setContextLength] = useState(10);
  const [autoComplete, setAutoComplete] = useState(true);
  const [codeSnippets, setCodeSnippets] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(true);

  // AI Settings Validation & Feedback
  const [aiSettingsError, setAiSettingsError] = useState<string | null>(null);
  const [showModelComparison, setShowModelComparison] = useState(false);
  const [isValidatingSettings, setIsValidatingSettings] = useState(false);
  const [showAIFeaturesDemo, setShowAIFeaturesDemo] = useState(false);

  // Notification Settings Validation & Feedback
  const [notificationSettingsError, setNotificationSettingsError] = useState<string | null>(null);
  const [showNotificationTest, setShowNotificationTest] = useState(false);

  // Privacy & Security Settings Validation & Feedback
  const [privacySettingsError, setPrivacySettingsError] = useState<string | null>(null);
  const [showSecurityAudit, setShowSecurityAudit] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showDownloadDataDialog, setShowDownloadDataDialog] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

  // Notification Settings
  const [notifications, setNotifications] = useState({
    email: true,
    desktop: true,
    sound: true,
    assignments: true,
    deadlines: true,
    feedback: true,
    updates: true,
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    priorityLevel: 'medium', // 'low', 'medium', 'high'
    groupNotifications: true,
    showPreview: true,
    showBadge: true,
    showInTaskbar: true,
  });

  const [notificationSchedule, setNotificationSchedule] = useState({
    quietHoursStart: 22,
    quietHoursEnd: 7,
    workDays: [1, 2, 3, 4, 5], // Monday to Friday
    workHoursStart: 9,
    workHoursEnd: 17,
  });

  // Privacy & Security
  const [privacySettings, setPrivacySettings] = useState({
    twoFactorAuth: false,
    biometricLogin: false,
    dataCollection: true,
    shareAnalytics: true,
    showOnlineStatus: true,
    allowTracking: false,
    autoLock: true,
    lockTimeout: 5, // minutes
    passwordExpiry: 90, // days
    sessionTimeout: 30, // minutes
  });

  const [securitySettings] = useState({
    passwordStrength: 'strong', // 'weak', 'medium', 'strong'
    lastPasswordChange: '2024-01-15',
    lastSecurityAudit: '2024-02-01',
    failedLoginAttempts: 0,
    activeSessions: 2,
    securityScore: 85,
  });

  // Subscription Settings
  const [subscription, setSubscription] = useState({
    plan: 'free' as SubscriptionPlan,
    model: 'gpt-4.1-nano', // Match the free plan model from subscriptionConfig
    tokenLimit: 30000,
  });

  // Use the new i18n translation hook
  const { t, changeLanguage } = useTranslation();

  // Map subscription plans to their respective models and token limits
  const subscriptionConfig: Record<SubscriptionPlan, SubscriptionConfig> = {
    free: {
      model: 'gpt-4.1-nano',
      tokenLimit: 30000,
      label: 'GPT-4.1 Nano',
    },
    plus: {
      model: 'gpt-3.5-turbo',
      tokenLimit: 50000,
      label: 'GPT-3.5 Turbo',
    },
    pro: {
      model: 'gpt-4-turbo',
      tokenLimit: 75000,
      label: 'GPT-4 Turbo',
    },
    max: {
      model: 'gpt-4',
      tokenLimit: 100000,
      label: 'GPT-4',
    },
  };

  // AI Settings Validation Functions
  const validateAISettings = () => {
    const errors: string[] = [];

    if (maxTokens < 1000 || maxTokens > subscription.tokenLimit) {
      errors.push(
        `Token limit must be between 1,000 and ${subscription.tokenLimit.toLocaleString()}`
      );
    }

    const tempValue = parseFloat(temperature);
    if (isNaN(tempValue) || tempValue < 0 || tempValue > 1) {
      errors.push('Temperature must be between 0 and 1');
    }

    if (contextLength < 1 || contextLength > 20) {
      errors.push('Context length must be between 1 and 20');
    }

    return errors;
  };

  const handleModelChange = (newModel: string) => {
    // Find which plan this model belongs to
    const targetPlan = Object.entries(subscriptionConfig).find(
      ([_, config]) => config.model === newModel
    )?.[0] as SubscriptionPlan;

    if (!targetPlan) {
      setAiSettingsError('Invalid model selected');
      return;
    }

    if (targetPlan === subscription.plan) {
      // Same plan, allow the change
      setSubscription({
        ...subscription,
        model: newModel,
      });
      setAiSettingsError(null);
    } else {
      // Different plan - show upgrade prompt
      setAiSettingsError(
        `This model requires a ${targetPlan} subscription. Please upgrade to use ${subscriptionConfig[targetPlan].label}.`
      );
    }
  };

  const resetAISettingsToDefaults = () => {
    setMaxTokens(1000);
    setTemperature('0.7');
    setContextLength(10);
    setAutoComplete(true);
    setCodeSnippets(true);
    setAiSuggestions(true);
    setRealTimeAnalysis(true);
    setAiSettingsError(null);
  };

  // Notification Settings Validation Functions
  const validateNotificationSettings = () => {
    const errors: string[] = [];

    // Check for time conflicts
    if (notificationSchedule.workHoursStart >= notificationSchedule.workHoursEnd) {
      errors.push('Work hours end time must be after start time');
    }

    if (notificationSchedule.quietHoursStart === notificationSchedule.quietHoursEnd) {
      errors.push('Quiet hours start and end times cannot be the same');
    }

    // Check if any notification channels are enabled
    const hasChannels = notifications.email || notifications.desktop || notifications.sound;
    if (!hasChannels) {
      errors.push('At least one notification channel must be enabled');
    }

    // Check if any notification types are enabled
    const hasTypes =
      notifications.assignments ||
      notifications.deadlines ||
      notifications.feedback ||
      notifications.updates;
    if (!hasTypes) {
      errors.push('At least one notification type must be enabled');
    }

    return errors;
  };

  const resetNotificationSettingsToDefaults = () => {
    setNotifications({
      email: true,
      desktop: true,
      sound: true,
      assignments: true,
      deadlines: true,
      feedback: true,
      updates: true,
    });
    setNotificationPreferences({
      priorityLevel: 'medium',
      groupNotifications: true,
      showPreview: true,
      showBadge: true,
      showInTaskbar: true,
    });
    setNotificationSchedule({
      quietHoursStart: 22,
      quietHoursEnd: 7,
      workDays: [1, 2, 3, 4, 5], // Monday to Friday
      workHoursStart: 9,
      workHoursEnd: 17,
    });
    setNotificationSettingsError(null);
  };

  const enableAllNotifications = () => {
    setNotifications({
      email: true,
      desktop: true,
      sound: true,
      assignments: true,
      deadlines: true,
      feedback: true,
      updates: true,
    });
  };

  const disableAllNotifications = () => {
    setNotifications({
      email: false,
      desktop: false,
      sound: false,
      assignments: false,
      deadlines: false,
      feedback: false,
      updates: false,
    });
  };

  const getNotificationSummary = () => {
    const channels = [];
    if (notifications.email) channels.push('Email');
    if (notifications.desktop) channels.push('Desktop');
    if (notifications.sound) channels.push('Sound');

    const types = [];
    if (notifications.assignments) types.push('Assignments');
    if (notifications.deadlines) types.push('Deadlines');
    if (notifications.feedback) types.push('Feedback');
    if (notifications.updates) types.push('Updates');

    return {
      channels: channels.join(', ') || 'None',
      types: types.join(', ') || 'None',
      priority: notificationPreferences.priorityLevel,
      workHours: `${notificationSchedule.workHoursStart
        .toString()
        .padStart(2, '0')}:00 - ${notificationSchedule.workHoursEnd
        .toString()
        .padStart(2, '0')}:00`,
      quietHours: `${notificationSchedule.quietHoursStart
        .toString()
        .padStart(2, '0')}:00 - ${notificationSchedule.quietHoursEnd
        .toString()
        .padStart(2, '0')}:00`,
      workDays:
        notificationSchedule.workDays.length === 7
          ? 'Every day'
          : notificationSchedule.workDays.length === 5 &&
            notificationSchedule.workDays.includes(1) &&
            notificationSchedule.workDays.includes(5)
          ? 'Weekdays'
          : `${notificationSchedule.workDays.length} days selected`,
    };
  };

  // Privacy & Security Settings Validation Functions
  const validatePrivacySettings = () => {
    const errors: string[] = [];

    // Check for security conflicts
    if (privacySettings.autoLock && privacySettings.lockTimeout < 1) {
      errors.push('Auto-lock timeout must be at least 1 minute');
    }

    // Check for privacy conflicts
    if (privacySettings.allowTracking && !privacySettings.dataCollection) {
      errors.push('Activity tracking requires data collection to be enabled');
    }

    // Check for security recommendations
    if (!privacySettings.twoFactorAuth) {
      errors.push('Two-factor authentication is recommended for enhanced security');
    }

    if (securitySettings.passwordStrength === 'weak') {
      errors.push('Consider strengthening your password for better security');
    }

    return errors;
  };

  const resetPrivacySettingsToDefaults = () => {
    setPrivacySettings({
      twoFactorAuth: false,
      biometricLogin: false,
      dataCollection: true,
      shareAnalytics: true,
      showOnlineStatus: true,
      allowTracking: false,
      autoLock: true,
      lockTimeout: 5,
      passwordExpiry: 90,
      sessionTimeout: 30,
    });
    setPrivacySettingsError(null);
  };

  const enableAllSecurityFeatures = () => {
    setPrivacySettings({
      ...privacySettings,
      twoFactorAuth: true,
      biometricLogin: true,
      autoLock: true,
      allowTracking: false, // Keep this off for privacy
    });
  };

  const disableAllTracking = () => {
    setPrivacySettings({
      ...privacySettings,
      dataCollection: false,
      shareAnalytics: false,
      showOnlineStatus: false,
      allowTracking: false,
    });
  };

  const getSecuritySummary = () => {
    const enabledFeatures = [];
    if (privacySettings.twoFactorAuth) enabledFeatures.push('2FA');
    if (privacySettings.biometricLogin) enabledFeatures.push('Biometric');
    if (privacySettings.autoLock) enabledFeatures.push('Auto-lock');
    if (privacySettings.dataCollection) enabledFeatures.push('Data Collection');
    if (privacySettings.shareAnalytics) enabledFeatures.push('Analytics');

    const securityLevel =
      privacySettings.twoFactorAuth && privacySettings.autoLock
        ? 'High'
        : privacySettings.autoLock
        ? 'Medium'
        : 'Low';

    return {
      enabledFeatures: enabledFeatures.join(', ') || 'None',
      securityLevel,
      passwordStrength: securitySettings.passwordStrength,
      activeSessions: securitySettings.activeSessions,
      lastAudit: securitySettings.lastSecurityAudit,
    };
  };

  const calculateSecurityScore = () => {
    let score = 0;

    // Base score
    score += 20;

    // Password strength
    if (securitySettings.passwordStrength === 'strong') score += 20;
    else if (securitySettings.passwordStrength === 'medium') score += 10;

    // Two-factor authentication
    if (privacySettings.twoFactorAuth) score += 25;

    // Biometric login
    if (privacySettings.biometricLogin) score += 15;

    // Auto-lock
    if (privacySettings.autoLock) score += 10;

    // Session management
    if (securitySettings.activeSessions <= 2) score += 10;

    return Math.min(100, score);
  };

  const getSecurityRecommendations = () => {
    const recommendations = [];

    if (!privacySettings.twoFactorAuth) {
      recommendations.push('Enable two-factor authentication for enhanced security');
    }

    if (securitySettings.passwordStrength === 'weak') {
      recommendations.push('Strengthen your password with symbols and numbers');
    }

    if (securitySettings.activeSessions > 3) {
      recommendations.push('Review and close unused active sessions');
    }

    if (!privacySettings.autoLock) {
      recommendations.push('Enable auto-lock to protect your account when inactive');
    }

    if (privacySettings.allowTracking) {
      recommendations.push('Consider disabling activity tracking for enhanced privacy');
    }

    return recommendations;
  };

  // Model comparison data

  // Security checklist data
  const securityChecklist = [
    {
      id: 'password',
      title: 'Strong Password',
      description: 'Use a password with at least 6 characters (symbols optional)',
      status: 'warning',
      action: 'Change Password',
      icon: <VpnKeyOutlined />,
    },
    {
      id: '2fa',
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      status: privacySettings.twoFactorAuth ? 'success' : 'error',
      action: 'Enable 2FA',
      icon: <ShieldOutlined />,
    },
    {
      id: 'biometric',
      title: 'Biometric Login',
      description: 'Use fingerprint or face recognition for quick and secure login',
      status: privacySettings.biometricLogin ? 'success' : 'warning',
      action: 'Setup Biometric',
      icon: <FingerprintOutlined />,
    },
    {
      id: 'sessions',
      title: 'Active Sessions',
      description: 'Review and manage your active login sessions',
      status: 'info',
      action: 'View Sessions',
      icon: <HistoryOutlined />,
    },
    {
      id: 'updates',
      title: 'Security Updates',
      description: 'Keep your security settings up to date',
      status: 'success',
      action: 'Check Updates',
      icon: <SecurityUpdateOutlined />,
    },
  ];

  // Calculate security score

  // Notification preview data
  const notificationPreview = {
    title: 'Assignment Feedback Ready',
    message: 'Your AI analysis for "Research Paper" is now available',
    type: 'feedback',
    time: '2 minutes ago',
  };

  // Filter settings based on search query

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = async () => {
    try {
      // Validate AI settings before saving
      const aiErrors = validateAISettings();
      if (aiErrors.length > 0) {
        setAiSettingsError(aiErrors.join(', '));
        return;
      }

      // Validate notification settings before saving
      const notificationErrors = validateNotificationSettings();
      if (notificationErrors.length > 0) {
        setNotificationSettingsError(notificationErrors.join(', '));
        return;
      }

      // Validate privacy settings before saving
      const privacyErrors = validatePrivacySettings();
      if (privacyErrors.length > 0) {
        setPrivacySettingsError(privacyErrors.join(', '));
        return;
      }

      setIsValidatingSettings(true);
      setAiSettingsError(null);
      setNotificationSettingsError(null);
      setPrivacySettingsError(null);

      // Save to backend first
      await savePreferencesToBackend();

      // Also save to localStorage as fallback
      const settingsData = {
        appearance: {
          dark_mode: darkMode,
          font_size: fontSize,
          animations: animations,
          compact_mode: compactMode,
        },
        language: {
          language: language,
          timezone: timeZone,
          date_format: dateFormat,
        },
        notifications: {
          email: notifications.email,
          desktop: notifications.desktop,
          sound: notifications.sound,
          assignments: notifications.assignments,
          deadlines: notifications.deadlines,
          feedback: notifications.feedback,
          updates: notifications.updates,
          priority_level: notificationPreferences.priorityLevel,
          group_notifications: notificationPreferences.groupNotifications,
          show_preview: notificationPreferences.showPreview,
          show_badge: notificationPreferences.showBadge,
          show_in_taskbar: notificationPreferences.showInTaskbar,
          work_hours_start: notificationSchedule.workHoursStart,
          work_hours_end: notificationSchedule.workHoursEnd,
          work_days: notificationSchedule.workDays,
          quiet_hours_start: notificationSchedule.quietHoursStart,
          quiet_hours_end: notificationSchedule.quietHoursEnd,
        },
        privacy: {
          two_factor_auth: privacySettings.twoFactorAuth,
          biometric_login: privacySettings.biometricLogin,
          data_collection: privacySettings.dataCollection,
          share_analytics: privacySettings.shareAnalytics,
          show_online_status: privacySettings.showOnlineStatus,
          allow_tracking: privacySettings.allowTracking,
          auto_lock: privacySettings.autoLock,
          lock_timeout: privacySettings.lockTimeout,
          password_expiry: privacySettings.passwordExpiry,
          session_timeout: privacySettings.sessionTimeout,
        },
        ai: {
          max_tokens: maxTokens,
          temperature: parseFloat(temperature),
          context_length: contextLength,
          auto_complete: autoComplete,
          code_snippets: codeSnippets,
          ai_suggestions: aiSuggestions,
          real_time_analysis: realTimeAnalysis,
          model: subscription.model,
          plan: subscription.plan,
        },
      };

      console.log('Saving settings:', settingsData);

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      console.log('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setAiSettingsError('Failed to save AI settings. Please try again.');
      setNotificationSettingsError('Failed to save notification settings. Please try again.');
      setPrivacySettingsError('Failed to save privacy settings. Please try again.');
      setShowSaveSuccess(false);
    } finally {
      setIsValidatingSettings(false);
    }
  };

  const SettingsSection = ({ title, icon, children }: any) => (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 4,
        border: '2px solid',
        borderColor: 'error.main',
        borderRadius: 3,
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(50,50,50,0.9) 0%, rgba(40,40,40,0.9) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.9) 100%)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          borderColor: 'error.dark',
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: '#ffffff',
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h5" fontWeight="400">
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );

  useEffect(() => {
    // Apply font size using CSS custom property for better compatibility
    document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
  }, [fontSize]);

  // Apply animations setting
  useEffect(() => {
    if (!animations) {
      document.body.style.setProperty('--disable-animations', 'none');
    } else {
      document.body.style.removeProperty('--disable-animations');
    }
  }, [animations]);

  // Apply compact mode
  useEffect(() => {
    if (compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }, [compactMode]);

  // Apply dark mode setting (local effect for now)
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode-local');
    } else {
      document.body.classList.remove('dark-mode-local');
    }
  }, [darkMode]);

  // Apply language setting
  useEffect(() => {
    // Set document language attribute
    document.documentElement.lang = language;

    // Change language using i18n
    changeLanguage(language);

    // Apply language-specific changes
    if (language === 'es') {
      // Spanish
      document.body.classList.add('language-es');
      document.body.classList.remove(
        'language-fr',
        'language-de',
        'language-it',
        'language-pt',
        'language-ru',
        'language-zh',
        'language-ja',
        'language-ko'
      );
    } else if (language === 'fr') {
      // French
      document.body.classList.add('language-fr');
      document.body.classList.remove(
        'language-es',
        'language-de',
        'language-it',
        'language-pt',
        'language-ru',
        'language-zh',
        'language-ja',
        'language-ko'
      );
    } else if (language === 'de') {
      // German
      document.body.classList.add('language-de');
      document.body.classList.remove(
        'language-es',
        'language-fr',
        'language-it',
        'language-pt',
        'language-ru',
        'language-zh',
        'language-ja',
        'language-ko'
      );
    } else if (language === 'it') {
      // Italian
      document.body.classList.add('language-it');
      document.body.classList.remove(
        'language-es',
        'language-fr',
        'language-de',
        'language-pt',
        'language-ru',
        'language-zh',
        'language-ja',
        'language-ko'
      );
    } else if (language === 'pt') {
      // Portuguese
      document.body.classList.add('language-pt');
      document.body.classList.remove(
        'language-es',
        'language-fr',
        'language-de',
        'language-it',
        'language-ru',
        'language-zh',
        'language-ja',
        'language-ko'
      );
    } else if (language === 'ru') {
      // Russian
      document.body.classList.add('language-ru');
      document.body.classList.remove(
        'language-es',
        'language-fr',
        'language-de',
        'language-it',
        'language-pt',
        'language-zh',
        'language-ja',
        'language-ko'
      );
    } else if (language === 'zh') {
      // Chinese
      document.body.classList.add('language-zh');
      document.body.classList.remove(
        'language-es',
        'language-fr',
        'language-de',
        'language-it',
        'language-pt',
        'language-ru',
        'language-ja',
        'language-ko'
      );
    } else if (language === 'ja') {
      // Japanese
      document.body.classList.add('language-ja');
      document.body.classList.remove(
        'language-es',
        'language-fr',
        'language-de',
        'language-it',
        'language-pt',
        'language-ru',
        'language-zh',
        'language-ko'
      );
    } else if (language === 'ko') {
      // Korean
      document.body.classList.add('language-ko');
      document.body.classList.remove(
        'language-es',
        'language-fr',
        'language-de',
        'language-it',
        'language-pt',
        'language-ru',
        'language-zh',
        'language-ja'
      );
    } else {
      // English (default)
      document.body.classList.remove(
        'language-es',
        'language-fr',
        'language-de',
        'language-it',
        'language-pt',
        'language-ru',
        'language-zh',
        'language-ja',
        'language-ko'
      );
    }

    console.log('Language changed to:', language);
  }, [language, changeLanguage]);

  // Apply timezone setting
  useEffect(() => {
    // Store timezone preference in localStorage for future use
    localStorage.setItem('userTimezone', timeZone);
    console.log('Timezone changed to:', timeZone);
  }, [timeZone]);

  // Apply date format setting
  useEffect(() => {
    // Store date format preference in localStorage for future use
    localStorage.setItem('dateFormat', dateFormat.toString());
    console.log('Date format changed to:', dateFormat);
  }, [dateFormat]);

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const loadSavedSettings = () => {
      // Load language settings
      const savedLanguage = localStorage.getItem('userTimezone');
      if (savedLanguage) setTimeZone(savedLanguage);

      const savedDateFormat = localStorage.getItem('dateFormat');
      if (
        savedDateFormat &&
        ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY'].includes(savedDateFormat)
      ) {
        setDateFormat(savedDateFormat as DateFormat);
      }
    };

    // Try to load from backend first, fall back to localStorage
    loadPreferencesFromBackend().catch(() => {
      loadSavedSettings();
    });
  }, []);

  // Load preferences from backend
  const loadPreferencesFromBackend = async () => {
    setIsLoadingPreferences(true);
    try {
      const userPreferences = await preferences.get();
      if (userPreferences.custom_preferences?.timezone) {
        setTimeZone(userPreferences.custom_preferences.timezone);
      }
      if (userPreferences.custom_preferences?.dateFormat) {
        const format = userPreferences.custom_preferences.dateFormat as string;
        if (['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY'].includes(format)) {
          setDateFormat(format as DateFormat);
        }
      }
      if (userPreferences.language) {
        setLanguage(userPreferences.language);
      }
      if (userPreferences.theme) {
        setDarkMode(userPreferences.theme === 'dark');
      }
      if (userPreferences.font_size) {
        setFontSize(parseInt(userPreferences.font_size) || 14);
      }
      if (userPreferences.compact_mode !== undefined) {
        setCompactMode(userPreferences.compact_mode);
      }
      if (userPreferences.email_notifications !== undefined) {
        setNotifications(prev => ({ ...prev, email: !!userPreferences.email_notifications }));
      }
      if (userPreferences.push_notifications !== undefined) {
        setNotifications(prev => ({ ...prev, desktop: !!userPreferences.push_notifications }));
      }

      // Load AI settings
      if (userPreferences.custom_preferences?.maxTokens) {
        setMaxTokens(Number(userPreferences.custom_preferences.maxTokens) || 1000);
      }
      if (userPreferences.custom_preferences?.temperature) {
        setTemperature(userPreferences.custom_preferences.temperature.toString() || '0.7');
      }
      if (userPreferences.custom_preferences?.contextLength) {
        setContextLength(Number(userPreferences.custom_preferences.contextLength) || 10);
      }
      if (userPreferences.custom_preferences?.autoComplete !== undefined) {
        setAutoComplete(!!userPreferences.custom_preferences.autoComplete);
      }
      if (userPreferences.custom_preferences?.codeSnippets !== undefined) {
        setCodeSnippets(!!userPreferences.custom_preferences.codeSnippets);
      }
      if (userPreferences.custom_preferences?.aiSuggestions !== undefined) {
        setAiSuggestions(!!userPreferences.custom_preferences.aiSuggestions);
      }
      if (userPreferences.custom_preferences?.realTimeAnalysis !== undefined) {
        setRealTimeAnalysis(!!userPreferences.custom_preferences.realTimeAnalysis);
      }
      if (userPreferences.custom_preferences?.model) {
        setSubscription(prev => ({ ...prev, model: userPreferences.custom_preferences!.model }));
      }
      if (userPreferences.custom_preferences?.plan) {
        setSubscription(prev => ({
          ...prev,
          plan: userPreferences.custom_preferences!.plan as SubscriptionPlan,
        }));
      }
    } catch (error) {
      console.warn('Failed to load preferences from backend:', error);
      // Fall back to localStorage
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  // Save preferences to backend
  const savePreferencesToBackend = async () => {
    try {
      await preferences.update({
        language,
        theme: darkMode ? 'dark' : 'light',
        font_size: fontSize.toString(),
        compact_mode: compactMode,
        email_notifications: notifications.email,
        push_notifications: notifications.desktop,
        custom_preferences: {
          timezone: timeZone,
          dateFormat,
          maxTokens,
          temperature,
          contextLength,
          autoComplete,
          codeSnippets,
          aiSuggestions,
          realTimeAnalysis,
          notificationPreferences,
          notificationSchedule,
          privacySettings,
        },
      });
    } catch (error) {
      console.error('Failed to save preferences to backend:', error);
      throw error;
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        px: 2,
        pb: 4,
      }}
    >
      {showSaveSuccess && (
        <Alert
          severity="success"
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            borderRadius: 2,
            boxShadow: theme.shadows[4],
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              from: { transform: 'translateX(100%)', opacity: 0 },
              to: { transform: 'translateX(0)', opacity: 1 },
            },
          }}
        >
          {t('settings.settingsSavedSuccessfully')}
        </Alert>
      )}

      {isLoadingPreferences && (
        <Alert
          severity="info"
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            borderRadius: 2,
            boxShadow: theme.shadows[4],
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              from: { transform: 'translateX(100%)', opacity: 0 },
              to: { transform: 'translateX(0)', opacity: 1 },
            },
          }}
        >
          Loading preferences from server...
        </Alert>
      )}

      <Box
        sx={{
          mb: 5,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 3 },
          pt: 2,
          pb: 2,
          px: { xs: 1, md: 0 },
        }}
      >
        <Typography
          variant="h4"
          fontWeight="normal"
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            ml: { xs: 0, md: 4 },
            fontSize: { xs: '1.75rem', md: '2.125rem' },
          }}
        >
          {t('settings.title')}
        </Typography>

        {/* Search Bar */}
        <TextField
          placeholder={t('settings.searchSettings')}
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{
            flex: 1,
            maxWidth: { xs: '100%', md: 400 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor:
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={isValidatingSettings}
          sx={{
            ml: { xs: 0, md: 'auto' },
            px: { xs: 2, md: 4 },
            py: 1.5,
            borderRadius: 3,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            boxShadow: '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(33,150,243,0.4)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 7px 30px -10px rgba(33,150,243,0.6)',
            },
          }}
        >
          {isValidatingSettings ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              Validating...
            </Box>
          ) : (
            t('settings.saveChanges')
          )}
        </Button>
      </Box>

      <Box
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[2],
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        }}
      >
        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 70,
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                flex: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
                '& .MuiSvgIcon-root': {
                  background: '#ffffff',
                  padding: '6px',
                  borderRadius: '8px',
                  fontSize: '1.3rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  color: theme.palette.primary.main,
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              },
            }}
          >
            <Tab icon={<Tune />} label="General" sx={{ gap: 1 }} />
            <Tab icon={<Psychology />} label={t('settings.ai.title')} sx={{ gap: 1 }} />
            <Tab
              icon={<Notifications />}
              label={t('settings.notifications.title')}
              sx={{ gap: 1 }}
            />
            <Tab icon={<SecurityOutlined />} label={t('settings.privacy.title')} sx={{ gap: 1 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <TabPanel value={tabValue} index={0} breakpoint={breakpoint}>
            <SettingsSection
              title={t('settings.appearance.title')}
              icon={<Brush sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                      }
                      label={t('settings.appearance.darkMode')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={animations}
                          onChange={e => setAnimations(e.target.checked)}
                        />
                      }
                      label={t('settings.appearance.enableAnimations')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={compactMode}
                          onChange={e => setCompactMode(e.target.checked)}
                        />
                      }
                      label={t('settings.appearance.compactMode')}
                    />
                  </FormGroup>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>{t('settings.appearance.fontSize')}</Typography>
                  <Slider
                    value={fontSize}
                    onChange={(_e, value) => setFontSize(value as number)}
                    min={12}
                    max={20}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    disableSwap
                  />
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title={t('settings.language.title')}
              icon={<Language sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>{t('settings.language.language')}</InputLabel>
                    <Select
                      value={language}
                      label={t('settings.language.language')}
                      onChange={e => setLanguage(e.target.value)}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="fr">Français</MenuItem>
                      <MenuItem value="de">Deutsch</MenuItem>
                      <MenuItem value="it">Italiano</MenuItem>
                      <MenuItem value="pt">Português</MenuItem>
                      <MenuItem value="ru">Русский</MenuItem>
                      <MenuItem value="zh">中文</MenuItem>
                      <MenuItem value="ja">日本語</MenuItem>
                      <MenuItem value="ko">한국어</MenuItem>
                    </Select>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      {t('settings.language.currentLanguage')}:{' '}
                      {language === 'en'
                        ? 'English'
                        : language === 'es'
                        ? 'Español'
                        : language === 'fr'
                        ? 'Français'
                        : language === 'de'
                        ? 'Deutsch'
                        : language === 'it'
                        ? 'Italiano'
                        : language === 'pt'
                        ? 'Português'
                        : language === 'ru'
                        ? 'Русский'
                        : language === 'zh'
                        ? '中文'
                        : language === 'ja'
                        ? '日本語'
                        : language === 'ko'
                        ? '한국어'
                        : 'English'}
                    </Typography>
                  </FormControl>

                  <Box sx={{ mb: 2 }}>
                    <TimezoneSelector
                      value={timeZone}
                      onChange={setTimeZone}
                      onValidationError={setTimezoneError}
                      label={t('settings.language.timeZone')}
                      showExtended={false}
                      fullWidth={true}
                      size="medium"
                      enableAutoDetection={true}
                    />
                    {timezoneError && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 0.5, display: 'block' }}
                      >
                        {timezoneError}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <DateFormatSelector
                      value={dateFormat}
                      onChange={setDateFormat}
                      onValidationError={setDateFormatError}
                      label={t('settings.language.dateFormat')}
                      fullWidth={true}
                      size="medium"
                      enableAutoDetection={true}
                      showPreview={true}
                    />
                    {dateFormatError && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 0.5, display: 'block' }}
                      >
                        {dateFormatError}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.02)'
                          : 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ color: theme.palette.primary.main, mb: 2 }}
                    >
                      Current Configuration
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Language fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="medium">
                          {language === 'en'
                            ? 'English'
                            : language === 'es'
                            ? 'Español'
                            : language === 'fr'
                            ? 'Français'
                            : language === 'de'
                            ? 'Deutsch'
                            : language === 'it'
                            ? 'Italiano'
                            : language === 'pt'
                            ? 'Português'
                            : language === 'ru'
                            ? 'Русский'
                            : language === 'zh'
                            ? '中文'
                            : language === 'ja'
                            ? '日本語'
                            : language === 'ko'
                            ? '한국어'
                            : 'English'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <EventOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          {timeZone === 'UTC' ? 'Universal Time (UTC)' : timeZone}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventOutlined fontSize="small" color="action" />
                        <Typography variant="body2">{dateFormat} format</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Preview:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                      >
                        {new Date().toLocaleString(language === 'en' ? 'en-US' : language, {
                          timeZone: timeZone,
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>

                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            try {
                              const detectedTimezone =
                                Intl.DateTimeFormat().resolvedOptions().timeZone;
                              setTimeZone(detectedTimezone);
                            } catch (error) {
                              console.warn('Could not detect timezone:', error);
                            }
                          }}
                          sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}
                        >
                          Auto-detect
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setLanguage('en');
                            setTimeZone('UTC');
                            setDateFormat('MM/DD/YYYY');
                          }}
                          sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}
                        >
                          Reset
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>

          <TabPanel value={tabValue} index={1} breakpoint={breakpoint}>
            <SettingsSection
              title={t('settings.ai.modelConfiguration')}
              icon={<Psychology sx={{ color: theme.palette.primary.main }} />}
            >
              {aiSettingsError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {aiSettingsError}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('settings.ai.aiModel')}</InputLabel>
                    <Select
                      value={subscription.model}
                      label={t('settings.ai.aiModel')}
                      onChange={e => handleModelChange(e.target.value)}
                    >
                      {Object.entries(subscriptionConfig).map(([plan, config]) => (
                        <MenuItem
                          key={plan}
                          value={config.model}
                          disabled={plan !== subscription.plan}
                          sx={{
                            color: plan === subscription.plan ? 'text.primary' : 'text.disabled',
                            '&.Mui-disabled': {
                              opacity: 0.7,
                            },
                          }}
                        >
                          {config.label}
                          {plan !== subscription.plan && (
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ ml: 1, color: 'text.secondary' }}
                            >
                              ({plan.charAt(0).toUpperCase() + plan.slice(1)} plan)
                            </Typography>
                          )}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Model is determined by your subscription plan
                    </Typography>
                  </FormControl>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CompareArrows />}
                      onClick={() => setShowModelComparison(true)}
                      size="small"
                    >
                      Compare Models
                    </Button>
                    <Button variant="outlined" onClick={resetAISettingsToDefaults} size="small">
                      Reset to Defaults
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    {t('settings.ai.tokenLimit')} (Max: {subscription.tokenLimit.toLocaleString()})
                  </Typography>
                  <Slider
                    value={maxTokens}
                    onChange={(_e, value) => setMaxTokens(value as number)}
                    min={1000}
                    max={subscription.tokenLimit}
                    step={1000}
                    valueLabelDisplay="auto"
                    valueLabelFormat={value => value.toLocaleString()}
                    marks={[
                      { value: 1000, label: '1,000' },
                      {
                        value: Math.floor(subscription.tokenLimit * 0.25),
                        label: Math.floor(subscription.tokenLimit * 0.25).toLocaleString(),
                      },
                      {
                        value: Math.floor(subscription.tokenLimit * 0.5),
                        label: Math.floor(subscription.tokenLimit * 0.5).toLocaleString(),
                      },
                      {
                        value: Math.floor(subscription.tokenLimit * 0.75),
                        label: Math.floor(subscription.tokenLimit * 0.75).toLocaleString(),
                      },
                      {
                        value: subscription.tokenLimit,
                        label: subscription.tokenLimit.toLocaleString(),
                      },
                    ]}
                    disableSwap
                    sx={{
                      '& .MuiSlider-markLabel': {
                        fontSize: '0.75rem',
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Maximum token limit is determined by your subscription plan. Higher limits allow
                    for longer, more detailed responses.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>{t('settings.ai.temperature')}</Typography>
                  <Slider
                    value={parseFloat(temperature)}
                    onChange={(_e, value) => setTemperature(value.toString())}
                    min={0}
                    max={1}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                    disableSwap
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Controls creativity vs consistency. Lower values (0.1-0.3) are more focused,
                    higher values (0.7-1.0) are more creative.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>{t('settings.ai.contextLength')}</Typography>
                  <Slider
                    value={contextLength}
                    onChange={(_e, value) => setContextLength(value as number)}
                    min={1}
                    max={20}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    disableSwap
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Number of previous messages to consider for context. Higher values provide
                    better continuity but use more tokens.
                  </Typography>
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title={t('settings.ai.aiFeatures')}
              icon={<Widgets sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Core AI Features
                  </Typography>
                  <FormGroup>
                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={autoComplete}
                            onChange={e => setAutoComplete(e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {t('settings.ai.aiAutoComplete')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Provides intelligent code completion as you type
                            </Typography>
                          </Box>
                        }
                      />
                      {autoComplete && (
                        <Typography
                          variant="caption"
                          color="success.main"
                          sx={{ ml: 4, display: 'block' }}
                        >
                          ✓ Auto-complete is active in code editors
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={codeSnippets}
                            onChange={e => setCodeSnippets(e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {t('settings.ai.codeSnippetsGeneration')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Generates boilerplate code and common patterns
                            </Typography>
                          </Box>
                        }
                      />
                      {codeSnippets && (
                        <Typography
                          variant="caption"
                          color="success.main"
                          sx={{ ml: 4, display: 'block' }}
                        >
                          ✓ Code snippets available in editor
                        </Typography>
                      )}
                    </Box>
                  </FormGroup>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Advanced Features
                  </Typography>
                  <FormGroup>
                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={aiSuggestions}
                            onChange={e => setAiSuggestions(e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {t('settings.ai.aiSuggestions')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Provides real-time coding hints and refactoring suggestions
                            </Typography>
                          </Box>
                        }
                      />
                      {aiSuggestions && (
                        <Typography
                          variant="caption"
                          color="success.main"
                          sx={{ ml: 4, display: 'block' }}
                        >
                          ✓ AI suggestions active in editor
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={realTimeAnalysis}
                            onChange={e => setRealTimeAnalysis(e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {t('settings.ai.realTimeAnalysis')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Analyzes code quality and provides immediate feedback
                            </Typography>
                          </Box>
                        }
                      />
                      {realTimeAnalysis && (
                        <Box sx={{ ml: 4 }}>
                          <Typography
                            variant="caption"
                            color="success.main"
                            sx={{ display: 'block' }}
                          >
                            ✓ Real-time analysis active
                          </Typography>
                          <Typography
                            variant="caption"
                            color="warning.main"
                            sx={{ display: 'block' }}
                          >
                            ⚠ May impact performance on large files
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </FormGroup>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      Active features:{' '}
                      {[
                        autoComplete && 'Auto-complete',
                        codeSnippets && 'Code snippets',
                        aiSuggestions && 'AI suggestions',
                        realTimeAnalysis && 'Real-time analysis',
                      ]
                        .filter(Boolean)
                        .join(', ') || 'None'}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setAutoComplete(true);
                        setCodeSnippets(true);
                        setAiSuggestions(true);
                        setRealTimeAnalysis(false); // Keep this off by default due to performance
                      }}
                    >
                      Enable All (Recommended)
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setAutoComplete(false);
                        setCodeSnippets(false);
                        setAiSuggestions(false);
                        setRealTimeAnalysis(false);
                      }}
                    >
                      Disable All
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setShowAIFeaturesDemo(true)}
                      sx={{ ml: 'auto' }}
                    >
                      Test AI Features
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>

          <TabPanel value={tabValue} index={2} breakpoint={breakpoint}>
            <SettingsSection
              title={t('settings.notifications.notificationPreferences')}
              icon={<NotificationsOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              {notificationSettingsError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {notificationSettingsError}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.notifications.notificationChannels')}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.email}
                          onChange={e =>
                            setNotifications({ ...notifications, email: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailOutlined fontSize="small" />
                          <Typography>{t('settings.notifications.emailNotifications')}</Typography>
                        </Box>
                      }
                    />
                    {notifications.email && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Email notifications will be sent to your registered email
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.desktop}
                          onChange={e =>
                            setNotifications({ ...notifications, desktop: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DesktopWindowsOutlined fontSize="small" />
                          <Typography>
                            {t('settings.notifications.desktopNotifications')}
                          </Typography>
                        </Box>
                      }
                    />
                    {notifications.desktop && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Desktop notifications will appear in your system tray
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.sound}
                          onChange={e =>
                            setNotifications({ ...notifications, sound: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <NotificationsOutlined fontSize="small" />
                          <Typography>{t('settings.notifications.soundNotifications')}</Typography>
                        </Box>
                      }
                    />
                    {notifications.sound && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Sound alerts will play for new notifications
                      </Typography>
                    )}
                  </FormGroup>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.notifications.notificationTypes')}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.assignments}
                          onChange={e =>
                            setNotifications({ ...notifications, assignments: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssignmentOutlined fontSize="small" />
                          <Typography>{t('settings.notifications.assignmentUpdates')}</Typography>
                        </Box>
                      }
                    />
                    {notifications.assignments && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Get notified about new assignments and updates
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.deadlines}
                          onChange={e =>
                            setNotifications({ ...notifications, deadlines: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventOutlined fontSize="small" />
                          <Typography>{t('settings.notifications.deadlineReminders')}</Typography>
                        </Box>
                      }
                    />
                    {notifications.deadlines && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Receive deadline reminders and alerts
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.feedback}
                          onChange={e =>
                            setNotifications({ ...notifications, feedback: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FeedbackOutlined fontSize="small" />
                          <Typography>
                            {t('settings.notifications.feedbackNotifications')}
                          </Typography>
                        </Box>
                      }
                    />
                    {notifications.feedback && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Get notified when feedback is available
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.updates}
                          onChange={e =>
                            setNotifications({ ...notifications, updates: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <UpdateOutlined fontSize="small" />
                          <Typography>{t('settings.notifications.systemUpdates')}</Typography>
                        </Box>
                      }
                    />
                    {notifications.updates && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Receive system updates and announcements
                      </Typography>
                    )}
                  </FormGroup>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      Active notifications:{' '}
                      {[
                        notifications.email && 'Email',
                        notifications.desktop && 'Desktop',
                        notifications.sound && 'Sound',
                      ]
                        .filter(Boolean)
                        .join(', ') || 'None'}
                    </Typography>
                    <Button variant="outlined" size="small" onClick={enableAllNotifications}>
                      Enable All
                    </Button>
                    <Button variant="outlined" size="small" onClick={disableAllNotifications}>
                      Disable All
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={resetNotificationSettingsToDefaults}
                    >
                      Reset to Defaults
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setShowNotificationTest(true)}
                      sx={{ ml: 'auto' }}
                    >
                      Test Notifications
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title={t('settings.notifications.displayPreferences')}
              icon={<NotificationsActiveOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.notifications.displayPreferences')}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationPreferences.showPreview}
                          onChange={e =>
                            setNotificationPreferences({
                              ...notificationPreferences,
                              showPreview: e.target.checked,
                            })
                          }
                        />
                      }
                      label={t('settings.notifications.showNotificationPreview')}
                    />
                    {notificationPreferences.showPreview && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Notification content will be visible in preview
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationPreferences.showBadge}
                          onChange={e =>
                            setNotificationPreferences({
                              ...notificationPreferences,
                              showBadge: e.target.checked,
                            })
                          }
                        />
                      }
                      label={t('settings.notifications.showNotificationBadge')}
                    />
                    {notificationPreferences.showBadge && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Badge will show unread notification count
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationPreferences.groupNotifications}
                          onChange={e =>
                            setNotificationPreferences({
                              ...notificationPreferences,
                              groupNotifications: e.target.checked,
                            })
                          }
                        />
                      }
                      label={t('settings.notifications.groupSimilarNotifications')}
                    />
                    {notificationPreferences.groupNotifications && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Similar notifications will be grouped together
                      </Typography>
                    )}
                  </FormGroup>

                  <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                    {t('settings.notifications.priorityLevel')}
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={notificationPreferences.priorityLevel}
                      onChange={e =>
                        setNotificationPreferences({
                          ...notificationPreferences,
                          priorityLevel: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="low">{t('settings.notifications.lowPriority')}</MenuItem>
                      <MenuItem value="medium">
                        {t('settings.notifications.mediumPriority')}
                      </MenuItem>
                      <MenuItem value="high">{t('settings.notifications.highPriority')}</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {notificationPreferences.priorityLevel === 'low' &&
                      'Low priority notifications will be delivered with minimal interruption'}
                    {notificationPreferences.priorityLevel === 'medium' &&
                      'Medium priority notifications will be delivered normally'}
                    {notificationPreferences.priorityLevel === 'high' &&
                      'High priority notifications will be delivered immediately and may override quiet hours'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.02)'
                          : 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ color: theme.palette.primary.main, mb: 2 }}
                    >
                      Current Configuration
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <NotificationsOutlined fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="medium">
                          Channels: {getNotificationSummary().channels}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <AssignmentOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Types: {getNotificationSummary().types}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <EventOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Priority: {getNotificationSummary().priority}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <EventOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Work Hours: {getNotificationSummary().workHours}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <EventOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Quiet Hours: {getNotificationSummary().quietHours}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Work Days: {getNotificationSummary().workDays}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setShowNotificationPreview(true)}
                        sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}
                      >
                        Preview Notifications
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title={t('settings.notifications.workHours')}
              icon={<EventOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.notifications.workHours')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>{t('settings.sound.startTime')}</InputLabel>
                        <Select
                          value={notificationSchedule.workHoursStart}
                          label={t('settings.sound.startTime')}
                          onChange={e =>
                            setNotificationSchedule({
                              ...notificationSchedule,
                              workHoursStart: Number(e.target.value),
                            })
                          }
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <MenuItem key={i} value={i}>
                              {i.toString().padStart(2, '0')}:00
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>{t('settings.sound.endTime')}</InputLabel>
                        <Select
                          value={notificationSchedule.workHoursEnd}
                          label={t('settings.sound.endTime')}
                          onChange={e =>
                            setNotificationSchedule({
                              ...notificationSchedule,
                              workHoursEnd: Number(e.target.value),
                            })
                          }
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <MenuItem key={i} value={i}>
                              {i.toString().padStart(2, '0')}:00
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Notifications will be prioritized during work hours
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.notifications.workDays')}
                  </Typography>
                  <FormGroup row>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <FormControlLabel
                        key={day}
                        control={
                          <Switch
                            checked={notificationSchedule.workDays.includes(index)}
                            onChange={e => {
                              const newWorkDays = e.target.checked
                                ? [...notificationSchedule.workDays, index]
                                : notificationSchedule.workDays.filter(d => d !== index);
                              setNotificationSchedule({
                                ...notificationSchedule,
                                workDays: newWorkDays,
                              });
                            }}
                            size="small"
                          />
                        }
                        label={day}
                        sx={{ minWidth: 80 }}
                      />
                    ))}
                  </FormGroup>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Select the days when you want to receive work-related notifications
                  </Typography>
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title={t('settings.sound.quietHours')}
              icon={<NotificationsOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.sound.quietHours')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>{t('settings.sound.startTime')}</InputLabel>
                        <Select
                          value={notificationSchedule.quietHoursStart}
                          label={t('settings.sound.startTime')}
                          onChange={e =>
                            setNotificationSchedule({
                              ...notificationSchedule,
                              quietHoursStart: Number(e.target.value),
                            })
                          }
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <MenuItem key={i} value={i}>
                              {i.toString().padStart(2, '0')}:00
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>{t('settings.sound.endTime')}</InputLabel>
                        <Select
                          value={notificationSchedule.quietHoursEnd}
                          label={t('settings.sound.endTime')}
                          onChange={e =>
                            setNotificationSchedule({
                              ...notificationSchedule,
                              quietHoursEnd: Number(e.target.value),
                            })
                          }
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <MenuItem key={i} value={i}>
                              {i.toString().padStart(2, '0')}:00
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Notifications will be silenced during quiet hours, except for high-priority
                    alerts
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Alert severity="info" sx={{ height: 'fit-content' }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Quiet Hours Tips:</strong>
                    </Typography>
                    <Typography variant="caption" component="div">
                      • High-priority notifications will still be delivered
                    </Typography>
                    <Typography variant="caption" component="div">
                      • Set quiet hours to avoid interruptions during sleep
                    </Typography>
                    <Typography variant="caption" component="div">
                      • Consider setting different hours for weekdays vs weekends
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>

          <TabPanel value={tabValue} index={3} breakpoint={breakpoint}>
            <SettingsSection
              title={t('settings.privacy.securityScore')}
              icon={<SecurityOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              {privacySettingsError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {privacySettingsError}
                </Alert>
              )}

              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 2,
                    gap: { xs: 1, sm: 2 },
                  }}
                >
                  <Typography variant="h6">{t('settings.privacy.securityScore')}</Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color:
                        calculateSecurityScore() >= 80
                          ? 'success.main'
                          : calculateSecurityScore() >= 50
                          ? 'warning.main'
                          : 'error.main',
                    }}
                  >
                    {calculateSecurityScore()}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateSecurityScore()}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor:
                        calculateSecurityScore() >= 80
                          ? 'success.main'
                          : calculateSecurityScore() >= 50
                          ? 'warning.main'
                          : 'error.main',
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  {t('settings.privacy.lastSecurityAudit')}: {securitySettings.lastSecurityAudit}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    Security Level: {getSecuritySummary().securityLevel}
                  </Typography>
                  <Button variant="outlined" size="small" onClick={enableAllSecurityFeatures}>
                    Enable All Security
                  </Button>
                  <Button variant="outlined" size="small" onClick={disableAllTracking}>
                    Disable All Tracking
                  </Button>
                  <Button variant="outlined" size="small" onClick={resetPrivacySettingsToDefaults}>
                    Reset to Defaults
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setShowSecurityAudit(true)}
                    sx={{ ml: 'auto' }}
                  >
                    Security Audit
                  </Button>
                </Box>
              </Box>

              <List>
                {securityChecklist.map(item => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: { xs: 1, sm: 0 },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          mb: { xs: 1, sm: 0 },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.title}
                          secondary={item.description}
                          primaryTypographyProps={{
                            sx: {
                              color:
                                item.status === 'success'
                                  ? 'success.main'
                                  : item.status === 'warning'
                                  ? 'warning.main'
                                  : item.status === 'error'
                                  ? 'error.main'
                                  : 'text.primary',
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                            },
                          }}
                          secondaryTypographyProps={{
                            sx: {
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              wordBreak: 'break-word',
                            },
                          }}
                        />
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Handle action based on item.id
                          if (item.id === '2fa') {
                            setShowTwoFactorSetup(true);
                          }
                        }}
                        startIcon={
                          item.status === 'success' ? (
                            <CheckCircle color="success" />
                          ) : item.status === 'warning' ? (
                            <Warning color="warning" />
                          ) : item.status === 'error' ? (
                            <Error color="error" />
                          ) : (
                            <Info color="info" />
                          )
                        }
                        sx={{
                          alignSelf: { xs: 'flex-start', sm: 'center' },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          px: { xs: 1, sm: 2 },
                        }}
                      >
                        {item.action}
                      </Button>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </SettingsSection>

            <SettingsSection
              title={t('settings.privacy.privacySettings')}
              icon={<PrivacyTipOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={{ xs: 2, md: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.privacy.dataPrivacy')}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.dataCollection}
                          onChange={e =>
                            setPrivacySettings({
                              ...privacySettings,
                              dataCollection: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                        >
                          <DataUsageOutlined fontSize="small" />
                          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('settings.privacy.allowDataCollection')}
                          </Typography>
                        </Box>
                      }
                    />
                    {privacySettings.dataCollection && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Data collection helps improve your experience
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.shareAnalytics}
                          onChange={e =>
                            setPrivacySettings({
                              ...privacySettings,
                              shareAnalytics: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                        >
                          <AnalyticsOutlined fontSize="small" />
                          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('settings.privacy.shareAnalytics')}
                          </Typography>
                        </Box>
                      }
                    />
                    {privacySettings.shareAnalytics && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Analytics help us improve the platform
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.showOnlineStatus}
                          onChange={e =>
                            setPrivacySettings({
                              ...privacySettings,
                              showOnlineStatus: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                        >
                          <VisibilityOutlined fontSize="small" />
                          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('settings.privacy.showOnlineStatus')}
                          </Typography>
                        </Box>
                      }
                    />
                    {privacySettings.showOnlineStatus && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Others can see when you're online
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.allowTracking}
                          onChange={e =>
                            setPrivacySettings({
                              ...privacySettings,
                              allowTracking: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                        >
                          <VisibilityOffOutlined fontSize="small" />
                          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('settings.privacy.allowActivityTracking')}
                          </Typography>
                        </Box>
                      }
                    />
                    {privacySettings.allowTracking && (
                      <Typography
                        variant="caption"
                        color="warning.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ⚠ Activity tracking is enabled for personalized features
                      </Typography>
                    )}
                  </FormGroup>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.privacy.accountSecurity')}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.twoFactorAuth}
                          onChange={e =>
                            setPrivacySettings({
                              ...privacySettings,
                              twoFactorAuth: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                        >
                          <ShieldOutlined fontSize="small" />
                          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('settings.privacy.twoFactorAuthentication')}
                          </Typography>
                        </Box>
                      }
                    />
                    {privacySettings.twoFactorAuth && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Two-factor authentication provides extra security
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.biometricLogin}
                          onChange={e =>
                            setPrivacySettings({
                              ...privacySettings,
                              biometricLogin: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                        >
                          <FingerprintOutlined fontSize="small" />
                          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('settings.privacy.biometricLogin')}
                          </Typography>
                        </Box>
                      }
                    />
                    {privacySettings.biometricLogin && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Biometric login provides convenient and secure access
                      </Typography>
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.autoLock}
                          onChange={e =>
                            setPrivacySettings({
                              ...privacySettings,
                              autoLock: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                        >
                          <LockOutlined fontSize="small" />
                          <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('settings.privacy.autoLockAccount')}
                          </Typography>
                        </Box>
                      }
                    />
                    {privacySettings.autoLock && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 4, display: 'block' }}
                      >
                        ✓ Account will auto-lock after {privacySettings.lockTimeout} minutes of
                        inactivity
                      </Typography>
                    )}
                  </FormGroup>

                  <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                    {t('settings.privacy.autoLockTimeout')}
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={privacySettings.lockTimeout}
                      onChange={e =>
                        setPrivacySettings({
                          ...privacySettings,
                          lockTimeout: Number(e.target.value),
                        })
                      }
                      disabled={!privacySettings.autoLock}
                    >
                      <MenuItem value={5}>5 minutes</MenuItem>
                      <MenuItem value={15}>15 minutes</MenuItem>
                      <MenuItem value={30}>30 minutes</MenuItem>
                      <MenuItem value={60}>1 hour</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.privacy.securityInformation')}
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: { xs: 0, md: 2 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 40, md: 56 } }}>
                        <VpnKeyOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('settings.privacy.passwordStrength')}
                        secondary={securitySettings.passwordStrength}
                        primaryTypographyProps={{
                          sx: { fontSize: { xs: '0.875rem', md: '1rem' } },
                        }}
                        secondaryTypographyProps={{
                          sx: { fontSize: { xs: '0.75rem', md: '0.875rem' } },
                        }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: { xs: 0, md: 2 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 40, md: 56 } }}>
                        <HistoryOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('settings.privacy.lastPasswordChange')}
                        secondary={securitySettings.lastPasswordChange}
                        primaryTypographyProps={{
                          sx: { fontSize: { xs: '0.875rem', md: '1rem' } },
                        }}
                        secondaryTypographyProps={{
                          sx: { fontSize: { xs: '0.75rem', md: '0.875rem' } },
                        }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: { xs: 0, md: 2 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 40, md: 56 } }}>
                        <VerifiedUserOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('settings.privacy.activeSessions')}
                        secondary={`${securitySettings.activeSessions} ${t(
                          'settings.privacy.devices'
                        )}`}
                        primaryTypographyProps={{
                          sx: { fontSize: { xs: '0.875rem', md: '1rem' } },
                        }}
                        secondaryTypographyProps={{
                          sx: { fontSize: { xs: '0.75rem', md: '0.875rem' } },
                        }}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.02)'
                          : 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ color: theme.palette.primary.main, mb: 2 }}
                    >
                      Security Summary
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <SecurityOutlined fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="medium">
                          Level: {getSecuritySummary().securityLevel}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <VpnKeyOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Password: {getSecuritySummary().passwordStrength}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <HistoryOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Sessions: {getSecuritySummary().activeSessions} active
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <SecurityOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Features: {getSecuritySummary().enabledFeatures}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Last Audit: {getSecuritySummary().lastAudit}
                        </Typography>
                      </Box>
                    </Box>
                    {getSecurityRecommendations().length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          gutterBottom
                        >
                          Recommendations:
                        </Typography>
                        {getSecurityRecommendations()
                          .slice(0, 2)
                          .map((rec, index) => (
                            <Typography
                              key={index}
                              variant="caption"
                              color="warning.main"
                              sx={{ display: 'block', mb: 0.5 }}
                            >
                              • {rec}
                            </Typography>
                          ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.privacy.accountManagement')}
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}
                  >
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<DownloadOutlined />}
                      fullWidth
                      sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                      onClick={() => setShowDownloadDataDialog(true)}
                    >
                      {t('settings.privacy.downloadMyData')}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteForeverOutlined />}
                      fullWidth
                      sx={{
                        bgcolor: 'error.main',
                        color: 'white',
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        '&:hover': {
                          bgcolor: 'error.dark',
                        },
                      }}
                      onClick={() => setShowDeleteAccountDialog(true)}
                    >
                      {t('settings.privacy.deleteAccount')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>
        </Box>
      </Box>

      {/* Notification Preview Dialog */}
      <Dialog
        open={showNotificationPreview}
        onClose={() => setShowNotificationPreview(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Notification Preview</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: theme.shadows[1],
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              {notificationPreview.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {notificationPreview.message}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {notificationPreview.time}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            This is how your notifications will appear when enabled. You can customize the
            appearance and behavior in the settings above.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotificationPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Model Comparison Dialog */}
      <Dialog
        open={showModelComparison}
        onClose={() => setShowModelComparison(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareArrows />
            AI Model Comparison
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {Object.entries(subscriptionConfig).map(([plan, config]) => (
              <Grid item xs={12} md={6} key={plan}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    border: plan === subscription.plan ? '2px solid' : '1px solid',
                    borderColor: plan === subscription.plan ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    position: 'relative',
                  }}
                >
                  {plan === subscription.plan && (
                    <Chip
                      label="Current Plan"
                      color="primary"
                      size="small"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  )}

                  <Typography variant="h6" gutterBottom>
                    {config.label}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Features:
                    </Typography>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${config.tokenLimit.toLocaleString()} token limit`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={plan === 'free' ? 'Basic AI features' : 'Advanced AI features'}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={plan === 'free' ? 'Standard support' : 'Priority support'}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    </List>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Performance:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan === 'free' && 'Good for basic tasks and learning'}
                      {plan === 'plus' && 'Balanced performance for most use cases'}
                      {plan === 'pro' && 'High performance for complex assignments'}
                      {plan === 'max' && 'Maximum performance for advanced analysis'}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Pricing:
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {plan === 'free' && 'Free'}
                      {plan === 'plus' && '$9.99/month'}
                      {plan === 'pro' && '$19.99/month'}
                      {plan === 'max' && '$39.99/month'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModelComparison(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowModelComparison(false);
              // TODO: Add upgrade functionality
            }}
          >
            Upgrade Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Features Demo Dialog */}
      <Dialog
        open={showAIFeaturesDemo}
        onClose={() => setShowAIFeaturesDemo(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Widgets />
            AI Features Demo
          </Box>
        </DialogTitle>
        <DialogContent>
          <AIFeaturesDemo />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAIFeaturesDemo(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Test Dialog */}
      <Dialog
        open={showNotificationTest}
        onClose={() => setShowNotificationTest(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsActiveOutlined />
            Test Notifications
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Test your notification settings with different types of notifications. This will help
            you verify that your preferences are working correctly.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Test Notification Types
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentOutlined />}
                  onClick={() => {
                    // Simulate assignment notification
                    if (notifications.desktop) {
                      new Notification('New Assignment Available', {
                        body: 'Research Paper assignment has been posted',
                        icon: '/favicon.ico',
                        tag: 'assignment',
                      });
                    }
                    if (notifications.sound) {
                      // Play notification sound
                      const audio = new Audio('/notification-sound.mp3');
                      audio.play().catch(() => {
                        // Fallback: create a simple beep
                        const context = new (window.AudioContext ||
                          (window as any).webkitAudioContext)();
                        const oscillator = context.createOscillator();
                        const gainNode = context.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(context.destination);
                        oscillator.frequency.value = 800;
                        gainNode.gain.value = 0.1;
                        oscillator.start();
                        oscillator.stop(context.currentTime + 0.2);
                      });
                    }
                  }}
                  disabled={!notifications.assignments}
                >
                  Test Assignment Notification
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EventOutlined />}
                  onClick={() => {
                    if (notifications.desktop) {
                      new Notification('Deadline Reminder', {
                        body: 'Research Paper is due in 24 hours',
                        icon: '/favicon.ico',
                        tag: 'deadline',
                      });
                    }
                    if (notifications.sound) {
                      const audio = new Audio('/notification-sound.mp3');
                      audio.play().catch(() => {
                        const context = new (window.AudioContext ||
                          (window as any).webkitAudioContext)();
                        const oscillator = context.createOscillator();
                        const gainNode = context.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(context.destination);
                        oscillator.frequency.value = 600;
                        gainNode.gain.value = 0.1;
                        oscillator.start();
                        oscillator.stop(context.currentTime + 0.3);
                      });
                    }
                  }}
                  disabled={!notifications.deadlines}
                >
                  Test Deadline Notification
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FeedbackOutlined />}
                  onClick={() => {
                    if (notifications.desktop) {
                      new Notification('Feedback Ready', {
                        body: 'Your AI analysis for "Research Paper" is now available',
                        icon: '/favicon.ico',
                        tag: 'feedback',
                      });
                    }
                    if (notifications.sound) {
                      const audio = new Audio('/notification-sound.mp3');
                      audio.play().catch(() => {
                        const context = new (window.AudioContext ||
                          (window as any).webkitAudioContext)();
                        const oscillator = context.createOscillator();
                        const gainNode = context.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(context.destination);
                        oscillator.frequency.value = 1000;
                        gainNode.gain.value = 0.1;
                        oscillator.start();
                        oscillator.stop(context.currentTime + 0.2);
                      });
                    }
                  }}
                  disabled={!notifications.feedback}
                >
                  Test Feedback Notification
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UpdateOutlined />}
                  onClick={() => {
                    if (notifications.desktop) {
                      new Notification('System Update', {
                        body: 'New features are available in AssignmentAI',
                        icon: '/favicon.ico',
                        tag: 'update',
                      });
                    }
                    if (notifications.sound) {
                      const audio = new Audio('/notification-sound.mp3');
                      audio.play().catch(() => {
                        const context = new (window.AudioContext ||
                          (window as any).webkitAudioContext)();
                        const oscillator = context.createOscillator();
                        const gainNode = context.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(context.destination);
                        oscillator.frequency.value = 400;
                        gainNode.gain.value = 0.1;
                        oscillator.start();
                        oscillator.stop(context.currentTime + 0.4);
                      });
                    }
                  }}
                  disabled={!notifications.updates}
                >
                  Test System Update
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Current Settings Status
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailOutlined fontSize="small" />
                    <Typography variant="body2">
                      Email: {notifications.email ? '✓ Enabled' : '✗ Disabled'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DesktopWindowsOutlined fontSize="small" />
                    <Typography variant="body2">
                      Desktop: {notifications.desktop ? '✓ Enabled' : '✗ Disabled'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsOutlined fontSize="small" />
                    <Typography variant="body2">
                      Sound: {notifications.sound ? '✓ Enabled' : '✗ Disabled'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Priority Level: {notificationPreferences.priorityLevel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Work Hours: {getNotificationSummary().workHours}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Quiet Hours: {getNotificationSummary().quietHours}
                  </Typography>
                </Box>
              </Paper>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  <strong>Note:</strong> Desktop notifications require browser permission. If you
                  don't see notifications, check your browser's notification settings.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotificationTest(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              // Request notification permission
              if ('Notification' in window) {
                Notification.requestPermission();
              }
            }}
          >
            Enable Notifications
          </Button>
        </DialogActions>
      </Dialog>

      {/* Security Audit Dialog */}
      <Dialog
        open={showSecurityAudit}
        onClose={() => setShowSecurityAudit(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityOutlined />
            Security Audit Report
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comprehensive security analysis of your account and settings.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Security Score Breakdown
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Base Security</Typography>
                  <Typography variant="body2">20/20</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Password Strength</Typography>
                  <Typography variant="body2">
                    {securitySettings.passwordStrength === 'strong'
                      ? '20/20'
                      : securitySettings.passwordStrength === 'medium'
                      ? '10/20'
                      : '0/20'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Two-Factor Auth</Typography>
                  <Typography variant="body2">
                    {privacySettings.twoFactorAuth ? '25/25' : '0/25'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Biometric Login</Typography>
                  <Typography variant="body2">
                    {privacySettings.biometricLogin ? '15/15' : '0/15'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Auto-Lock</Typography>
                  <Typography variant="body2">
                    {privacySettings.autoLock ? '10/10' : '0/10'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Session Management</Typography>
                  <Typography variant="body2">
                    {securitySettings.activeSessions <= 2 ? '10/10' : '5/10'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <Typography variant="body2">Total Score</Typography>
                  <Typography variant="body2">{calculateSecurityScore()}/100</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Security Recommendations
              </Typography>
              {getSecurityRecommendations().length > 0 ? (
                <List dense>
                  {getSecurityRecommendations().map((recommendation, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Warning fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={recommendation}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="success">
                  <Typography variant="body2">
                    Great job! Your security settings are well configured.
                  </Typography>
                </Alert>
              )}

              <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                Privacy Analysis
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Data Collection</Typography>
                  <Typography
                    variant="body2"
                    color={privacySettings.dataCollection ? 'warning.main' : 'success.main'}
                  >
                    {privacySettings.dataCollection ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Analytics Sharing</Typography>
                  <Typography
                    variant="body2"
                    color={privacySettings.shareAnalytics ? 'warning.main' : 'success.main'}
                  >
                    {privacySettings.shareAnalytics ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Activity Tracking</Typography>
                  <Typography
                    variant="body2"
                    color={privacySettings.allowTracking ? 'warning.main' : 'success.main'}
                  >
                    {privacySettings.allowTracking ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSecurityAudit(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowSecurityAudit(false);
              // TODO: Generate and download security report
            }}
          >
            Download Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={showDeleteAccountDialog}
        onClose={() => setShowDeleteAccountDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteForeverOutlined color="error" />
            Delete Account
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone. All your data will be
              permanently deleted.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Before deleting your account, please consider:
          </Typography>
          <List dense>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Warning fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="All assignments and submissions will be lost"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Warning fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Your account cannot be recovered"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Warning fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Consider downloading your data first"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteAccountDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setShowDeleteAccountDialog(false);
              // TODO: Implement account deletion
            }}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Download Data Dialog */}
      <Dialog
        open={showDownloadDataDialog}
        onClose={() => setShowDownloadDataDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadOutlined />
            Download Your Data
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose what data you'd like to download from your account.
          </Typography>

          <FormGroup>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Assignments and Submissions"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="User Preferences and Settings"
            />
            <FormControlLabel control={<Switch defaultChecked />} label="Activity History" />
            <FormControlLabel control={<Switch />} label="Analytics Data (if enabled)" />
          </FormGroup>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              Data will be exported in JSON format and may take a few minutes to prepare.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDownloadDataDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowDownloadDataDialog(false);
              // TODO: Implement data export
            }}
          >
            Download Data
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        .MuiSlider-thumb {
          transition: transform 0.2s;
        }
        .MuiSlider-thumb:hover {
          transform: scale(1.2);
        }
        .MuiSwitch-switchBase.Mui-checked {
          transform: translateX(20px);
          transition: transform 0.3s;
        }
        .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track {
          background: linear-gradient(
            45deg,
            ${theme.palette.primary.main},
            ${theme.palette.primary.light}
          ) !important;
          opacity: 1;
        }
        .MuiSlider-track {
          transition: all 0.3s ease;
        }
        .MuiSlider-rail {
          transition: all 0.3s ease;
        }
        .MuiSlider-valueLabel {
          transition: all 0.3s ease;
        }
        .MuiSlider-mark {
          transition: all 0.3s ease;
        }
        .MuiSlider-markLabel {
          transition: all 0.3s ease;
        }
        
        /* Compact mode styles */
        .compact-mode .MuiPaper-root {
          padding: 16px !important;
          margin-bottom: 16px !important;
        }
        .compact-mode .MuiTypography-h5 {
          font-size: 1.1rem !important;
        }
        .compact-mode .MuiFormControlLabel-root {
          margin-bottom: 8px !important;
        }
        
        /* Animation disable styles */
        [style*="--disable-animations: none"] * {
          transition: none !important;
          animation: none !important;
        }
        
        /* Font size styles */
        :root {
          font-size: var(--app-font-size, 14px);
        }
        body {
          font-size: var(--app-font-size, 14px);
        }
        
        /* Local dark mode styles */
        .dark-mode-local {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }
        .dark-mode-local .MuiPaper-root {
          background-color: #2d2d2d !important;
          color: #ffffff !important;
        }
        
        /* Language-specific styles */
        .language-es {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .language-es .MuiTypography-root {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .language-fr {
          font-family: 'Arial', sans-serif;
        }
        .language-fr .MuiTypography-root {
          font-family: 'Arial', sans-serif;
        }
        
        .language-de {
          font-family: 'Verdana', Geneva, sans-serif;
        }
        .language-de .MuiTypography-root {
          font-family: 'Verdana', Geneva, sans-serif;
        }
        
        .language-it {
          font-family: 'Georgia', serif;
        }
        .language-it .MuiTypography-root {
          font-family: 'Georgia', serif;
        }
        
        .language-pt {
          font-family: 'Times New Roman', serif;
        }
        .language-pt .MuiTypography-root {
          font-family: 'Times New Roman', serif;
        }
        
        .language-ru {
          font-family: 'Arial', sans-serif;
        }
        .language-ru .MuiTypography-root {
          font-family: 'Arial', sans-serif;
        }
        
        .language-zh {
          font-family: 'Microsoft YaHei', 'SimSun', sans-serif;
        }
        .language-zh .MuiTypography-root {
          font-family: 'Microsoft YaHei', 'SimSun', sans-serif;
        }
        
        .language-ja {
          font-family: 'MS Gothic', 'Yu Gothic', sans-serif;
        }
        .language-ja .MuiTypography-root {
          font-family: 'MS Gothic', 'Yu Gothic', sans-serif;
        }
        
        .language-ko {
          font-family: 'Malgun Gothic', 'Dotum', sans-serif;
        }
        .language-ko .MuiTypography-root {
          font-family: 'Malgun Gothic', 'Dotum', sans-serif;
        }
      `}</style>
    </Box>
  );
};

export default Settings;
