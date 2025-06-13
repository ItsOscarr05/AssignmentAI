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
import React, { useState } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
  const [tabValue, setTabValue] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setShowModelComparison] = useState(false);
  const [showNotificationPreview, setShowNotificationPreview] = useState(false);
  const [] = useState(false);

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
  const [] = useState('gpt-4');
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
    model: 'gpt-4-0125-preview',
    tokenLimit: 30000,
  });

  // Map subscription plans to their respective models and token limits
  const subscriptionConfig: Record<SubscriptionPlan, SubscriptionConfig> = {
    free: {
      model: 'gpt-4-0125-preview',
      tokenLimit: 30000,
      label: 'GPT-4.1 Nano',
    },
    plus: {
      model: 'gpt-3.5-turbo-0125',
      tokenLimit: 50000,
      label: 'GPT-3.5 Turbo',
    },
    pro: {
      model: 'gpt-4-turbo-preview',
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

  const handleSave = () => {
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
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
          Settings saved successfully!
        </Alert>
      )}

      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          pt: 2,
          pb: 2,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(18,18,18,0.95) 0%, rgba(18,18,18,0.95) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%)',
          backdropFilter: 'blur(10px)',
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
            maxWidth: 400,
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
            ml: 'auto',
            px: 4,
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
          Save Changes
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
              '& .MuiTabs-flexContainer': {
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
              },
            }}
          >
            <Tab
              icon={<Tune />}
              label="General"
              sx={{
                gap: 1,
              }}
            />
            <Tab
              icon={<Psychology />}
              label="AI & Learning"
              sx={{
                gap: 1,
              }}
            />
            <Tab
              icon={<Notifications />}
              label="Notifications"
              sx={{
                gap: 1,
              }}
            />
            <Tab
              icon={<SecurityOutlined />}
              label="Privacy & Security"
              sx={{
                gap: 1,
              }}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 4 }}>
          <TabPanel value={tabValue} index={0}>
            <SettingsSection
              title="Appearance"
              icon={<Brush sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
                      }
                      label="Dark Mode"
                    />
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
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Font Size</Typography>
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
              title="Language & Region"
              icon={<Language sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={language}
                      label="Language"
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
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Time Zone</InputLabel>
                    <Select
                      value={timeZone}
                      label="Time Zone"
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
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={dateFormat}
                      label="Date Format"
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
                    Translation Preferences
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoTranslate}
                          onChange={e => setAutoTranslate(e.target.checked)}
                        />
                      }
                      label="Auto-translate content"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showOriginalText}
                          onChange={e => setShowOriginalText(e.target.checked)}
                        />
                      }
                      label="Show original text alongside translation"
                    />
                  </FormGroup>

                  <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                    Regional Settings
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useMetricSystem}
                          onChange={e => setUseMetricSystem(e.target.checked)}
                        />
                      }
                      label="Use metric system"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={use24HourFormat}
                          onChange={e => setUse24HourFormat(e.target.checked)}
                        />
                      }
                      label="Use 24-hour time format"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title="Sound & Feedback"
              icon={<VolumeUp sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Sound Settings
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={soundEffects}
                          onChange={e => setSoundEffects(e.target.checked)}
                        />
                      }
                      label="Sound Effects"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={hapticFeedback}
                          onChange={e => setHapticFeedback(e.target.checked)}
                        />
                      }
                      label="Haptic Feedback"
                    />
                  </FormGroup>

                  <Typography gutterBottom sx={{ mt: 3 }}>
                    Volume
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
                    Notification Sounds
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSounds}
                          onChange={e => setNotificationSounds(e.target.checked)}
                        />
                      }
                      label="Enable Notification Sounds"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={typingSounds}
                          onChange={e => setTypingSounds(e.target.checked)}
                        />
                      }
                      label="Typing Sounds"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={completionSounds}
                          onChange={e => setCompletionSounds(e.target.checked)}
                        />
                      }
                      label="Task Completion Sounds"
                    />
                  </FormGroup>

                  <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                    Quiet Hours
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Start Time</InputLabel>
                        <Select
                          value={quietHoursStart}
                          label="Start Time"
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
                        <InputLabel>End Time</InputLabel>
                        <Select
                          value={quietHoursEnd}
                          label="End Time"
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

          <TabPanel value={tabValue} index={1}>
            <SettingsSection
              title="AI Model Configuration"
              icon={<Psychology sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>AI Model</InputLabel>
                    <Select
                      value={subscription.model}
                      label="AI Model"
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
                      onClick={() => setShowModelComparison(true)}
                      size="small"
                    >
                      Compare Models
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Token Limit (Max: {subscription.tokenLimit.toLocaleString()})
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
                  <Typography gutterBottom>Temperature (Creativity)</Typography>
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
                  <Typography gutterBottom>Context Length</Typography>
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
              title="AI Features"
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
                      label="AI Auto-Complete"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={codeSnippets}
                          onChange={e => setCodeSnippets(e.target.checked)}
                        />
                      }
                      label="Code Snippets Generation"
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
                      label="AI Suggestions"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={realTimeAnalysis}
                          onChange={e => setRealTimeAnalysis(e.target.checked)}
                        />
                      }
                      label="Real-Time Analysis"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <SettingsSection
              title="Notification Preferences"
              icon={<NotificationsOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Notification Channels
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
                          <Typography>Email Notifications</Typography>
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
                          <Typography>Desktop Notifications</Typography>
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
                          <Typography>Sound Notifications</Typography>
                        </Box>
                      }
                    />
                  </FormGroup>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Notification Types
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
                          <Typography>Assignment Updates</Typography>
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
                          <Typography>Deadline Reminders</Typography>
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
                          <Typography>Feedback Notifications</Typography>
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
                          <Typography>System Updates</Typography>
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
                    Display Preferences
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
                      label="Show notification preview"
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
                      label="Show notification badge"
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
                      label="Group similar notifications"
                    />
                  </FormGroup>

                  <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                    Priority Level
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
                      <MenuItem value="low">Low Priority</MenuItem>
                      <MenuItem value="medium">Medium Priority</MenuItem>
                      <MenuItem value="high">High Priority</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Work Hours
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Start Time</InputLabel>
                        <Select
                          value={notificationSchedule.workHoursStart}
                          label="Start Time"
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
                        <InputLabel>End Time</InputLabel>
                        <Select
                          value={notificationSchedule.workHoursEnd}
                          label="End Time"
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
                    Work Days
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
                    Quiet Hours
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Start Time</InputLabel>
                        <Select
                          value={notificationSchedule.quietHoursStart}
                          label="Start Time"
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
                        <InputLabel>End Time</InputLabel>
                        <Select
                          value={notificationSchedule.quietHoursEnd}
                          label="End Time"
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
                      Preview Notifications
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <SettingsSection
              title="Security Score"
              icon={<SecurityOutlined sx={{ color: theme.palette.primary.main }} />}
            >
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ mr: 2 }}>
                    Security Score
                  </Typography>
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
                  Last security audit: {securitySettings.lastSecurityAudit}
                </Typography>
              </Box>

              <List>
                {securityChecklist.map(item => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemIcon>{item.icon}</ListItemIcon>
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
                          },
                        }}
                      />
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
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Data & Privacy
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DataUsageOutlined fontSize="small" />
                          <Typography>Allow Data Collection</Typography>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AnalyticsOutlined fontSize="small" />
                          <Typography>Share Analytics</Typography>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VisibilityOutlined fontSize="small" />
                          <Typography>Show Online Status</Typography>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VisibilityOffOutlined fontSize="small" />
                          <Typography>Allow Activity Tracking</Typography>
                        </Box>
                      }
                    />
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ShieldOutlined fontSize="small" />
                          <Typography>Two-Factor Authentication</Typography>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FingerprintOutlined fontSize="small" />
                          <Typography>Biometric Login</Typography>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LockOutlined fontSize="small" />
                          <Typography>Auto-Lock Account</Typography>
                        </Box>
                      }
                    />
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
                    Account Management
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<DownloadOutlined />}
                      fullWidth
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
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'error.dark',
                        },
                      }}
                    >
                      Delete Account
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Security Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <VpnKeyOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary="Password Strength"
                        secondary={securitySettings.passwordStrength}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <HistoryOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary="Last Password Change"
                        secondary={securitySettings.lastPasswordChange}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <VerifiedUserOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary="Active Sessions"
                        secondary={`${securitySettings.activeSessions} devices`}
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
      `}</style>
    </Box>
  );
};

export default Settings;
