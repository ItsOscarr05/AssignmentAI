import { Box, Card, CardMedia, styled, Typography, useTheme } from '@mui/material';
import React from 'react';
import { useAspectRatio } from '../../hooks/useAspectRatio';
import { aspectRatioStyles, getAspectRatioStyle } from '../../styles/aspectRatioBreakpoints';
import { getAriaLabel } from '../../utils/accessibility';

interface ResponsiveCardProps {
  title: string;
  description?: string;
  image?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'elevation' | 'outlined';
  elevation?: number;
  className?: string;
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  useAspectRatio?: boolean;
}

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.standard,
  }),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const CardContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
  },
}));

const ContentWrapper = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
});

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  description,
  image,
  actions,
  children,
  variant = 'elevation',
  elevation = 1,
  className,
  role = 'article',
  ariaLabel,
  ariaDescribedBy,
  useAspectRatio: useAspectRatioMode = true,
}) => {
  const theme = useTheme();
  const { breakpoint, isMobile, isTablet } = useAspectRatio();

  const getCardPadding = () => {
    if (useAspectRatioMode) {
      return getAspectRatioStyle(aspectRatioStyles.cards.padding, breakpoint, 2);
    }
    return 2;
  };

  const getCardBorderRadius = () => {
    if (useAspectRatioMode) {
      return getAspectRatioStyle(aspectRatioStyles.cards.borderRadius, breakpoint, 1);
    }
    return 1;
  };

  const getTitleVariant = () => {
    if (useAspectRatioMode) {
      if (isMobile) return 'h6';
      if (isTablet) return 'h5';
      return 'h4';
    }
    return isMobile ? 'h6' : 'h5';
  };

  const getDescriptionLines = () => {
    if (useAspectRatioMode) {
      if (isMobile) return 2;
      if (isTablet) return 3;
      return 4;
    }
    return isMobile ? 2 : 3;
  };

  const getImageHeight = () => {
    if (useAspectRatioMode) {
      return getAspectRatioStyle(aspectRatioStyles.cards.imageHeight, breakpoint, 200);
    }
    return 200;
  };

  const getImageWidth = () => {
    if (useAspectRatioMode) {
      if (isMobile) return '100%';
      if (isTablet) return '40%';
      return '35%';
    }
    return { sm: '40%' };
  };

  return (
    <StyledCard
      variant={variant}
      elevation={elevation}
      className={className}
      role={role}
      sx={{
        borderRadius: theme.spacing(getCardBorderRadius()),
        padding: theme.spacing(getCardPadding()),
      }}
      {...getAriaLabel(ariaLabel || title, ariaDescribedBy)}
    >
      <CardContentWrapper>
        {image && (
          <CardMedia
            component="img"
            src={image}
            alt={title}
            sx={{
              objectFit: 'cover',
              height: getImageHeight(),
              width: getImageWidth(),
              borderRadius: theme.spacing(1),
              marginBottom: theme.spacing(2),
            }}
          />
        )}
        <ContentWrapper>
          <Typography
            variant={getTitleVariant()}
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 600,
              marginBottom: theme.spacing(1),
              fontSize: getAspectRatioStyle(
                aspectRatioStyles.typography.h2.fontSize,
                breakpoint,
                '1.5rem'
              ),
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                marginBottom: theme.spacing(2),
                display: '-webkit-box',
                WebkitLineClamp: getDescriptionLines(),
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: getAspectRatioStyle(
                  aspectRatioStyles.typography.body1.fontSize,
                  breakpoint,
                  '1rem'
                ),
              }}
            >
              {description}
            </Typography>
          )}
          {children && (
            <Box
              sx={{
                flex: 1,
                marginBottom: theme.spacing(2),
              }}
              role="region"
              aria-label="Card content"
            >
              {children}
            </Box>
          )}
          {actions && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: theme.spacing(1),
                marginTop: 'auto',
              }}
            >
              {actions}
            </Box>
          )}
        </ContentWrapper>
      </CardContentWrapper>
    </StyledCard>
  );
};

export default ResponsiveCard;
