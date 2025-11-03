import { Menu as MenuIcon, Settings as SettingsIcon } from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="static"
      sx={{
        background:
          'linear-gradient(135deg, rgba(255,107,107,0.95) 0%, rgba(255,142,142,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: 'error.light',
        boxShadow: '0 4px 12px rgba(255,107,107,0.15)',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          sx={{
            mr: 2,
            color: theme.palette.mode === 'dark' ? theme.palette.background.default : 'white',
            '&:hover': {
              background: 'rgba(255,255,255,0.1)',
            },
          }}
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          AssignmentAI
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            sx={{
              color: 'white',
              '&:hover': {
                background: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <SettingsIcon />
          </IconButton>

          {user ? (
            <>
              <Typography variant="body1" sx={{ color: 'white', ml: 2, fontWeight: 500 }}>
                {user.fullName || user.name}
              </Typography>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleMenu}
                  size="small"
                  sx={{
                    ml: 2,
                    border: '2px solid',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                  aria-label="account settings"
                >
                  <Avatar
                    src={user.avatarUrl || user.avatar}
                    alt={user.fullName || user.name}
                    sx={{
                      width: 32,
                      height: 32,
                      background: 'rgba(255,255,255,0.9)',
                      color: '#FF6B6B',
                      fontWeight: 600,
                    }}
                  >
                    {!(user.avatarUrl || user.avatar) && user.email[0].toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                  '& .MuiPaper-root': {
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: 'error.light',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(255,107,107,0.15)',
                    mt: 1,
                  },
                  '& .MuiMenuItem-root': {
                    color: 'error.main',
                    '&:hover': {
                      background: 'rgba(255,107,107,0.1)',
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    handleClose();
                    navigate('/profile');
                  }}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    navigate('/settings');
                  }}
                >
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
