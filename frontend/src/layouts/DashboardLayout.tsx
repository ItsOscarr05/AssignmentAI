import {
  Assignment as AssignmentIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Grade as GradeIcon,
  Menu as MenuIcon,
  Message as MessageIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 320;

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
  background: 'linear-gradient(135deg, rgba(255,107,107,0.95) 0%, rgba(255,142,142,0.95) 100%)',
  backdropFilter: 'blur(10px)',
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const StyledDrawer = styled(Drawer)(() => ({
  width: drawerWidth,
  flexShrink: 0,
  overflowX: 'hidden',
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, rgba(255,107,107,0.95) 0%, rgba(255,142,142,0.95) 100%)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid',
    borderColor: 'error.light',
    boxShadow: '4px 0 12px rgba(255,107,107,0.15)',
    overflowX: 'hidden',
    '& .MuiList-root': {
      overflowX: 'hidden',
    },
    '& .MuiListItemButton-root': {
      '&:hover': {
        background: 'rgba(255,255,255,0.1)',
      },
      '&.Mui-selected': {
        background: 'rgba(255,255,255,0.2)',
        '&:hover': {
          background: 'rgba(255,255,255,0.25)',
        },
      },
    },
    '& .MuiListItemIcon-root': {
      color: 'white',
    },
    '& .MuiListItemText-primary': {
      color: 'white',
      fontWeight: 500,
    },
    '& .MuiDivider-root': {
      borderColor: 'rgba(255,255,255,0.2)',
    },
  },
}));

const menuItems = [
  { text: 'Overview', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Assignments', icon: <AssignmentIcon />, path: '/dashboard/assignments' },
  { text: 'Calendar', icon: <EventIcon />, path: '/dashboard/calendar' },
  { text: 'Messages', icon: <MessageIcon />, path: '/dashboard/messages' },
  { text: 'Grades', icon: <GradeIcon />, path: '/dashboard/grades' },
  { text: 'Students', icon: <PeopleIcon />, path: '/dashboard/students' },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
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
            minHeight: '64px !important',
            position: 'relative',
            px: 2,
            '&::after': {
              display: 'none',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img
              src="/AssignmentAI_Logo-transparent-white.png"
              alt="Logo"
              style={{
                height: 32,
                width: 'auto',
                objectFit: 'contain',
              }}
            />
            <Typography
              variant="h4"
              noWrap
              component="div"
              sx={{
                color: '#FFFFFF',
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                letterSpacing: '1px',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
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
            onClick={handleDrawerOpen}
            sx={{
              color: 'white',
              '&:hover': {
                background: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBarStyled>
      <StyledDrawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={open}
        onClose={handleDrawerClose}
      >
        <DrawerHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', px: 2 }}>
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                color: 'white',
                fontWeight: 600,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              Menu
            </Typography>
            <IconButton
              onClick={handleDrawerClose}
              sx={{
                color: 'white',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </DrawerHeader>
        <List
          sx={{
            width: '100%',
            overflowX: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {menuItems.map(item => (
            <ListItem
              key={item.text}
              disablePadding
              sx={{ width: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}
            >
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) handleDrawerClose();
                }}
                sx={{
                  width: '100%',
                  overflowX: 'hidden',
                  boxSizing: 'border-box',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{ color: location.pathname === item.path ? 'white' : 'primary.main' }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </StyledDrawer>
      <Main open={open}>
        <DrawerHeader />
        <Box
          sx={{
            p: 3,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.main',
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          {children}
        </Box>
      </Main>
    </Box>
  );
};

export default DashboardLayout;
