import {
  CheckCircle,
  CheckCircleOutlined,
  Error,
  LockOutlined,
  SecurityOutlined,
  ShieldOutlined,
  VerifiedUserOutlined,
  VpnKeyOutlined,
  Warning,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

interface SecuritySettings {
  passwordStrength: string;
  lastPasswordChange: string | null;
  lastSecurityAudit: string | null;
  securityScore: number;
}

interface PrivacySettings {
  autoLock: boolean;
  dataCollection: boolean;
  shareAnalytics: boolean;
  allowTracking: boolean;
}

interface SecurityRecommendation {
  text: string;
  priority: string;
  color: string;
}

interface SecurityAuditDialogProps {
  open: boolean;
  onClose: () => void;
  securitySettings: SecuritySettings;
  privacySettings: PrivacySettings;
  calculateSecurityScore: () => number;
  getSecurityRecommendations: () => SecurityRecommendation[];
  isRecordingAudit: boolean;
  onRecordAudit: () => Promise<void>;
}

const SecurityAuditDialog: React.FC<SecurityAuditDialogProps> = ({
  open,
  onClose,
  securitySettings,
  privacySettings,
  calculateSecurityScore,
  getSecurityRecommendations,
  isRecordingAudit,
  onRecordAudit,
}) => {
  const theme = useTheme();
  const securityScore = calculateSecurityScore();
  const recommendations = getSecurityRecommendations();

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
      <DialogContent
        sx={{
          p: 3,
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
        }}
      >
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
                {securityScore}/60
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Overall Security Score
              </Typography>
              <Chip
                label={
                  securityScore >= 48
                    ? 'Excellent'
                    : securityScore >= 30
                    ? 'Good'
                    : 'Needs Improvement'
                }
                color={securityScore >= 48 ? 'success' : securityScore >= 30 ? 'warning' : 'error'}
                sx={{ mt: 1 }}
              />
            </Box>
            <Box sx={{ textAlign: 'center', position: 'relative', display: 'inline-block' }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0'}
                  strokeWidth="7"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#d32f2f"
                  strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 42 * (securityScore / 60)} ${2 * Math.PI * 42}`}
                  strokeLinecap="round"
                />
              </svg>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: '#d32f2f',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {Math.round((securityScore / 60) * 100)}%
              </Typography>
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
              {recommendations.length > 0 ? (
                <Stack spacing={2}>
                  {recommendations.map((recommendation, index) => (
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
                          {recommendation.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                        </Typography>
                        <Typography variant="body2">{recommendation.text}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 4,
                    textAlign: 'center',
                  }}
                >
                  <CheckCircleOutlined sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" color="success.main" gutterBottom>
                    No Security Recommendations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your security settings are well configured. Keep up the great work!
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions
        sx={{
          p: 3,
          borderTop: '1px solid #d32f2f',
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
        }}
      >
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          variant="contained"
          disabled={isRecordingAudit}
          onClick={onRecordAudit}
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
  );
};

export default SecurityAuditDialog;
