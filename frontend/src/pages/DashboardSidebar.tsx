import {
  AccountCircle as AccountCircleIcon,
  Assignment as AssignmentIcon,
  CurrencyBitcoin as CurrencyBitcoinIcon,
  Edit as EditIcon,
  Help as HelpIcon,
  Home as HomeIcon,
  MonetizationOn as MonetizationOnIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Get font size from localStorage or default to 20
const getFontSize = () => {
  try {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.appearance?.font_size || 20;
    }
  } catch (error) {
    console.warn('Failed to parse user settings:', error);
  }
  return 20;
};

const expandedWidth = 250;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [fontSize, setFontSize] = React.useState(getFontSize());

  // Listen for font size changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      setFontSize(getFontSize());
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check periodically for changes
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/dashboard' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/dashboard/assignments' },
    { text: 'Workshop', icon: <EditIcon />, path: '/dashboard/workshop' },
    { text: 'AI Tokens', icon: <CurrencyBitcoinIcon />, path: '/dashboard/ai-tokens' },
    {
      text: 'Price Plan',
      icon: <MonetizationOnIcon />,
      path: '/dashboard/price-plan',
    },
    { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
    { text: 'Profile', icon: <AccountCircleIcon />, path: '/dashboard/profile' },
    { text: 'Help', icon: <HelpIcon />, path: '/dashboard/help' },
  ];

  const drawerWidth = expandedWidth;

  const drawer = (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        alignItems: 'center',
        position: 'relative',
        py: 2,
      }}
    >
      {/* Logo and Title */}
      <Box
        sx={{
          p: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minHeight: 64,
          overflow: 'visible',
          mb: 0,
        }}
      >
        <Box
          component="img"
          src="/scroll_transparent.png"
          alt="Logo"
          sx={{
            maxHeight: 48,
            width: 'auto',
            marginRight: 0,
            display: 'block',
            filter: theme =>
              theme.palette.mode === 'dark'
                ? 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'
                : 'none',
          }}
        />
        <Typography
          noWrap
          component="div"
          sx={{
            color: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : 'primary.contrastText'),
            minWidth: 0,
            flexShrink: 1,
            textAlign: 'left',
            fontSize: `${(1.7 * fontSize) / 20}rem`,
            fontWeight: 700,
          }}
        >
          AssignmentAI
        </Typography>
      </Box>

      {/* Menu Items */}
      <Box sx={{ flex: 1, width: '100%' }}>
        <List
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
          }}
        >
          {menuItems.map(item => (
            <ListItem
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 1,
                py: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                },
                justifyContent: 'flex-start',
                px: 2,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  color: 'inherit',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                {React.cloneElement(item.icon, {
                  sx: { fontSize: `${(28 * fontSize) / 20}px` },
                })}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  color: 'inherit',
                  sx: {
                    fontSize: `${(1.1 * fontSize) / 20}rem`,
                    fontWeight: 500,
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Copyright */}
      <Box sx={{ p: 1, width: '100%', textAlign: 'center' }}>
        <Typography
          sx={{
            color: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : 'primary.contrastText'),
            opacity: 0.7,
            fontSize: `${(0.9 * fontSize) / 20}rem`,
          }}
        >
          © {new Date().getFullYear()} AssignmentAI
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Toggle button for mobile */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label={mobileOpen ? 'close drawer' : 'open drawer'}
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: theme.zIndex.drawer + 3,
            background: 'rgba(255,255,255,1)',
            color: theme.palette.primary.main,
            boxShadow: 2,
            width: 48,
            height: 48,
            border: '2px solid #D32F2F',
            '&:hover': {
              background: 'rgba(255,255,255,1)',
              borderColor: '#B71C1C',
            },
          }}
        >
          {mobileOpen ? (
            <CloseIcon sx={{ fontSize: `${(32 * fontSize) / 20}px` }} />
          ) : (
            <MenuIcon sx={{ fontSize: `${(32 * fontSize) / 20}px` }} />
          )}
        </IconButton>
      )}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: theme.zIndex.drawer + 2,
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            overflowX: 'hidden',
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              overflowX: 'hidden',
              borderRight: theme =>
                theme.palette.mode === 'dark' ? '2px solid #d32f2f' : '1px solid',
              borderColor: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : 'divider'),
              background: theme =>
                theme.palette.mode === 'dark'
                  ? '#000814'
                  : `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
              color: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : '#ffffff'),
              borderRadius: '0 12px 12px 0',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              '& .MuiListItemIcon-root': {
                color: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : '#ffffff'),
              },
              '& .MuiTypography-root': {
                color: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : '#ffffff'),
              },
              '& .MuiDivider-root': {
                borderColor: 'rgba(255, 255, 255, 0.12)',
              },
              '& .MuiListItem-root': {
                '&:hover': {
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
                '&.Mui-selected': {
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(211, 47, 47, 0.3)'
                        : 'rgba(0, 0, 0, 0.25)',
                  },
                },
              },
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          marginLeft: { md: `${drawerWidth}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Dashboard;
