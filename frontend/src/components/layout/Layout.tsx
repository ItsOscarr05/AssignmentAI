import { useAuth } from '@/hooks/useAuth';
import {
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Menu as MenuIcon } from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ReactNode, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdPopup, useAdSensePopup } from '../../hooks/useAdPopup';
import { AdPopup, AdSensePopup } from '../ads';

// Navigation items for the sidebar
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Assignments', href: '/assignments', icon: AcademicCapIcon },
  {
    name: 'Submissions',
    href: '/submissions',
    icon: ClipboardDocumentListIcon,
  },
  { name: 'Profile', href: '/profile', icon: UserIcon },
];

interface LayoutProps {
  children?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Upgrade popup for free users (every 10 minutes)
  const { showAd: showUpgradeAd, closeAd: closeUpgradeAd } = useAdPopup();

  // AdSense popup for free users (every 20 minutes, offset from upgrade)
  const { showAd: showAdSenseAd, closeAd: closeAdSenseAd } = useAdSensePopup();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={user.avatarUrl || user.avatar} alt={user.fullName || user.name} />
            <Typography variant="body1">{user.fullName || user.name}</Typography>
          </Box>
        )}
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map(item => (
          <ListItem key={item.name} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.href}
              onClick={() => {
                navigate(item.href);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                <item.icon className="h-6 w-6" />
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: `240px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: 'none' },
              color: theme.palette.mode === 'dark' ? theme.palette.background.default : 'inherit',
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AssignmentAI
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: 240 }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          mt: 8,
        }}
      >
        {children || <Outlet />}
      </Box>

      {/* Upgrade Popup for free users (every 10 minutes) */}
      <AdPopup open={showUpgradeAd} onClose={closeUpgradeAd} />

      {/* AdSense Popup for free users (every 20 minutes) */}
      <AdSensePopup open={showAdSenseAd} onClose={closeAdSenseAd} />
    </Box>
  );
};

export default Layout;
