import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Box
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  LocalBar as DrinksIcon,
  People as StaffIcon,
  AttachMoney as FinancesIcon,
  Inventory as InventoryIcon,
  LocalShipping as SuppliersIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  ShoppingBag as SalesIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Getränke', icon: <DrinksIcon />, path: '/drinks' },
  { text: 'Personal', icon: <StaffIcon />, path: '/staff' },
  { text: 'Verkäufe', icon: <SalesIcon />, path: '/sales' },
  { text: 'Finanzen', icon: <FinancesIcon />, path: '/finances' },
  { text: 'Inventar', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Lieferanten', icon: <SuppliersIcon />, path: '/suppliers' },
  { text: 'Berichte', icon: <ReportsIcon />, path: '/reports' },
];

const Sidebar = ({ open }) => {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : 72,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: (theme) => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 72,
          boxSizing: 'border-box',
          bgcolor: 'background.default',
          borderRight: '1px solid',
          borderColor: 'divider',
          overflowX: 'hidden',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Box sx={{ p: 3 }} />
      <Divider />

      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              my: 0.5,
              borderRadius: '8px',
              mx: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': {
                  bgcolor: 'primary.light',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.main',
                },
                '& .MuiListItemText-primary': {
                  color: 'primary.main',
                  fontWeight: 'bold',
                },
              },
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            {open && <ListItemText primary={item.text} />}
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}

      <Divider />
      <List>
        <ListItem 
          button 
          component={Link} 
          to="/settings"
          selected={location.pathname === '/settings'}
          sx={{
            my: 0.5,
            borderRadius: '8px',
            mx: 1,
          }}
        >
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          {open && <ListItemText primary="Einstellungen" />}
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;