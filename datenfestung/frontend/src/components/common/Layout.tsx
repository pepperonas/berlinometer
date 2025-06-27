import React, { useState } from 'react';
import { Box, CssBaseline, Fab, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount] = useState(3); // This would come from a notification context/hook
  
  const { user } = useAuth();

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNotificationClick = () => {
    // Handle notification panel opening
    console.log('Notifications clicked');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      <Header
        onMenuClick={handleDrawerToggle}
        onNotificationClick={handleNotificationClick}
        notificationCount={notificationCount}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={user?.role}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          pt: 8, // Account for AppBar height
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>

      {isMobile && (
        <Fab
          color="primary"
          aria-label="menu"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: (theme) => theme.zIndex.drawer + 2,
          }}
        >
          <MenuIcon />
        </Fab>
      )}
    </Box>
  );
};