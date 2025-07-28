import { Box, Card, CardContent, CardMedia, CardProps, Typography, useTheme } from '@mui/material';
import React from 'react';
import { useAspectRatio } from '../../hooks/useAspectRatio';
import { aspectRatioStyles, getAspectRatioStyle } from '../../styles/aspectRatioBreakpoints';

interface AspectRatioCardProps extends Omit<CardProps, 'variant'> {
  title: string;
  description?: string;
  image?: string;
  variant?: 'elevation' | 'outlined';
  elevation?: number;
  className?: string;
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  children?: React.ReactNode;
}

const AspectRatioCard: React.FC<AspectRatioCardProps> = ({
  title,
  description,
  image,
  variant = 'elevation',
  elevation = 1,
  className,
  role = 'article',
  ariaLabel,
  ariaDescribedBy,
  children,
  ...props
}) => {
  const theme = useTheme();
  const { breakpoint, isMobile, isTablet } = useAspectRatio();

  const getAriaLabel = (title: string, ariaDescribedBy?: string) => {
    if (ariaLabel) return { 'aria-label': ariaLabel };
    if (ariaDescribedBy) return { 'aria-describedby': ariaDescribedBy };
    return { 'aria-label': title };
  };

  const getCardPadding = () => {
    return theme.spacing(getAspectRatioStyle(aspectRatioStyles.cards.padding, breakpoint, 2));
  };

  const getCardBorderRadius = () => {
    return getAspectRatioStyle(aspectRatioStyles.cards.borderRadius, breakpoint, '8px');
  };

  const getTitleVariant = () => {
    if (isMobile) return 'h6';
    if (isTablet) return 'h5';
    return 'h5';
  };

  const getDescriptionLines = () => {
    if (isMobile) return 2;
    if (isTablet) return 3;
    return 4;
  };

  const getImageHeight = () => {
    if (isMobile) return 160;
    if (isTablet) return 180;
    return 200;
  };

  const getImageWidth = () => {
    if (isMobile) return '100%';
    if (isTablet) return '40%';
    return '35%';
  };

  return (
    <Card
      variant={variant}
      elevation={elevation}
      className={className}
      role={role}
      sx={{
        borderRadius: getCardBorderRadius(),
        height: '100%',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.standard,
        }),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        },
      }}
      {...getAriaLabel(ariaLabel || title, ariaDescribedBy)}
      {...props}
    >
      {image && (
        <CardMedia
          component="img"
          src={image}
          alt={title}
          sx={{
            objectFit: 'cover',
            height: getImageHeight(),
            width: getImageWidth(),
            minWidth: isMobile ? '100%' : 'auto',
          }}
        />
      )}
      <CardContent
        sx={{
          flex: 1,
          padding: getCardPadding(),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box>
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
        </Box>
        {children && (
          <Box
            sx={{
              flex: 1,
              marginTop: theme.spacing(2),
            }}
            role="region"
            aria-label="Card content"
          >
            {children}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AspectRatioCard;
