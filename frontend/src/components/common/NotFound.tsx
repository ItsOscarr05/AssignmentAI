import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NotFoundProps {
  title?: string;
  description?: string;
  buttonText?: string;
  icon?: 'error' | 'warning';
  onBack?: () => void;
  onHome?: () => void;
  className?: string;
  style?: React.CSSProperties;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  showButton?: boolean;
  showIcon?: boolean;
}

const NotFound: React.FC<NotFoundProps> = ({
  title = '404',
  description = 'The page you are looking for does not exist.',
  buttonText = 'Go Back',
  icon = 'error',
  onBack,
  onHome,
  className = '',
  style = {},
  iconClassName = '',
  iconStyle = {},
  buttonClassName = '',
  buttonStyle = {},
  showButton = true,
  showIcon = true,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onBack) {
      onBack();
    } else if (onHome) {
      onHome();
    } else {
      navigate(-1);
    }
  };

  const IconComponent = icon === 'warning' ? WarningIcon : ErrorIcon;

  return (
    <Container maxWidth="sm" data-testid="container">
      <Box
        component="main"
        role="main"
        aria-label="404 page not found"
        className={className}
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        style={style}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {showIcon && (
            <IconComponent
              data-testid={`${icon}-icon`}
              className={iconClassName}
              sx={{ fontSize: 64, mb: 2 }}
              style={iconStyle}
            />
          )}
          <Typography variant="h1" component="h1" gutterBottom role="heading" aria-level={1}>
            {title}
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom role="heading" aria-level={2}>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {description.includes('<') || description.includes('>') ? (
              <span dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              description
            )}
          </Typography>
          {showButton && (
            <Button
              variant="contained"
              onClick={handleClick}
              className={buttonClassName}
              style={buttonStyle}
              aria-label="Go back to previous page"
            >
              {buttonText}
            </Button>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;
