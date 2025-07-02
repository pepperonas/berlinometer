// Main layout component for Zauberkoch React PWA

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Restaurant,
  LocalBar,
  Favorite,
  History,
  Person,
  AdminPanelSettings,
  Settings,
  Logout,
  Home,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth, useRequireAdmin, useRequirePremium } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 280;

interface MainLayoutProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ darkMode, onToggleDarkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { state: authState, logout } = useAuth();
  const isAdmin = useRequireAdmin();
  const isPremium = useRequirePremium();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Navigation items
  const navigationItems = [
    { text: 'Essen', icon: <Restaurant />, path: '/', roles: ['user'] },
    { text: 'Getränke', icon: <LocalBar />, path: '/cocktails', roles: ['user'] },
    { text: 'Favoriten', icon: <Favorite />, path: '/favorites', roles: ['user'] },
    { text: 'Verlauf', icon: <History />, path: '/history', roles: ['user'] },
    { text: 'Profil', icon: <Person />, path: '/profile', roles: ['user'] },
    { text: 'Premium', icon: <Settings />, path: '/premium', roles: ['user'] },
    { text: 'Admin', icon: <AdminPanelSettings />, path: '/admin', roles: ['admin'] },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => {
    if (item.roles.includes('admin')) {
      return isAdmin;
    }
    return true;
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/login');
  };

  const getActiveRoute = () => {
    const currentItem = navigationItems.find(item => item.path === location.pathname);
    return currentItem?.text || 'Zauberkoch';
  };

  const getUserDisplayName = () => {
    if (!authState.user) return 'User';
    if (authState.user.firstName && authState.user.lastName) {
      return `${authState.user.firstName} ${authState.user.lastName}`;
    }
    return authState.user.username;
  };

  const getUserInitials = () => {
    const user = authState.user;
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username[0].toUpperCase();
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          🧙‍♂️ Zauberkoch
        </Typography>
      </Toolbar>
      <Divider />
      
      <List>
        {filteredNavItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  color: location.pathname === item.path 
                    ? theme.palette.primary.main 
                    : theme.palette.text.primary,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mt: 'auto' }} />
      
      {/* User info section */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
            {getUserInitials()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" noWrap>
              {getUserDisplayName()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {isPremium ? '✨ Premium' : '🆓 Free'}
            </Typography>
          </Box>
        </Box>
        
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={onToggleDarkMode}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {darkMode ? <DarkMode sx={{ mr: 1, fontSize: '1rem' }} /> : <LightMode sx={{ mr: 1, fontSize: '1rem' }} />}
              <Typography variant="caption">
                {darkMode ? 'Dark' : 'Light'}
              </Typography>
            </Box>
          }
        />
      </Box>
    </Box>
  );

  const container = window !== undefined ? () => window.document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[1],
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getActiveRoute()}
          </Typography>

          {/* User menu */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="user-menu"
            aria-haspopup="true"
            onClick={handleUserMenuClick}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
              {getUserInitials()}
            </Avatar>
          </IconButton>
          
          <Menu
            id="user-menu"
            anchorEl={userMenuAnchor}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
          >
            <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profil
            </MenuItem>
            <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Einstellungen
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Abmelden
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Navigation drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="navigation"
      >
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              display: 'flex',
              flexDirection: 'column',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Toolbar /> {/* Spacer for app bar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;