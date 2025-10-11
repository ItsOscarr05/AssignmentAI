import {
  Assignment,
  ChevronLeft,
  Home,
  Link as LinkIcon,
  Menu,
  Person,
  School,
  Settings,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: prop => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: prop => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const menuItems = [
  { text: 'Dashboard', icon: <Home />, path: '/dashboard' },
  { text: 'Assignments', icon: <Assignment />, path: '/assignments' },
  { text: 'Workshop', icon: <School />, path: '/workshop' },
  { text: 'Link Processing Demo', icon: <LinkIcon />, path: '/link-processing-demo' },
  { text: 'Profile', icon: <Person />, path: '/profile' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { breakpoint, isMobile, isTablet } = useAspectRatio();
  const [open, setOpen] = useState(!isMobile);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const getDrawerWidth = () => {
    return getAspectRatioStyle(aspectRatioStyles.navigation.sidebar.width, breakpoint, '240px');
  };

  const getHeaderHeight = () => {
    return getAspectRatioStyle(aspectRatioStyles.navigation.header.height, breakpoint, '64px');
  };

  const getTypographySize = () => {
    if (isMobile) return 'h6';
    if (isTablet) return 'h5';
    return 'h4';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflowX: 'hidden' }}>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
            minHeight: `${getHeaderHeight()} !important`,
            position: 'relative',
            px: 2,
            '&::after': {
              display: 'none',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img
              src="/New_AssignmentAI_Logo_Transparent.png"
              alt="Logo"
              style={{
                height: 32,
                width: 'auto',
                objectFit: 'contain',
              }}
            />
            <Typography
              variant={getTypographySize()}
              noWrap
              component="div"
              sx={{
                color: '#FFFFFF',
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                letterSpacing: '1px',
                fontSize: getAspectRatioStyle(
                  aspectRatioStyles.typography.h2.fontSize,
                  breakpoint,
                  '1.25rem'
                ),
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              AssignmentAI
            </Typography>
          </Box>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <Menu />
          </IconButton>
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: getDrawerWidth(),
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: getDrawerWidth(),
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Typography
            variant={getTypographySize()}
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              color: theme.palette.primary.main,
            }}
          >
            Menu
          </Typography>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeft />
          </IconButton>
        </DrawerHeader>
        <List>
          {menuItems.map(item => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'inherit' : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: getAspectRatioStyle(
                      aspectRatioStyles.typography.body1.fontSize,
                      breakpoint,
                      '1rem'
                    ),
                    fontWeight: 500,
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        <Box
          sx={{
            p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3),
            maxWidth: getAspectRatioStyle(
              aspectRatioStyles.container.maxWidth,
              breakpoint,
              '1200px'
            ),
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Main>
    </Box>
  );
};

export default DashboardLayout;
