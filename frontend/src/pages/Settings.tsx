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
  VolumeUp,
  VolumeUpOutlined,
  VpnKeyOutlined,
  Warning,
  Widgets,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
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
import { useAspectRatio } from '../hooks/useAspectRatio';
import { useTranslation } from '../hooks/useTranslation';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

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

  // General Settings
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [fontSize, setFontSize] = useState(14);
  const [animations, setAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [volume, setVolume] = useState(70);
  const [quietHoursStart, setQuietHoursStart] = useState(22);
  const [quietHoursEnd, setQuietHoursEnd] = useState(7);

  // Language & Region Settings
  const [timeZone, setTimeZone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [showOriginalText, setShowOriginalText] = useState(true);
  const [useMetricSystem, setUseMetricSystem] = useState(false);
  const [use24HourFormat, setUse24HourFormat] = useState(false);

  // Sound & Feedback Settings
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [notificationSounds, setNotificationSounds] = useState(true);
  const [typingSounds, setTypingSounds] = useState(false);
  const [completionSounds, setCompletionSounds] = useState(true);

  // AI Settings
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [temperature, setTemperature] = useState('0.7');
  const [contextLength, setContextLength] = useState(10);
  const [autoComplete, setAutoComplete] = useState(true);
  const [codeSnippets, setCodeSnippets] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(true);

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
    model: 'gpt-4o-mini',
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
      // Prepare settings data for backend
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
          auto_translate: autoTranslate,
          show_original_text: showOriginalText,
          use_metric_system: useMetricSystem,
          use_24_hour_format: use24HourFormat,
        },
        sound: {
          sound_effects: soundEffects,
          haptic_feedback: hapticFeedback,
          volume: volume,
          notification_sounds: notificationSounds,
          typing_sounds: typingSounds,
          completion_sounds: completionSounds,
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd,
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
        },
      };

      // TODO: Replace with actual API call when backend is ready
      console.log('Saving settings:', settingsData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      console.log('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      // TODO: Show error message to user
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
    localStorage.setItem('dateFormat', dateFormat);
    console.log('Date format changed to:', dateFormat);
  }, [dateFormat]);

  // Apply 24-hour format setting
  useEffect(() => {
    // Store 24-hour format preference in localStorage for future use
    localStorage.setItem('use24HourFormat', use24HourFormat.toString());
    console.log('24-hour format:', use24HourFormat);
  }, [use24HourFormat]);

  // Apply metric system setting
  useEffect(() => {
    // Store metric system preference in localStorage for future use
    localStorage.setItem('useMetricSystem', useMetricSystem.toString());
    console.log('Metric system:', useMetricSystem);
  }, [useMetricSystem]);

  // Apply sound effects setting
  useEffect(() => {
    // Store sound effects preference in localStorage for future use
    localStorage.setItem('soundEffects', soundEffects.toString());
    console.log('Sound effects:', soundEffects);
  }, [soundEffects]);

  // Apply haptic feedback setting
  useEffect(() => {
    // Store haptic feedback preference in localStorage for future use
    localStorage.setItem('hapticFeedback', hapticFeedback.toString());
    console.log('Haptic feedback:', hapticFeedback);
  }, [hapticFeedback]);

  // Apply volume setting
  useEffect(() => {
    // Store volume preference in localStorage for future use
    localStorage.setItem('volume', volume.toString());
    console.log('Volume:', volume);
  }, [volume]);

  // Apply notification sounds setting
  useEffect(() => {
    // Store notification sounds preference in localStorage for future use
    localStorage.setItem('notificationSounds', notificationSounds.toString());
    console.log('Notification sounds:', notificationSounds);
  }, [notificationSounds]);

  // Apply typing sounds setting
  useEffect(() => {
    // Store typing sounds preference in localStorage for future use
    localStorage.setItem('typingSounds', typingSounds.toString());
    console.log('Typing sounds:', typingSounds);
  }, [typingSounds]);

  // Apply completion sounds setting
  useEffect(() => {
    // Store completion sounds preference in localStorage for future use
    localStorage.setItem('completionSounds', completionSounds.toString());
    console.log('Completion sounds:', completionSounds);
  }, [completionSounds]);

  // Apply quiet hours settings
  useEffect(() => {
    // Store quiet hours preferences in localStorage for future use
    localStorage.setItem('quietHoursStart', quietHoursStart.toString());
    localStorage.setItem('quietHoursEnd', quietHoursEnd.toString());
    console.log('Quiet hours:', quietHoursStart, 'to', quietHoursEnd);
  }, [quietHoursStart, quietHoursEnd]);

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const loadSavedSettings = () => {
      // Load language settings
      const savedLanguage = localStorage.getItem('userTimezone');
      if (savedLanguage) setTimeZone(savedLanguage);

      const savedDateFormat = localStorage.getItem('dateFormat');
      if (savedDateFormat) setDateFormat(savedDateFormat);

      const saved24Hour = localStorage.getItem('use24HourFormat');
      if (saved24Hour) setUse24HourFormat(saved24Hour === 'true');

      const savedMetric = localStorage.getItem('useMetricSystem');
      if (savedMetric) setUseMetricSystem(savedMetric === 'true');

      // Load sound settings
      const savedSoundEffects = localStorage.getItem('soundEffects');
      if (savedSoundEffects) setSoundEffects(savedSoundEffects === 'true');

      const savedHaptic = localStorage.getItem('hapticFeedback');
      if (savedHaptic) setHapticFeedback(savedHaptic === 'true');

      const savedVolume = localStorage.getItem('volume');
      if (savedVolume) setVolume(parseInt(savedVolume));

      const savedNotificationSounds = localStorage.getItem('notificationSounds');
      if (savedNotificationSounds) setNotificationSounds(savedNotificationSounds === 'true');

      const savedTypingSounds = localStorage.getItem('typingSounds');
      if (savedTypingSounds) setTypingSounds(savedTypingSounds === 'true');

      const savedCompletionSounds = localStorage.getItem('completionSounds');
      if (savedCompletionSounds) setCompletionSounds(savedCompletionSounds === 'true');

      const savedQuietStart = localStorage.getItem('quietHoursStart');
      if (savedQuietStart) setQuietHoursStart(parseInt(savedQuietStart));

      const savedQuietEnd = localStorage.getItem('quietHoursEnd');
      if (savedQuietEnd) setQuietHoursEnd(parseInt(savedQuietEnd));
    };

    loadSavedSettings();
  }, []);

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
          {t('settings.saveChanges')}
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

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>{t('settings.language.timeZone')}</InputLabel>
                    <Select
                      value={timeZone}
                      label={t('settings.language.timeZone')}
                      onChange={e => setTimeZone(e.target.value)}
                    >
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="EST">Eastern Time (EST)</MenuItem>
                      <MenuItem value="CST">Central Time (CST)</MenuItem>
                      <MenuItem value="PST">Pacific Time (PST)</MenuItem>
                      <MenuItem value="GMT">Greenwich Mean Time (GMT)</MenuItem>
                      <MenuItem value="CET">Central European Time (CET)</MenuItem>
                      <MenuItem value="IST">Indian Standard Time (IST)</MenuItem>
                      <MenuItem value="JST">Japan Standard Time (JST)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>{t('settings.language.dateFormat')}</InputLabel>
                    <Select
                      value={dateFormat}
                      label={t('settings.language.dateFormat')}
                      onChange={e => setDateFormat(e.target.value)}
                    >
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                      <MenuItem value="DD.MM.YYYY">DD.MM.YYYY</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.language.translationPreferences')}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoTranslate}
                          onChange={e => setAutoTranslate(e.target.checked)}
                        />
                      }
                      label={t('settings.language.autoTranslateContent')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showOriginalText}
                          onChange={e => setShowOriginalText(e.target.checked)}
                        />
                      }
                      label={t('settings.language.showOriginalText')}
                    />
                  </FormGroup>

                  <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                    {t('settings.language.regionalSettings')}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useMetricSystem}
                          onChange={e => setUseMetricSystem(e.target.checked)}
                        />
                      }
                      label={t('settings.language.useMetricSystem')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={use24HourFormat}
                          onChange={e => setUse24HourFormat(e.target.checked)}
                        />
                      }
                      label={t('settings.language.use24HourFormat')}
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title={t('settings.sound.title')}
              icon={<VolumeUp sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.sound.soundSettings')}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={soundEffects}
                          onChange={e => setSoundEffects(e.target.checked)}
                        />
                      }
                      label={t('settings.sound.soundEffects')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={hapticFeedback}
                          onChange={e => setHapticFeedback(e.target.checked)}
                        />
                      }
                      label={t('settings.sound.hapticFeedback')}
                    />
                  </FormGroup>

                  <Typography gutterBottom sx={{ mt: 3 }}>
                    {t('settings.sound.volume')}
                  </Typography>
                  <Slider
                    value={volume}
                    onChange={(_e, value) => setVolume(value as number)}
                    disabled={!soundEffects}
                    valueLabelDisplay="auto"
                    step={5}
                    marks={[
                      { value: 0, label: 'Mute' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' },
                    ]}
                    disableSwap
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('settings.sound.notificationSounds')}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSounds}
                          onChange={e => setNotificationSounds(e.target.checked)}
                        />
                      }
                      label={t('settings.sound.enableNotificationSounds')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={typingSounds}
                          onChange={e => setTypingSounds(e.target.checked)}
                        />
                      }
                      label={t('settings.sound.typingSounds')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={completionSounds}
                          onChange={e => setCompletionSounds(e.target.checked)}
                        />
                      }
                      label={t('settings.sound.taskCompletionSounds')}
                    />
                  </FormGroup>

                  <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                    {t('settings.sound.quietHours')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>{t('settings.sound.startTime')}</InputLabel>
                        <Select
                          value={quietHoursStart}
                          label={t('settings.sound.startTime')}
                          onChange={e => setQuietHoursStart(Number(e.target.value))}
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
                          value={quietHoursEnd}
                          label={t('settings.sound.endTime')}
                          onChange={e => setQuietHoursEnd(Number(e.target.value))}
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
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>

          <TabPanel value={tabValue} index={1} breakpoint={breakpoint}>
            <SettingsSection
              title={t('settings.ai.modelConfiguration')}
              icon={<Psychology sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('settings.ai.aiModel')}</InputLabel>
                    <Select
                      value={subscription.model}
                      label={t('settings.ai.aiModel')}
                      onChange={e => {
                        // Only allow changing to models within the current plan
                        const newModel = e.target.value;
                        const currentPlanConfig = subscriptionConfig[subscription.plan];
                        if (newModel === currentPlanConfig.model) {
                          setSubscription({
                            ...subscription,
                            model: newModel,
                          });
                        }
                      }}
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
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CompareArrows />}
                      onClick={() => {
                        // This button is no longer used, but keeping it for now
                      }}
                      size="small"
                    >
                      Compare Models
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
                    Maximum token limit is determined by your subscription plan
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
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title={t('settings.ai.aiFeatures')}
              icon={<Widgets sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoComplete}
                          onChange={e => setAutoComplete(e.target.checked)}
                        />
                      }
                      label={t('settings.ai.aiAutoComplete')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={codeSnippets}
                          onChange={e => setCodeSnippets(e.target.checked)}
                        />
                      }
                      label={t('settings.ai.codeSnippetsGeneration')}
                    />
                  </FormGroup>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={aiSuggestions}
                          onChange={e => setAiSuggestions(e.target.checked)}
                        />
                      }
                      label={t('settings.ai.aiSuggestions')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={realTimeAnalysis}
                          onChange={e => setRealTimeAnalysis(e.target.checked)}
                        />
                      }
                      label={t('settings.ai.realTimeAnalysis')}
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>

          <TabPanel value={tabValue} index={2} breakpoint={breakpoint}>
            <SettingsSection
              title={t('settings.notifications.notificationPreferences')}
              icon={<NotificationsOutlined sx={{ color: theme.palette.primary.main }} />}
            >
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
                          <VolumeUpOutlined fontSize="small" />
                          <Typography>{t('settings.notifications.soundNotifications')}</Typography>
                        </Box>
                      }
                    />
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
                  </FormGroup>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

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
                </Grid>

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

                  <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
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
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12}>
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

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<NotificationsActiveOutlined />}
                      onClick={() => setShowNotificationPreview(true)}
                    >
                      {t('settings.notifications.previewNotifications')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>

          <TabPanel value={tabValue} index={3} breakpoint={breakpoint}>
            <SettingsSection
              title={t('settings.privacy.securityScore')}
              icon={<SecurityOutlined sx={{ color: theme.palette.primary.main }} />}
            >
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
                        securitySettings.securityScore >= 80
                          ? 'success.main'
                          : securitySettings.securityScore >= 50
                          ? 'warning.main'
                          : 'error.main',
                    }}
                  >
                    {securitySettings.securityScore}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={securitySettings.securityScore}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor:
                        securitySettings.securityScore >= 80
                          ? 'success.main'
                          : securitySettings.securityScore >= 50
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
                    {t('settings.privacy.accountManagement')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<DownloadOutlined />}
                      fullWidth
                      sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
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
                    >
                      {t('settings.privacy.deleteAccount')}
                    </Button>
                  </Box>
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
