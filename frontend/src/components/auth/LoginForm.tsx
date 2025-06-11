import { Box, CircularProgress, createTheme, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import React, { lazy, Suspense } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { fadeIn, scaleIn, slideIn } from '../../styles/animations';
import { responsiveStyles } from '../../styles/breakpoints';
import '../../styles/transitions.css';

// Lazy load non-critical components
const LoginFormContent = lazy(() => import('./LoginFormContent'));
const ThemeToggle = lazy(() => import('../common/ThemeToggle'));

const LoginForm: React.FC = () => {
  const { theme } = useTheme();

  const themeConfig = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
          primary: {
            main: '#ff1a1a',
          },
          background: {
            default: theme === 'light' ? '#ffffff' : '#121212',
            paper: theme === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        components: {
          MuiButton: {
            defaultProps: {
              disableRipple: true,
            },
          },
        },
      }),
    [theme]
  );

  return (
    <ThemeProvider theme={themeConfig}>
      <Box
        component="main"
        className="login-page"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 0,
          position: 'relative',
          overflow: 'hidden',
          contain: 'paint layout',
        }}
        role="main"
        aria-label="Login page"
      >
        <Suspense fallback={<CircularProgress />}>
          <ThemeToggle />
        </Suspense>

        {/* Left Side - Cover Image */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            height: { xs: '30vh', md: '100vh' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#ff1a1a',
            position: 'relative',
            overflow: 'hidden',
            animation: `${slideIn} 1s ease-out`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                theme === 'light'
                  ? 'linear-gradient(135deg, rgba(255,26,26,0.9) 0%, rgba(255,77,77,0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(255,26,26,0.8) 0%, rgba(255,77,77,0.8) 100%)',
              zIndex: 1,
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              color: 'white',
              p: responsiveStyles.container.padding,
              animation: `${fadeIn} 1s ease-out 0.5s both`,
            }}
          >
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                fontSize: responsiveStyles.typography.h1.fontSize,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              Welcome to AssignmentAI
            </Typography>
            <Typography
              variant="h2"
              sx={{
                mb: 4,
                opacity: 0.9,
                fontSize: responsiveStyles.typography.h2.fontSize,
                animation: `${fadeIn} 1s ease-out 0.8s both`,
              }}
            >
              Your AI-powered assignment management platform
            </Typography>
            <Box
              component="img"
              src="/images/login-cover.svg"
              alt="AssignmentAI Platform Illustration"
              sx={{
                maxWidth: '100%',
                height: 'auto',
                maxHeight: { xs: '150px', sm: '200px', md: '300px' },
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                animation: `${scaleIn} 1s ease-out 1s both`,
              }}
            />
          </Box>
        </Box>

        {/* Right Side - Login Form */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            height: { xs: 'auto', md: '100vh' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 3, md: 0 },
            animation: `${fadeIn} 1s ease-out`,
            bgcolor: 'background.default',
          }}
        >
          <Suspense fallback={<CircularProgress />}>
            <LoginFormContent />
          </Suspense>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default React.memo(LoginForm);
