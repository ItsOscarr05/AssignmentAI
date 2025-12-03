import {
  AutoAwesomeOutlined,
  BarChart,
  Close,
  PsychologyOutlined,
  RocketLaunchOutlined,
  SmartToyOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type SubscriptionPlan = 'free' | 'plus' | 'pro' | 'max';

interface SubscriptionConfig {
  model: string;
  tokenLimit: number;
  label: string;
}

interface Subscription {
  plan: SubscriptionPlan;
}

interface ModelComparisonModalProps {
  open: boolean;
  onClose: () => void;
  subscriptionConfig: Record<SubscriptionPlan, SubscriptionConfig>;
  subscription: Subscription;
}

const ModelComparisonModal: React.FC<ModelComparisonModalProps> = ({
  open,
  onClose,
  subscriptionConfig,
  subscription,
}) => {
  const [selectedModelPlan, setSelectedModelPlan] = useState<SubscriptionPlan | null>(null);
  const navigate = useNavigate();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
          border: '2px solid #D32F2F',
        },
      }}
    >
      <DialogContent sx={{ p: 2, '&.MuiDialogContent-root': { paddingTop: 2 } }}>
        <DialogTitle
          sx={{
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
            pb: 1,
            pt: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart sx={{ fontSize: '1.2rem', color: '#D32F2F' }} />
            <Typography variant="h6" component="span">
              AI Model Comparison
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
              '&:hover': {
                backgroundColor: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <Grid container spacing={1.5}>
          {Object.entries(subscriptionConfig).map(([plan, config]) => (
            <Grid item xs={12} md={6} key={plan}>
              <Paper
                elevation={selectedModelPlan === plan ? 6 : 2}
                onClick={() => setSelectedModelPlan(plan as SubscriptionPlan)}
                sx={{
                  p: 2,
                  pt: 3,
                  height: '100%',
                  border: selectedModelPlan === plan ? '3px solid' : '2px solid',
                  borderColor:
                    plan === 'free'
                      ? '#2196f3'
                      : plan === 'plus'
                      ? '#4caf50'
                      : plan === 'pro'
                      ? '#9c27b0'
                      : '#ff9800',
                  borderRadius: 3,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark'
                      ? selectedModelPlan === plan
                        ? 'rgba(33, 150, 243, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)'
                      : selectedModelPlan === plan
                      ? 'rgba(33, 150, 243, 0.04)'
                      : '#fafafa',
                  backgroundImage:
                    selectedModelPlan === plan
                      ? `linear-gradient(135deg, ${
                          plan === 'free'
                            ? 'rgba(33, 150, 243, 0.05)'
                            : plan === 'plus'
                            ? 'rgba(76, 175, 80, 0.05)'
                            : plan === 'pro'
                            ? 'rgba(156, 39, 176, 0.05)'
                            : 'rgba(255, 152, 0, 0.05)'
                        } 0%, transparent 100%)`
                      : 'none',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: 6,
                    borderWidth: '3px',
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
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
                      right: 8,
                      fontSize: '0.65rem',
                      height: 22,
                      px: 0.5,
                      backgroundColor:
                        plan === 'free'
                          ? '#2196f3'
                          : plan === 'plus'
                          ? '#4caf50'
                          : plan === 'pro'
                          ? '#9c27b0'
                          : '#ff9800',
                      color: '#fff',
                      fontWeight: 600,
                      boxShadow: 2,
                    }}
                  />
                )}

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor:
                        plan === 'free'
                          ? 'rgba(33, 150, 243, 0.1)'
                          : plan === 'plus'
                          ? 'rgba(76, 175, 80, 0.1)'
                          : plan === 'pro'
                          ? 'rgba(156, 39, 176, 0.1)'
                          : 'rgba(255, 152, 0, 0.1)',
                    }}
                  >
                    {plan === 'free' && (
                      <SmartToyOutlined
                        sx={{
                          fontSize: '1.4rem',
                          color: '#2196f3',
                        }}
                      />
                    )}
                    {plan === 'plus' && (
                      <PsychologyOutlined
                        sx={{
                          fontSize: '1.4rem',
                          color: '#4caf50',
                        }}
                      />
                    )}
                    {plan === 'pro' && (
                      <AutoAwesomeOutlined
                        sx={{
                          fontSize: '1.4rem',
                          color: '#9c27b0',
                        }}
                      />
                    )}
                    {plan === 'max' && (
                      <RocketLaunchOutlined
                        sx={{
                          fontSize: '1.4rem',
                          color: '#ff9800',
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color:
                          plan === 'free'
                            ? '#2196f3'
                            : plan === 'plus'
                            ? '#4caf50'
                            : plan === 'pro'
                            ? '#9c27b0'
                            : '#ff9800',
                        fontWeight: 700,
                        fontSize: '1rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {config.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem', mt: 0.25, display: 'block' }}
                    >
                      {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
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
                    Performance
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}
                  >
                    {plan === 'free' && 'Good for basic tasks and learning'}
                    {plan === 'plus' && 'Balanced performance for most use cases'}
                    {plan === 'pro' && 'High performance for complex assignments'}
                    {plan === 'max' && 'Maximum performance for advanced analysis'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: 'text.secondary',
                        display: 'block',
                        mb: 0.25,
                      }}
                    >
                      Pricing
                    </Typography>
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
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {plan === 'free' && 'Free'}
                      {plan === 'plus' && '$4.99'}
                      {plan === 'pro' && '$9.99'}
                      {plan === 'max' && '$14.99'}
                      {plan !== 'free' && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ fontSize: '0.7rem', fontWeight: 400, ml: 0.5 }}
                        >
                          /mo
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      {selectedModelPlan && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            disabled={selectedModelPlan === subscription.plan}
            onClick={() => {
              if (selectedModelPlan !== subscription.plan) {
                onClose();
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
                color: '#fff',
              },
            }}
          >
            {selectedModelPlan === subscription.plan
              ? 'Current Plan'
              : `Upgrade to ${subscriptionConfig[selectedModelPlan].label}`}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ModelComparisonModal;
