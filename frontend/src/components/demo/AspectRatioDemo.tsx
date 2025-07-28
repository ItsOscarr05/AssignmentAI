import { Box, Card, Chip, Divider, Grid, Paper, Typography, useTheme } from '@mui/material';
import React from 'react';
import { useAspectRatio } from '../../hooks/useAspectRatio';
import { aspectRatioStyles, getAspectRatioStyle } from '../../styles/aspectRatioBreakpoints';
import AspectRatioCard from '../common/AspectRatioCard';
import AspectRatioLayout from '../layout/AspectRatioLayout';

const AspectRatioDemo: React.FC = () => {
  const theme = useTheme();
  const {
    breakpoint,
    ratio,
    orientation,
    isUltraWide,
    isWide,
    isStandard,
    isSquare,
    isTall,
    isMobile,
    isTablet,
    getBreakpointInfo,
  } = useAspectRatio();

  const breakpointInfo = getBreakpointInfo();

  const demoCards = [
    {
      title: 'Ultra-Wide Display',
      description: 'Perfect for gaming and productivity with 21:9 or 32:9 aspect ratios',
      image: '/assets/dashboard.png',
      aspectRatio: 'ultra-wide',
    },
    {
      title: 'Wide Display',
      description: 'Standard desktop monitors and laptops with 16:9 or 16:10 aspect ratios',
      image: '/assets/dashboard.png',
      aspectRatio: 'wide',
    },
    {
      title: 'Standard Display',
      description: 'Tablets and some laptops with 4:3 or 3:2 aspect ratios',
      image: '/assets/dashboard.png',
      aspectRatio: 'standard',
    },
    {
      title: 'Square Display',
      description: 'Some tablets and foldables with square-ish aspect ratios',
      image: '/assets/dashboard.png',
      aspectRatio: 'square',
    },
    {
      title: 'Tall Display',
      description: 'Phones in portrait mode with tall aspect ratios',
      image: '/assets/dashboard.png',
      aspectRatio: 'tall',
    },
  ];

  return (
    <AspectRatioLayout
      maxWidth="ultra-wide"
      spacing={4}
      columns={{
        'ultra-wide': 4,
        wide: 3,
        standard: 2,
        square: 2,
        tall: 1,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          mb: 4,
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontSize: getAspectRatioStyle(
              aspectRatioStyles.typography.h1.fontSize,
              breakpoint,
              '2rem'
            ),
            fontWeight: 700,
            color: theme.palette.primary.main,
          }}
        >
          Aspect Ratio Responsive Demo
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            fontSize: getAspectRatioStyle(
              aspectRatioStyles.typography.body1.fontSize,
              breakpoint,
              '1rem'
            ),
            mb: 3,
          }}
        >
          This layout adapts based on your screen's aspect ratio, not just pixel dimensions
        </Typography>
      </Box>

      {/* Current Device Info */}
      <Paper
        elevation={3}
        sx={{
          gridColumn: '1 / -1',
          p: getAspectRatioStyle(aspectRatioStyles.cards.padding, breakpoint, 3),
          mb: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, ${theme.palette.primary.main}15 100%)`,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Current Device Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Aspect Ratio
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {ratio.toFixed(2)}:1
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Breakpoint
              </Typography>
              <Chip
                label={breakpoint}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Orientation
              </Typography>
              <Chip
                label={orientation}
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Device Type
              </Typography>
              <Chip
                label={isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Grid>
        </Grid>
        {breakpointInfo && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {breakpointInfo.description}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Common devices: {breakpointInfo.commonDevices.join(', ')}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Aspect Ratio Flags */}
      <Box
        sx={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mb: 4,
          justifyContent: 'center',
        }}
      >
        <Chip
          label="Ultra-Wide"
          color={isUltraWide ? 'primary' : 'default'}
          variant={isUltraWide ? 'filled' : 'outlined'}
        />
        <Chip
          label="Wide"
          color={isWide ? 'primary' : 'default'}
          variant={isWide ? 'filled' : 'outlined'}
        />
        <Chip
          label="Standard"
          color={isStandard ? 'primary' : 'default'}
          variant={isStandard ? 'filled' : 'outlined'}
        />
        <Chip
          label="Square"
          color={isSquare ? 'primary' : 'default'}
          variant={isSquare ? 'filled' : 'outlined'}
        />
        <Chip
          label="Tall"
          color={isTall ? 'primary' : 'default'}
          variant={isTall ? 'filled' : 'outlined'}
        />
      </Box>

      {/* Demo Cards */}
      {demoCards.map((card, index) => (
        <AspectRatioCard
          key={index}
          title={card.title}
          description={card.description}
          image={card.image}
          elevation={2}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.secondary">
              This card adapts to the {card.aspectRatio} breakpoint
            </Typography>
          </Box>
        </AspectRatioCard>
      ))}

      {/* Responsive Grid Demo */}
      <Box
        sx={{
          gridColumn: '1 / -1',
          mt: 4,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Responsive Grid Demo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This grid automatically adjusts columns based on aspect ratio
        </Typography>
        <Grid container spacing={2}>
          {Array.from({ length: 8 }, (_, i) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={i}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 100,
              }}
            >
              <Card
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: theme.palette.grey[100],
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Item {i + 1}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Benefits Section */}
      <Box
        sx={{
          gridColumn: '1 / -1',
          mt: 4,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Benefits of Aspect Ratio-Based Design
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                More Intuitive
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aspect ratios better represent how content will actually be displayed, making
                layouts more predictable and user-friendly.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Device Agnostic
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Works across different pixel densities and screen sizes, providing consistent
                experiences regardless of device specifications.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Better UX
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Layouts adapt to the actual viewing experience rather than arbitrary pixel counts,
                improving usability and accessibility.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Future-Proof
              </Typography>
              <Typography variant="body2" color="text.secondary">
                More resilient to new device form factors like foldables, ultra-wide monitors, and
                emerging display technologies.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AspectRatioLayout>
  );
};

export default AspectRatioDemo;
