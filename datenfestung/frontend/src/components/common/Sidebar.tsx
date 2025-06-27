import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Task as TaskIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Article,
  Shield,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 280;

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'processing-activities',
    label: 'Verarbeitungstätigkeiten',
    icon: <DescriptionIcon />,
    children: [
      {
        id: 'vvt-list',
        label: 'VVT Übersicht',
        icon: <Article />,
        path: '/processing-activities',
      },
      {
        id: 'vvt-new',
        label: 'Neue Tätigkeit',
        icon: <DescriptionIcon />,
        path: '/processing-activities/new',
      },
    ],
  },
  {
    id: 'toms',
    label: 'TOM Verwaltung',
    icon: <SecurityIcon />,
    children: [
      {
        id: 'toms-list',
        label: 'TOM Übersicht',
        icon: <Shield />,
        path: '/toms',
      },
      {
        id: 'toms-templates',
        label: 'Vorlagen',
        icon: <SecurityIcon />,
        path: '/toms/templates',
      },
    ],
  },
  {
    id: 'contracts',
    label: 'Vertragsmanagement',
    icon: <AssignmentIcon />,
    path: '/contracts',
  },
  {
    id: 'tasks',
    label: 'Aufgaben & Tickets',
    icon: <TaskIcon />,
    path: '/tasks',
  },
  {
    id: 'elearning',
    label: 'E-Learning',
    icon: <SchoolIcon />,
    children: [
      {
        id: 'courses',
        label: 'Schulungen',
        icon: <SchoolIcon />,
        path: '/elearning/courses',
      },
      {
        id: 'progress',
        label: 'Fortschritt',
        icon: <TaskIcon />,
        path: '/elearning/progress',
      },
    ],
  },
];

const adminMenuItems: MenuItem[] = [
  {
    id: 'users',
    label: 'Benutzerverwaltung',
    icon: <PeopleIcon />,
    path: '/admin/users',
  },
  {
    id: 'settings',
    label: 'Systemeinstellungen',
    icon: <SettingsIcon />,
    path: '/admin/settings',
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  open, 
  onClose, 
  userRole = 'user' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      setExpandedItems(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else if (item.path) {
      navigate(item.path);
      onClose();
    }
  };

  const isItemActive = (path: string) => {
    return location.pathname === path;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.path ? isItemActive(item.path) : false;

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ pl: level * 2 }}>
          <ListItemButton
            selected={isActive}
            onClick={() => handleItemClick(item)}
            sx={{
              minHeight: 48,
              borderRadius: 1,
              mx: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isActive ? 'inherit' : 'action.active',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 500 : 400,
              }}
            />
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="div" color="primary">
          Datenfestung
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => renderMenuItem(item))}
      </List>

      {(userRole === 'admin' || userRole === 'dpo') && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
            Administration
          </Typography>
          <List sx={{ pt: 0 }}>
            {adminMenuItems.map((item) => renderMenuItem(item))}
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};