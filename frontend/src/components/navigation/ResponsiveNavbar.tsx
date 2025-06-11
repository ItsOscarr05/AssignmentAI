import {
  Assignment,
  ExitToApp,
  Home,
  Menu as MenuIcon,
  Person,
  School,
  Settings,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAriaControls,
  getAriaExpanded,
  getAriaLabel,
  handleKeyboardNavigation,
} from '../../utils/accessibility';

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
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLUListElement>(null);
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
    if (!mobileOpen) {
      setFocusedIndex(0);
    }
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    handleKeyboardNavigation(event, {
      onEnter: () => {
        const item = navItems[index];
        if (item) {
          handleNavigation(item.path);
        } else if (index === navItems.length) {
          handleLogout();
        }
      },
      onArrowUp: () => {
        if (focusedIndex !== null && focusedIndex > 0) {
          setFocusedIndex(focusedIndex - 1);
        }
      },
      onArrowDown: () => {
        if (focusedIndex !== null && focusedIndex < navItems.length) {
          setFocusedIndex(focusedIndex + 1);
        }
      },
      onEscape: () => {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      },
    });
  };

  useEffect(() => {
    if (focusedIndex !== null && drawerRef.current) {
      const focusableItems = drawerRef.current.querySelectorAll('button');
      if (focusableItems[focusedIndex]) {
        (focusableItems[focusedIndex] as HTMLElement).focus();
      }
    }
  }, [focusedIndex]);

  const drawer = (
    <List ref={drawerRef} role="menu" aria-label={'Mobile menu'}>
      {navItems.map((item, index) => {
        if (item.requiresAuth && !isAuthenticated) return null;
        return (
          <ListItem
            button
            key={item.label}
            onClick={() => handleNavigation(item.path)}
            onKeyDown={e => handleKeyDown(e, index)}
            role="menuitem"
            tabIndex={focusedIndex === index ? 0 : -1}
            {...getAriaLabel(item.label)}
          >
            <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ color: 'primary.main', fontWeight: 600 }}
            />
          </ListItem>
        );
      })}
      {isAuthenticated && (
        <ListItem
          button
          onClick={handleLogout}
          onKeyDown={e => handleKeyDown(e, navItems.length)}
          role="menuitem"
          tabIndex={focusedIndex === navItems.length ? 0 : -1}
          {...getAriaLabel('Logout')}
        >
          <ListItemIcon sx={{ color: 'primary.main' }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ color: 'primary.main', fontWeight: 600 }}
          />
        </ListItem>
      )}
    </List>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" role="banner">
        <Toolbar>
          <IconButton
            ref={menuButtonRef}
            color="inherit"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
            {...getAriaExpanded(mobileOpen)}
            {...getAriaControls('mobile-menu')}
            {...getAriaLabel('Menu button')}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => handleNavigation('/')}
            role="heading"
            aria-level={1}
          >
            AssignmentAI
          </Typography>
          {!isMobile && (
            <Box component="nav" role="navigation" aria-label={'Main navigation'}>
              {navItems.map(item => {
                if (item.requiresAuth && !isAuthenticated) return null;
                return (
                  <Button
                    key={item.label}
                    color="inherit"
                    onClick={() => handleNavigation(item.path)}
                    startIcon={item.icon}
                    {...getAriaLabel(item.label)}
                  >
                    {item.label}
                  </Button>
                );
              })}
              {isAuthenticated && (
                <Button
                  color="inherit"
                  onClick={handleLogout}
                  startIcon={<ExitToApp />}
                  {...getAriaLabel('Logout')}
                >
                  Logout
                </Button>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
            backgroundColor: 'grey.50',
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default ResponsiveNavbar;
