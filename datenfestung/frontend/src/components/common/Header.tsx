import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Box,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  ExitToApp,
  Settings,
  Person,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
  onNotificationClick: () => void;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onNotificationClick,
  notificationCount = 0,
}) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Datenfestung
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={onNotificationClick}
            aria-label="notifications"
          >
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            aria-label="account"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user ? getUserInitials(user.firstName, user.lastName) : <AccountCircle />}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          PaperProps={{
            sx: {
              width: 200,
              mt: 1,
            },
          }}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2">
              {user ? `${user.firstName} ${user.lastName}` : 'Benutzer'}
            </Typography>
          </MenuItem>
          <MenuItem disabled>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleProfileMenuClose}>
            <Person sx={{ mr: 1 }} fontSize="small" />
            Profil
          </MenuItem>
          
          <MenuItem onClick={handleProfileMenuClose}>
            <Settings sx={{ mr: 1 }} fontSize="small" />
            Einstellungen
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout}>
            <ExitToApp sx={{ mr: 1 }} fontSize="small" />
            Abmelden
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};