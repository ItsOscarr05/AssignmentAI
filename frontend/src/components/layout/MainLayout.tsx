import { Box, Container, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAspectRatio } from '../../hooks/useAspectRatio';
import { aspectRatioStyles, getAspectRatioStyle } from '../../styles/aspectRatioBreakpoints';
import { AppBar } from './AppBar';
import { Footer } from './Footer';

export const MainLayout: React.FC = () => {
  const theme = useTheme();
  const { breakpoint, isMobile } = useAspectRatio();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getSidebarWidth = () => {
    return getAspectRatioStyle(aspectRatioStyles.navigation.sidebar.width, breakpoint, '240px');
  };

  const getHeaderHeight = () => {
    return getAspectRatioStyle(aspectRatioStyles.navigation.header.height, breakpoint, '64px');
  };

  const getContainerMaxWidth = () => {
    return getAspectRatioStyle(aspectRatioStyles.container.maxWidth, breakpoint, 'lg');
  };

  const getPadding = () => {
    return getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
      }}
    >
      <AppBar onMenuClick={handleSidebarToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: getPadding(),
          width: { sm: `calc(100% - ${sidebarOpen ? getSidebarWidth() : '64px'})` },
          ml: { sm: sidebarOpen ? getSidebarWidth() : '64px' },
          mt: getHeaderHeight(),
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Container
          maxWidth={getContainerMaxWidth()}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              py: getPadding(),
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Outlet />
          </Box>
          <Footer />
        </Container>
      </Box>
    </Box>
  );
};
