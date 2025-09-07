import { CheckCircle, Close as CloseIcon, CompareArrows, HelpOutline } from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import React from 'react';

interface Feature {
  name: string;
  free: boolean;
  plus: boolean;
  pro: boolean;
  max: boolean;
  description?: string;
}

interface Plan {
  name: string;
  price: number;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  popular?: boolean;
  priceId: string;
  bestFor: string;
  tokenBoost?: number;
  isCurrentPlan?: boolean;
  status?: 'current' | 'available';
}

interface DetailedFeatureComparisonProps {
  open: boolean;
  onClose: () => void;
  features: Feature[];
  plansWithCurrentPlan: Plan[];
}

const DetailedFeatureComparison: React.FC<DetailedFeatureComparisonProps> = ({
  open,
  onClose,
  features,
  plansWithCurrentPlan,
}) => {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
      onClick={onClose}
    >
      <Box
        onClick={e => e.stopPropagation()}
        sx={{
          width: { xs: '95vw', md: '80vw' },
          maxWidth: { xs: '95vw', md: '1200px' },
          maxHeight: { xs: '90vh', md: '80vh' },
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
          borderRadius: 2,
          position: 'relative',
          pt: { xs: 2, md: 3 },
          pb: { xs: 2, md: 3 },
          pl: { xs: 2, md: 3 },
          pr: 0,
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid red',
        }}
      >
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            color: 'red',
            zIndex: 2,
          }}
          aria-label="Close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Replace the feature comparison rows with a grid layout for perfect alignment */}
        <Box sx={{ width: '100%', overflow: 'auto', mt: 2, flex: 1, pr: 0 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(220px, 1.5fr) repeat(' + plansWithCurrentPlan.length + ', 1fr)',
              alignItems: 'center',
              fontWeight: 700,
              mb: 2,
              px: 2,
              py: 1,
              borderBottom: theme => `2px solid ${theme.palette.mode === 'dark' ? '#444' : '#eee'}`,
              background: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                color: 'red',
                fontWeight: 700,
              }}
            >
              Detailed Feature Comparison
              <CompareArrows sx={{ ml: 1, color: 'red', fontSize: { xs: 22, md: 26 } }} />
            </Box>
            {plansWithCurrentPlan.map(plan => (
              <Box
                key={plan.name}
                sx={{
                  textAlign: 'center',
                  color: plan.color,
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', md: '1.2rem' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <Box sx={{ fontSize: 16, display: 'flex', alignItems: 'center' }}>{plan.icon}</Box>
                {plan.name}
              </Box>
            ))}
          </Box>
          {features.map(feature => (
            <Box
              key={feature.name}
              sx={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(220px, 1.5fr) repeat(' + plansWithCurrentPlan.length + ', 1fr)',
                alignItems: 'center',
                minHeight: 40,
                px: 2,
                py: 1,
                background: theme =>
                  theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', md: '1.2rem' },
                    color: 'text.primary',
                  }}
                >
                  {feature.name}
                </Typography>
                <Box
                  sx={{
                    width: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 0.5,
                  }}
                >
                  {feature.description ? (
                    <Tooltip title={feature.description} arrow>
                      <IconButton size="small" sx={{ p: 0 }}>
                        <HelpOutline
                          fontSize="small"
                          sx={{ color: 'error.main', fontSize: { xs: 16, md: 20 } }}
                        />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <IconButton size="small" sx={{ p: 0, opacity: 0, pointerEvents: 'none' }}>
                      <HelpOutline fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
              {plansWithCurrentPlan.map(plan => {
                const isIncluded = plansWithCurrentPlan
                  .slice(0, plansWithCurrentPlan.indexOf(plan) + 1)
                  .some(p => p.features.includes(feature.name));
                return (
                  <Box
                    key={plan.name}
                    sx={{
                      textAlign: 'center',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 32,
                    }}
                  >
                    {isIncluded ? (
                      <CheckCircle sx={{ color: plan.color, fontSize: 28 }} />
                    ) : (
                      <Typography
                        sx={{
                          color: theme => (theme.palette.mode === 'dark' ? '#666' : '#aaa'),
                          fontSize: 28,
                          fontWeight: 700,
                        }}
                      >
                        —
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default DetailedFeatureComparison;
