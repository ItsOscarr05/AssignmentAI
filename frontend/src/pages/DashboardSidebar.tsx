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
  Divider,
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

const expandedWidth = 250;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/dashboard' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/dashboard/assignments' },
    { text: 'Workshop', icon: <EditIcon />, path: '/dashboard/workshop' },
    { text: 'AI Tokens', icon: <CurrencyBitcoinIcon />, path: '/dashboard/ai-tokens' },
    { text: 'Price Plan', icon: <MonetizationOnIcon />, path: '/dashboard/price-plan' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
    { text: 'Profile', icon: <AccountCircleIcon />, path: '/dashboard/profile' },
    { text: 'Help', icon: <HelpIcon />, path: '/dashboard/help' },
  ];

  const drawerWidth = expandedWidth;

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
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
        }}
      >
        <img
          src="/scroll_transparent.png"
          alt="Logo"
          style={{ maxHeight: 48, width: 'auto', marginRight: -25, display: 'block' }}
        />
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            color: 'primary.contrastText',
            fontSize: '1.7rem',
            fontWeight: 700,
            minWidth: 0,
            flexShrink: 1,
            textAlign: 'center',
            width: '100%',
          }}
        >
          AssignmentAI
        </Typography>
      </Box>
      <Divider sx={{ width: '80%', my: 2 }} />
      <List
        sx={{
          flexGrow: 1,
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: 'calc(100% - 180px)',
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
              mb: 2,
              py: 1.8,
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
              {React.cloneElement(item.icon, { sx: { fontSize: 28 } })}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                color: 'inherit',
                fontWeight: 500,
                fontSize: '1.1rem',
              }}
            />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ width: '80%', my: 2 }} />
      <Box sx={{ p: 2, width: '100%', textAlign: 'center' }}>
        <Typography
          variant="body2"
          color="primary.contrastText"
          sx={{ opacity: 0.7, fontSize: '1rem' }}
        >
          © 2025 AssignmentAI
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
            left: mobileOpen ? 'auto' : 16,
            right: mobileOpen ? 16 : 'auto',
            zIndex: theme.zIndex.drawer + 3,
            background: 'rgba(255,255,255,0.85)',
            color: theme.palette.primary.main,
            boxShadow: 2,
            width: 48,
            height: 48,
            '&:hover': {
              background: 'rgba(255,255,255,1)',
            },
          }}
        >
          {mobileOpen ? <CloseIcon sx={{ fontSize: 32 }} /> : <MenuIcon sx={{ fontSize: 32 }} />}
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
              borderRight: '1px solid',
              borderColor: 'divider',
              background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
              color: '#ffffff',
              borderRadius: 0,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              '& .MuiListItemIcon-root': {
                color: '#ffffff',
              },
              '& .MuiTypography-root': {
                color: '#ffffff',
              },
              '& .MuiDivider-root': {
                borderColor: 'rgba(255, 255, 255, 0.12)',
              },
              '& .MuiListItem-root': {
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
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
