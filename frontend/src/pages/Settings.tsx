import {
  AllInclusive,
  AnalyticsOutlined,
  AutoAwesomeOutlined,
  BarChartOutlined,
  Brush,
  CheckCircle,
  CheckCircleOutlined,
  CompareArrows,
  CurrencyBitcoin as CurrencyBitcoinIcon,
  DataUsageOutlined,
  DeleteForeverOutlined,
  DesignServicesOutlined,
  DownloadOutlined,
  Error,
  EventOutlined,
  FingerprintOutlined,
  FormatQuoteOutlined,
  GppGoodOutlined,
  HistoryOutlined,
  Info,
  Language,
  LibraryBooksOutlined,
  LockOutlined,
  PaletteOutlined,
  PrivacyTipOutlined,
  PsychologyOutlined,
  RocketLaunchOutlined,
  Save,
  SchoolOutlined,
  ScienceOutlined,
  Search,
  SecurityOutlined,
  SecurityUpdateOutlined,
  ShieldOutlined,
  SmartToyOutlined,
  Spellcheck,
  TextSnippetOutlined,
  Tune,
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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountInformationDialog from '../components/account/AccountInformationDialog';
import ChangePasswordDialog from '../components/account/ChangePasswordDialog';
import DeleteAccountDialog from '../components/account/DeleteAccountDialog';
import DownloadDataDialog from '../components/account/DownloadDataDialog';
import AIFeaturesDemo from '../components/ai/AIFeaturesDemo';
import DateFormatSelector from '../components/common/DateFormatSelector';
import AutoLockWarningDialog from '../components/security/AutoLockWarningDialog';
import { useFontSize } from '../contexts/FontSizeContext';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { preferences, users } from '../services/api';
import securityService from '../services/SecurityService';
import UserService from '../services/userService';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';
import { useTheme as useAppTheme } from '../theme/ThemeProvider';
import { DateFormat, getDefaultDateFormat } from '../utils/dateFormat';

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
  const navigate = useNavigate();
  const location = useLocation();
  const hasUnsavedChanges = useRef(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Store initial values for comparison
  const [initialValues, setInitialValues] = useState<any>(null);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  const [tabValue, setTabValue] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [dateFormatError, setDateFormatError] = useState<string | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);

  // General Settings
  const { mode: appTheme, toggleTheme, darkThemeColor, setDarkThemeColor } = useAppTheme();
  const darkMode = appTheme === 'dark';
  const [language, setLanguage] = useState('en');
  const { fontSize } = useFontSize();
  const [animations, setAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  // Language & Date Settings
  const [dateFormat, setDateFormat] = useState<DateFormat>(() => {
    // Get browser locale and set default date format
    const browserLocale = navigator.language || 'en-US';
    return getDefaultDateFormat(browserLocale);
  });
  const [timezone, setTimezone] = useState<string>(() => {
    // Get browser timezone or default to UTC
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });

  // AI Settings
  const [tokenContextLimit, setTokenContextLimit] = useState<number>(1000);
  const [temperature, setTemperature] = useState('0.5');
  const [contextLength, setContextLength] = useState(10);
  const [autoComplete, setAutoComplete] = useState(true);
  const [codeSnippets, setCodeSnippets] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(true);

  // AI Settings Validation & Feedback
  const [aiSettingsError, setAiSettingsError] = useState<string | null>(null);
  const [showModelComparison, setShowModelComparison] = useState(false);
  const [selectedModelPlan, setSelectedModelPlan] = useState<SubscriptionPlan | null>(null);
  const [isValidatingSettings, setIsValidatingSettings] = useState(false);
  const [showAIFeaturesDemo, setShowAIFeaturesDemo] = useState(false);

  // User Data for Account Information
  const [userData, setUserData] = useState<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
  } | null>(null);
  const [userProfile, setUserProfile] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
  } | null>(null);
  const [dashboardStats, setDashboardStats] = useState<{
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    totalFiles: number;
    storageUsed: number;
    storageLimit: number;
    monthlyUsage: number;
    monthlyLimit: number;
  } | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [userDataError, setUserDataError] = useState<string | null>(null);

  // Privacy & Security Settings Validation & Feedback
  const [privacySettingsError, setPrivacySettingsError] = useState<string | null>(null);
  const [showSecurityAudit, setShowSecurityAudit] = useState(false);
  const [isRecordingAudit, setIsRecordingAudit] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showDownloadDataDialog, setShowDownloadDataDialog] = useState(false);

  const [isExportingData, setIsExportingData] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showAccountInfoDialog, setShowAccountInfoDialog] = useState(false);
  const [showAIFeaturesTestDialog, setShowAIFeaturesTestDialog] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Privacy & Security
  const [privacySettings, setPrivacySettings] = useState({
    twoFactorAuth: false,
    biometricLogin: false,
    dataCollection: true,
    shareAnalytics: true,
    showOnlineStatus: true,
    allowTracking: false,
    autoLock: true,
    lockTimeout: 60, // 1 hour
    passwordExpiry: 90, // days
    sessionTimeout: 30, // minutes
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordStrength: 'strong',
    lastPasswordChange: null as string | null,
    lastSecurityAudit: null as string | null,
    securityScore: 0, // Start at 0, will be updated from backend
  });

  // Subscription Settings
  const [subscription, setSubscription] = useState({
    plan: 'free' as SubscriptionPlan,
    model: 'gpt-4.1-nano', // Will be updated based on actual plan
    tokenLimit: 100000, // Will be updated based on actual plan
  });

  // Simple date formatting function based on user preference
  const formatDateWithPreference = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');

    switch (dateFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD.MM.YYYY':
        return `${day}.${month}.${year}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  // Calculate days since account creation
  const calculateDaysSinceCreation = (createdAt: string) => {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Map subscription plans to their respective models and token limits
  const subscriptionConfig: Record<SubscriptionPlan, SubscriptionConfig> = {
    free: {
      model: 'gpt-5-nano',
      tokenLimit: 100000,
      label: 'GPT-5 Nano',
    },
    plus: {
      model: 'gpt-4.1-mini',
      tokenLimit: 250000,
      label: 'GPT-4.1 Mini',
    },
    pro: {
      model: 'gpt-4-turbo',
      tokenLimit: 500000,
      label: 'GPT-4 Turbo',
    },
    max: {
      model: 'gpt-5',
      tokenLimit: 1000000,
      label: 'GPT-5',
    },
  };

  // AI Settings Validation Functions
  const validateAISettings = () => {
    const errors: string[] = [];

    if (tokenContextLimit < 1000 || tokenContextLimit > subscription.tokenLimit) {
      errors.push(
        `Token context limit must be between 1,000 and ${subscription.tokenLimit.toLocaleString()}`
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
      setSubscription(prev => ({
        ...prev,
        model: newModel,
      }));
      setAiSettingsError(null);
    } else {
      // Different plan - show upgrade prompt
      setAiSettingsError(
        `This model requires a ${targetPlan} subscription. Please upgrade to use ${subscriptionConfig[targetPlan].label}.`
      );
    }
  };

  const resetAISettingsToDefaults = () => {
    // Set token context limit to 25% of the current plan's limit, but at least 1000
    const defaultTokenLimit = Math.max(1000, Math.floor(subscription.tokenLimit * 0.25));
    setTokenContextLimit(defaultTokenLimit);
    setTemperature('0.5');
    setContextLength(10);
    setAutoComplete(true);
    setCodeSnippets(true);
    setAiSuggestions(true);
    setRealTimeAnalysis(true);
    setAiSettingsError(null);
  };

  // Privacy & Security Settings Validation Functions
  const validatePrivacySettings = () => {
    const errors: string[] = [];

    // Check for security conflicts
    if (privacySettings.autoLock && privacySettings.lockTimeout < 0.167) {
      errors.push('Auto-lock timeout must be at least 10 seconds');
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
      lockTimeout: 60, // 1 hour
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

  // Get current password strength (either from form or stored settings)
  const getCurrentPasswordStrength = () => {
    // Use the stored strength from settings
    return securitySettings.passwordStrength;
  };

  const calculateSecurityScore = () => {
    let score = 0;

    // Base score
    score += 20;

    // Password strength
    const currentPasswordStrength = getCurrentPasswordStrength();
    if (currentPasswordStrength === 'strong') score += 20;
    else if (currentPasswordStrength === 'medium') score += 10;

    // Two-factor authentication
    if (privacySettings.twoFactorAuth) score += 25;

    // Biometric login
    if (privacySettings.biometricLogin) score += 15;

    // Auto-lock
    if (privacySettings.autoLock) score += 10;

    return Math.min(100, score);
  };

  const getSecuritySummary = () => {
    const enabledFeatures = [];
    if (privacySettings.twoFactorAuth) enabledFeatures.push('2FA');
    if (privacySettings.biometricLogin) enabledFeatures.push('Biometric');
    if (privacySettings.autoLock) enabledFeatures.push('Auto-lock');
    if (privacySettings.dataCollection) enabledFeatures.push('Data Collection');
    if (privacySettings.shareAnalytics) enabledFeatures.push('Analytics');

    // Calculate security level based on frontend calculated score
    const calculatedScore = calculateSecurityScore();
    let securityLevel = 'Low';
    if (calculatedScore >= 80) securityLevel = 'High';
    else if (calculatedScore >= 50) securityLevel = 'Medium';

    return {
      enabledFeatures: enabledFeatures.join(', ') || 'None',
      securityLevel,
      passwordStrength: securitySettings.passwordStrength,
      lastAudit: securitySettings.lastSecurityAudit,
    };
  };

  // Memoized security summary to avoid recalculation
  const securitySummary = React.useMemo(() => {
    const summary = getSecuritySummary();
    return summary;
  }, [
    privacySettings.twoFactorAuth,
    privacySettings.biometricLogin,
    privacySettings.autoLock,
    privacySettings.dataCollection,
    privacySettings.shareAnalytics,
    securitySettings.securityScore,
    securitySettings.passwordStrength,
    securitySettings.lastSecurityAudit,
  ]);

  const getSecurityRecommendations = () => {
    const recommendations = [];

    if (!privacySettings.twoFactorAuth) {
      recommendations.push({
        text: 'Enable two-factor authentication for enhanced security',
        priority: 'high',
        color: 'error.main',
      });
    }

    if (getCurrentPasswordStrength() === 'weak') {
      recommendations.push({
        text: 'Strengthen your password with symbols and numbers',
        priority: 'high',
        color: 'error.main',
      });
    }

    if (!privacySettings.autoLock) {
      recommendations.push({
        text: 'Enable auto-lock to protect your account when inactive',
        priority: 'medium',
        color: 'warning.main',
      });
    }

    if (!privacySettings.biometricLogin) {
      recommendations.push({
        text: 'Enable biometric login for enhanced security and convenience',
        priority: 'medium',
        color: 'warning.main',
      });
    }

    if (privacySettings.allowTracking) {
      recommendations.push({
        text: 'Consider disabling activity tracking for enhanced privacy',
        priority: 'low',
        color: 'info.main',
      });
    }

    return recommendations;
  };

  // Model comparison data

  // Security checklist data with priority ordering
  const securityChecklistData = [
    {
      id: '2fa',
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      status: privacySettings.twoFactorAuth ? 'success' : 'error',
      action: privacySettings.twoFactorAuth ? '2FA Enabled' : 'Enable 2FA',
      icon: <ShieldOutlined />,
      priority: 1, // Highest priority
    },
    {
      id: 'password',
      title: 'Strong Password',
      description:
        'Use a password with at least 8 characters, uppercase, lowercase, number, and special character',
      status:
        getCurrentPasswordStrength() === 'strong'
          ? 'success'
          : getCurrentPasswordStrength() === 'medium'
          ? 'warning'
          : 'error',
      action: getCurrentPasswordStrength() === 'strong' ? 'Password Strong' : 'Change Password',
      icon: <VpnKeyOutlined />,
      priority: 2, // High priority
    },
    {
      id: 'biometric',
      title: 'Biometric Login',
      description: 'Use fingerprint or face recognition for quick and secure login',
      status: privacySettings.biometricLogin ? 'success' : 'warning',
      action: privacySettings.biometricLogin ? 'Biometric Enabled' : 'Enable Biometric',
      icon: <FingerprintOutlined />,
      priority: 3, // Medium priority
    },
    {
      id: 'autolock',
      title: 'Auto-Lock Account',
      description: 'Automatically lock your account after inactivity for enhanced security',
      status: privacySettings.autoLock ? 'success' : 'warning',
      action: privacySettings.autoLock ? 'Auto-Lock Enabled' : 'Enable Auto-Lock',
      icon: <LockOutlined />,
      priority: 4, // Medium priority
    },
    {
      id: 'updates',
      title: 'Security Updates',
      description: 'Keep your security settings up to date',
      status: 'success',
      action: 'Check Updates',
      icon: <SecurityUpdateOutlined />,
      priority: 5, // Lower priority
    },
  ];

  // Sort security checklist: enabled items (success) go to bottom, then by priority
  const securityChecklist = securityChecklistData.sort((a, b) => {
    // First, sort by status: error/warning items first, then success items
    const getStatusOrder = (status: string): number => {
      switch (status) {
        case 'error':
          return 0;
        case 'warning':
          return 1;
        case 'success':
          return 2;
        default:
          return 3;
      }
    };

    const statusDiff = getStatusOrder(a.status) - getStatusOrder(b.status);

    if (statusDiff !== 0) {
      return statusDiff;
    }

    // If same status, sort by priority (lower number = higher priority)
    return a.priority - b.priority;
  });

  // Calculate security score

  // Filter settings based on search query

  // Function to check if there are unsaved changes
  const checkForUnsavedChanges = useCallback(() => {
    if (!initialValues || !isSettingsLoaded) return false;

    const currentValues = {
      darkMode,
      language,
      fontSize,
      animations,
      compactMode,
      dateFormat,
      tokenContextLimit,
      temperature,
      contextLength,
      autoComplete,
      codeSnippets,
      aiSuggestions,
      realTimeAnalysis,

      privacySettings,
      subscription,
    };

    return JSON.stringify(currentValues) !== JSON.stringify(initialValues);
  }, [
    initialValues,
    isSettingsLoaded,
    darkMode,
    language,
    fontSize,
    animations,
    compactMode,
    dateFormat,
    tokenContextLimit,
    temperature,
    contextLength,
    autoComplete,
    codeSnippets,
    aiSuggestions,
    realTimeAnalysis,
    privacySettings,
    subscription,
  ]);

  // Function to confirm navigation without saving
  const confirmNavigationWithoutSaving = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [navigate, pendingNavigation]);

  // Function to cancel navigation
  const cancelNavigation = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    setPendingNavigation(null);
  }, []);

  // Function to save and navigate
  const saveAndNavigate = useCallback(async () => {
    try {
      await handleSave();
      setShowUnsavedChangesDialog(false);
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
    } catch (error) {
      console.error('Failed to save settings before navigation:', error);
    }
  }, [pendingNavigation, navigate]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = async () => {
    console.log('Save button clicked - starting save process');
    // Set loading state immediately
    setIsValidatingSettings(true);

    try {
      // Clear any previous errors
      setAiSettingsError(null);
      setPrivacySettingsError(null);

      // Validate AI settings before saving
      const aiErrors = validateAISettings();
      console.log('AI validation errors:', aiErrors);
      if (aiErrors.length > 0) {
        setAiSettingsError(aiErrors.join(', '));
        setIsValidatingSettings(false);
        console.log('AI validation failed, stopping save');
        return;
      }

      // Validate privacy settings before saving
      const privacyErrors = validatePrivacySettings();
      console.log('Privacy validation errors:', privacyErrors);
      if (privacyErrors.length > 0) {
        setPrivacySettingsError(privacyErrors.join(', '));
        setIsValidatingSettings(false);
        console.log('Privacy validation failed, stopping save');
        return;
      }

      console.log('All validations passed, proceeding with save');

      // Try to save to backend first, but don't fail if backend is not available
      let backendSaveSuccessful = false;
      try {
        await savePreferencesToBackend();
        backendSaveSuccessful = true;
        console.log('Backend save successful');
      } catch (error) {
        console.warn('Backend save failed, falling back to localStorage:', error);
        // Continue with localStorage save even if backend fails
      }

      // Save to localStorage as fallback (or primary if backend failed)
      const settingsData = {
        appearance: {
          dark_mode: darkMode,
          font_size: fontSize,
          animations: animations,
          compact_mode: compactMode,
        },
        language: {
          language: language,
          date_format: dateFormat,
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
          max_tokens: tokenContextLimit,
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

      console.log('Saving settings to localStorage:', settingsData);

      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settingsData));

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      console.log(
        `Settings saved successfully! ${
          backendSaveSuccessful ? '(Backend + localStorage)' : '(localStorage only)'
        }`
      );

      // Update initial values after successful save
      const newInitialValues = {
        darkMode,
        language,
        fontSize,
        animations,
        compactMode,
        dateFormat,
        tokenContextLimit,
        temperature,
        contextLength,
        autoComplete,
        codeSnippets,
        aiSuggestions,
        realTimeAnalysis,
        privacySettings,
        subscription,
      };
      setInitialValues(newInitialValues);
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error('Failed to save settings:', error);
      setAiSettingsError('Failed to save AI settings. Please try again.');
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
            ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.paper} 100%)`
            : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.9) 100%)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
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
            background: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? '#d32f2f' : 'rgba(0,0,0,0.06)',
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle1">{title}</Typography>
      </Stack>
      {children}
    </Paper>
  );

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

  // Dark mode is now handled by Material-UI theme system

  // Ensure subscription state is always consistent with plan
  useEffect(() => {
    console.log('Subscription useEffect triggered. Current subscription:', subscription);
    if (subscription.plan && subscriptionConfig[subscription.plan]) {
      const planConfig = subscriptionConfig[subscription.plan];
      console.log('Plan config for', subscription.plan, ':', planConfig);
      if (
        subscription.model !== planConfig.model ||
        subscription.tokenLimit !== planConfig.tokenLimit
      ) {
        console.log('Updating subscription to match plan config');
        setSubscription(prev => ({
          ...prev,
          model: planConfig.model,
          tokenLimit: planConfig.tokenLimit,
        }));
      }
    }
  }, [subscription.plan]);

  // Ensure token context limit is within plan limits when subscription changes
  useEffect(() => {
    if (subscription.tokenLimit && tokenContextLimit > subscription.tokenLimit) {
      console.log('Adjusting token context limit to match plan limit:', subscription.tokenLimit);
      setTokenContextLimit(subscription.tokenLimit);
    }
  }, [subscription.tokenLimit, tokenContextLimit]);

  // Security Score Progress Bar Animation (same as EditProfileDialog)
  const getProgressBarColor = (percentage: number) => {
    if (percentage < 25) return theme.palette.error.main; // Red for low range
    if (percentage < 50) return theme.palette.warning.main; // Orange for low-mid range
    if (percentage < 75) return theme.palette.warning.main; // Orange for mid range
    return theme.palette.success.main; // Green for high range
  };

  const progressBarColor = getProgressBarColor(calculateSecurityScore());

  // Animated percentage for smooth counting - start with calculated score, then update with backend data
  const [animatedSecurityScore, setAnimatedSecurityScore] = useState(() => {
    // Start with calculated score based on current settings
    const initialScore = calculateSecurityScore();
    return initialScore;
  });

  // Animate security score progress bar
  useEffect(() => {
    // Always use calculated score for now since backend doesn't have all privacy settings
    // TODO: Update backend to include autoLock, biometricLogin, etc.
    const targetScore = calculateSecurityScore();
    const currentScore = animatedSecurityScore;

    if (Math.abs(targetScore - currentScore) < 1) {
      setAnimatedSecurityScore(targetScore);
      return;
    }

    const steps = 20;
    const stepDuration = 1; // 1ms per step = 20ms total animation
    const increment = (targetScore - currentScore) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setAnimatedSecurityScore(prev => {
        const newValue = prev + increment;
        if (currentStep >= steps || Math.abs(newValue - targetScore) < 1) {
          return targetScore; // Ensure we end at exact target
        }
        return newValue;
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [
    privacySettings.twoFactorAuth,
    privacySettings.biometricLogin,
    privacySettings.autoLock,
    securitySettings.passwordStrength,
  ]); // Watch for changes in relevant settings

  // Debug subscription state changes
  useEffect(() => {
    console.log('Subscription state changed:', subscription);
  }, [subscription]);

  // Auto-lock functionality
  const [showAutoLockWarning, setShowAutoLockWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(10); // 10 seconds for testing

  const autoLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());

  // Isolated countdown component that doesn't affect parent re-renders
  const AutoLockCountdown = React.memo(({ lockTimeout, lastActivityRef, onTimeout }: any) => {
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
      if (lockTimeout) {
        const interval = setInterval(() => {
          const timeSinceLastActivity = (Date.now() - lastActivityRef.current) / 1000;
          const timeoutSeconds = lockTimeout * 60;
          const remaining = Math.max(0, timeoutSeconds - timeSinceLastActivity);
          const roundedRemaining = Math.round(remaining);
          setCountdown(roundedRemaining); // Round to nearest whole second

          console.log('Countdown:', roundedRemaining, 'seconds remaining');

          // Trigger warning popup when countdown reaches 0
          if (remaining <= 0 && onTimeout) {
            console.log('Countdown reached 0, triggering timeout!');
            onTimeout();
          }
        }, 1000);

        return () => clearInterval(interval);
      }
    }, [lockTimeout, lastActivityRef, onTimeout]);

    return (
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{
          mt: 1,
          textAlign: 'center',
          minHeight: '20px', // Fixed height to prevent bouncing
          fontFamily: 'monospace', // Monospace font for consistent character width
        }}
      >
        {`Session expires in: ${Math.floor(countdown / 60)}m ${Math.floor(countdown % 60)}s`}
      </Typography>
    );
  });

  // Reset activity timer on user interaction
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Disable automatic popup closure - only close via explicit button click
    // if (showAutoLockWarning && !popupJustOpened) {
    //   console.log('Activity detected while warning is showing - closing warning');
    //   setShowAutoLockWarning(false);
    //   setPopupJustOpened(false); // Reset the flag
    //   setAutoLockCountdown(600);
    //   if (countdownIntervalRef.current) {
    //     clearInterval(countdownIntervalRef.current);
    //   }
    //   if (warningTimeoutRef.current) {
    //     clearTimeout(warningTimeoutRef.current);
    //   }
    // }

    // Clear any existing auto-lock timeout (we're using the isolated countdown now)
    if (autoLockTimeoutRef.current) {
      clearTimeout(autoLockTimeoutRef.current);
      autoLockTimeoutRef.current = null;
    }

    // Don't set new timeouts - let the isolated countdown handle it
    console.log('Activity timer reset - using isolated countdown system');
  }, [privacySettings.autoLock, showAutoLockWarning]);

  // Set up auto-lock timeout
  useEffect(() => {
    if (privacySettings.autoLock) {
      resetActivityTimer();
    }

    return () => {
      if (autoLockTimeoutRef.current) {
        clearTimeout(autoLockTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [privacySettings.autoLock, privacySettings.lockTimeout, resetActivityTimer]);

  // Debug: Monitor showAutoLockWarning state changes
  useEffect(() => {
    console.log('showAutoLockWarning state changed to:', showAutoLockWarning);
  }, [showAutoLockWarning]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (warningCountdownIntervalRef.current) {
        clearInterval(warningCountdownIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (autoLockTimeoutRef.current) {
        clearTimeout(autoLockTimeoutRef.current);
      }
    };
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (privacySettings.autoLock) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

      const handleActivity = () => {
        resetActivityTimer();
      };

      events.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true });
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [privacySettings.autoLock, resetActivityTimer]);

  // Password change function
  const handlePasswordChange = async (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    // Reset error state
    setPasswordError(null);

    // Validate form
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      setIsChangingPassword(true);

      // Call the API
      await users.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      // Success - close dialog and reset form
      setShowChangePasswordDialog(false);
      setPasswordError(null);

      // Show success message (you could add a snackbar here)
      console.log('Password changed successfully');
    } catch (error: any) {
      console.error('Password change error:', error);
      setPasswordError(
        error.response?.data?.detail ||
          error.message ||
          'Failed to change password. Please try again.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (confirmationText: string) => {
    try {
      // TODO: Implement actual account deletion API call
      console.log('Deleting account with confirmation:', confirmationText);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For now, just close the dialog
      setShowDeleteAccountDialog(false);

      // TODO: Redirect to logout or show success message
      console.log('Account deletion completed');
    } catch (error) {
      console.error('Account deletion failed:', error);
      // TODO: Handle error appropriately
    }
  };

  const handleDataExport = async (exportData: {
    format: 'json' | 'pdf' | 'csv' | 'xml';
    dataTypes: {
      assignments: boolean;
      preferences: boolean;
      activity: boolean;
      analytics: boolean;
    };
  }) => {
    setIsExportingData(true);
    try {
      // Check if at least one data type is selected
      const selectedTypes = Object.values(exportData.dataTypes).filter(Boolean);
      if (selectedTypes.length === 0) {
        alert('Please select at least one data type to export.');
        return;
      }

      // TODO: Implement actual data export API call
      // This would typically call your backend API to generate the export
      console.log('Exporting data in', exportData.format, 'format:', exportData.dataTypes);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For now, create a mock download
      const mockData = {
        format: exportData.format,
        dataTypes: exportData.dataTypes,
        timestamp: new Date().toISOString(),
        user: 'current_user',
      };

      const blob = new Blob([JSON.stringify(mockData, null, 2)], {
        type:
          exportData.format === 'pdf'
            ? 'application/pdf'
            : exportData.format === 'csv'
            ? 'text/csv'
            : exportData.format === 'xml'
            ? 'application/xml'
            : 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assignmentai_export_${new Date().toISOString().split('T')[0]}.${
        exportData.format
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowDownloadDataDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExportingData(false);
    }
  };

  // Apply language setting
  useEffect(() => {
    // Set document language attribute
    document.documentElement.lang = language;

    // Change language using i18n
    // Language change functionality removed - English only

    // Apply language-specific changes
    if (language === 'es') {
      // Spanish
      document.body.classList.add('language-es');
      document.body.classList.remove('language-fr', 'language-de', 'language-it', 'language-pt');
    } else if (language === 'fr') {
      // French
      document.body.classList.add('language-fr');
      document.body.classList.remove('language-es', 'language-de', 'language-it', 'language-pt');
    } else if (language === 'de') {
      // German
      document.body.classList.add('language-de');
      document.body.classList.remove('language-es', 'language-fr', 'language-it', 'language-pt');
    } else {
      // English (default)
      document.body.classList.remove('language-es', 'language-fr', 'language-de');
    }

    console.log('Language changed to:', language);
  }, [language]);

  // Apply date format setting
  useEffect(() => {
    // Store date format preference in localStorage for future use
    localStorage.setItem('dateFormat', dateFormat.toString());
    console.log('Date format changed to:', dateFormat);
  }, [dateFormat]);

  // Apply timezone setting
  useEffect(() => {
    // Store timezone preference in localStorage for future use
    localStorage.setItem('timezone', timezone);
    console.log('Timezone changed to:', timezone);
  }, [timezone]);

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const loadSavedSettings = () => {
      // Load language settings

      const savedDateFormat = localStorage.getItem('dateFormat');
      if (
        savedDateFormat &&
        ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY'].includes(savedDateFormat)
      ) {
        setDateFormat(savedDateFormat as DateFormat);
      } else {
        // Use locale-based default if no saved preference
        const browserLocale = navigator.language || 'en-US';
        setDateFormat(getDefaultDateFormat(browserLocale));
      }

      // Load timezone
      const savedTimezone = localStorage.getItem('timezone');
      if (savedTimezone) {
        setTimezone(savedTimezone);
      }
    };

    // Try to load from backend first, fall back to localStorage
    loadPreferencesFromBackend().catch(() => {
      loadSavedSettings();
    });

    // Load security data
    loadSecurityData();

    // Load user data for account information
    loadUserData();
  }, []);

  // Listen for subscription updates (e.g., after payment success)
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      console.log('Settings: subscription update event received, refreshing subscription data...');
      loadPreferencesFromBackend();
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate);
    window.addEventListener('payment-success', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
      window.removeEventListener('payment-success', handleSubscriptionUpdate);
    };
  }, []);

  // Load security data from backend
  const loadSecurityData = async () => {
    try {
      console.log('Loading security data from backend...');
      const securityInfo = await securityService.getUserSecurityInfo();
      console.log('Backend security data:', securityInfo);

      setSecuritySettings(prev => {
        const newSettings = {
          ...prev,
          passwordStrength: securityInfo.password_strength,
          lastPasswordChange: securityInfo.last_password_change,
          lastSecurityAudit: securityInfo.last_security_audit,
          securityScore: securityInfo.security_score,
        };

        return newSettings;
      });
    } catch (error) {
      console.error('Failed to load security data:', error);
      // Keep existing values if security data fails to load
    }
  };

  // Load user data for account information
  const loadUserData = async () => {
    try {
      setIsLoadingUserData(true);
      setUserDataError(null);
      const [currentUser, profile, stats] = await Promise.all([
        UserService.getCurrentUser(),
        UserService.getUserProfile(),
        UserService.getDashboardStats(),
      ]);

      setUserData(currentUser);
      setUserProfile(profile);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserDataError('Failed to load user data. Please try again.');
    } finally {
      setIsLoadingUserData(false);
    }
  };

  // Load preferences from backend
  const loadPreferencesFromBackend = async () => {
    setIsLoadingPreferences(true);
    try {
      const userPreferences = await preferences.get();

      console.log('Backend preferences response:', userPreferences);
      console.log('Custom preferences:', userPreferences.custom_preferences);

      // Load subscription data from the proper endpoint
      try {
        const subscriptionResponse = await (
          await import('../services/api')
        ).api.get('/payments/subscriptions/current');
        console.log('Subscription response:', subscriptionResponse.data);

        if (subscriptionResponse.data) {
          const subscriptionData = subscriptionResponse.data;
          console.log('Raw subscription data:', subscriptionData);

          // Determine plan based on ai_model and token_limit
          let plan: SubscriptionPlan = 'free';

          if (
            subscriptionData.ai_model === 'gpt-4-turbo' &&
            subscriptionData.token_limit === 500000
          ) {
            plan = 'pro';
          } else if (
            subscriptionData.ai_model === 'gpt-5' &&
            subscriptionData.token_limit === 100000
          ) {
            plan = 'max';
          } else if (
            subscriptionData.ai_model === 'gpt-4.1-mini' &&
            subscriptionData.token_limit === 250000
          ) {
            plan = 'plus';
          } else if (
            subscriptionData.ai_model === 'gpt-5-nano' &&
            subscriptionData.token_limit === 100000
          ) {
            plan = 'free';
          } else {
            // Fallback: try to determine from plan_id if ai_model mapping fails
            if (subscriptionData.plan_id) {
              if (subscriptionData.plan_id.includes('plus')) plan = 'plus';
              else if (subscriptionData.plan_id.includes('pro')) plan = 'pro';
              else if (subscriptionData.plan_id.includes('max')) plan = 'max';
              else plan = 'free';
            }
          }

          console.log('Determined plan:', plan);
          const planConfig = subscriptionConfig[plan];
          console.log('Plan config:', planConfig);

          setSubscription(prev => ({
            ...prev,
            plan: plan,
            model: planConfig.model,
            tokenLimit: planConfig.tokenLimit,
          }));
          console.log('Updated subscription from API to:', {
            plan,
            model: planConfig.model,
            tokenLimit: planConfig.tokenLimit,
          });
        }
      } catch (subscriptionError) {
        console.warn('Failed to load subscription from API:', subscriptionError);
        // Fall back to preferences if subscription API fails
      }

      if (userPreferences.custom_preferences?.dateFormat) {
        const format = userPreferences.custom_preferences.dateFormat as string;
        if (['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY'].includes(format)) {
          setDateFormat(format as DateFormat);
        }
      }
      if (userPreferences.custom_preferences?.timezone) {
        setTimezone(userPreferences.custom_preferences.timezone as string);
      }
      if (userPreferences.language) {
        setLanguage(userPreferences.language);
      }
      if (userPreferences.theme) {
        // Theme is handled by context, no need to set here
      }

      if (userPreferences.compact_mode !== undefined) {
        setCompactMode(userPreferences.compact_mode);
      }

      // Load AI settings from dedicated endpoint
      try {
        const aiUserSettings = await (await import('../services/api')).aiSettings.get();
        if (aiUserSettings.tokenContextLimit) {
          const loadedLimit = Number(aiUserSettings.tokenContextLimit);
          // Ensure the loaded limit doesn't exceed the current plan's limit
          const maxLimit = subscription.tokenLimit || 100000; // Default to free plan if not set yet
          const validLimit = Math.min(loadedLimit, maxLimit);
          setTokenContextLimit(validLimit);
          if (loadedLimit > maxLimit) {
            console.warn(
              `Loaded token context limit (${loadedLimit}) exceeds plan limit (${maxLimit}), setting to ${validLimit}`
            );
          }
        }
        if (aiUserSettings.temperature) {
          setTemperature(aiUserSettings.temperature.toString());
        }
        if (aiUserSettings.contextLength) {
          setContextLength(Number(aiUserSettings.contextLength));
        }
      } catch (error) {
        console.warn('Failed to load AI settings, using defaults:', error);
        // Fallback to custom_preferences if available
        if (userPreferences.custom_preferences?.maxTokens) {
          const loadedLimit = Number(userPreferences.custom_preferences.maxTokens) || 1000;
          const maxLimit = subscription.tokenLimit || 100000;
          const validLimit = Math.min(loadedLimit, maxLimit);
          setTokenContextLimit(validLimit);
        }
        if (userPreferences.custom_preferences?.temperature) {
          setTemperature(userPreferences.custom_preferences.temperature.toString() || '0.5');
        }
        if (userPreferences.custom_preferences?.contextLength) {
          setContextLength(Number(userPreferences.custom_preferences.contextLength) || 10);
        }
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
      if (userPreferences.custom_preferences?.plan) {
        console.log('Found plan in custom_preferences:', userPreferences.custom_preferences.plan);
        const plan = userPreferences.custom_preferences!.plan as SubscriptionPlan;
        const planConfig = subscriptionConfig[plan];
        console.log('Plan config:', planConfig);
        setSubscription(prev => ({
          ...prev,
          plan: plan,
          model: planConfig.model,
          tokenLimit: planConfig.tokenLimit,
        }));
        console.log('Updated subscription to:', {
          plan,
          model: planConfig.model,
          tokenLimit: planConfig.tokenLimit,
        });
      } else if (userPreferences.custom_preferences?.model) {
        console.log('Found model in custom_preferences:', userPreferences.custom_preferences.model);
        // If no plan but model exists, try to find the plan for this model
        const model = userPreferences.custom_preferences!.model;
        const targetPlan = Object.entries(subscriptionConfig).find(
          ([_, config]) => config.model === model
        )?.[0] as SubscriptionPlan;

        if (targetPlan) {
          const planConfig = subscriptionConfig[targetPlan];
          setSubscription(prev => ({
            ...prev,
            plan: targetPlan,
            model: model,
            tokenLimit: planConfig.tokenLimit,
          }));
          console.log('Updated subscription from model to:', {
            plan: targetPlan,
            model,
            tokenLimit: planConfig.tokenLimit,
          });
        }
      } else {
        console.log('No plan or model found in custom_preferences');
      }
    } catch (error) {
      console.warn('Failed to load preferences from backend:', error);
      // Fall back to localStorage
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  // Set initial values after loading preferences
  useEffect(() => {
    if (!isLoadingPreferences && !isSettingsLoaded) {
      const currentValues = {
        darkMode,
        language,
        fontSize,
        animations,
        compactMode,
        dateFormat,
        tokenContextLimit,
        temperature,
        contextLength,
        autoComplete,
        codeSnippets,
        aiSuggestions,
        realTimeAnalysis,

        privacySettings,
        subscription,
      };
      setInitialValues(currentValues);
      setIsSettingsLoaded(true);
    }
  }, [
    isLoadingPreferences,
    isSettingsLoaded,
    darkMode,
    language,
    fontSize,
    animations,
    compactMode,
    dateFormat,
    tokenContextLimit,
    temperature,
    contextLength,
    autoComplete,
    codeSnippets,
    aiSuggestions,
    realTimeAnalysis,
    privacySettings,
    subscription,
  ]);

  // Handle beforeunload event to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (checkForUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [checkForUnsavedChanges]);

  // Update hasUnsavedChanges ref whenever there are unsaved changes
  useEffect(() => {
    hasUnsavedChanges.current = checkForUnsavedChanges();
  }, [checkForUnsavedChanges]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (checkForUnsavedChanges()) {
        event.preventDefault();
        setPendingNavigation(location.pathname);
        setShowUnsavedChangesDialog(true);
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [checkForUnsavedChanges, location.pathname]);

  // Save preferences to backend
  const savePreferencesToBackend = async () => {
    try {
      // Save AI settings separately
      await (
        await import('../services/api')
      ).aiSettings.update({
        tokenContextLimit,
        temperature: parseFloat(temperature),
        contextLength,
      });

      // Save other preferences
      await preferences.update({
        language,
        theme: darkMode ? 'dark' : 'light',
        compact_mode: compactMode,
        custom_preferences: {
          dateFormat,
          timezone,
          autoComplete,
          codeSnippets,
          aiSuggestions,
          realTimeAnalysis,
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
          Settings saved successfully
        </Alert>
      )}

      {isValidatingSettings && (
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            Saving settings...
          </Box>
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
          }}
        >
          Settings
        </Typography>

        {/* Search Bar */}
        <TextField
          placeholder="Search settings..."
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
          startIcon={
            isValidatingSettings ? <CircularProgress size={16} color="inherit" /> : <Save />
          }
          onClick={handleSave}
          disabled={isValidatingSettings}
          className={`save-changes settings-save-button ${
            checkForUnsavedChanges() && !isValidatingSettings ? 'unsaved-changes-pulse' : ''
          }`}
          sx={{
            ml: { xs: 0, md: 'auto' },
            // Dark mode specific styling
            ...(theme.palette.mode === 'dark' && {
              backgroundColor: 'transparent !important',
              color: '#d32f2f !important',
              border: '2px solid #d32f2f !important',
              boxShadow: 'none !important',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.1) !important',
                boxShadow: '0 4px 20px 0px rgba(211, 47, 47, 0.3) !important',
              },
              '& .MuiSvgIcon-root': {
                color: '#d32f2f !important',
              },
            }),
            // Light mode styling (keep original gradient)
            ...(theme.palette.mode === 'light' && {
              backgroundColor: 'transparent !important',
              '&:hover': {
                backgroundColor: 'transparent !important',
              },
            }),
            // Override for unsaved changes state
            ...(checkForUnsavedChanges() &&
              !isValidatingSettings && {
                backgroundColor: `${theme.palette.warning.main} !important`,
                '&:hover': {
                  backgroundColor: `${theme.palette.warning.dark} !important`,
                },
              }),
            // Override for validating state
            ...(isValidatingSettings && {
              backgroundColor: `${theme.palette.info.main} !important`,
              '&:hover': {
                backgroundColor: `${theme.palette.info.dark} !important`,
              },
            }),
          }}
        >
          {isValidatingSettings ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              Saving...
            </Box>
          ) : checkForUnsavedChanges() ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Save Changes</Box>
          ) : (
            'Save Changes'
          )}
        </Button>
      </Box>

      <Box
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[2],
          border: '2px solid',
          borderColor: '#d32f2f',
        }}
      >
        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab icon={<Tune />} label="General" />
            <Tab icon={<PsychologyOutlined />} label="AI Settings" />
            <Tab icon={<SecurityOutlined />} label="Privacy & Security" />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <TabPanel value={tabValue} index={0} breakpoint={breakpoint}>
            <SettingsSection
              title="Appearance"
              icon={<Brush sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={<Switch checked={darkMode} onChange={toggleTheme} />}
                      label="Dark Mode"
                    />
                    {darkMode && (
                      <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                        <InputLabel>Dark Theme Color</InputLabel>
                        <Select
                          value={darkThemeColor}
                          label="Dark Theme Color"
                          onChange={e =>
                            setDarkThemeColor(
                              e.target.value as 'navy' | 'charcoal' | 'darkGray' | 'pitchBlack'
                            )
                          }
                          sx={{
                            '& .MuiSelect-select': {
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            },
                          }}
                        >
                          <MenuItem value="navy">
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: theme => theme.palette.background.paper,
                                border: '1px solid',
                                borderColor: 'divider',
                                mr: 1,
                              }}
                            />
                            Navy
                          </MenuItem>
                          <MenuItem value="pitchBlack">
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: '#141414',
                                border: '1px solid',
                                borderColor: 'divider',
                                mr: 1,
                              }}
                            />
                            Pitch Black
                          </MenuItem>
                          <MenuItem value="charcoal">
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid',
                                borderColor: 'divider',
                                mr: 1,
                              }}
                            />
                            Charcoal
                          </MenuItem>
                          <MenuItem value="darkGray">
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: '#282828',
                                border: '1px solid',
                                borderColor: 'divider',
                                mr: 1,
                              }}
                            />
                            Dark Gray
                          </MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </FormGroup>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={animations}
                          onChange={e => setAnimations(e.target.checked)}
                        />
                      }
                      label="Enable Animations"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={compactMode}
                          onChange={e => setCompactMode(e.target.checked)}
                        />
                      }
                      label="Compact Mode"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title="Language & Date"
              icon={<Language sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={language}
                      label="Language"
                      onChange={e => {
                        const newLanguage = e.target.value;
                        setLanguage(newLanguage);
                        // Language change functionality removed - English only
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme =>
                            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                        },
                      }}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem
                        value="es"
                        disabled
                        sx={{
                          color: 'text.disabled',
                          opacity: 0.6,
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        Español (Coming soon)
                      </MenuItem>
                      <MenuItem
                        value="fr"
                        disabled
                        sx={{
                          color: 'text.disabled',
                          opacity: 0.6,
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        Français (Coming soon)
                      </MenuItem>
                      <MenuItem
                        value="de"
                        disabled
                        sx={{
                          color: 'text.disabled',
                          opacity: 0.6,
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        Deutsch (Coming soon)
                      </MenuItem>
                    </Select>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Current Language:{' '}
                      {language === 'en'
                        ? 'English'
                        : language === 'es'
                        ? 'Español'
                        : language === 'fr'
                        ? 'Français'
                        : language === 'de'
                        ? 'Deutsch'
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
                    <DateFormatSelector
                      value={dateFormat}
                      onChange={setDateFormat}
                      onValidationError={setDateFormatError}
                      label="Date Format"
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

                  <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth size="medium">
                      <InputLabel>Time Zone</InputLabel>
                      <Select
                        value={timezone}
                        onChange={e => setTimezone(e.target.value)}
                        label="Time Zone"
                      >
                        <MenuItem value="UTC">UTC (Coordinated Universal Time)</MenuItem>
                        <MenuItem value="America/New_York">Eastern Time (US & Canada)</MenuItem>
                        <MenuItem value="America/Chicago">Central Time (US & Canada)</MenuItem>
                        <MenuItem value="America/Denver">Mountain Time (US & Canada)</MenuItem>
                        <MenuItem value="America/Los_Angeles">Pacific Time (US & Canada)</MenuItem>
                        <MenuItem value="America/Anchorage">Alaska</MenuItem>
                        <MenuItem value="Pacific/Honolulu">Hawaii</MenuItem>
                        <MenuItem value="Europe/London">London (GMT/BST)</MenuItem>
                        <MenuItem value="Europe/Paris">Paris (CET/CEST)</MenuItem>
                        <MenuItem value="Europe/Berlin">Berlin (CET/CEST)</MenuItem>
                        <MenuItem value="Europe/Rome">Rome (CET/CEST)</MenuItem>
                        <MenuItem value="Europe/Madrid">Madrid (CET/CEST)</MenuItem>
                        <MenuItem value="Europe/Moscow">Moscow (MSK)</MenuItem>
                        <MenuItem value="Asia/Dubai">Dubai (GST)</MenuItem>
                        <MenuItem value="Asia/Kolkata">India (IST)</MenuItem>
                        <MenuItem value="Asia/Bangkok">Bangkok (ICT)</MenuItem>
                        <MenuItem value="Asia/Singapore">Singapore (SGT)</MenuItem>
                        <MenuItem value="Asia/Hong_Kong">Hong Kong (HKT)</MenuItem>
                        <MenuItem value="Asia/Shanghai">China (CST)</MenuItem>
                        <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
                        <MenuItem value="Asia/Seoul">Seoul (KST)</MenuItem>
                        <MenuItem value="Australia/Sydney">Sydney (AEDT/AEST)</MenuItem>
                        <MenuItem value="Australia/Melbourne">Melbourne (AEDT/AEST)</MenuItem>
                        <MenuItem value="Australia/Brisbane">Brisbane (AEST)</MenuItem>
                        <MenuItem value="Australia/Perth">Perth (AWST)</MenuItem>
                        <MenuItem value="Pacific/Auckland">Auckland (NZDT/NZST)</MenuItem>
                      </Select>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: 'block' }}
                      >
                        Current Time Zone: {timezone}
                      </Typography>
                    </FormControl>
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

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventOutlined fontSize="small" color="action" />
                        <Typography variant="body2">{dateFormat}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Language fontSize="small" color="action" />
                        <Typography variant="body2">{timezone}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
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
                            {formatDateWithPreference(new Date())}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            // Auto-detect based on browser locale
                            const browserLocale = navigator.language || 'en-US';
                            setDateFormat(getDefaultDateFormat(browserLocale));
                          }}
                          sx={{ py: 0.5, px: 1 }}
                        >
                          Auto-detect
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
              title="AI Model Configuration"
              icon={<PsychologyOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              {aiSettingsError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {aiSettingsError}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>AI Model</InputLabel>
                    <Select
                      value={subscription.model}
                      label="AI Model"
                      onChange={e => handleModelChange(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme =>
                            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                        },
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
                            '&.Mui-selected': {
                              backgroundColor: theme.palette.primary.main + '20',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                            }}
                          >
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={plan === subscription.plan ? 600 : 400}
                              >
                                {config.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan •{' '}
                                {config.tokenLimit.toLocaleString()} tokens
                              </Typography>
                            </Box>
                            {plan === subscription.plan && (
                              <Typography variant="caption" color="primary.main" fontWeight={600}>
                                Current
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Current plan:{' '}
                      {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} •
                      Model: {subscriptionConfig[subscription.plan].label}
                    </Typography>
                  </FormControl>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CompareArrows />}
                      onClick={() => setShowModelComparison(true)}
                      size="small"
                      sx={{
                        py: 0.5,
                        px: 1.5,
                        minHeight: '32px',
                      }}
                    >
                      Compare Models
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={resetAISettingsToDefaults}
                      size="small"
                      sx={{
                        py: 0.5,
                        px: 1.5,
                        minHeight: '32px',
                      }}
                    >
                      Reset to Defaults
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Token Context Limit (Max: {subscription.tokenLimit.toLocaleString()})
                    {tokenContextLimit === subscription.tokenLimit && (
                      <Typography
                        component="span"
                        variant="caption"
                        color="success.main"
                        sx={{ ml: 1, fontWeight: 600 }}
                      >
                        • At Plan Limit
                      </Typography>
                    )}
                  </Typography>
                  <Slider
                    value={tokenContextLimit}
                    onChange={(_e, value) => {
                      const newValue = value as number;
                      // Ensure the value doesn't exceed the plan limit
                      const clampedValue = Math.min(newValue, subscription.tokenLimit);
                      setTokenContextLimit(clampedValue);

                      if (newValue > subscription.tokenLimit) {
                        console.log(
                          `Requested ${newValue.toLocaleString()} tokens, but plan limit is ${subscription.tokenLimit.toLocaleString()}. Setting to ${clampedValue.toLocaleString()}.`
                        );
                      }
                    }}
                    onChangeCommitted={(_e, value) => {
                      const newValue = value as number;
                      const clampedValue = Math.min(newValue, subscription.tokenLimit);
                      setTokenContextLimit(clampedValue);
                    }}
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
                    track="normal"
                    size="medium"
                    sx={{
                      '& .MuiSlider-markLabel': {
                        fontSize: '0.75rem',
                      },
                      '& .MuiSlider-track': {
                        height: 4,
                      },
                      '& .MuiSlider-rail': {
                        height: 4,
                      },
                      '& .MuiSlider-thumb': {
                        height: 20,
                        width: 20,
                        '&:hover, &:focus, &:active': {
                          boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
                        },
                      },
                    }}
                  />
                  <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
                    Current: {tokenContextLimit.toLocaleString()} tokens • Maximum:{' '}
                    {subscription.tokenLimit.toLocaleString()} tokens
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    Higher limits allow for more context to be considered in AI responses, improving
                    relevance and continuity. Your {subscription.plan} plan allows up to{' '}
                    {subscription.tokenLimit.toLocaleString()} tokens.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Temperature</Typography>
                  <Slider
                    value={parseFloat(temperature)}
                    onChange={(_e, value) => setTemperature(value.toString())}
                    onChangeCommitted={(_e, value) => setTemperature(value.toString())}
                    min={0}
                    max={1}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                    disableSwap
                    track="normal"
                    size="medium"
                    sx={{
                      '& .MuiSlider-track': {
                        height: 4,
                      },
                      '& .MuiSlider-rail': {
                        height: 4,
                      },
                      '& .MuiSlider-thumb': {
                        height: 20,
                        width: 20,
                        '&:hover, &:focus, &:active': {
                          boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
                        },
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Controls consistency vs creativity. Lower values (0.1-0.3) are more focused,
                    higher values (0.7-1.0) are more creative.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Context Length</Typography>
                  <Slider
                    value={contextLength}
                    onChange={(_e, value) => setContextLength(value as number)}
                    onChangeCommitted={(_e, value) => setContextLength(value as number)}
                    min={1}
                    max={20}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    disableSwap
                    track="normal"
                    size="medium"
                    sx={{
                      '& .MuiSlider-track': {
                        height: 4,
                      },
                      '& .MuiSlider-rail': {
                        height: 4,
                      },
                      '& .MuiSlider-thumb': {
                        height: 20,
                        width: 20,
                        '&:hover, &:focus, &:active': {
                          boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
                        },
                      },
                    }}
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
              title="AI Features"
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
                              AI Auto-Complete
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
                              Code Snippets Generation
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
                              AI Suggestions
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
                              Real-Time Analysis
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
                      {(() => {
                        const activeFeatures = [
                          autoComplete && 'Auto-complete',
                          codeSnippets && 'Code snippets',
                          aiSuggestions && 'AI suggestions',
                          realTimeAnalysis && 'Real-time analysis',
                        ].filter(Boolean);

                        if (activeFeatures.length === 4) {
                          return 'All';
                        } else if (activeFeatures.length === 0) {
                          return 'None';
                        } else {
                          return activeFeatures.join(', ');
                        }
                      })()}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setAutoComplete(true);
                        setCodeSnippets(true);
                        setAiSuggestions(true);
                        setRealTimeAnalysis(true);
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
                      onClick={() => setShowAIFeaturesTestDialog(true)}
                      sx={{ ml: 'auto' }}
                    >
                      AI Features Status
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>

          <TabPanel value={tabValue} index={2} breakpoint={breakpoint}>
            <SettingsSection
              title="Security Score"
              icon={<BarChartOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              {privacySettingsError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {privacySettingsError}
                </Alert>
              )}

              <Box sx={{ mb: 4, position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 2,
                    gap: { xs: 1, sm: 2 },
                  }}
                >
                  <Typography variant="h6">Security Score</Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: progressBarColor,
                      transition: 'color 0.3s ease-in-out',
                    }}
                  >
                    {Math.round(animatedSecurityScore)}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      flex: 1,
                      height: 10,
                      borderRadius: 5,
                      background: 'rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${animatedSecurityScore}%`,
                        height: '100%',
                        background: progressBarColor,
                        borderRadius: 5,
                        transition: 'width 0.5s ease-in-out, background-color 0.3s ease-in-out',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    color={progressBarColor}
                    sx={{ transition: 'color 0.3s ease-in-out' }}
                  >
                    {Math.round(animatedSecurityScore)}%
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Last Security Audit:{' '}
                  {securitySettings.lastSecurityAudit
                    ? formatDateWithPreference(securitySettings.lastSecurityAudit)
                    : 'Never'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.primary',
                      fontWeight: 500,
                    }}
                  >
                    Security Level:{' '}
                    <Box
                      component="span"
                      sx={{
                        color:
                          securitySummary.securityLevel === 'High'
                            ? 'success.main'
                            : securitySummary.securityLevel === 'Medium'
                            ? 'warning.main'
                            : 'error.main',
                      }}
                    >
                      {securitySummary.securityLevel}
                    </Box>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
                        transition: 'all 0.3s ease-in-out',
                        transform: 'translateZ(0)', // Enable hardware acceleration
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
                            // Toggle two-factor authentication
                            setPrivacySettings({
                              ...privacySettings,
                              twoFactorAuth: !privacySettings.twoFactorAuth,
                            });
                          } else if (item.id === 'biometric') {
                            // Toggle biometric login
                            setPrivacySettings({
                              ...privacySettings,
                              biometricLogin: !privacySettings.biometricLogin,
                            });
                          } else if (item.id === 'autolock') {
                            // Toggle auto-lock account
                            setPrivacySettings({
                              ...privacySettings,
                              autoLock: !privacySettings.autoLock,
                            });
                          } else if (item.id === 'password') {
                            // Open change password dialog
                            setShowChangePasswordDialog(true);
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
              title="Privacy Settings"
              icon={<PrivacyTipOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={{ xs: 2, md: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Data Privacy
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
                            Allow Data Collection
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
                            Share Analytics
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
                            Show Online Status
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
                            Allow Activity Tracking
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
                    Account Security
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
                            Two-Factor Authentication
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
                            Biometric Login
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
                            Auto-Lock Account
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
                    Auto-Lock Timeout
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme =>
                            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                        },
                      }}
                    >
                      <MenuItem value={0.167}>10 seconds (testing)</MenuItem>
                      <MenuItem value={30}>30 minutes</MenuItem>
                      <MenuItem value={60}>1 hour</MenuItem>
                      <MenuItem value={120}>2 hours</MenuItem>
                      <MenuItem value={240}>4 hours</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Debug Info */}
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Auto-lock: {privacySettings.autoLock ? 'ON' : 'OFF'} | Timeout:{' '}
                      {privacySettings.lockTimeout} min
                    </Typography>
                  </Box>

                  {/* Auto-lock Countdown */}
                  {privacySettings.autoLock && (
                    <AutoLockCountdown
                      lockTimeout={privacySettings.lockTimeout}
                      lastActivityRef={lastActivityRef}
                      onTimeout={() => {
                        console.log('Countdown timeout reached - showing warning popup');
                        console.log('Setting showAutoLockWarning to true');
                        setShowAutoLockWarning(true);

                        // Reset warning countdown to 10 seconds for testing
                        setWarningCountdown(10);

                        // Start the warning countdown timer
                        if (warningCountdownIntervalRef.current) {
                          clearInterval(warningCountdownIntervalRef.current);
                        }
                        warningCountdownIntervalRef.current = setInterval(() => {
                          setWarningCountdown(prev => {
                            if (prev <= 1) {
                              // Time's up, log out
                              console.log('Warning countdown reached 0 - logging out');
                              if (warningCountdownIntervalRef.current) {
                                clearInterval(warningCountdownIntervalRef.current);
                                warningCountdownIntervalRef.current = null;
                              }

                              // Override any existing beforeunload handlers
                              window.onbeforeunload = null;
                              window.removeEventListener('beforeunload', () => {});

                              // Clear session data
                              localStorage.removeItem('token');
                              localStorage.removeItem('user');
                              sessionStorage.clear();

                              // Force immediate logout without any warnings
                              try {
                                // Stop the current page execution immediately
                                window.stop();
                                // Force redirect
                                window.location.replace('/login');
                              } catch (error) {
                                // Nuclear option - force page unload
                                window.location.href = 'about:blank';
                                setTimeout(() => {
                                  window.location.href = '/login';
                                }, 100);
                              }
                              return 0;
                            }
                            return prev - 1;
                          });
                        }, 1000);

                        // Set a longer timeout for automatic logout (e.g., 30 minutes)
                        if (warningTimeoutRef.current) {
                          clearTimeout(warningTimeoutRef.current);
                        }
                        warningTimeoutRef.current = setTimeout(() => {
                          console.log('Final timeout reached - logging out');
                          if (warningCountdownIntervalRef.current) {
                            clearInterval(warningCountdownIntervalRef.current);
                            warningCountdownIntervalRef.current = null;
                          }

                          // Override any existing beforeunload handlers
                          window.onbeforeunload = null;
                          window.removeEventListener('beforeunload', () => {});

                          // Clear session data
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          sessionStorage.clear();

                          // Force immediate logout without any warnings
                          try {
                            // Stop the current page execution immediately
                            window.stop();
                            // Force redirect
                            window.location.replace('/login');
                          } catch (error) {
                            // Nuclear option - force page unload
                            window.location.href = 'about:blank';
                            setTimeout(() => {
                              window.location.href = '/login';
                            }, 100);
                          }
                        }, 1800000); // 30 minutes instead of 10
                      }}
                    />
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Security Information
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: { xs: 0, md: 2 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 40, md: 56 } }}>
                        <VpnKeyOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary="Password Strength"
                        secondary={
                          securitySettings.passwordStrength.charAt(0).toUpperCase() +
                          securitySettings.passwordStrength.slice(1)
                        }
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
                        primary="Last Password Change"
                        secondary={
                          securitySettings.lastPasswordChange
                            ? formatDateWithPreference(securitySettings.lastPasswordChange)
                            : 'Never'
                        }
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
                        primary="Security Status"
                        secondary="Account Protected"
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
                        <BarChartOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary="Security Score"
                        secondary={`${Math.round(animatedSecurityScore)}/100`}
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
                          Level: {securitySummary.securityLevel}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <VpnKeyOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Password:{' '}
                          {getCurrentPasswordStrength().charAt(0).toUpperCase() +
                            getCurrentPasswordStrength().slice(1)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <BarChartOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Score: {Math.round(animatedSecurityScore)}/100
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <VerifiedUserOutlined fontSize="small" color="action" />
                        <Typography variant="body2">Security: Account Protected</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                        <CheckCircleOutlined fontSize="small" color="action" sx={{ mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Features:
                          </Typography>
                          {securitySummary.enabledFeatures.split(', ').map((feature, index) => (
                            <Typography key={index} variant="body2" sx={{ ml: 1 }}>
                              - {feature}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          Last Audit:{' '}
                          {securitySummary.lastAudit
                            ? formatDateWithPreference(securitySummary.lastAudit)
                            : 'Never'}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} md={12} lg={12}>
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Account Management
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 2,
                        width: '100%',
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<VerifiedUserOutlined />}
                        fullWidth
                        sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        onClick={() => {
                          setShowAccountInfoDialog(true);
                          loadUserData();
                        }}
                      >
                        Account Information
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<VpnKeyOutlined />}
                        fullWidth
                        sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        onClick={() => setShowChangePasswordDialog(true)}
                      >
                        Change Password
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<DownloadOutlined />}
                        fullWidth
                        sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        onClick={() => setShowDownloadDataDialog(true)}
                      >
                        Download My Data
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteForeverOutlined />}
                        fullWidth
                        sx={{
                          bgcolor: 'error.main',
                          color: theme => (theme.palette.mode === 'dark' ? 'white' : 'white'),
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          '&:hover': {
                            bgcolor: 'error.dark',
                          },
                        }}
                        onClick={() => setShowDeleteAccountDialog(true)}
                      >
                        Delete Account
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>
        </Box>
      </Box>

      {/* Model Comparison Dialog */}
      <Dialog
        open={showModelComparison}
        onClose={() => setShowModelComparison(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
          },
        }}
      >
        <DialogContent>
          <DialogTitle sx={{ color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black') }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CompareArrows />
              AI Model Comparison
            </Box>
          </DialogTitle>
          <Grid container spacing={3}>
            {Object.entries(subscriptionConfig).map(([plan, config]) => (
              <Grid item xs={12} md={6} key={plan}>
                <Paper
                  elevation={2}
                  onClick={() => setSelectedModelPlan(plan as SubscriptionPlan)}
                  sx={{
                    p: 3,
                    pt: 4,
                    border: selectedModelPlan === plan ? '3px solid' : '1px solid',
                    borderColor:
                      selectedModelPlan === plan
                        ? plan === 'free'
                          ? '#2196f3'
                          : plan === 'plus'
                          ? '#4caf50'
                          : plan === 'pro'
                          ? '#9c27b0'
                          : '#ff9800'
                        : 'divider',
                    borderRadius: 2,
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                      borderColor:
                        plan === 'free'
                          ? '#2196f3'
                          : plan === 'plus'
                          ? '#4caf50'
                          : plan === 'pro'
                          ? '#9c27b0'
                          : '#ff9800',
                    },
                  }}
                >
                  {selectedModelPlan === plan && (
                    <Chip
                      label="Selected"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor:
                          plan === 'free'
                            ? '#2196f3'
                            : plan === 'plus'
                            ? '#4caf50'
                            : plan === 'pro'
                            ? '#9c27b0'
                            : '#ff9800',
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'white'),
                        fontWeight: 'bold',
                      }}
                    />
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {plan === 'free' && (
                      <SmartToyOutlined
                        sx={{
                          fontSize: '1.5rem',
                          color: '#2196f3',
                        }}
                      />
                    )}
                    {plan === 'plus' && (
                      <PsychologyOutlined
                        sx={{
                          fontSize: '1.5rem',
                          color: '#4caf50',
                        }}
                      />
                    )}
                    {plan === 'pro' && (
                      <AutoAwesomeOutlined
                        sx={{
                          fontSize: '1.5rem',
                          color: '#9c27b0',
                        }}
                      />
                    )}
                    {plan === 'max' && (
                      <RocketLaunchOutlined
                        sx={{
                          fontSize: '1.5rem',
                          color: '#ff9800',
                        }}
                      />
                    )}
                    <Typography
                      variant="h6"
                      sx={{
                        color:
                          plan === 'free'
                            ? '#2196f3'
                            : plan === 'plus'
                            ? '#4caf50'
                            : plan === 'pro'
                            ? '#9c27b0'
                            : '#ff9800',
                        fontWeight: 'bold',
                      }}
                    >
                      {config.label}
                    </Typography>
                  </Box>

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
                          <CurrencyBitcoinIcon
                            sx={{
                              fontSize: '1.2rem',
                              color:
                                plan === 'free'
                                  ? '#2196f3'
                                  : plan === 'plus'
                                  ? '#4caf50'
                                  : plan === 'pro'
                                  ? '#9c27b0'
                                  : '#ff9800',
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${config.tokenLimit.toLocaleString()} token limit`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {plan === 'free' ? (
                            <SchoolOutlined
                              sx={{
                                fontSize: '1.2rem',
                                color: '#2196f3',
                              }}
                            />
                          ) : plan === 'plus' ? (
                            <ScienceOutlined
                              sx={{
                                fontSize: '1.2rem',
                                color: '#4caf50',
                              }}
                            />
                          ) : plan === 'pro' ? (
                            <Search
                              sx={{
                                fontSize: '1.2rem',
                                color: '#9c27b0',
                              }}
                            />
                          ) : (
                            <AllInclusive
                              sx={{
                                fontSize: '1.2rem',
                                color: '#ff9800',
                              }}
                            />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            plan === 'free'
                              ? 'Basic Assignment Analysis'
                              : plan === 'plus'
                              ? 'Advanced Writing Analysis'
                              : plan === 'pro'
                              ? 'AI-Powered Research Assistance'
                              : 'Unlimited Assignment Analysis'
                          }
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {plan === 'free' ? (
                            <Spellcheck
                              sx={{
                                fontSize: '1.2rem',
                                color: '#2196f3',
                              }}
                            />
                          ) : plan === 'plus' ? (
                            <PaletteOutlined
                              sx={{
                                fontSize: '1.2rem',
                                color: '#4caf50',
                              }}
                            />
                          ) : plan === 'pro' ? (
                            <FormatQuoteOutlined
                              sx={{
                                fontSize: '1.2rem',
                                color: '#9c27b0',
                              }}
                            />
                          ) : (
                            <BarChartOutlined
                              sx={{
                                fontSize: '1.2rem',
                                color: '#ff9800',
                              }}
                            />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            plan === 'free'
                              ? 'Grammar & Spelling Check'
                              : plan === 'plus'
                              ? 'Style & Tone Suggestions'
                              : plan === 'pro'
                              ? 'Citation & Reference Check'
                              : 'Advanced Analytics Dashboard'
                          }
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {plan === 'free' ? (
                            <TextSnippetOutlined
                              sx={{
                                fontSize: '1.2rem',
                                color: '#2196f3',
                              }}
                            />
                          ) : plan === 'plus' ? (
                            <LibraryBooksOutlined
                              sx={{
                                fontSize: '1.2rem',
                                color: '#4caf50',
                              }}
                            />
                          ) : plan === 'pro' ? (
                            <GppGoodOutlined
                              sx={{
                                fontSize: '1.2rem',
                                color: '#9c27b0',
                              }}
                            />
                          ) : (
                            <DesignServicesOutlined
                              sx={{
                                fontSize: '1.2rem',
                                color: '#ff9800',
                              }}
                            />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            plan === 'free'
                              ? 'Basic Templates'
                              : plan === 'plus'
                              ? 'Extended Templates Library'
                              : plan === 'pro'
                              ? 'Plagiarism Detection'
                              : 'Custom Assignment Templates'
                          }
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
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'error.main',
                        fontWeight: 'bold',
                      }}
                    >
                      {plan === 'free' && 'Free'}
                      {plan === 'plus' && '$4.99/month'}
                      {plan === 'pro' && '$9.99/month'}
                      {plan === 'max' && '$14.99/month'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModelComparison(false)}>Close</Button>
          {selectedModelPlan && (
            <Button
              variant="contained"
              disabled={selectedModelPlan === subscription.plan}
              onClick={() => {
                if (selectedModelPlan !== subscription.plan) {
                  setShowModelComparison(false);
                  navigate('/dashboard/price-plan');
                }
              }}
              sx={{
                backgroundColor:
                  selectedModelPlan === subscription.plan
                    ? '#9e9e9e'
                    : selectedModelPlan === 'free'
                    ? '#2196f3'
                    : selectedModelPlan === 'plus'
                    ? '#4caf50'
                    : selectedModelPlan === 'pro'
                    ? '#9c27b0'
                    : '#ff9800',
                '&:hover': {
                  backgroundColor:
                    selectedModelPlan === subscription.plan
                      ? '#9e9e9e'
                      : selectedModelPlan === 'free'
                      ? '#1976d2'
                      : selectedModelPlan === 'plus'
                      ? '#388e3c'
                      : selectedModelPlan === 'pro'
                      ? '#7b1fa2'
                      : '#f57c00',
                },
                '&:disabled': {
                  backgroundColor: '#9e9e9e',
                  color: theme => (theme.palette.mode === 'dark' ? '#ffffff' : '#ffffff'),
                },
              }}
            >
              {selectedModelPlan === subscription.plan
                ? 'Current Plan'
                : `Upgrade to ${
                    selectedModelPlan
                      ? selectedModelPlan.charAt(0).toUpperCase() + selectedModelPlan.slice(1)
                      : ''
                  }`}
            </Button>
          )}
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

      {/* Enhanced Security Audit Dialog */}
      <Dialog
        open={showSecurityAudit}
        onClose={() => setShowSecurityAudit(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            border: '2px solid #d32f2f',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
            borderBottom: '2px solid #d32f2f',
            pb: 2,
            background: theme =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(211, 47, 47, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(211, 47, 47, 0.02) 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SecurityOutlined sx={{ color: '#d32f2f', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                Security Audit Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive security analysis • Generated {new Date().toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {/* Security Score Overview */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 3,
                borderRadius: 2,
                background: theme =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(211, 47, 47, 0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(211, 47, 47, 0.02) 100%)',
                border: '1px solid #d32f2f',
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                  {calculateSecurityScore()}/100
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Overall Security Score
                </Typography>
                <Chip
                  label={
                    calculateSecurityScore() >= 80
                      ? 'Excellent'
                      : calculateSecurityScore() >= 60
                      ? 'Good'
                      : 'Needs Improvement'
                  }
                  color={
                    calculateSecurityScore() >= 80
                      ? 'success'
                      : calculateSecurityScore() >= 60
                      ? 'warning'
                      : 'error'
                  }
                  sx={{ mt: 1 }}
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `conic-gradient(#d32f2f ${
                      calculateSecurityScore() * 3.6
                    }deg, #e0e0e0 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                    {calculateSecurityScore()}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 3, height: '100%', border: '1px solid #d32f2f', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  Security Score Breakdown
                </Typography>
                <Stack spacing={2}>
                  {[
                    { name: 'Base Security', score: 20, max: 20, icon: <ShieldOutlined /> },
                    {
                      name: 'Password Strength',
                      score:
                        securitySettings.passwordStrength === 'strong'
                          ? 20
                          : securitySettings.passwordStrength === 'medium'
                          ? 10
                          : 0,
                      max: 20,
                      icon: <VpnKeyOutlined />,
                    },
                    {
                      name: 'Two-Factor Auth',
                      score: privacySettings.twoFactorAuth ? 25 : 0,
                      max: 25,
                      icon: <SecurityUpdateOutlined />,
                    },
                    {
                      name: 'Biometric Login',
                      score: privacySettings.biometricLogin ? 15 : 0,
                      max: 15,
                      icon: <FingerprintOutlined />,
                    },
                    {
                      name: 'Auto-Lock',
                      score: privacySettings.autoLock ? 10 : 0,
                      max: 10,
                      icon: <LockOutlined />,
                    },
                    {
                      name: 'Account Security',
                      score: 10,
                      max: 10,
                      icon: <VerifiedUserOutlined />,
                    },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: 1,
                        background: theme =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.02)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {item.icon}
                        <Typography variant="body2">{item.name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 'bold',
                            color:
                              item.score === item.max
                                ? 'success.main'
                                : item.score > 0
                                ? 'warning.main'
                                : 'error.main',
                          }}
                        >
                          {item.score}/{item.max}
                        </Typography>
                        {item.score === item.max ? (
                          <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                        ) : item.score > 0 ? (
                          <Warning sx={{ color: 'warning.main', fontSize: 16 }} />
                        ) : (
                          <Error sx={{ color: 'error.main', fontSize: 16 }} />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ p: 3, height: '100%', border: '1px solid #d32f2f', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  Security Recommendations
                </Typography>
                {getSecurityRecommendations().length > 0 ? (
                  <Stack spacing={2}>
                    {getSecurityRecommendations().map((recommendation, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                          p: 2,
                          borderRadius: 1,
                          background: theme =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.02)',
                          border: '1px solid',
                          borderColor:
                            recommendation.priority === 'high' ? 'error.main' : 'warning.main',
                        }}
                      >
                        {recommendation.priority === 'high' ? (
                          <Error sx={{ color: 'error.main', fontSize: 20, mt: 0.5 }} />
                        ) : (
                          <Warning sx={{ color: 'warning.main', fontSize: 20, mt: 0.5 }} />
                        )}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {recommendation.priority === 'high'
                              ? 'High Priority'
                              : 'Medium Priority'}
                          </Typography>
                          <Typography variant="body2">{recommendation.text}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      🎉 Excellent! Your security settings are well configured. Keep up the great
                      work!
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #d32f2f' }}>
          <Button onClick={() => setShowSecurityAudit(false)} variant="outlined">
            Close
          </Button>
          <Button
            variant="contained"
            disabled={isRecordingAudit}
            onClick={async () => {
              try {
                setIsRecordingAudit(true);
                await securityService.recordSecurityAudit();
                await loadSecurityData();
                setShowSecurityAudit(false);
                console.log('Security audit recorded successfully');
              } catch (error) {
                console.error('Failed to record security audit:', error);
              } finally {
                setIsRecordingAudit(false);
              }
            }}
            sx={{
              backgroundColor: '#d32f2f',
              '&:hover': { backgroundColor: '#b71c1c' },
            }}
          >
            {isRecordingAudit ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Recording...
              </>
            ) : (
              'Record New Audit'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountDialog
        open={showDeleteAccountDialog}
        onClose={() => setShowDeleteAccountDialog(false)}
        onSubmit={handleDeleteAccount}
        isLoading={false}
        error={null}
      />

      {/* Download Data Dialog */}
      <DownloadDataDialog
        open={showDownloadDataDialog}
        onClose={() => setShowDownloadDataDialog(false)}
        onSubmit={handleDataExport}
        isLoading={isExportingData}
        error={null}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
        onSubmit={handlePasswordChange}
        isLoading={isChangingPassword}
        error={passwordError}
      />

      <AccountInformationDialog
        open={showAccountInfoDialog}
        onClose={() => setShowAccountInfoDialog(false)}
        userData={userData}
        userProfile={userProfile}
        dashboardStats={dashboardStats}
        securitySettings={securitySettings}
        subscription={subscription}
        privacySettings={privacySettings}
        isLoadingUserData={isLoadingUserData}
        userDataError={userDataError}
        onRefresh={loadUserData}
        formatDateWithPreference={formatDateWithPreference}
        calculateDaysSinceCreation={calculateDaysSinceCreation}
      />

      {/* Enhanced AI Features Status Dialog */}
      <Dialog
        open={showAIFeaturesTestDialog}
        onClose={() => setShowAIFeaturesTestDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            border: '2px solid #d32f2f',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
            borderBottom: '2px solid #d32f2f',
            pb: 2,
            background: theme =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(211, 47, 47, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(211, 47, 47, 0.02) 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PsychologyOutlined sx={{ color: '#d32f2f', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                AI Features Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current AI configuration and feature availability
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Alert
              severity="info"
              sx={{
                '& .MuiAlert-icon': { color: 'info.main' },
                '& .MuiAlert-message': { color: 'info.main' },
              }}
            >
              View the current status and configuration of your AI features.
            </Alert>

            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                Feature Status
              </Typography>
              <Stack spacing={2}>
                {[
                  { key: 'autoComplete', label: 'Auto Complete', enabled: autoComplete },
                  { key: 'codeSnippets', label: 'Code Snippets', enabled: codeSnippets },
                  { key: 'aiSuggestions', label: 'AI Suggestions', enabled: aiSuggestions },
                  {
                    key: 'realTimeAnalysis',
                    label: 'Real-time Analysis',
                    enabled: realTimeAnalysis,
                  },
                ].map(({ key, label, enabled }) => (
                  <Box
                    key={key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      opacity: enabled ? 1 : 0.6,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      {enabled ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                      <Box>
                        <Typography variant="subtitle1">{label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {enabled ? 'Feature enabled and ready' : 'Feature disabled'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={enabled ? 'Enabled' : 'Disabled'}
                      size="small"
                      color={enabled ? 'success' : 'default'}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                Current AI Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Token Context Limit
                  </Typography>
                  <Typography variant="body1">{tokenContextLimit.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Temperature
                  </Typography>
                  <Typography variant="body1">{temperature}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Context Length
                  </Typography>
                  <Typography variant="body1">{contextLength}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Model
                  </Typography>
                  <Typography variant="body1">{subscription.model}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                Performance Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Response Time
                  </Typography>
                  <Typography variant="body1">~2-5 seconds</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Token Usage
                  </Typography>
                  <Typography variant="body1">Varies by request</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Model Version
                  </Typography>
                  <Typography variant="body1">
                    {subscription.model === 'gpt-5-nano'
                      ? 'GPT-5 Nano'
                      : subscription.model === 'gpt-4.1-mini'
                      ? 'GPT-4.1 Mini'
                      : subscription.model === 'gpt-4-turbo'
                      ? 'GPT-4 Turbo'
                      : subscription.model === 'gpt-5'
                      ? 'GPT-5'
                      : subscription.model}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    API Status
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    Connected
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAIFeaturesTestDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedChangesDialog} onClose={cancelNavigation} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Unsaved Changes
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You have unsaved changes to your settings. What would you like to do?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              If you leave without saving, your changes will be lost.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelNavigation}>Cancel</Button>
          <Button onClick={confirmNavigationWithoutSaving} color="warning">
            Leave Without Saving
          </Button>
          <Button onClick={saveAndNavigate} variant="contained" color="primary">
            Save & Continue
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        /* Enhanced Slider Animations */
        .MuiSlider-thumb {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: grab;
          touch-action: none;
        }
        .MuiSlider-thumb:hover {
          transform: scale(1.3);
          box-shadow: 0 0 0 8px rgba(25, 118, 210, 0.16);
        }
        .MuiSlider-thumb:active {
          transform: scale(1.1);
          transition: all 0.1s ease;
          cursor: grabbing;
        }
        .MuiSlider-thumb:focus {
          outline: none;
          box-shadow: 0 0 0 8px rgba(25, 118, 210, 0.16);
        }
        
        /* Enhanced Switch Animations */
        .MuiSwitch-switchBase {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .MuiSwitch-switchBase.Mui-checked {
          transform: translateX(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track {
          background: linear-gradient(
            45deg,
            ${theme.palette.primary.main},
            ${theme.palette.primary.light}
          ) !important;
          opacity: 1;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .MuiSwitch-track {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Enhanced Slider Track and Rail Animations */
        .MuiSlider-track {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .MuiSlider-rail {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .MuiSlider-root {
          cursor: pointer;
          touch-action: pan-x;
          user-select: none;
        }
        .MuiSlider-valueLabel {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }
        .MuiSlider-mark {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .MuiSlider-markLabel {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Smooth hover effects for interactive elements */
        .MuiFormControlLabel-root {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none; /* Disable clicks on the label area */
        }
        .MuiFormControlLabel-root:hover {
          transform: translateX(4px);
        }
        /* Make only the switch clickable */
        .MuiFormControlLabel-root .MuiSwitch-root {
          pointer-events: auto; /* Re-enable clicks on the switch */
        }
        /* Ensure the switch thumb and track are clickable */
        .MuiFormControlLabel-root .MuiSwitch-switchBase,
        .MuiFormControlLabel-root .MuiSwitch-track {
          pointer-events: auto;
        }
        
        /* Smooth transitions for all form controls */
        .MuiSlider-root,
        .MuiSwitch-root,
        .MuiFormControl-root,
        .MuiTextField-root {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Enhanced value label animations */
        .MuiSlider-valueLabel {
          animation: fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Smooth mark animations */
        .MuiSlider-mark {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .MuiSlider-mark:hover {
          transform: scale(1.2);
          opacity: 0.8;
        }
        
        /* Keyframe animations */
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        /* Smooth focus states */
        .MuiSlider-root:focus-within .MuiSlider-thumb {
          box-shadow: 0 0 0 8px rgba(25, 118, 210, 0.16);
          transform: scale(1.1);
        }
        
        /* Enhanced switch focus states */
        .MuiSwitch-root:focus-within .MuiSwitch-switchBase {
          box-shadow: 0 0 0 8px rgba(25, 118, 210, 0.16);
        }
        
        /* Compact mode styles - exclude sidebar */
        .compact-mode .MuiPaper-root:not(.MuiDrawer-paper) {
          padding: 16px !important;
          margin-bottom: 16px !important;
        }
        .compact-mode .MuiTypography-h5:not(.MuiDrawer-root .MuiTypography-h5) {
          font-size: 1.1rem !important;
        }
        .compact-mode .MuiFormControlLabel-root:not(.MuiDrawer-root .MuiFormControlLabel-root) {
          margin-bottom: 8px !important;
        }
        
        /* Animation disable styles */
        [style*="--disable-animations: none"] * {
          transition: none !important;
          animation: none !important;
        }
        
        /* Font size styles - apply to main content areas only */
        .MuiTypography-root:not(.MuiDrawer-root .MuiTypography-root):not(.MuiAppBar-root .MuiTypography-root),
        .MuiButton-root:not(.MuiDrawer-root .MuiButton-root):not(.MuiAppBar-root .MuiButton-root),
        .MuiTextField-root:not(.MuiDrawer-root .MuiTextField-root):not(.MuiAppBar-root .MuiTextField-root),
        .MuiFormControl-root:not(.MuiDrawer-root .MuiFormControl-root):not(.MuiAppBar-root .MuiFormControl-root) {
          font-size: var(--app-font-size, 20px);
        }
        
        /* Ensure sidebar and navigation maintain original font sizes */
        .MuiDrawer-root, .MuiDrawer-paper, .MuiAppBar-root, .MuiToolbar-root, 
        [class*="sidebar"], [class*="drawer"], [class*="navigation"], [class*="navbar"] {
          font-size: inherit !important;
        }
        
        /* Restore original sidebar font sizes */
        .MuiDrawer-root .MuiTypography-h6 {
          font-size: 1.7rem !important;
        }
        
        .MuiDrawer-root .MuiListItemText-primary {
          font-size: 1.1rem !important;
        }
        
        .MuiDrawer-root .MuiTypography-body2 {
          font-size: 0.9rem !important;
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
        
        /* Unsaved changes indicator animation - only in dark mode */
        .unsaved-changes-pulse {
          animation: none;
        }
        
        /* Apply pulsing animation only in dark mode */
        [data-mui-color-scheme="dark"] .unsaved-changes-pulse,
        body[class*="dark"] .unsaved-changes-pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 152, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
          }
        }
      `}</style>

      {/* Auto-Lock Warning Popup */}
      <AutoLockWarningDialog
        open={showAutoLockWarning}
        countdown={warningCountdown}
        onClose={() => {
          setShowAutoLockWarning(false);

          // Clean up any running countdown intervals
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          if (warningCountdownIntervalRef.current) {
            clearInterval(warningCountdownIntervalRef.current);
            warningCountdownIntervalRef.current = null;
          }
          if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
            warningTimeoutRef.current = null;
          }

          console.log('Warning popup closed - cleaned up timers and reset flags');
        }}
      />
    </Box>
  );
};

export default Settings;
