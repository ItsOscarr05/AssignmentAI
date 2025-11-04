import {
  BuildOutlined,
  CheckCircle,
  Close,
  Error,
  FeaturedPlayListOutlined,
  PsychologyOutlined,
  SpeedOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';

interface Subscription {
  model: string;
}

interface AIFeaturesStatusModalProps {
  open: boolean;
  onClose: () => void;
  autoComplete: boolean;
  codeSnippets: boolean;
  aiSuggestions: boolean;
  realTimeAnalysis: boolean;
  tokenContextLimit: number;
  temperature: string;
  contextLength: number;
  subscription: Subscription;
}

const AIFeaturesStatusModal: React.FC<AIFeaturesStatusModalProps> = ({
  open,
  onClose,
  autoComplete,
  codeSnippets,
  aiSuggestions,
  realTimeAnalysis,
  tokenContextLimit,
  temperature,
  contextLength,
  subscription,
}) => {
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
          border: '2px solid #D32F2F',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
          borderBottom: '3px solid #D32F2F',
          pb: 2.5,
          pt: 3,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(211, 47, 47, 0.15) 0%, rgba(211, 47, 47, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(211, 47, 47, 0.08) 0%, rgba(211, 47, 47, 0.03) 100%)',
          boxShadow: '0 2px 8px rgba(211, 47, 47, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(211, 47, 47, 0.15)',
              boxShadow: '0 2px 8px rgba(211, 47, 47, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                backgroundColor: 'rgba(211, 47, 47, 0.2)',
              },
            }}
          >
            <PsychologyOutlined sx={{ color: '#D32F2F', fontSize: 30 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#D32F2F',
                fontSize: '1.25rem',
                mb: 0.5,
                letterSpacing: '-0.02em',
              }}
            >
              AI Features Status
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.8rem', fontWeight: 500, display: 'block' }}
            >
              Current AI configuration and feature availability
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
            width: 36,
            height: 36,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(211, 47, 47, 0.1)',
              transform: 'rotate(90deg)',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': { color: 'info.main' },
            }}
          >
            <Typography variant="body2">
              View the current status and configuration of your AI features.
            </Typography>
          </Alert>

          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#D32F2F',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.85rem',
                }}
              >
                Feature Status
              </Typography>
              <FeaturedPlayListOutlined
                sx={{
                  color: '#D32F2F',
                  fontSize: '1.2rem',
                  mt: -0.5,
                }}
              />
            </Box>
            <Grid container spacing={2}>
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
                <Grid item xs={12} sm={6} key={key}>
                  <Paper
                    elevation={enabled ? 2 : 1}
                    sx={{
                      p: 2,
                      border: enabled ? '2px solid' : '1px solid',
                      borderColor: enabled ? 'success.main' : 'divider',
                      borderRadius: 2,
                      backgroundColor: theme =>
                        enabled
                          ? theme.palette.mode === 'dark'
                            ? 'rgba(76, 175, 80, 0.08)'
                            : 'rgba(76, 175, 80, 0.04)'
                          : theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.02)'
                          : '#fafafa',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: enabled ? 4 : 2,
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: enabled
                              ? 'rgba(76, 175, 80, 0.1)'
                              : 'rgba(158, 158, 158, 0.1)',
                          }}
                        >
                          {enabled ? (
                            <CheckCircle sx={{ color: 'success.main', fontSize: '1.5rem' }} />
                          ) : (
                            <Error sx={{ color: 'text.disabled', fontSize: '1.5rem' }} />
                          )}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {label}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.7rem' }}
                          >
                            {enabled ? 'Feature enabled and ready' : 'Feature disabled'}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={enabled ? 'Enabled' : 'Disabled'}
                        size="small"
                        color={enabled ? 'success' : 'default'}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#D32F2F',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.85rem',
                }}
              >
                Current AI Settings
              </Typography>
              <BuildOutlined
                sx={{
                  color: '#D32F2F',
                  fontSize: '1.2rem',
                  mt: -0.5,
                }}
              />
            </Box>
            <Grid container spacing={2}>
              {[
                { label: 'Token Context Limit', value: tokenContextLimit.toLocaleString() },
                { label: 'Temperature', value: temperature },
                { label: 'Context Length', value: contextLength },
                { label: 'Model', value: subscription.model },
              ].map(({ label, value }) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: theme =>
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#fafafa',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: '#D32F2F',
                        borderWidth: '2px',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: 'text.secondary',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                      {value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#D32F2F',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.85rem',
                }}
              >
                Performance Information
              </Typography>
              <SpeedOutlined
                sx={{
                  color: '#D32F2F',
                  fontSize: '1.2rem',
                  mt: -0.5,
                }}
              />
            </Box>
            <Grid container spacing={2}>
              {[
                { label: 'Response Time', value: '~2-5 seconds' },
                { label: 'Token Usage', value: 'Varies by request' },
                {
                  label: 'Model Version',
                  value:
                    subscription.model === 'gpt-5-nano'
                      ? 'GPT-5 Nano'
                      : subscription.model === 'gpt-5-mini'
                      ? 'GPT-5 Mini'
                      : subscription.model === 'gpt-5'
                      ? 'GPT-5'
                      : subscription.model,
                },
                { label: 'API Status', value: 'Connected', isSuccess: true },
              ].map(({ label, value, isSuccess }) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: theme =>
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#fafafa',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: '#D32F2F',
                        borderWidth: '2px',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: 'text.secondary',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: isSuccess ? 'success.main' : 'inherit',
                      }}
                    >
                      {value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default AIFeaturesStatusModal;
