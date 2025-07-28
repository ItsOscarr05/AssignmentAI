import { Assignment, Home, Menu, Person, School, Settings } from '@mui/icons-material';
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
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAspectRatio } from '../../hooks/useAspectRatio';
import { aspectRatioStyles, getAspectRatioStyle } from '../../styles/aspectRatioBreakpoints';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: <Home /> },
  { label: 'Assignments', path: '/assignments', icon: <Assignment />, requiresAuth: true },
  { label: 'Workshop', path: '/workshop', icon: <School />, requiresAuth: true },
  { label: 'Profile', path: '/profile', icon: <Person />, requiresAuth: true },
  { label: 'Settings', path: '/settings', icon: <Settings />, requiresAuth: true },
];

const ResponsiveNavbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLUListElement>(null);
  const { breakpoint, isMobile, isTablet } = useAspectRatio();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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

  const drawer = (
    <Box
      ref={drawerRef}
      sx={{
        width: getDrawerWidth(),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.paper,
        boxShadow: theme.shadows[1],
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant={getTypographySize()}
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main,
          }}
        >
          AssignmentAI
        </Typography>
      </Box>
      <List
        sx={{
          flex: 1,
          pt: 1,
        }}
      >
        {navItems
          .filter(item => !item.requiresAuth || isAuthenticated)
          .map(item => (
            <ListItem
              key={item.path}
              button
              onClick={() => handleNavigation(item.path)}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
                '&.Mui-focused': {
                  bgcolor: theme.palette.action.selected,
                },
              }}
              tabIndex={mobileOpen ? 0 : -1}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
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
      {isAuthenticated && (
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                bgcolor: theme.palette.error.light,
                color: theme.palette.error.contrastText,
              },
            }}
          >
            <ListItemText
              primary="Logout"
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
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${getDrawerWidth()})` },
          ml: { sm: getDrawerWidth() },
          height: getHeaderHeight(),
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            height: getHeaderHeight(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              ref={menuButtonRef}
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <Menu />
            </IconButton>
            <Typography
              variant={getTypographySize()}
              noWrap
              component="div"
              sx={{
                color: '#FFFFFF',
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                letterSpacing: '1px',
              }}
            >
              AssignmentAI
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: getDrawerWidth() }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: getDrawerWidth(),
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: getDrawerWidth(),
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
};

export default ResponsiveNavbar;
