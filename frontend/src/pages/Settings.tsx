import {
  Brush,
  Fingerprint,
  Help,
  Language,
  Lock,
  Notifications,
  Psychology,
  Save,
  Schedule,
  Security,
  Tune,
  VolumeUp,
  Widgets,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
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

const Settings: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // General Settings
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [fontSize, setFontSize] = useState(14);
  const [animations, setAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [volume, setVolume] = useState(70);
  const [quietHoursStart, setQuietHoursStart] = useState(22); // 10 PM default
  const [quietHoursEnd, setQuietHoursEnd] = useState(7); // 7 AM default

  // AI Settings
  const [aiModel, setAiModel] = useState('gpt-4');
  const [maxTokens, setMaxTokens] = useState('4000');
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

  // Privacy & Security
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [dataCollection, setDataCollection] = useState(true);
  const [shareAnalytics, setShareAnalytics] = useState(true);
  const [biometricLogin, setBiometricLogin] = useState(false);

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
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
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
          borderColor: theme.palette.primary.main,
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
        <Button
          variant="contained"
          startIcon={
            <Box
              component="span"
              sx={{
                display: 'flex',
                alignItems: 'center',
                '& > svg': {
                  color: '#ffffff',
                },
              }}
            >
              <Save />
            </Box>
          }
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
              icon={<Security />}
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
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title="Language & Region"
              icon={<Language sx={{ color: theme.palette.primary.main }} />}
            >
              <FormControl fullWidth>
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
            </SettingsSection>

            <SettingsSection
              title="Sound & Feedback"
              icon={<VolumeUp sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                  </FormGroup>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Volume</Typography>
                  <Slider
                    value={volume}
                    onChange={(_e, value) => setVolume(value as number)}
                    disabled={!soundEffects}
                    valueLabelDisplay="auto"
                  />
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
                      value={aiModel}
                      label="AI Model"
                      onChange={e => setAiModel(e.target.value)}
                    >
                      <MenuItem value="gpt-4">GPT-4 (Recommended)</MenuItem>
                      <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</MenuItem>
                      <MenuItem value="claude-3">Claude 3 (Experimental)</MenuItem>
                      <MenuItem value="custom">Custom Model</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Tokens"
                    type="number"
                    value={maxTokens}
                    onChange={e => setMaxTokens(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Maximum number of tokens the AI can generate">
                          <InputAdornment position="end">
                            <IconButton edge="end" size="small">
                              <Help />
                            </IconButton>
                          </InputAdornment>
                        </Tooltip>
                      ),
                    }}
                  />
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
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Context Length</Typography>
                  <Slider
                    value={contextLength}
                    onChange={(_e, value) => setContextLength(value as number)}
                    min={1}
                    max={20}
                    marks
                    valueLabelDisplay="auto"
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
              icon={<Notifications sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                      label="Email Notifications"
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
                      label="Desktop Notifications"
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
                      label="Sound Notifications"
                    />
                  </FormGroup>
                </Grid>
                <Grid item xs={12} md={6}>
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
                      label="Assignment Updates"
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
                      label="Deadline Reminders"
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
                      label="Feedback Notifications"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title="Notification Schedule"
              icon={<Schedule sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Quiet Hours Start</InputLabel>
                    <Select
                      value={quietHoursStart}
                      label="Quiet Hours Start"
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
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Quiet Hours End</InputLabel>
                    <Select
                      value={quietHoursEnd}
                      label="Quiet Hours End"
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
            </SettingsSection>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <SettingsSection
              title="Security Settings"
              icon={<Security sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={twoFactorAuth}
                          onChange={e => setTwoFactorAuth(e.target.checked)}
                        />
                      }
                      label="Two-Factor Authentication"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={biometricLogin}
                          onChange={e => setBiometricLogin(e.target.checked)}
                        />
                      }
                      label="Biometric Login"
                    />
                  </FormGroup>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Lock />}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Fingerprint />}
                    fullWidth
                    disabled={!biometricLogin}
                  >
                    Setup Biometric Login
                  </Button>
                </Grid>
              </Grid>
            </SettingsSection>

            <SettingsSection
              title="Privacy"
              icon={<Lock sx={{ color: theme.palette.primary.main }} />}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={dataCollection}
                          onChange={e => setDataCollection(e.target.checked)}
                        />
                      }
                      label="Allow Data Collection"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shareAnalytics}
                          onChange={e => setShareAnalytics(e.target.checked)}
                        />
                      }
                      label="Share Analytics"
                    />
                  </FormGroup>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button variant="outlined" color="error" fullWidth sx={{ mb: 2 }}>
                    Delete Account
                  </Button>
                  <Button variant="outlined" color="primary" fullWidth>
                    Download My Data
                  </Button>
                </Grid>
              </Grid>
            </SettingsSection>
          </TabPanel>
        </Box>
      </Box>

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
      `}</style>
    </Box>
  );
};

export default Settings;
