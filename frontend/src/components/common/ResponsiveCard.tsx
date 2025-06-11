import { Box, Card, CardMedia, styled, Typography, useMediaQuery, useTheme } from '@mui/material';
import React from 'react';
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
}

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

const CardContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
  },
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
}));

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
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <StyledCard
      variant={variant}
      elevation={elevation}
      className={className}
      role={role}
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
              height: 200,
              width: { sm: '40%' },
            }}
          />
        )}
        <ContentWrapper>
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 600,
              marginBottom: theme.spacing(1),
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
                WebkitLineClamp: isMobile ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
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
              role="group"
              aria-label="Card actions"
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
